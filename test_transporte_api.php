<?php
/**
 * Archivo de prueba para la API de costos de transporte
 * Ejecutar desde el navegador o línea de comandos
 */

// Configuración básica
error_reporting(E_ALL);
ini_set('display_errors', 1);

// URL de la API
$api_url = 'https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Dashboard/ApiDashboardCostosTransporte.php';

// Datos de prueba
$data = [
    'app' => 'dibufala',
    'fechaInicio' => '2025-01-01',
    'fechaFin' => '2025-03-31'
];

// Configurar la solicitud
$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
    ],
];

$context  = stream_context_create($options);
$result = file_get_contents($api_url, false, $context);

if ($result === FALSE) {
    echo "Error: No se pudo conectar a la API\n";
    echo "URL: $api_url\n";
    echo "Error: " . error_get_last()['message'] . "\n";
} else {
    echo "Respuesta de la API:\n";
    echo "===================\n";
    $response = json_decode($result, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "Error decodificando JSON: " . json_last_error_msg() . "\n";
        echo "Respuesta cruda:\n";
        echo $result . "\n";
    } else {
        echo "Success: " . ($response['success'] ? 'true' : 'false') . "\n";
        
        if (isset($response['message'])) {
            echo "Message: " . $response['message'] . "\n";
        }
        
        if (isset($response['error'])) {
            echo "Error: " . $response['error'] . "\n";
        }
        
        if (isset($response['resumen'])) {
            echo "\nResumen:\n";
            echo "  Días con datos: " . ($response['resumen']['diasConDatos'] ?? 0) . "\n";
            echo "  Total costo transporte: " . ($response['resumen']['totalCostoTransporteFormateado'] ?? '0') . "\n";
            echo "  Total estibas pagas: " . ($response['resumen']['totalEstibasPagas'] ?? 0) . "\n";
        }
        
        if (isset($response['configuracion'])) {
            echo "\nConfiguración:\n";
            echo "  Valor estiba: " . ($response['configuracion']['valorEstibaFormateado'] ?? '0') . "\n";
        }
        
        if (isset($response['kpis']) && is_array($response['kpis'])) {
            echo "\nKPIs encontrados: " . count($response['kpis']) . "\n";
            foreach ($response['kpis'] as $key => $kpi) {
                echo "  - $key: " . ($kpi['titulo'] ?? 'Sin título') . "\n";
            }
        }
        
        if (isset($response['graficos']['tendencia'])) {
            echo "\nDatos de tendencia: " . count($response['graficos']['tendencia']) . " registros\n";
        }
        
        if (isset($response['graficos']['comparacion'])) {
            echo "Datos de comparación: " . count($response['graficos']['comparacion']) . " registros\n";
        }
    }
}

echo "\n\nPrueba completada.\n";