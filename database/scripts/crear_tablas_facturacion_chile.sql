-- Script para crear tablas independientes de facturacion para Pedidos Chile
-- Ejecutar en la base de datos datenban_DiBufala

CREATE TABLE IF NOT EXISTS EncabInvoiceChile (
  Id_EncabInvoice INT(11) NOT NULL PRIMARY KEY,
  Id_Consignatario INT(11) NOT NULL,
  Fecha DATE NOT NULL,
  IdAgencia INT(11) NOT NULL,
  IdAerolinea INT(11) NOT NULL,
  GuiaMaster VARCHAR(20) NOT NULL DEFAULT '',
  GuiaHija VARCHAR(20) NOT NULL DEFAULT '',
  CantidadEstibas DOUBLE NOT NULL DEFAULT 0,
  Id_Planilla INT(11) NOT NULL DEFAULT 0,
  Observaciones VARCHAR(200) NOT NULL DEFAULT '',
  TipoPedido VARCHAR(15) NOT NULL DEFAULT 'chile',
  FOREIGN KEY (Id_Consignatario) REFERENCES Consignatarios(Id_Consignatario),
  FOREIGN KEY (IdAgencia) REFERENCES Agencias(IdAgencia),
  FOREIGN KEY (IdAerolinea) REFERENCES Aerolineas(IdAerolinea)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS DetInvoiceChile (
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
  INDEX idx_encab (Id_EncabInvoice),
  FOREIGN KEY (Id_EncabInvoice) REFERENCES EncabInvoiceChile(Id_EncabInvoice),
  FOREIGN KEY (Id_Embalaje) REFERENCES Embalajes(Id_Embalaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
