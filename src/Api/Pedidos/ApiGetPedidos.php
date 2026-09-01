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

// Leer término de búsqueda (opcional)
$json = file_get_contents("php://input");
$data = json_decode($json, true);
$termino = isset($data["termino"]) ? trim($data["termino"]) : "";

// Si no hay término, no devolver todos los registros (evita cargas pesadas)
if ($termino === "") {
    echo json_encode(["success" => true, "pedidos" => [], "message" => "Ingrese un criterio de búsqueda"]);
    exit;
}

$patron = "%" . $termino . "%";

// Consulta solo lo necesario para listar, filtrando por el término
$sql = "SELECT e.Id_EncabPedido AS idPedido, e.FechaOrden, e.PurchaseOrder, e.Estado, c.Nombre, r.Region
        FROM EncabPedido e
        INNER JOIN Clientes c ON e.Id_Cliente = c.Id_Cliente
        INNER JOIN ClientesRegion r ON e.Id_ClienteRegion = r.Id_ClienteRegion
        WHERE e.Id_EncabPedido LIKE ?
           OR c.Nombre LIKE ?
           OR e.FechaOrden LIKE ?
           OR e.PurchaseOrder LIKE ?
           OR r.Region LIKE ?
        ORDER BY e.Id_EncabPedido DESC
        LIMIT 200";

$stmt = $enlace->prepare($sql);
$stmt->bind_param("sssss", $patron, $patron, $patron, $patron, $patron);
$stmt->execute();
$stmt->bind_result($idPedido, $fechaOrden, $purchaseOrder, $estado, $nombre, $region);

$pedidos = [];
while ($stmt->fetch()) {
    $pedidos[] = [
        "idPedido" => $idPedido,
        "FechaOrden" => $fechaOrden,
        "PurchaseOrder" => $purchaseOrder ?? "",
        "Estado" => $estado ?? "Activo",
        "Nombre" => $nombre,
        "Region" => $region ?? ""
    ];
}
$stmt->close();

echo json_encode(["success" => true, "pedidos" => $pedidos]);

$enlace->close();
?>
