-- ============================================================
-- Agregar columna TermografoNo a tablas de Chile
-- Fecha: Julio 2026
-- Ejecutar cuando el servidor esté disponible
-- ============================================================

ALTER TABLE PlanillasChile ADD COLUMN TermografoNo VARCHAR(50) DEFAULT NULL AFTER Precinto;
ALTER TABLE EncabInvoiceChile ADD COLUMN TermografoNo VARCHAR(50) DEFAULT NULL AFTER Precinto;
