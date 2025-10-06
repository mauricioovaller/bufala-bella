<?php
header("Access-Control-Allow-Origin: *"); // Permite solicitudes desde cualquier origen (puedes cambiarlo)
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Crear conexión con los datos del archivo config_bd.php
// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4"); // 👈 importante


// Verificar que la solicitud sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

// Función para obtener datos de una tabla
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

// Consultas a la base de datos
$clientes = obtenerDatos($enlace, "SELECT Id_Cliente, Nombre, DiasFechaSalida, DiasFechaEnroute, DiasFechaDelivery, DiasFechaIngreso FROM Clientes ORDER BY Nombre");
$productos = obtenerDatos($enlace, "SELECT Id_Producto, DescripProducto, DescripFactura, Codigo_Siesa, Codigo_FDA, PesoGr, FactorPesoBruto FROM Productos ORDER BY DescripProducto");
$bodegas = obtenerDatos($enlace, "SELECT Id_Bodega, Descripcion FROM Bodegas ORDER BY Descripcion");
$embalajes = obtenerDatos($enlace, "SELECT Id_Embalaje, Cantidad, Descripcion FROM Embalajes ORDER BY Cantidad");
$transportadoras = obtenerDatos($enlace, "SELECT Id_Transportadora, Nombre, Direccion FROM Transportadoras ORDER BY Nombre");

// Responder con los datos en formato JSON
echo json_encode([
    'clientes' => $clientes,
    'productos' => $productos,
    'bodegas' => $bodegas,
    'embalajes' => $embalajes,
    'transportadoras' => $transportadoras
]);

$enlace->close();
?>
