<?php
// ApiGetCostoTransporte.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Método no permitido. Usa POST."]);
    http_response_code(405);
    exit;
}

// Obtener datos JSON
$input = json_decode(file_get_contents("php://input"), true);
$idCosto = $input['id'] ?? null;

if (!$idCosto || !is_numeric($idCosto)) {
    echo json_encode(["success" => false, "error" => "ID de costo no válido"]);
    exit;
}

try {
    // Consulta para obtener un costo específico
    $sql = "SELECT 
                Id_CostoTransporte,
                Fecha,
                CantidadCamiones,
                ValorFlete,
                Observaciones,
                FechaRegistro,
                UsuarioRegistro
            FROM CostosTransporteDiario
            WHERE Id_CostoTransporte = ?";
    
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $idCosto);
    $stmt->execute();
    
    $stmt->bind_result(
        $idCostoTransporte,
        $fecha,
        $cantidadCamiones,
        $valorFlete,
        $observaciones,
        $fechaRegistro,
        $usuarioRegistro
    );
    
    if ($stmt->fetch()) {
        $stmt->close();
        
        // Obtener peso total facturado para esta fecha
        $sqlPeso = "SELECT COALESCE(SUM(di.Kilogramos), 0) 
                    FROM EncabInvoice ei 
                    INNER JOIN DetInvoice di ON ei.Id_EncabInvoice = di.Id_EncabInvoice 
                    WHERE ei.Fecha = ?";
        
        $stmtPeso = $enlace->prepare($sqlPeso);
        $stmtPeso->bind_param("s", $fecha);
        $stmtPeso->execute();
        $stmtPeso->bind_result($totalKgFacturado);
        $stmtPeso->fetch();
        $stmtPeso->close();
        
        $costoPorKg = $totalKgFacturado > 0 ? round($valorFlete / $totalKgFacturado, 2) : 0;
        
        echo json_encode([
            'success' => true,
            'costo' => [
                'id' => $idCostoTransporte,
                'fecha' => $fecha,
                'cantidadCamiones' => $cantidadCamiones,
                'valorFlete' => (float)$valorFlete,
                'observaciones' => $observaciones,
                'fechaRegistro' => $fechaRegistro,
                'usuarioRegistro' => $usuarioRegistro,
                'totalKgFacturado' => (float)$totalKgFacturado,
                'costoPorKg' => (float)$costoPorKg
            ]
        ]);
    } else {
        $stmt->close();
        echo json_encode([
            'success' => false,
            'error' => 'Costo de transporte no encontrado'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener el costo: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>