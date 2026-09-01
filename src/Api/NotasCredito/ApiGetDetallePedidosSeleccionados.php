<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$idsPedidos = $input['idsPedidos'] ?? [];

if (empty($idsPedidos) || !is_array($idsPedidos)) {
    echo json_encode(["success" => false, "message" => "Lista de pedidos requerida"]);
    exit;
}

// Sanitizar a enteros
$idsPedidos = array_map('intval', $idsPedidos);
$idsPedidos = array_filter($idsPedidos, fn($v) => $v > 0);

if (empty($idsPedidos)) {
    echo json_encode(["success" => false, "message" => "IDs de pedidos inválidos"]);
    exit;
}

try {
    $placeholders = implode(',', array_fill(0, count($idsPedidos), '?'));
    $types = str_repeat('i', count($idsPedidos));

    $sql = "SELECT 
                det.Id_DetPedido,
                det.Id_EncabPedido,
                det.Id_Producto,
                det.Descripcion,
                det.Id_Embalaje,
                det.Cantidad,
                det.PesoNeto,
                det.PrecioUnitario,
                prd.DescripProducto,
                prd.PesoGr,
                prd.FactorPesoBruto,
                emb.Cantidad AS CantidadEmbalaje,
                enc.FechaSalida,
                enc.PurchaseOrder,
                clr.Region
            FROM DetPedido det
            INNER JOIN EncabPedido enc ON det.Id_EncabPedido = enc.Id_EncabPedido
            INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
            LEFT JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
            LEFT JOIN ClientesRegion clr ON enc.Id_ClienteRegion = clr.Id_ClienteRegion
            WHERE det.Id_EncabPedido IN ($placeholders)
            ORDER BY det.Id_EncabPedido, det.Id_DetPedido";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param($types, ...$idsPedidos);
    $stmt->execute();
    $stmt->bind_result($idDetPedido, $idEncabPedido, $idProducto, $descripcion, $idEmbalaje, $cantidad, $pesoNeto, $precioUnitario, $descripProducto, $pesoGr, $factorPesoBruto, $cantidadEmbalaje, $fechaSalida, $purchaseOrder, $region);

    $items = [];
    while ($stmt->fetch()) {
        $items[] = [
            'Id_DetPedido' => $idDetPedido,
            'Id_EncabPedido' => $idEncabPedido,
            'Id_Producto' => $idProducto,
            'Descripcion' => $descripcion,
            'Id_Embalaje' => $idEmbalaje,
            'Cantidad' => (float)$cantidad,
            'PesoNeto' => (float)$pesoNeto,
            'PrecioUnitario' => (float)$precioUnitario,
            'DescripProducto' => $descripProducto,
            'PesoGr' => (float)$pesoGr,
            'FactorPesoBruto' => (float)$factorPesoBruto,
            'CantidadEmbalaje' => (float)($cantidadEmbalaje ?? 0),
            'FechaSalida' => $fechaSalida,
            'PurchaseOrder' => $purchaseOrder ?? '',
            'Region' => $region ?? ''
        ];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'items' => $items, 'total' => count($items)]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>
