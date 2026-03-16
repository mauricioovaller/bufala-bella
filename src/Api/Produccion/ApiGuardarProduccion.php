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
$items = $data['items']; // array de { idDet, idResponsable, lotes: [idLote1, idLote2, idLote3] }

$tablaDet = ($tipo === 'sample') ? 'DetPedidoSample' : 'DetPedido';

// Asumimos usuario autenticado para auditoría
$idUsuario = 1; // CAMBIAR: Obtener de sesión

$enlace->begin_transaction();

try {
    // Actualizar cada ítem
    $sqlUpdate = "UPDATE $tablaDet SET 
        Id_Responsable = ?,
        Lote1 = ?,
        Lote2 = ?,
        Lote3 = ?,
        UsuarioModificacion = ?,
        FechaModificacion = NOW()
        WHERE Id_DetPedido = ?";
    
    $stmt = $enlace->prepare($sqlUpdate);
    
    foreach ($items as $item) {
        $idDet = intval($item['idDet']);
        $idResponsable = isset($item['idResponsable']) ? intval($item['idResponsable']) : null;
        $lotes = $item['lotes'] ?? [];
        
        // Asegurar que lotes tenga 3 elementos (rellenar con null)
        $lote1 = isset($lotes[0]) ? intval($lotes[0]) : null;
        $lote2 = isset($lotes[1]) ? intval($lotes[1]) : null;
        $lote3 = isset($lotes[2]) ? intval($lotes[2]) : null;
        
        // Validar que los lotes no se repitan (opcional, podemos hacerlo aquí)
        $lotesArray = array_filter([$lote1, $lote2, $lote3]);
        if (count($lotesArray) !== count(array_unique($lotesArray))) {
            throw new Exception("Los lotes no pueden repetirse en el mismo ítem (ID Det: $idDet)");
        }
        
        $stmt->bind_param("iiiiii", 
            $idResponsable,
            $lote1,
            $lote2,
            $lote3,
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