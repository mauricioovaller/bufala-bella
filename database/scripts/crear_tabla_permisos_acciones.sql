-- ============================================================
-- TABLA: PermisosAcciones
-- Controla permisos granulares por acción dentro de cada módulo
-- 
-- REGLA CENTRAL: Si un usuario NO tiene registros en esta tabla
-- para un módulo → acceso completo (igual que hoy).
-- Solo aplica restricción cuando existen filas para el usuario.
--
-- Ejecutar en la base de datos: dateban_Dibufala
-- ============================================================

CREATE TABLE IF NOT EXISTS `PermisosAcciones` (
  `IdPermisoAccion` INT(11) NOT NULL AUTO_INCREMENT,
  `IdUsuario`       INT(11) NOT NULL,
  `Modulo`          VARCHAR(100) NOT NULL,
  `Accion`          VARCHAR(100) NOT NULL,
  PRIMARY KEY (`IdPermisoAccion`),
  UNIQUE KEY `uq_usuario_modulo_accion` (`IdUsuario`, `Modulo`, `Accion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- ACCIONES DISPONIBLES (referencia)
--
-- Módulo: consolidacion
--   gestionar_fechas_readonly  → ve listado de pedidos, SIN edición
--   gestionar_fechas_full      → acceso completo (editar fechas y lote)
--   costos_transporte_full     → CRUD completo en Costos de Transporte
--
-- Para nuevos módulos en el futuro: agregar acciones aquí
-- ============================================================


-- ============================================================
-- INSERTAR PERMISOS PARA EL NUEVO USUARIO
-- Reemplaza ?ID_USUARIO? con el IdUsuario que asignó al crearlo
-- ============================================================

-- Puede ver el listado de pedidos en "Gestionar Fechas" pero NO puede editar
INSERT INTO `PermisosAcciones` (`IdUsuario`, `Modulo`, `Accion`)
VALUES (?ID_USUARIO?, 'consolidacion', 'gestionar_fechas_readonly');

-- Puede crear, modificar y eliminar en "Costos de Transporte"
INSERT INTO `PermisosAcciones` (`IdUsuario`, `Modulo`, `Accion`)
VALUES (?ID_USUARIO?, 'consolidacion', 'costos_transporte_full');
