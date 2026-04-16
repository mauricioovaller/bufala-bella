-- Script para verificar tablas necesarias para la API de costos de transporte

-- 1. Verificar tabla ConfiguracionesSistema
SELECT '1. ConfiguracionesSistema' AS Tabla;
SHOW TABLES LIKE 'ConfiguracionesSistema';

SELECT '   Contenido:' AS Info;
SELECT * FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga';

-- 2. Verificar tabla CostosTransporteDiario
SELECT '2. CostosTransporteDiario' AS Tabla;
SHOW TABLES LIKE 'CostosTransporteDiario';

SELECT '   Estructura:' AS Info;
DESCRIBE CostosTransporteDiario;

SELECT '   Datos de ejemplo (últimos 5):' AS Info;
SELECT Fecha, CantidadCamiones, ValorFlete, Observaciones 
FROM CostosTransporteDiario 
ORDER BY Fecha DESC 
LIMIT 5;

-- 3. Verificar tabla EncabPedido
SELECT '3. EncabPedido' AS Tabla;
SHOW TABLES LIKE 'EncabPedido';

SELECT '   Columnas relevantes:' AS Info;
SHOW COLUMNS FROM EncabPedido LIKE 'CantidadEstibas';
SHOW COLUMNS FROM EncabPedido LIKE 'FechaSalida';
SHOW COLUMNS FROM EncabPedido LIKE 'Estado';

-- 4. Verificar datos de ejemplo para cálculo de estibas pagas
SELECT '4. Ejemplo cálculo estibas pagas:' AS Info;
SELECT 
    FechaSalida,
    COUNT(*) AS total_pedidos,
    SUM(CantidadEstibas) AS total_estibas,
    SUM(
        CASE 
            WHEN Cantidad < 20 THEN 0 
            ELSE CantidadEstibas 
        END
    ) AS estibas_pagas
FROM EncabPedido
WHERE FechaSalida BETWEEN '2025-01-01' AND '2025-03-31'
    AND Estado = 'Activo'
GROUP BY FechaSalida
ORDER BY FechaSalida DESC
LIMIT 5;

-- 5. Verificar join entre CostosTransporteDiario y fechas de EncabPedido
SELECT '5. Ejemplo join costos + estibas:' AS Info;
SELECT 
    ctd.Fecha,
    ctd.ValorFlete,
    ctd.CantidadCamiones,
    COALESCE(ep.total_estibas_pagas, 0) AS estibas_pagas
FROM CostosTransporteDiario ctd
LEFT JOIN (
    SELECT 
        FechaSalida,
        SUM(
            CASE 
                WHEN Cantidad < 20 THEN 0 
                ELSE CantidadEstibas 
            END
        ) AS total_estibas_pagas
    FROM EncabPedido
    WHERE Estado = 'Activo'
    GROUP BY FechaSalida
) ep ON ctd.Fecha = ep.FechaSalida
WHERE ctd.Fecha BETWEEN '2025-01-01' AND '2025-03-31'
ORDER BY ctd.Fecha
LIMIT 5;