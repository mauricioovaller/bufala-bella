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

// Extraer fechas
$fecha_desde = limpiar_texto($data["fecha_desde"] ?? "");
$fecha_hasta = limpiar_texto($data["fecha_hasta"] ?? "");

// Validar fechas
if (empty($fecha_desde) || empty($fecha_hasta)) {
    echo json_encode(["success" => false, "message" => "Fechas desde y hasta son obligatorias"]);
    exit;
}

try {
    // Consulta SQL para obtener facturas generadas
    $sql = "SELECT
                enc.Id_EncabInvoice AS id_factura,
                CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
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
                enc.Fecha BETWEEN ? AND ?
            GROUP BY 
                enc.Id_EncabInvoice, enc.Fecha, csg.Nombre, enc.GuiaMaster, enc.GuiaHija, enc.CantidadEstibas
            ORDER BY 
                enc.Id_EncabInvoice DESC";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ss", $fecha_desde, $fecha_hasta);
    $stmt->execute();
    
    // Usar bind_result() para compatibilidad
    $stmt->bind_result(
        $id_factura,
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