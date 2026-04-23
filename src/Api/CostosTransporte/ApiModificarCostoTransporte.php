<?php
// ApiModificarCostoTransporte.php
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

// Función para limpiar texto
function limpiar_texto($texto)
{
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

$idCosto = $data["id"] ?? 0;
$cantidadCamiones = $data["CantidadCamiones"] ?? null;
$valorFlete = $data["ValorFlete"] ?? null;
$observaciones = limpiar_texto($data["Observaciones"] ?? "");
$usuarioModificacion = limpiar_texto($data["usuarioModificacion"] ?? "Sistema");
$horasExtras = array_key_exists("HorasExtras", $data) ? (is_numeric($data["HorasExtras"]) ? floatval($data["HorasExtras"]) : 0) : null;
$valorHorasExtras = array_key_exists("ValorHorasExtras", $data) ? (is_numeric($data["ValorHorasExtras"]) ? floatval($data["ValorHorasExtras"]) : 0) : null;

// Validaciones básicas
if (!is_numeric($idCosto) || $idCosto <= 0) {
    echo json_encode(["success" => false, "message" => "ID de costo no válido"]);
    exit;
}

// Verificar que el registro exista
$sqlCheck = "SELECT Fecha FROM CostosTransporteDiario WHERE Id_CostoTransporte = ?";
$stmtCheck = $enlace->prepare($sqlCheck);
$stmtCheck->bind_param("i", $idCosto);
$stmtCheck->execute();
$stmtCheck->bind_result($fechaExistente);
$stmtCheck->fetch();
$stmtCheck->close();

if (!$fechaExistente) {
    echo json_encode(["success" => false, "message" => "Registro de costo no encontrado"]);
    exit;
}

// Si se proporciona Fecha, validar que exista en EncabInvoice y no esté duplicada
$nuevaFecha = $data["Fecha"] ?? null;
if ($nuevaFecha !== null) {
    // Validar formato
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $nuevaFecha)) {
        echo json_encode(["success" => false, "message" => "Formato de fecha inválido. Use YYYY-MM-DD"]);
        exit;
    }

    // Validar que exista en EncabInvoice
    $sqlCheckFecha = "SELECT COUNT(*) FROM EncabInvoice WHERE Fecha = ?";
    $stmtCheckFecha = $enlace->prepare($sqlCheckFecha);
    $stmtCheckFecha->bind_param("s", $nuevaFecha);
    $stmtCheckFecha->execute();
    $stmtCheckFecha->bind_result($countFacturas);
    $stmtCheckFecha->fetch();
    $stmtCheckFecha->close();

    if ($countFacturas == 0) {
        echo json_encode(["success" => false, "message" => "No existen facturas para la fecha $nuevaFecha. La fecha debe tener al menos una factura registrada."]);
        exit;
    }

    // Validar que no exista otro registro con la misma fecha (excluyendo el actual)
    $sqlCheckDuplicado = "SELECT Id_CostoTransporte FROM CostosTransporteDiario WHERE Fecha = ? AND Id_CostoTransporte != ?";
    $stmtCheckDuplicado = $enlace->prepare($sqlCheckDuplicado);
    $stmtCheckDuplicado->bind_param("si", $nuevaFecha, $idCosto);
    $stmtCheckDuplicado->execute();
    $stmtCheckDuplicado->store_result();

    if ($stmtCheckDuplicado->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Ya existe otro registro de costo de transporte para la fecha $nuevaFecha"]);
        $stmtCheckDuplicado->close();
        exit;
    }
    $stmtCheckDuplicado->close();
}

// Construir consulta dinámica según los campos proporcionados
$campos = [];
$tipos = "";
$valores = [];

if ($nuevaFecha !== null) {
    $campos[] = "Fecha = ?";
    $tipos .= "s";
    $valores[] = $nuevaFecha;
}

if ($cantidadCamiones !== null) {
    if (!is_numeric($cantidadCamiones) || $cantidadCamiones <= 0) {
        echo json_encode(["success" => false, "message" => "La cantidad de camiones debe ser un número mayor a 0"]);
        exit;
    }
    $campos[] = "CantidadCamiones = ?";
    $tipos .= "d";
    $valores[] = $cantidadCamiones;
}

if ($valorFlete !== null) {
    if (!is_numeric($valorFlete) || $valorFlete <= 0) {
        echo json_encode(["success" => false, "message" => "El valor del flete debe ser un número mayor a 0"]);
        exit;
    }
    $campos[] = "ValorFlete = ?";
    $tipos .= "d";
    $valores[] = $valorFlete;
}

if ($observaciones !== null) {
    $campos[] = "Observaciones = ?";
    $tipos .= "s";
    $valores[] = $observaciones;
}

if ($horasExtras !== null) {
    $campos[] = "HorasExtras = ?";
    $tipos .= "d";
    $valores[] = $horasExtras;
}

if ($valorHorasExtras !== null) {
    $campos[] = "ValorHorasExtras = ?";
    $tipos .= "d";
    $valores[] = $valorHorasExtras;
}

// Siempre actualizar usuario de modificación (podría ser un campo separado si se desea)
// $campos[] = "UsuarioRegistro = ?";
// $tipos .= "s";
// $valores[] = $usuarioModificacion;

if (empty($campos)) {
    echo json_encode(["success" => false, "message" => "No se proporcionaron campos para actualizar"]);
    exit;
}

// Agregar ID al final de los valores
$valores[] = $idCosto;
$tipos .= "i";

// Construir SQL
$sql = "UPDATE CostosTransporteDiario SET " . implode(", ", $campos) . " WHERE Id_CostoTransporte = ?";
$stmt = $enlace->prepare($sql);

// Vincular parámetros dinámicamente
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
            "message" => "Costo de transporte actualizado exitosamente",
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
