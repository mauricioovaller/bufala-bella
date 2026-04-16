<?php
/**
 * Prueba mejorada para verificar configuración de base de datos
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== PRUEBA DE CONFIGURACIÓN DE BASE DE DATOS ===\n\n";

// Usar la misma ruta que la API
$conexion_path = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

echo "1. Verificando archivo de conexión...\n";
echo "   Ruta: $conexion_path\n";

if (!file_exists($conexion_path)) {
    die("   ✗ ERROR: Archivo de conexión NO encontrado\n");
}

echo "   ✓ Archivo de conexión encontrado\n";

// Incluir conexión
include $conexion_path;

if (!isset($enlace) || $enlace->connect_error) {
    die("   ✗ ERROR de conexión: " . ($enlace->connect_error ?? 'Variable $enlace no definida') . "\n");
}

echo "   ✓ Conexión establecida correctamente\n\n";

$enlace->set_charset("utf8mb4");

// 2. Verificar tablas
echo "2. Verificando tablas necesarias...\n";

$tablas_requeridas = [
    'ConfiguracionesSistema',
    'CostosTransporteDiario', 
    'EncabPedido'
];

foreach ($tablas_requeridas as $tabla) {
    $sql = "SHOW TABLES LIKE '$tabla'";
    $result = $enlace->query($sql);
    
    if ($result && $result->num_rows > 0) {
        echo "   ✓ Tabla '$tabla' existe\n";
        
        // Contar registros si es posible
        $sql_count = "SELECT COUNT(*) as total FROM $tabla";
        $result_count = $enlace->query($sql_count);
        if ($result_count) {
            $row = $result_count->fetch_assoc();
            echo "     Registros: " . $row['total'] . "\n";
        }
    } else {
        echo "   ✗ Tabla '$tabla' NO existe\n";
    }
}

echo "\n";

// 3. Verificar configuración específica
echo "3. Verificando configuración 'valor_estiba_paga'...\n";

$sql_config = "SELECT * FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga'";
$result_config = $enlace->query($sql_config);

if ($result_config && $result_config->num_rows > 0) {
    $row = $result_config->fetch_assoc();
    echo "   ✓ Configuración encontrada\n";
    echo "     Valor: " . $row['Valor'] . "\n";
    echo "     Descripción: " . $row['Descripcion'] . "\n";
    echo "     Última actualización: " . $row['FechaActualizacion'] . "\n";
} else {
    echo "   ✗ Configuración 'valor_estiba_paga' NO encontrada\n";
    
    // Intentar insertarla
    echo "   Intentando insertar configuración...\n";
    $sql_insert = "INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
                  VALUES ('valor_estiba_paga', '80500', 'Valor unitario por estiba paga en COP')";
    
    if ($enlace->query($sql_insert)) {
        echo "   ✓ Configuración insertada correctamente\n";
    } else {
        echo "   ✗ Error insertando: " . $enlace->error . "\n";
    }
}

echo "\n";

// 4. Verificar columnas necesarias en EncabPedido
echo "4. Verificando columnas en EncabPedido...\n";

$columnas_requeridas = ['CantidadEstibas', 'FechaSalida', 'Estado'];

foreach ($columnas_requeridas as $columna) {
    $sql_column = "SHOW COLUMNS FROM EncabPedido LIKE '$columna'";
    $result_column = $enlace->query($sql_column);
    
    if ($result_column && $result_column->num_rows > 0) {
        echo "   ✓ Columna '$columna' existe\n";
    } else {
        echo "   ✗ Columna '$columna' NO existe\n";
    }
}

echo "\n";

// 5. Verificar datos de ejemplo en CostosTransporteDiario
echo "5. Verificando datos en CostosTransporteDiario...\n";

$sql_datos = "SELECT 
    COUNT(*) as total,
    MIN(Fecha) as fecha_min,
    MAX(Fecha) as fecha_max,
    SUM(ValorFlete) as total_flete,
    SUM(CantidadCamiones) as total_camiones
FROM CostosTransporteDiario";

$result_datos = $enlace->query($sql_datos);

if ($result_datos && $result_datos->num_rows > 0) {
    $row = $result_datos->fetch_assoc();
    echo "   ✓ Datos encontrados:\n";
    echo "     Total registros: " . $row['total'] . "\n";
    echo "     Rango de fechas: " . $row['fecha_min'] . " a " . $row['fecha_max'] . "\n";
    echo "     Total flete: $" . number_format($row['total_flete'], 0, ',', '.') . "\n";
    echo "     Total camiones: " . $row['total_camiones'] . "\n";
    
    // Mostrar algunos registros de ejemplo
    if ($row['total'] > 0) {
        echo "\n     Ejemplo de registros:\n";
        $sql_ejemplo = "SELECT Fecha, CantidadCamiones, ValorFlete, Observaciones 
                       FROM CostosTransporteDiario 
                       ORDER BY Fecha DESC 
                       LIMIT 3";
        $result_ejemplo = $enlace->query($sql_ejemplo);
        
        while ($ejemplo = $result_ejemplo->fetch_assoc()) {
            echo "       - " . $ejemplo['Fecha'] . ": " . $ejemplo['CantidadCamiones'] . 
                 " camiones, $" . number_format($ejemplo['ValorFlete'], 0, ',', '.') . 
                 " - " . ($ejemplo['Observaciones'] ?: 'Sin observaciones') . "\n";
        }
    }
} else {
    echo "   ✗ NO hay datos en CostosTransporteDiario\n";
    echo "   Nota: La API funcionará pero no mostrará datos hasta que haya registros\n";
}

echo "\n";

// 6. Prueba de consulta combinada (similar a la API)
echo "6. Prueba de consulta combinada (costos + estibas)...\n";

// Primero obtener el valor de estiba
$valor_estiba = 80500;
$sql_valor = "SELECT Valor FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga' LIMIT 1";
$result_valor = $enlace->query($sql_valor);
if ($result_valor && $result_valor->num_rows > 0) {
    $row_valor = $result_valor->fetch_assoc();
    $valor_estiba = (float)$row_valor['Valor'];
}

// Fechas de ejemplo
$fecha_inicio = date('Y-m-01'); // Primer día del mes actual
$fecha_fin = date('Y-m-d');     // Hoy

echo "   Fechas de prueba: $fecha_inicio a $fecha_fin\n";
echo "   Valor estiba: $" . number_format($valor_estiba, 0, ',', '.') . "\n";

// Consulta simplificada para prueba
$sql_prueba = "SELECT 
    ctd.Fecha,
    ctd.ValorFlete,
    ctd.CantidadCamiones
FROM CostosTransporteDiario ctd
WHERE ctd.Fecha BETWEEN '$fecha_inicio' AND '$fecha_fin'
ORDER BY ctd.Fecha
LIMIT 5";

$result_prueba = $enlace->query($sql_prueba);

if ($result_prueba && $result_prueba->num_rows > 0) {
    echo "   ✓ Consulta ejecutada correctamente\n";
    echo "   Registros encontrados: " . $result_prueba->num_rows . "\n";
} else {
    echo "   ⚠️ Consulta ejecutada pero sin resultados para el rango de fechas\n";
    echo "   Nota: Esto es normal si no hay costos registrados para este período\n";
}

$enlace->close();

echo "\n=== PRUEBA COMPLETADA ===\n";
echo "Resumen:\n";
echo "- Si ves muchos ✓, la configuración está correcta\n";
echo "- Si ves ✗, necesitas corregir esos puntos\n";
echo "- La API funcionará si hay al menos:\n";
echo "  1. Tabla ConfiguracionesSistema con valor_estiba_paga\n";
echo "  2. Tabla CostosTransporteDiario (puede estar vacía inicialmente)\n";
echo "  3. Tabla EncabPedido con columnas necesarias\n";