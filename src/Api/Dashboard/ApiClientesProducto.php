<?php
// src/Api/Dashboard/ApiClientesProducto.php - Devuelve los clientes que compraron un producto específico

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

if (!$input || !isset($input['idProducto']) || !isset($input['fechaInicio']) || !isset($input['fechaFin'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan parámetros: idProducto, fechaInicio, fechaFin']);
    exit;
}

$idProducto = intval($input['idProducto']);
$fechaInicio = $input['fechaInicio'];
$fechaFin = $input['fechaFin'];

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if (!$enlace || $enlace->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de conexión']);
    exit;
}

$enlace->set_charset("utf8mb4");

// Consulta para obtener clientes que compraron el producto
$sql = "SELECT 
            cli.Id_Cliente AS id,
            cli.Nombre AS nombre,
            COUNT(DISTINCT enc.Id_EncabPedido) AS cantidad,
            SUM(dek.PesoNeto * dek.PrecioUnitario) AS valor,
            SUM(dek.PesoNeto) AS pesoNeto
        FROM DetPedido dek
        INNER JOIN EncabPedido enc ON dek.Id_EncabPedido = enc.Id_EncabPedido
        INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
        WHERE dek.Id_Producto = ?
          AND enc.FechaSalida BETWEEN ? AND ?
          AND enc.Estado = 'Activo'
        GROUP BY cli.Id_Cliente, cli.Nombre
        ORDER BY valor DESC";

$stmt = $enlace->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $enlace->error]);
    exit;
}

$stmt->bind_param("iss", $idProducto, $fechaInicio, $fechaFin);
$stmt->execute();
$stmt->bind_result($idCliente, $nombreCliente, $cantidad, $valor, $pesoNeto);

$clientes = [];
while ($stmt->fetch()) {
    $clientes[] = [
        'id' => intval($idCliente),
        'nombre' => $nombreCliente,
        'cantidad' => intval($cantidad),
        'valor' => floatval($valor),
        'pesoNeto' => floatval($pesoNeto)
    ];
}
$stmt->close();

// Obtener nombre del producto para referencia
$sqlProducto = "SELECT DescripProducto FROM Productos WHERE Id_Producto = ?";
$stmtProducto = $enlace->prepare($sqlProducto);
$stmtProducto->bind_param("i", $idProducto);
$stmtProducto->execute();
$stmtProducto->bind_result($nombreProducto);
$stmtProducto->fetch();
$stmtProducto->close();

echo json_encode([
    'success' => true,
    'idProducto' => $idProducto,
    'nombreProducto' => $nombreProducto,
    'clientes' => $clientes
]);

$enlace->close();
?>