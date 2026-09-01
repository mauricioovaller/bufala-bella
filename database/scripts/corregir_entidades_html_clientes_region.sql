-- ============================================================
-- Corrige datos guardados con htmlspecialchars en Clientes
-- Ejemplo: "NA&NE" se guardo como "NA&amp;NE"
-- Aplicar UNA sola vez en produccion.
-- Columnas tomadas de las sentencias INSERT/UPDATE de
-- src/Api/Clientes/ApiGuardarCliente.php y ApiModificarCliente.php
-- ============================================================

-- ClientesRegion: Region, Direccion, Frecuencia
UPDATE ClientesRegion SET
    Region = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Region, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Direccion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Direccion, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Frecuencia = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Frecuencia, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&');

-- Clientes: Nombre
UPDATE Clientes SET
    Nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Nombre, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&');

-- Verificacion (opcional): deben verse valores como 'NA&NE' y no 'NA&amp;NE'
-- SELECT Id_ClienteRegion, Region, Direccion FROM ClientesRegion WHERE Region LIKE '%&%' OR Direccion LIKE '%&%' LIMIT 50;
-- SELECT Id_Cliente, Nombre FROM Clientes WHERE Nombre LIKE '%&%' LIMIT 50;
