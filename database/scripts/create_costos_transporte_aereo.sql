-- ============================================================================
-- Script: create_costos_transporte_aereo.sql
-- Proposito: Crear la tabla CostosTransporteAereo para registrar costos
--            de transporte aereo por Fecha + GuiaMaster
-- Tabla relacionada: EncabInvoice (valida existencia de Fecha + GuiaMaster)
-- ============================================================================

CREATE TABLE IF NOT EXISTS CostosTransporteAereo (
    Id_CostoTransporteAereo INT PRIMARY KEY AUTO_INCREMENT,
    Fecha DATE NOT NULL COMMENT 'Fecha del costo (debe existir en EncabInvoice con GuiaMaster)',
    GuiaMaster VARCHAR(20) NOT NULL COMMENT 'Guia Master asociada (debe existir en EncabInvoice para la fecha)',
    ValorFleteUSD DECIMAL(12,2) NOT NULL COMMENT 'Valor del flete cobrado por la aerolinea en dolares',
    TRM DECIMAL(12,2) NOT NULL COMMENT 'Tasa de cambio USD-COP para conversion',
    PesoCobrado DECIMAL(12,2) NOT NULL COMMENT 'Peso en kg que cobra la aerolinea',
    Observaciones TEXT COMMENT 'Observaciones o notas adicionales',
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de registro',
    UsuarioRegistro VARCHAR(100) COMMENT 'Usuario que registro el costo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indices
CREATE INDEX idx_fecha ON CostosTransporteAereo (Fecha);
CREATE UNIQUE INDEX idx_fecha_guia_unica ON CostosTransporteAereo (Fecha, GuiaMaster);

-- Comentario de tabla
ALTER TABLE CostosTransporteAereo COMMENT = 'Registro de costos de transporte aereo por Fecha + GuiaMaster';
