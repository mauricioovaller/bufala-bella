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

try {
    switch ($accion) {
        case 'listar':
            listarDestinatarios($enlace, $data);
            break;
            
        case 'obtener':
            obtenerDestinatario($enlace, $data);
            break;
            
        case 'crear':
            crearDestinatario($enlace, $data);
            break;
            
        case 'actualizar':
            actualizarDestinatario($enlace, $data);
            break;
            
        case 'eliminar':
            eliminarDestinatario($enlace, $data);
            break;
            
        case 'predeterminados':
            obtenerPredeterminados($enlace);
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

function listarDestinatarios($enlace, $data) {
    $tipo = $data['tipo'] ?? 'todos';
    $activo = $data['activo'] ?? true;
    
    if ($tipo === 'todos') {
        $sql = "SELECT * FROM correos_destinatarios WHERE activo = ? ORDER BY predeterminado DESC, nombre ASC";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("i", $activo);
    } else {
        $sql = "SELECT * FROM correos_destinatarios WHERE tipo = ? AND activo = ? ORDER BY predeterminado DESC, nombre ASC";
        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("si", $tipo, $activo);
    }
    
    $stmt->execute();
    $stmt->store_result();
    
    // Obtener resultados manualmente (compatible con PHP sin mysqlnd)
    $destinatarios = [];
    $meta = $stmt->result_metadata();
    
    if ($meta) {
        $params = [];
        $row = [];
        
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        
        call_user_func_array([$stmt, 'bind_result'], $params);
        
        while ($stmt->fetch()) {
            $destinatario = [];
            foreach ($row as $key => $val) {
                $destinatario[$key] = $val;
            }
            $destinatarios[] = $destinatario;
        }
        
        $meta->free();
    }
    
    echo json_encode([
        "success" => true,
        "destinatarios" => $destinatarios,
        "total" => count($destinatarios)
    ]);
    
    $stmt->close();
}

function obtenerDestinatario($enlace, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }
    
    $sql = "SELECT * FROM correos_destinatarios WHERE id = ?";
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
        
        $destinatario = [];
        foreach ($row as $key => $val) {
            $destinatario[$key] = $val;
        }
        
        $meta->free();
        echo json_encode(["success" => true, "destinatario" => $destinatario]);
    } else {
        echo json_encode(["success" => false, "message" => "Destinatario no encontrado"]);
    }
    
    $stmt->close();
}

function crearDestinatario($enlace, $data) {
    $nombre = trim($data['nombre'] ?? '');
    $email = trim($data['email'] ?? '');
    $tipo = $data['tipo'] ?? 'cliente';
    $cliente_id = $data['cliente_id'] ?? null;
    $predeterminado = $data['predeterminado'] ?? false;
    
    // Validaciones
    if (empty($nombre) || empty($email)) {
        echo json_encode(["success" => false, "message" => "Nombre y email son requeridos"]);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Email no válido"]);
        return;
    }
    
    // Verificar si el email ya existe
    $sqlCheck = "SELECT id FROM correos_destinatarios WHERE email = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $email);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    
    if ($stmtCheck->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "El email ya existe en el sistema"]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();
    
    // Insertar nuevo destinatario
    $sql = "INSERT INTO correos_destinatarios (nombre, email, tipo, cliente_id, predeterminado) VALUES (?, ?, ?, ?, ?)";
    $stmt = $enlace->prepare($sql);
    
    if ($cliente_id) {
        $stmt->bind_param("sssii", $nombre, $email, $tipo, $cliente_id, $predeterminado);
    } else {
        $stmt->bind_param("sssii", $nombre, $email, $tipo, $cliente_id, $predeterminado);
    }
    
    if ($stmt->execute()) {
        $nuevoId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Destinatario creado exitosamente",
            "id" => $nuevoId
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al crear destinatario: " . $stmt->error]);
    }
    
    $stmt->close();
}

function actualizarDestinatario($enlace, $data) {
    $id = $data['id'] ?? 0;
    $nombre = trim($data['nombre'] ?? '');
    $email = trim($data['email'] ?? '');
    $tipo = $data['tipo'] ?? 'cliente';
    $cliente_id = $data['cliente_id'] ?? null;
    $predeterminado = $data['predeterminado'] ?? false;
    $activo = $data['activo'] ?? true;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }
    
    // Verificar si el destinatario existe
    $sqlCheck = "SELECT id FROM correos_destinatarios WHERE id = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    $stmtCheck->bind_param("i", $id);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    
    if ($stmtCheck->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Destinatario no encontrado"]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();
    
    // Verificar si el nuevo email ya existe (excluyendo el actual)
    if (!empty($email)) {
        $sqlCheckEmail = "SELECT id FROM correos_destinatarios WHERE email = ? AND id != ?";
        $stmtCheckEmail = $enlace->prepare($sqlCheckEmail);
        $stmtCheckEmail->bind_param("si", $email, $id);
        $stmtCheckEmail->execute();
        $stmtCheckEmail->store_result();
        
        if ($stmtCheckEmail->num_rows > 0) {
            echo json_encode(["success" => false, "message" => "El email ya existe en otro destinatario"]);
            $stmtCheckEmail->close();
            return;
        }
        $stmtCheckEmail->close();
    }
    
    // Actualizar destinatario
    $sql = "UPDATE correos_destinatarios SET 
            nombre = COALESCE(?, nombre),
            email = COALESCE(?, email),
            tipo = COALESCE(?, tipo),
            cliente_id = ?,
            predeterminado = ?,
            activo = ?
            WHERE id = ?";
    
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("sssiiii", $nombre, $email, $tipo, $cliente_id, $predeterminado, $activo, $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Destinatario actualizado exitosamente"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar destinatario: " . $stmt->error]);
    }
    
    $stmt->close();
}

function eliminarDestinatario($enlace, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }
    
    // Verificar si el destinatario existe
    $sqlCheck = "SELECT id FROM correos_destinatarios WHERE id = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    $stmtCheck->bind_param("i", $id);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    
    if ($stmtCheck->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Destinatario no encontrado"]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();
    
    // Eliminar (marcar como inactivo en lugar de borrar físicamente)
    $sql = "UPDATE correos_destinatarios SET activo = FALSE WHERE id = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Destinatario eliminado exitosamente"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al eliminar destinatario: " . $stmt->error]);
    }
    
    $stmt->close();
}

function obtenerPredeterminados($enlace) {
    $sql = "SELECT id, nombre, email, tipo FROM correos_destinatarios WHERE predeterminado = TRUE AND activo = TRUE ORDER BY tipo, nombre";
    $stmt = $enlace->prepare($sql);
    $stmt->execute();
    $stmt->store_result();
    
    // Obtener resultados manualmente
    $destinatarios = [];
    $meta = $stmt->result_metadata();
    
    if ($meta) {
        $params = [];
        $row = [];
        
        while ($field = $meta->fetch_field()) {
            $params[] = &$row[$field->name];
        }
        
        call_user_func_array([$stmt, 'bind_result'], $params);
        
        while ($stmt->fetch()) {
            $destinatario = [];
            foreach ($row as $key => $val) {
                $destinatario[$key] = $val;
            }
            $destinatarios[] = $destinatario;
        }
        
        $meta->free();
    }
    
    echo json_encode([
        "success" => true,
        "destinatarios" => $destinatarios,
        "total" => count($destinatarios)
    ]);
    
    $stmt->close();
}
?>