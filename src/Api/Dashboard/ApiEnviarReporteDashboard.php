<?php

/**
 * ApiEnviarReporteDashboard.php
 * Recibe el PDF del dashboard en base64 y lo envía por correo
 * a los destinatarios indicados.
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

// Conexión a BD
$enlace = null;
$rutas_posibles = [
    "/home/datenban/portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
    __DIR__ . "/../../../conexionBaseDatos/conexionbd.php",
    $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
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

$enlace->set_charset("utf8mb4");

$data = json_decode(file_get_contents("php://input"), true);

try {
    // ── Validar entrada ──────────────────────────────────────────────────────
    if (empty($data['destinatarios'])) {
        throw new Exception("Se requiere al menos un destinatario");
    }
    if (empty($data['pdfBase64'])) {
        throw new Exception("No se recibió el archivo PDF");
    }

    $destinatarios = is_array($data['destinatarios'])
        ? $data['destinatarios']
        : explode(',', $data['destinatarios']);

    $asunto       = trim($data['asunto']      ?? 'Reporte Dashboard Dibufala');
    $fechaInicio  = trim($data['fechaInicio'] ?? '');
    $fechaFin     = trim($data['fechaFin']    ?? '');
    $pdfBase64    = $data['pdfBase64'];

    // ── Obtener cuenta remitente de la BD ────────────────────────────────────
    $sql = "SELECT email_remitente, nombre
            FROM correos_cuentas_configuracion
            WHERE predeterminada = 1 AND activa = 1
            LIMIT 1";
    $res = $enlace->query($sql);
    if (!$res || $res->num_rows === 0) {
        throw new Exception("No hay cuenta de correo predeterminada configurada");
    }
    $cuenta          = $res->fetch_assoc();
    $remitente       = $cuenta['email_remitente'];
    $nombreRemitente = $cuenta['nombre'];

    // ── Validar destinatarios ────────────────────────────────────────────────
    $destinatariosValidos = [];
    foreach ($destinatarios as $dest) {
        $dest = trim($dest);
        if (filter_var($dest, FILTER_VALIDATE_EMAIL)) {
            $destinatariosValidos[] = $dest;
        }
    }
    if (empty($destinatariosValidos)) {
        throw new Exception("No hay destinatarios con formato de correo válido");
    }

    // ── Verificar tamaño del PDF (máx 10 MB) ─────────────────────────────────
    $pdfBytes = base64_decode($pdfBase64, true);
    if ($pdfBytes === false) {
        throw new Exception("El PDF recibido no tiene formato base64 válido");
    }
    $sizeMB = strlen($pdfBytes) / (1024 * 1024);
    if ($sizeMB > 10) {
        throw new Exception("El PDF supera el tamaño máximo permitido (10 MB)");
    }

    // ── Construir el cuerpo HTML del correo ──────────────────────────────────
    $periodoTexto = ($fechaInicio && $fechaFin)
        ? "Período: {$fechaInicio} al {$fechaFin}"
        : "Período: no especificado";

    $fechaGeneracion = date('d/m/Y H:i');

    $cuerpoHTML = "
    <!DOCTYPE html>
    <html lang='es'>
    <head><meta charset='UTF-8'></head>
    <body style='font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:20px;'>
        <div style='max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
            <div style='background:#1e3a8a; padding:24px 32px;'>
                <h1 style='color:#fff; margin:0; font-size:22px;'>📊 Reporte Dashboard</h1>
                <p style='color:#93c5fd; margin:6px 0 0; font-size:14px;'>Dibufala - Sistema de Gestión</p>
            </div>
            <div style='padding:28px 32px;'>
                <p style='color:#374151; font-size:15px; margin:0 0 16px;'>
                    Adjunto encontrará el reporte del dashboard generado el <strong>{$fechaGeneracion}</strong>.
                </p>
                <div style='background:#f0f4ff; border-left:4px solid #3b82f6; border-radius:4px; padding:12px 16px; margin-bottom:20px;'>
                    <p style='margin:0; color:#1e3a8a; font-size:14px;'><strong>{$periodoTexto}</strong></p>
                </div>
                <p style='color:#6b7280; font-size:13px; margin:0;'>
                    El PDF adjunto contiene una captura completa del dashboard incluyendo KPIs,
                    gráficas de ventas y costos de transporte.
                </p>
            </div>
            <div style='background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;'>
                <p style='color:#9ca3af; font-size:12px; margin:0;'>
                    Este correo fue generado automáticamente desde el sistema de gestión Dibufala.
                </p>
            </div>
        </div>
    </body>
    </html>";

    // ── Armar el mensaje MIME con adjunto ────────────────────────────────────
    $boundary        = md5(uniqid(time()));
    $asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
    $nombreArchivo   = 'Reporte_Dashboard_' . date('Y-m-d') . '.pdf';

    $headers  = "From: {$nombreRemitente} <{$remitente}>\r\n";
    $headers .= "Reply-To: {$remitente}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"";

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=\"UTF-8\"\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $cuerpoHTML . "\r\n\r\n";

    // Adjunto PDF
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: application/pdf; name=\"{$nombreArchivo}\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"{$nombreArchivo}\"\r\n\r\n";
    $body .= chunk_split(base64_encode($pdfBytes), 76) . "\r\n";
    $body .= "--{$boundary}--\r\n";

    // ── Enviar a cada destinatario ───────────────────────────────────────────
    $enviados = 0;
    foreach ($destinatariosValidos as $dest) {
        if (@mail($dest, $asuntoCodificado, $body, $headers)) {
            $enviados++;
        }
    }

    if ($enviados === 0) {
        throw new Exception("No se pudo enviar el correo a ningún destinatario");
    }

    // ── Registrar en historial si la tabla existe ────────────────────────────
    $tablaHistorial = $enlace->query("SHOW TABLES LIKE 'correos_enviados'");
    if ($tablaHistorial && $tablaHistorial->num_rows > 0) {
        $destinatariosJson = json_encode(
            array_map(fn($e) => ["email" => $e, "nombre" => $e], $destinatariosValidos)
        );
        $adjuntosJson = json_encode([["nombre" => $nombreArchivo, "tipo" => "application/pdf"]]);
        $cantDest = count($destinatariosValidos);
        $stmt = $enlace->prepare(
            "INSERT INTO correos_enviados
             (modulo, referencia_numero, destinatarios_lista, destinatarios_count,
              asunto, adjuntos_lista, adjuntos_count, estado, fecha_envio)
             VALUES ('dashboard', ?, ?, ?, ?, ?, 1, 'enviado', NOW())"
        );
        if ($stmt) {
            $stmt->bind_param("ssiss", $periodoTexto, $destinatariosJson, $cantDest, $asunto, $adjuntosJson);
            $stmt->execute();
            $stmt->close();
        }
    }

    $enlace->close();

    echo json_encode([
        "success"  => true,
        "message"  => "Reporte enviado correctamente a {$enviados} destinatario(s)",
        "enviados" => $enviados,
    ]);
} catch (Exception $e) {
    if (isset($enlace) && $enlace) $enlace->close();
    error_log("❌ ApiEnviarReporteDashboard: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
