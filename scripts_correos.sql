-- SCRIPTS SQL PARA SISTEMA DE CORREOS
-- Ejecutar en phpMyAdmin o herramienta de base de datos

-- ============================================
-- 1. TABLA PARA DESTINATARIOS DE CORREO
-- ============================================
CREATE TABLE IF NOT EXISTS correos_destinatarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NULL COMMENT 'ID del cliente relacionado (opcional)',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre del destinatario',
    email VARCHAR(255) NOT NULL COMMENT 'Dirección de correo electrónico',
    tipo ENUM('cliente', 'interno', 'proveedor', 'otro') DEFAULT 'cliente' COMMENT 'Tipo de destinatario',
    predeterminado BOOLEAN DEFAULT FALSE COMMENT 'Indica si es correo predeterminado',
    activo BOOLEAN DEFAULT TRUE COMMENT 'Indica si está activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    
    -- Restricciones
    UNIQUE KEY unique_email (email),
    FOREIGN KEY (cliente_id) REFERENCES Clientes(Id_Cliente) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de destinatarios para envío de correos';

-- ============================================
-- 2. TABLA PARA PLANTILLAS DE CORREO
-- ============================================
CREATE TABLE IF NOT EXISTS plantillas_correo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de la plantilla',
    asunto VARCHAR(255) NOT NULL COMMENT 'Asunto del correo',
    cuerpo TEXT NOT NULL COMMENT 'Cuerpo del correo (puede incluir variables)',
    modulo VARCHAR(50) DEFAULT 'facturacion' COMMENT 'Módulo donde se usa la plantilla',
    predeterminada BOOLEAN DEFAULT FALSE COMMENT 'Indica si es plantilla predeterminada',
    activa BOOLEAN DEFAULT TRUE COMMENT 'Indica si está activa',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Plantillas de correo para diferentes módulos';

-- ============================================
-- 3. TABLA PARA HISTORIAL DE ENVÍOS
-- ============================================
CREATE TABLE IF NOT EXISTS historial_correos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    modulo VARCHAR(50) NOT NULL COMMENT 'Módulo desde donde se envió',
    referencia_id INT NULL COMMENT 'ID de referencia (ej: id_factura)',
    destinatarios TEXT NOT NULL COMMENT 'Lista de destinatarios (JSON)',
    asunto VARCHAR(255) NOT NULL COMMENT 'Asunto del correo enviado',
    cuerpo TEXT NULL COMMENT 'Cuerpo del correo (opcional)',
    adjuntos TEXT NULL COMMENT 'Lista de archivos adjuntos (JSON)',
    estado ENUM('enviado', 'error', 'pendiente') DEFAULT 'pendiente' COMMENT 'Estado del envío',
    mensaje_error TEXT NULL COMMENT 'Mensaje de error si falló',
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de envío',
    usuario VARCHAR(100) NULL COMMENT 'Usuario que realizó el envío',
    
    -- Índices para búsquedas
    INDEX idx_modulo (modulo),
    INDEX idx_referencia (referencia_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha_envio (fecha_envio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de todos los correos enviados';

-- ============================================
-- 4. INSERTAR DATOS INICIALES
-- ============================================

-- Insertar correos predeterminados (MODIFICA ESTOS CON TUS CORREOS REALES)
INSERT INTO correos_destinatarios (nombre, email, tipo, predeterminado) VALUES
('Contacto Principal', 'contacto@datenbankensoluciones.com.co', 'interno', TRUE),
('Contabilidad', 'contabilidad@bufalabella.com', 'interno', TRUE),
('Cliente Genérico', 'cliente@ejemplo.com', 'cliente', TRUE),
('Soporte Técnico', 'soporte@bufalabella.com', 'interno', FALSE);

-- Insertar plantillas básicas para facturación
INSERT INTO plantillas_correo (nombre, asunto, cuerpo, modulo, predeterminada) VALUES
('Facturación Básica', 'Factura {numero} - {cliente} - Bufala Bella', 
'Estimado/a,

Adjunto encontrará la factura {numero} correspondiente al cliente {cliente}.

Detalles:
• Número de Factura: {numero}
• Cliente: {cliente}
• Fecha: {fecha}
• Valor Total: ${valor}

Documentos adjuntos:
{adjuntos}

Para cualquier consulta, no dude en contactarnos.

Saludos cordiales,
Departamento de Facturación
Bufala Bella',
'facturacion', TRUE),

('Facturación con Documentos', 'Documentos de Despacho - Factura {numero} - {cliente}', 
'Buen día,

Se adjuntan los documentos relacionados con la factura {numero} del cliente {cliente}:

1. Factura PDF
2. Documentos de despacho seleccionados

Detalles de la transacción:
• Factura: {numero}
• Cliente: {cliente}  
• Fecha: {fecha}
• Valor: ${valor}

Los documentos adjuntos son:
{adjuntos}

Quedamos atentos a sus comentarios.

Atentamente,
Equipo de Logística
Bufala Bella',
'facturacion', FALSE);

-- ============================================
-- 5. PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ============================================

-- Procedimiento para obtener destinatarios activos por tipo
DELIMITER //
CREATE PROCEDURE sp_obtener_destinatarios_activos(IN p_tipo VARCHAR(20))
BEGIN
    IF p_tipo = 'todos' THEN
        SELECT * FROM correos_destinatarios 
        WHERE activo = TRUE 
        ORDER BY predeterminado DESC, nombre ASC;
    ELSE
        SELECT * FROM correos_destinatarios 
        WHERE tipo = p_tipo AND activo = TRUE 
        ORDER BY predeterminado DESC, nombre ASC;
    END IF;
END //
DELIMITER ;

-- Procedimiento para obtener plantillas por módulo
DELIMITER //
CREATE PROCEDURE sp_obtener_plantillas_modulo(IN p_modulo VARCHAR(50))
BEGIN
    SELECT * FROM plantillas_correo 
    WHERE modulo = p_modulo AND activa = TRUE 
    ORDER BY predeterminada DESC, nombre ASC;
END //
DELIMITER ;

-- ============================================
-- 6. VISTAS PARA CONSULTAS FRECUENTES
-- ============================================

-- Vista para correos predeterminados
CREATE VIEW vw_correos_predeterminados AS
SELECT id, nombre, email, tipo 
FROM correos_destinatarios 
WHERE predeterminado = TRUE AND activo = TRUE 
ORDER BY tipo, nombre;

-- Vista para historial reciente
CREATE VIEW vw_historial_reciente AS
SELECT 
    h.id,
    h.modulo,
    h.referencia_id,
    h.asunto,
    h.estado,
    h.fecha_envio,
    h.usuario,
    COUNT(JSON_EXTRACT(h.destinatarios, '$[*]')) as total_destinatarios,
    COUNT(JSON_EXTRACT(h.adjuntos, '$[*]')) as total_adjuntos
FROM historial_correos h
WHERE h.fecha_envio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY h.id
ORDER BY h.fecha_envio DESC;

-- ============================================
-- 7. SCRIPT DE VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT 
    'correos_destinatarios' as tabla,
    COUNT(*) as registros
FROM correos_destinatarios
UNION ALL
SELECT 
    'plantillas_correo' as tabla,
    COUNT(*) as registros
FROM plantillas_correo
UNION ALL
SELECT 
    'historial_correos' as tabla,
    COUNT(*) as registros
FROM historial_correos;

-- Mostrar correos predeterminados
SELECT 'CORREOS PREDETERMINADOS:' as info;
SELECT nombre, email, tipo FROM correos_destinatarios WHERE predeterminado = TRUE;

-- Mostrar plantillas activas
SELECT 'PLANTILLAS ACTIVAS:' as info;
SELECT nombre, modulo FROM plantillas_correo WHERE activa = TRUE;