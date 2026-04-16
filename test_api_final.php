<?php
/**
 * Prueba final de la API corregida
 */

// Para ejecutar desde navegador: 
// http://localhost/ruta/a/test_api_final.php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Prueba de API Corregida</h1>";

// Incluir la API directamente con datos de prueba
$_SERVER['REQUEST_METHOD'] = 'POST';

// Datos de prueba
$test_data = json_encode([
    'app' => 'dibufala',
    'fechaInicio' => '2025-01-01',
    'fechaFin' => '2025-03-31'
]);

// Usar stream para simular php://input
$stream = fopen('php://memory', 'r+');
fwrite($stream, $test_data);
rewind($stream);

// Guardar el stream original y reemplazarlo
$original_stream = fopen('php://input', 'r');
stream_copy_to_stream($stream, $original_stream);

// También configurar HTTP_RAW_POST_DATA para compatibilidad
$GLOBALS['HTTP_RAW_POST_DATA'] = $test_data;

// Incluir la API
echo "<h2>Incluyendo API...</h2>";
include 'src/Api/Dashboard/ApiDashboardCostosTransporte.php';

// Limpiar
fclose($stream);
fclose($original_stream);
unset($GLOBALS['HTTP_RAW_POST_DATA']);

echo "<hr>";
echo "<h2>Instrucciones para probar:</h2>";
echo "<ol>";
echo "<li>Verificar que no haya errores PHP arriba</li>";
echo "<li>Si hay errores, corregirlos según el mensaje</li>";
echo "<li>Si no hay errores, la API debería mostrar un JSON</li>";
echo "<li>Probar en el dashboard cambiando el rango de fechas</li>";
echo "</ol>";

echo "<h2>Si hay problemas comunes:</h2>";
echo "<ul>";
echo "<li><strong>Error de conexión a BD:</strong> Verificar archivo conexionbd.php</li>";
echo "<li><strong>Error en consulta SQL:</strong> Verificar que las tablas existan</li>";
echo "<li><strong>No hay datos:</strong> Verificar que haya registros en CostosTransporteDiario</li>";
echo "<li><strong>JSON inválido:</strong> Verificar que no haya output antes del JSON</li>";
echo "</ul>";