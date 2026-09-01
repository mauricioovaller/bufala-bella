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

function limpiar_texto($txt) { return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8"); }
function validar_entero($valor) { return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null; }

$filtros = $data["filtros"] ?? [];
$datosEnLote = $data["datosEnLote"] ?? [];

if (empty($filtros) || empty($datosEnLote)) {
    echo json_encode(["success" => false, "message" => "Faltan datos de filtros o datos en lote"]);
    exit;
}

$tipoFecha = limpiar_texto($filtros["tipoFecha"] ?? "fechaSalida");
$fechaDesde = limpiar_texto($filtros["fechaDesde"] ?? "");
$fechaHasta = limpiar_texto($filtros["fechaHasta"] ?? "");

if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "message" => "Fechas desde y hasta son obligatorias"]);
    exit;
}

$guiaMaster = limpiar_texto($datosEnLote["guiaMaster"] ?? "");
$guiaHija = limpiar_texto($datosEnLote["guiaHija"] ?? "");
$idAerolinea = validar_entero($datosEnLote["aerolineaId"] ?? null);
$idAgencia = validar_entero($datosEnLote["agenciaId"] ?? null);

if (!$idAerolinea || !$idAgencia) {
    echo json_encode(["success" => false, "message" => "Aerolínea y Agencia son campos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    $campoFecha = "";
    switch ($tipoFecha) {
        case "fechaEnroute": $campoFecha = "FechaEnroute"; break;
        case "fechaDelivery": $campoFecha = "FechaDelivery"; break;
        default: $campoFecha = "FechaSalida"; break;
    }

    $sqlUpdate = "UPDATE EncabPedidoChile SET
                    IdAerolinea = ?,
                    IdAgencia = ?,
                    GuiaMaster = ?,
                    GuiaHija = ?
                  WHERE $campoFecha BETWEEN ? AND ?";

    $stmt = $enlace->prepare($sqlUpdate);
    if (!$stmt) {
        throw new Exception("Error al preparar actualización: " . $enlace->error);
    }

    $stmt->bind_param("iissss", $idAerolinea, $idAgencia, $guiaMaster, $guiaHija, $fechaDesde, $fechaHasta);
    $stmt->execute();
    $actualizados = $stmt->affected_rows;

    if ($actualizados < 0) {
        throw new Exception("Error al actualizar los pedidos Chile");
    }

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Datos actualizados correctamente",
        "totalActualizados" => $actualizados,
        "pedidosActualizados" => $actualizados,
        "datosAplicados" => [
            "aerolineaId" => $idAerolinea,
            "agenciaId" => $idAgencia,
            "guiaMaster" => $guiaMaster,
            "guiaHija" => $guiaHija,
            "rango_fechas" => ["tipo" => $tipoFecha, "desde" => $fechaDesde, "hasta" => $fechaHasta]
        ]
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error al actualizar en lote: " . $e->getMessage()]);
} finally {
    if (isset($stmt) && $stmt !== false) { @$stmt->close(); }
    $enlace->close();
}
?>
