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
$idFactura = isset($_GET['id_factura']) ? intval($_GET['id_factura']) : null;

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

    // SPEC 0002: preseleccion de anexos por cliente (mapeo configurable en BD)
    // Si llega id_factura se obtiene el Id_Cliente de la factura Chile y los
    // anexos por defecto de ese cliente (clientes_chile_anexos_default).
    $anexosDefault = [];
    $idClienteFactura = null;
    if ($idFactura) {
        $sqlCli = "SELECT Id_Cliente FROM EncabInvoiceChile WHERE Id_EncabInvoice = ?";
        $stmtCli = $enlace->prepare($sqlCli);
        $stmtCli->bind_param("i", $idFactura);
        $stmtCli->execute();
        $stmtCli->bind_result($idClienteFactura);
        if (!$stmtCli->fetch()) {
            $idClienteFactura = null;
        }
        $stmtCli->close();

        if ($idClienteFactura) {
            $sqlDef = "SELECT cad.Id_Documento
                       FROM clientes_chile_anexos_default cad
                       INNER JOIN documentos_chile_items di ON di.Id = cad.Id_Documento
                           AND di.Tipo = 'anexo' AND di.Activo = 1
                       WHERE cad.Id_Cliente = ?
                       ORDER BY di.Orden";
            $stmtDef = $enlace->prepare($sqlDef);
            $stmtDef->bind_param("i", $idClienteFactura);
            $stmtDef->execute();
            $stmtDef->bind_result($idDocumento);
            while ($stmtDef->fetch()) {
                $anexosDefault[] = (int)$idDocumento;
            }
            $stmtDef->close();
        }
    }

    // SPEC 0002 (v1.2): cuando se pide por factura, la lista SOLO contiene los
    // anexos del cliente (los del mapeo). Cliente sin mapeo -> lista vacia,
    // para evitar confusiones al mostrar anexos de otros clientes.
    if ($idFactura) {
        $itemsFiltrados = [];
        foreach ($items as $item) {
            if ($item['tipo'] === 'anexo' && !in_array($item['id'], $anexosDefault, true)) {
                continue;
            }
            $itemsFiltrados[] = $item;
        }
        $items = $itemsFiltrados;
    }

    // Agrupar por tipo si no hay filtro
    if (!$tipo) {
        $agrupados = ['mercancia' => [], 'anexo' => []];
        foreach ($items as $item) {
            $agrupados[$item['tipo']][] = $item;
        }
        echo json_encode([
            "success" => true,
            "items" => $agrupados,
            "idCliente" => $idClienteFactura,
            "anexosDefault" => $anexosDefault
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "items" => $items,
            "idCliente" => $idClienteFactura,
            "anexosDefault" => $anexosDefault
        ]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
