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

function limpiar_texto($txt) { return trim($txt ?? ''); }
function validar_entero($valor) { return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null; }
function validar_flotante($valor) { return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : 0; }

$encabezado = $data["encabezado"] ?? [];
$detalle = $data["detalle"] ?? [];

$idCliente = validar_entero($encabezado["clienteId"] ?? null);
$fecha = limpiar_texto($encabezado["fecha"] ?? date('Y-m-d'));
$motivo = limpiar_texto($encabezado["motivo"] ?? "");

// Paso 1: Validar encabezado
if (!$idCliente) {
    echo json_encode(["success" => false, "message" => "El cliente es obligatorio"]);
    exit;
}

if (!$fecha || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    echo json_encode(["success" => false, "message" => "Fecha inválida"]);
    exit;
}

// Paso 2: Validar TODOS los detalles antes de la transacción
if (empty($detalle)) {
    echo json_encode(["success" => false, "message" => "Debe agregar al menos un producto a la nota crédito"]);
    exit;
}

$detallesValidados = [];
$totalCOP = 0;
$totalUSD = 0;

foreach ($detalle as $index => $item) {
    $idEncabPedido = validar_entero($item["idEncabPedido"] ?? null);
    $idDetPedido = validar_entero($item["idDetPedido"] ?? null);
    $idProducto = validar_entero($item["idProducto"] ?? null);
    $descripcion = limpiar_texto($item["descripcion"] ?? "");
    $idEmbalaje = validar_entero($item["idEmbalaje"] ?? null);
    $cantidadOriginal = validar_flotante($item["cantidadOriginal"] ?? 0);
    $cantidadCredito = validar_flotante($item["cantidadCredito"] ?? 0);
    $pesoNetoCredito = validar_flotante($item["pesoNetoCredito"] ?? 0);
    $precioUnitario = validar_flotante($item["precioUnitario"] ?? 0);
    $valorCreditoCOP = validar_flotante($item["valorCreditoCOP"] ?? 0);
    $fechaSalidaPedido = limpiar_texto($item["fechaSalidaPedido"] ?? "");
    $itemNumber = intval($index) + 1;

    if (!$idEncabPedido || !$idDetPedido || !$idProducto) {
        echo json_encode([
            "success" => false,
            "message" => "Item #{$itemNumber}: datos de pedido/producto inválidos"
        ]);
        exit;
    }

    // Saltar items con cantidad cero (el usuario los dejó sin crédito)
    if ($cantidadCredito <= 0) {
        continue;
    }

    $totalCOP += $valorCreditoCOP;
    $detallesValidados[] = [
        "idEncabPedido" => $idEncabPedido,
        "idDetPedido" => $idDetPedido,
        "idProducto" => $idProducto,
        "descripcion" => $descripcion,
        "idEmbalaje" => $idEmbalaje,
        "cantidadOriginal" => $cantidadOriginal,
        "cantidadCredito" => $cantidadCredito,
        "pesoNetoCredito" => $pesoNetoCredito,
        "precioUnitario" => $precioUnitario,
        "valorCreditoCOP" => $valorCreditoCOP,
        "fechaSalidaPedido" => $fechaSalidaPedido,
        "item" => $itemNumber
    ];
}

// Validar que al menos un item tenga crédito después de filtrar ceros
if (empty($detallesValidados)) {
    echo json_encode(["success" => false, "message" => "Debe acreditar al menos una caja en el detalle."]);
    exit;
}

// Paso 3: Generar número de nota crédito
$stmtNum = $enlace->prepare("SELECT COUNT(*) FROM EncabNotaCredito");
$stmtNum->execute();
$stmtNum->bind_result($count);
$stmtNum->fetch();
$stmtNum->close();
$numero = 'NC-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

// Paso 4: Iniciar transacción
try {
    $enlace->begin_transaction();

    $sqlEnc = "INSERT INTO EncabNotaCredito (Id_Cliente, Numero, Fecha, Motivo, ValorTotalCOP, ValorTotalUSD, Estado)
               VALUES (?, ?, ?, ?, ?, ?, 'Activo')";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("isssdd", $idCliente, $numero, $fecha, $motivo, $totalCOP, $totalUSD);
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("No se pudo insertar el encabezado de la nota crédito");
    }

    $idEncabNotaCredito = $enlace->insert_id;

    $sqlDet = "INSERT INTO DetNotaCredito 
        (Id_EncabNotaCredito, Id_EncabPedido, Id_DetPedido, Id_Producto, Descripcion, Id_Embalaje, CantidadOriginal, CantidadCredito, PesoNetoCredito, PrecioUnitario, ValorCreditoCOP, FechaSalidaPedido, Item)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($detallesValidados as $item) {
        $stmtDet->bind_param(
            "iiiisidddddsi",
            $idEncabNotaCredito,
            $item["idEncabPedido"],
            $item["idDetPedido"],
            $item["idProducto"],
            $item["descripcion"],
            $item["idEmbalaje"],
            $item["cantidadOriginal"],
            $item["cantidadCredito"],
            $item["pesoNetoCredito"],
            $item["precioUnitario"],
            $item["valorCreditoCOP"],
            $item["fechaSalidaPedido"],
            $item["item"]
        );
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("No se pudo insertar un detalle de la nota crédito");
        }
    }

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "idNotaCredito" => $idEncabNotaCredito,
        "numero" => $numero,
        "valorTotalCOP" => $totalCOP,
        "valorTotalUSD" => $totalUSD
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiGuardarNotaCredito.php - " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
