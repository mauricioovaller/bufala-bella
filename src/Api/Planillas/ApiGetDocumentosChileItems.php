<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexion: " . $enlace->connect_error]);
    exit;
}

$tipo = isset($_GET['tipo']) ? $_GET['tipo'] : null;

if ($tipo && !in_array($tipo, ['mercancia', 'anexo'])) {
    echo json_encode(["success" => false, "message" => "Tipo invalido. Use 'mercancia' o 'anexo'."]);
    exit;
}

try {
    $sql = "SELECT Id, Tipo, Orden, Texto, DescripcionCorta
            FROM documentos_chile_items
            WHERE Activo = 1";

    if ($tipo) {
        $sql .= " AND Tipo = ?";
    }

    $sql .= " ORDER BY Tipo, Orden";

    $stmt = $enlace->prepare($sql);

    if ($tipo) {
        $stmt->bind_param("s", $tipo);
    }

    $stmt->execute();
    $stmt->bind_result($id, $tipoItem, $orden, $texto, $descripcionCorta);

    $items = [];
    while ($stmt->fetch()) {
        $items[] = [
            'id' => $id,
            'tipo' => $tipoItem,
            'orden' => $orden,
            'texto' => $texto,
            'descripcionCorta' => $descripcionCorta
        ];
    }
    $stmt->close();

    // Agrupar por tipo si no hay filtro
    if (!$tipo) {
        $agrupados = ['mercancia' => [], 'anexo' => []];
        foreach ($items as $item) {
            $agrupados[$item['tipo']][] = $item;
        }
        echo json_encode(["success" => true, "items" => $agrupados]);
    } else {
        echo json_encode(["success" => true, "items" => $items]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
