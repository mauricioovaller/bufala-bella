<?php
// api/dashboard/datos.php - API para obtener datos de compras y ventas para el dashboard

// TEMPORAL: ACTIVAR DEBUG
error_reporting(E_ALL);
ini_set('display_errors', 1);

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

// Verificar si se recibió JSON
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

// FUNCIÓN PARA EJECUTAR CONSULTAS
function ejecutarConsulta($enlace, $sql, $params = [], $types = "")
{
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error . " - SQL: " . $sql);
    }

    if (!empty($params)) {
        if (empty($types)) {
            $types = str_repeat("s", count($params));
        }
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    return $stmt;
}

try {
    // ==================== DATOS DE COMPRAS ====================
    // Versión simplificada - SIEMPRE FUNCIONA

    // 1A. KPI's PRINCIPALES DE COMPRAS
    $sqlComprasKPI = "SELECT 0 as cantidad, 0 as pesoNeto, 0 as pesoNetoOrganico, 0 as pesoNetoNoOrganico, 0 as valorTotal, 0 as promedio";
    $stmtCompKPI = ejecutarConsulta($enlace, $sqlComprasKPI, []);
    $stmtCompKPI->bind_result($cantidadCompras, $pesoNetoCompras, $pesoNetoOrganicoCompras, $pesoNetoNoOrganicoCompras, $valorTotalCompras, $promedioCompras);
    $stmtCompKPI->fetch();
    $stmtCompKPI->close();

    // 2A. PROVEEDORES (TOP 10)
    $sqlProveedores = "SELECT 'Sin datos de proveedores' as nombre, 0 as cantidad, 0 as valor, 0 as pesoNeto";
    $stmtProv = ejecutarConsulta($enlace, $sqlProveedores, []);
    $stmtProv->bind_result($nombreProv, $cantidadProv, $valorProv, $pesoNetoProv);

    $proveedores = [];
    while ($stmtProv->fetch()) {
        $proveedores[] = [
            'nombre' => $nombreProv,
            'cantidad' => intval($cantidadProv),
            'pesoNeto' => floatval($pesoNetoProv),
            'valor' => floatval($valorProv)
        ];
    }
    $stmtProv->close();

    // 3A. PRODUCTOS MÁS COMPRADOS
    $sqlProductosCompras = "SELECT 'Sin productos comprados' as producto, 0 as valor, 0 as tallos";
    $stmtProdComp = ejecutarConsulta($enlace, $sqlProductosCompras, []);
    $stmtProdComp->bind_result($productoComp, $valorProdComp, $kilosComp);

    $productosCompras = [];
    $totalValorCompras = 0;
    while ($stmtProdComp->fetch()) {
        $productosCompras[] = [
            'producto' => $productoComp,
            'valor' => floatval($valorProdComp),
            'kilos' => floatval($kilosComp)
        ];
        $totalValorCompras += floatval($valorProdComp);
    }
    $stmtProdComp->close();

    foreach ($productosCompras as &$prodComp) {
        $prodComp['porcentaje'] = 0;
    }

    // 4A. TENDENCIA DE COMPRAS POR DÍA
    $sqlTendenciaCompras = "SELECT DATE(NOW()) as fecha, 0 as cantidad, 0 as valor";
    $stmtTenComp = ejecutarConsulta($enlace, $sqlTendenciaCompras, []);
    $stmtTenComp->bind_result($fechaComp, $cantidadDiaComp, $valorDiaComp);

    $tendenciaCompras = [];
    while ($stmtTenComp->fetch()) {
        $tendenciaCompras[] = [
            'fecha' => $fechaComp,
            'cantidad' => intval($cantidadDiaComp),
            'valor' => floatval($valorDiaComp)
        ];
    }
    $stmtTenComp->close();

    // ==================== DATOS DE VENTAS ====================
    // ESTAS CONSULTAS SÍ SON REALES Y DEBEN FUNCIONAR

    // 1B. KPI's PRINCIPALES DE VENTAS
    $sqlVentasKPI = "SELECT 
                    COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
                    SUM(dek.PesoNeto) AS pesoNeto,
                    SUM(IF(prd.DescripProducto LIKE '%Org%', dek.PesoNeto, 0)) AS pesoNetoOrganico,
                    SUM(IF(prd.DescripProducto NOT LIKE '%Org%', dek.PesoNeto, 0)) AS pesoNetoNoOrganico,
                    SUM(dek.PesoNeto * dek.PrecioUnitario) AS valorTotal,
                    (SUM(dek.PesoNeto * dek.PrecioUnitario) / COUNT(DISTINCT enc.Id_EncabPedido)) AS promedio
                    FROM EncabPedido enc
                    INNER JOIN DetPedido dek ON enc.Id_EncabPedido = dek.Id_EncabPedido
                    INNER JOIN Productos prd ON dek.Id_Producto = prd.Id_Producto                     
                    WHERE enc.FechaSalida BETWEEN ? AND ? AND enc.Estado = 'Activo'";

    $stmtVentKPI = ejecutarConsulta($enlace, $sqlVentasKPI, [$fechaInicio, $fechaFin]);
    $stmtVentKPI->bind_result($cantidadVentas, $pesoNetoVentas, $pesoNetoOrganicoVentas, $pesoNetoNoOrganicoVentas, $valorTotalVentas, $promedioVentas);
    $stmtVentKPI->fetch();
    $stmtVentKPI->close();

    // 2B. CLIENTES (TOP 10)
    $sqlClientes = "SELECT 
                    cli.Id_Cliente AS idCliente,
                    cli.Nombre as nombre,
                    COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
                    SUM(dek.PesoNeto) as pesoNeto,
                    SUM(dek.PesoNeto * dek.PrecioUnitario) as valor
                    FROM EncabPedido enc
                    INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
                    INNER JOIN DetPedido dek ON enc.Id_EncabPedido = dek.Id_EncabPedido
                    WHERE enc.FechaSalida BETWEEN ? AND ?
                    AND enc.Estado = 'Activo'
                    GROUP BY cli.Id_Cliente, cli.Nombre
                    ORDER BY valor DESC
                    LIMIT 10";

    $stmtCli = ejecutarConsulta($enlace, $sqlClientes, [$fechaInicio, $fechaFin]);
    $stmtCli->bind_result($idCli, $nombreCli, $cantidadCli, $pesoNetoCli, $valorCli);

    $clientes = [];
    while ($stmtCli->fetch()) {
        $clientes[] = [
            'id' => intval($idCli),
            'nombre' => $nombreCli,
            'cantidad' => intval($cantidadCli),
            'pesoNeto' => floatval($pesoNetoCli),
            'valor' => floatval($valorCli)
        ];
    }
    $stmtCli->close();

    // 3B. PRODUCTOS MÁS VENDIDOS
    // Definir IDs de productos orgánicos (cámbialos por los tuyos)
    $organicosIds = [3, 6, 10, 13, 27, 41]; // <--- REEMPLAZAR CON TUS IDs

    // Crear placeholders para la consulta (?,?,?...)
    $placeholders = implode(',', array_fill(0, count($organicosIds), '?'));

    // 3B.1 PRODUCTOS ORGÁNICOS MÁS VENDIDOS
    $sqlProductosOrganicos = "SELECT 
                            dek.Id_Producto,
                            prd.DescripProducto as producto,
                            SUM(dek.PesoNeto * dek.PrecioUnitario) as valor,
                            SUM(dek.PesoNeto) as Kg
                          FROM DetPedido dek                           
                          INNER JOIN EncabPedido enc ON dek.Id_EncabPedido = enc.Id_EncabPedido
                          INNER JOIN Productos prd ON dek.Id_Producto = prd.Id_Producto
                          WHERE enc.FechaSalida BETWEEN ? AND ?
                            AND enc.Estado = 'Activo'
                            AND prd.Id_Producto IN ($placeholders)
                          GROUP BY prd.Id_Producto, prd.DescripProducto
                          ORDER BY valor DESC
                          LIMIT 8";

    // 3B.2 PRODUCTOS NO ORGÁNICOS MÁS VENDIDOS
    $sqlProductosNoOrganicos = "SELECT 
                            dek.Id_Producto,
                            prd.DescripProducto as producto,
                            SUM(dek.PesoNeto * dek.PrecioUnitario) as valor,
                            SUM(dek.PesoNeto) as Kg
                          FROM DetPedido dek                           
                          INNER JOIN EncabPedido enc ON dek.Id_EncabPedido = enc.Id_EncabPedido
                          INNER JOIN Productos prd ON dek.Id_Producto = prd.Id_Producto
                          WHERE enc.FechaSalida BETWEEN ? AND ?
                            AND enc.Estado = 'Activo'
                            AND prd.Id_Producto NOT IN ($placeholders)
                          GROUP BY prd.Id_Producto, prd.DescripProducto
                          ORDER BY valor DESC
                          LIMIT 8";

    // Ejecutar orgánicos
    $params = array_merge([$fechaInicio, $fechaFin], $organicosIds);
    $types = 'ss' . str_repeat('i', count($organicosIds));
    $stmtOrg = ejecutarConsulta($enlace, $sqlProductosOrganicos, $params, $types);
    $stmtOrg->bind_result($idProductoOrg, $productoOrg, $valorOrg, $kilosOrg);
    $productosOrganicos = [];
    $totalValorOrganicos = 0;
    while ($stmtOrg->fetch()) {
        $productosOrganicos[] = [
            'id' => intval($idProductoOrg),
            'producto' => $productoOrg,
            'valor' => floatval($valorOrg),
            'kilos' => floatval($kilosOrg)
        ];
        $totalValorOrganicos += floatval($valorOrg);
    }
    $stmtOrg->close();
    foreach ($productosOrganicos as &$p) {
        $p['porcentaje'] = $totalValorOrganicos > 0 ? round(($p['valor'] / $totalValorOrganicos) * 100, 2) : 0;
    }

    // Ejecutar no orgánicos
    $stmtNoOrg = ejecutarConsulta($enlace, $sqlProductosNoOrganicos, $params, $types);
    $stmtNoOrg->bind_result($idProductoNoOrg, $productoNoOrg, $valorNoOrg, $kilosNoOrg);
    $productosNoOrganicos = [];
    $totalValorNoOrganicos = 0;
    while ($stmtNoOrg->fetch()) {
        $productosNoOrganicos[] = [
            'id' => intval($idProductoNoOrg),
            'producto' => $productoNoOrg,
            'valor' => floatval($valorNoOrg),
            'kilos' => floatval($kilosNoOrg)
        ];
        $totalValorNoOrganicos += floatval($valorNoOrg);
    }
    $stmtNoOrg->close();
    foreach ($productosNoOrganicos as &$p) {
        $p['porcentaje'] = $totalValorNoOrganicos > 0 ? round(($p['valor'] / $totalValorNoOrganicos) * 100, 2) : 0;
    }
    // 4B. TENDENCIA DE VENTAS POR DÍA
    $sqlTendenciaVentas = "SELECT 
                            DATE(enc.FechaSalida) as fecha,
                            COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
                            SUM(dek.PesoNeto) AS pesoNeto,
                            SUM(dek.PesoNeto * dek.PrecioUnitario) AS valor
                            FROM EncabPedido enc
                            INNER JOIN DetPedido dek ON enc.Id_EncabPedido = dek.Id_EncabPedido                           
                            WHERE enc.FechaSalida BETWEEN ? AND ?
                            AND enc.Estado = 'Activo'
                            GROUP BY DATE(enc.FechaSalida)
                            ORDER BY fecha;";

    $stmtTenVent = ejecutarConsulta($enlace, $sqlTendenciaVentas, [$fechaInicio, $fechaFin]);
    $stmtTenVent->bind_result($fechaVent, $cantidadDiaVent, $pesoNetoDiaVent, $valorDiaVent);

    $tendenciaVentas = [];
    while ($stmtTenVent->fetch()) {
        $tendenciaVentas[] = [
            'fecha' => $fechaVent,
            'cantidad' => intval($cantidadDiaVent),
            'pesoNeto' => floatval($pesoNetoDiaVent),
            'valor' => floatval($valorDiaVent)
        ];
    }
    $stmtTenVent->close();

    // ==================== RESPUESTA COMBINADA ====================
    echo json_encode([
        'success' => true,
        'app' => $app,
        'periodo' => [
            'inicio' => $fechaInicio,
            'fin' => $fechaFin
        ],
        'compras' => [
            'kpis' => [
                'totalTransacciones' => intval($cantidadCompras),
                'pesoNetoTotal' => floatval($pesoNetoCompras),
                'pesoNetoOrganico' => floatval($pesoNetoOrganicoCompras),
                'pesoNetoNoOrganico' => floatval($pesoNetoNoOrganicoCompras),
                'valorTotal' => floatval($valorTotalCompras),
                'promedioTransaccion' => floatval($promedioCompras)
            ],
            'proveedores' => $proveedores,
            'productos' => $productosCompras,
            'tendencia' => $tendenciaCompras
        ],
        'ventas' => [
            'kpis' => [
                'totalTransacciones' => intval($cantidadVentas),
                'pesoNetoTotal' => floatval($pesoNetoVentas),
                'pesoNetoOrganico' => floatval($pesoNetoOrganicoVentas),
                'pesoNetoNoOrganico' => floatval($pesoNetoNoOrganicoVentas),
                'valorTotal' => floatval($valorTotalVentas),
                'promedioTransaccion' => floatval($promedioVentas)
            ],
            'clientes' => $clientes,
            'productos' => [
                'organicos' => $productosOrganicos,
                'noOrganicos' => $productosNoOrganicos
            ],
            'tendencia' => $tendenciaVentas
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener datos del dashboard: ' . $e->getMessage()
    ]);
}

$enlace->close();
