<?php
//src/Api/PedidosChile/ApiGetRangoPedidos.php - VERSIÓN CORREGIDA
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Obtener modo de búsqueda
$modo = $data["modo"] ?? "porNumeros"; // 'porNumeros' o 'porFechas'
$bodegaId = $data["bodegaId"] ?? "";
$tipoDocumento = $data["tipoDocumento"] ?? "listaempaque";

$response = [
    "success" => false,
    "message" => "",
    "total" => 0,
    "pedidos" => []
];

try {
    // DIFERENTES VALIDACIONES SEGÚN EL MODO
    if ($modo === "porNumeros") {
        $numeroDesde = $data["numeroDesde"] ?? 0;
        $numeroHasta = $data["numeroHasta"] ?? 0;
        
        // Validaciones para modo por números
        if ($numeroDesde <= 0 || $numeroHasta <= 0) {
            $response["message"] = "Números inválidos";
            echo json_encode($response);
            exit;
        }
        
        if ($numeroDesde > $numeroHasta) {
            $response["message"] = "El número 'Desde' no puede ser mayor que 'Hasta'";
            echo json_encode($response);
            exit;
        }
        
        // CONSULTA PARA MODO POR NÚMEROS
        $sql = "SELECT 
                    ep.Id_EncabPedido as id,
                    ep.PurchaseOrder as po,
                    ep.FechaOrden as fecha,
                    c.Nombre as cliente
                FROM EncabPedidoChile ep
                INNER JOIN ClientesChile c ON ep.Id_Cliente = c.Id_Cliente
                WHERE ep.Id_EncabPedido BETWEEN ? AND ?";
        
        $sql .= " ORDER BY ep.Id_EncabPedido";
        
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ii", $numeroDesde, $numeroHasta);
        
    } else if ($modo === "porFechas") {
        $fechaDesde = $data["fechaDesde"] ?? "";
        $fechaHasta = $data["fechaHasta"] ?? "";
        
        // Validaciones para modo por fechas
        if (empty($fechaDesde) || empty($fechaHasta)) {
            $response["message"] = "Fechas inválidas";
            echo json_encode($response);
            exit;
        }
        
        if ($fechaDesde > $fechaHasta) {
            $response["message"] = "La fecha 'Desde' no puede ser mayor que 'Hasta'";
            echo json_encode($response);
            exit;
        }
        
        // CONSULTA PARA MODO POR FECHAS
        $sql = "SELECT 
                    ep.Id_EncabPedido as id,
                    ep.PurchaseOrder as po,
                    ep.FechaOrden as fecha,
                    c.Nombre as cliente
                FROM EncabPedidoChile ep
                INNER JOIN ClientesChile c ON ep.Id_Cliente = c.Id_Cliente
                WHERE ep.FechaSalida BETWEEN ? AND ?";
        
        if (!empty($bodegaId)) {
            $sql .= " AND ep.Id_Bodega = ?";
        }
        
        $sql .= " ORDER BY ep.FechaSalida, ep.Id_EncabPedido";
        
        $stmt = $enlace->prepare($sql);
        
        if (!empty($bodegaId)) {
            $stmt->bind_param("ssi", $fechaDesde, $fechaHasta, $bodegaId);
        } else {
            $stmt->bind_param("ss", $fechaDesde, $fechaHasta);
        }
        
    } else {
        $response["message"] = "Modo no válido. Use 'porNumeros' o 'porFechas'";
        echo json_encode($response);
        exit;
    }
    
    // Ejecutar consulta
    $stmt->execute();
    
    // BIND_RESULT
    $stmt->bind_result($id, $po, $fecha, $cliente);
    
    $pedidos = [];
    while ($stmt->fetch()) {
        $pedidos[] = [
            'id' => $id,
            'po' => $po ?? 'Sin PO',
            'fecha' => $fecha,
            'cliente' => $cliente,
        ];
    }
    
    $stmt->close();
    
    // Verificar si se encontraron pedidos
    if (empty($pedidos)) {
        $response["message"] = "No se encontraron pedidos con los filtros aplicados";
        $response["success"] = false;
    } else {
        $response["success"] = true;
        $response["pedidos"] = $pedidos;
        $response["total"] = count($pedidos);
        $response["message"] = "Se encontraron " . count($pedidos) . " pedidos";
    }
    
} catch (Exception $e) {
    $response["message"] = "Error: " . $e->getMessage();
    $response["trace"] = $e->getTraceAsString();
}

echo json_encode($response);

if (isset($enlace)) {
    $enlace->close();
}
?>