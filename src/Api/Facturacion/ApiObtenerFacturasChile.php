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

function limpiar_texto($txt) { return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8"); }

$fecha_desde = limpiar_texto($data["fecha_desde"] ?? "");
$fecha_hasta = limpiar_texto($data["fecha_hasta"] ?? "");
$numero_factura = limpiar_texto($data["numero_factura"] ?? "");

if (empty($fecha_desde) || empty($fecha_hasta)) {
    echo json_encode(["success" => false, "message" => "Fechas desde y hasta son obligatorias"]);
    exit;
}

try {
    $sql = "SELECT
                enc.Id_EncabInvoice AS id_factura,
                enc.Id_Planilla AS id_planilla,
                CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
                enc.Fecha AS fecha_factura,
                cli.Nombre AS nombre_cliente,
                enc.GuiaMaster,
                enc.GuiaHija,
                enc.CantidadEstibas,
                ROUND(SUM(det.Kilogramos), 2) AS total_kilogramos,
                SUM(det.Cajas) AS total_cajas,
                ROUND(SUM(det.Kilogramos * det.ValKilogramo), 2) AS total_valor
            FROM EncabInvoiceChile enc
            INNER JOIN DetInvoiceChile det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
            INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
            WHERE enc.Fecha BETWEEN ? AND ?";

    $paramTypes = "ss";
    $params = [$fecha_desde, $fecha_hasta];

    if (!empty($numero_factura) && is_numeric($numero_factura)) {
        $sql .= " AND enc.Id_EncabInvoice = ?";
        $paramTypes .= "i";
        $params[] = intval($numero_factura);
    }

    $sql .= " GROUP BY enc.Id_EncabInvoice ORDER BY enc.Id_EncabInvoice DESC";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param($paramTypes, ...$params);
    $stmt->execute();

    $stmt->bind_result($id_factura, $id_planilla, $numero_factura, $fecha_factura, $nombre_cliente, $guiaMaster, $guiaHija, $cantidadEstibas, $total_kilogramos, $total_cajas, $total_valor);

    $facturas = [];
    while ($stmt->fetch()) {
        $facturas[] = [
            'id' => $id_factura,
            'Id_Planilla' => $id_planilla,
            'tipoPedido' => 'chile',
            'numero' => $numero_factura,
            'fecha' => $fecha_factura,
            'cliente' => $nombre_cliente,
            'guiaMaster' => $guiaMaster,
            'guiaHija' => $guiaHija,
            'estibas' => $cantidadEstibas,
            'kilogramos' => $total_kilogramos,
            'cajas' => $total_cajas,
            'valorTotal' => $total_valor,
            'estado' => 'Generada',
            'pedidos' => 0
        ];
    }

    $stmt->close();

    echo json_encode(["success" => true, "facturas" => $facturas, "total" => count($facturas)]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
