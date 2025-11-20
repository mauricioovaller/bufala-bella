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
    return trim($txt); // 👈 SOLO trim, sin htmlspecialchars
}

function limpiar_descripcion($txt) {
    // 👈 Para campos de descripción, solo trim y mantener caracteres especiales
    return trim($txt);
}
function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor) {
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}
function validar_tinyint($valor) {
    // Para TINYINT: convertir boolean a 1/0, cualquier valor truthy a 1, falsy a 0
    if ($valor === true || $valor === 1 || $valor === '1' || $valor === -1) {
        return 1;
    }
    return 0;
}

// Extraer datos
$encabezado = $data["encabezado"] ?? [];
$detalle = $data["detalle"] ?? [];

$idPedido = validar_entero($encabezado["pedidoId"] ?? null);
$idCliente = validar_entero($encabezado["clienteId"] ?? null);
$idClienteRegion = validar_entero($encabezado["regionId"] ?? null);
$idTransportadora = validar_entero($encabezado["transportadoraId"] ?? null);
$idBodega = validar_entero($encabezado["bodegaId"] ?? null);
$idAerolinea = validar_entero($encabezado["aerolineaId"] ?? null);
$idAgencia = validar_entero($encabezado["agenciaId"] ?? null);
$purchaseOrder = limpiar_texto($encabezado["purchaseOrder"] ?? "");
$fechaOrden = limpiar_texto($encabezado["fechaOrden"] ?? "");
$fechaSalida = limpiar_texto($encabezado["fechaSalida"] ?? "");
$fechaEnroute = limpiar_texto($encabezado["fechaEnroute"] ?? "");
$fechaDelivery = limpiar_texto($encabezado["fechaDelivery"] ?? "");
$fechaIngreso = limpiar_texto($encabezado["fechaIngreso"] ?? "");
$cantidadEstibas = validar_flotante($encabezado["cantidadEstibas"] ?? null);
$observaciones = limpiar_texto($encabezado["comentarios"] ?? "");
$guiaMaster = limpiar_texto($encabezado["noGuia"] ?? "");
$guiaHija = limpiar_texto($encabezado["guiaHija"] ?? "");

// 👇 NUEVO: Extraer y convertir comentarios seleccionados a TINYINT
$comentariosSeleccionados = $encabezado["comentariosSeleccionados"] ?? [];
$comentarioPrimario = validar_tinyint($comentariosSeleccionados["incluirPrimario"] ?? false);
$comentarioSecundario = validar_tinyint($comentariosSeleccionados["incluirSecundario"] ?? false);

// Validaciones obligatorias
if (!$idCliente || !$idTransportadora || !$idBodega || !$fechaOrden || empty($detalle)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // 👇 MODIFICADO: Actualizar encabezado con los nuevos campos TINYINT
    $sqlEnc = "UPDATE EncabPedido  
        SET Id_Cliente = ?, Id_ClienteRegion = ?, Id_Transportadora = ?, Id_Bodega = ?, PurchaseOrder = ?, FechaOrden = ?, FechaSalida = ?, FechaEnroute = ?, FechaDelivery = ?, FechaIngreso = ?, CantidadEstibas = ?, IdAerolinea = ?, IdAgencia = ?, GuiaMaster = ?, GuiaHija = ?, Observaciones = ?, ComentarioPrimario = ?, ComentarioSecundario = ?
        WHERE Id_EncabPedido = ?";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("iiiissssssdiisssiii", 
        $idCliente, 
        $idClienteRegion, 
        $idTransportadora, 
        $idBodega, 
        $purchaseOrder, 
        $fechaOrden, 
        $fechaSalida, 
        $fechaEnroute, 
        $fechaDelivery, 
        $fechaIngreso, 
        $cantidadEstibas, 
        $idAerolinea, 
        $idAgencia, 
        $guiaMaster, 
        $guiaHija, 
        $observaciones,
        $comentarioPrimario,    // 👈 Nuevo campo TINYINT
        $comentarioSecundario,  // 👈 Nuevo campo TINYINT
        $idPedido
    );
    $stmtEnc->execute();

    // Insertar detalle actualizado (sin cambios)
    $sqlDelDet = "DELETE FROM DetPedido WHERE Id_EncabPedido = ?";
    $stmtDelDet = $enlace->prepare($sqlDelDet);
    $stmtDelDet->bind_param("i", $idPedido);
    $stmtDelDet->execute();
    
    if ($stmtDelDet->affected_rows < 0) {
        throw new Exception("Error al eliminar detalle existente");
    }  

    $sqlDet = "INSERT INTO DetPedido 
        (Id_EncabPedido, Id_Producto, Descripcion, Id_Embalaje, Cantidad, PrecioUnitario) 
        VALUES (?, ?, ?, ?, ?, ?)";
    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($detalle as $item) {
        $idProducto = validar_entero($item["producto"] ?? null);
        $descripcion = limpiar_descripcion($item["descripcion"] ?? ""); // 👈 Usar limpiar_descripcion
        $idEmbalaje = validar_entero($item["embalaje"] ?? null);
        $cantidad = validar_flotante($item["cantidad"] ?? null);
        $precio = validar_flotante($item["precio"] ?? null);

        if (!$idProducto || !$descripcion || !$idEmbalaje || !$cantidad || !$precio) {
            throw new Exception("Datos inválidos en detalle");
        }

        $stmtDet->bind_param("iisidd", $idPedido, $idProducto, $descripcion, $idEmbalaje, $cantidad, $precio);
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("Error al insertar detalle");
        }
    }

    $enlace->commit();

    echo json_encode(["success" => true, "idPedido" => $idPedido]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>