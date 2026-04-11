<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
include "configCorreo.php";

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
    
    // Registrar en historial
    $historialId = registrarEnHistorial($enlace, [
        'modulo' => $modulo,
        'referencia_id' => $referencia_id,
        'destinatarios' => $destinatariosValidos,
        'asunto' => $asunto,
        'cuerpo' => $cuerpo,
        'adjuntos' => array_column($adjuntos, 'nombre'),
        'usuario' => $usuario
    ]);
    
    // Enviar correo usando método EXTERNO (sin SMTP directo)
    $resultadoEnvio = enviarCorreoExterno([
        'destinatarios' => $destinatariosValidos,
        'asunto' => $asunto,
        'cuerpo' => $cuerpo,
        'adjuntos' => $adjuntos
    ]);
    
    // Actualizar historial
    actualizarEstadoHistorial($enlace, $historialId, $resultadoEnvio['success'], $resultadoEnvio['message']);
    
    // Preparar respuesta
    $respuesta = [
        "success" => $resultadoEnvio['success'],
        "message" => $resultadoEnvio['message'],
        "historial_id" => $historialId,
        "destinatarios_enviados" => $destinatariosValidos,
        "destinatarios_invalidos" => $destinatariosInvalidos,
        "adjuntos_enviados" => $resultadoEnvio['adjuntos_enviados'] ?? 0
    ];
    
    if (!empty($destinatariosInvalidos)) {
        $respuesta["advertencia"] = "Algunos destinatarios no son válidos: " . implode(', ', $destinatariosInvalidos);
    }
    
    echo json_encode($respuesta);
    
} catch (Exception $e) {
    // Registrar error en historial si hay historialId
    if (isset($historialId)) {
        actualizarEstadoHistorial($enlace, $historialId, false, $e->getMessage());
    }
    
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$enlace->close();

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function registrarEnHistorial($enlace, $datos) {
    $sql = "INSERT INTO historial_correos (modulo, referencia_id, destinatarios, asunto, cuerpo, adjuntos, usuario, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";
    
    $stmt = $enlace->prepare($sql);
    $destinatariosJson = json_encode($datos['destinatarios']);
    $adjuntosJson = json_encode($datos['adjuntos']);
    $referencia_id = !empty($datos['referencia_id']) ? $datos['referencia_id'] : null;
    
    $stmt->bind_param(
        "sssssss",
        $datos['modulo'],
        $referencia_id,
        $destinatariosJson,
        $datos['asunto'],
        $datos['cuerpo'],
        $adjuntosJson,
        $datos['usuario']
    );
    
    if ($stmt->execute()) {
        $id = $stmt->insert_id;
        $stmt->close();
        return $id;
    } else {
        $stmt->close();
        throw new Exception("Error al registrar en historial: " . $enlace->error);
    }
}

function actualizarEstadoHistorial($enlace, $id, $exito, $mensaje = '') {
    $estado = $exito ? 'enviado' : 'error';
    $sql = "UPDATE historial_correos SET estado = ?, mensaje_error = ? WHERE id = ?";
    
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ssi", $estado, $mensaje, $id);
    
    if (!$stmt->execute()) {
        error_log("Error al actualizar historial: " . $stmt->error);
    }
    
    $stmt->close();
}

function enviarCorreoExterno($datos) {
    // Método 1: Intentar con mail() del sistema
    $resultadoMail = enviarConMailSistema($datos);
    if ($resultadoMail['success']) {
        return $resultadoMail;
    }
    
    // Método 2: Intentar con socket directo en puerto 25
    $resultadoSocket = enviarConSocketDirecto($datos);
    if ($resultadoSocket['success']) {
        return $resultadoSocket;
    }
    
    // Método 3: Usar servicio externo (SendGrid, etc.) - configurar si es necesario
    // return enviarConServicioExterno($datos);
    
    // Si todo falla, retornar error
    return [
        "success" => false,
        "message" => "No se pudo enviar el correo. Todos los métodos fallaron."
    ];
}

function enviarConMailSistema($datos) {
    // Configurar PHP para usar el servidor correcto
    $old_smtp = ini_get('SMTP');
    $old_port = ini_get('smtp_port');
    $old_from = ini_get('sendmail_from');
    
    // Usar localhost:25 (default) que debería usar el sendmail del sistema
    ini_set('SMTP', 'localhost');
    ini_set('smtp_port', '25');
    ini_set('sendmail_from', EMAIL_FROM);
    
    // Preparar mensaje MIME
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
        if (base64_decode($contenido, true) !== false) {
            $contenido = base64_decode($contenido);
        }
        
        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: " . ($adjunto['tipo'] ?? 'application/octet-stream') . "; name=\"" . $adjunto['nombre'] . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"" . $adjunto['nombre'] . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode($contenido)) . "\r\n";
        
        $adjuntosEnviados++;
    }
    
    $body .= "--" . $boundary . "--\r\n";
    
    $headersStr = implode("\r\n", $headers);
    
    // Enviar
    $enviados = 0;
    foreach ($datos['destinatarios'] as $destinatario) {
        if (@mail($destinatario, $asuntoCodificado, $body, $headersStr)) {
            $enviados++;
        }
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

function enviarConSocketDirecto($datos) {
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
        if (base64_decode($contenido, true) !== false) {
            $contenido = base64_decode($contenido);
        }
        
        $body .= "--" . $boundary . "\r\n";
        $body .= "Content-Type: " . ($adjunto['tipo'] ?? 'application/octet-stream') . "; name=\"" . $adjunto['nombre'] . "\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"" . $adjunto['nombre'] . "\"\r\n\r\n";
        $body .= chunk_split(base64_encode($contenido)) . "\r\n";
        
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
function enviarConServicioExterno($datos) {
    // Esta función requiere configuración adicional
    // Ejemplo con SendGrid (necesitas API key)
    
    $apiKey = ''; // Aquí iría tu API key de SendGrid
    if (empty($apiKey)) {
        return ["success" => false];
    }
    
    // Preparar datos para SendGrid
    $emailData = [
        'personalizations' => [[
            'to' => array_map(function($email) {
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
?>