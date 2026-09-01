-- =============================================================================
-- Script: alter_detpedido_chile_fechas.sql
-- Fecha:  Junio 2026
-- Descripcion: Agrega columnas FechaElaboracion y FechaVencimiento a DetPedidoChile
-- =============================================================================
--
-- EJECUTAR EN phpMyAdmin (base de datos: datenban_DiBufala)
--
-- =============================================================================

ALTER TABLE DetPedidoChile
  ADD COLUMN FechaElaboracion DATE NULL AFTER Lote3,
  ADD COLUMN FechaVencimiento DATE NULL AFTER FechaElaboracion;

-- =============================================================================
-- VERIFICACION:
-- SHOW COLUMNS FROM DetPedidoChile;
-- =============================================================================
