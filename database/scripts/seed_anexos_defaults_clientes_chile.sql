-- ============================================================================
-- Spec 0002 - SEED de preseleccion de anexos por cliente (Autodeclaracion Chile)
--
-- ANTES DE EJECUTAR, verificar los datos reales (Paso 0 de la Spec 0002):
--   1) Clientes:
--        SELECT Id_Cliente, Nombre FROM ClientesChile
--        WHERE Nombre LIKE '%GLOBE%' OR Nombre LIKE '%CENCOSUD%' OR Nombre LIKE '%GLOBE ITALIA%';
--   2) Anexos disponibles:
--        SELECT Id, Orden, Texto FROM documentos_chile_items
--        WHERE Tipo='anexo' AND Activo=1 ORDER BY Orden;
--
-- Si falta algun item (p. ej. las fichas C&C FT-PT-055/056 para Cencosud o las
-- versiones V6 de Globe), primero crear/ajustar la fila en documentos_chile_items
-- (datos maestros) y luego volver a ejecutar este seed (es idempotente).
--
-- Mapeos esperados:
--   * Distribuidora de Alimentos Globe Italia SPA -> FT-PT-047, FT-PT-048,
--     FT-PT-049, FT-PT-050 y Fotografias Producto y Lote
--   * Cencosud Retail S.A. -> FT-PT-055 (Ciliegine C&C), FT-PT-056 (Burrata C&C)
--     y Fotografias Producto y Lote
-- ============================================================================

-- Ajusta el LIKE del cliente si el nombre real en BD difiere.
-- Globe Italia:
INSERT IGNORE INTO clientes_chile_anexos_default (Id_Cliente, Id_Documento)
SELECT c.Id_Cliente, i.Id
FROM ClientesChile c
INNER JOIN documentos_chile_items i ON i.Tipo = 'anexo' AND i.Activo = 1
WHERE c.Nombre LIKE '%GLOBE%'
  AND c.Nombre LIKE '%ITALIA%'
  AND (i.Texto LIKE '%FT-PT-047%'
    OR i.Texto LIKE '%FT-PT-048%'
    OR i.Texto LIKE '%FT-PT-049%'
    OR i.Texto LIKE '%FT-PT-050%'
    OR i.Texto LIKE '%Fotograf%');

-- Cencosud Retail:
INSERT IGNORE INTO clientes_chile_anexos_default (Id_Cliente, Id_Documento)
SELECT c.Id_Cliente, i.Id
FROM ClientesChile c
INNER JOIN documentos_chile_items i ON i.Tipo = 'anexo' AND i.Activo = 1
WHERE c.Nombre LIKE '%CENCOSUD%'
  AND (i.Texto LIKE '%FT-PT-055%'
    OR i.Texto LIKE '%FT-PT-056%'
    OR i.Texto LIKE '%Fotograf%');

-- Verificacion:
--   SELECT cad.Id_Cliente, cli.Nombre, cad.Id_Documento, di.Texto
--   FROM clientes_chile_anexos_default cad
--   INNER JOIN ClientesChile cli ON cli.Id_Cliente = cad.Id_Cliente
--   INNER JOIN documentos_chile_items di ON di.Id = cad.Id_Documento
--   ORDER BY cli.Nombre, di.Orden;
