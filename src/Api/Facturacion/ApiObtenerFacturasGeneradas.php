<?php
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
    return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8");
}

// Extraer parámetros de filtro
$fecha_desde = limpiar_texto($data["fecha_desde"] ?? "");
$fecha_hasta = limpiar_texto($data["fecha_hasta"] ?? "");
$tipo_factura = limpiar_texto($data["tipo_factura"] ?? ""); // "normal", "sample", o vacío para todos
$numero_factura = limpiar_texto($data["numero_factura"] ?? ""); // Solo parte numérica (ej: "123")

// Validar fechas (obligatorias)
if (empty($fecha_desde) || empty($fecha_hasta)) {
    echo json_encode(["success" => false, "message" => "Fechas desde y hasta son obligatorias"]);
    exit;
}

// Validar tipo de factura si se proporciona
if (!empty($tipo_factura) && !in_array($tipo_factura, ['normal', 'sample', 'todos'])) {
    echo json_encode(["success" => false, "message" => "Tipo de factura no válido. Debe ser 'normal', 'sample' o 'todos'"]);
    exit;
}

// Validar número de factura si se proporciona (solo numérico)
if (!empty($numero_factura) && !is_numeric($numero_factura)) {
    echo json_encode(["success" => false, "message" => "Número de factura debe ser un valor numérico"]);
    exit;
}

try {
    // Consulta SQL para obtener facturas generadas con filtros avanzados
    $sql = "SELECT
                enc.Id_EncabInvoice AS id_factura,
                enc.TipoPedido AS tipo_pedido,
                enc.Id_Planilla AS id_planilla, -- Para saber si tiene planilla asociada
                CASE 
                    WHEN enc.TipoPedido = 'sample' THEN CONCAT('SMP-FEX-', enc.Id_EncabInvoice)
                    ELSE CONCAT('FEX-', enc.Id_EncabInvoice)
                END AS numero_factura,
                enc.Fecha AS fecha_factura,
                csg.Nombre AS consignatario_nombre,
                enc.GuiaMaster,
                enc.GuiaHija,
                enc.CantidadEstibas,
                ROUND(SUM(det.Kilogramos), 2) AS total_kilogramos,
                SUM(det.Cajas) AS total_cajas,
                ROUND(SUM(det.Kilogramos * det.ValKilogramo), 2) AS total_valor
            FROM
                EncabInvoice enc
            INNER JOIN DetInvoice det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
            INNER JOIN Consignatarios csg ON enc.Id_Consignatario = csg.Id_Consignatario
            WHERE
                enc.Fecha BETWEEN ? AND ?";
    
    // Construir condiciones WHERE dinámicamente según filtros
    $whereConditions = [];
    $paramTypes = "ss"; // fechas son strings
    $params = [$fecha_desde, $fecha_hasta];
    
    // Filtro por tipo de factura (solo si no es "todos")
    if (!empty($tipo_factura) && $tipo_factura !== 'todos') {
        $whereConditions[] = "enc.TipoPedido = ?";
        $paramTypes .= "s";
        $params[] = $tipo_factura;
    }
    
    // Filtro por número de factura (ID numérico)
    if (!empty($numero_factura)) {
        $whereConditions[] = "enc.Id_EncabInvoice = ?";
        $paramTypes .= "i";
        $params[] = intval($numero_factura);
    }
    
    // Agregar condiciones WHERE si existen
    if (!empty($whereConditions)) {
        $sql .= " AND " . implode(" AND ", $whereConditions);
    }
    
    $sql .= " GROUP BY 
                enc.Id_EncabInvoice, enc.TipoPedido, enc.Id_Planilla, enc.Fecha, csg.Nombre, enc.GuiaMaster, enc.GuiaHija, enc.CantidadEstibas
            ORDER BY 
                enc.Id_EncabInvoice DESC";

    $stmt = $enlace->prepare($sql);
    
    // Vincular parámetros dinámicamente
    $stmt->bind_param($paramTypes, ...$params);
    $stmt->execute();
    
    // Usar bind_result() para compatibilidad
    $stmt->bind_result(
        $id_factura,
        $tipo_pedido,
        $id_planilla,
        $numero_factura,
        $fecha_factura,
        $consignatario_nombre,
        $guiaMaster,
        $guiaHija,
        $cantidadEstibas,
        $total_kilogramos,
        $total_cajas,
        $total_valor
    );
    
    $facturas = [];
    while ($stmt->fetch()) {
        $facturas[] = [
            'id' => $id_factura,
            'tipoPedido' => $tipo_pedido,
            'Id_Planilla' => $id_planilla, // Campo para documentos de planilla
            'numero' => $numero_factura,
            'fecha' => $fecha_factura,
            'cliente' => $consignatario_nombre,
            'guiaMaster' => $guiaMaster,
            'guiaHija' => $guiaHija,
            'estibas' => $cantidadEstibas,
            'kilogramos' => $total_kilogramos,
            'cajas' => $total_cajas,
            'valorTotal' => $total_valor,
            'estado' => 'Generada', // Estado por defecto
            'pedidos' => 0 // Se puede calcular si es necesario
        ];
    }
    
    $stmt->close();

    echo json_encode([
        "success" => true,
        "facturas" => $facturas,
        "total" => count($facturas)
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>