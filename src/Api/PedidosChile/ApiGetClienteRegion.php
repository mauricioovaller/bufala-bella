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

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no v�lidos"]);
    exit;
}

function limpiar_texto($txt) { return htmlspecialchars(trim($txt), ENT_QUOTES, "UTF-8"); }
function validar_entero($valor) { return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null; }

$idCliente = validar_entero($data["clienteId"] ?? null);

if (!$idCliente) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $sql = "SELECT Id_ClienteRegion, Id_Cliente, Region, Direccion, Id_Bodega 
              FROM ClientesRegion 
              WHERE Id_Cliente = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $idCliente);
    $stmt->execute();
    $stmt->bind_result($idClienteRegion, $idClienteRes, $region, $direccion, $idBodega);

    $regiones = [];
    while ($stmt->fetch()) {
        $regiones[] = [
            "idClienteRegion" => $idClienteRegion,
            "idCliente" => $idClienteRes,
            "region" => $region,
            "direccion" => $direccion,
            "idBodega" => $idBodega,
        ];
    }
    $stmt->close();

    echo json_encode(["success" => true, "regiones" => $regiones]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
