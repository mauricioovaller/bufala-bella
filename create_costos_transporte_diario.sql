-- Creación de tabla para registro diario de costos de transporte
-- Esta tabla almacena los costos diarios de transporte para cálculo de costos por kg

CREATE TABLE IF NOT EXISTS CostosTransporteDiario (
    Id_CostoTransporte INT PRIMARY KEY AUTO_INCREMENT,
    Fecha DATE NOT NULL COMMENT 'Fecha del costo (debe existir en EncabInvoice.Fecha)',
    CantidadCamiones INT NOT NULL DEFAULT 1 COMMENT 'Número de camiones utilizados ese día',
    ValorFlete DECIMAL(12,2) NOT NULL COMMENT 'Valor total del flete para el día',
    Observaciones TEXT COMMENT 'Observaciones o notas adicionales',
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de registro',
    UsuarioRegistro VARCHAR(100) COMMENT 'Usuario que registró el costo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice para búsquedas por fecha
CREATE INDEX idx_fecha ON CostosTransporteDiario (Fecha);

-- Índice para evitar duplicados por fecha (opcional, descomentar si se requiere)
CREATE UNIQUE INDEX idx_fecha_unica ON CostosTransporteDiario (Fecha);

-- Comentario de la tabla
ALTER TABLE CostosTransporteDiario COMMENT = 'Registro diario de costos de transporte para cálculo de costos por kg despachado';

-- Ejemplo de inserción:
-- INSERT INTO CostosTransporteDiario (Fecha, CantidadCamiones, ValorFlete, Observaciones, UsuarioRegistro)
-- VALUES ('2025-03-18', 2, 1500000.00, 'Flete Bogotá-Medellín', 'admin');

-- Para obtener el costo por kg:
-- SELECT ctd.*, 
--        (SELECT COALESCE(SUM(di.Kilogramos), 0) 
--         FROM EncabInvoice ei 
--         JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice 
--         WHERE ei.Fecha = ctd.Fecha) AS TotalKgFacturado,
--        ctd.ValorFlete / NULLIF((SELECT COALESCE(SUM(di.Kilogramos), 0) 
--                                 FROM EncabInvoice ei 
--                                 JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice 
--                                 WHERE ei.Fecha = ctd.Fecha), 0) AS CostoPorKg
-- FROM CostosTransporteDiario ctd
-- WHERE ctd.Fecha BETWEEN '2025-03-01' AND '2025-03-31';