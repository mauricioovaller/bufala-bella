-- Script para crear la tabla ConfiguracionesSistema en la base de datos DiBufala
-- Ejecutar en phpMyAdmin o desde la línea de comandos de MySQL

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS ConfiguracionesSistema (
    Id_Config INT PRIMARY KEY AUTO_INCREMENT,
    Clave VARCHAR(50) UNIQUE NOT NULL COMMENT 'Clave única de la configuración',
    Valor VARCHAR(255) NOT NULL COMMENT 'Valor de la configuración',
    Descripcion TEXT COMMENT 'Descripción de la configuración',
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    UsuarioActualizacion VARCHAR(100) DEFAULT 'Sistema' COMMENT 'Usuario que realizó la última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de configuraciones del sistema';

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX idx_clave ON ConfiguracionesSistema(Clave);

-- 3. Insertar configuración para valor de estiba paga
INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
VALUES ('valor_estiba_paga', '80500', 'Valor unitario por estiba paga en COP')
ON DUPLICATE KEY UPDATE 
    Valor = VALUES(Valor),
    Descripcion = VALUES(Descripcion),
    FechaActualizacion = CURRENT_TIMESTAMP;

-- 4. Insertar otras configuraciones útiles
INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
VALUES 
    ('dias_maximo_consulta', '365', 'Máximo de días para consultas en dashboard'),
    ('moneda_default', 'COP', 'Moneda por defecto para reportes'),
    ('formato_fecha', 'DD/MM/YYYY', 'Formato de fecha para visualización')
ON DUPLICATE KEY UPDATE 
    Valor = VALUES(Valor),
    Descripcion = VALUES(Descripcion),
    FechaActualizacion = CURRENT_TIMESTAMP;

-- 5. Verificar que se creó correctamente
SELECT 'Tabla ConfiguracionesSistema creada/verificada correctamente' AS Mensaje;

-- 6. Mostrar las configuraciones insertadas
SELECT * FROM ConfiguracionesSistema ORDER BY Clave;

-- 7. Ejemplo de cómo actualizar una configuración
-- UPDATE ConfiguracionesSistema 
-- SET Valor = '85000', 
--     Descripcion = 'Nuevo valor por estiba paga',
--     UsuarioActualizacion = 'admin'
-- WHERE Clave = 'valor_estiba_paga';

-- 8. Ejemplo de cómo consultar una configuración
-- SELECT Valor FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga';