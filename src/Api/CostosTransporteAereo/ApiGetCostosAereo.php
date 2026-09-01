<?php
// ApiGetCostosAereo.php
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
$fechaDesde = $input['fechaDesde'] ?? null;
$fechaHasta = $input['fechaHasta'] ?? null;
$tipoPedido = $input['tipoPedido'] ?? 'normal';

if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "error" => "Debe proporcionar fechaDesde y fechaHasta"]);
    exit;
}

if (!in_array($tipoPedido, ['normal', 'chile'], true)) {
    $tipoPedido = 'normal';
}

try {
    $sql = "SELECT
                cta.Id_CostoTransporteAereo,
                cta.Fecha,
                cta.GuiaMaster,
                cta.TipoPedido,
                cta.ValorFleteUSD,
                cta.TRM,
                cta.PesoCobrado,
                cta.Observaciones,
                cta.FechaRegistro,
                cta.UsuarioRegistro,
                ROUND(cta.ValorFleteUSD * cta.TRM, 0) AS CostoCOP,
                CASE
                    WHEN cta.PesoCobrado > 0
                    THEN ROUND((cta.ValorFleteUSD * cta.TRM) / cta.PesoCobrado, 2)
                    ELSE 0
                END AS CostoAereoPorKg
            FROM CostosTransporteAereo cta
            WHERE cta.Fecha BETWEEN ? AND ?
              AND cta.TipoPedido = ?
            ORDER BY cta.Fecha DESC, cta.GuiaMaster ASC";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("sss", $fechaDesde, $fechaHasta, $tipoPedido);
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
        $usuarioRegistro,
        $costoCOP,
        $costoAereoPorKg
    );

    $costos = [];
    while ($stmt->fetch()) {
        $costos[] = [
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
        ];
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'costos' => $costos,
        'total' => count($costos)
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener costos aéreos: ' . $e->getMessage()
    ]);
}

$enlace->close();
?>
