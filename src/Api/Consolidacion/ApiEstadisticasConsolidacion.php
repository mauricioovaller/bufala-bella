<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Activar logging de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Obtener los parámetros del frontend
$input = json_decode(file_get_contents('php://input'), true);
$fechaDesde = $input['fechaDesde'] ?? '';
$fechaHasta = $input['fechaHasta'] ?? '';
$tipoFecha = $input['tipoFecha'] ?? 'fechaSalida';

// Validar que vengan las fechas
if (empty($fechaDesde) || empty($fechaHasta)) {
    echo json_encode(["success" => false, "message" => "Fechas requeridas"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// CONSULTA UNIFICADA - SUMA DE DATOS NORMALES Y SAMPLE
$sql = "SELECT 
    -- Sumar pedidos únicos de ambas tablas (4 parámetros)
    (
        SELECT COUNT(DISTINCT Id_EncabPedido) 
        FROM EncabPedido 
        WHERE $tipoFecha BETWEEN ? AND ?
    ) + (
        SELECT COUNT(DISTINCT Id_EncabPedido) 
        FROM EncabPedidoSample 
        WHERE $tipoFecha BETWEEN ? AND ?
    ) as totalPedidos,
    
    -- Sumar cajas de ambas tablas (4 parámetros)
    (
        SELECT COALESCE(SUM(det.Cantidad), 0)
        FROM EncabPedido enc
        INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
        WHERE enc.$tipoFecha BETWEEN ? AND ?
    ) + (
        SELECT COALESCE(SUM(det.Cantidad), 0)
        FROM EncabPedidoSample enc
        INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
        WHERE enc.$tipoFecha BETWEEN ? AND ?
    ) AS Cajas,
    
    -- Sumar peso neto de ambas tablas (4 parámetros)
    (
        SELECT COALESCE(ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000), 2), 0)
        FROM EncabPedido enc
        INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.$tipoFecha BETWEEN ? AND ?
    ) + (
        SELECT COALESCE(ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000), 2), 0)
        FROM EncabPedidoSample enc
        INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.$tipoFecha BETWEEN ? AND ?
    ) AS PesoNeto,
    
    -- Sumar valor USD de ambas tablas (4 parámetros)
    (
        SELECT COALESCE(ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario), 2), 0)
        FROM EncabPedido enc
        INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.$tipoFecha BETWEEN ? AND ?
    ) + (
        SELECT COALESCE(ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario), 2), 0)
        FROM EncabPedidoSample enc
        INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
        INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
        INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
        WHERE enc.$tipoFecha BETWEEN ? AND ?
    ) AS USD,
    
    -- Sumar estibas de ambas tablas (2 parámetros)
    (
        SELECT COALESCE(SUM(CantidadEstibas), 0)
        FROM EncabPedido 
        WHERE $tipoFecha BETWEEN ? AND ?
    ) + (
        SELECT COALESCE(SUM(CantidadEstibas), 0)
        FROM EncabPedidoSample 
        WHERE $tipoFecha BETWEEN ? AND ?
    ) AS Estibas";

try {
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    // Debug: Verificar los valores que se van a bind
    error_log("Fecha Desde: $fechaDesde, Fecha Hasta: $fechaHasta, Tipo Fecha: $tipoFecha");

    // Bind de parámetros - 18 parámetros en total
    $bind_result = $stmt->bind_param(
        "ssssssssssssssssssss", // 18 's'
        // Pedidos (4)
        $fechaDesde, $fechaHasta,  // Pedidos normales
        $fechaDesde, $fechaHasta,  // Pedidos sample
        
        // Cajas (4)  
        $fechaDesde, $fechaHasta,  // Cajas normales
        $fechaDesde, $fechaHasta,  // Cajas sample
        
        // PesoNeto (4)
        $fechaDesde, $fechaHasta,  // PesoNeto normales
        $fechaDesde, $fechaHasta,  // PesoNeto sample
        
        // USD (4)
        $fechaDesde, $fechaHasta,  // USD normales
        $fechaDesde, $fechaHasta,  // USD sample
        
        // Estibas (2)
        $fechaDesde, $fechaHasta,   // Estibas
        $fechaDesde, $fechaHasta,
    );

    if (!$bind_result) {
        throw new Exception("Error en bind_param: " . $stmt->error);
    }

    $executed = $stmt->execute();

    if (!$executed) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    $stmt->bind_result($totalPedidos, $Cajas, $PesoNeto, $USD, $Estibas);
    $stmt->fetch();

    // Debug: Verificar los resultados
    error_log("Resultados - Pedidos: $totalPedidos, Cajas: $Cajas, PesoNeto: $PesoNeto, USD: $USD, Estibas: $Estibas");

    echo json_encode([
        "success" => true,
        "totalPedidos" => $totalPedidos ?? 0,
        "cajas" => $Cajas ?? 0,
        "pesoNeto" => $PesoNeto ?? 0,
        "valorTotal" => $USD ?? 0,
        "estibas" => $Estibas ?? 0
    ]);

    $stmt->close();

} catch (Exception $e) {
    error_log("Error en el script: " . $e->getMessage());
    echo json_encode([
        "success" => false, 
        "message" => "Error interno: " . $e->getMessage()
    ]);
}

$enlace->close();
?>