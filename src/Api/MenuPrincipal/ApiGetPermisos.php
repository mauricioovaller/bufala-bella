<?php
header("Content-Type: application/json");
session_start(); // 👈 MUY IMPORTANTE

// Verificar si la solicitud es POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

// Verificar conexión
if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

if (!isset($_SESSION['idUsuario'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$idUsuario = validar_entero($_SESSION['idUsuario']);

// Sanitización
function validar_entero($valor)
{
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}

try {
    $sql = "SELECT NombreOpcion, Ruta
            FROM Permisos
            WHERE IdUsuario = ?"; // 👈 AJUSTADO al nombre real de la columna
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $idUsuario);
    $stmt->execute();
    $stmt->bind_result($nombreOpcion, $ruta);

    $permisos = [];
    while ($stmt->fetch()) {
        $permisos[] = [
            "nombreOpcion" => $nombreOpcion,
            "ruta" => $ruta,
        ];
    }
    $stmt->close();

    
    // ===== Respuesta final =====
    echo json_encode([
        "success" => true,
        "permisos" => $permisos, // 👈 más claro que "recepcion"
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
