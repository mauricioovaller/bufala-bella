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

// Funciones de sanitización
function limpiar_texto($txt) {
    return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8");
}
function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor) {
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

// Extraer datos
$encabezado = $data["encabezado"] ?? [];
$detalle = $data["detalle"] ?? [];

$idCliente = validar_entero($encabezado["clienteId"] ?? null);
$idClienteRegion = validar_entero($encabezado["regionId"] ?? null);
$idTransportadora = validar_entero($encabezado["transportadoraId"] ?? null);
$idBodega = validar_entero($encabezado["bodegaId"] ?? null);
$purchaseOrder = limpiar_texto($encabezado["purchaseOrder"] ?? "");
$fechaOrden = limpiar_texto($encabezado["fechaOrden"] ?? "");
$fechaSalida = limpiar_texto($encabezado["fechaSalida"] ?? "");
$fechaEnroute = limpiar_texto($encabezado["fechaEnroute"] ?? "");
$fechaDelivery = limpiar_texto($encabezado["fechaDelivery"] ?? "");
$fechaIngreso = limpiar_texto($encabezado["fechaIngreso"] ?? "");
$cantidadEstibas = validar_flotante($encabezado["cantidadEstibas"] ?? null);
$observaciones = limpiar_texto($encabezado["comentarios"] ?? "");

// Validaciones obligatorias
if (!$idCliente || !$idTransportadora || !$idBodega || !$fechaOrden || empty($detalle)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // Insertar encabezado
    $sqlEnc = "INSERT INTO EncabPedido 
        (Id_Cliente, Id_ClienteRegion, Id_Transportadora, Id_Bodega, PurchaseOrder, FechaOrden, FechaSalida, FechaEnroute, FechaDelivery, FechaIngreso, CantidadEstibas, Observaciones) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("iiiissssssds", $idCliente, $idClienteRegion, $idTransportadora, $idBodega, $purchaseOrder, $fechaOrden, $fechaSalida, $fechaEnroute, $fechaDelivery, $fechaIngreso, $cantidadEstibas, $observaciones);
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("Error al insertar el encabezado");
    }

    $idEncabPedido = $enlace->insert_id;

    // Insertar detalle
    $sqlDet = "INSERT INTO DetPedido 
        (Id_EncabPedido, Id_Producto, Descripcion, Id_Embalaje, Cantidad, PrecioUnitario) 
        VALUES (?, ?, ?, ?, ?, ?)";
    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($detalle as $item) {
        $idProducto = validar_entero($item["producto"] ?? null);
        $descripcion = limpiar_texto($item["descripcion"] ?? "");
        $idEmbalaje = validar_entero($item["embalaje"] ?? null);
        $cantidad = validar_flotante($item["cantidad"] ?? null);
        $precio = validar_flotante($item["precio"] ?? null);

        if (!$idProducto || !$descripcion || !$idEmbalaje || !$cantidad || !$precio) {
            throw new Exception("Datos inválidos en detalle");
        }

        $stmtDet->bind_param("iisidd", $idEncabPedido, $idProducto, $descripcion, $idEmbalaje, $cantidad, $precio);
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("Error al insertar detalle");
        }
    }

    $enlace->commit();

    echo json_encode(["success" => true, "idPedido" => $idEncabPedido]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
