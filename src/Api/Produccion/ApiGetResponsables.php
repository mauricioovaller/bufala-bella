<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$soloActivos = isset($data['soloActivos']) ? (bool)$data['soloActivos'] : true;

$sql = "SELECT Id_Responsable, Nombre, Activo FROM Responsables";
if ($soloActivos) {
    $sql .= " WHERE Activo = 1";
}
$sql .= " ORDER BY Nombre";

$result = $enlace->query($sql);

$responsables = [];
while ($row = $result->fetch_assoc()) {
    $responsables[] = [
        'idResponsable' => $row['Id_Responsable'],
        'nombre' => $row['Nombre'],
        'activo' => (int)$row['Activo']
    ];
}

echo json_encode(["success" => true, "responsables" => $responsables]);
$enlace->close();
?>