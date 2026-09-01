-- ============================================================
-- Script: actualizar_observaciones_cliente12.sql
-- Descripción: Agrega el texto "CON GTIN CODIGO DE BARRAS" en
-- el campo Observaciones de todos los pedidos del cliente ID 12
-- que aún no lo tengan.
-- ============================================================
--
-- EJECUTAR EN phpMyAdmin (base de datos: datenban_DiBufala)
--
-- ============================================================

-- 1. VERIFICAR cuántos pedidos serán afectados (opcional)
SELECT Id_EncabPedido, FechaSalida, Observaciones
FROM EncabPedido
WHERE Id_Cliente = 12
  AND (Observaciones IS NULL OR Observaciones = '' OR Observaciones NOT LIKE '%GTIN%')
ORDER BY FechaSalida DESC;

-- 2. ACTUALIZAR los pedidos existentes del cliente 12
UPDATE EncabPedido
SET Observaciones = 'Indicaciones especiales: CON GTIN CODIGO DE BARRAS'
WHERE Id_Cliente = 12
  AND (Observaciones IS NULL OR Observaciones = '' OR Observaciones NOT LIKE '%GTIN%');

-- ============================================================
-- PARA VERIFICAR el resultado:
-- SELECT Id_EncabPedido, FechaSalida, Observaciones
-- FROM EncabPedido
-- WHERE Id_Cliente = 12
-- ORDER BY FechaSalida DESC;
-- ============================================================
