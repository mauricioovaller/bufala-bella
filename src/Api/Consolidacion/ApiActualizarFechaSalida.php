<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

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
    echo json_encode(["success" => false, "message" => "Datos JSON no válidos"]);
    exit;
}

// Funciones de sanitización
function limpiar_texto($txt) {
    return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8");
}

function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}

function validar_fecha($fecha) {
    if (empty($fecha)) {
        return null;
    }
    
    // Verificar formato YYYY-MM-DD
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        $fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha);
        if ($fecha_obj && $fecha_obj->format('Y-m-d') === $fecha) {
            return $fecha;
        }
    }
    
    return null;
}

function validar_tipo_pedido($tipo) {
    $tipos_validos = ['normal', 'sample', null];
    return in_array($tipo, $tipos_validos) ? $tipo : null;
}

// Extraer y validar datos
$pedidoId = validar_entero($data["pedidoId"] ?? null);
$nuevaFechaSalida = validar_fecha($data["nuevaFechaSalida"] ?? null);
$tipoPedido = validar_tipo_pedido($data["tipoPedido"] ?? null);

// Validaciones obligatorias
if (!$pedidoId) {
    echo json_encode(["success" => false, "message" => "ID del pedido es requerido"]);
    exit;
}

if (!$nuevaFechaSalida) {
    echo json_encode(["success" => false, "message" => "Fecha de salida no válida. Formato requerido: YYYY-MM-DD"]);
    exit;
}

try {
    // DETECTAR AUTOMÁTICAMENTE EL TIPO DE PEDIDO SI NO SE ESPECIFICA
    if (!$tipoPedido) {
        // Primero buscar en pedidos normales
        $sqlVerificarNormal = "SELECT Id_EncabPedido FROM EncabPedido WHERE Id_EncabPedido = ?";
        $stmtVerificarNormal = $enlace->prepare($sqlVerificarNormal);
        $stmtVerificarNormal->bind_param("i", $pedidoId);
        $stmtVerificarNormal->execute();
        $stmtVerificarNormal->store_result();
        
        if ($stmtVerificarNormal->num_rows > 0) {
            $tipoPedido = 'normal';
            $stmtVerificarNormal->close();
        } else {
            $stmtVerificarNormal->close();
            
            // Buscar en pedidos sample
            $sqlVerificarSample = "SELECT Id_EncabPedido FROM EncabPedidoSample WHERE Id_EncabPedido = ?";
            $stmtVerificarSample = $enlace->prepare($sqlVerificarSample);
            $stmtVerificarSample->bind_param("i", $pedidoId);
            $stmtVerificarSample->execute();
            $stmtVerificarSample->store_result();
            
            if ($stmtVerificarSample->num_rows > 0) {
                $tipoPedido = 'sample';
                $stmtVerificarSample->close();
            } else {
                $stmtVerificarSample->close();
                echo json_encode(["success" => false, "message" => "Pedido no encontrado en ninguna tabla"]);
                exit;
            }
        }
    } else {
        // Si se especificó el tipo, verificar en la tabla correspondiente
        $tabla = $tipoPedido === 'sample' ? 'EncabPedidoSample' : 'EncabPedido';
        $sqlVerificar = "SELECT Id_EncabPedido FROM {$tabla} WHERE Id_EncabPedido = ?";
        $stmtVerificar = $enlace->prepare($sqlVerificar);
        $stmtVerificar->bind_param("i", $pedidoId);
        $stmtVerificar->execute();
        $stmtVerificar->store_result();
        
        if ($stmtVerificar->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "Pedido no encontrado en la tabla {$tabla}"]);
            exit;
        }
        $stmtVerificar->close();
    }

    // Determinar la tabla a usar
    $tabla = $tipoPedido === 'sample' ? 'EncabPedidoSample' : 'EncabPedido';

    // Iniciar transacción
    $enlace->begin_transaction();

    // Obtener la fecha actual antes de actualizar (para el log)
    $sqlFechaActual = "SELECT FechaSalida FROM {$tabla} WHERE Id_EncabPedido = ?";
    $stmtFechaActual = $enlace->prepare($sqlFechaActual);
    $stmtFechaActual->bind_param("i", $pedidoId);
    $stmtFechaActual->execute();
    $stmtFechaActual->bind_result($fechaAnterior);
    $stmtFechaActual->fetch();
    $stmtFechaActual->close();

    // Actualizar solo la fecha de salida del pedido
    $sqlActualizar = "UPDATE {$tabla} 
                      SET FechaSalida = ?                          
                      WHERE Id_EncabPedido = ?";
    
    $stmtActualizar = $enlace->prepare($sqlActualizar);
    $stmtActualizar->bind_param("si", $nuevaFechaSalida, $pedidoId);
    $stmtActualizar->execute();

    // Verificar si se actualizó correctamente
    if ($stmtActualizar->affected_rows > 0) {
        
        // Insertar en log de cambios (opcional pero recomendado)
        // Primero verificamos si existe la tabla de logs
        $tablaLogExiste = $enlace->query("SHOW TABLES LIKE 'LogCambiosPedidos'");
        if ($tablaLogExiste && $tablaLogExiste->num_rows > 0) {
            $sqlLog = "INSERT INTO LogCambiosPedidos 
                       (Id_EncabPedido, TipoPedido, CampoModificado, ValorAnterior, ValorNuevo, Usuario, FechaCambio) 
                       VALUES (?, ?, 'FechaSalida', ?, ?, 'Sistema', NOW())";
            
            $stmtLog = $enlace->prepare($sqlLog);
            $valorAnterior = $fechaAnterior ? $fechaAnterior : 'NULL';
            $tipoPedidoLog = $tipoPedido === 'sample' ? 'sample' : 'normal';
            $stmtLog->bind_param("isss", $pedidoId, $tipoPedidoLog, $valorAnterior, $nuevaFechaSalida);
            $stmtLog->execute();
            $stmtLog->close();
        }
        
        $enlace->commit();
        
        echo json_encode([
            "success" => true, 
            "message" => "Fecha de salida actualizada correctamente",
            "pedidoId" => $pedidoId,
            "tipoPedido" => $tipoPedido,
            "nuevaFechaSalida" => $nuevaFechaSalida,
            "fechaActualizacion" => date('Y-m-d H:i:s')
        ]);
        
    } else {
        // Si no hubo cambios, puede ser porque la fecha era la misma
        $enlace->rollback();
        echo json_encode([
            "success" => true, 
            "message" => "La fecha de salida ya estaba establecida en el valor solicitado",
            "pedidoId" => $pedidoId,
            "tipoPedido" => $tipoPedido,
            "fechaSalida" => $nuevaFechaSalida
        ]);
    }
    
    $stmtActualizar->close();

} catch (Exception $e) {
    if (isset($enlace)) {
        $enlace->rollback();
    }
    error_log("Error al actualizar fecha de salida: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error interno del servidor: " . $e->getMessage()]);
}

if (isset($enlace)) {
    $enlace->close();
}
?>