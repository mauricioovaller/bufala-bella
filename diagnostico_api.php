<?php
/**
 * Diagnóstico de la API de costos de transporte
 */

// Configuración
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Diagnóstico API Costos Transporte</h2>";

// 1. Verificar si el archivo existe
$api_file = 'src/Api/Dashboard/ApiDashboardCostosTransporte.php';
echo "<h3>1. Verificando archivo API</h3>";
echo "Archivo: $api_file<br>";

if (!file_exists($api_file)) {
    echo "<span style='color:red'>✗ NO existe</span><br>";
    exit;
}

echo "<span style='color:green'>✓ Existe</span><br>";

// 2. Verificar sintaxis PHP
echo "<h3>2. Verificando sintaxis PHP</h3>";
$output = [];
$return_var = 0;
exec("php -l " . escapeshellarg($api_file), $output, $return_var);

if ($return_var === 0) {
    echo "<span style='color:green'>✓ Sintaxis correcta</span><br>";
    foreach ($output as $line) {
        echo "&nbsp;&nbsp;$line<br>";
    }
} else {
    echo "<span style='color:red'>✗ Error de sintaxis</span><br>";
    foreach ($output as $line) {
        echo "&nbsp;&nbsp;$line<br>";
    }
}

// 3. Simular una ejecución simple
echo "<h3>3. Simulación de ejecución</h3>";

// Capturar cualquier output
ob_start();

// Incluir el archivo con datos de prueba simulados
$_SERVER['REQUEST_METHOD'] = 'POST';
$GLOBALS['HTTP_RAW_POST_DATA'] = json_encode([
    'app' => 'dibufala',
    'fechaInicio' => '2025-01-01',
    'fechaFin' => '2025-03-31'
]);

// Redirigir errores a output
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo "<span style='color:orange'>⚠ Error PHP: $errstr en $errfile:$errline</span><br>";
});

try {
    include $api_file;
} catch (Exception $e) {
    echo "<span style='color:red'>✗ Excepción: " . $e->getMessage() . "</span><br>";
}

$output = ob_get_clean();
restore_error_handler();

// Analizar el output
if (empty($output)) {
    echo "<span style='color:orange'>⚠ No hubo output (puede ser normal si hay error de conexión)</span><br>";
} else {
    echo "Output obtenido:<br>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    // Intentar decodificar JSON
    $json_start = strpos($output, '{');
    if ($json_start !== false) {
        $json_str = substr($output, $json_start);
        $data = json_decode($json_str, true);
        
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "<h4>JSON decodificado:</h4>";
            echo "<pre>" . print_r($data, true) . "</pre>";
            
            if (isset($data['success'])) {
                if ($data['success']) {
                    echo "<span style='color:green'>✓ API respondió exitosamente</span><br>";
                    echo "Mensaje: " . ($data['mensaje'] ?? 'Sin mensaje') . "<br>";
                    echo "Días con datos: " . ($data['resumen']['diasConDatos'] ?? 0) . "<br>";
                } else {
                    echo "<span style='color:red'>✗ API reportó error</span><br>";
                    echo "Error: " . ($data['message'] ?? 'Sin mensaje de error') . "<br>";
                }
            }
        } else {
            echo "<span style='color:red'>✗ No se pudo decodificar JSON: " . json_last_error_msg() . "</span><br>";
        }
    }
}

// 4. Verificar estructura esperada
echo "<h3>4. Estructura esperada de respuesta</h3>";
echo "La API debe devolver un JSON con esta estructura:<br>";
echo "<pre>{
  \"success\": true|false,
  \"app\": \"dibufala\",
  \"periodo\": {
    \"inicio\": \"YYYY-MM-DD\",
    \"fin\": \"YYYY-MM-DD\"
  },
  \"configuracion\": {
    \"valorEstiba\": 80500,
    \"valorEstibaFormateado\": \"$80.500\"
  },
  \"resumen\": {
    \"diasConDatos\": 0,
    \"totalCostoTransporte\": 0,
    \"totalCostoTransporteFormateado\": \"$0\",
    \"totalEstibasPagas\": 0,
    \"totalValorEstibasPagas\": 0,
    \"totalValorEstibasFormateado\": \"$0\",
    \"totalCamiones\": 0
  },
  \"kpis\": { ... },
  \"graficos\": {
    \"tendencia\": [],
    \"comparacion\": []
  },
  \"mensaje\": \"...\"
}</pre>";

echo "<h3>5. Recomendaciones</h3>";
echo "<ul>";
echo "<li>Si la API no responde: Verificar permisos de archivo y configuración del servidor</li>";
echo "<li>Si hay error de conexión a BD: Verificar credenciales en conexionbd.php</li>";
echo "<li>Si no hay datos: Verificar que haya registros en CostosTransporteDiario para el rango de fechas</li>";
echo "<li>Si el JSON es inválido: Revisar que no haya output antes del JSON (errores, warnings)</li>";
echo "</ul>";

// Limpiar variables globales
unset($GLOBALS['HTTP_RAW_POST_DATA']);
unset($_SERVER['REQUEST_METHOD']);