<?php
/**
 * Prueba de configuración para línea de comandos
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== PRUEBA DE CONFIGURACIÓN DESDE LÍNEA DE COMANDOS ===\n\n";

// Definir DOCUMENT_ROOT manualmente para pruebas CLI
$_SERVER['DOCUMENT_ROOT'] = 'C:/xampp/htdocs';

// Ruta de conexión
$conexion_path = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

echo "1. Verificando archivo de conexión...\n";
echo "   Ruta definida: $conexion_path\n";

if (!file_exists($conexion_path)) {
    // Intentar rutas alternativas
    $rutas_alternativas = [
        'C:/xampp/htdocs/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php',
        'C:/xampp/htdocs/Proyectos_React/bufala-bella/../../DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php',
        'C:/xampp/htdocs/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php'
    ];
    
    foreach ($rutas_alternativas as $ruta) {
        if (file_exists($ruta)) {
            $conexion_path = $ruta;
            echo "   ✓ Encontrado en ruta alternativa: $ruta\n";
            break;
        }
    }
    
    if (!file_exists($conexion_path)) {
        die("   ✗ ERROR: No se pudo encontrar el archivo de conexión\n");
    }
} else {
    echo "   ✓ Archivo de conexión encontrado\n";
}

// Incluir conexión
include $conexion_path;

if (!isset($enlace) || $enlace->connect_error) {
    die("   ✗ ERROR de conexión: " . ($enlace->connect_error ?? 'Variable $enlace no definida') . "\n");
}

echo "   ✓ Conexión establecida correctamente\n\n";

$enlace->set_charset("utf8mb4");

// 2. Verificar tablas básicas
echo "2. Verificando tablas básicas...\n";

$tablas = ['ConfiguracionesSistema', 'CostosTransporteDiario', 'EncabPedido'];
$tablas_encontradas = 0;

foreach ($tablas as $tabla) {
    $sql = "SHOW TABLES LIKE '$tabla'";
    $result = $enlace->query($sql);
    
    if ($result && $result->num_rows > 0) {
        echo "   ✓ $tabla\n";
        $tablas_encontradas++;
    } else {
        echo "   ✗ $tabla (NO existe)\n";
    }
}

echo "\n";

if ($tablas_encontradas < 3) {
    echo "ADVERTENCIA: Faltan tablas necesarias.\n";
    echo "Para que la API funcione completamente necesitas:\n";
    echo "1. ConfiguracionesSistema (con valor_estiba_paga=80500)\n";
    echo "2. CostosTransporteDiario (puede estar vacía inicialmente)\n";
    echo "3. EncabPedido (para calcular estibas pagas)\n\n";
}

// 3. Verificar datos mínimos
echo "3. Verificando datos mínimos...\n";

// Configuración de estiba
$sql_config = "SELECT Valor FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga'";
$result_config = $enlace->query($sql_config);

if ($result_config && $result_config->num_rows > 0) {
    $row = $result_config->fetch_assoc();
    echo "   ✓ valor_estiba_paga = " . $row['Valor'] . "\n";
} else {
    echo "   ✗ valor_estiba_paga NO configurado\n";
    echo "   Ejecutar: INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) VALUES ('valor_estiba_paga', '80500', 'Valor unitario por estiba paga en COP');\n";
}

// Datos de costos
$sql_costos = "SELECT COUNT(*) as total FROM CostosTransporteDiario";
$result_costos = $enlace->query($sql_costos);
$row_costos = $result_costos->fetch_assoc();

echo "   CostosTransporteDiario: " . $row_costos['total'] . " registros\n";

if ($row_costos['total'] == 0) {
    echo "   NOTA: La API funcionará pero no mostrará datos hasta que haya costos registrados\n";
}

$enlace->close();

echo "\n=== RESUMEN ===\n";
echo "Para probar la funcionalidad:\n";
echo "1. Si todas las tablas existen ✓, puedes proceder\n";
echo "2. Si falta alguna tabla ✗, créala primero\n";
echo "3. La API usará datos reales si hay costos registrados\n";
echo "4. Si no hay costos, la API devolverá datos vacíos (pero funcionará)\n\n";

echo "Siguientes pasos:\n";
echo "1. Cambiar a API real en dashboardService.js\n";
echo "2. Probar en el navegador\n";
echo "3. Verificar que los gráficos se muestran\n";