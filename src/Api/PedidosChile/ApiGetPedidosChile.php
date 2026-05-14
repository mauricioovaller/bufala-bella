<?php
// src/Api/PedidosChile/ApiGetPedidosChile.php
// Retorna la lista de todos los pedidos Chile para el modal de búsqueda
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

$query = "SELECT e.Id_EncabPedidoChile,
                 c.Nombre        AS NombreCliente,
                 e.NumeroOrden,
                 e.FechaRecepcionOrden,
                 e.GuiaAerea,
                 e.Estado
          FROM EncabPedidoChile e
          JOIN ClientesChile c ON e.Id_ClienteChile = c.Id_ClienteChile
          ORDER BY e.Id_EncabPedidoChile DESC";

$result = $enlace->query($query);
$pedidos = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $pedidos[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'pedidos' => $pedidos,
]);

$enlace->close();
