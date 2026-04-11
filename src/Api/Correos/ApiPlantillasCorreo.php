<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Obtener datos de la solicitud
$data = json_decode(file_get_contents("php://input"), true);
$accion = $data['accion'] ?? $_GET['accion'] ?? 'listar';
$modulo = $data['modulo'] ?? $_GET['modulo'] ?? 'facturacion';

try {
    switch ($accion) {
        case 'listar':
            listarPlantillas($enlace, $modulo);
            break;
            
        case 'obtener':
            obtenerPlantilla($enlace, $data);
            break;
            
        case 'obtener_predeterminada':
            obtenerPlantillaPredeterminada($enlace, $modulo);
            break;
            
        case 'crear':
            crearPlantilla($enlace, $data);
            break;
            
        case 'actualizar':
            actualizarPlantilla($enlace, $data);
            break;
            
        case 'eliminar':
            eliminarPlantilla($enlace, $data);
            break;
            
        case 'aplicar_variables':
            aplicarVariablesPlantilla($enlace, $data);
            break;
            
        default:
            echo json_encode(["success" => false, "message" => "Acción no válida"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function listarPlantillas($enlace, $modulo) {
    $activa = true;
    
    $sql = "SELECT * FROM plantillas_correo WHERE modulo = ? AND activa = ? ORDER BY predeterminada DESC, nombre ASC";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("si", $modulo, $activa);
    $stmt->execute();
    $stmt->store_result();
    
    // Obtener resultados manualmente
    $plantillas = [];
    $meta = $stmt->result_metadata();
    
    if ($meta) {
        $params = [];
        $row = [];
        
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        
        call_user_func_array([$stmt, 'bind_result'], $params);
        
        while ($stmt->fetch()) {
            $plantilla = [];
            foreach ($row as $key => $val) {
                $plantilla[$key] = $val;
            }
            $plantillas[] = $plantilla;
        }
        
        $meta->free();
    }
    
    echo json_encode([
        "success" => true,
        "plantillas" => $plantillas,
        "total" => count($plantillas),
        "modulo" => $modulo
    ]);
    
    $stmt->close();
}

function obtenerPlantilla($enlace, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }
    
    $sql = "SELECT * FROM plantillas_correo WHERE id = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        // Obtener resultados manualmente
        $meta = $stmt->result_metadata();
        $params = [];
        $row = [];
        
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        
        call_user_func_array([$stmt, 'bind_result'], $params);
        $stmt->fetch();
        
        $plantilla = [];
        foreach ($row as $key => $val) {
            $plantilla[$key] = $val;
        }
        
        $meta->free();
        echo json_encode(["success" => true, "plantilla" => $plantilla]);
    } else {
        echo json_encode(["success" => false, "message" => "Plantilla no encontrada"]);
    }
    
    $stmt->close();
}

function obtenerPlantillaPredeterminada($enlace, $modulo) {
    $sql = "SELECT * FROM plantillas_correo WHERE modulo = ? AND predeterminada = TRUE AND activa = TRUE LIMIT 1";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("s", $modulo);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        // Obtener resultados manualmente
        $meta = $stmt->result_metadata();
        $params = [];
        $row = [];
        
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        
        call_user_func_array([$stmt, 'bind_result'], $params);
        $stmt->fetch();
        
        $plantilla = [];
        foreach ($row as $key => $val) {
            $plantilla[$key] = $val;
        }
        
        $meta->free();
        echo json_encode(["success" => true, "plantilla" => $plantilla]);
    } else {
        // Si no hay predeterminada, obtener la primera activa
        $sql = "SELECT * FROM plantillas_correo WHERE modulo = ? AND activa = TRUE LIMIT 1";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("s", $modulo);
        $stmt->execute();
        $stmt->store_result();
        
        if ($stmt->num_rows > 0) {
            // Obtener resultados manualmente
            $meta = $stmt->result_metadata();
            $params = [];
            $row = [];
            
            while ($field = $meta->fetch_field()) {
                $params[] = &$row[$field->name];
            }
            
            call_user_func_array([$stmt, 'bind_result'], $params);
            $stmt->fetch();
            
            $plantilla = [];
            foreach ($row as $key => $val) {
                $plantilla[$key] = $val;
            }
            
            $meta->free();
            echo json_encode(["success" => true, "plantilla" => $plantilla]);
        } else {
            echo json_encode(["success" => false, "message" => "No hay plantillas disponibles para este módulo"]);
        }
    }
    
    $stmt->close();
}

function crearPlantilla($enlace, $data) {
    $nombre = trim($data['nombre'] ?? '');
    $asunto = trim($data['asunto'] ?? '');
    $cuerpo = $data['cuerpo'] ?? '';
    $modulo = $data['modulo'] ?? 'facturacion';
    $predeterminada = $data['predeterminada'] ?? false;
    
    // Validaciones
    if (empty($nombre) || empty($asunto) || empty($cuerpo)) {
        echo json_encode(["success" => false, "message" => "Nombre, asunto y cuerpo son requeridos"]);
        return;
    }
    
    // Si esta plantilla será predeterminada, quitar predeterminada de otras
    if ($predeterminada) {
        $sqlReset = "UPDATE plantillas_correo SET predeterminada = FALSE WHERE modulo = ?";
        $stmtReset = $enlace->prepare($sqlReset);
        $stmtReset->bind_param("s", $modulo);
        $stmtReset->execute();
        $stmtReset->close();
    }
    
    // Insertar nueva plantilla
    $sql = "INSERT INTO plantillas_correo (nombre, asunto, cuerpo, modulo, predeterminada) VALUES (?, ?, ?, ?, ?)";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ssssi", $nombre, $asunto, $cuerpo, $modulo, $predeterminada);
    
    if ($stmt->execute()) {
        $nuevoId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Plantilla creada exitosamente",
            "id" => $nuevoId
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al crear plantilla: " . $stmt->error]);
    }
    
    $stmt->close();
}

function actualizarPlantilla($enlace, $data) {
    $id = $data['id'] ?? 0;
    $nombre = trim($data['nombre'] ?? '');
    $asunto = trim($data['asunto'] ?? '');
    $cuerpo = $data['cuerpo'] ?? '';
    $predeterminada = $data['predeterminada'] ?? false;
    $activa = $data['activa'] ?? true;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }
    
    // Obtener módulo actual de la plantilla
    $sqlModulo = "SELECT modulo FROM plantillas_correo WHERE id = ?";
    $stmtModulo = $enlace->prepare($sqlModulo);
    $stmtModulo->bind_param("i", $id);
    $stmtModulo->execute();
    $resultModulo = $stmtModulo->get_result();
    
    if (!$rowModulo = $resultModulo->fetch_assoc()) {
        echo json_encode(["success" => false, "message" => "Plantilla no encontrada"]);
        $stmtModulo->close();
        return;
    }
    
    $modulo = $rowModulo['modulo'];
    $stmtModulo->close();
    
    // Si esta plantilla será predeterminada, quitar predeterminada de otras del mismo módulo
    if ($predeterminada) {
        $sqlReset = "UPDATE plantillas_correo SET predeterminada = FALSE WHERE modulo = ? AND id != ?";
        $stmtReset = $enlace->prepare($sqlReset);
        $stmtReset->bind_param("si", $modulo, $id);
        $stmtReset->execute();
        $stmtReset->close();
    }
    
    // Actualizar plantilla
    $sql = "UPDATE plantillas_correo SET 
            nombre = COALESCE(?, nombre),
            asunto = COALESCE(?, asunto),
            cuerpo = COALESCE(?, cuerpo),
            predeterminada = ?,
            activa = ?
            WHERE id = ?";
    
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("sssiii", $nombre, $asunto, $cuerpo, $predeterminada, $activa, $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Plantilla actualizada exitosamente"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar plantilla: " . $stmt->error]);
    }
    
    $stmt->close();
}

function eliminarPlantilla($enlace, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }
    
    // Verificar si la plantilla existe
    $sqlCheck = "SELECT id FROM plantillas_correo WHERE id = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    $stmtCheck->bind_param("i", $id);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    
    if ($stmtCheck->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Plantilla no encontrada"]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();
    
    // Eliminar (marcar como inactiva en lugar de borrar físicamente)
    $sql = "UPDATE plantillas_correo SET activa = FALSE WHERE id = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Plantilla eliminada exitosamente"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al eliminar plantilla: " . $stmt->error]);
    }
    
    $stmt->close();
}

function aplicarVariablesPlantilla($enlace, $data) {
    $plantillaId = $data['plantilla_id'] ?? 0;
    $variables = $data['variables'] ?? [];
    
    if (!$plantillaId) {
        echo json_encode(["success" => false, "message" => "ID de plantilla requerido"]);
        return;
    }
    
    // Obtener plantilla
    $sql = "SELECT asunto, cuerpo FROM plantillas_correo WHERE id = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $plantillaId);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        // Obtener resultados manualmente
        $meta = $stmt->result_metadata();
        $params = [];
        $row = [];
        
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        
        call_user_func_array([$stmt, 'bind_result'], $params);
        $stmt->fetch();
        
        $asunto = $row['asunto'];
        $cuerpo = $row['cuerpo'];
        $meta->free();
    } else {
        echo json_encode(["success" => false, "message" => "Plantilla no encontrada"]);
        $stmt->close();
        return;
    }
    
    $stmt->close();
    
    // Aplicar variables al asunto - VERSIÓN CORREGIDA
    foreach ($variables as $key => $value) {
        $placeholder = '{' . $key . '}';
        
        // Asegurar que el valor sea string
        $stringValue = is_array($value) ? implode(', ', $value) : (string)$value;
        
        $asunto = str_replace($placeholder, $stringValue, $asunto);
        $cuerpo = str_replace($placeholder, $stringValue, $cuerpo);
    }
    
    // Reemplazar {adjuntos} con lista de documentos
    if (isset($variables['adjuntos']) && is_array($variables['adjuntos'])) {
        $listaAdjuntos = "";
        foreach ($variables['adjuntos'] as $adjunto) {
            $listaAdjuntos .= "• " . (string)$adjunto . "\n";
        }
        $cuerpo = str_replace('{adjuntos}', $listaAdjuntos, $cuerpo);
    }
    
    echo json_encode([
        "success" => true,
        "asunto" => $asunto,
        "cuerpo" => $cuerpo,
        "variables_aplicadas" => array_keys($variables)
    ]);
}
?>