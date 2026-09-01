<?php
//src/Api/ProductosChile/ApiGetProductoChileEspecifico.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['idProducto']) || empty($input['idProducto'])) {
    die(json_encode(["error" => "ID de producto no válido."]));
}

$idProducto = intval($input['idProducto']);

$sqlProducto = "SELECT
            Id_Producto,
            DescripProducto,
            DescripFactura,
            Codigo_Siesa,
            Codigo_FDA,
            Codigo_CUST,
            PesoGr,
            PesoNetoUndGr,
            FactorPesoBruto,
            PrecioVenta,
            PlanVallejo,
            CodigoCIP,
            DescripPlanVallejo,
            FOB_Valor,
            VAN_Valor,
            DiasVencimiento,
            Activo
        FROM ProductosChile WHERE Id_Producto = ?";

$stmtProducto = $enlace->prepare($sqlProducto);
$stmtProducto->bind_param("i", $idProducto);
$stmtProducto->execute();

$stmtProducto->bind_result(
    $Id_Producto,
    $DescripProducto,
    $DescripFactura,
    $Codigo_Siesa,
    $Codigo_FDA,
    $Codigo_CUST,
    $PesoGr,
    $PesoNetoUndGr,
    $FactorPesoBruto,
    $PrecioVenta,
    $PlanVallejo,
    $CodigoCIP,
    $DescripPlanVallejo,
    $FOB_Valor,
    $VAN_Valor,
    $DiasVencimiento,
    $Activo
);

$producto = null;
if ($stmtProducto->fetch()) {
    $producto = [
        'Id_Producto' => $Id_Producto,
        'DescripProducto' => $DescripProducto,
        'DescripFactura' => $DescripFactura,
        'Codigo_Siesa' => $Codigo_Siesa,
        'Codigo_FDA' => $Codigo_FDA,
        'Codigo_CUST' => $Codigo_CUST,
        'PesoGr' => $PesoGr,
        'PesoNetoUndGr' => $PesoNetoUndGr,
        'FactorPesoBruto' => $FactorPesoBruto,
        'PrecioVenta' => $PrecioVenta,
        'PlanVallejo' => $PlanVallejo,
        'CodigoCIP' => $CodigoCIP,
        'DescripPlanVallejo' => $DescripPlanVallejo,
        'FOB_Valor' => $FOB_Valor,
        'VAN_Valor' => $VAN_Valor,
        'DiasVencimiento' => $DiasVencimiento,
        'Activo' => $Activo
    ];
}
$stmtProducto->close();

if (!$producto) {
    echo json_encode(["error" => "Producto Chile no encontrado"]);
    exit;
}

echo json_encode($producto);

$enlace->close();
?>
