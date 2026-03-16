<?php
//src/Api/Facturacion/ApiGuardarFactura.php
header("Content-Type: application/json");

// Solo POST permitido
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Funciones de sanitización
function limpiar_texto($txt) {
    return trim($txt);
}
function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor) {
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

// Extraer datos
$encabezado = $data["encabezado"] ?? [];
$pedidosIds = $data["pedidosIds"] ?? [];
$tipoPedido = $data["tipoPedido"] ?? "normal"; // 🔴 NUEVO: Tipo de pedido

$numeroFactura = validar_entero($encabezado["numeroFactura"] ?? null);
$fechaFactura = limpiar_texto($encabezado["fechaFactura"] ?? "");
$idConsignatario = validar_entero($encabezado["consignatarioId"] ?? null);
$idAgencia = validar_entero($encabezado["agenciaId"] ?? null);
$idAerolinea = validar_entero($encabezado["aerolineaId"] ?? null);
$guiaMaster = limpiar_texto($encabezado["guiaMaster"] ?? "");
$guiaHija = limpiar_texto($encabezado["guiaHija"] ?? "");
$observaciones = limpiar_texto($encabezado["observaciones"] ?? "");

// Validaciones obligatorias
if (!$numeroFactura || !$fechaFactura || !$idConsignatario || empty($pedidosIds)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

// 🔴 VALIDAR TIPO DE PEDIDO
if (!in_array($tipoPedido, ['normal', 'sample'])) {
    echo json_encode(["success" => false, "message" => "Tipo de pedido no válido"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // 🔴 VALIDAR QUE EL NÚMERO DE FACTURA (ENTERO) NO EXISTA
    $sqlValidar = "SELECT Id_EncabInvoice FROM EncabInvoice WHERE Id_EncabInvoice = ?";
    $stmtValidar = $enlace->prepare($sqlValidar);
    $stmtValidar->bind_param("i", $numeroFactura);
    $stmtValidar->execute();
    $stmtValidar->store_result();
    
    if ($stmtValidar->num_rows > 0) {
        throw new Exception("El número de factura '{$numeroFactura}' ya existe. Por favor use otro número.");
    }
    $stmtValidar->close();

    // 🔴 DETERMINAR TABLAS SEGÚN EL TIPO
    $tablaEncabezado = $tipoPedido === 'normal' ? 'EncabPedido' : 'EncabPedidoSample';
    $tablaDetalle = $tipoPedido === 'normal' ? 'DetPedido' : 'DetPedidoSample';
    
    // 🔴 CONSULTAR CANTIDAD ESTIBAS (PARA AMBOS TIPOS)
    $placeholders = str_repeat('?,', count($pedidosIds) - 1) . '?';
    $sqlEstibas = "SELECT SUM(CantidadEstibas) AS TotalEstibas 
                   FROM $tablaEncabezado 
                   WHERE Id_EncabPedido IN ($placeholders)";
    
    $stmtEstibas = $enlace->prepare($sqlEstibas);
    $tiposEstibas = str_repeat('i', count($pedidosIds));
    $stmtEstibas->bind_param($tiposEstibas, ...$pedidosIds);
    $stmtEstibas->execute();
    $stmtEstibas->bind_result($cantidadEstibas);
    $stmtEstibas->fetch();
    $cantidadEstibas = $cantidadEstibas ?? 0;
    $stmtEstibas->close();

    // 🔴 CONSULTAR DETALLE DE PEDIDOS (PARA AMBOS TIPOS)
    if ($tipoPedido === 'normal') {
        // CONSULTA PARA PEDIDOS NORMALES
        $sqlDetalle = "SELECT      
            prd.Codigo_Siesa,
            prd.Codigo_FDA,
            ROUND(SUM(det.PesoNeto),2) AS Kilogramos,
            det.Id_Embalaje,
            SUM(det.Cantidad * emb.Cantidad) AS CantidadEmbalaje,
            SUM(det.Cantidad) AS Cajas,
            CONCAT(det.Descripcion, ' x ', emb.Cantidad) AS DescripFactura,
            ROUND(det.PrecioUnitario,2) AS ValKilogramo       
        FROM $tablaEncabezado enc
        INNER JOIN $tablaDetalle det ON enc.Id_EncabPedido = det.Id_EncabPedido    
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje    
        WHERE enc.Id_EncabPedido IN ($placeholders)
        GROUP BY det.Id_Producto, det.Id_Embalaje, det.PrecioUnitario
        ORDER BY prd.Codigo_Siesa";
    } else {
        // CONSULTA PARA SAMPLES
        $sqlDetalle = "SELECT      
            prd.Codigo_Siesa,
            prd.Codigo_FDA,
            ROUND(SUM(det.PesoNeto),2) AS Kilogramos,
            det.Id_Embalaje,
            SUM(det.Cantidad * emb.Cantidad) AS CantidadEmbalaje,
            SUM(det.Cantidad) AS Cajas,
            CONCAT(det.Descripcion, ' x ', emb.Cantidad) AS DescripFactura,
            ROUND(det.PrecioUnitario,2) AS ValKilogramo       
        FROM $tablaEncabezado enc
        INNER JOIN $tablaDetalle det ON enc.Id_EncabPedido = det.Id_EncabPedido    
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje    
        WHERE enc.Id_EncabPedido IN ($placeholders)
        GROUP BY det.Id_Producto, det.Id_Embalaje, det.PrecioUnitario
        ORDER BY prd.Codigo_Siesa";
    }
    
    $stmtDetalle = $enlace->prepare($sqlDetalle);
    $tiposDetalle = str_repeat('i', count($pedidosIds));
    $stmtDetalle->bind_param($tiposDetalle, ...$pedidosIds);
    $stmtDetalle->execute();
    
    $stmtDetalle->bind_result(
        $codigoSiesa,
        $codigoFDA,
        $kilogramos,
        $idEmbalaje,
        $cantidadEmbalaje,
        $cajas,
        $descripFactura,
        $valKilogramo
    );
    
    $detallesFactura = [];
    while ($stmtDetalle->fetch()) {
        $detallesFactura[] = [
            'Codigo_Siesa' => $codigoSiesa,
            'Codigo_FDA' => $codigoFDA,
            'Kilogramos' => $kilogramos,
            'Id_Embalaje' => $idEmbalaje,
            'CantidadEmbalaje' => $cantidadEmbalaje,
            'Cajas' => $cajas,
            'DescripFactura' => $descripFactura,
            'ValKilogramo' => $valKilogramo
        ];
    }
    $stmtDetalle->close();

    // 🔴 INSERTAR ENCABEZADO DE FACTURA
    $sqlEnc = "INSERT INTO EncabInvoice 
        (Id_EncabInvoice, Id_Consignatario, Fecha, IdAgencia, IdAerolinea, GuiaMaster, GuiaHija, CantidadEstibas, Observaciones, TipoPedido) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; // 🔴 NUEVO: Campo TipoPedido
    
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("iisiissdss", $numeroFactura, $idConsignatario, $fechaFactura, $idAgencia, $idAerolinea, $guiaMaster, $guiaHija, $cantidadEstibas, $observaciones, $tipoPedido);
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("Error al insertar el encabezado de factura");
    }

    // 🔴 INSERTAR DETALLE DE FACTURA
    $sqlDet = "INSERT INTO DetInvoice 
        (Id_EncabInvoice, Item, Codigo_Siesa, Codigo_FDA, Kilogramos, Id_Embalaje, CantidadEmbalaje, Cajas, DescripFactura, ValKilogramo, TipoPedido) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; // 🔴 NUEVO: Campo TipoPedido
    
    $stmtDet = $enlace->prepare($sqlDet);

    $item = 1;
    foreach ($detallesFactura as $detalle) {
        $stmtDet->bind_param(
            "iissdiddsds",
            $numeroFactura,
            $item,
            $detalle['Codigo_Siesa'],
            $detalle['Codigo_FDA'],
            $detalle['Kilogramos'],
            $detalle['Id_Embalaje'],
            $detalle['CantidadEmbalaje'],
            $detalle['Cajas'],
            $detalle['DescripFactura'],
            $detalle['ValKilogramo'],
            $tipoPedido
        );
        $stmtDet->execute();
        $item++;
    }

    // 🔴 ACTUALIZAR CAMPO FacturaNo EN LA TABLA CORRESPONDIENTE
    $sqlActualizarPedidos = "UPDATE $tablaEncabezado SET FacturaNo = ? WHERE Id_EncabPedido IN ($placeholders)";
    $stmtActualizar = $enlace->prepare($sqlActualizarPedidos);
    
    // 🔴 Formatear número según el tipo
    $facturaNoFormateado = $tipoPedido === 'normal' 
        ? "FEX-" . $numeroFactura 
        : "SMP-FEX-" . $numeroFactura; // 🔴 PREFIJO DIFERENTE PARA SAMPLES
    
    $tiposActualizar = 's' . str_repeat('i', count($pedidosIds));
    $parametrosActualizar = array_merge([$facturaNoFormateado], $pedidosIds);
    
    $stmtActualizar->bind_param($tiposActualizar, ...$parametrosActualizar);
    $stmtActualizar->execute();
    
    $pedidosActualizados = $stmtActualizar->affected_rows;
    $stmtActualizar->close();

    $enlace->commit();

    echo json_encode([
        "success" => true, 
        "numeroFactura" => $numeroFactura,
        "numeroFacturaFormateado" => $facturaNoFormateado,
        "cantidadItems" => count($detallesFactura),
        "cantidadEstibas" => $cantidadEstibas,
        "pedidosActualizados" => $pedidosActualizados,
        "tipoPedido" => $tipoPedido // 🔴 INCLUIR TIPO EN RESPUESTA
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>