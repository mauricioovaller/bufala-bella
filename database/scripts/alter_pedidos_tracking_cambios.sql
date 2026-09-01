-- ============================================================
-- MIGRACIÓN: Tracking de cambios en Pedidos y PedidosSample
-- Fecha: 13 de mayo de 2026
-- Para revertir: ejecutar rollback_pedidos_tracking_cambios.sql
-- ============================================================

-- Paso 1: Agregar columnas _Orig a DetPedido
ALTER TABLE DetPedido
  ADD COLUMN Id_Producto_Orig   INT           NOT NULL DEFAULT 0     AFTER PrecioUnitario,
  ADD COLUMN Descripcion_Orig   VARCHAR(255)  NOT NULL DEFAULT ''    AFTER Id_Producto_Orig,
  ADD COLUMN Id_Embalaje_Orig   INT           NOT NULL DEFAULT 0     AFTER Descripcion_Orig,
  ADD COLUMN Cantidad_Orig      FLOAT         NOT NULL DEFAULT 0     AFTER Id_Embalaje_Orig,
  ADD COLUMN PesoNeto_Orig      FLOAT         NOT NULL DEFAULT 0     AFTER Cantidad_Orig,
  ADD COLUMN PesoBruto_Orig     FLOAT         NOT NULL DEFAULT 0     AFTER PesoNeto_Orig,
  ADD COLUMN PrecioUnitario_Orig FLOAT        NOT NULL DEFAULT 0     AFTER PesoBruto_Orig,
  ADD COLUMN FechaModificacion  DATETIME      DEFAULT NULL           AFTER PrecioUnitario_Orig;

-- Paso 2: Agregar columnas _Orig de fechas a EncabPedido
ALTER TABLE EncabPedido
  ADD COLUMN FechaOrden_Orig    DATE          DEFAULT NULL           AFTER FechaIngreso,
  ADD COLUMN FechaSalida_Orig   DATE          DEFAULT NULL           AFTER FechaOrden_Orig,
  ADD COLUMN FechaEnroute_Orig  DATE          DEFAULT NULL           AFTER FechaSalida_Orig,
  ADD COLUMN FechaDelivery_Orig DATE          DEFAULT NULL           AFTER FechaEnroute_Orig,
  ADD COLUMN FechaIngreso_Orig  DATE          DEFAULT NULL           AFTER FechaDelivery_Orig,
  ADD COLUMN FechaModificacion  DATETIME      DEFAULT NULL           AFTER FechaIngreso_Orig;

-- Paso 3: Agregar columnas _Orig a DetPedidoSample
ALTER TABLE DetPedidoSample
  ADD COLUMN Id_Producto_Orig    INT          NOT NULL DEFAULT 0     AFTER PrecioUnitario,
  ADD COLUMN Descripcion_Orig    VARCHAR(255) NOT NULL DEFAULT ''    AFTER Id_Producto_Orig,
  ADD COLUMN Id_Embalaje_Orig    INT          NOT NULL DEFAULT 0     AFTER Descripcion_Orig,
  ADD COLUMN Cantidad_Orig       FLOAT        NOT NULL DEFAULT 0     AFTER Id_Embalaje_Orig,
  ADD COLUMN PesoNeto_Orig       FLOAT        NOT NULL DEFAULT 0     AFTER Cantidad_Orig,
  ADD COLUMN PesoBruto_Orig      FLOAT        NOT NULL DEFAULT 0     AFTER PesoNeto_Orig,
  ADD COLUMN PrecioUnitario_Orig FLOAT        NOT NULL DEFAULT 0     AFTER PesoBruto_Orig,
  ADD COLUMN FechaModificacion   DATETIME     DEFAULT NULL           AFTER PrecioUnitario_Orig;

-- Paso 4: Agregar columnas _Orig de fechas a EncabPedidoSample
ALTER TABLE EncabPedidoSample
  ADD COLUMN FechaOrden_Orig    DATE          DEFAULT NULL           AFTER FechaIngreso,
  ADD COLUMN FechaSalida_Orig   DATE          DEFAULT NULL           AFTER FechaOrden_Orig,
  ADD COLUMN FechaEnroute_Orig  DATE          DEFAULT NULL           AFTER FechaSalida_Orig,
  ADD COLUMN FechaDelivery_Orig DATE          DEFAULT NULL           AFTER FechaEnroute_Orig,
  ADD COLUMN FechaIngreso_Orig  DATE          DEFAULT NULL           AFTER FechaDelivery_Orig,
  ADD COLUMN FechaModificacion  DATETIME      DEFAULT NULL           AFTER FechaIngreso_Orig;

-- Paso 5: Tabla de ítems eliminados de Pedidos regulares
CREATE TABLE IF NOT EXISTS pedidos_items_eliminados (
  Id_ItemEliminado   INT          NOT NULL AUTO_INCREMENT,
  Id_DetPedido_Orig  INT          NOT NULL DEFAULT 0    COMMENT 'Id_DetPedido original antes de ser eliminado',
  Id_EncabPedido     INT          NOT NULL DEFAULT 0,
  Id_Producto        INT          NOT NULL DEFAULT 0,
  Descripcion        VARCHAR(255) NOT NULL DEFAULT '',
  Id_Embalaje        INT          NOT NULL DEFAULT 0,
  Cantidad           FLOAT        NOT NULL DEFAULT 0,
  PesoNeto           FLOAT        NOT NULL DEFAULT 0,
  PesoBruto          FLOAT        NOT NULL DEFAULT 0,
  PrecioUnitario     FLOAT        NOT NULL DEFAULT 0,
  FechaEliminacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Id_ItemEliminado),
  INDEX idx_encab_pedido (Id_EncabPedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de ítems eliminados de pedidos regulares';

-- Paso 6: Tabla de ítems eliminados de PedidosSample
CREATE TABLE IF NOT EXISTS sample_items_eliminados (
  Id_ItemEliminado      INT          NOT NULL AUTO_INCREMENT,
  Id_DetSample_Orig     INT          NOT NULL DEFAULT 0    COMMENT 'Id_DetPedido original en DetPedidoSample antes de ser eliminado',
  Id_EncabPedidoSample  INT          NOT NULL DEFAULT 0,
  Id_Producto           INT          NOT NULL DEFAULT 0,
  Descripcion           VARCHAR(255) NOT NULL DEFAULT '',
  Id_Embalaje           INT          NOT NULL DEFAULT 0,
  Cantidad              FLOAT        NOT NULL DEFAULT 0,
  PesoNeto              FLOAT        NOT NULL DEFAULT 0,
  PesoBruto             FLOAT        NOT NULL DEFAULT 0,
  PrecioUnitario        FLOAT        NOT NULL DEFAULT 0,
  FechaEliminacion      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Id_ItemEliminado),
  INDEX idx_encab_sample (Id_EncabPedidoSample)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de ítems eliminados de pedidos sample';
