<?php
//src/Api/PedidosChile/ApiGuardarPedido.php
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
function limpiar_texto($txt)
{
    return trim($txt); // 👈 SOLO trim, sin htmlspecialchars
}
function limpiar_descripcion($txt)
{
    // 👈 Para campos de descripción, solo trim y mantener caracteres especiales
    return trim($txt);
}
function validar_entero($valor)
{
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor)
{
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}
function validar_tinyint($valor)
{
    // Para TINYINT: convertir boolean a 1/0, cualquier valor truthy a 1, falsy a 0
    if ($valor === true || $valor === 1 || $valor === '1' || $valor === -1) {
        return 1;
    }
    return 0;
}

// Extraer datos
$encabezado = $data["encabezado"] ?? [];
$detalle = $data["detalle"] ?? [];

$idCliente = validar_entero($encabezado["clienteId"] ?? null);
$idAerolinea = validar_entero($encabezado["aerolineaId"] ?? null);
$idAgencia = validar_entero($encabezado["agenciaId"] ?? null);
$purchaseOrder = limpiar_texto($encabezado["purchaseOrder"] ?? "");
$fechaOrden = limpiar_texto($encabezado["fechaOrden"] ?? "");
$fechaSalida = limpiar_texto($encabezado["fechaSalida"] ?? "");
$fechaEnroute = limpiar_texto($encabezado["fechaEnroute"] ?? "");
$fechaDelivery = limpiar_texto($encabezado["fechaDelivery"] ?? "");
$fechaIngreso = limpiar_texto($encabezado["fechaIngreso"] ?? "");
$cantidadEstibas = validar_flotante($encabezado["cantidadEstibas"] ?? null);
$guiaMaster = limpiar_texto($encabezado["noGuia"] ?? "");
$guiaHija = limpiar_texto($encabezado["guiaHija"] ?? "");
$observaciones = limpiar_texto($encabezado["comentarios"] ?? "");

// 👇 NUEVO: Extraer y convertir comentarios seleccionados a TINYINT
$comentariosSeleccionados = $encabezado["comentariosSeleccionados"] ?? [];
$comentarioPrimario = validar_tinyint($comentariosSeleccionados["incluirPrimario"] ?? false);
$comentarioSecundario = validar_tinyint($comentariosSeleccionados["incluirSecundario"] ?? false);

// ✅ PASO 1: Validaciones obligatorias del encabezado
if (!$idCliente || !$fechaOrden || empty($detalle)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios del encabezado"]);
    exit;
}

// ✅ PASO 2: Validar TODOS los detalles ANTES de iniciar transacción
// Esto evita consumir IDs en caso de datos inválidos
$detallesValidados = [];
foreach ($detalle as $index => $item) {
    $idProducto = validar_entero($item["producto"] ?? null);
    $descripcion = limpiar_descripcion($item["descripcion"] ?? "");
    $idEmbalaje = validar_entero($item["embalaje"] ?? null);
    $cantidad = validar_flotante($item["cantidad"] ?? null);
    $pesoNeto = validar_flotante($item["pesoNeto"] ?? null);
    $pesoBruto = validar_flotante($item["pesoBruto"] ?? null);
    $precio = validar_flotante($item["precio"] ?? null);

    // Validación completa del item
    if (!$idProducto || !$descripcion || !$idEmbalaje || !$cantidad || !$precio) {
        echo json_encode([
            "success" => false,
            "message" => "Datos inválidos en detalle #{$index}: producto, descripción, embalaje, cantidad y precio son obligatorios"
        ]);
        exit;
    }

    // Guardar item validado
    $detallesValidados[] = [
        "idProducto" => $idProducto,
        "descripcion" => $descripcion,
        "idEmbalaje" => $idEmbalaje,
        "cantidad" => $cantidad,
        "pesoNeto" => $pesoNeto,
        "pesoBruto" => $pesoBruto,
        "precio" => $precio
    ];
}

// ✅ PASO 3: Iniciar transacción SOLO si TODO está validado
try {
    $enlace->begin_transaction();

    // Insertar encabezado
    $sqlEnc = "INSERT INTO EncabPedidoChile 
        (Id_Cliente, PurchaseOrder, FechaOrden, FechaSalida, FechaEnroute, FechaDelivery, FechaIngreso, CantidadEstibas, IdAerolinea, IdAgencia, GuiaMaster, GuiaHija, Observaciones, ComentarioPrimario, ComentarioSecundario) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param(
        "issssssdiisssii",
        $idCliente,
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
        $comentarioPrimario,
        $comentarioSecundario
    );
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("No se pudo insertar el encabezado del pedido");
    }

    $idEncabPedido = $enlace->insert_id;

    // Insertar detalles (sin validaciones, ya fueron validados)
    $sqlDet = "INSERT INTO DetPedidoChile 
        (Id_EncabPedido, Id_Producto, Descripcion, Id_Embalaje, Cantidad, PesoNeto, PesoBruto, PrecioUnitario) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($detallesValidados as $item) {
        $stmtDet->bind_param(
            "iisidddd",
            $idEncabPedido,
            $item["idProducto"],
            $item["descripcion"],
            $item["idEmbalaje"],
            $item["cantidad"],
            $item["pesoNeto"],
            $item["pesoBruto"],
            $item["precio"]
        );
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("No se pudo insertar un detalle del pedido");
        }
    }

    $enlace->commit();

    echo json_encode(["success" => true, "idPedido" => $idEncabPedido]);
} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiGuardarPedido.php - " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
