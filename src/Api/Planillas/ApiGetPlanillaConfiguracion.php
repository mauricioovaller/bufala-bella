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
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

$idPlanilla = isset($data["id_planilla"]) ? intval($data["id_planilla"]) : null;
$tipoPedido = isset($data["tipo_pedido"]) ? trim($data["tipo_pedido"]) : "normal";

if (!$idPlanilla) {
    echo json_encode(["success" => false, "message" => "ID de planilla no válido"]);
    exit;
}

// Solo Chile almacena mercancia/anexos seleccionados en la planilla
$esChile = ($tipoPedido === 'chile');
$tablaPlanillas = $esChile ? 'PlanillasChile' : 'Planillas';

try {
    if ($esChile) {
        $sql = "SELECT MercanciaSeleccionada, AnexosSeleccionados FROM PlanillasChile WHERE Id_Planilla = ?";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("i", $idPlanilla);
        $stmt->execute();
        $stmt->bind_result($mercancia, $anexos);
        $stmt->fetch();
        $stmt->close();

        $mercanciaArr = null;
        $anexosArr = null;

        if ($mercancia !== null && $mercancia !== '') {
            $decoded = json_decode($mercancia, true);
            if (is_array($decoded)) {
                $mercanciaArr = array_map('intval', $decoded);
            }
        }
        if ($anexos !== null && $anexos !== '') {
            $decoded = json_decode($anexos, true);
            if (is_array($decoded)) {
                $anexosArr = array_map('intval', $decoded);
            }
        }

        echo json_encode([
            "success" => true,
            "id_planilla" => $idPlanilla,
            "mercanciaSeleccionada" => $mercanciaArr,
            "anexosSeleccionados" => $anexosArr
        ]);
    } else {
        // Para normales/samples no hay selección guardada: todo se genera con todos los items
        echo json_encode([
            "success" => true,
            "id_planilla" => $idPlanilla,
            "mercanciaSeleccionada" => null,
            "anexosSeleccionados" => null
        ]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
