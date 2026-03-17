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
if (!$data || !isset($data['tipo']) || !isset($data['idPedido']) || !isset($data['items'])) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}
$tipo = $data['tipo']; // 'normal' o 'sample'
$idPedido = intval($data['idPedido']);
$items = $data['items']; // array de { idDet, idResponsable, lotes: [idLote1, idLote2, idLote3], cantidades: [cant1, cant2, cant3] }
$tablaDet = ($tipo === 'sample') ? 'DetPedidoSample' : 'DetPedido';
// Asumimos usuario autenticado para auditoría
$idUsuario = 1; // CAMBIAR: Obtener de sesión
$enlace->begin_transaction();
try {
    // Primero obtener cantidades disponibles para validación
    $sqlGetCant = "SELECT Id_DetPedido, Cantidad FROM $tablaDet WHERE Id_EncabPedido = ?";
    $stmtGetCant = $enlace->prepare($sqlGetCant);
    $stmtGetCant->bind_param("i", $idPedido);
    $stmtGetCant->execute();
    $stmtGetCant->bind_result($idDetCheck, $cantidadDisponible);
    
    $cantidadesDisponibles = [];
    while ($stmtGetCant->fetch()) {
        $cantidadesDisponibles[$idDetCheck] = $cantidadDisponible;
    }
    $stmtGetCant->close();
    
    // Validar cantidades antes de actualizar
    foreach ($items as $item) {
        $idDet = intval($item['idDet']);
        $cantidades = $item['cantidades'] ?? [0, 0, 0];
        
        // Convertir a int y asegurar array de 3 elementos
        $cant1 = isset($cantidades[0]) ? intval($cantidades[0]) : 0;
        $cant2 = isset($cantidades[1]) ? intval($cantidades[1]) : 0;
        $cant3 = isset($cantidades[2]) ? intval($cantidades[2]) : 0;
        
        $totalCantidades = $cant1 + $cant2 + $cant3;
        $cantidadDisp = $cantidadesDisponibles[$idDet] ?? 0;
        
        if ($totalCantidades > $cantidadDisp) {
            throw new Exception("Producto ID $idDet: Total de cantidades ($totalCantidades) excede la cantidad disponible ($cantidadDisp)");
        }
    }
    
    // Actualizar cada ítem con lotes y cantidades
    $sqlUpdate = "UPDATE $tablaDet SET 
        Id_Responsable = ?,
        Lote1 = ?,
        Lote2 = ?,
        Lote3 = ?,
        CantidadLote1 = ?,
        CantidadLote2 = ?,
        CantidadLote3 = ?,
        UsuarioModificacion = ?,
        FechaModificacion = NOW()
        WHERE Id_DetPedido = ?";
    
    $stmt = $enlace->prepare($sqlUpdate);
    
    foreach ($items as $item) {
        $idDet = intval($item['idDet']);
        $idResponsable = isset($item['idResponsable']) ? intval($item['idResponsable']) : null;
        $lotes = $item['lotes'] ?? [];
        $cantidades = $item['cantidades'] ?? [0, 0, 0];
        
        // Asegurar que lotes tenga 3 elementos (rellenar con null)
        $lote1 = isset($lotes[0]) ? intval($lotes[0]) : null;
        $lote2 = isset($lotes[1]) ? intval($lotes[1]) : null;
        $lote3 = isset($lotes[2]) ? intval($lotes[2]) : null;
        
        // Cantidades
        $cant1 = isset($cantidades[0]) ? intval($cantidades[0]) : 0;
        $cant2 = isset($cantidades[1]) ? intval($cantidades[1]) : 0;
        $cant3 = isset($cantidades[2]) ? intval($cantidades[2]) : 0;
        
        // Validar que los lotes no se repitan (opcional)
        $lotesArray = array_filter([$lote1, $lote2, $lote3]);
        if (count($lotesArray) !== count(array_unique($lotesArray))) {
            throw new Exception("Los lotes no pueden repetirse en el mismo ítem (ID Det: $idDet)");
        }
        
        $stmt->bind_param("iiiiiiiii", 
            $idResponsable,
            $lote1,
            $lote2,
            $lote3,
            $cant1,
            $cant2,
            $cant3,
            $idUsuario,
            $idDet
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Error actualizando ítem $idDet: " . $stmt->error);
        }
    }
    
    $enlace->commit();
    echo json_encode(["success" => true, "message" => "Producción guardada correctamente"]);
    
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
$stmt->close();
$enlace->close();
?>