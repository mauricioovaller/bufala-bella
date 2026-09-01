-- ============================================================
-- Script: agregar_permiso_comentarios.sql
-- Descripción: Agrega el permiso para la opción "Comentarios"
-- en la tabla Permisos para que aparezca en el menú principal.
-- ============================================================
-- 
-- INSTRUCCIONES:
-- Ejecutar en phpMyAdmin (o cualquier cliente MySQL) con la
-- base de datos 'datenban_DiBufala' seleccionada.
-- 
-- Requisito: Conocer el IdUsuario al que se le asignará el
-- permiso. Si no lo sabes, usa la consulta de verificación
-- incluida al final.
--
-- ============================================================

-- 1. INSERTAR EL PERMISO (cambiar N por el IdUsuario real)
INSERT INTO Permisos (IdUsuario, NombreOpcion, Ruta)
VALUES (N, 'Comentarios', '/comentarios');

-- ============================================================
-- EJEMPLO: Si tu IdUsuario es 1, ejecuta:
-- INSERT INTO Permisos (IdUsuario, NombreOpcion, Ruta)
-- VALUES (1, 'Comentarios', '/comentarios');
-- ============================================================

-- ============================================================
-- VERIFICACIÓN: Consultar los permisos actuales de un usuario
-- (cambiar N por el IdUsuario)
-- ============================================================
-- SELECT IdPermiso, IdUsuario, NombreOpcion, Ruta
-- FROM Permisos
-- WHERE IdUsuario = N
-- ORDER BY NombreOpcion;

-- ============================================================
-- PARA VER TODOS LOS USUARIOS (si no sabes tu IdUsuario):
-- SELECT Id_Usuario, Nombre FROM Usuarios ORDER BY Nombre;
-- ============================================================
