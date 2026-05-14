-- =============================================================================
-- Script: crear_tablas_pedidos_chile.sql
-- Fecha:  6 de Mayo de 2026
-- Módulo: Pedidos Chile
-- Descripción: Crea las 4 tablas del módulo Pedidos Chile
--              ClientesChile, ProductosChile, EncabPedidoChile, DetPedidoChile
-- IMPORTANTE: Ejecutar en orden (respeta dependencias FK)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLIENTES CHILE
--    Sin regiones (a diferencia de Clientes). Se puede extender si se necesita.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ClientesChile (
    Id_ClienteChile  INT(11)      NOT NULL AUTO_INCREMENT,
    Nombre           VARCHAR(150) NOT NULL,
    Direccion        VARCHAR(250) NOT NULL DEFAULT '',
    Ciudad           VARCHAR(100) NOT NULL DEFAULT 'Santiago',
    Pais             VARCHAR(50)  NOT NULL DEFAULT 'Chile',
    Contacto         VARCHAR(100) NOT NULL DEFAULT '',
    Email            VARCHAR(100) NOT NULL DEFAULT '',
    Estado           VARCHAR(15)  NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (Id_ClienteChile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Clientes del módulo Pedidos Chile';

-- Dato inicial: cliente del documento de referencia
INSERT INTO ClientesChile (Nombre, Direccion, Ciudad) VALUES
('Distribuidora de Alimentos Globe Italia SPA', 'Av. Las Condes 6903-Las condes', 'Santiago');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PRODUCTOS CHILE
--    Incluye campos específicos del documento Chile:
--    - CodigoCliente: código que el cliente asigna al producto (ej: DBF005)
--    - PesoNetoGr:    peso neto de la unidad en gramos (ej: 248g para Ciliegine 125g)
--    - PesoEscurridoKg: peso escurrido por unidad en Kg (sin suero/líquido)
--    - EnvaseInternoxCaja: unidades por caja (ej: 8)
--    - FactorPesoBruto: factor para calcular Peso Bruto desde Peso Neto
--    - PrecioXKilo: valor en $ por kilogramo de peso escurrido
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ProductosChile (
    Id_ProductoChile    INT(11)      NOT NULL AUTO_INCREMENT,
    DescripProducto     VARCHAR(150) NOT NULL,
    CodigoSiesa         VARCHAR(10)  NOT NULL DEFAULT '',
    CodigoCliente       VARCHAR(20)  NOT NULL DEFAULT '' COMMENT 'Código asignado por el cliente (ej: DBF005)',
    PesoNetoGr          FLOAT        NOT NULL DEFAULT 0  COMMENT 'Peso neto por unidad en gramos',
    PesoEscurridoKg     FLOAT        NOT NULL DEFAULT 0  COMMENT 'Peso escurrido por unidad en Kg',
    EnvaseInternoxCaja  INT(11)      NOT NULL DEFAULT 0  COMMENT 'Unidades por caja (envase interno)',
    FactorPesoBruto     DOUBLE       NOT NULL DEFAULT 0  COMMENT 'Factor: PesoBruto = PesoNeto * Factor',
    PrecioXKilo         DOUBLE       NOT NULL DEFAULT 0  COMMENT 'Precio en $ por Kg de peso escurrido',
    Activo              TINYINT(4)   NOT NULL DEFAULT -1,
    PRIMARY KEY (Id_ProductoChile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Productos del módulo Pedidos Chile';

-- Datos iniciales: productos del documento de referencia
-- Factor calculado: PesoBrutoTotal / PesoNetoTotal
INSERT INTO ProductosChile (DescripProducto, CodigoSiesa, CodigoCliente, PesoNetoGr, PesoEscurridoKg, EnvaseInternoxCaja, FactorPesoBruto, PrecioXKilo) VALUES
('MOZZARELLA CILIEGINE (125g)', 'PT0117', 'DBF005',   248,  0.125, 8,  1.174, 18.2305),
('MOZZARELLA CILIEGINE (250g)', 'PT0156', 'DBF902_A', 480,  0.250, 8,  1.214, 17.3105),
('BURRATA MOZZARELLA (125g)',   'PT0148', 'DBF921',   248,  0.125, 8,  1.174, 24.3105),
('MOZZARELLA CAPRESE (250g)',   'PT0164', 'DBF920',   250,  0.250, 12, 2.330, 15.7105);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ENCABEZADO DE PEDIDOS CHILE
--    Numeración propia: CHI-000001 (basada en Id_EncabPedidoChile)
--    Sin Región (a diferencia de EncabPedido)
--    Sin Transportadora, Bodega (el destino es siempre Chile vía avión)
--    Tiene: GuiaAerea, DescuentoComercial
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS EncabPedidoChile (
    Id_EncabPedidoChile  INT(11)      NOT NULL AUTO_INCREMENT,
    Id_ClienteChile      INT(11)      NOT NULL,
    NumeroOrden          VARCHAR(12)  NOT NULL DEFAULT '' COMMENT 'Purchase Order / Número de orden del cliente',
    FechaRecepcionOrden  DATE         NOT NULL,
    FechaSolicitudEntrega DATE        NOT NULL COMMENT 'Fecha solicitud entrega Aeropuerto El Dorado (BOG)',
    FechaFinalEntrega    DATE         NOT NULL COMMENT 'Fecha final entrega al cliente',
    CantidadEstibas      DOUBLE       NOT NULL DEFAULT 0,
    GuiaAerea            VARCHAR(20)  NOT NULL DEFAULT '' COMMENT 'AWB No.',
    IdAgencia            INT(11)      NOT NULL DEFAULT 0  COMMENT 'Agencia Carga Colombia',
    IdAerolinea          INT(11)      NOT NULL DEFAULT 0,
    DescuentoComercial   DOUBLE       NOT NULL DEFAULT 0  COMMENT 'Descuento Comercial en $',
    Observaciones        VARCHAR(250) NOT NULL DEFAULT '',
    FacturaNo            VARCHAR(15)  NOT NULL DEFAULT '' COMMENT 'Número FEX de factura',
    Estado               VARCHAR(15)  NOT NULL DEFAULT 'Activo',
    PRIMARY KEY (Id_EncabPedidoChile),
    KEY fk_cliente_chile (Id_ClienteChile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Encabezados de Pedidos Chile. Numeración: CHI-XXXXXX';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DETALLE DE PEDIDOS CHILE
--    Campos adicionales vs DetPedido:
--    - CodigoCliente, CodigoSiesa: se almacenan para auditoria/impresión rápida
--    - Lote, FechaElaboracion, FechaVencimiento: por línea de producto
--    - PesoNetoGr, PesoEscurridoKg, EnvaseInternoxCaja: del producto (copiados al guardar)
--    - FactorPesoBruto, ValorXKilo: del producto (copiados al guardar)
--    Campos CALCULADOS (no se almacenan, se calculan en frontend y PDF):
--    - UnidadesSolicitadas = CantidadCajas * EnvaseInternoxCaja
--    - PesoEscurridoxCaja  = PesoEscurridoKg * EnvaseInternoxCaja
--    - PesoEscurridoTotal  = PesoEscurridoxCaja * CantidadCajas
--    - PesoNetoTotal       = (PesoNetoGr / 1000) * UnidadesSolicitadas
--    - PesoBrutoTotal      = PesoNetoTotal * FactorPesoBruto
--    - ValorTotal          = PesoEscurridoTotal * ValorXKilo
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DetPedidoChile (
    Id_DetPedidoChile    INT(11)      NOT NULL AUTO_INCREMENT,
    Id_EncabPedidoChile  INT(11)      NOT NULL,
    Id_ProductoChile     INT(11)      NOT NULL,
    Descripcion          VARCHAR(150) NOT NULL DEFAULT '',
    CodigoCliente        VARCHAR(20)  NOT NULL DEFAULT '',
    CodigoSiesa          VARCHAR(10)  NOT NULL DEFAULT '',
    Lote                 VARCHAR(20)  NOT NULL DEFAULT '',
    FechaElaboracion     DATE         NULL,
    FechaVencimiento     DATE         NULL,
    PesoNetoGr           FLOAT        NOT NULL DEFAULT 0,
    CantidadCajas        FLOAT        NOT NULL DEFAULT 0,
    EnvaseInternoxCaja   INT(11)      NOT NULL DEFAULT 0,
    PesoEscurridoKg      FLOAT        NOT NULL DEFAULT 0,
    FactorPesoBruto      DOUBLE       NOT NULL DEFAULT 0,
    ValorXKilo           DOUBLE       NOT NULL DEFAULT 0,
    PRIMARY KEY (Id_DetPedidoChile),
    KEY fk_encab_pedido_chile (Id_EncabPedidoChile),
    KEY fk_producto_chile_det (Id_ProductoChile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Detalle de Pedidos Chile';

-- =============================================================================
-- FIN DEL SCRIPT
-- Para ejecutar: phpMyAdmin → seleccionar BD datenban_DiBufala → SQL → Pegar y ejecutar
-- =============================================================================
