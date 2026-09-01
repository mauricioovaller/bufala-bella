-- ============================================================================
-- Bufala Bella - Dashboard Chile: Infraestructura BD
-- Creado: 2026-08-08
-- Contenido:
--   1. ALTER TABLE CostosTransporteDiario ADD TipoPedido (filtro Chile vs Colombia)
--   2. Crear EncabNotaCreditoChile y DetNotaCreditoChile (igual estructura que Colombia)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AGREGAR COLUMNA TipoPedido A CostosTransporteDiario
--    Permite diferenciar costos de transporte Chile vs Colombia en el dashboard
--    Los registros existentes quedan como 'normal' (comportamiento actual)
-- ----------------------------------------------------------------------------
ALTER TABLE CostosTransporteDiario
    ADD COLUMN TipoPedido VARCHAR(15) NOT NULL DEFAULT 'normal' AFTER Fecha;

-- ----------------------------------------------------------------------------
-- 2. CREAR TABLA EncabNotaCreditoChile
--    Misma estructura que EncabNotaCredito (Colombia), referencia ClientesChile
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EncabNotaCreditoChile (
    Id_EncabNotaCredito INT(11) NOT NULL AUTO_INCREMENT,
    Id_Cliente INT(11) NOT NULL,
    Numero VARCHAR(15) NOT NULL,
    Fecha DATE NOT NULL,
    Motivo TEXT NULL,
    ValorTotalCOP DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    ValorTotalUSD DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    Estado VARCHAR(15) NOT NULL DEFAULT 'Activo',
    FechaRegistro DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    UsuarioRegistro VARCHAR(100) NULL DEFAULT 'Sistema',
    PRIMARY KEY (Id_EncabNotaCredito),
    INDEX idx_enc_nc_chile_cliente (Id_Cliente),
    INDEX idx_enc_nc_chile_fecha (Fecha),
    INDEX idx_enc_nc_chile_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. CREAR TABLA DetNotaCreditoChile
--    Misma estructura que DetNotaCredito (Colombia), referencia EncabPedidoChile
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS DetNotaCreditoChile (
    Id_DetNotaCredito INT(11) NOT NULL AUTO_INCREMENT,
    Id_EncabNotaCredito INT(11) NOT NULL,
    Id_EncabPedido INT(11) NOT NULL,
    Id_DetPedido INT(11) NOT NULL DEFAULT 0,
    Id_Producto INT(11) NOT NULL,
    Descripcion VARCHAR(255) NULL DEFAULT '',
    Id_Embalaje INT(11) NULL,
    CantidadOriginal FLOAT NOT NULL DEFAULT 0,
    CantidadCredito FLOAT NOT NULL DEFAULT 0,
    PesoNetoCredito FLOAT NOT NULL DEFAULT 0,
    PrecioUnitario FLOAT NOT NULL DEFAULT 0,
    ValorCreditoCOP FLOAT NOT NULL DEFAULT 0,
    FechaSalidaPedido DATE NULL,
    Item INT(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (Id_DetNotaCredito),
    INDEX idx_det_nc_chile_encab (Id_EncabNotaCredito),
    INDEX idx_det_nc_chile_pedido (Id_EncabPedido),
    INDEX idx_det_nc_chile_detpedido (Id_DetPedido),
    INDEX idx_det_nc_chile_fecha (FechaSalidaPedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
