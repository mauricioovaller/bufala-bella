<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

try {
    // Clientes
    $stmtCli = $enlace->prepare("SELECT Id_Cliente, Nombre FROM Clientes ORDER BY Nombre");
    $stmtCli->execute();
    $stmtCli->bind_result($idCliente, $nombre);
    $clientes = [];
    while ($stmtCli->fetch()) {
        $clientes[] = ['Id_Cliente' => $idCliente, 'Nombre' => $nombre];
    }
    $stmtCli->close();

    // Regiones (todas)
    $stmtReg = $enlace->prepare("SELECT cr.Id_ClienteRegion, cr.Id_Cliente, cr.Region FROM ClientesRegion cr ORDER BY cr.Region");
    $stmtReg->execute();
    $stmtReg->bind_result($idClienteRegion, $idClienteReg, $region);
    $regiones = [];
    while ($stmtReg->fetch()) {
        $regiones[] = ['Id_ClienteRegion' => $idClienteRegion, 'Id_Cliente' => $idClienteReg, 'Region' => $region ?? ''];
    }
    $stmtReg->close();

    echo json_encode([
        'success' => true,
        'clientes' => $clientes,
        'regiones' => $regiones
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$enlace->close();
?>