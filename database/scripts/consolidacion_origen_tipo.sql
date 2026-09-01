-- ============================================================================
-- Script: consolidacion_origen_tipo.sql
-- Fecha:  2026-08-14
-- Modulo:  Consolidacion unificada (Locales | Chile | Consolidado)
-- Descripcion:
--   - Garantiza CostosTransporteDiario.TipoPedido (ya existe en produccion).
--   - Agrega TipoPedido a CostosTransporteAereo (default 'normal').
--   - Permite un costo por Fecha + TipoPedido en transporte diario.
--   - Permite un costo aereo por Fecha + GuiaMaster + TipoPedido.
--
-- IMPORTANTE:
--   Antes de ejecutar, validar con el MCP que no existen duplicados:
--     1) SELECT Fecha, TipoPedido, COUNT(*) FROM CostosTransporteDiario
--        GROUP BY Fecha, TipoPedido HAVING COUNT(*) > 1;
--     2) SELECT Fecha, GuiaMaster, COUNT(*) FROM CostosTransporteAereo
--        GROUP BY Fecha, GuiaMaster HAVING COUNT(*) > 1;
-- ============================================================================

-- 1. Indice unico (Fecha, TipoPedido) en CostosTransporteDiario.
--    Los registros existentes quedan como 'normal' (comportamiento actual).
ALTER TABLE CostosTransporteDiario
    ADD UNIQUE INDEX idx_fecha_tipo_unica (Fecha, TipoPedido);

-- 2. CostosTransporteAereo: columna TipoPedido, default 'normal' para
--    mantener compatibilidad con los 18 registros existentes.
ALTER TABLE CostosTransporteAereo
    ADD COLUMN TipoPedido VARCHAR(15) NOT NULL DEFAULT 'normal' AFTER GuiaMaster;

-- 3. Reemplazar el indice unico (Fecha, GuiaMaster) por
--    (Fecha, GuiaMaster, TipoPedido) para permitir la misma guia en
--    pedidos locales y pedidos Chile.
ALTER TABLE CostosTransporteAereo
    DROP INDEX idx_fecha_guia_unica;

ALTER TABLE CostosTransporteAereo
    ADD UNIQUE INDEX idx_fecha_guia_tipo_unica (Fecha, GuiaMaster, TipoPedido);

-- Verificacion posterior:
--   SHOW COLUMNS FROM CostosTransporteAereo;
--   SHOW INDEX FROM CostosTransporteDiario;
--   SHOW INDEX FROM CostosTransporteAereo;
