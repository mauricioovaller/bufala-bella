-- Agregar columna Id_Planilla a EncabInvoiceChile para vincular planillas
-- Ejecutar en phpMyAdmin si la tabla ya fue creada sin esta columna

ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS Id_Planilla INT(11) NOT NULL DEFAULT 0;
-- Si IF NOT EXISTS no funciona en tu MySQL, usa:
-- ALTER TABLE EncabInvoiceChile ADD COLUMN Id_Planilla INT(11) NOT NULL DEFAULT 0;
-- (si ya existe, MySQL lanzara error 1060 que puedes ignorar)
