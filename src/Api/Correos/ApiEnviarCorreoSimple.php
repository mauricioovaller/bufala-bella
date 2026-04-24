<?php

/**
 * API SIMPLIFICADO para envío de correos - Lee de BD
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

// Conectar a BD
$enlace = null;
$rutas_posibles = [
    "/home/datenban/portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
    __DIR__ . "/../../../conexionBaseDatos/conexionbd.php",
];

foreach ($rutas_posibles as $ruta) {
    if (file_exists($ruta)) {
        include $ruta;
        break;
    }
}

if (!isset($enlace) || !$enlace || $enlace->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error de conexión a BD"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

try {
    // Validar datos
    if (empty($data['destinatarios']) || empty($data['asunto'])) {
        throw new Exception("Destinatarios y asunto requeridos");
    }

    $destinatarios = is_array($data['destinatarios']) ? $data['destinatarios'] : explode(',', $data['destinatarios']);
    $asunto = trim($data['asunto']);
    $cuerpo = $data['cuerpo'] ?? 'Mensaje de prueba';
    $adjuntos = $data['adjuntos'] ?? [];

    // OBTENER CUENTA DE BD - DIRECTAMENTE
    $sql = "SELECT email_remitente, nombre FROM correos_cuentas_configuracion 
            WHERE predeterminada = 1 AND activa = 1 LIMIT 1";
    $resultado = $enlace->query($sql);

    if (!$resultado) {
        throw new Exception("Error BD: " . $enlace->error);
    }

    if ($resultado->num_rows === 0) {
        throw new Exception("No hay cuenta predeterminada configurada en la tabla correos_cuentas_configuracion");
    }

    $fila = $resultado->fetch_assoc();
    $remitente = $fila['email_remitente'];
    $nombre_remitente = $fila['nombre'];

    error_log("✓ Enviando desde BD: " . $nombre_remitente . " <" . $remitente . ">");

    // Validar destinatarios
    $destinatariosValidos = [];
    foreach ($destinatarios as $dest) {
        $dest = trim($dest);
        if (filter_var($dest, FILTER_VALIDATE_EMAIL)) {
            $destinatariosValidos[] = $dest;
        }
    }

    if (empty($destinatariosValidos)) {
        throw new Exception("No hay destinatarios válidos");
    }

    // Intentar enviar con PHP mail() - el método más simple
    $boundary = md5(uniqid(time()));
    $asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';

    // Incluir todos los destinatarios en Reply-To: para que
    // al responder el correo se pueda responder a todas las cuentas seleccionadas.
    // NOTA: No agregar 'To:' aquí porque mail() ya lo establece desde el primer
    // parámetro — si se duplica en headers aparece dos veces en el correo.
    $toHeader = implode(', ', $destinatariosValidos);

    $headers = [
        'From: ' . $nombre_remitente . ' <' . $remitente . '>',
        'Reply-To: ' . $toHeader,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"'
    ];

    $body = "This is a multi-part message in MIME format.\r\n\r\n";
    $body .= "--" . $boundary . "\r\n";
    $body .= "Content-Type: text/plain; charset=\"UTF-8\"\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $cuerpo . "\r\n\r\n";

    $adjuntosEnviados = 0;
    foreach ($adjuntos as $adjunto) {
        if (!isset($adjunto['contenido']) || !isset($adjunto['nombre'])) {
            continue;
        }

        $contenido = $adjunto['contenido'];
        $sizeMB = strlen($contenido) / (1024 * 1024);

        if ($sizeMB > 10) {
            continue; // Saltar si es muy grande
        }

        if (base64_decode($contenido, true) !== false) {
            $decodificado = base64_decode($contenido);
            if ($decodificado !== false) {
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

    // Enviar UN SOLO correo a todos los destinatarios juntos
    $toStr = implode(', ', $destinatariosValidos);
    $enviados = 0;
    if (@mail($toStr, $asuntoCodificado, $body, $headersStr)) {
        $enviados = count($destinatariosValidos);
    }

    $enlace->close();

    if ($enviados > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Correo enviado a " . $enviados . " destinatario(s)",
            "cuenta_usada" => $nombre_remitente,
            "remitente" => $remitente
        ]);
    } else {
        throw new Exception("No se pudo enviar a ningún destinatario");
    }
} catch (Exception $e) {
    if (isset($enlace)) {
        $enlace->close();
    }
    http_response_code(500);
    error_log("❌ Error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
