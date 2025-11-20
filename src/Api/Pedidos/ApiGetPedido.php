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

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);
$idPedido = intval($data["idPedido"] ?? 0);

if ($idPedido <= 0) {
    echo json_encode(["success" => false, "message" => "ID de pedido inválido"]);
    exit;
}

// ===================
// Obtener encabezado
// ===================
// 👇 MODIFICADO: Agregar los dos campos nuevos al SELECT
$sqlEnc = "SELECT Id_EncabPedido, Id_Cliente, Id_ClienteRegion, Id_Transportadora, Id_Bodega, PurchaseOrder, FechaOrden, FechaSalida, FechaEnroute, FechaDelivery, FechaIngreso, CantidadEstibas, IdAerolinea, IdAgencia, GuiaMaster, GuiaHija, Observaciones, ComentarioPrimario, ComentarioSecundario
             FROM EncabPedido 
             WHERE Id_EncabPedido = ?";

$stmtEnc = $enlace->prepare($sqlEnc);
$stmtEnc->bind_param("i", $idPedido);
$stmtEnc->execute();

// 👇 MODIFICADO: Agregar los dos campos nuevos al bind_result
$stmtEnc->bind_result($idEncabPedido, $idCliente, $idClienteRegion, $idTransportadora, $idBodega, $purchaseOrder, $fechaOrden, $fechaSalida, $fechaEnroute, $fechaDelivery, $fechaIngreso, $cantidadEstibas, $idAerolinea, $idAgencia, $guiaMaster, $guiaHija, $observaciones, $comentarioPrimario, $comentarioSecundario);

$header = null;
if ($stmtEnc->fetch()) {
    $header = [
        "Id_EncabPedido" => $idEncabPedido,
        "Id_Cliente"     => $idCliente,
        "Id_ClienteRegion"=> $idClienteRegion,
        "Id_Transportadora"=> $idTransportadora,
        "Id_Bodega"      => $idBodega,
        "PurchaseOrder"  => $purchaseOrder,
        "FechaOrden"     => $fechaOrden,
        "FechaSalida"    => $fechaSalida,
        "FechaEnroute"   => $fechaEnroute,
        "FechaDelivery"  => $fechaDelivery,
        "FechaIngreso"   => $fechaIngreso,
        "CantidadEstibas"=> $cantidadEstibas,
        "Id_Aerolinea"    => $idAerolinea,
        "Id_Agencia"      => $idAgencia,
        "GuiaMaster"     => $guiaMaster,
        "GuiaHija"       => $guiaHija,
        "Observaciones"  => $observaciones,
        // 👇 NUEVO: Campos agregados
        "ComentarioPrimario" => $comentarioPrimario,
        "ComentarioSecundario" => $comentarioSecundario
    ];
}
$stmtEnc->close();

// ===================
// Obtener detalle (SIN CAMBIOS)
// ===================
$sqlDet = "SELECT d.Id_DetPedido, d.Id_EncabPedido, d.Id_Producto, p.DescripProducto, p.DescripFactura, p.Codigo_Siesa, p.Codigo_FDA, p.PesoGr, p.FactorPesoBruto, d.Descripcion, d.Id_Embalaje, d.Cantidad, d.PrecioUnitario, ROUND(((p.PesoGr * e.Cantidad * d.Cantidad) / 1000),2) AS PesoNeto, ROUND(((p.PesoGr * e.Cantidad * d.Cantidad) * p.FactorPesoBruto / 1000),2) AS PesoBruto, ROUND(((p.PesoGr * e.Cantidad * d.Cantidad) / 1000) * d.PrecioUnitario,2) AS ValorRegistro
             FROM DetPedido d
             INNER JOIN Productos p ON d.Id_Producto = p.Id_Producto
             INNER JOIN Embalajes e ON d.Id_Embalaje = e.Id_Embalaje
             WHERE Id_EncabPedido = ?";

$stmtDet = $enlace->prepare($sqlDet);
$stmtDet->bind_param("i", $idPedido);
$stmtDet->execute();
$stmtDet->bind_result($idDetPedido, $idEncab, $idProducto, $descripProducto, $descripFactura, $codigoSiesa, $codigoFDA, $pesoGr, $factorPesoBruto, $descripcion, $idEmbalaje, $cantidad, $precioUnitario, $pesoNeto, $pesoBruto, $valorRegistro);

$detalle = [];
while ($stmtDet->fetch()) {
    $detalle[] = [
        "Id_DetPedido"   => $idDetPedido,
        "Id_EncabPedido" => $idEncab,
        "Id_Producto"    => $idProducto,
        "DescripProducto"=> $descripProducto,
        "DescripFactura" => $descripFactura,
        "Codigo_Siesa"   => $codigoSiesa,
        "Codigo_FDA"     => $codigoFDA,
        "PesoGr"         => $pesoGr,
        "FactorPesoBruto"=> $factorPesoBruto,
        "Descripcion"    => $descripcion,
        "Id_Embalaje"    => $idEmbalaje,
        "Cantidad"       => $cantidad,
        "Precio"         => $precioUnitario,
        "PesoNeto"       => $pesoNeto,
        "PesoBruto"      => $pesoBruto, 
        "ValorRegistro"  => $valorRegistro,
    ];
}
$stmtDet->close();

$enlace->close();

// ===================
// Respuesta final
// ===================
echo json_encode([
    "success" => true,
    "header"  => $header,
    "detalle" => $detalle
]);
?>