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

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

$facturaId = isset($data["facturaId"]) ? intval($data["facturaId"]) : null;
$numeroFacturaCompleto = isset($data["numeroFactura"]) ? trim($data["numeroFactura"]) : null;

if (!$facturaId || !$numeroFacturaCompleto) {
    echo json_encode(["success" => false, "message" => "ID de factura o numero de factura no válido"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // 1. Verificar que la factura existe en EncabInvoiceChile
    $sqlVerificar = "SELECT Id_EncabInvoice FROM EncabInvoiceChile WHERE Id_EncabInvoice = ?";
    $stmtVerificar = $enlace->prepare($sqlVerificar);
    $stmtVerificar->bind_param("i", $facturaId);
    $stmtVerificar->execute();
    $stmtVerificar->store_result();

    if ($stmtVerificar->num_rows === 0) {
        throw new Exception("Factura no encontrada en EncabInvoiceChile");
    }
    $stmtVerificar->close();

    // 2. Eliminar detalle
    $sqlDelDet = "DELETE FROM DetInvoiceChile WHERE Id_EncabInvoice = ?";
    $stmtDelDet = $enlace->prepare($sqlDelDet);
    $stmtDelDet->bind_param("i", $facturaId);
    $stmtDelDet->execute();
    $stmtDelDet->close();

    // 3. Eliminar encabezado
    $sqlDelEnc = "DELETE FROM EncabInvoiceChile WHERE Id_EncabInvoice = ?";
    $stmtDelEnc = $enlace->prepare($sqlDelEnc);
    $stmtDelEnc->bind_param("i", $facturaId);
    $stmtDelEnc->execute();

    if ($stmtDelEnc->affected_rows === 0) {
        throw new Exception("No se pudo eliminar el encabezado de la factura Chile");
    }
    $stmtDelEnc->close();

    // 4. Liberar pedidos Chile (soporta TODOS los formatos: "FEX-x", "CHI-FEX-x" y "x")
    $idNumerico = preg_replace('/[^0-9]/', '', $numeroFacturaCompleto);

    if ($idNumerico === '') {
        throw new Exception("Número de factura no válido para liberar pedidos");
    }

    $sqlUpdate = "UPDATE EncabPedidoChile SET FacturaNo = ''
                  WHERE FacturaNo = ?
                     OR FacturaNo = CONCAT('FEX-', ?)
                     OR FacturaNo = CONCAT('CHI-FEX-', ?)";
    $stmtUpdate = $enlace->prepare($sqlUpdate);
    $stmtUpdate->bind_param("sss", $numeroFacturaCompleto, $idNumerico, $idNumerico);
    $stmtUpdate->execute();
    $pedidosActualizados = $stmtUpdate->affected_rows;
    $stmtUpdate->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Factura Chile eliminada correctamente",
        "numeroFactura" => $numeroFacturaCompleto,
        "pedidosActualizados" => $pedidosActualizados,
        "tablaActualizada" => "EncabPedidoChile"
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
