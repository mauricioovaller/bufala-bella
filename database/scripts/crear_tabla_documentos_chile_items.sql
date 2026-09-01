-- Script para crear tabla documentos_chile_items
-- Almacena items seleccionables para documentos de Chile:
-- - Tipo 'mercancia': productos que aparecen en "Descripcion General de la Mercancia" (Cartas)
-- - Tipo 'anexo': anexos que aparecen en "Envase y etiquetado" (Autodeclaracion)
-- Ejecutar en la base de datos datenban_DiBufala

CREATE TABLE IF NOT EXISTS documentos_chile_items (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Tipo ENUM('mercancia', 'anexo') NOT NULL,
    Orden INT NOT NULL DEFAULT 0,
    Texto VARCHAR(500) NOT NULL,
    DescripcionCorta VARCHAR(200) DEFAULT NULL,
    Activo TINYINT(1) NOT NULL DEFAULT 1,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (Tipo),
    INDEX idx_activo (Activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Items seleccionables para documentos de exportacion Chile (mercancia y anexos)';

-- Datos semilla
INSERT INTO documentos_chile_items (Tipo, Orden, Texto, DescripcionCorta) VALUES
('mercancia', 1, 'QUESO MOZZARELLA 100% LECHE DE BUFALA  0406100000', 'Queso Mozzarella'),
('mercancia', 2, 'YOGURT NATURAL 100% LECHE DE BUFALA Y DE SABORES  0403100000', 'Yogurt Natural'),
('anexo', 1, 'Anexo 2. FT-PT-047 V5 FICHA TECNICA CILIEGINE CHILE', 'FT Ciliegine Chile'),
('anexo', 2, 'Anexo 3. FT-PT-048 v6 FICHA TECNICA OVOLINE CHILE', 'FT Ovoline Chile'),
('anexo', 3, 'Anexo 4. FT-PT-049 V5 FICHA TECNICA BURRATA CHILE', 'FT Burrata Chile'),
('anexo', 4, 'Anexo 5. FT-PT-050 V4 FICHA TECNICA CAPRESE CHILE', 'FT Caprese Chile'),
('anexo', 5, 'Anexo 7. Fotografias Producto y Lote', 'Fotografias Producto y Lote');
