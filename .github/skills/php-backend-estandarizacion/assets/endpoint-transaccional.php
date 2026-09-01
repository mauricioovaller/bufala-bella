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

// Validar encabezado y todos los detalles antes de iniciar la transacción.
$campo = trim((string)($input['campo'] ?? ''));
$detalles = $input['detalles'] ?? [];
if ($campo === '' || !is_array($detalles) || count($detalles) === 0) {
    responderJson(['success' => false, 'message' => 'Datos incompletos', 'datos' => []], 400);
}

try {
    $idEncabezado = 0;
    $enlace->begin_transaction();

    $stmtHeader = $enlace->prepare(
        'INSERT INTO TablaEncabezado (Campo) VALUES (?)'
    );
    if (!$stmtHeader) {
        throw new Exception('Error preparando encabezado: ' . $enlace->error);
    }
    $stmtHeader->bind_param('s', $campo);
    if (!$stmtHeader->execute()) {
        throw new Exception('Error guardando encabezado: ' . $stmtHeader->error);
    }
    $idEncabezado = $enlace->insert_id;
    $stmtHeader->close();

    $stmtDetail = $enlace->prepare(
        'INSERT INTO TablaDetalle (IdEncabezado, Campo) VALUES (?, ?)'
    );
    if (!$stmtDetail) {
        throw new Exception('Error preparando detalle: ' . $enlace->error);
    }
    foreach ($detalles as $detalle) {
        $valor = trim((string)($detalle['valor'] ?? ''));
        $stmtDetail->bind_param('is', $idEncabezado, $valor);
        if (!$stmtDetail->execute()) {
            throw new Exception('Error guardando detalle: ' . $stmtDetail->error);
        }
    }
    $stmtDetail->close();

    $enlace->commit();
    responderJson([
        'success' => true,
        'message' => 'Registro guardado correctamente',
        'datos' => ['id' => $idEncabezado],
    ]);
} catch (Throwable $exception) {
    $enlace->rollback();
    error_log('Error transaccional PHP: ' . $exception->getMessage());
    responderJson(['success' => false, 'message' => 'No fue posible guardar la información', 'datos' => []], 500);
}
