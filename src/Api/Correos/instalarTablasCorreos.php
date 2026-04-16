<?php

/**
 * Script de instalación seguro para nuevas tablas de correos
 * Solo crea tablas que no existan - NO modifica nada existente
 * 
 * Uso: Ejecutar en navegador o terminal
 */

header("Content-Type: application/json");

// Incluir conexión a BD
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Error de conexión: " . $enlace->connect_error
    ]);
    exit;
}

try {
    $resultados = [];

    // 1. Crear tabla correos_cuentas_configuracion
    $sql1 = "CREATE TABLE IF NOT EXISTS `correos_cuentas_configuracion` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `nombre` varchar(100) NOT NULL COMMENT 'Nombre descriptivo de la cuenta',
      `email_remitente` varchar(255) NOT NULL UNIQUE COMMENT 'Email desde el que se enviarán',
      `servidor_smtp` varchar(255) NOT NULL COMMENT 'Servidor SMTP',
      `puerto` int(11) NOT NULL DEFAULT 587 COMMENT 'Puerto SMTP',
      `usuario_smtp` varchar(255) NOT NULL COMMENT 'Usuario para autenticación',
      `contrasena_smtp` longtext NOT NULL COMMENT 'Contraseña encriptada',
      `usar_tls` tinyint(1) DEFAULT 1,
      `usar_ssl` tinyint(1) DEFAULT 0,
      `predeterminada` tinyint(1) DEFAULT 0,
      `activa` tinyint(1) DEFAULT 1,
      `probada` tinyint(1) DEFAULT 0,
      `ultima_prueba` datetime DEFAULT NULL,
      `fecha_creacion` timestamp DEFAULT current_timestamp(),
      `fecha_actualizacion` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `email_remitente` (`email_remitente`),
      KEY `predeterminada` (`predeterminada`),
      KEY `activa` (`activa`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($enlace->query($sql1)) {
        $resultados['tabla_cuentas'] = [
            'success' => true,
            'message' => 'Tabla correos_cuentas_configuracion creada/verificada'
        ];
    } else {
        throw new Exception("Error creando tabla cuentas: " . $enlace->error);
    }

    // 2. Crear tabla correos_cuentas_modulos
    $sql2 = "CREATE TABLE IF NOT EXISTS `correos_cuentas_modulos` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `cuenta_id` int(11) NOT NULL,
      `modulo` varchar(50) NOT NULL COMMENT 'Módulo que usa esta cuenta',
      `fecha_asignacion` timestamp DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `cuenta_modulo` (`cuenta_id`, `modulo`),
      CONSTRAINT `fk_cuenta_id` FOREIGN KEY (`cuenta_id`) REFERENCES `correos_cuentas_configuracion` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($enlace->query($sql2)) {
        $resultados['tabla_modulos'] = [
            'success' => true,
            'message' => 'Tabla correos_cuentas_modulos creada/verificada'
        ];
    } else {
        throw new Exception("Error creando tabla módulos: " . $enlace->error);
    }

    // 3. Crear tabla opcional de log
    $sql3 = "CREATE TABLE IF NOT EXISTS `correos_envios_log` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `cuenta_id` int(11),
      `remitente` varchar(255) NOT NULL,
      `destinatarios` json,
      `asunto` varchar(255) NOT NULL,
      `modulo` varchar(50),
      `referencia_id` int(11),
      `estado` enum('enviado','error','pendiente') DEFAULT 'pendiente',
      `mensaje_error` longtext,
      `intento_numero` int(11) DEFAULT 1,
      `fecha_envio` timestamp DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `cuenta_id` (`cuenta_id`),
      KEY `referencia` (`modulo`, `referencia_id`),
      KEY `estado` (`estado`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($enlace->query($sql3)) {
        $resultados['tabla_log'] = [
            'success' => true,
            'message' => 'Tabla correos_envios_log creada/verificada'
        ];
    } else {
        // Log opcional, no es crítico si falla
        $resultados['tabla_log'] = [
            'success' => false,
            'message' => 'Tabla log no se pudo crear (opcional): ' . $enlace->error
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Instalación completada',
        'detalles' => $resultados,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error durante la instalación',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

$enlace->close();
