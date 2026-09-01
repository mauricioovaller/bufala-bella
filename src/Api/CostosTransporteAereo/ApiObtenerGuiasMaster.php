<?php
// ApiObtenerGuiasMaster.php
// Endpoint auxiliar: dado una Fecha, retorna los GuiaMaster disponibles
// en EncabInvoice para esa fecha (no vacios)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Método no permitido. Usa POST."]);
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$fecha = $input['fecha'] ?? null;
$tipoPedido = $input['tipoPedido'] ?? 'normal';

if (!$fecha || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    echo json_encode(["success" => false, "error" => "Fecha no válida. Use YYYY-MM-DD"]);
    exit;
}

if (!in_array($tipoPedido, ['normal', 'chile'], true)) {
    $tipoPedido = 'normal';
}

try {
    $tablaFacturas = $tipoPedido === 'chile' ? 'EncabInvoiceChile' : 'EncabInvoice';
    $sql = "SELECT DISTINCT GuiaMaster FROM {$tablaFacturas}
            WHERE Fecha = ? AND GuiaMaster IS NOT NULL AND GuiaMaster != ''
            ORDER BY GuiaMaster ASC";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("s", $fecha);
    $stmt->execute();
    $stmt->bind_result($guiaMaster);

    $guias = [];
    while ($stmt->fetch()) {
        $guias[] = $guiaMaster;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'guiasMaster' => $guias,
        'total' => count($guias)
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener guías master: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>
