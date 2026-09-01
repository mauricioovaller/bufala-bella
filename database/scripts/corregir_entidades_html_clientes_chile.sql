-- ============================================================
-- Corrige datos guardados con htmlspecialchars en ClientesChile
-- Ejemplo: "NA&NE" se guardo como "NA&amp;NE"
-- Aplicar UNA sola vez en produccion.
-- Columnas tomadas de las sentencias INSERT/UPDATE de
-- src/Api/ClientesChile/ApiGuardarClienteChile.php y ApiModificarClienteChile.php
-- ============================================================

UPDATE ClientesChile SET
    Nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Nombre, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Direccion = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Direccion, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Ciudad = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Ciudad, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Pais = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Pais, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Contacto = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Contacto, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Email, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Estado = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Estado, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Rut = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Rut, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&'),
    Telefono = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Telefono, '&#039;', "'"), '&quot;', '"'), '&gt;', '>'), '&lt;', '<'), '&amp;', '&');

-- Verificacion (opcional): deben verse valores como 'NA&NE' y no 'NA&amp;NE'
-- SELECT Id_Cliente, Nombre, Direccion FROM ClientesChile WHERE Nombre LIKE '%&%' OR Direccion LIKE '%&%' LIMIT 50;
