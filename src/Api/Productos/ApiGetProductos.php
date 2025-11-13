<?php
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

// Obtener productos
$sql = "SELECT 
            Id_Producto,
            DescripProducto,
            DescripFactura,
            Codigo_Siesa,
            Codigo_FDA,
            PesoGr,
            FactorPesoBruto,
            PrecioVenta,
            Activo
        FROM Productos 
        ORDER BY DescripProducto";

$stmt = $enlace->prepare($sql);
$stmt->execute();

// Vincular resultados
$stmt->bind_result(
    $Id_Producto,
    $DescripProducto,
    $DescripFactura,
    $Codigo_Siesa,
    $Codigo_FDA,
    $PesoGr,
    $FactorPesoBruto,
    $PrecioVenta,
    $Activo
);

$productos = [];
while ($stmt->fetch()) {
    $productos[] = [
        'Id_Producto' => $Id_Producto,
        'DescripProducto' => $DescripProducto,
        'DescripFactura' => $DescripFactura,
        'Codigo_Siesa' => $Codigo_Siesa,
        'Codigo_FDA' => $Codigo_FDA,
        'PesoGr' => $PesoGr,
        'FactorPesoBruto' => $FactorPesoBruto,
        'PrecioVenta' => $PrecioVenta,
        'Activo' => $Activo
    ];
}
$stmt->close();

if (!empty($productos)) {
    echo json_encode($productos);
} else {
    echo json_encode(["error" => "No se encontraron productos"]);
}

$enlace->close();
?>