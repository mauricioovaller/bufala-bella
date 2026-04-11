<?php
// Configuración SMTP para envío de correos
// Datos del servidor: mail.datenbankensoluciones.com.co

// Configuración SMTP
// Para servidor local (recomendado) - usa el sendmail del sistema
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 25);
define('SMTP_USER', 'contacto@datenbankensoluciones.com.co');
define('SMTP_PASS', '1144Dijpptfq*');
define('SMTP_SECURE', ''); // Vacío para puerto 25 (sin SSL/TLS)

// Configuración alternativa para servidor externo (si es necesario)
define('SMTP_HOST_EXTERNO', 'mail.datenbankensoluciones.com.co');
define('SMTP_PORT_EXTERNO', 587);
define('SMTP_SECURE_EXTERNO', 'tls');

// Configuración del remitente
define('EMAIL_FROM', 'contacto@datenbankensoluciones.com.co');
define('EMAIL_FROM_NAME', 'Sistema de Facturación Bufala Bella');

// Configuración de codificación
define('EMAIL_CHARSET', 'UTF-8');

// Configuración general
define('MAX_ATTACHMENT_SIZE', 10485760); // 10MB en bytes
define('MAX_RECIPIENTS', 20);
define('ENABLE_LOGGING', true);

// Validar que la configuración esté completa
function validarConfiguracionCorreo() {
    $configs = [
        'SMTP_HOST' => SMTP_HOST,
        'SMTP_PORT' => SMTP_PORT,
        'SMTP_USER' => SMTP_USER,
        'SMTP_PASS' => SMTP_PASS,
        'EMAIL_FROM' => EMAIL_FROM
    ];
    
    foreach ($configs as $key => $value) {
        if (empty($value)) {
            return ['success' => false, 'message' => "Configuración incompleta: $key"];
        }
    }
    
    return ['success' => true, 'message' => 'Configuración válida'];
}

// Función para obtener configuración segura (oculta contraseña en logs)
function getConfigSegura() {
    return [
        'host' => SMTP_HOST,
        'port' => SMTP_PORT,
        'user' => SMTP_USER,
        'from' => EMAIL_FROM,
        'from_name' => EMAIL_FROM_NAME,
        'max_size' => MAX_ATTACHMENT_SIZE,
        'max_recipients' => MAX_RECIPIENTS
    ];
}
?>