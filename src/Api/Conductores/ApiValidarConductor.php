<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$tipo = trim($input['tipo'] ?? '');
$idConductor = intval($input['idConductor'] ?? 0);
$documento = trim($input['documento'] ?? '');
$nombre = trim($input['nombre'] ?? '');

if (empty($documento) || empty($nombre)) {
    echo json_encode(["success" => false, "message" => "Datos incompletos para validación"]);
    exit;
}

if ($tipo === "nuevo") {
    // Verificar si existe algún conductor con el mismo documento o el mismo nombre
    $sql = "SELECT Id_Conductor FROM Conductores WHERE NoDocumento = ? OR Nombre = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ss", $documento, $nombre);
} else {
    // En edición, excluir el registro actual
    $sql = "SELECT Id_Conductor FROM Conductores WHERE (NoDocumento = ? OR Nombre = ?) AND Id_Conductor != ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ssi", $documento, $nombre, $idConductor);
}

$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    // Obtener el campo que causó el conflicto para dar un mensaje más específico
    $stmt->bind_result($idExistente);
    $stmt->fetch();
    // Podríamos hacer una segunda consulta para saber si es documento o nombre, pero simplificamos
    echo json_encode([
        "success" => false,
        "message" => "Ya existe un conductor con el mismo documento o nombre."
    ]);
} else {
    echo json_encode([
        "success" => true,
        "message" => "Conductor válido"
    ]);
}

$stmt->close();
$enlace->close();
