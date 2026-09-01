<?php
// ApiResumenInicio.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 0);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

$mesInicio = date('Y-m-01');
$mesFin = date('Y-m-t');

try {
    $response = ['success' => false];

    // 1. Totales generales
    $sqlClientes = "SELECT COUNT(*) AS total FROM Clientes";
    $stmtClientes = $enlace->prepare($sqlClientes);
    $stmtClientes->execute();
    $stmtClientes->bind_result($totalClientes);
    $stmtClientes->fetch();
    $stmtClientes->close();

    $sqlProductos = "SELECT COUNT(*) AS total FROM Productos";
    $stmtProductos = $enlace->prepare($sqlProductos);
    $stmtProductos->execute();
    $stmtProductos->bind_result($totalProductos);
    $stmtProductos->fetch();
    $stmtProductos->close();

    // 2. Pedidos activos
    $sqlPedidosActivos = "
        SELECT COUNT(DISTINCT ep.Id_EncabPedido) AS total,
               COALESCE(SUM(di.PesoNeto), 0) AS pesoNetoTotal
        FROM EncabPedido ep
        LEFT JOIN DetPedido di ON ep.Id_EncabPedido = di.Id_EncabPedido
        WHERE ep.Estado = 'Activo'
    ";
    $stmtPedAct = $enlace->prepare($sqlPedidosActivos);
    $stmtPedAct->execute();
    $stmtPedAct->bind_result($totalPedidosActivos, $pesoNetoTotal);
    $stmtPedAct->fetch();
    $stmtPedAct->close();

    // 3. Facturas del mes
    $sqlFacturasMes = "
        SELECT
            COUNT(DISTINCT ei.Id_EncabInvoice) AS totalFacturas,
            COALESCE(SUM(di.Kilogramos), 0) AS totalKg,
            COALESCE(SUM(di.FOB), 0) AS totalValor
        FROM EncabInvoice ei
        INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
        WHERE ei.Fecha BETWEEN ? AND ?
    ";
    $stmtFacMes = $enlace->prepare($sqlFacturasMes);
    $stmtFacMes->bind_param("ss", $mesInicio, $mesFin);
    $stmtFacMes->execute();
    $stmtFacMes->bind_result($totalFacturasMes, $totalKgMes, $totalValorMes);
    $stmtFacMes->fetch();
    $stmtFacMes->close();

    // 4. Costos flete del mes
    $sqlCostosMes = "
        SELECT COUNT(*) AS total, COALESCE(SUM(ValorFlete), 0) AS totalFlete
        FROM CostosTransporteDiario
        WHERE Fecha BETWEEN ? AND ?
    ";
    $stmtCostosMes = $enlace->prepare($sqlCostosMes);
    $stmtCostosMes->bind_param("ss", $mesInicio, $mesFin);
    $stmtCostosMes->execute();
    $stmtCostosMes->bind_result($totalCostosMes, $totalFleteMes);
    $stmtCostosMes->fetch();
    $stmtCostosMes->close();

    // 5. Ultimas 6 facturas
    $sqlUltimasFacturas = "
        SELECT ei.Fecha, ei.GuiaMaster, SUM(di.Kilogramos) AS kg, COUNT(di.Id_DetInvoice) AS items
        FROM EncabInvoice ei
        INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
        GROUP BY ei.Id_EncabInvoice
        ORDER BY ei.Fecha DESC, ei.Id_EncabInvoice DESC
        LIMIT 6
    ";
    $stmtUltFac = $enlace->prepare($sqlUltimasFacturas);
    $stmtUltFac->execute();
    $stmtUltFac->bind_result($fecha, $guiaMaster, $kg, $items);
    $ultimasFacturas = [];
    while ($stmtUltFac->fetch()) {
        $ultimasFacturas[] = [
            'fecha' => $fecha,
            'guiaMaster' => $guiaMaster,
            'kg' => (float)$kg,
            'items' => (int)$items
        ];
    }
    $stmtUltFac->close();

    // 6. Ultimos 5 pedidos creados
    $sqlUltimosPedidos = "
        SELECT ep.Id_EncabPedido, ep.FechaOrden, c.Nombre AS Cliente
        FROM EncabPedido ep
        INNER JOIN Clientes c ON ep.Id_Cliente = c.Id_Cliente
        WHERE ep.Estado = 'Activo'
        ORDER BY ep.Id_EncabPedido DESC
        LIMIT 5
    ";
    $stmtUltPed = $enlace->prepare($sqlUltimosPedidos);
    $stmtUltPed->execute();
    $stmtUltPed->bind_result($idPedido, $fechaPed, $clientePed);
    $ultimosPedidos = [];
    while ($stmtUltPed->fetch()) {
        $ultimosPedidos[] = [
            'id' => (int)$idPedido,
            'fecha' => $fechaPed,
            'cliente' => $clientePed
        ];
    }
    $stmtUltPed->close();

    // 7. Tendencia kg ultimos 7 dias (para grafico)
    $sqlTendenciaKg = "
        SELECT ei.Fecha, COALESCE(SUM(di.Kilogramos), 0) AS kg
        FROM EncabInvoice ei
        INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice
        WHERE ei.Fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
        GROUP BY ei.Fecha
        ORDER BY ei.Fecha ASC
    ";
    $stmtTend = $enlace->prepare($sqlTendenciaKg);
    $stmtTend->execute();
    $stmtTend->bind_result($fechaTend, $kgTend);
    $tendenciaKg = [];
    while ($stmtTend->fetch()) {
        $tendenciaKg[] = [
            'fecha' => $fechaTend,
            'kg' => (float)$kgTend
        ];
    }
    $stmtTend->close();

    // 8. Total facturas historicas + pendientes por facturar
    $sqlTotalFacturas = "SELECT COUNT(*) FROM EncabInvoice";
    $stmtTotFac = $enlace->prepare($sqlTotalFacturas);
    $stmtTotFac->execute();
    $stmtTotFac->bind_result($totalFacturasHistorico);
    $stmtTotFac->fetch();
    $stmtTotFac->close();

    $pedidosPendientesFacturar = $totalPedidosActivos; // Simplificado: pedidos activos que no tienen factura

    $response = [
        'success' => true,
        'totales' => [
            'clientes' => (int)$totalClientes,
            'productos' => (int)$totalProductos,
            'pedidosActivos' => (int)$totalPedidosActivos,
            'pesoNetoTotal' => round((float)$pesoNetoTotal, 1),
            'facturasHistorico' => (int)$totalFacturasHistorico
        ],
        'mesActual' => [
            'facturas' => (int)$totalFacturasMes,
            'kgDespachados' => (float)$totalKgMes,
            'valorTotal' => (float)$totalValorMes,
            'costosFlete' => (int)$totalCostosMes,
            'totalFleteCOP' => (float)$totalFleteMes
        ],
        'ultimasFacturas' => $ultimasFacturas,
        'ultimosPedidos' => $ultimosPedidos,
        'tendenciaKg' => $tendenciaKg,
        'saldo' => [
            'pedidosActivos' => (int)$totalPedidosActivos,
            'facturasTotales' => (int)$totalFacturasHistorico,
            'pendientesFacturar' => max(0, $totalPedidosActivos - $totalFacturasHistorico)
        ]
    ];

    echo json_encode($response, JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener el resumen: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>
