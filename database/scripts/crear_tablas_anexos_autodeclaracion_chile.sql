-- ============================================================================
-- Spec 0002 (Facturacion - Autodeclaracion Chile por cliente)
-- Creacion de tablas:
--   1) clientes_chile_anexos_default : preseleccion de anexos POR CLIENTE
--      (100 % configurable desde BD, sin datos fijos en codigo)
--   2) planillas_chile_documentos    : seleccion guardada POR PLANILLA
--      (una fila por anexo marcado, con el id exacto del documento)
-- Ejecutar UNA sola vez (o cuando no existan).
-- ============================================================================

CREATE TABLE IF NOT EXISTS clientes_chile_anexos_default (
    Id_AnexoDefault INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Id_Cliente INT NOT NULL COMMENT 'ClientesChile.Id_Cliente',
    Id_Documento INT NOT NULL COMMENT 'documentos_chile_items.Id (Tipo anexo)',
    FechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cliente_documento (Id_Cliente, Id_Documento),
    KEY idx_cliente (Id_Cliente),
    KEY idx_documento (Id_Documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Preseleccion de anexos (Autodeclaracion Chile) por cliente';

CREATE TABLE IF NOT EXISTS planillas_chile_documentos (
    Id_PlanillaDocumento INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Id_Planilla INT NOT NULL COMMENT 'PlanillasChile.Id_Planilla',
    Id_Documento INT NOT NULL COMMENT 'documentos_chile_items.Id',
    Tipo VARCHAR(15) NOT NULL DEFAULT 'anexo' COMMENT 'anexo (futuro: mercancia)',
    FechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_planilla_documento (Id_Planilla, Id_Documento, Tipo),
    KEY idx_planilla (Id_Planilla),
    KEY idx_documento (Id_Documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Anexos seleccionados guardados por planilla de despacho Chile';
