<?php
// src/Api/Produccion/ApiGetPedidosProduccion.php
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

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$tipo = $data['tipo'] ?? 'normal'; // 'normal' o 'sample'
$fechaDesde = $data['fechaDesde'] ?? '';
$fechaHasta = $data['fechaHasta'] ?? '';

if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "message" => "Fechas requeridas"]);
    exit;
}

// Determinar tablas según tipo
$tablaEnc = ($tipo === 'sample') ? 'EncabPedidoSample' : 'EncabPedido';
$campoFecha = 'FechaSalida'; // Puedes cambiarlo si necesitas otra fecha

$sql = "SELECT 
    Id_EncabPedido AS idPedido,
    Id_Cliente,
    (SELECT Nombre FROM Clientes WHERE Id_Cliente = e.Id_Cliente) AS cliente,
    PurchaseOrder AS po,
    FechaSalida AS fecha
FROM $tablaEnc e
WHERE $campoFecha BETWEEN ? AND ?
ORDER BY $campoFecha DESC, Id_EncabPedido ";

$stmt = $enlace->prepare($sql);
$stmt->bind_param("ss", $fechaDesde, $fechaHasta);
$stmt->execute();
$stmt->bind_result($idPedido, $idCliente, $cliente, $po, $fecha);

$pedidos = [];
while ($stmt->fetch()) {
    $pedidos[] = [
        'idPedido' => $idPedido,
        'cliente' => $cliente,
        'po' => $po,
        'fecha' => $fecha
    ];
}

$stmt->close();
$enlace->close();

echo json_encode(["success" => true, "pedidos" => $pedidos]);
?>