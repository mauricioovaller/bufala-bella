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

function limpiar_texto($txt) {
    return trim($txt);
}
function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}

$idLote = validar_entero($data['idLote'] ?? null);
$codigoLote = limpiar_texto($data['codigoLote'] ?? '');
$descripcion = limpiar_texto($data['descripcion'] ?? '');
$fechaCreacion = limpiar_texto($data['fechaCreacion'] ?? '');
$activo = isset($data['activo']) ? (int)$data['activo'] : 1;

if (empty($codigoLote)) {
    echo json_encode(["success" => false, "message" => "El código de lote es obligatorio"]);
    exit;
}

try {
    if ($idLote) {
        // Actualizar
        $sql = "UPDATE Lotes SET CodigoLote = ?, Descripcion = ?, FechaCreacion = ?, Activo = ? WHERE Id_Lote = ?";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("sssii", $codigoLote, $descripcion, $fechaCreacion, $activo, $idLote);
    } else {
        // Insertar
        $sql = "INSERT INTO Lotes (CodigoLote, Descripcion, FechaCreacion, Activo) VALUES (?, ?, ?, ?)";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("sssi", $codigoLote, $descripcion, $fechaCreacion, $activo);
    }
    
    if ($stmt->execute()) {
        if (!$idLote) $idLote = $enlace->insert_id;
        echo json_encode(["success" => true, "idLote" => $idLote, "message" => "Lote guardado correctamente"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al guardar lote: " . $stmt->error]);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>