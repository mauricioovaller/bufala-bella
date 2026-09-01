-- =============================================================================
-- Script: alter_pedidos_chile_igualar_estructura.sql
-- Fecha:  Mayo 2026
-- Descripcion: Recrea EncabPedidoChile y DetPedidoChile con la MISMA
--              estructura que EncabPedido y DetPedido respectivamente
-- =============================================================================

-- Eliminar tablas Chile existentes (si hay datos, se pierden - reinicio para pruebas)
DROP TABLE IF EXISTS DetPedidoChile;
DROP TABLE IF EXISTS EncabPedidoChile;

-- ============================================================
-- EncabPedidoChile (misma estructura que EncabPedido)
-- ============================================================
CREATE TABLE EncabPedidoChile (
    Id_EncabPedidoChile  INT(11)      NOT NULL AUTO_INCREMENT,
    Id_Cliente           INT(11)      NOT NULL,
    Id_ClienteRegion     INT(11)      DEFAULT NULL,
    Id_Transportadora    INT(11)      DEFAULT NULL,
    Id_Bodega            INT(11)      DEFAULT NULL,
    PurchaseOrder        VARCHAR(50)  NOT NULL DEFAULT '',
    FechaOrden           DATE         DEFAULT NULL,
    FechaSalida          DATE         DEFAULT NULL,
    FechaEnroute         DATE         DEFAULT NULL,
    FechaDelivery        DATE         DEFAULT NULL,
    FechaIngreso         DATE         DEFAULT NULL,
    CantidadEstibas      DOUBLE       NOT NULL DEFAULT 0,
    IdAerolinea          INT(11)      DEFAULT NULL,
    IdAgencia            INT(11)      DEFAULT NULL,
    GuiaMaster           VARCHAR(30)  NOT NULL DEFAULT '',
    GuiaHija             VARCHAR(30)  NOT NULL DEFAULT '',
    Observaciones        VARCHAR(250) NOT NULL DEFAULT '',
    FacturaNo            VARCHAR(15)  NOT NULL DEFAULT '',
    ComentarioPrimario   TINYINT(4)   NOT NULL DEFAULT -1,
    ComentarioSecundario TINYINT(4)   NOT NULL DEFAULT -1,
    Estado               VARCHAR(15)  NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (Id_EncabPedidoChile),
    KEY idx_cliente (Id_Cliente),
    KEY idx_region (Id_ClienteRegion),
    KEY idx_transportadora (Id_Transportadora),
    KEY idx_bodega (Id_Bodega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- DetPedidoChile (misma estructura que DetPedido)
-- ============================================================
CREATE TABLE DetPedidoChile (
    Id_DetPedidoChile    INT(11)      NOT NULL AUTO_INCREMENT,
    Id_EncabPedidoChile  INT(11)      NOT NULL,
    Id_Producto          INT(11)      NOT NULL,
    Descripcion          VARCHAR(150) NOT NULL DEFAULT '',
    Id_Embalaje          INT(11)      NOT NULL,
    Cantidad             DOUBLE       NOT NULL DEFAULT 0,
    PrecioUnitario       DOUBLE       NOT NULL DEFAULT 0,
    PesoNeto             DOUBLE       NOT NULL DEFAULT 0,
    PesoBruto            DOUBLE       NOT NULL DEFAULT 0,
    Codigo_Siesa         VARCHAR(10)  NOT NULL DEFAULT '',
    DescripFactura       VARCHAR(150) NOT NULL DEFAULT '',
    PRIMARY KEY (Id_DetPedidoChile),
    KEY fk_encab_pedido_chile (Id_EncabPedidoChile),
    KEY fk_producto_chile_det (Id_Producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
