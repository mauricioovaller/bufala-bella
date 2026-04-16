<?php
/**
 * Versión simplificada para pruebas
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST.']);
    exit;
}

// Datos de prueba simulados
$fechaInicio = '2025-01-01';
$fechaFin = '2025-03-31';

// Simular datos de respuesta
$response = [
    'success' => true,
    'app' => 'dibufala',
    'periodo' => [
        'inicio' => $fechaInicio,
        'fin' => $fechaFin
    ],
    'configuracion' => [
        'valorEstiba' => 80500,
        'valorEstibaFormateado' => '$80.500'
    ],
    'resumen' => [
        'diasConDatos' => 45,
        'totalCostoTransporte' => 12500000,
        'totalCostoTransporteFormateado' => '$12.500.000',
        'totalEstibasPagas' => 320,
        'totalValorEstibasPagas' => 25760000,
        'totalValorEstibasFormateado' => '$25.760.000',
        'totalCamiones' => 67
    ],
    'kpis' => [
        'costoTotal' => [
            'valor' => 12500000,
            'formateado' => '$12.500.000',
            'icono' => '🚚',
            'titulo' => 'Costo Total Transporte',
            'descripcion' => 'Sumatoria de todos los costos de transporte',
            'color' => '#8B5CF6'
        ],
        'estibasPagas' => [
            'valor' => 320,
            'formateado' => '320 estibas',
            'valorMonetario' => 25760000,
            'valorMonetarioFormateado' => '$25.760.000',
            'icono' => '📦',
            'titulo' => 'Estibas Pagas Totales',
            'descripcion' => 'Total de estibas pagas ($80.500 c/u)',
            'color' => '#10B981'
        ],
        'costoPromedioDiario' => [
            'valor' => 277778,
            'formateado' => '$277.778/día',
            'icono' => '📊',
            'titulo' => 'Costo Promedio Diario',
            'descripcion' => 'Promedio de costo de transporte por día',
            'color' => '#3B82F6'
        ],
        'relacionCostoEstiba' => [
            'valor' => 0.485,
            'formateado' => '48.5%',
            'interpretacion' => 'Buena',
            'icono' => '⚖️',
            'titulo' => 'Relación Costo/Estiba',
            'descripcion' => 'Porcentaje del costo vs valor de estibas',
            'color' => '#F59E0B'
        ]
    ],
    'graficos' => [
        'tendencia' => [
            [
                'fecha' => '2025-03-01',
                'fechaCorta' => '01/03',
                'costoTransporte' => 450000,
                'costoFormateado' => '$450.000',
                'cantidadCamiones' => 2,
                'costoPorCamion' => 225000,
                'observaciones' => 'Transporte normal'
            ],
            [
                'fecha' => '2025-03-02',
                'fechaCorta' => '02/03',
                'costoTransporte' => 520000,
                'costoFormateado' => '$520.000',
                'cantidadCamiones' => 3,
                'costoPorCamion' => 173333,
                'observaciones' => 'Flete especial'
            ],
            [
                'fecha' => '2025-03-03',
                'fechaCorta' => '03/03',
                'costoTransporte' => 380000,
                'costoFormateado' => '$380.000',
                'cantidadCamiones' => 1,
                'costoPorCamion' => 380000,
                'observaciones' => ''
            ]
        ],
        'comparacion' => [
            [
                'fecha' => '2025-03-01',
                'fechaCorta' => '01/03',
                'costoTransporte' => 450000,
                'costoFormateado' => '$450.000',
                'estibasPagas' => 15,
                'valorEstibasPagas' => 1207500,
                'valorEstibasFormateado' => '$1.207.500',
                'relacionCostoEstiba' => 0.372,
                'relacionPorcentaje' => 37.2
            ],
            [
                'fecha' => '2025-03-02',
                'fechaCorta' => '02/03',
                'costoTransporte' => 520000,
                'costoFormateado' => '$520.000',
                'estibasPagas' => 18,
                'valorEstibasPagas' => 1449000,
                'valorEstibasFormateado' => '$1.449.000',
                'relacionCostoEstiba' => 0.359,
                'relacionPorcentaje' => 35.9
            ],
            [
                'fecha' => '2025-03-03',
                'fechaCorta' => '03/03',
                'costoTransporte' => 380000,
                'costoFormateado' => '$380.000',
                'estibasPagas' => 12,
                'valorEstibasPagas' => 966000,
                'valorEstibasFormateado' => '$966.000',
                'relacionCostoEstiba' => 0.393,
                'relacionPorcentaje' => 39.3
            ]
        ]
    ],
    'mensaje' => 'Datos de prueba simulados para demostración'
];

echo json_encode($response);
?>