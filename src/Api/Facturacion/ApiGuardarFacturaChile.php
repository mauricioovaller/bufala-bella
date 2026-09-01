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

function limpiar_texto($txt) { return trim($txt); }
function validar_entero($valor) { return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null; }
function validar_flotante($valor) { return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null; }

$encabezado = $data["encabezado"] ?? [];
$pedidosIds = $data["pedidosIds"] ?? [];

// Extraer numero de factura, tolerando prefijos como "FEX-" o "SMP-FEX-"
$rawNumero = $encabezado["numeroFactura"] ?? '';
$rawNumero = preg_replace('/^(FEX-|FEX-|SMP-FEX-)/i', '', trim($rawNumero));
$numeroFactura = validar_entero($rawNumero);
$fechaFactura = limpiar_texto($encabezado["fechaFactura"] ?? "");
$fechaVencimiento = limpiar_texto($encabezado["fechaVencimiento"] ?? "");
$terminosPago = limpiar_texto($encabezado["terminosPago"] ?? "Pago 35 dias");
$numeroOrden = limpiar_texto($encabezado["numeroOrden"] ?? "");
$fleteInternacional = validar_flotante($encabezado["fleteInternacional"] ?? null) ?: 0;
$incoterm = limpiar_texto($encabezado["incoterm"] ?? "CPT");
$partidaArancelaria = limpiar_texto($encabezado["partidaArancelaria"] ?? "0406100000");
$temperatura = limpiar_texto($encabezado["temperatura"] ?? "2° a 6°");
$idAgencia = validar_entero($encabezado["agenciaId"] ?? null);
$idAerolinea = validar_entero($encabezado["aerolineaId"] ?? null);
$guiaMaster = limpiar_texto($encabezado["guiaMaster"] ?? "");
$guiaHija = limpiar_texto($encabezado["guiaHija"] ?? "");
$observaciones = limpiar_texto($encabezado["observaciones"] ?? "");

if (!$numeroFactura || !$fechaFactura || empty($pedidosIds)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // Validar que el numero de factura no exista en EncabInvoiceChile
    $sqlValidar = "SELECT Id_EncabInvoice FROM EncabInvoiceChile WHERE Id_EncabInvoice = ?";
    $stmtValidar = $enlace->prepare($sqlValidar);
    $stmtValidar->bind_param("i", $numeroFactura);
    $stmtValidar->execute();
    $stmtValidar->store_result();

    if ($stmtValidar->num_rows > 0) {
        throw new Exception("El numero de factura '{$numeroFactura}' ya existe en Chile. Use otro numero.");
    }
    $stmtValidar->close();

    // Validar que todos los pedidos pertenezcan al mismo cliente
    $placeholders = str_repeat('?,', count($pedidosIds) - 1) . '?';
    $sqlCliente = "SELECT DISTINCT Id_Cliente FROM EncabPedidoChile WHERE Id_EncabPedido IN ($placeholders)";
    $stmtCliente = $enlace->prepare($sqlCliente);
    $stmtCliente->bind_param(str_repeat('i', count($pedidosIds)), ...$pedidosIds);
    $stmtCliente->execute();
    $stmtCliente->bind_result($idCliente);
    $clientesUnicos = [];
    while ($stmtCliente->fetch()) {
        $clientesUnicos[] = $idCliente;
    }
    $stmtCliente->close();

    if (count($clientesUnicos) === 0) {
        echo json_encode(["success" => false, "message" => "Pedidos no encontrados"]);
        exit;
    }
    if (count($clientesUnicos) > 1) {
        echo json_encode(["success" => false, "message" => "Los pedidos seleccionados pertenecen a diferentes clientes. Todos los pedidos Chile deben ser del mismo cliente."]);
        exit;
    }
    $idCliente = $clientesUnicos[0];

    // Obtener PurchaseOrder de los pedidos para NumeroOrden
    $sqlPO = "SELECT GROUP_CONCAT(DISTINCT PurchaseOrder SEPARATOR ', ') FROM EncabPedidoChile WHERE Id_EncabPedido IN ($placeholders) AND NULLIF(PurchaseOrder, '') IS NOT NULL";
    $stmtPO = $enlace->prepare($sqlPO);
    if ($stmtPO) {
        $stmtPO->bind_param(str_repeat('i', count($pedidosIds)), ...$pedidosIds);
        $stmtPO->execute();
        $stmtPO->bind_result($purchaseOrders);
        $stmtPO->fetch();
        if ($purchaseOrders) {
            $numeroOrden = $purchaseOrders;
        }
        $stmtPO->close();
    }

    // Calcular estibas desde EncabPedidoChile
    $sqlEstibas = "SELECT SUM(CantidadEstibas) FROM EncabPedidoChile WHERE Id_EncabPedido IN ($placeholders)";
    $stmtEstibas = $enlace->prepare($sqlEstibas);
    $stmtEstibas->bind_param(str_repeat('i', count($pedidosIds)), ...$pedidosIds);
    $stmtEstibas->execute();
    $stmtEstibas->bind_result($cantidadEstibas);
    $stmtEstibas->fetch();
    $cantidadEstibas = $cantidadEstibas ?? 0;
    $stmtEstibas->close();

    // Detalle desde DetPedidoChile + ProductosChile
    $sqlDetalle = "SELECT
            prd.Codigo_Siesa,
            prd.Codigo_FDA,
            prd.Codigo_CUST,
            ROUND(SUM(det.PesoNeto),2) AS Kilogramos,
            det.Id_Embalaje,
            SUM(det.Cantidad * emb.Cantidad) AS CantidadEmbalaje,
            SUM(det.Cantidad) AS Cajas,
            det.Descripcion AS DescripFactura,
            ROUND(det.PrecioUnitario,4) AS ValKilogramo
        FROM EncabPedidoChile enc
        INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.Id_EncabPedido IN ($placeholders)
        GROUP BY det.Id_Producto, det.Id_Embalaje, det.PrecioUnitario
        ORDER BY det.Id_DetPedido";

    $stmtDetalle = $enlace->prepare($sqlDetalle);
    $stmtDetalle->bind_param(str_repeat('i', count($pedidosIds)), ...$pedidosIds);
    $stmtDetalle->execute();
    $stmtDetalle->bind_result($codigoSiesa, $codigoFDA, $codigoCUST, $kilogramos, $idEmbalaje, $cantidadEmbalaje, $cajas, $descripFactura, $valKilogramo);

    $detallesFactura = [];
    while ($stmtDetalle->fetch()) {
        $detallesFactura[] = [
            'Codigo_Siesa' => $codigoSiesa,
            'Codigo_FDA' => $codigoFDA,
            'Codigo_CUST' => $codigoCUST,
            'Kilogramos' => $kilogramos,
            'Id_Embalaje' => $idEmbalaje,
            'CantidadEmbalaje' => $cantidadEmbalaje,
            'Cajas' => $cajas,
            'DescripFactura' => $descripFactura,
            'ValKilogramo' => $valKilogramo
        ];
    }
    $stmtDetalle->close();

    $tipoPedido = 'chile';

    // INSERT en EncabInvoiceChile
    $sqlEnc = "INSERT INTO EncabInvoiceChile
        (Id_EncabInvoice, Id_Cliente, Fecha, FechaVencimiento, TerminosPago, NumeroOrden, FleteInternacional, Incoterm, PartidaArancelaria, Temperatura, IdAgencia, IdAerolinea, GuiaMaster, GuiaHija, CantidadEstibas, Observaciones, TipoPedido)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("iissssdsssiissdss",
        $numeroFactura, $idCliente, $fechaFactura, $fechaVencimiento, $terminosPago, $numeroOrden,
        $fleteInternacional, $incoterm, $partidaArancelaria, $temperatura,
        $idAgencia, $idAerolinea, $guiaMaster, $guiaHija, $cantidadEstibas, $observaciones, $tipoPedido
    );
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("Error al insertar encabezado de factura Chile");
    }

    // INSERT en DetInvoiceChile
    $sqlDet = "INSERT INTO DetInvoiceChile
        (Id_EncabInvoice, Item, Codigo_Siesa, Codigo_FDA, Codigo_CUST, Kilogramos, Id_Embalaje, CantidadEmbalaje, Cajas, DescripFactura, ValKilogramo, TipoPedido)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtDet = $enlace->prepare($sqlDet);

    $item = 1;
    foreach ($detallesFactura as $detalle) {
        $stmtDet->bind_param("iisssdiddsds",
            $numeroFactura, $item,
            $detalle['Codigo_Siesa'], $detalle['Codigo_FDA'], $detalle['Codigo_CUST'],
            $detalle['Kilogramos'], $detalle['Id_Embalaje'],
            $detalle['CantidadEmbalaje'], $detalle['Cajas'],
            $detalle['DescripFactura'], $detalle['ValKilogramo'],
            $tipoPedido
        );
        $stmtDet->execute();
        $item++;
    }

    // Marcar pedidos Chile como facturados
    $facturaNoFormateado = "FEX-" . $numeroFactura;
    $sqlActualizar = "UPDATE EncabPedidoChile SET FacturaNo = ? WHERE Id_EncabPedido IN ($placeholders)";
    $stmtActualizar = $enlace->prepare($sqlActualizar);
    $stmtActualizar->bind_param(str_repeat('s', 1) . str_repeat('i', count($pedidosIds)), ...array_merge([$facturaNoFormateado], $pedidosIds));
    $stmtActualizar->execute();
    $stmtActualizar->close();

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "numeroFactura" => $numeroFactura,
        "numeroFacturaFormateado" => $facturaNoFormateado,
        "cantidadItems" => count($detallesFactura),
        "cantidadEstibas" => $cantidadEstibas,
        "tipoPedido" => $tipoPedido
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
