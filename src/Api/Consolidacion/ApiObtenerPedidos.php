<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$fechaDesde = $data['fechaDesde'] ?? '';
$fechaHasta = $data['fechaHasta'] ?? '';

if (empty($fechaDesde) || empty($fechaHasta)) {
    echo json_encode(["success" => false, "message" => "Fechas desde y hasta son requeridas"]);
    exit;
}

// CONSULTA UNIFICADA - PEDIDOS REGULARES
$sqlPedidos = "SELECT
            enc.Id_EncabPedido AS id,
            enc.Id_EncabPedido AS numero,
            enc.FechaSalida AS fecha,
            cli.Nombre AS cliente,
            clr.Region AS region,
            enc.PurchaseOrder AS ordenCompra,
            enc.IdAerolinea,
            enc.IdAgencia,
            enc.GuiaMaster,
            enc.GuiaHija,
            enc.FacturaNo AS facturaNo,
            SUM(det.Cantidad) AS cajas,
            SUM(det.Cantidad * emb.Cantidad) AS tms,
            ROUND(SUM(det.PesoNeto),2) AS pesoNeto,
            ROUND(SUM(det.PesoNeto * det.PrecioUnitario),2) AS valor,
            enc.CantidadEstibas AS estibas,
            'PED' AS tipo  -- 👈 Identificador para pedidos regulares
        FROM EncabPedido enc
        INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
        INNER JOIN ClientesRegion clr ON enc.Id_ClienteRegion = clr.Id_ClienteRegion
        INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.FechaSalida BETWEEN ? AND ? AND enc.Estado = 'Activo'
        GROUP BY enc.Id_EncabPedido";

// CONSULTA UNIFICADA - SAMPLES
$sqlSamples = "SELECT
            enc.Id_EncabPedido AS id,
            enc.Id_EncabPedido AS numero,
            enc.FechaSalida AS fecha,
            enc.Cliente AS cliente,  -- 👈 Usa el campo Cliente directo en lugar de JOIN
            '' AS region,
            enc.PurchaseOrder AS ordenCompra,
            enc.IdAerolinea,
            enc.IdAgencia,
            enc.GuiaMaster,
            enc.GuiaHija,
            enc.FacturaNo AS facturaNo,
            ROUND(SUM(det.Cantidad), 2) AS cajas,
            SUM(det.Cantidad * emb.Cantidad) AS tms,
            ROUND(SUM(det.PesoNeto ),2) AS pesoNeto,
            ROUND(SUM(det.PesoNeto * det.PrecioUnitario),2) AS valor,
            enc.CantidadEstibas AS estibas,
            'SMP' AS tipo  -- 👈 Identificador para samples
        FROM EncabPedidoSample enc
        INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.FechaSalida BETWEEN ? AND ? AND enc.Estado = 'Activo'
        GROUP BY enc.Id_EncabPedido";

// COMBINAR AMBAS CONSULTAS CON UNION
$sql = "($sqlPedidos) UNION ALL ($sqlSamples) ORDER BY fecha DESC, numero DESC";

$stmt = $enlace->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error en la preparación: " . $enlace->error]);
    exit;
}

$stmt->bind_param("ssss", $fechaDesde, $fechaHasta, $fechaDesde, $fechaHasta);
$stmt->execute();

// Usar bind_result
$stmt->bind_result($id, $numero, $fecha, $cliente, $region, $ordenCompra, $idAerolinea, $idAgencia, $guiaMaster, $guiaHija, $facturaNo, $cajas, $tms, $pesoNeto, $valor, $estibas, $tipo);

$todosLosRegistros = []; // 👈 UN SOLO ARREGLO

while ($stmt->fetch()) {
    // Determinar el prefijo según el tipo
    $prefijo = $tipo === 'SMP' ? 'SMP' : 'PED';
    
    $registro = [
        'id' => $id,
        'numero' => $prefijo . '-' . str_pad($numero, 6, '0', STR_PAD_LEFT),
        'cliente' => $cliente,
        'region' => $region,
        'fecha' => $fecha,
        'idAerolinea' => $idAerolinea,
        'idAgencia' => $idAgencia,
        'guiaMaster' => $guiaMaster,
        'guiaHija' => $guiaHija,
        'facturaNo' => $facturaNo,
        'cajas' => (float)$cajas,
        'tms' => (int)$tms,
        'pesoNeto' => (float)$pesoNeto,
        'valor' => (float)$valor,
        'ordenCompra' => $ordenCompra,
        'estibas' => (int)$estibas,
        'tipo' => $tipo, // 👈 Para identificar fácilmente en el frontend si es necesario
        'seleccionado' => false
    ];

    $todosLosRegistros[] = $registro; // 👈 TODOS VAN AL MISMO ARREGLO
}

echo json_encode([
    "success" => true, 
    "pedidos" => $todosLosRegistros, // 👈 UN SOLO ARREGLO UNIFICADO
    "total" => count($todosLosRegistros)
]);

$stmt->close();
$enlace->close();
?>