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

// Funciones de sanitización (las mismas que usas)
function limpiar_texto($txt)
{
    return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8");
}
function validar_entero($valor)
{
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor)
{
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

// Extraer datos
$filtros = $data["filtros"] ?? [];
$datosEnLote = $data["datosEnLote"] ?? [];

// Validar datos obligatorios
if (empty($filtros) || empty($datosEnLote)) {
    echo json_encode(["success" => false, "message" => "Faltan datos de filtros o datos en lote"]);
    exit;
}

// Extraer y validar filtros
$tipoFecha = limpiar_texto($filtros["tipoFecha"] ?? "fechaSalida");
$fechaDesde = limpiar_texto($filtros["fechaDesde"] ?? "");
$fechaHasta = limpiar_texto($filtros["fechaHasta"] ?? "");

// Validar fechas
if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "message" => "Fechas desde y hasta son obligatorias"]);
    exit;
}

// Extraer y validar datos en lote
$guiaMaster = limpiar_texto($datosEnLote["guiaMaster"] ?? "");
$guiaHija = limpiar_texto($datosEnLote["guiaHija"] ?? "");
$idAerolinea = validar_entero($datosEnLote["aerolineaId"] ?? null);
$idAgencia = validar_entero($datosEnLote["agenciaId"] ?? null);

// Validar datos obligatorios para actualización
if (!$idAerolinea || !$idAgencia) {
    echo json_encode(["success" => false, "message" => "Aerolínea y Agencia son campos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // Determinar el campo de fecha según el tipo
    $campoFecha = "";
    switch ($tipoFecha) {
        case "fechaEnroute":
            $campoFecha = "FechaEnroute";
            break;
        case "fechaDelivery":
            $campoFecha = "FechaDelivery";
            break;
        case "fechaSalida":
        default:
            $campoFecha = "FechaSalida";
            break;
    }

    // ============================================
    // 1. ACTUALIZAR TABLA EncabPedido (pedidos regulares)
    // ============================================
    $sqlUpdatePedidos = "UPDATE EncabPedido SET 
                            IdAerolinea = ?, 
                            IdAgencia = ?, 
                            GuiaMaster = ?, 
                            GuiaHija = ? 
                        WHERE $campoFecha BETWEEN ? AND ?";

    $stmtPedidos = $enlace->prepare($sqlUpdatePedidos);
    if (!$stmtPedidos) {
        throw new Exception("Error al preparar actualización de pedidos: " . $enlace->error);
    }

    $stmtPedidos->bind_param(
        "iissss",
        $idAerolinea,
        $idAgencia,
        $guiaMaster,
        $guiaHija,
        $fechaDesde,
        $fechaHasta
    );
    $stmtPedidos->execute();
    $pedidosActualizados = $stmtPedidos->affected_rows;

    if ($pedidosActualizados < 0) {
        throw new Exception("Error al actualizar los pedidos");
    }

    // ============================================
    // 2. ACTUALIZAR TABLA EncabPedidoSample (samples)
    // ============================================
    $sqlUpdateSamples = "UPDATE EncabPedidoSample SET 
                            IdAerolinea = ?, 
                            IdAgencia = ?, 
                            GuiaMaster = ?, 
                            GuiaHija = ? 
                        WHERE $campoFecha BETWEEN ? AND ?";

    $stmtSamples = $enlace->prepare($sqlUpdateSamples);
    if (!$stmtSamples) {
        throw new Exception("Error al preparar actualización de samples: " . $enlace->error);
    }

    $stmtSamples->bind_param(
        "iissss",
        $idAerolinea,
        $idAgencia,
        $guiaMaster,
        $guiaHija,
        $fechaDesde,
        $fechaHasta
    );
    $stmtSamples->execute();
    $samplesActualizadas = $stmtSamples->affected_rows;

    if ($samplesActualizadas < 0) {
        throw new Exception("Error al actualizar las samples");
    }

    $enlace->commit();

    // Respuesta exitosa
    $totalActualizados = $pedidosActualizados + $samplesActualizadas;

    echo json_encode([
        "success" => true,
        "message" => "Datos actualizados correctamente",
        "totalActualizados" => $totalActualizados,
        "pedidosActualizados" => $pedidosActualizados,
        "samplesActualizadas" => $samplesActualizadas,
        "datosAplicados" => [
            "aerolineaId" => $idAerolinea,
            "agenciaId" => $idAgencia,
            "guiaMaster" => $guiaMaster,
            "guiaHija" => $guiaHija,
            "rango_fechas" => [
                "tipo" => $tipoFecha,
                "desde" => $fechaDesde,
                "hasta" => $fechaHasta
            ]
        ]
    ]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar en lote: " . $e->getMessage()
    ]);
} finally {
    // Cerrar los statements solo una vez
    if (isset($stmtPedidos) && $stmtPedidos !== false) {
        @$stmtPedidos->close();
    }
    if (isset($stmtSamples) && $stmtSamples !== false) {
        @$stmtSamples->close();
    }
    $enlace->close();
}
