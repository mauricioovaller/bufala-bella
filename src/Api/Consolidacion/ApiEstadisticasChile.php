<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$fechaDesde = $input['fechaDesde'] ?? '';
$fechaHasta = $input['fechaHasta'] ?? '';
$tipoFecha = $input['tipoFecha'] ?? 'fechaSalida';

if (empty($fechaDesde) || empty($fechaHasta)) {
    echo json_encode(["success" => false, "message" => "Fechas requeridas"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$sql = "SELECT
    (SELECT COUNT(DISTINCT Id_EncabPedido) FROM EncabPedidoChile WHERE $tipoFecha BETWEEN ? AND ? AND Estado = 'Activo') as totalPedidos,
    (SELECT COALESCE(SUM(det.Cantidad), 0) FROM EncabPedidoChile enc INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido WHERE enc.$tipoFecha BETWEEN ? AND ? AND enc.Estado = 'Activo') AS Cajas,
    (SELECT COALESCE(ROUND(SUM(det.PesoNeto), 2), 0) FROM EncabPedidoChile enc INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje WHERE enc.$tipoFecha BETWEEN ? AND ? AND enc.Estado = 'Activo') AS PesoNeto,
    (SELECT COALESCE(ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario), 2), 0) FROM EncabPedidoChile enc INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje WHERE enc.$tipoFecha BETWEEN ? AND ? AND enc.Estado = 'Activo') AS USD,
    (SELECT COALESCE(SUM(CantidadEstibas), 0) FROM EncabPedidoChile WHERE $tipoFecha BETWEEN ? AND ? AND Estado = 'Activo') AS Estibas";

try {
    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $enlace->error);
    }

    $stmt->bind_param(
        "ssssssssss",
        $fechaDesde, $fechaHasta,
        $fechaDesde, $fechaHasta,
        $fechaDesde, $fechaHasta,
        $fechaDesde, $fechaHasta,
        $fechaDesde, $fechaHasta
    );

    $executed = $stmt->execute();
    if (!$executed) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    $stmt->bind_result($totalPedidos, $Cajas, $PesoNeto, $USD, $Estibas);
    $stmt->fetch();

    echo json_encode([
        "success" => true,
        "totalPedidos" => $totalPedidos ?? 0,
        "cajas" => $Cajas ?? 0,
        "pesoNeto" => $PesoNeto ?? 0,
        "valorTotal" => $USD ?? 0,
        "estibas" => $Estibas ?? 0
    ]);

    $stmt->close();
} catch (Exception $e) {
    error_log("Error en ApiEstadisticasChile: " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Error interno: " . $e->getMessage()]);
}

$enlace->close();
?>
