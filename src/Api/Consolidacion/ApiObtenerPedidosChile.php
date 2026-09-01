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

$sql = "SELECT
            enc.Id_EncabPedido AS id,
            enc.Id_EncabPedido AS numero,
            enc.FechaSalida AS fecha,
            cli.Nombre AS cliente,
            '' AS region,
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
            IF(SUM(det.Cantidad) < 20, 0, enc.CantidadEstibas) AS estibasPagas,
            'CHI' AS tipo
        FROM EncabPedidoChile enc
        INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
        INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.FechaSalida BETWEEN ? AND ? AND enc.Estado = 'Activo'
        GROUP BY enc.Id_EncabPedido
        ORDER BY enc.FechaSalida DESC, enc.Id_EncabPedido DESC";

$stmt = $enlace->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error en la preparación: " . $enlace->error]);
    exit;
}

$stmt->bind_param("ss", $fechaDesde, $fechaHasta);
$stmt->execute();

$stmt->bind_result($id, $numero, $fecha, $cliente, $region, $ordenCompra, $idAerolinea, $idAgencia, $guiaMaster, $guiaHija, $facturaNo, $cajas, $tms, $pesoNeto, $valor, $estibas, $estibasPagas, $tipo);

$pedidos = [];

while ($stmt->fetch()) {
    $pedidos[] = [
        'id' => $id,
        'numero' => 'CHI-' . str_pad($numero, 6, '0', STR_PAD_LEFT),
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
        'estibasPagas' => (int)$estibasPagas,
        'tipo' => $tipo,
        'seleccionado' => false
    ];
}

echo json_encode([
    "success" => true,
    "pedidos" => $pedidos,
    "total" => count($pedidos)
]);

$stmt->close();
$enlace->close();
?>
