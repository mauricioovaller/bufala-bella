<?php
// api/dashboard/datos_chile.php - API para obtener datos de ventas Chile para el dashboard
// Réplica de datos.php usando las tablas Chile (EncabPedidoChile, DetPedidoChile, ProductosChile, ClientesChile)
// Clasificación de productos: PlanVallejo = 1 (grupo 1) vs PlanVallejo = 0 (grupo 2)

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST.']);
    exit;
}

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
$app = $input['app'] ?? 'chile';

$conexion_path = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
if (!file_exists($conexion_path)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Archivo de conexión no encontrado']);
    exit;
}

include $conexion_path;

if (!isset($enlace) || $enlace->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . ($enlace->connect_error ?? 'Variable de conexión no definida')
    ]);
    exit;
}

$enlace->set_charset("utf8mb4");

function ejecutarConsultaChile($enlace, $sql, $params = [], $types = "")
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
    // ==================== DATOS DE COMPRAS (stub, igual que Colombia) ====================
    $sqlComprasKPI = "SELECT 0 as cantidad, 0 as pesoNeto, 0 as pesoNetoOrganico, 0 as pesoNetoNoOrganico, 0 as valorTotal, 0 as promedio";
    $stmtCompKPI = ejecutarConsultaChile($enlace, $sqlComprasKPI, []);
    $stmtCompKPI->bind_result($cantidadCompras, $pesoNetoCompras, $pesoNetoOrganicoCompras, $pesoNetoNoOrganicoCompras, $valorTotalCompras, $promedioCompras);
    $stmtCompKPI->fetch();
    $stmtCompKPI->close();

    $sqlProveedores = "SELECT 'Sin datos de proveedores' as nombre, 0 as cantidad, 0 as valor, 0 as pesoNeto";
    $stmtProv = ejecutarConsultaChile($enlace, $sqlProveedores, []);
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

    $sqlProductosCompras = "SELECT 'Sin productos comprados' as producto, 0 as valor, 0 as tallos";
    $stmtProdComp = ejecutarConsultaChile($enlace, $sqlProductosCompras, []);
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

    $sqlTendenciaCompras = "SELECT DATE(NOW()) as fecha, 0 as cantidad, 0 as valor";
    $stmtTenComp = ejecutarConsultaChile($enlace, $sqlTendenciaCompras, []);
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

    // ==================== DATOS DE VENTAS CHILE ====================

    // 1B. KPI's PRINCIPALES DE VENTAS CHILE
    // Clasificación: PlanVallejo = 1 (grupo 1) vs PlanVallejo = 0 (grupo 2)
    $sqlVentasKPI = "SELECT 
                    COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
                    SUM(dek.PesoNeto) AS pesoNeto,
                    SUM(IF(prd.PlanVallejo = 1, dek.PesoNeto, 0)) AS pesoNetoOrganico,
                    SUM(IF(prd.PlanVallejo = 0, dek.PesoNeto, 0)) AS pesoNetoNoOrganico,
                    SUM(dek.PesoNeto * dek.PrecioUnitario) AS valorTotal,
                    (SUM(dek.PesoNeto * dek.PrecioUnitario) / COUNT(DISTINCT enc.Id_EncabPedido)) AS promedio
                    FROM EncabPedidoChile enc
                    INNER JOIN DetPedidoChile dek ON enc.Id_EncabPedido = dek.Id_EncabPedido
                    INNER JOIN ProductosChile prd ON dek.Id_Producto = prd.Id_Producto                     
                    WHERE enc.FechaSalida BETWEEN ? AND ? AND enc.Estado = 'Activo'";

    $stmtVentKPI = ejecutarConsultaChile($enlace, $sqlVentasKPI, [$fechaInicio, $fechaFin]);
    $stmtVentKPI->bind_result($cantidadVentas, $pesoNetoVentas, $pesoNetoOrganicoVentas, $pesoNetoNoOrganicoVentas, $valorTotalVentas, $promedioVentas);
    $stmtVentKPI->fetch();
    $stmtVentKPI->close();

    // Restar notas crédito activas de los KPIs de ventas Chile
    $sqlNotasCredito = "SELECT 
                        COALESCE(SUM(dnc.PesoNetoCredito), 0) AS pesoNetoNC,
                        COALESCE(SUM(dnc.ValorCreditoCOP), 0) AS valorTotalNC
                      FROM EncabNotaCreditoChile encNC
                      INNER JOIN DetNotaCreditoChile dnc ON encNC.Id_EncabNotaCredito = dnc.Id_EncabNotaCredito
                      WHERE dnc.FechaSalidaPedido BETWEEN ? AND ? AND encNC.Estado = 'Activo'";

    $stmtNC = ejecutarConsultaChile($enlace, $sqlNotasCredito, [$fechaInicio, $fechaFin]);
    $stmtNC->bind_result($pesoNetoNC, $valorTotalNC);
    $stmtNC->fetch();
    $stmtNC->close();

    $pesoNetoVentas = floatval($pesoNetoVentas) - floatval($pesoNetoNC);
    $valorTotalVentas = floatval($valorTotalVentas) - floatval($valorTotalNC);
    // Ajustar grupo 1/grupo 2 proporcionalmente si hay NC
    if (floatval($pesoNetoNC) > 0 && (floatval($pesoNetoOrganicoVentas) + floatval($pesoNetoNoOrganicoVentas)) > 0) {
        $totalPesoOriginal = floatval($pesoNetoOrganicoVentas) + floatval($pesoNetoNoOrganicoVentas) + floatval($pesoNetoNC);
        $proporcionOrganico = $totalPesoOriginal > 0 ? floatval($pesoNetoOrganicoVentas) / $totalPesoOriginal : 0;
        $pesoNetoOrganicoVentas = floatval($pesoNetoOrganicoVentas) - (floatval($pesoNetoNC) * $proporcionOrganico);
        $pesoNetoNoOrganicoVentas = floatval($pesoNetoNoOrganicoVentas) - (floatval($pesoNetoNC) * (1 - $proporcionOrganico));
    }
    $promedioVentas = $cantidadVentas > 0 ? $valorTotalVentas / $cantidadVentas : 0;

    // 2B. CLIENTES (TOP 10) CHILE - con descuento de notas crédito
    $sqlClientes = "SELECT 
                    cli.Id_Cliente AS idCliente,
                    cli.Nombre as nombre,
                    COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
                    COALESCE(SUM(dek.PesoNeto), 0) - COALESCE(nc.pesoNetoNC, 0) as pesoNeto,
                    COALESCE(SUM(dek.PesoNeto * dek.PrecioUnitario), 0) - COALESCE(nc.valorNC, 0) as valor
                    FROM EncabPedidoChile enc
                    INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
                    INNER JOIN DetPedidoChile dek ON enc.Id_EncabPedido = dek.Id_EncabPedido
                    LEFT JOIN (
                        SELECT encNC.Id_Cliente,
                               SUM(dnc.PesoNetoCredito) AS pesoNetoNC,
                               SUM(dnc.ValorCreditoCOP) AS valorNC
                        FROM EncabNotaCreditoChile encNC
                        INNER JOIN DetNotaCreditoChile dnc ON encNC.Id_EncabNotaCredito = dnc.Id_EncabNotaCredito
                        WHERE dnc.FechaSalidaPedido BETWEEN ? AND ? AND encNC.Estado = 'Activo'
                        GROUP BY encNC.Id_Cliente
                    ) nc ON enc.Id_Cliente = nc.Id_Cliente
                    WHERE enc.FechaSalida BETWEEN ? AND ?
                    AND enc.Estado = 'Activo'
                    GROUP BY cli.Id_Cliente, cli.Nombre
                    HAVING valor > 0
                    ORDER BY valor DESC
                    LIMIT 10";

    $stmtCli = ejecutarConsultaChile($enlace, $sqlClientes, [$fechaInicio, $fechaFin, $fechaInicio, $fechaFin]);
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

    // 3B. PRODUCTOS MÁS VENDIDOS CHILE (PlanVallejo = 1 vs PlanVallejo = 0)

    // 3B.1 PRODUCTOS GRUPO PLAN VALLEJO (PlanVallejo = 1)
    $sqlProductosOrganicos = "SELECT 
                            dek.Id_Producto,
                            prd.DescripProducto as producto,
                            SUM(dek.PesoNeto * dek.PrecioUnitario) as valor,
                            SUM(dek.PesoNeto) as Kg
                          FROM DetPedidoChile dek                           
                          INNER JOIN EncabPedidoChile enc ON dek.Id_EncabPedido = enc.Id_EncabPedido
                          INNER JOIN ProductosChile prd ON dek.Id_Producto = prd.Id_Producto
                          WHERE enc.FechaSalida BETWEEN ? AND ?
                            AND enc.Estado = 'Activo'
                            AND prd.PlanVallejo = 1
                          GROUP BY prd.Id_Producto, prd.DescripProducto
                          ORDER BY valor DESC
                          LIMIT 8";

    // 3B.2 PRODUCTOS NO PLAN VALLEJO (PlanVallejo = 0)
    $sqlProductosNoOrganicos = "SELECT 
                            dek.Id_Producto,
                            prd.DescripProducto as producto,
                            SUM(dek.PesoNeto * dek.PrecioUnitario) as valor,
                            SUM(dek.PesoNeto) as Kg
                          FROM DetPedidoChile dek                           
                          INNER JOIN EncabPedidoChile enc ON dek.Id_EncabPedido = enc.Id_EncabPedido
                          INNER JOIN ProductosChile prd ON dek.Id_Producto = prd.Id_Producto
                          WHERE enc.FechaSalida BETWEEN ? AND ?
                            AND enc.Estado = 'Activo'
                            AND prd.PlanVallejo = 0
                          GROUP BY prd.Id_Producto, prd.DescripProducto
                          ORDER BY valor DESC
                          LIMIT 8";

    $stmtOrg = ejecutarConsultaChile($enlace, $sqlProductosOrganicos, [$fechaInicio, $fechaFin]);
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

    $stmtNoOrg = ejecutarConsultaChile($enlace, $sqlProductosNoOrganicos, [$fechaInicio, $fechaFin]);
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

    // 4B. TENDENCIA DE VENTAS POR DÍA CHILE - con descuento de notas crédito
    $sqlTendenciaVentas = "SELECT 
                            DATE(enc.FechaSalida) as fecha,
                            COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
                            COALESCE(SUM(dek.PesoNeto), 0) - COALESCE(nc.pesoNetoNC, 0) AS pesoNeto,
                            COALESCE(SUM(dek.PesoNeto * dek.PrecioUnitario), 0) - COALESCE(nc.valorNC, 0) AS valor
                            FROM EncabPedidoChile enc
                            INNER JOIN DetPedidoChile dek ON enc.Id_EncabPedido = dek.Id_EncabPedido
                            LEFT JOIN (
                                SELECT dnc.FechaSalidaPedido AS FechaNC,
                                       SUM(dnc.PesoNetoCredito) AS pesoNetoNC,
                                       SUM(dnc.ValorCreditoCOP) AS valorNC
                                FROM EncabNotaCreditoChile encNC
                                INNER JOIN DetNotaCreditoChile dnc ON encNC.Id_EncabNotaCredito = dnc.Id_EncabNotaCredito
                                WHERE dnc.FechaSalidaPedido BETWEEN ? AND ? AND encNC.Estado = 'Activo'
                                GROUP BY dnc.FechaSalidaPedido
                            ) nc ON DATE(enc.FechaSalida) = nc.FechaNC
                            WHERE enc.FechaSalida BETWEEN ? AND ?
                            AND enc.Estado = 'Activo'
                            GROUP BY DATE(enc.FechaSalida)
                            ORDER BY fecha;";

    $stmtTenVent = ejecutarConsultaChile($enlace, $sqlTendenciaVentas, [$fechaInicio, $fechaFin, $fechaInicio, $fechaFin]);
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
        'message' => 'Error al obtener datos del dashboard Chile: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>
