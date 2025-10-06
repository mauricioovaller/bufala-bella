<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/Natural/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

function limpiar_texto($texto) {
    return htmlspecialchars(trim($texto), ENT_QUOTES, "UTF-8");
}

function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : 0;
}

$idCliente = validar_entero($data["idCliente"] ?? 0);
$nombre = limpiar_texto($data["nombre"] ?? "");
$diasSalida = validar_entero($data["diasFechaSalida"] ?? 0);
$diasEnroute = validar_entero($data["diasFechaEnroute"] ?? 0);
$diasDelivery = validar_entero($data["diasFechaDelivery"] ?? 0);
$diasIngreso = validar_entero($data["diasFechaIngreso"] ?? 0);
$regiones = $data["regiones"] ?? [];

if (!$idCliente || !$nombre) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // Actualizar cliente
    $sqlCliente = "UPDATE Clientes SET Nombre = ?, DiasFechaSalida = ?, DiasFechaEnroute = ?, DiasFechaDelivery = ?, DiasFechaIngreso = ? WHERE Id_Cliente = ?";
    $stmtCliente = $enlace->prepare($sqlCliente);
    $stmtCliente->bind_param("siiiii", $nombre, $diasSalida, $diasEnroute, $diasDelivery, $diasIngreso, $idCliente);
    $stmtCliente->execute();
    $stmtCliente->close();

    // Eliminar regiones existentes y insertar las nuevas
    $sqlDeleteRegiones = "DELETE FROM ClientesRegion WHERE Id_Cliente = ?";
    $stmtDelete = $enlace->prepare($sqlDeleteRegiones);
    $stmtDelete->bind_param("i", $idCliente);
    $stmtDelete->execute();
    $stmtDelete->close();

    // Insertar nuevas regiones
    if (!empty($regiones)) {
        $sqlRegion = "INSERT INTO ClientesRegion (Id_Cliente, Region, Direccion, Frecuencia) VALUES (?, ?, ?, ?)";
        $stmtRegion = $enlace->prepare($sqlRegion);
        
        foreach ($regiones as $region) {
            $regionNombre = limpiar_texto($region["region"] ?? "");
            $direccion = limpiar_texto($region["direccion"] ?? "");
            $frecuencia = limpiar_texto($region["frecuencia"] ?? "");
            
            if ($regionNombre) {
                $stmtRegion->bind_param("isss", $idCliente, $regionNombre, $direccion, $frecuencia);
                $stmtRegion->execute();
            }
        }
        $stmtRegion->close();
    }

    $enlace->commit();
    echo json_encode(["success" => true, "message" => "Cliente actualizado exitosamente"]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>