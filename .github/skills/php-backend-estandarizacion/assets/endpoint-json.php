<?php
header('Content-Type: application/json; charset=UTF-8');

function responderJson($payload, $status = 200)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJson(['success' => false, 'message' => 'Método no permitido', 'datos' => []], 405);
}

// Cargar aquí la conexión existente del módulo.
require_once __DIR__ . '/../conexionBaseDatos/conexionbd.php';
/** @var mysqli $enlace */
$enlace->set_charset('utf8mb4');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || json_last_error() !== JSON_ERROR_NONE) {
    responderJson(['success' => false, 'message' => 'JSON de entrada no válido', 'datos' => []], 400);
}

try {
    $idEntidad = 0;
    $nombre = '';
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        responderJson(['success' => false, 'message' => 'ID no válido', 'datos' => []], 400);
    }

    $sql = 'SELECT IdEntidad, Nombre FROM TablaEntidad WHERE IdEntidad = ?';
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception('Error preparando consulta: ' . $enlace->error);
    }
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        throw new Exception('Error ejecutando consulta: ' . $stmt->error);
    }
    $stmt->bind_result($idEntidad, $nombre);

    if (!$stmt->fetch()) {
        $stmt->close();
        responderJson(['success' => false, 'message' => 'Registro no encontrado', 'datos' => []], 404);
    }
    $stmt->close();

    responderJson([
        'success' => true,
        'message' => 'Consulta exitosa',
        'datos' => ['id' => intval($idEntidad), 'nombre' => $nombre],
    ]);
} catch (Throwable $exception) {
    error_log('Error en endpoint PHP: ' . $exception->getMessage());
    responderJson(['success' => false, 'message' => 'Error interno del servidor', 'datos' => []], 500);
}
