-- Script para crear la tabla ConfiguracionesSistema
-- Ejecutar en la base de datos DiBufala

CREATE TABLE IF NOT EXISTS ConfiguracionesSistema (
    Id_Config INT PRIMARY KEY AUTO_INCREMENT,
    Clave VARCHAR(50) UNIQUE NOT NULL,
    Valor VARCHAR(255) NOT NULL,
    Descripcion TEXT,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UsuarioActualizacion VARCHAR(100) DEFAULT 'Sistema'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar valor inicial para estibas pagas
INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
VALUES ('valor_estiba_paga', '80500', 'Valor unitario por estiba paga en COP')
ON DUPLICATE KEY UPDATE 
    Valor = VALUES(Valor),
    Descripcion = VALUES(Descripcion),
    FechaActualizacion = CURRENT_TIMESTAMP;

-- Insertar otras configuraciones útiles
INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
VALUES 
    ('dias_maximo_consulta', '365', 'Máximo de días para consultas en dashboard'),
    ('moneda_default', 'COP', 'Moneda por defecto para reportes'),
    ('formato_fecha', 'DD/MM/YYYY', 'Formato de fecha para visualización')
ON DUPLICATE KEY UPDATE 
    Valor = VALUES(Valor),
    Descripcion = VALUES(Descripcion),
    FechaActualizacion = CURRENT_TIMESTAMP;

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_clave ON ConfiguracionesSistema(Clave);

-- Verificar que se creó correctamente
SELECT * FROM ConfiguracionesSistema;