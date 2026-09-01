-- ============================================================
-- MIGRACIÓN: Tracking de cambios en PedidosChile
-- Fecha: 27 de mayo de 2026
-- Agrega columnas _Orig a EncabPedidoChile y DetPedidoChile
-- ============================================================

-- Paso 1: Agregar columnas _Orig de fechas a EncabPedidoChile
ALTER TABLE EncabPedidoChile
  ADD COLUMN FechaOrden_Orig    DATE          DEFAULT NULL           AFTER FechaIngreso,
  ADD COLUMN FechaSalida_Orig   DATE          DEFAULT NULL           AFTER FechaOrden_Orig,
  ADD COLUMN FechaEnroute_Orig  DATE          DEFAULT NULL           AFTER FechaSalida_Orig,
  ADD COLUMN FechaDelivery_Orig DATE          DEFAULT NULL           AFTER FechaEnroute_Orig,
  ADD COLUMN FechaIngreso_Orig  DATE          DEFAULT NULL           AFTER FechaDelivery_Orig,
  ADD COLUMN FechaModificacion  DATETIME      DEFAULT NULL           AFTER FechaIngreso_Orig;

-- Paso 2: Agregar columnas _Orig a DetPedidoChile
ALTER TABLE DetPedidoChile
  ADD COLUMN Id_Producto_Orig   INT           NOT NULL DEFAULT 0     AFTER PrecioUnitario,
  ADD COLUMN Descripcion_Orig   VARCHAR(255)  NOT NULL DEFAULT ''    AFTER Id_Producto_Orig,
  ADD COLUMN Id_Embalaje_Orig   INT           NOT NULL DEFAULT 0     AFTER Descripcion_Orig,
  ADD COLUMN Cantidad_Orig      FLOAT         NOT NULL DEFAULT 0     AFTER Id_Embalaje_Orig,
  ADD COLUMN PesoNeto_Orig      FLOAT         NOT NULL DEFAULT 0     AFTER Cantidad_Orig,
  ADD COLUMN PesoBruto_Orig     FLOAT         NOT NULL DEFAULT 0     AFTER PesoNeto_Orig,
  ADD COLUMN PrecioUnitario_Orig FLOAT        NOT NULL DEFAULT 0     AFTER PesoBruto_Orig,
  ADD COLUMN FechaModificacion  DATETIME      DEFAULT NULL           AFTER PrecioUnitario_Orig;
