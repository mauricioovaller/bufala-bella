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

function obtenerDatos($enlace, $query) {
    $result = $enlace->query($query);
    $datos = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $datos[] = $row;
        }
    }
    return $datos;
}

$clientes = obtenerDatos($enlace, "SELECT Id_Cliente, Nombre FROM Clientes ORDER BY Nombre");
$embalajes = obtenerDatos($enlace, "SELECT Id_Embalaje, Cantidad, CONCAT(Descripcion,' ',Lado1,' x ',Lado2,' x ',Lado3) AS Descripcion FROM Embalajes ORDER BY Cantidad");
$productos = obtenerDatos($enlace, "SELECT Id_Producto, DescripProducto, DescripFactura, Codigo_Siesa, PesoGr, FactorPesoBruto, PrecioVenta FROM Productos ORDER BY DescripProducto");

echo json_encode([
    'clientes' => $clientes,
    'embalajes' => $embalajes,
    'productos' => $productos
]);

$enlace->close();
?>
