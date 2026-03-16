<?php
//src/Api/Dashboard/ApiVentasRegionCliente.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
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
$input = json_decode($json, true);

if (!$input || !isset($input['idCliente']) || !isset($input['fechaInicio']) || !isset($input['fechaFin'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan parámetros: idCliente, fechaInicio, fechaFin']);
    exit;
}

$idCliente = intval($input['idCliente']);
$fechaInicio = $input['fechaInicio'];
$fechaFin = $input['fechaFin'];

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if (!$enlace || $enlace->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de conexión']);
    exit;
}

$enlace->set_charset("utf8mb4");

// Consulta para obtener ventas por región del cliente
$sql = "SELECT 
            cr.Region,
            COUNT(DISTINCT enc.Id_EncabPedido) as cantidad,
            SUM(dek.PesoNeto * dek.PrecioUnitario) as valor,
            SUM(dek.PesoNeto) as pesoNeto
        FROM EncabPedido enc
        INNER JOIN DetPedido dek ON enc.Id_EncabPedido = dek.Id_EncabPedido
        INNER JOIN ClientesRegion cr ON enc.Id_ClienteRegion = cr.Id_ClienteRegion
        WHERE enc.Id_Cliente = ?
          AND enc.FechaSalida BETWEEN ? AND ?
          AND enc.Estado = 'Activo'
        GROUP BY cr.Id_ClienteRegion, cr.Region
        ORDER BY valor DESC";

$stmt = $enlace->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $enlace->error]);
    exit;
}

$stmt->bind_param("iss", $idCliente, $fechaInicio, $fechaFin);
$stmt->execute();
$stmt->bind_result($region, $cantidad, $valor, $pesoNeto);

$regiones = [];
while ($stmt->fetch()) {
    $regiones[] = [
        'region' => $region,
        'cantidad' => intval($cantidad),
        'valor' => floatval($valor),
        'pesoNeto' => floatval($pesoNeto)
    ];
}
$stmt->close();

// Obtener nombre del cliente para referencia
$sqlCliente = "SELECT Nombre FROM Clientes WHERE Id_Cliente = ?";
$stmtCliente = $enlace->prepare($sqlCliente);
$stmtCliente->bind_param("i", $idCliente);
$stmtCliente->execute();
$stmtCliente->bind_result($nombreCliente);
$stmtCliente->fetch();
$stmtCliente->close();

echo json_encode([
    'success' => true,
    'idCliente' => $idCliente,
    'nombreCliente' => $nombreCliente,
    'regiones' => $regiones
]);

$enlace->close();
?>