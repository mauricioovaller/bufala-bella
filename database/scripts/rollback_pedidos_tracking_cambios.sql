-- ============================================================
-- ROLLBACK: Revertir tracking de cambios en Pedidos y PedidosSample
-- Ejecutar este script para volver al estado anterior a la migración
-- ============================================================

-- Eliminar tablas de ítems eliminados
DROP TABLE IF EXISTS pedidos_items_eliminados;
DROP TABLE IF EXISTS sample_items_eliminados;

-- Revertir DetPedido
ALTER TABLE DetPedido
  DROP COLUMN IF EXISTS Id_Producto_Orig,
  DROP COLUMN IF EXISTS Descripcion_Orig,
  DROP COLUMN IF EXISTS Id_Embalaje_Orig,
  DROP COLUMN IF EXISTS Cantidad_Orig,
  DROP COLUMN IF EXISTS PesoNeto_Orig,
  DROP COLUMN IF EXISTS PesoBruto_Orig,
  DROP COLUMN IF EXISTS PrecioUnitario_Orig,
  DROP COLUMN IF EXISTS FechaModificacion;

-- Revertir EncabPedido
ALTER TABLE EncabPedido
  DROP COLUMN IF EXISTS FechaOrden_Orig,
  DROP COLUMN IF EXISTS FechaSalida_Orig,
  DROP COLUMN IF EXISTS FechaEnroute_Orig,
  DROP COLUMN IF EXISTS FechaDelivery_Orig,
  DROP COLUMN IF EXISTS FechaIngreso_Orig,
  DROP COLUMN IF EXISTS FechaModificacion;

-- Revertir DetPedidoSample
ALTER TABLE DetPedidoSample
  DROP COLUMN IF EXISTS Id_Producto_Orig,
  DROP COLUMN IF EXISTS Descripcion_Orig,
  DROP COLUMN IF EXISTS Id_Embalaje_Orig,
  DROP COLUMN IF EXISTS Cantidad_Orig,
  DROP COLUMN IF EXISTS PesoNeto_Orig,
  DROP COLUMN IF EXISTS PesoBruto_Orig,
  DROP COLUMN IF EXISTS PrecioUnitario_Orig,
  DROP COLUMN IF EXISTS FechaModificacion;

-- Revertir EncabPedidoSample
ALTER TABLE EncabPedidoSample
  DROP COLUMN IF EXISTS FechaOrden_Orig,
  DROP COLUMN IF EXISTS FechaSalida_Orig,
  DROP COLUMN IF EXISTS FechaEnroute_Orig,
  DROP COLUMN IF EXISTS FechaDelivery_Orig,
  DROP COLUMN IF EXISTS FechaIngreso_Orig,
  DROP COLUMN IF EXISTS FechaModificacion;
