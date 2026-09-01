-- Script para agregar columnas de seleccion de items a PlanillasChile
-- Ejecutar en la base de datos datenban_DiBufala
-- Requiere: que exista la tabla PlanillasChile

ALTER TABLE PlanillasChile
ADD COLUMN MercanciaSeleccionada TEXT DEFAULT NULL COMMENT 'JSON con IDs de items de mercancia seleccionados (documentos_chile_items)',
ADD COLUMN AnexosSeleccionados TEXT DEFAULT NULL COMMENT 'JSON con IDs de items de anexo seleccionados (documentos_chile_items)';
