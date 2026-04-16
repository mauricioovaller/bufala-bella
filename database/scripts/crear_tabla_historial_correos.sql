-- ============================================
-- TABLA: correos_enviados
-- DESCRIPCIÓN: Historial de todos los correos enviados desde la aplicación
-- FEATURES: 
--   - Soporta múltiples módulos (facturación, pedidos, consolidación, etc)
--   - Registro de destinatarios y adjuntos
--   - Auditoría completa (usuario, fecha, estado)
--   - Índices optimizados para búsquedas rápidas
-- ============================================

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS correos_enviados (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del correo',
    
    -- Información del envío
    modulo VARCHAR(50) NOT NULL COMMENT 'Módulo que envió (facturacion, pedidos, consolidacion)',
    referencia_id INT COMMENT 'ID de la factura, pedido, o consolidación relacionada',
    referencia_numero VARCHAR(100) COMMENT 'Número legible (ej: FEX-001234)',
    
    -- Destinatarios
    destinatarios_lista LONGTEXT NOT NULL COMMENT 'JSON con array de destinatarios [{"email":"...", "nombre":"..."}]',
    destinatarios_count INT DEFAULT 1 COMMENT 'Cantidad de destinatarios',
    
    -- Contenido
    asunto VARCHAR(255) NOT NULL COMMENT 'Asunto del correo',
    cuerpo LONGTEXT COMMENT 'Cuerpo del correo en HTML',
    
    -- Adjuntos
    adjuntos_lista LONGTEXT COMMENT 'JSON con array de adjuntos [{"nombre":"...", "tipo":"..."}]',
    adjuntos_count INT DEFAULT 0 COMMENT 'Cantidad de adjuntos',
    
    -- Información de envío
    cuenta_correo_id INT COMMENT 'ID de la cuenta SMTP utilizada',
    cuenta_correo_nombre VARCHAR(255) COMMENT 'Nombre legible de la cuenta (ej: contacto@bufala.com)',
    
    -- Resultado y auditoría
    estado ENUM('enviado', 'fallido', 'pendiente') DEFAULT 'enviado' COMMENT 'Estado del envío',
    mensaje_error LONGTEXT COMMENT 'Mensaje de error si falló',
    respuesta_api LONGTEXT COMMENT 'Respuesta completa de la API (para debugging)',
    
    -- Datos del usuario
    usuario_id INT COMMENT 'ID del usuario que envió',
    usuario_nombre VARCHAR(100) COMMENT 'Nombre del usuario que envió',
    usuario_email VARCHAR(255) COMMENT 'Email del usuario que envió',
    
    -- Timestamps
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación',
    fecha_envio TIMESTAMP NULL COMMENT 'Fecha y hora de envío real',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
    
    -- Indexación para búsquedas rápidas
    INDEX idx_modulo (modulo),
    INDEX idx_referencia (modulo, referencia_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_envio),
    INDEX idx_usuario (usuario_id),
    INDEX idx_asunto (asunto),
    FULLTEXT INDEX ft_destinatarios (destinatarios_lista),
    
    -- Constraint
    CONSTRAINT chk_estado CHECK (estado IN ('enviado', 'fallido', 'pendiente'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Historial centralizado de correos enviados por la aplicación';

-- ============================================
-- TABLA: plantillas_correos_modulos
-- DESCRIPCIÓN: Plantillas por módulo para reutilización
-- ============================================

CREATE TABLE IF NOT EXISTS plantillas_correos_modulos (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único de plantilla',
    
    modulo VARCHAR(50) NOT NULL COMMENT 'Módulo asociado (facturacion, pedidos, consolidacion)',
    nombre VARCHAR(150) NOT NULL COMMENT 'Nombre de la plantilla',
    descripcion TEXT COMMENT 'Descripción para el usuario',
    
    -- Contenido de plantilla
    asunto_plantilla VARCHAR(255) NOT NULL COMMENT 'Asunto con variables {{variable}}',
    cuerpo_plantilla LONGTEXT NOT NULL COMMENT 'Cuerpo HTML con variables {{variable}}',
    variables_disponibles LONGTEXT COMMENT 'JSON con lista de variables disponibles',
    
    -- Configuración
    es_predeterminada BOOLEAN DEFAULT FALSE COMMENT 'Es la plantilla predeterminada del módulo',
    activa BOOLEAN DEFAULT TRUE COMMENT 'Plantilla activa o archivada',
    
    -- Documentos por defecto
    documentos_por_defecto LONGTEXT COMMENT 'JSON con array de documentos seleccionados por defecto',
    
    -- Auditoría
    usuario_creacion INT COMMENT 'ID del usuario que creó',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion INT COMMENT 'ID del usuario que modificó',
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexación
    INDEX idx_modulo_plantilla (modulo),
    INDEX idx_predeterminada (modulo, es_predeterminada),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Plantillas de correos por módulo para fácil reutilización';

-- ============================================
-- TABLA: documentos_adjuntables
-- DESCRIPCIÓN: Catálogo de documentos que pueden adjuntarse por módulo
-- ============================================

CREATE TABLE IF NOT EXISTS documentos_adjuntables (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único',
    
    modulo VARCHAR(50) NOT NULL COMMENT 'Módulo asociado',
    codigo_documento VARCHAR(50) NOT NULL COMMENT 'Código único (ej: factura, carta-policia)',
    nombre_documento VARCHAR(150) NOT NULL COMMENT 'Nombre legible',
    descripcion TEXT COMMENT 'Descripción del documento',
    
    -- Configuración
    es_obligatorio BOOLEAN DEFAULT FALSE COMMENT 'Es obligatorio seleccionar',
    es_visible BOOLEAN DEFAULT TRUE COMMENT 'Se muestra en el selector',
    
    -- Generador
    generador_funcion VARCHAR(100) COMMENT 'Nombre de la función que genera (ej: generarFacturaPDF)',
    generador_servicio VARCHAR(100) DEFAULT 'facturacionService' COMMENT 'Servicio que contiene el generador',
    parametros_generador JSON COMMENT 'Parámetros que necesita el generador',
    
    -- Auditoría
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexación
    INDEX idx_modulo_doc (modulo),
    INDEX idx_codigo (codigo_documento),
    UNIQUE KEY uk_modulo_codigo (modulo, codigo_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de documentos adjuntables por módulo';

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista para resumen de correos enviados
CREATE OR REPLACE VIEW vw_correos_resumen AS
SELECT 
    id,
    modulo,
    referencia_numero,
    asunto,
    destinatarios_count,
    adjuntos_count,
    estado,
    usuario_nombre,
    DATE_FORMAT(fecha_envio, '%d/%m/%Y %H:%i') as fecha_envio_formato,
    CASE 
        WHEN estado = 'enviado' THEN '✅ Enviado'
        WHEN estado = 'fallido' THEN '❌ Fallido'
        ELSE '⏳ Pendiente'
    END as estado_icono
FROM correos_enviados
ORDER BY fecha_envio DESC;

-- Vista para estadísticas por módulo
CREATE OR REPLACE VIEW vw_estadisticas_correos AS
SELECT 
    modulo,
    COUNT(*) as total_enviados,
    SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as exitosos,
    SUM(CASE WHEN estado = 'fallido' THEN 1 ELSE 0 END) as fallidos,
    ROUND(SUM(destinatarios_count), 0) as total_destinatarios,
    SUM(adjuntos_count) as total_adjuntos,
    DATE_FORMAT(MAX(fecha_envio), '%d/%m/%Y') as ultimo_envio
FROM correos_enviados
GROUP BY modulo;

-- ============================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Insertar plantillas iniciales para Facturación
INSERT INTO plantillas_correos_modulos (modulo, nombre, descripcion, asunto_plantilla, cuerpo_plantilla, es_predeterminada, activa) VALUES
('facturacion', 'Factura - Envío Estándar', 'Plantilla estándar para envío de facturas', 
 'Factura {{numero}} - {{cliente}}',
 '<p>Estimado {{cliente}},</p><p>Le adjuntamos su factura N° {{numero}} con valor total de <strong>{{valor}}</strong>.</p><p>La factura fue generada el {{fecha}}.</p><p><strong>Documentos adjuntos:</strong></p><ul>{{adjuntos}}</ul><p>Agradecemos su compra.</p><p>Saludos cordiales.</p>',
 TRUE, TRUE),
 
('facturacion', 'Factura - Con Detalles', 'Plantilla extendida con información detallada',
 'Su Factura {{numero}} está lista',
 '<p><strong>Estimado {{cliente}},</strong></p><p>Nos complace confirmar que su factura ha sido procesada exitosamente.</p><p><strong>Datos de la Factura:</strong></p><table style="border: 1px solid #ccc;"><tr><td>N° Factura:</td><td><strong>{{numero}}</strong></td></tr><tr><td>Fecha:</td><td>{{fecha}}</td></tr><tr><td>Valor Total:</td><td><strong>{{valor}}</strong></td></tr></table><p><strong>Archivos Adjuntos:</strong></p><ul>{{adjuntos}}</ul><p>Si tiene alguna pregunta, no dude en contactarnos.</p>',
 FALSE, TRUE);

-- Insertar documentos para Facturación
INSERT INTO documentos_adjuntables (modulo, codigo_documento, nombre_documento, descripcion, es_obligatorio, generador_funcion, generador_servicio, activo) VALUES
('facturacion', 'factura', 'Factura PDF', 'Documento PDF de la factura', TRUE, 'generarFacturaPDF', 'facturacionService', TRUE),
('facturacion', 'carta-policia', 'Carta para Policía', 'Documento de autorización policial', FALSE, 'generarCartaResponsabilidad', 'planillasService', TRUE),
('facturacion', 'carta-aerolinea', 'Carta para Aerolínea', 'Documento para autorización de aerolínea', FALSE, 'generarCartaResponsabilidad', 'planillasService', TRUE),
('facturacion', 'plan-vallejo', 'Plan Vallejo', 'Documento de régimen especial', FALSE, 'generarPlanVallejo', 'planillasService', TRUE),
('facturacion', 'reporte-despacho', 'Reporte de Despacho', 'Reporte de despacho y logística', FALSE, 'generarReporteDespacho', 'planillasService', TRUE);

-- ============================================
-- PERMISOS (OPCIONAL - Ajusta según tu usuario)
-- ============================================

-- Si necesitas crear un usuario específico para la aplicación:
-- CREATE USER IF NOT EXISTS 'bufala_app'@'localhost' IDENTIFIED BY 'tu_contraseña';
-- GRANT SELECT, INSERT, UPDATE ON bufala_app.* TO 'bufala_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- INFORMACIÓN DE EJECUCIÓN
-- ============================================

/*
INSTRUCCIONES:
1. Ejecuta este script completo en phpMyAdmin o MySQL CLI
2. Las tablas se crearán automáticamente si no existen
3. Se crean vistas para facilitar consultas
4. Se insertan plantillas iniciales para facturación
5. El catálogo de documentos está listo para expandir

PARA VER LOS DATOS:
- SELECT * FROM correos_enviados;
- SELECT * FROM vw_correos_resumen;
- SELECT * FROM vw_estadisticas_correos;

PARA ELIMINAR SI NECESITAS EMPEZAR DE NUEVO:
- DROP TABLE IF EXISTS correos_enviados;
- DROP TABLE IF EXISTS plantillas_correos_modulos;
- DROP TABLE IF EXISTS documentos_adjuntables;
- DROP VIEW IF EXISTS vw_correos_resumen;
- DROP VIEW IF EXISTS vw_estadisticas_correos;
*/