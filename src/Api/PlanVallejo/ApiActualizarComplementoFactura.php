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

if (!$data || !isset($data['items']) || !is_array($data['items'])) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Funciones de sanitización
function limpiar_texto($txt) {
    return $txt !== null ? trim($txt) : null;
}
function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor) {
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}

// Asumimos que el usuario está autenticado y su ID está disponible
// Por ahora, fijamos un ID de usuario por defecto (esto se reemplazará con sesión)
$idUsuario = 1; // CAMBIAR: Obtener de la sesión real

$items = $data['items'];
$actualizados = 0;
$errores = [];

$enlace->begin_transaction();

try {
    $sqlUpdate = "UPDATE DetInvoice SET 
        Dex = ?,
        Dia = ?,
        Mes = ?,
        Anio = ?,
        AD = ?,
        Pais = ?,
        CIP = ?,
        Unidad = ?,
        FOB = ?,
        VAN = ?,
        Porcentaje = ?,
        Reposicion = ?,
        UsuarioModificacion = ?,
        FechaModificacion = NOW()
        WHERE Id_DetInvoice = ?";
    
    $stmt = $enlace->prepare($sqlUpdate);
    
    foreach ($items as $item) {
        $idDetInvoice = validar_entero($item['idDetInvoice'] ?? null);
        if (!$idDetInvoice) {
            $errores[] = "ID de detalle inválido";
            continue;
        }
        
        $dex = limpiar_texto($item['dex'] ?? null);
        $dia = validar_entero($item['dia'] ?? null);
        $mes = validar_entero($item['mes'] ?? null);
        $anio = validar_entero($item['anio'] ?? null);
        $ad = limpiar_texto($item['ad'] ?? null);
        $pais = limpiar_texto($item['pais'] ?? null);
        $cip = limpiar_texto($item['cip'] ?? null);
        $unidad = limpiar_texto($item['unidad'] ?? 'Kilogramo');
        $fob = validar_flotante($item['fob'] ?? null);
        $van = validar_flotante($item['van'] ?? null);
        $porcentaje = validar_flotante($item['porcentaje'] ?? null);
        $reposicion = limpiar_texto($item['reposicion'] ?? 'En Proceso');
        
        $stmt->bind_param(
            "siiissssdddsii",
            $dex,
            $dia,
            $mes,
            $anio,
            $ad,
            $pais,
            $cip,
            $unidad,
            $fob,
            $van,
            $porcentaje,
            $reposicion,
            $idUsuario,
            $idDetInvoice
        );
        
        if ($stmt->execute()) {
            $actualizados += $stmt->affected_rows;
        } else {
            $errores[] = "Error actualizando ID $idDetInvoice: " . $enlace->error;
        }
    }
    
    $stmt->close();
    
    if (empty($errores)) {
        $enlace->commit();
        echo json_encode([
            "success" => true,
            "actualizados" => $actualizados,
            "message" => "Se actualizaron $actualizados registros"
        ]);
    } else {
        $enlace->rollback();
        echo json_encode([
            "success" => false,
            "message" => "Ocurrieron errores",
            "errores" => $errores
        ]);
    }
    
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>