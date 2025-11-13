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

// Consulta solo lo necesario para listar
$sql = "SELECT e.Id_EncabPedido AS idPedido, e.FechaOrden, e.PurchaseOrder, c.Nombre
        FROM EncabPedido e
        INNER JOIN Clientes c ON e.Id_Cliente = c.Id_Cliente
        ORDER BY e.Id_EncabPedido DESC";

$result = $enlace->query($sql);
$pedidos = [];

while ($row = $result->fetch_assoc()) {
    $pedidos[] = $row;
}

echo json_encode(["success" => true, "pedidos" => $pedidos]);

$enlace->close();
?>
