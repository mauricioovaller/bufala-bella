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

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$idPedido = isset($data['idPedido']) ? intval($data['idPedido']) : 0;
$tipo = $data['tipo'] ?? 'normal'; // 'normal' o 'sample'

if (!$idPedido) {
    echo json_encode(["success" => false, "message" => "ID de pedido no válido"]);
    exit;
}

// Determinar tablas según tipo
$tablaEnc = ($tipo === 'sample') ? 'EncabPedidoSample' : 'EncabPedido';
$tablaDet = ($tipo === 'sample') ? 'DetPedidoSample' : 'DetPedido';

try {
    // Obtener encabezado
    $sqlEnc = "SELECT Id_EncabPedido, Id_Cliente, PurchaseOrder, FechaOrden FROM $tablaEnc WHERE Id_EncabPedido = ?";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("i", $idPedido);
    $stmtEnc->execute();
    $stmtEnc->bind_result($idEnc, $idCliente, $purchaseOrder, $fechaOrden);
    
    if (!$stmtEnc->fetch()) {
        echo json_encode(["success" => false, "message" => "Pedido no encontrado"]);
        $stmtEnc->close();
        $enlace->close();
        exit;
    }
    $stmtEnc->close();
    
    // Obtener nombre del cliente
    $sqlCli = "SELECT Nombre FROM Clientes WHERE Id_Cliente = ?";
    $stmtCli = $enlace->prepare($sqlCli);
    $stmtCli->bind_param("i", $idCliente);
    $stmtCli->execute();
    $stmtCli->bind_result($nombreCliente);
    $stmtCli->fetch();
    $stmtCli->close();
    
    // Obtener detalle con responsable y lotes
    $sqlDet = "SELECT 
        d.Id_DetPedido,
        d.Id_Producto,
        p.DescripProducto,
        d.Cantidad,
        d.Id_Responsable,
        r.Nombre AS ResponsableNombre,
        d.Lote1,
        d.Lote2,
        d.Lote3,
        l1.CodigoLote AS Lote1Codigo,
        l2.CodigoLote AS Lote2Codigo,
        l3.CodigoLote AS Lote3Codigo
    FROM $tablaDet d
    INNER JOIN Productos p ON d.Id_Producto = p.Id_Producto
    LEFT JOIN Responsables r ON d.Id_Responsable = r.Id_Responsable
    LEFT JOIN Lotes l1 ON d.Lote1 = l1.Id_Lote
    LEFT JOIN Lotes l2 ON d.Lote2 = l2.Id_Lote
    LEFT JOIN Lotes l3 ON d.Lote3 = l3.Id_Lote
    WHERE d.Id_EncabPedido = ?
    ORDER BY d.Id_DetPedido";
    
    $stmtDet = $enlace->prepare($sqlDet);
    $stmtDet->bind_param("i", $idPedido);
    $stmtDet->execute();
    
    $stmtDet->bind_result(
        $idDet,
        $idProducto,
        $descProducto,
        $cantidad,
        $idResponsable,
        $responsableNombre,
        $lote1,
        $lote2,
        $lote3,
        $lote1Codigo,
        $lote2Codigo,
        $lote3Codigo
    );
    
    $items = [];
    while ($stmtDet->fetch()) {
        $items[] = [
            'idDet' => $idDet,
            'idProducto' => $idProducto,
            'producto' => $descProducto,
            'cantidad' => $cantidad,
            'idResponsable' => $idResponsable,
            'responsable' => $responsableNombre,
            'lotes' => [
                'lote1' => ['id' => $lote1, 'codigo' => $lote1Codigo],
                'lote2' => ['id' => $lote2, 'codigo' => $lote2Codigo],
                'lote3' => ['id' => $lote3, 'codigo' => $lote3Codigo]
            ]
        ];
    }
    $stmtDet->close();
    
    echo json_encode([
        "success" => true,
        "pedido" => [
            "idPedido" => $idPedido,
            "tipo" => $tipo,
            "numero" => ($tipo === 'sample' ? 'SMP-' : 'PED-') . str_pad($idPedido, 6, '0', STR_PAD_LEFT),
            "idCliente" => $idCliente,
            "cliente" => $nombreCliente,
            "purchaseOrder" => $purchaseOrder,
            "fechaOrden" => $fechaOrden,
            "items" => $items
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>