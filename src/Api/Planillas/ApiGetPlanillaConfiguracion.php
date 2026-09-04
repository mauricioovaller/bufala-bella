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
        // Id_Cliente + seleccion guardada (JSON historico) de la planilla
        $sql = "SELECT Id_Cliente, MercanciaSeleccionada, AnexosSeleccionados
                FROM PlanillasChile
                WHERE Id_Planilla = ?";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("i", $idPlanilla);
        $stmt->execute();
        $stmt->bind_result($idClientePlanilla, $mercancia, $anexos);
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

        // SPEC 0002: prioridad 1 -> filas de planillas_chile_documentos
        $anexosFilas = [];
        $sqlFilas = "SELECT Id_Documento FROM planillas_chile_documentos
                     WHERE Id_Planilla = ? AND Tipo = 'anexo'
                     ORDER BY Id_PlanillaDocumento";
        $stmtFilas = $enlace->prepare($sqlFilas);
        $stmtFilas->bind_param("i", $idPlanilla);
        $stmtFilas->execute();
        $stmtFilas->bind_result($idDocumentoFila);
        while ($stmtFilas->fetch()) {
            $anexosFilas[] = (int)$idDocumentoFila;
        }
        $stmtFilas->close();

        if (!empty($anexosFilas)) {
            $anexosArr = $anexosFilas;
        } elseif ($anexos !== null && $anexos !== '') {
            // Prioridad 2 -> JSON historico de la planilla
            $decoded = json_decode($anexos, true);
            if (is_array($decoded)) {
                $anexosArr = array_map('intval', $decoded);
            }
        } elseif ($idClientePlanilla > 0) {
            // Prioridad 3 -> preseleccion por defecto del cliente (mapeo en BD)
            $anexosDefault = [];
            $sqlDef = "SELECT cad.Id_Documento
                       FROM clientes_chile_anexos_default cad
                       INNER JOIN documentos_chile_items di ON di.Id = cad.Id_Documento
                           AND di.Tipo = 'anexo' AND di.Activo = 1
                       WHERE cad.Id_Cliente = ?
                       ORDER BY di.Orden";
            $stmtDef = $enlace->prepare($sqlDef);
            $stmtDef->bind_param("i", $idClientePlanilla);
            $stmtDef->execute();
            $stmtDef->bind_result($idDocumentoDef);
            while ($stmtDef->fetch()) {
                $anexosDefault[] = (int)$idDocumentoDef;
            }
            $stmtDef->close();
            if (!empty($anexosDefault)) {
                $anexosArr = $anexosDefault;
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
