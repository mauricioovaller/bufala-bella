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

    // 1. Actualizar cliente
    $sqlCliente = "UPDATE Clientes SET Nombre = ?, DiasFechaSalida = ?, DiasFechaEnroute = ?, DiasFechaDelivery = ?, DiasFechaIngreso = ? WHERE Id_Cliente = ?";
    $stmtCliente = $enlace->prepare($sqlCliente);
    $stmtCliente->bind_param("siiiii", $nombre, $diasSalida, $diasEnroute, $diasDelivery, $diasIngreso, $idCliente);
    $stmtCliente->execute();
    $stmtCliente->close();

    // 2. Obtener regiones existentes del cliente (sin get_result)
    $regionesExistentes = [];
    $sqlSelectRegiones = "SELECT Id_ClienteRegion, Region, Direccion, Id_Bodega, Frecuencia FROM ClientesRegion WHERE Id_Cliente = ?";
    $stmtSelect = $enlace->prepare($sqlSelectRegiones);
    $stmtSelect->bind_param("i", $idCliente);
    $stmtSelect->execute();
    
    // Método alternativo a get_result()
    $stmtSelect->bind_result($idRegion, $regionNombre, $direccion, $idBodega, $frecuencia);
    while ($stmtSelect->fetch()) {
        $regionesExistentes[] = [
            'Id_ClienteRegion' => $idRegion,
            'Region' => $regionNombre,
            'Direccion' => $direccion,
            'Id_Bodega' => $idBodega,
            'Frecuencia' => $frecuencia
        ];
    }
    $stmtSelect->close();

    // 3. Preparar statements para las operaciones
    $sqlUpdateRegion = "UPDATE ClientesRegion SET Region = ?, Direccion = ?, Id_Bodega = ?, Frecuencia = ? WHERE Id_ClienteRegion = ? AND Id_Cliente = ?";
    $stmtUpdate = $enlace->prepare($sqlUpdateRegion);
    
    $sqlInsertRegion = "INSERT INTO ClientesRegion (Id_Cliente, Region, Direccion, Id_Bodega, Frecuencia) VALUES (?, ?, ?, ?, ?)";
    $stmtInsert = $enlace->prepare($sqlInsertRegion);

    // 4. Procesar regiones - SOLO ACTUALIZAR Y AGREGAR, NO ELIMINAR
    foreach ($regiones as $region) {
        $regionNombre = limpiar_texto($region["region"] ?? "");
        $direccion = limpiar_texto($region["direccion"] ?? "");
        $idBodega = validar_entero($region["idBodega"] ?? 0);
        $frecuencia = limpiar_texto($region["frecuencia"] ?? "");
        $idClienteRegion = validar_entero($region["idClienteRegion"] ?? 0);

        // Si la región tiene ID, es una actualización
        if ($idClienteRegion > 0) {
            // Verificar que la región pertenece al cliente
            $regionPertenece = false;
            foreach ($regionesExistentes as $regionExistente) {
                if ($regionExistente['Id_ClienteRegion'] == $idClienteRegion) {
                    $regionPertenece = true;
                    break;
                }
            }

            if ($regionPertenece && $regionNombre) {
                $stmtUpdate->bind_param("ssisii", $regionNombre, $direccion, $idBodega, $frecuencia, $idClienteRegion, $idCliente);
                $stmtUpdate->execute();
            }
        } else {
            // Es una nueva región
            if ($regionNombre) {
                $stmtInsert->bind_param("issis", $idCliente, $regionNombre, $direccion, $idBodega, $frecuencia);
                $stmtInsert->execute();
            }
        }
    }

    // 5. NO ELIMINAMOS NINGUNA REGIÓN - Se mantienen todas las regiones existentes

    $stmtUpdate->close();
    $stmtInsert->close();

    $enlace->commit();
    echo json_encode(["success" => true, "message" => "Cliente actualizado exitosamente"]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>