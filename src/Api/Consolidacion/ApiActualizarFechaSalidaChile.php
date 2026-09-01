<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

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
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

function limpiar_texto($txt) { return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8"); }
function validar_entero($valor) { return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null; }
function validar_fecha($fecha) {
    if (empty($fecha)) return null;
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        $fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha);
        if ($fecha_obj && $fecha_obj->format('Y-m-d') === $fecha) return $fecha;
    }
    return null;
}

$pedidoId = validar_entero($data["pedidoId"] ?? null);
$nuevaFechaSalida = validar_fecha($data["nuevaFechaSalida"] ?? null);

if (!$pedidoId) {
    echo json_encode(["success" => false, "message" => "ID del pedido es requerido"]);
    exit;
}

if (!$nuevaFechaSalida) {
    echo json_encode(["success" => false, "message" => "Fecha de salida no válida. Formato requerido: YYYY-MM-DD"]);
    exit;
}

try {
    $sqlVerificar = "SELECT Id_EncabPedido FROM EncabPedidoChile WHERE Id_EncabPedido = ?";
    $stmtVerificar = $enlace->prepare($sqlVerificar);
    $stmtVerificar->bind_param("i", $pedidoId);
    $stmtVerificar->execute();
    $stmtVerificar->store_result();

    if ($stmtVerificar->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Pedido no encontrado en la tabla EncabPedidoChile"]);
        exit;
    }
    $stmtVerificar->close();

    $tabla = 'EncabPedidoChile';
    $enlace->begin_transaction();

    $sqlFechaActual = "SELECT FechaSalida, FechaSalida_Orig FROM {$tabla} WHERE Id_EncabPedido = ?";
    $stmtFechaActual = $enlace->prepare($sqlFechaActual);
    $stmtFechaActual->bind_param("i", $pedidoId);
    $stmtFechaActual->execute();
    $stmtFechaActual->bind_result($fechaAnterior, $fechaSalidaOrig);
    $stmtFechaActual->fetch();
    $stmtFechaActual->close();

    $cambioRealFecha = ($nuevaFechaSalida !== $fechaAnterior);
    $debeGuardarOrig = $cambioRealFecha && ($fechaSalidaOrig === null || $fechaSalidaOrig === '');
    if ($debeGuardarOrig) {
        $sqlGuardarOrig = "UPDATE {$tabla} SET FechaSalida_Orig = ?, FechaModificacion = NOW() WHERE Id_EncabPedido = ?";
        $stmtGuardarOrig = $enlace->prepare($sqlGuardarOrig);
        $stmtGuardarOrig->bind_param("si", $fechaAnterior, $pedidoId);
        $stmtGuardarOrig->execute();
        $stmtGuardarOrig->close();
    }

    $sqlActualizar = "UPDATE {$tabla} SET FechaSalida = ? WHERE Id_EncabPedido = ?";
    $stmtActualizar = $enlace->prepare($sqlActualizar);
    $stmtActualizar->bind_param("si", $nuevaFechaSalida, $pedidoId);
    $stmtActualizar->execute();

    if ($stmtActualizar->affected_rows > 0) {
        $enlace->commit();
        echo json_encode([
            "success" => true,
            "message" => "Fecha de salida actualizada correctamente",
            "pedidoId" => $pedidoId,
            "nuevaFechaSalida" => $nuevaFechaSalida,
            "fechaActualizacion" => date('Y-m-d H:i:s')
        ]);
    } else {
        $enlace->rollback();
        echo json_encode([
            "success" => true,
            "message" => "La fecha de salida ya estaba establecida en el valor solicitado",
            "pedidoId" => $pedidoId,
            "fechaSalida" => $nuevaFechaSalida
        ]);
    }

    $stmtActualizar->close();
} catch (Exception $e) {
    if (isset($enlace)) { $enlace->rollback(); }
    error_log("Error al actualizar fecha de salida Chile: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error interno del servidor: " . $e->getMessage()]);
}

if (isset($enlace)) { $enlace->close(); }
?>
