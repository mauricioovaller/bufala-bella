<?php
/**
 * Archivo de prueba para la API de costos de transporte
 * Para ejecutar: php -S localhost:8000 test_api_transporte.php
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Simular datos de entrada POST
$input = [
    'fechaInicio' => '2026-03-01',
    'fechaFin' => '2026-03-31',
    'app' => 'dibufala'
];

// Simular respuesta de la API
$response = [
    'success' => true,
    'app' => 'dibufala',
    'periodo' => [
        'inicio' => $input['fechaInicio'],
        'fin' => $input['fechaFin']
    ],
    'configuracion' => [
        'valorEstiba' => 80500,
        'valorEstibaFormateado' => '$80.500'
    ],
    'resumen' => [
        'diasConDatos' => 10,
        'totalCostoTransporte' => 4556759,
        'totalCostoTransporteFormateado' => '$4.556.759',
        'totalEstibasPagas' => 97,
        'totalValorEstibasPagas' => 7808500,
        'totalValorEstibasFormateado' => '$7.808.500',
        'totalCamiones' => 10
    ],
    'kpis' => [
        'costoTotal' => [
            'valor' => 4556759,
            'formateado' => '$4.556.759',
            'icono' => '💰',
            'titulo' => 'Costo Total Transporte',
            'descripcion' => 'Sumatoria de todos los costos de transporte en el período',
            'color' => '#8B5CF6'
        ],
        'estibasPagas' => [
            'valor' => 97,
            'formateado' => '97 estibas',
            'valorMonetario' => 7808500,
            'valorMonetarioFormateado' => '$7.808.500',
            'icono' => '📦',
            'titulo' => 'Estibas Pagas Totales',
            'descripcion' => 'Total de estibas pagas (80.500 c/u)',
            'color' => '#10B981'
        ],
        'costoPromedioDiario' => [
            'valor' => 455675.9,
            'formateado' => '$455.676/día',
            'icono' => '📊',
            'titulo' => 'Costo Promedio Diario',
            'descripcion' => 'Promedio de costo de transporte por día',
            'color' => '#3B82F6'
        ],
        'camionesTotales' => [
            'valor' => 10,
            'formateado' => '10 camiones',
            'costoPromedioCamion' => 455675.9,
            'costoPromedioCamionFormateado' => '$455.676',
            'icono' => '🚛',
            'titulo' => 'Camiones Totales',
            'descripcion' => 'Total de camiones utilizados en el período',
            'color' => '#6366F1'
        ]
    ],
    'graficos' => [
        'fletes' => [
            [
                'fecha' => '2026-03-12',
                'fechaCorta' => '12/03',
                'costoTransporte' => 450751,
                'costoFormateado' => '450.751',
                'cantidadCamiones' => 1,
                'costoPorCamion' => 450751,
                'observaciones' => 'HV',
                'sinDatos' => false
            ],
            [
                'fecha' => '2026-03-13',
                'fechaCorta' => '13/03',
                'costoTransporte' => 450751,
                'costoFormateado' => '450.751',
                'cantidadCamiones' => 1,
                'costoPorCamion' => 450751,
                'observaciones' => 'HV',
                'sinDatos' => false
            ],
            [
                'fecha' => '2026-03-14',
                'fechaCorta' => '14/03',
                'costoTransporte' => 0,
                'costoFormateado' => '0',
                'cantidadCamiones' => 0,
                'costoPorCamion' => 0,
                'observaciones' => '',
                'sinDatos' => true
            ]
        ],
        'estibas' => [
            [
                'fecha' => '2026-03-12',
                'fechaCorta' => '12/03',
                'estibasPagas' => 13,
                'valorEstibasPagas' => 1046500,
                'valorEstibasFormateado' => '1.046.500',
                'sinDatos' => false
            ],
            [
                'fecha' => '2026-03-13',
                'fechaCorta' => '13/03',
                'estibasPagas' => 5,
                'valorEstibasPagas' => 402500,
                'valorEstibasFormateado' => '402.500',
                'sinDatos' => false
            ],
            [
                'fecha' => '2026-03-14',
                'fechaCorta' => '14/03',
                'estibasPagas' => 0,
                'valorEstibasPagas' => 0,
                'valorEstibasFormateado' => '0',
                'sinDatos' => true
            ]
        ],
        'comparacion' => [
            [
                'fecha' => '2026-03-12',
                'fechaCorta' => '12/03',
                'costoTransporte' => 450751,
                'costoFormateado' => '450.751',
                'estibasPagas' => 13,
                'valorEstibasPagas' => 1046500,
                'valorEstibasFormateado' => '1.046.500',
                'sinDatos' => false
            ],
            [
                'fecha' => '2026-03-13',
                'fechaCorta' => '13/03',
                'costoTransporte' => 450751,
                'costoFormateado' => '450.751',
                'estibasPagas' => 5,
                'valorEstibasPagas' => 402500,
                'valorEstibasFormateado' => '402.500',
                'sinDatos' => false
            ],
            [
                'fecha' => '2026-03-14',
                'fechaCorta' => '14/03',
                'costoTransporte' => 0,
                'costoFormateado' => '0',
                'estibasPagas' => 0,
                'valorEstibasPagas' => 0,
                'valorEstibasFormateado' => '0',
                'sinDatos' => true
            ]
        ]
    ],
    'mensaje' => 'Datos obtenidos correctamente para 10 días con actividad'
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>