-- ============================================================
-- AGREGAR COLUMNAS PARA CERTIFICADO DE TRATAMIENTO TÉRMICO
-- Tabla: DetPedidoChile
-- Nuevas columnas para el Certificado de Pasteurización
-- ============================================================

ALTER TABLE DetPedidoChile
  ADD COLUMN TemperaturaInicial DECIMAL(5,1) NULL AFTER FechaVencimiento,
  ADD COLUMN TemperaturaFinal DECIMAL(5,1) NULL AFTER TemperaturaInicial,
  ADD COLUMN HoraInicialPH TIME NULL AFTER TemperaturaFinal,
  ADD COLUMN HoraFinalPH TIME NULL AFTER HoraInicialPH;
