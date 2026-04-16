<?php
/**
 * Prueba rápida de la API real de costos de transporte
 * Para ejecutar desde navegador o línea de comandos
 */

// Simular una petición POST
$_SERVER['REQUEST_METHOD'] = 'POST';

// Datos de prueba
$test_data = [
    'app' => 'dibufala',
    'fechaInicio' => '2025-01-01',
    'fechaFin' => '2025-03-31'
];

// Convertir a JSON para simular el input
$json_input = json_encode($test_data);

// Guardar el input original
$original_input = file_get_contents("php://input");

// Sobrescribir el input para la prueba
$GLOBALS['HTTP_RAW_POST_DATA'] = $json_input;

// Incluir la API
include 'src/Api/Dashboard/ApiDashboardCostosTransporte.php';

// Restaurar
unset($GLOBALS['HTTP_RAW_POST_DATA']);