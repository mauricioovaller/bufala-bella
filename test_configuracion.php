<?php
/**
 * Prueba simple para verificar conexión y tabla de configuración
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Incluir conexión
$conexion_path = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
if (!file_exists($conexion_path)) {
    die("Error: Archivo de conexión no encontrado en: $conexion_path");
}

include $conexion_path;

if (!isset($enlace) || $enlace->connect_error) {
    die("Error de conexión: " . ($enlace->connect_error ?? 'Variable de conexión no definida'));
}

$enlace->set_charset("utf8mb4");

echo "Conexión establecida correctamente.\n";

// Verificar si existe la tabla CostosTransporteDiario
$sql = "SHOW TABLES LIKE 'CostosTransporteDiario'";
$result = $enlace->query($sql);

if ($result && $result->num_rows > 0) {
    echo "✓ Tabla 'CostosTransporteDiario' existe.\n";
    
    // Contar registros
    $sql_count = "SELECT COUNT(*) as total FROM CostosTransporteDiario";
    $result_count = $enlace->query($sql_count);
    if ($result_count) {
        $row = $result_count->fetch_assoc();
        echo "  Total registros: " . $row['total'] . "\n";
    }
} else {
    echo "✗ Tabla 'CostosTransporteDiario' NO existe.\n";
}

// Verificar si existe la tabla ConfiguracionesSistema
$sql = "SHOW TABLES LIKE 'ConfiguracionesSistema'";
$result = $enlace->query($sql);

if ($result && $result->num_rows > 0) {
    echo "✓ Tabla 'ConfiguracionesSistema' existe.\n";
    
    // Verificar configuración de estiba
    $sql_config = "SELECT * FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga'";
    $result_config = $enlace->query($sql_config);
    
    if ($result_config && $result_config->num_rows > 0) {
        $row = $result_config->fetch_assoc();
        echo "  Configuración 'valor_estiba_paga': " . $row['Valor'] . "\n";
        echo "  Descripción: " . $row['Descripcion'] . "\n";
    } else {
        echo "  ✗ Configuración 'valor_estiba_paga' NO encontrada.\n";
        
        // Intentar insertarla
        $sql_insert = "INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
                      VALUES ('valor_estiba_paga', '80500', 'Valor unitario por estiba paga en COP')";
        if ($enlace->query($sql_insert)) {
            echo "  ✓ Configuración insertada correctamente.\n";
        } else {
            echo "  ✗ Error insertando configuración: " . $enlace->error . "\n";
        }
    }
} else {
    echo "✗ Tabla 'ConfiguracionesSistema' NO existe.\n";
    echo "  Ejecutar el script: crear_tabla_configuraciones_sistema.sql\n";
}

// Verificar tabla EncabPedido para estibas
$sql = "SHOW TABLES LIKE 'EncabPedido'";
$result = $enlace->query($sql);

if ($result && $result->num_rows > 0) {
    echo "✓ Tabla 'EncabPedido' existe.\n";
    
    // Verificar columnas necesarias
    $sql_columns = "SHOW COLUMNS FROM EncabPedido LIKE 'CantidadEstibas'";
    $result_columns = $enlace->query($sql_columns);
    
    if ($result_columns && $result_columns->num_rows > 0) {
        echo "  ✓ Columna 'CantidadEstibas' existe.\n";
    } else {
        echo "  ✗ Columna 'CantidadEstibas' NO existe.\n";
    }
    
    $sql_columns = "SHOW COLUMNS FROM EncabPedido LIKE 'FechaSalida'";
    $result_columns = $enlace->query($sql_columns);
    
    if ($result_columns && $result_columns->num_rows > 0) {
        echo "  ✓ Columna 'FechaSalida' existe.\n";
    } else {
        echo "  ✗ Columna 'FechaSalida' NO existe.\n";
    }
} else {
    echo "✗ Tabla 'EncabPedido' NO existe.\n";
}

$enlace->close();
echo "\nPrueba completada.\n";