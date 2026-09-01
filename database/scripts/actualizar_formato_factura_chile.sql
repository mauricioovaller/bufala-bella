-- ============================================================
-- Actualizar tablas para formato Factura Proforma Chile
-- ============================================================

-- Agregar columnas a ClientesChile
ALTER TABLE ClientesChile ADD COLUMN IF NOT EXISTS Rut VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE ClientesChile ADD COLUMN IF NOT EXISTS Telefono VARCHAR(20) NOT NULL DEFAULT '';

-- Agregar columnas a EncabInvoiceChile
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS FechaVencimiento DATE DEFAULT NULL;
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS TerminosPago VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS NumeroOrden VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS FleteInternacional DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS Incoterm VARCHAR(10) NOT NULL DEFAULT 'CPT';
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS PartidaArancelaria VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS GuiaHija VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE EncabInvoiceChile ADD COLUMN IF NOT EXISTS Temperatura VARCHAR(20) NOT NULL DEFAULT '2° a 6°';
