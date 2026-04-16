-- ============================================
-- SCRIPT ALTERNATIVO: Limpiar e Instalar Tablas
-- Usa esto si tienes errores de índices duplicados
-- ============================================

-- PASO 1: Verificar si la tabla existe con índice duplicado y limpiarlo
-- ============================================

-- Intentar eliminar el índice problemático si existe
ALTER TABLE `correos_cuentas_configuracion` DROP INDEX `email_remitente` IF EXISTS;

-- ============================================
-- PASO 2: Recrear tabla si es necesario (OPCIÓN SEGURA)
-- ============================================

-- Si aún tienes problemas, ejecuta PRIMERO estas líneas para eliminar tablas antiguas:
-- DROP TABLE IF EXISTS `correos_envios_log`;
-- DROP TABLE IF EXISTS `correos_cuentas_modulos`;
-- DROP TABLE IF EXISTS `correos_cuentas_configuracion`;

-- Luego ejecuta el SQL principal (crear_tabla_correos_cuentas.sql)

-- ============================================
-- PASO 3: Script limpio de instalación
-- ============================================

CREATE TABLE IF NOT EXISTS `correos_cuentas_configuracion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre descriptivo de la cuenta (ej: "Facturación", "Soporte")',
  `email_remitente` varchar(255) NOT NULL COMMENT 'Email desde el que se enviarán los correos',
  `servidor_smtp` varchar(255) NOT NULL COMMENT 'Servidor SMTP (ej: smtp.gmail.com, smtp.office365.com)',
  `puerto` int(11) NOT NULL DEFAULT 587 COMMENT 'Puerto SMTP (típicamente 587 o 465)',
  `usuario_smtp` varchar(255) NOT NULL COMMENT 'Usuario para autenticación SMTP',
  `contrasena_smtp` longtext NOT NULL COMMENT 'Contraseña encriptada para SMTP',
  `usar_tls` tinyint(1) DEFAULT 1 COMMENT 'Usar TLS: 1=SI, 0=NO',
  `usar_ssl` tinyint(1) DEFAULT 0 COMMENT 'Usar SSL: 1=SI, 0=NO',
  `predeterminada` tinyint(1) DEFAULT 0 COMMENT 'Cuenta predeterminada para envíos: 1=SI, 0=NO',
  `activa` tinyint(1) DEFAULT 1 COMMENT 'Estado de la cuenta: 1=Activa, 0=Inactiva',
  `probada` tinyint(1) DEFAULT 0 COMMENT 'Conexión probada exitosamente: 1=SI, 0=NO',
  `ultima_prueba` datetime DEFAULT NULL COMMENT 'Fecha/hora del último test de conexión',
  `fecha_creacion` timestamp DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email_remitente` (`email_remitente`),
  KEY `idx_predeterminada` (`predeterminada`),
  KEY `idx_activa` (`activa`),
  KEY `idx_activa_predeterminada` (`activa`, `predeterminada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuración de cuentas de correo para envío de emails';

-- ============================================
-- Tabla pivote para asociar cuentas con módulos
-- ============================================
CREATE TABLE IF NOT EXISTS `correos_cuentas_modulos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cuenta_id` int(11) NOT NULL,
  `modulo` varchar(50) NOT NULL COMMENT 'Módulo que usa esta cuenta (ej: "facturacion", "pedidos")',
  `fecha_asignacion` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cuenta_modulo` (`cuenta_id`, `modulo`),
  CONSTRAINT `fk_cuenta_id` FOREIGN KEY (`cuenta_id`) REFERENCES `correos_cuentas_configuracion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asociación entre cuentas y módulos del sistema';

-- ============================================
-- Log de envíos (opcional pero útil para auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS `correos_envios_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cuenta_id` int(11) COMMENT 'ID de la cuenta usada',
  `remitente` varchar(255) NOT NULL,
  `destinatarios` json COMMENT 'Array JSON de destinatarios',
  `asunto` varchar(255) NOT NULL,
  `modulo` varchar(50),
  `referencia_id` int(11),
  `estado` enum('enviado','error','pendiente') DEFAULT 'pendiente',
  `mensaje_error` longtext,
  `intento_numero` int(11) DEFAULT 1,
  `fecha_envio` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cuenta_id` (`cuenta_id`),
  KEY `idx_referencia` (`modulo`, `referencia_id`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `fk_log_cuenta_id` FOREIGN KEY (`cuenta_id`) REFERENCES `correos_cuentas_configuracion` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log de envíos de correo para auditoría y debugging';

-- ============================================
-- FIN - Tablas creadas/verificadas correctamente
-- ============================================
