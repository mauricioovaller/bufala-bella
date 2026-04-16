<?php
/**
 * ApiDashboardCostosTransporte.php
 * API para obtener datos consolidados de costos de transporte y estibas pagas
 * para gráficos del dashboard
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST.']);
    exit;
}

// Obtener datos del body (JSON)
$json = file_get_contents("php://input");
$input = json_decode($json, true) ?? [];

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error decodificando JSON: ' . json_last_error_msg()
    ]);
    exit;
}

$fechaInicio = $input['fechaInicio'] ?? date('Y-m-01');
$fechaFin = $input['fechaFin'] ?? date('Y-m-d');
$app = $input['app'] ?? 'dibufala';

// Validar formato de fechas
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaInicio) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaFin)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Formato de fecha inválido. Use YYYY-MM-DD'
    ]);
    exit;
}

// Validar que fecha inicio <= fecha fin
if (strtotime($fechaInicio) > strtotime($fechaFin)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'La fecha de inicio no puede ser mayor a la fecha de fin'
    ]);
    exit;
}

// INCLUIR CONEXIÓN
$conexion_path = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
if (!file_exists($conexion_path)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Archivo de conexión no encontrado']);
    exit;
}

include $conexion_path;

// VERIFICAR CONEXIÓN
if (!isset($enlace) || $enlace->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . ($enlace->connect_error ?? 'Variable de conexión no definida')
    ]);
    exit;
}

$enlace->set_charset("utf8mb4");

try {
    // =================================================================
    // 1. OBTENER VALOR DE ESTIBA PAGA DESDE CONFIGURACIÓN
    // =================================================================
    $valorEstiba = 80500; // Valor por defecto
    
    // Primero verificar si la tabla existe
    $sqlCheckTable = "SHOW TABLES LIKE 'ConfiguracionesSistema'";
    $resultCheck = $enlace->query($sqlCheckTable);
    
    if ($resultCheck && $resultCheck->num_rows > 0) {
        // La tabla existe, intentar obtener el valor
        $sqlConfig = "SELECT Valor FROM ConfiguracionesSistema WHERE Clave = 'valor_estiba_paga' LIMIT 1";
        $stmtConfig = $enlace->prepare($sqlConfig);
        
        if ($stmtConfig) {
            if ($stmtConfig->execute()) {
                $stmtConfig->bind_result($configValor);
                if ($stmtConfig->fetch()) {
                    $valorEstiba = (float)$configValor;
                } else {
                    // No hay configuración, usar valor por defecto
                    error_log("Configuración 'valor_estiba_paga' no encontrada en ConfiguracionesSistema. Usando valor por defecto: 80500");
                }
            }
            $stmtConfig->close();
        }
    } else {
        // La tabla no existe, usar valor por defecto
        error_log("Tabla 'ConfiguracionesSistema' no encontrada. Usando valor por defecto para estiba: 80500");
    }
    
    // =================================================================
    // 2. CONSULTA PRINCIPAL: COSTOS DE TRANSPORTE + ESTIBAS PAGAS
    // =================================================================
    $sql = "
        SELECT 
            -- Fecha (siempre de todas_fechas)
            todas_fechas.Fecha,
            DATE_FORMAT(todas_fechas.Fecha, '%Y-%m-%d') AS FechaFormato,
            DATE_FORMAT(todas_fechas.Fecha, '%d/%m') AS FechaCorta,
            
            -- Costos de transporte (pueden ser NULL)
            COALESCE(ctd.ValorFlete, 0) AS CostoTransporte,
            COALESCE(ctd.CantidadCamiones, 0) AS CantidadCamiones,
            COALESCE(ctd.Observaciones, '') AS Observaciones,
            
            -- Estibas pagas (consolidado por fecha)
            COALESCE(ep.TotalEstibasPagas, 0) AS EstibasPagas,
            
            -- Cálculos derivados
            COALESCE(ep.TotalEstibasPagas, 0) * ? AS ValorEstibasPagas,
            
            -- Costo por camión
            CASE 
                WHEN COALESCE(ctd.CantidadCamiones, 0) > 0 
                THEN ROUND(COALESCE(ctd.ValorFlete, 0) / ctd.CantidadCamiones, 0)
                ELSE 0 
            END AS CostoPorCamion
            
        FROM (
            -- Generar todas las fechas en el rango
            SELECT DATE_ADD(?, INTERVAL t4.i*1000 + t3.i*100 + t2.i*10 + t1.i DAY) AS Fecha
            FROM 
                (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t1,
                (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t2,
                (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t3,
                (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) t4
            WHERE DATE_ADD(?, INTERVAL t4.i*1000 + t3.i*100 + t2.i*10 + t1.i DAY) <= ?
        ) todas_fechas
        
        LEFT JOIN CostosTransporteDiario ctd ON todas_fechas.Fecha = ctd.Fecha
        
        LEFT JOIN (
            -- Subconsulta para estibas pagas por fecha
            SELECT
                FechaSalida,
                SUM(EstibasPagas) AS TotalEstibasPagas
            FROM (
                SELECT 
                    enc.FechaSalida,
                    enc.Id_EncabPedido,
                    enc.CantidadEstibas,
                    SUM(det.Cantidad) AS TotalCantidad,
                    CASE 
                        WHEN SUM(det.Cantidad) < 20 THEN 0 
                        ELSE enc.CantidadEstibas 
                    END AS EstibasPagas
                FROM EncabPedido enc
                INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                WHERE enc.FechaSalida BETWEEN ? AND ?
                    AND enc.Estado = 'Activo'
                GROUP BY enc.Id_EncabPedido, enc.FechaSalida, enc.CantidadEstibas
            ) AS pedidos_agrupados
            GROUP BY FechaSalida
        ) ep ON todas_fechas.Fecha = ep.FechaSalida
        
        ORDER BY todas_fechas.Fecha ASC
    ";
    
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }
    
    // Bind parameters: valorEstiba se usa 1 vez, luego fechas para generación de rango, luego fechas para subconsulta
    $stmt->bind_param("dsssss", 
        $valorEstiba,        // Para ValorEstibasPagas
        $fechaInicio,        // Para generación de rango (inicio)
        $fechaInicio,        // Para generación de rango (inicio 2)
        $fechaFin,           // Para generación de rango (fin)
        $fechaInicio,        // Para subconsulta estibas (inicio)
        $fechaFin            // Para subconsulta estibas (fin)
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }
    
    // Bind results
    $stmt->bind_result(
        $fecha,
        $fechaFormato,
        $fechaCorta,
        $costoTransporte,
        $cantidadCamiones,
        $observaciones,
        $estibasPagas,
        $valorEstibasPagas,
        $costoPorCamion
    );
    
    $datosFletes = [];
    $datosEstibas = [];
    $datosComparacion = [];
    $totalCostoTransporte = 0;
    $totalEstibasPagas = 0;
    $totalValorEstibasPagas = 0;
    $totalCamiones = 0;
    $diasConDatos = 0;
    
    while ($stmt->fetch()) {
        // Contar días con datos reales (no solo con fecha)
        if ($costoTransporte > 0 || $estibasPagas > 0) {
            $diasConDatos++;
        }
        
        // Acumular totales (solo datos reales)
        $totalCostoTransporte += (float)$costoTransporte;
        $totalEstibasPagas += (int)$estibasPagas;
        $totalValorEstibasPagas += (float)$valorEstibasPagas;
        $totalCamiones += (int)$cantidadCamiones;
        
        // Datos para gráfico de tendencia de fletes (línea)
        $datosFletes[] = [
            'fecha' => $fechaFormato,
            'fechaCorta' => $fechaCorta,
            'costoTransporte' => (float)$costoTransporte,
            'costoFormateado' => $costoTransporte > 0 ? number_format($costoTransporte, 0, ',', '.') : '0',
            'cantidadCamiones' => (int)$cantidadCamiones,
            'costoPorCamion' => (float)$costoPorCamion,
            'observaciones' => $observaciones ?: '',
            'sinDatos' => $costoTransporte == 0 // Flag para días sin datos
        ];
        
        // Datos para gráfico de estibas pagas (barras)
        $datosEstibas[] = [
            'fecha' => $fechaFormato,
            'fechaCorta' => $fechaCorta,
            'estibasPagas' => (int)$estibasPagas,
            'valorEstibasPagas' => (float)$valorEstibasPagas,
            'valorEstibasFormateado' => $valorEstibasPagas > 0 ? number_format($valorEstibasPagas, 0, ',', '.') : '0',
            'sinDatos' => $estibasPagas == 0 // Flag para días sin datos
        ];
        
        // Datos para gráfico de comparación acumulada
        $datosComparacion[] = [
            'fecha' => $fechaFormato,
            'fechaCorta' => $fechaCorta,
            'costoTransporte' => (float)$costoTransporte,
            'costoFormateado' => $costoTransporte > 0 ? number_format($costoTransporte, 0, ',', '.') : '0',
            'estibasPagas' => (int)$estibasPagas,
            'valorEstibasPagas' => (float)$valorEstibasPagas,
            'valorEstibasFormateado' => $valorEstibasPagas > 0 ? number_format($valorEstibasPagas, 0, ',', '.') : '0',
            'sinDatos' => $costoTransporte == 0 && $estibasPagas == 0 // Flag para días sin datos
        ];
    }
    
    $stmt->close();
    
    // =================================================================
    // 3. CÁLCULO DE KPIs Y MÉTRICAS
    // =================================================================
    $kpis = [];
    
    if ($diasConDatos > 0) {
        // KPI 1: Costo Total de Transporte
        $kpis['costoTotal'] = [
            'valor' => (float)$totalCostoTransporte,
            'formateado' => '$' . number_format($totalCostoTransporte, 0, ',', '.'),
            'icono' => '🚚',
            'titulo' => 'Costo Total Transporte',
            'descripcion' => 'Sumatoria de todos los costos de transporte en el período',
            'color' => '#8B5CF6'
        ];
        
        // KPI 2: Estibas Pagas Totales
        $kpis['estibasPagas'] = [
            'valor' => (int)$totalEstibasPagas,
            'formateado' => number_format($totalEstibasPagas, 0, ',', '.') . ' estibas',
            'valorMonetario' => (float)$totalValorEstibasPagas,
            'valorMonetarioFormateado' => '$' . number_format($totalValorEstibasPagas, 0, ',', '.'),
            'icono' => '📦',
            'titulo' => 'Estibas Pagas Totales',
            'descripcion' => 'Total de estibas pagas (' . number_format($valorEstiba, 0, ',', '.') . ' c/u)',
            'color' => '#10B981'
        ];
        
        // KPI 3: Costo Promedio Diario
        $costoPromedioDiario = $totalCostoTransporte / $diasConDatos;
        $kpis['costoPromedioDiario'] = [
            'valor' => (float)$costoPromedioDiario,
            'formateado' => '$' . number_format($costoPromedioDiario, 0, ',', '.') . '/día',
            'icono' => '📊',
            'titulo' => 'Costo Promedio Diario',
            'descripcion' => 'Promedio de costo de transporte por día',
            'color' => '#3B82F6'
        ];
        
        // KPI 4: Camiones Totales
        $kpis['camionesTotales'] = [
            'valor' => (int)$totalCamiones,
            'formateado' => number_format($totalCamiones, 0, ',', '.') . ' camiones',
            'costoPromedioCamion' => $totalCamiones > 0 ? $totalCostoTransporte / $totalCamiones : 0,
            'costoPromedioCamionFormateado' => '$' . number_format($totalCamiones > 0 ? $totalCostoTransporte / $totalCamiones : 0, 0, ',', '.'),
            'icono' => '🚛',
            'titulo' => 'Camiones Totales',
            'descripcion' => 'Total de camiones utilizados en el período',
            'color' => '#6366F1'
        ];
    }
    
    // =================================================================
    // 4. PREPARAR RESPUESTA
    // =================================================================
    $response = [
        'success' => true,
        'app' => $app,
        'periodo' => [
            'inicio' => $fechaInicio,
            'fin' => $fechaFin
        ],
        'configuracion' => [
            'valorEstiba' => $valorEstiba,
            'valorEstibaFormateado' => '$' . number_format($valorEstiba, 0, ',', '.')
        ],
        'resumen' => [
            'diasConDatos' => $diasConDatos,
            'totalCostoTransporte' => (float)$totalCostoTransporte,
            'totalCostoTransporteFormateado' => '$' . number_format($totalCostoTransporte, 0, ',', '.'),
            'totalEstibasPagas' => (int)$totalEstibasPagas,
            'totalValorEstibasPagas' => (float)$totalValorEstibasPagas,
            'totalValorEstibasFormateado' => '$' . number_format($totalValorEstibasPagas, 0, ',', '.'),
            'totalCamiones' => (int)$totalCamiones
        ],
        'kpis' => $kpis,
        'graficos' => [
            'fletes' => $datosFletes,
            'estibas' => $datosEstibas,
            'comparacion' => $datosComparacion
        ],
        'mensaje' => $diasConDatos > 0 
            ? "Datos obtenidos correctamente para {$diasConDatos} días con actividad" 
            : "No se encontraron datos de costos de transporte para el período seleccionado"
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener datos de costos de transporte: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>