-- ============================================================
-- 1. Recrear EncabInvoiceChile con Id_Cliente en vez de Id_Consignatario
-- ============================================================
-- Primero respaldar datos si existen
RENAME TABLE EncabInvoiceChile TO EncabInvoiceChile_old;
RENAME TABLE DetInvoiceChile TO DetInvoiceChile_old;

CREATE TABLE EncabInvoiceChile (
  Id_EncabInvoice INT(11) NOT NULL PRIMARY KEY,
  Id_Cliente INT(11) NOT NULL,
  Fecha DATE NOT NULL,
  IdAgencia INT(11) NOT NULL,
  IdAerolinea INT(11) NOT NULL,
  GuiaMaster VARCHAR(20) NOT NULL DEFAULT '',
  GuiaHija VARCHAR(20) NOT NULL DEFAULT '',
  CantidadEstibas DOUBLE NOT NULL DEFAULT 0,
  Id_Planilla INT(11) NOT NULL DEFAULT 0,
  Observaciones VARCHAR(200) NOT NULL DEFAULT '',
  TipoPedido VARCHAR(15) NOT NULL DEFAULT 'chile'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE DetInvoiceChile (
  Id_DetInvoice INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Id_EncabInvoice INT(11) NOT NULL,
  Item INT(11) NOT NULL,
  Codigo_Siesa VARCHAR(10) NOT NULL DEFAULT '',
  Codigo_FDA VARCHAR(10) NOT NULL DEFAULT '',
  Codigo_CUST VARCHAR(10) NOT NULL DEFAULT '',
  Kilogramos DOUBLE NOT NULL DEFAULT 0,
  Id_Embalaje INT(11) NOT NULL,
  CantidadEmbalaje DOUBLE NOT NULL DEFAULT 0,
  Cajas DOUBLE NOT NULL DEFAULT 0,
  DescripFactura VARCHAR(150) NOT NULL DEFAULT '',
  ValKilogramo DOUBLE NOT NULL DEFAULT 0,
  TipoPedido VARCHAR(15) NOT NULL DEFAULT 'chile',
  INDEX idx_encab (Id_EncabInvoice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. Crear PlanillasChile (independiente)
-- ============================================================
CREATE TABLE PlanillasChile (
  Id_Planilla INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  Fecha DATE NOT NULL,
  IdAerolinea INT(11) NOT NULL,
  Facturas VARCHAR(250) NOT NULL DEFAULT '',
  GuiaMaster VARCHAR(20) NOT NULL DEFAULT '',
  GuiaHija VARCHAR(20) NOT NULL DEFAULT '',
  Id_Cliente INT(11) NOT NULL,
  TotalPiezas DOUBLE NOT NULL DEFAULT 0,
  Precinto VARCHAR(10) NOT NULL DEFAULT '',
  IdAgencia INT(11) NOT NULL,
  Id_Conductor INT(11) NOT NULL,
  Id_Ayudante INT(11) NULL,
  Placa VARCHAR(20) NOT NULL DEFAULT '',
  Vehiculo VARCHAR(30) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
