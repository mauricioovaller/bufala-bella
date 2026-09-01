<?php
// ApiModificarCostoAereo.php
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

function limpiar_texto($texto)
{
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

$idCosto = $data["id"] ?? 0;
$fecha = $data["Fecha"] ?? null;
$guiaMaster = isset($data["GuiaMaster"]) ? limpiar_texto(trim($data["GuiaMaster"])) : null;
$tipoPedido = $data["TipoPedido"] ?? null;
$valorFleteUSD = $data["ValorFleteUSD"] ?? null;
$trm = $data["TRM"] ?? null;
$pesoCobrado = $data["PesoCobrado"] ?? null;
$observaciones = isset($data["Observaciones"]) ? limpiar_texto($data["Observaciones"]) : null;

if (!is_numeric($idCosto) || $idCosto <= 0) {
    echo json_encode(["success" => false, "message" => "ID de costo aéreo no válido"]);
    exit;
}

// Verificar que el registro exista
$sqlCheck = "SELECT Fecha, GuiaMaster, TipoPedido FROM CostosTransporteAereo WHERE Id_CostoTransporteAereo = ?";
$stmtCheck = $enlace->prepare($sqlCheck);
$stmtCheck->bind_param("i", $idCosto);
$stmtCheck->execute();
$stmtCheck->bind_result($fechaExistente, $gmExistente, $tipoExistente);
$stmtCheck->fetch();
$stmtCheck->close();

if (!$fechaExistente) {
    echo json_encode(["success" => false, "message" => "Registro de costo aéreo no encontrado"]);
    exit;
}

// Validar tipo de pedido si viene en la peticion
if ($tipoPedido !== null && !in_array($tipoPedido, ['normal', 'chile'], true)) {
    echo json_encode(["success" => false, "message" => "Tipo de pedido no vÃ¡lido"]);
    exit;
}

$tipoEfectivo = $tipoPedido !== null ? $tipoPedido : $tipoExistente;

// Si se proporciona Fecha+GuiaMaster, validar
$nuevaFecha = $fecha ?? $fechaExistente;
$nuevaGM = $guiaMaster ?? $gmExistente;

// Validar formato de fecha si se proporciona
if ($fecha !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    echo json_encode(["success" => false, "message" => "Formato de fecha inválido. Use YYYY-MM-DD"]);
    exit;
}

// Validar que la Fecha+GuiaMaster existan en la tabla de facturas del tipo
$tablaFacturas = $tipoEfectivo === 'chile' ? 'EncabInvoiceChile' : 'EncabInvoice';
$sqlCheckGM = "SELECT COUNT(*) FROM {$tablaFacturas} WHERE Fecha = ? AND GuiaMaster = ?";
$stmtCheckGM = $enlace->prepare($sqlCheckGM);
$stmtCheckGM->bind_param("ss", $nuevaFecha, $nuevaGM);
$stmtCheckGM->execute();
$stmtCheckGM->bind_result($countGM);
$stmtCheckGM->fetch();
$stmtCheckGM->close();

if ($countGM == 0) {
    echo json_encode(["success" => false, "message" => "No existe una factura con Fecha $nuevaFecha y Guía Master '$nuevaGM' en EncabInvoice"]);
    exit;
}

// Validar duplicado excluyendo el actual
if ($nuevaFecha !== $fechaExistente || $nuevaGM !== $gmExistente || $tipoEfectivo !== $tipoExistente) {
    $sqlCheckDup = "SELECT Id_CostoTransporteAereo FROM CostosTransporteAereo WHERE Fecha = ? AND GuiaMaster = ? AND TipoPedido = ? AND Id_CostoTransporteAereo != ?";
    $stmtCheckDup = $enlace->prepare($sqlCheckDup);
    $stmtCheckDup->bind_param("sssi", $nuevaFecha, $nuevaGM, $tipoEfectivo, $idCosto);
    $stmtCheckDup->execute();
    $stmtCheckDup->store_result();

    if ($stmtCheckDup->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Ya existe otro registro con Fecha $nuevaFecha y Guía Master '$nuevaGM'"]);
        $stmtCheckDup->close();
        exit;
    }
    $stmtCheckDup->close();
}

// Construir consulta dinámica
$campos = [];
$tipos = "";
$valores = [];

if ($fecha !== null) {
    $campos[] = "Fecha = ?";
    $tipos .= "s";
    $valores[] = $fecha;
}

if ($guiaMaster !== null) {
    $campos[] = "GuiaMaster = ?";
    $tipos .= "s";
    $valores[] = $guiaMaster;
}

if ($tipoPedido !== null) {
    $campos[] = "TipoPedido = ?";
    $tipos .= "s";
    $valores[] = $tipoPedido;
}

if ($valorFleteUSD !== null) {
    if (!is_numeric($valorFleteUSD) || $valorFleteUSD <= 0) {
        echo json_encode(["success" => false, "message" => "El valor del flete USD debe ser un número mayor a 0"]);
        exit;
    }
    $campos[] = "ValorFleteUSD = ?";
    $tipos .= "d";
    $valores[] = $valorFleteUSD;
}

if ($trm !== null) {
    if (!is_numeric($trm) || $trm <= 0) {
        echo json_encode(["success" => false, "message" => "La TRM debe ser un número mayor a 0"]);
        exit;
    }
    $campos[] = "TRM = ?";
    $tipos .= "d";
    $valores[] = $trm;
}

if ($pesoCobrado !== null) {
    if (!is_numeric($pesoCobrado) || $pesoCobrado <= 0) {
        echo json_encode(["success" => false, "message" => "El peso cobrado debe ser un número mayor a 0"]);
        exit;
    }
    $campos[] = "PesoCobrado = ?";
    $tipos .= "d";
    $valores[] = $pesoCobrado;
}

if ($observaciones !== null) {
    $campos[] = "Observaciones = ?";
    $tipos .= "s";
    $valores[] = $observaciones;
}

if (empty($campos)) {
    echo json_encode(["success" => false, "message" => "No se proporcionaron campos para actualizar"]);
    exit;
}

$valores[] = $idCosto;
$tipos .= "i";

$sql = "UPDATE CostosTransporteAereo SET " . implode(", ", $campos) . " WHERE Id_CostoTransporteAereo = ?";
$stmt = $enlace->prepare($sql);

$bindParams = [$tipos];
foreach ($valores as $key => $value) {
    $bindParams[] = &$valores[$key];
}
call_user_func_array([$stmt, 'bind_param'], $bindParams);

if ($stmt->execute()) {
    $affectedRows = $stmt->affected_rows;
    if ($affectedRows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Costo aéreo actualizado exitosamente",
            "id" => $idCosto,
            "affectedRows" => $affectedRows
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "No se realizaron cambios en el registro"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Error al actualizar: " . $stmt->error]);
}

$stmt->close();
$enlace->close();
?>
