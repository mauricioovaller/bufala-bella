-- SOLUCION RAPIDA: Agregar Id_Cliente a EncabInvoiceChile
-- Ejecutar en phpMyAdmin > SQL

-- 1. Agregar columna Id_Cliente (si no existe)
ALTER TABLE EncabInvoiceChile ADD COLUMN Id_Cliente INT(11) NOT NULL DEFAULT 0 AFTER Id_EncabInvoice;

-- 2. Verificar que las columnas existan
SHOW COLUMNS FROM EncabInvoiceChile;
