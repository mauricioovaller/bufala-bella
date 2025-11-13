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

    // Construir la consulta de actualización
    $sqlUpdate = "UPDATE EncabPedido SET 
                    IdAerolinea = ?, 
                    IdAgencia = ?, 
                    GuiaMaster = ?, 
                    GuiaHija = ? 
                  WHERE ";

    // Construir la condición WHERE según el tipo de fecha
    $whereConditions = [];
    $params = [];
    $paramTypes = "iiss"; // tipos: idAerolinea, idAgencia, guiaMaster, guiaHija

    // Agregar parámetros para la actualización
    $params[] = $idAerolinea;
    $params[] = $idAgencia;
    $params[] = $guiaMaster;
    $params[] = $guiaHija;

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

    // Construir condición de fecha
    $whereConditions[] = "$campoFecha BETWEEN ? AND ?";
    $paramTypes .= "ss"; // dos strings para las fechas
    $params[] = $fechaDesde;
    $params[] = $fechaHasta;

    // Combinar condiciones WHERE
    $sqlUpdate .= implode(" AND ", $whereConditions);

    // Preparar y ejecutar la consulta
    $stmt = $enlace->prepare($sqlUpdate);
    
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $enlace->error);
    }

    // Vincular parámetros dinámicamente
    $stmt->bind_param($paramTypes, ...$params);
    $stmt->execute();

    $pedidosActualizados = $stmt->affected_rows;

    if ($pedidosActualizados < 0) {
        throw new Exception("Error al actualizar los pedidos");
    }

    $enlace->commit();

    // Respuesta exitosa
    echo json_encode([
        "success" => true, 
        "message" => "Datos actualizados correctamente",
        "pedidosActualizados" => $pedidosActualizados,
        "datosAplicados" => [
            "aerolineaId" => $idAerolinea,
            "agenciaId" => $idAgencia,
            "guiaMaster" => $guiaMaster,
            "guiaHija" => $guiaHija
        ]
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode([
        "success" => false, 
        "message" => "Error al actualizar en lote: " . $e->getMessage()
    ]);
}

$stmt->close();
$enlace->close();
?>