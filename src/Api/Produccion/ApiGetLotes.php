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

$sql = "SELECT Id_Lote, CodigoLote, Descripcion, FechaCreacion, Activo FROM Lotes";
if ($soloActivos) {
    $sql .= " WHERE Activo = 1";
}
$sql .= " ORDER BY CodigoLote";

$result = $enlace->query($sql);

$lotes = [];
while ($row = $result->fetch_assoc()) {
    $lotes[] = [
        'idLote' => $row['Id_Lote'],
        'codigoLote' => $row['CodigoLote'],
        'descripcion' => $row['Descripcion'],
        'fechaCreacion' => $row['FechaCreacion'],
        'activo' => (int)$row['Activo']
    ];
}

echo json_encode(["success" => true, "lotes" => $lotes]);
$enlace->close();
?>