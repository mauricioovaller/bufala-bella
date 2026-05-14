<?php
// src/Api/PedidosChile/ApiGetDatosSelect.php
// Retorna los datos para poblar los selects del módulo Pedidos Chile:
// clientesChile, productosChile, agencias, aerolineas
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

function obtenerDatos($enlace, $query)
{
    $result = $enlace->query($query);
    $datos = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $datos[] = $row;
        }
    }
    return $datos;
}

$clientesChile = obtenerDatos(
    $enlace,
    "SELECT Id_ClienteChile, Nombre, Direccion, Ciudad, Pais
     FROM ClientesChile
     WHERE Estado = 'Activo'
     ORDER BY Nombre"
);

$productosChile = obtenerDatos(
    $enlace,
    "SELECT Id_ProductoChile, DescripProducto, CodigoSiesa, CodigoCliente,
            PesoNetoGr, PesoEscurridoKg, EnvaseInternoxCaja, FactorPesoBruto, PrecioXKilo
     FROM ProductosChile
     WHERE Activo = -1
     ORDER BY DescripProducto"
);

$agencias = obtenerDatos(
    $enlace,
    "SELECT IdAgencia, NOMAGENCIA AS Nombre FROM Agencias ORDER BY NOMAGENCIA"
);

$aerolineas = obtenerDatos(
    $enlace,
    "SELECT IdAerolinea, NOMAEROLINEA AS Nombre FROM Aerolineas ORDER BY NOMAEROLINEA"
);

echo json_encode([
    'clientesChile' => $clientesChile,
    'productosChile' => $productosChile,
    'agencias'      => $agencias,
    'aerolineas'    => $aerolineas,
]);

$enlace->close();
