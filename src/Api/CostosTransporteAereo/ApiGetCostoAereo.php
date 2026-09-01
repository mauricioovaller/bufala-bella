<?php
// ApiGetCostoAereo.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Método no permitido. Usa POST."]);
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$idCosto = $input['id'] ?? null;

if (!$idCosto || !is_numeric($idCosto)) {
    echo json_encode(["success" => false, "error" => "ID de costo aéreo no válido"]);
    exit;
}

try {
    $sql = "SELECT
                Id_CostoTransporteAereo,
                Fecha,
                GuiaMaster,
                TipoPedido,
                ValorFleteUSD,
                TRM,
                PesoCobrado,
                Observaciones,
                FechaRegistro,
                UsuarioRegistro
            FROM CostosTransporteAereo
            WHERE Id_CostoTransporteAereo = ?";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $idCosto);
    $stmt->execute();

    $stmt->bind_result(
        $idCostoAereo,
        $fecha,
        $guiaMaster,
        $tipoPedidoRow,
        $valorFleteUSD,
        $trm,
        $pesoCobrado,
        $observaciones,
        $fechaRegistro,
        $usuarioRegistro
    );

    if ($stmt->fetch()) {
        $stmt->close();

        $costoCOP = round($valorFleteUSD * $trm, 0);
        $costoAereoPorKg = $pesoCobrado > 0 ? round($costoCOP / $pesoCobrado, 2) : 0;

        echo json_encode([
            'success' => true,
            'costo' => [
                'id' => $idCostoAereo,
                'Fecha' => $fecha,
                'GuiaMaster' => $guiaMaster,
                'TipoPedido' => $tipoPedidoRow,
                'ValorFleteUSD' => (float)$valorFleteUSD,
                'TRM' => (float)$trm,
                'PesoCobrado' => (float)$pesoCobrado,
                'Observaciones' => $observaciones,
                'FechaRegistro' => $fechaRegistro,
                'UsuarioRegistro' => $usuarioRegistro,
                'CostoCOP' => (float)$costoCOP,
                'CostoAereoPorKg' => (float)$costoAereoPorKg
            ]
        ]);
    } else {
        $stmt->close();
        echo json_encode([
            'success' => false,
            'error' => 'Costo aéreo no encontrado'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener el costo aéreo: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>
