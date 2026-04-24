<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

// Configuración de error handlers y error logging
ini_set('display_errors', 0);
error_reporting(E_ALL);
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    error_log("[$errno] $errstr in $errfile:$errline");
    return true;
});

// Intentar incluir archivo de conexión desde múltiples rutas
$ruta_conexion = null;
$rutas_posibles = [
    $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
    dirname(__DIR__) . "/../../../DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
    __DIR__ . "/../../../DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php"
];

foreach ($rutas_posibles as $ruta) {
    if (file_exists($ruta)) {
        $ruta_conexion = $ruta;
        break;
    }
}

if (!$ruta_conexion) {
    echo json_encode(["success" => false, "message" => "No se encontró archivo de conexión a BD. Rutas buscadas: " . implode(", ", $rutas_posibles)]);
    exit;
}

include $ruta_conexion;
include __DIR__ . "/configCorreo.php";

// Validar que tenemos una conexión válida
if (!isset($enlace) || !$enlace) {
    echo json_encode(["success" => false, "message" => "Error: No se pudo establecer conexión a BD"]);
    exit;
}

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Obtener datos de la solicitud
$data = json_decode(file_get_contents("php://input"), true);

try {
    // Validar datos básicos
    if (empty($data['destinatarios']) || empty($data['asunto'])) {
        throw new Exception("Destinatarios y asunto son requeridos");
    }

    // Obtener cuenta SMTP a usar (predeterminada o especificada)
    error_log("Obteniendo cuenta SMTP con cuenta_id: " . ($data['cuenta_id'] ?? 'NULL'));
    $cuentaSmtp = obtenerCuentaSMTP($enlace, $data['cuenta_id'] ?? null);
    if (!$cuentaSmtp) {
        throw new Exception("No hay cuenta SMTP configurada para enviar correos");
    }
    error_log("Cuenta obtenida: " . $cuentaSmtp['nombre']);

    // Preparar datos
    $destinatarios = is_array($data['destinatarios']) ? $data['destinatarios'] : explode(',', $data['destinatarios']);
    $asunto = trim($data['asunto']);
    $cuerpo = $data['cuerpo'] ?? '';
    $adjuntos = $data['adjuntos'] ?? [];
    $modulo = $data['modulo'] ?? 'facturacion';
    $referencia_id = $data['referencia_id'] ?? null;
    $usuario = $data['usuario'] ?? 'Sistema';

    // Validar destinatarios
    $destinatariosValidos = [];
    $destinatariosInvalidos = [];

    foreach ($destinatarios as $destinatario) {
        $destinatario = trim($destinatario);
        if (filter_var($destinatario, FILTER_VALIDATE_EMAIL)) {
            $destinatariosValidos[] = $destinatario;
        } else {
            $destinatariosInvalidos[] = $destinatario;
        }
    }

    if (empty($destinatariosValidos)) {
        throw new Exception("No hay destinatarios válidos");
    }

    // Enviar correo usando la cuenta SMTP configurada
    $resultadoEnvio = enviarCorreoExterno([
        'cuenta' => $cuentaSmtp,
        'destinatarios' => $destinatariosValidos,
        'asunto' => $asunto,
        'cuerpo' => $cuerpo,
        'adjuntos' => $adjuntos
    ]);

    // Preparar respuesta
    $respuesta = [
        "success" => $resultadoEnvio['success'],
        "message" => $resultadoEnvio['message'],
        "destinatarios_enviados" => $destinatariosValidos,
        "destinatarios_invalidos" => $destinatariosInvalidos,
        "adjuntos_enviados" => $resultadoEnvio['adjuntos_enviados'] ?? 0,
        "cuenta_usada" => $cuentaSmtp['nombre']
    ];

    if (!empty($destinatariosInvalidos)) {
        $respuesta["advertencia"] = "Algunos destinatarios no son válidos: " . implode(', ', $destinatariosInvalidos);
    }

    echo json_encode($respuesta);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$enlace->close();

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtener cuenta SMTP a usar para enviar correos
 * @param $enlace Conexión a BD
 * @param $cuentaId ID de la cuenta (opcional, usa predeterminada si no se especifica)
 * @return array Datos de la cuenta o false si no existe
 */
function obtenerCuentaSMTP($enlace, $cuentaId = null)
{
    try {
        // Construir consulta basada en parámetros
        if ($cuentaId) {
            $sql = "SELECT id, nombre, email_remitente, servidor_smtp, puerto, usuario_smtp, contrasena_smtp, usar_tls, usar_ssl 
                    FROM correos_cuentas_configuracion 
                    WHERE id = ? AND activa = 1 LIMIT 1";
        } else {
            $sql = "SELECT id, nombre, email_remitente, servidor_smtp, puerto, usuario_smtp, contrasena_smtp, usar_tls, usar_ssl 
                    FROM correos_cuentas_configuracion 
                    WHERE predeterminada = 1 AND activa = 1 LIMIT 1";
        }

        $stmt = $enlace->prepare($sql);
        if (!$stmt) {
            error_log("Error preparando consulta: " . $enlace->error);
            return false;
        }

        // Bind parámetro si es necesario
        if ($cuentaId) {
            $stmt->bind_param("i", $cuentaId);
        }

        if (!$stmt->execute()) {
            error_log("Error ejecutando consulta: " . $stmt->error);
            $stmt->close();
            return false;
        }

        // Usar bind_result en lugar de get_result (compatible con todas las versiones de PHP)
        $id = $nombre = $email_remitente = $servidor_smtp = $puerto = $usuario_smtp = $contrasena_smtp = $usar_tls = $usar_ssl = null;

        if (!$stmt->bind_result($id, $nombre, $email_remitente, $servidor_smtp, $puerto, $usuario_smtp, $contrasena_smtp, $usar_tls, $usar_ssl)) {
            error_log("Error en bind_result: " . $stmt->error);
            $stmt->close();
            return false;
        }

        if (!$stmt->fetch()) {
            error_log("No se encontró cuenta SMTP");
            $stmt->close();
            return false;
        }

        $stmt->close();

        // Construir array con los datos
        $fila = [
            'id' => $id,
            'nombre' => $nombre,
            'email_remitente' => $email_remitente,
            'servidor_smtp' => $servidor_smtp,
            'puerto' => $puerto,
            'usuario_smtp' => $usuario_smtp,
            'contrasena_smtp' => $contrasena_smtp,
            'usar_tls' => $usar_tls,
            'usar_ssl' => $usar_ssl
        ];

        // Validar datos
        if (empty($fila['contrasena_smtp'])) {
            error_log("Contraseña vacía para cuenta: " . $fila['nombre']);
            return false;
        }

        // Desencriptar contraseña
        $contrasena_desencriptada = desencriptarContrasena($fila['contrasena_smtp']);

        return [
            'id' => intval($fila['id']),
            'nombre' => $fila['nombre'],
            'email_remitente' => $fila['email_remitente'],
            'servidor_smtp' => $fila['servidor_smtp'],
            'puerto' => intval($fila['puerto']),
            'usuario_smtp' => $fila['usuario_smtp'],
            'contrasena_smtp' => $contrasena_desencriptada,
            'usar_tls' => intval($fila['usar_tls']),
            'usar_ssl' => intval($fila['usar_ssl'])
        ];
    } catch (Exception $e) {
        error_log("Error en obtenerCuentaSMTP: " . $e->getMessage());
        return false;
    }
}

/**
 * Desencriptar contraseña SMTP
 */
function desencriptarContrasena($contrasena_encriptada)
{
    try {
        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_key = hash('sha256', 'bufala_bella_secret_key', true);

        $encrypted = base64_decode($contrasena_encriptada);
        $encryption_iv = substr($encrypted, 0, $iv_length);
        $encrypted = substr($encrypted, $iv_length);

        $decrypted = openssl_decrypt(
            $encrypted,
            $ciphering,
            $encryption_key,
            $options,
            $encryption_iv
        );

        return $decrypted !== false ? $decrypted : $contrasena_encriptada;
    } catch (Exception $e) {
        error_log("Error desencriptando contraseña: " . $e->getMessage());
        return $contrasena_encriptada;
    }
}

function enviarCorreoExterno($datos)
{
    // Si no hay cuenta, error
    if (!isset($datos['cuenta'])) {
        return [
            "success" => false,
            "message" => "No se especificó cuenta SMTP"
        ];
    }

    // Método 1: Intentar con socket SMTP (más confiable con autenticación)
    $resultadoSocket = enviarConSocketSMTP($datos);
    if ($resultadoSocket['success']) {
        return $resultadoSocket;
    }

    // Método 2: Intentar con mail() del sistema
    $resultadoMail = enviarConMailSistema($datos);
    if ($resultadoMail['success']) {
        return $resultadoMail;
    }

    // Si todo falla, retornar error
    return [
        "success" => false,
        "message" => "No se pudo enviar el correo. Todos los métodos fallaron."
    ];
}

/**
 * Enviar con conexión SMTP directa (TLS/SSL)
 */
function enviarConSocketSMTP($datos)
{
    if (!isset($datos['cuenta'])) {
        return ["success" => false];
    }

    $cuenta = $datos['cuenta'];
    $servidor = $cuenta['servidor_smtp'];
    $puerto = intval($cuenta['puerto']);
    $usuario = $cuenta['usuario_smtp'];
    $contrasena = $cuenta['contrasena_smtp'];
    $usar_tls = $cuenta['usar_tls'];
    $usar_ssl = $cuenta['usar_ssl'];
    $remitente = $cuenta['email_remitente'];
    $nombre_remitente = $cuenta['nombre'] ?? 'Sistema';

    try {
        // Conectar al servidor
        $socket = @fsockopen($servidor, $puerto, $errno, $errstr, 30);

        if (!$socket) {
            error_log("No se pudo conectar a $servidor:$puerto - $errstr ($errno)");
            return ["success" => false];
        }

        // Leer respuesta inicial
        fgets($socket);

        // EHLO
        fputs($socket, "EHLO localhost\r\n");
        while ($linea = fgets($socket)) {
            if (substr($linea, 3, 1) != '-') break;
        }

        // STARTTLS si se requiere
        if ($usar_tls || $usar_ssl) {
            fputs($socket, "STARTTLS\r\n");
            while ($linea = fgets($socket)) {
                if (substr($linea, 3, 1) != '-') break;
            }
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

            // EHLO de nuevo después de STARTTLS
            fputs($socket, "EHLO localhost\r\n");
            while ($linea = fgets($socket)) {
                if (substr($linea, 3, 1) != '-') break;
            }
        }

        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        fgets($socket);

        fputs($socket, base64_encode($usuario) . "\r\n");
        fgets($socket);

        fputs($socket, base64_encode($contrasena) . "\r\n");
        $respuesta = fgets($socket);

        if (strpos($respuesta, '235') === false) {
            fclose($socket);
            error_log("Autenticación SMTP fallida");
            return ["success" => false];
        }

        // Preparar mensaje
        $boundary = md5(uniqid(time()));

        // Construir header To: y Reply-To: con todos los destinatarios
        // para que el receptor pueda responder a todos
        $toHeader = implode(', ', $datos['destinatarios']);

        $headers = [
            'From: ' . $nombre_remitente . ' <' . $remitente . '>',
            'To: ' . $toHeader,
            'Reply-To: ' . $toHeader,
            'MIME-Version: 1.0',
            'Content-Type: multipart/mixed; boundary="' . $boundary . '"'
        ];

        $body = "This is a multi-part message in MIME format.\r\n\r\n";
        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $datos['cuerpo'] . "\r\n\r\n";

        $adjuntosEnviados = 0;
        foreach ($datos['adjuntos'] as $adjunto) {
            if (!isset($adjunto['contenido']) || !isset($adjunto['nombre'])) {
                continue;
            }

            $contenido = $adjunto['contenido'];

            // Validar que el contenido no sea demasiado grande
            $sizeMB = strlen($contenido) / (1024 * 1024);
            if ($sizeMB > 10) {
                error_log("Adjunto muy grande: " . $adjunto['nombre'] . " (" . $sizeMB . "MB)");
                continue; // Saltar arquivos muy grandes
            }

            // Decodificar si está en base64
            if (base64_decode($contenido, true) !== false) {
                $decodificado = base64_decode($contenido);
                if ($decodificado !== false && strlen($decodificado) < 10 * 1024 * 1024) { // Max 10MB decodificado
                    $contenido = $decodificado;
                }
            }

            $body .= "--" . $boundary . "\r\n";
            $body .= "Content-Type: " . ($adjunto['tipo'] ?? 'application/octet-stream') . "; name=\"" . $adjunto['nombre'] . "\"\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n";
            $body .= "Content-Disposition: attachment; filename=\"" . $adjunto['nombre'] . "\"\r\n\r\n";
            $body .= chunk_split(base64_encode($contenido), 76) . "\r\n";

            $adjuntosEnviados++;
        }

        $body .= "--" . $boundary . "--\r\n";

        // Enviar UN SOLO correo a todos los destinatarios
        // MAIL FROM (una sola vez)
        fputs($socket, "MAIL FROM: <" . $remitente . ">\r\n");
        fgets($socket);

        // RCPT TO para cada destinatario (todos en la misma transacción)
        $rcptAceptados = 0;
        foreach ($datos['destinatarios'] as $destinatario) {
            fputs($socket, "RCPT TO: <" . $destinatario . ">\r\n");
            $rcptResp = fgets($socket);
            if (strpos($rcptResp, '250') !== false || strpos($rcptResp, '251') !== false) {
                $rcptAceptados++;
            }
        }

        // DATA (una sola vez para todos los destinatarios aceptados)
        $enviados = 0;
        if ($rcptAceptados > 0) {
            fputs($socket, "DATA\r\n");
            fgets($socket);

            // Crear headers
            $headersStr = implode("\r\n", $headers) . "\r\n";
            $asuntoCodificado = '=?UTF-8?B?' . base64_encode($datos['asunto']) . '?=';

            // Enviar mensaje único
            fputs($socket, "Subject: " . $asuntoCodificado . "\r\n");
            fputs($socket, $headersStr . "\r\n");
            fputs($socket, $body);
            fputs($socket, "\r\n.\r\n");

            $respuesta = fgets($socket);
            if (strpos($respuesta, '250') !== false) {
                $enviados = $rcptAceptados;
            }
        }

        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);

        if ($enviados > 0) {
            return [
                "success" => true,
                "message" => "Correo enviado (SMTP) a " . $enviados . " destinatario(s) con " . $adjuntosEnviados . " adjunto(s)",
                "adjuntos_enviados" => $adjuntosEnviados
            ];
        }

        return ["success" => false];
    } catch (Exception $e) {
        error_log("Error en enviarConSocketSMTP: " . $e->getMessage());
        return ["success" => false];
    }
}

function enviarConMailSistema($datos)
{
    if (!isset($datos['cuenta'])) {
        return ["success" => false];
    }

    $cuenta = $datos['cuenta'];
    $remitente = $cuenta['email_remitente'];
    $nombre_remitente = $cuenta['nombre'] ?? 'Sistema';

    // Configurar PHP para usar el servidor correcto
    $old_smtp = ini_get('SMTP');
    $old_port = ini_get('smtp_port');
    $old_from = ini_get('sendmail_from');

    // Usar servidor de la cuenta
    ini_set('SMTP', $cuenta['servidor_smtp']);
    ini_set('smtp_port', (string)$cuenta['puerto']);
    ini_set('sendmail_from', $remitente);

    // Preparar mensaje MIME
    $boundary = md5(uniqid(time()));
    $asuntoCodificado = '=?UTF-8?B?' . base64_encode($datos['asunto']) . '?=';

    // Construir header To: y Reply-To: con todos los destinatarios
    $toHeader = implode(', ', $datos['destinatarios']);

    $headers = [
        'From: ' . $nombre_remitente . ' <' . $remitente . '>',
        'To: ' . $toHeader,
        'Reply-To: ' . $toHeader,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
        'X-Mailer: PHP/' . phpversion()
    ];

    $body = "This is a multi-part message in MIME format.\r\n\r\n";
    $body .= "--" . $boundary . "\r\n";
    $body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $datos['cuerpo'] . "\r\n\r\n";

    $adjuntosEnviados = 0;
    foreach ($datos['adjuntos'] as $adjunto) {
        if (!isset($adjunto['contenido']) || !isset($adjunto['nombre'])) {
            continue;
        }

        $contenido = $adjunto['contenido'];

        // Validar que el contenido no sea demasiado grande
        $sizeMB = strlen($contenido) / (1024 * 1024);
        if ($sizeMB > 10) {
            error_log("Adjunto muy grande en mail(): " . $adjunto['nombre'] . " (" . $sizeMB . "MB)");
            continue;
        }

        if (base64_decode($contenido, true) !== false) {
            $decodificado = base64_decode($contenido);
            if ($decodificado !== false && strlen($decodificado) < 10 * 1024 * 1024) {
                $contenido = $decodificado;
            }
        }

        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: " . ($adjunto['tipo'] ?? 'application/octet-stream') . "; name=\"" . $adjunto['nombre'] . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"" . $adjunto['nombre'] . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode($contenido), 76) . "\r\n";

        $adjuntosEnviados++;
    }

    $body .= "--" . $boundary . "--\r\n";

    $headersStr = implode("\r\n", $headers);

    // Enviar UN SOLO correo a todos los destinatarios
    $toStr = implode(', ', $datos['destinatarios']);
    $enviados = 0;
    if (@mail($toStr, $asuntoCodificado, $body, $headersStr)) {
        $enviados = count($datos['destinatarios']);
    }

    // Restaurar configuración
    ini_set('SMTP', $old_smtp);
    ini_set('smtp_port', $old_port);
    ini_set('sendmail_from', $old_from);

    if ($enviados > 0) {
        return [
            "success" => true,
            "message" => "Correo enviado (sistema) a " . $enviados . " destinatario(s) con " . $adjuntosEnviados . " adjunto(s)",
            "adjuntos_enviados" => $adjuntosEnviados
        ];
    }

    return ["success" => false];
}

function enviarConSocketDirecto($datos)
{
    // Conectar al servidor SMTP en puerto 25 (sin autenticación)
    $host = 'localhost'; // Servidor local
    $port = 25;
    $from = EMAIL_FROM;

    $socket = @fsockopen($host, $port, $errno, $errstr, 10);

    if (!$socket) {
        // Intentar con el host del config
        $host = defined('SMTP_HOST') ? SMTP_HOST : 'localhost';
        $socket = @fsockopen($host, $port, $errno, $errstr, 10);

        if (!$socket) {
            return ["success" => false];
        }
    }

    // Preparar mensaje
    $boundary = md5(uniqid(time()));
    $asuntoCodificado = '=?UTF-8?B?' . base64_encode($datos['asunto']) . '?=';

    $headers = [
        'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM . '>',
        'Reply-To: ' . EMAIL_FROM,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
        'X-Mailer: PHP/' . phpversion()
    ];

    $body = "This is a multi-part message in MIME format.\r\n\r\n";
    $body .= "--" . $boundary . "\r\n";
    $body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $datos['cuerpo'] . "\r\n\r\n";

    $adjuntosEnviados = 0;
    foreach ($datos['adjuntos'] as $adjunto) {
        if (!isset($adjunto['contenido']) || !isset($adjunto['nombre'])) {
            continue;
        }

        $contenido = $adjunto['contenido'];

        // Validar que el contenido no sea demasiado grande
        $sizeMB = strlen($contenido) / (1024 * 1024);
        if ($sizeMB > 10) {
            error_log("Adjunto muy grande en socket directo: " . $adjunto['nombre'] . " (" . $sizeMB . "MB)");
            continue;
        }

        if (base64_decode($contenido, true) !== false) {
            $decodificado = base64_decode($contenido);
            if ($decodificado !== false && strlen($decodificado) < 10 * 1024 * 1024) {
                $contenido = $decodificado;
            }
        }

        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: " . ($adjunto['tipo'] ?? 'application/octet-stream') . "; name=\"" . $adjunto['nombre'] . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"" . $adjunto['nombre'] . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode($contenido), 76) . "\r\n";

        $adjuntosEnviados++;
    }

    $body .= "--" . $boundary . "--\r\n";

    $message = "To: " . implode(", ", $datos['destinatarios']) . "\r\n";
    $message .= "Subject: " . $asuntoCodificado . "\r\n";
    $message .= implode("\r\n", $headers) . "\r\n\r\n";
    $message .= $body;

    // Protocolo SMTP simple
    fgets($socket, 4096); // Banner

    fputs($socket, "HELO " . gethostname() . "\r\n");
    fgets($socket, 4096);

    fputs($socket, "MAIL FROM: <$from>\r\n");
    fgets($socket, 4096);

    foreach ($datos['destinatarios'] as $recipient) {
        fputs($socket, "RCPT TO: <$recipient>\r\n");
        fgets($socket, 4096);
    }

    fputs($socket, "DATA\r\n");
    fgets($socket, 4096);

    fputs($socket, $message . "\r\n.\r\n");
    fgets($socket, 4096);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return [
        "success" => true,
        "message" => "Correo enviado (socket directo) a " . count($datos['destinatarios']) . " destinatario(s) con " . $adjuntosEnviados . " adjunto(s)",
        "adjuntos_enviados" => $adjuntosEnviados
    ];
}

// Función para usar servicio externo (ejemplo: SendGrid)
function enviarConServicioExterno($datos)
{
    // Esta función requiere configuración adicional
    // Ejemplo con SendGrid (necesitas API key)

    $apiKey = ''; // Aquí iría tu API key de SendGrid
    if (empty($apiKey)) {
        return ["success" => false];
    }

    // Preparar datos para SendGrid
    $emailData = [
        'personalizations' => [[
            'to' => array_map(function ($email) {
                return ['email' => $email];
            }, $datos['destinatarios'])
        ]],
        'from' => [
            'email' => EMAIL_FROM,
            'name' => EMAIL_FROM_NAME
        ],
        'subject' => $datos['asunto'],
        'content' => [[
            'type' => 'text/plain',
            'value' => $datos['cuerpo']
        ]]
    ];

    // Agregar adjuntos
    $attachments = [];
    foreach ($datos['adjuntos'] as $adjunto) {
        if (!isset($adjunto['contenido']) || !isset($adjunto['nombre'])) {
            continue;
        }

        $contenido = $adjunto['contenido'];
        if (base64_decode($contenido, true) !== false) {
            $contenido = base64_decode($contenido);
        }

        $attachments[] = [
            'content' => base64_encode($contenido),
            'filename' => $adjunto['nombre'],
            'type' => $adjunto['tipo'] ?? 'application/octet-stream',
            'disposition' => 'attachment'
        ];
    }

    if (!empty($attachments)) {
        $emailData['attachments'] = $attachments;
    }

    // Enviar a SendGrid
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.sendgrid.com/v3/mail/send');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        return [
            "success" => true,
            "message" => "Correo enviado (SendGrid) a " . count($datos['destinatarios']) . " destinatario(s) con " . count($attachments) . " adjunto(s)",
            "adjuntos_enviados" => count($attachments)
        ];
    }

    return ["success" => false];
}
