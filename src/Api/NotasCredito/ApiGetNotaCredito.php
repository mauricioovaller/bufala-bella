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
$idNotaCredito = $input['idNotaCredito'] ?? 0;

if (!$idNotaCredito) {
    echo json_encode(["success" => false, "message" => "ID de nota crédito requerido"]);
    exit;
}

try {
    // Obtener encabezado
    $sqlEnc = "SELECT 
                enc.Id_EncabNotaCredito,
                enc.Id_Cliente,
                enc.Numero,
                enc.Fecha,
                enc.Motivo,
                enc.ValorTotalCOP,
                enc.ValorTotalUSD,
                enc.Estado,
                cli.Nombre AS NombreCliente
            FROM EncabNotaCredito enc
            INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
            WHERE enc.Id_EncabNotaCredito = ?";

    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("i", $idNotaCredito);
    $stmtEnc->execute();
    $stmtEnc->bind_result($id, $idCliente, $numero, $fecha, $motivo, $valorTotalCOP, $valorTotalUSD, $estado, $nombreCliente);
    
    if (!$stmtEnc->fetch()) {
        echo json_encode(["success" => false, "message" => "Nota crédito no encontrada"]);
        $stmtEnc->close();
        $enlace->close();
        exit;
    }
    $stmtEnc->close();

    $encabezado = [
        'id' => $id,
        'idCliente' => $idCliente,
        'numero' => $numero,
        'fecha' => $fecha,
        'motivo' => $motivo ?? '',
        'valorTotalCOP' => (float)$valorTotalCOP,
        'valorTotalUSD' => (float)$valorTotalUSD,
        'estado' => $estado,
        'nombreCliente' => $nombreCliente
    ];

    // Obtener detalle
    $sqlDet = "SELECT 
                det.Id_DetNotaCredito,
                det.Id_EncabPedido,
                det.Id_DetPedido,
                det.Id_Producto,
                det.Descripcion,
                det.Id_Embalaje,
                det.CantidadOriginal,
                det.CantidadCredito,
                det.PesoNetoCredito,
                det.PrecioUnitario,
                det.ValorCreditoCOP,
                det.FechaSalidaPedido,
                det.Item,
                prd.DescripProducto,
                emb.Descripcion AS NombreEmbalaje,
                enc.PurchaseOrder,
                clr.Region
            FROM DetNotaCredito det
            LEFT JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
            LEFT JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
            LEFT JOIN EncabPedido enc ON det.Id_EncabPedido = enc.Id_EncabPedido
            LEFT JOIN ClientesRegion clr ON enc.Id_ClienteRegion = clr.Id_ClienteRegion
            WHERE det.Id_EncabNotaCredito = ?
            ORDER BY det.Item";

    $stmtDet = $enlace->prepare($sqlDet);
    $stmtDet->bind_param("i", $idNotaCredito);
    $stmtDet->execute();
    $stmtDet->bind_result($idDet, $idEncabPedido, $idDetPedido, $idProducto, $descripcion, $idEmbalaje, $cantidadOriginal, $cantidadCredito, $pesoNetoCredito, $precioUnitario, $valorCreditoCOP, $fechaSalidaPedido, $item, $descripProducto, $nombreEmbalaje, $purchaseOrder, $region);

    $detalle = [];
    while ($stmtDet->fetch()) {
        $detalle[] = [
            'idDetNotaCredito' => $idDet,
            'idEncabPedido' => $idEncabPedido,
            'idDetPedido' => $idDetPedido,
            'idProducto' => $idProducto,
            'descripcion' => $descripcion ?? '',
            'idEmbalaje' => $idEmbalaje,
            'cantidadOriginal' => (float)$cantidadOriginal,
            'cantidadCredito' => (float)$cantidadCredito,
            'pesoNetoCredito' => (float)$pesoNetoCredito,
            'precioUnitario' => (float)$precioUnitario,
            'valorCreditoCOP' => (float)$valorCreditoCOP,
            'fechaSalidaPedido' => $fechaSalidaPedido,
            'item' => $item,
            'descripProducto' => $descripProducto ?? '',
            'nombreEmbalaje' => $nombreEmbalaje ?? '',
            'purchaseOrder' => $purchaseOrder ?? '',
            'region' => $region ?? ''
        ];
    }
    $stmtDet->close();

    echo json_encode([
        'success' => true,
        'encabezado' => $encabezado,
        'detalle' => $detalle,
        'totalItems' => count($detalle)
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>
