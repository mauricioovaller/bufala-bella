<?php
header("Content-Type: application/json");

// Solo POST permitido
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Validar ID de factura y número de factura
$facturaId = isset($data["facturaId"]) ? intval($data["facturaId"]) : null;
$numeroFacturaCompleto = isset($data["numeroFactura"]) ? trim($data["numeroFactura"]) : null;

if (!$facturaId || !$numeroFacturaCompleto) {
    echo json_encode(["success" => false, "message" => "ID de factura o número de factura no válido"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // 1. VERIFICAR QUE LA FACTURA EXISTE EN EncabInvoice
    $sqlVerificarFactura = "SELECT Id_EncabInvoice FROM EncabInvoice WHERE Id_EncabInvoice = ?";
    $stmtVerificarFactura = $enlace->prepare($sqlVerificarFactura);
    $stmtVerificarFactura->bind_param("i", $facturaId);
    $stmtVerificarFactura->execute();
    $stmtVerificarFactura->store_result();
    
    if ($stmtVerificarFactura->num_rows === 0) {
        throw new Exception("Factura no encontrada en el sistema");
    }
    $stmtVerificarFactura->close();

    // 2. ELIMINAR DETALLE DE LA FACTURA
    $sqlDeleteDet = "DELETE FROM DetInvoice WHERE Id_EncabInvoice = ?";
    $stmtDeleteDet = $enlace->prepare($sqlDeleteDet);
    $stmtDeleteDet->bind_param("i", $facturaId);
    $stmtDeleteDet->execute();
    $stmtDeleteDet->close();

    // 3. ELIMINAR ENCABEZADO DE LA FACTURA
    $sqlDeleteEnc = "DELETE FROM EncabInvoice WHERE Id_EncabInvoice = ?";
    $stmtDeleteEnc = $enlace->prepare($sqlDeleteEnc);
    $stmtDeleteEnc->bind_param("i", $facturaId);
    $stmtDeleteEnc->execute();

    if ($stmtDeleteEnc->affected_rows === 0) {
        throw new Exception("No se pudo eliminar el encabezado de la factura");
    }
    $stmtDeleteEnc->close();

    // 4. ACTUALIZAR PEDIDOS - PONER FacturaNo EN BLANCO usando el número completo (FEX-2417)
    $sqlUpdatePedidos = "UPDATE EncabPedido SET FacturaNo = '' WHERE FacturaNo = ?";
    $stmtUpdatePedidos = $enlace->prepare($sqlUpdatePedidos);
    $stmtUpdatePedidos->bind_param("s", $numeroFacturaCompleto);
    $stmtUpdatePedidos->execute();

    $pedidosActualizados = $stmtUpdatePedidos->affected_rows;
    $stmtUpdatePedidos->close();

    $enlace->commit();

    echo json_encode([
        "success" => true, 
        "message" => "Factura eliminada correctamente",
        "pedidosActualizados" => $pedidosActualizados,
        "numeroFactura" => $numeroFacturaCompleto
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>