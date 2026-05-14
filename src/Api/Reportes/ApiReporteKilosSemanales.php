<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$fechaDesde = $data['fechaDesde'] ?? '';
$fechaHasta = $data['fechaHasta'] ?? '';

if (empty($fechaDesde) || empty($fechaHasta)) {
    echo json_encode(["success" => false, "message" => "Las fechas desde y hasta son requeridas"]);
    exit;
}

// Validar formato de fechas
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaDesde) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaHasta)) {
    echo json_encode(["success" => false, "message" => "Formato de fecha inválido. Use YYYY-MM-DD"]);
    exit;
}

if ($fechaDesde > $fechaHasta) {
    echo json_encode(["success" => false, "message" => "La fecha desde no puede ser mayor que la fecha hasta"]);
    exit;
}

/*
 * Consulta principal:
 * - Agrupa por Cliente, Región, Producto y Semana ISO (YEARWEEK con modo 3 = ISO, lunes a domingo)
 * - Suma las cajas (Cantidad) de DetPedido
 * - Solo pedidos Activos
 * - FechaSalida en el rango solicitado
 */
$sql = "SELECT
            cli.Nombre                          AS cliente,
            clr.Region                          AS region,
            prd.DescripProducto                 AS descripcion,
            IFNULL(emb.Descripcion, '')         AS unidades,
            YEAR(enc.FechaSalida)               AS anio,
            WEEK(enc.FechaSalida, 3)            AS semana,
            MIN(enc.FechaSalida)                AS fecha_inicio_semana,
            SUM(det.Cantidad)                   AS cajas
        FROM EncabPedido enc
        INNER JOIN Clientes cli      ON enc.Id_Cliente        = cli.Id_Cliente
        INNER JOIN ClientesRegion clr ON enc.Id_ClienteRegion = clr.Id_ClienteRegion
        INNER JOIN DetPedido det     ON enc.Id_EncabPedido    = det.Id_EncabPedido
        INNER JOIN Productos prd     ON det.Id_Producto       = prd.Id_Producto
        LEFT JOIN Embalajes emb      ON det.Id_Embalaje       = emb.Id_Embalaje
        WHERE enc.FechaSalida BETWEEN ? AND ?
          AND enc.Estado = 'Activo'
        GROUP BY
            cli.Nombre,
            clr.Region,
            prd.DescripProducto,
            IFNULL(emb.Descripcion, ''),
            YEAR(enc.FechaSalida),
            WEEK(enc.FechaSalida, 3)
        ORDER BY
            cli.Nombre ASC,
            clr.Region ASC,
            prd.DescripProducto ASC,
            IFNULL(emb.Descripcion, '') ASC,
            anio ASC,
            semana ASC";

$stmt = $enlace->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error al preparar consulta: " . $enlace->error]);
    exit;
}

$stmt->bind_param("ss", $fechaDesde, $fechaHasta);
$stmt->execute();

$stmt->bind_result($cliente, $region, $descripcion, $unidades, $anio, $semana, $fechaInicioSemana, $cajas);

$filas = [];
while ($stmt->fetch()) {
    $filas[] = [
        "cliente"           => $cliente,
        "region"            => $region,
        "descripcion"       => $descripcion,
        "unidades"          => $unidades,
        "anio"              => (int)$anio,
        "semana"            => (int)$semana,
        "fechaInicioSemana" => $fechaInicioSemana,
        "cajas"             => round((float)$cajas, 4)
    ];
}

$stmt->close();

/*
 * Consulta de Muestras:
 * Misma estructura que pedidos regulares pero sobre EncabPedidoSample + DetPedidoSample
 */
$sqlSamples = "SELECT
            IFNULL(cli.Nombre, enc.Cliente)     AS cliente,
            IFNULL(clr.Region, 'Sin región')    AS region,
            prd.DescripProducto                 AS descripcion,
            IFNULL(emb.Descripcion, '')         AS unidades,
            YEAR(enc.FechaSalida)               AS anio,
            WEEK(enc.FechaSalida, 3)            AS semana,
            MIN(enc.FechaSalida)                AS fecha_inicio_semana,
            SUM(det.Cantidad)                   AS cajas
        FROM EncabPedidoSample enc
        LEFT JOIN Clientes cli         ON enc.Id_Cliente        = cli.Id_Cliente
        LEFT JOIN ClientesRegion clr   ON enc.Id_ClienteRegion  = clr.Id_ClienteRegion
        INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido    = det.Id_EncabPedido
        INNER JOIN Productos prd       ON det.Id_Producto       = prd.Id_Producto
        LEFT JOIN Embalajes emb        ON det.Id_Embalaje       = emb.Id_Embalaje
        WHERE enc.FechaSalida BETWEEN ? AND ?
          AND enc.Estado = 'Activo'
        GROUP BY
            IFNULL(cli.Nombre, enc.Cliente),
            IFNULL(clr.Region, 'Sin región'),
            prd.DescripProducto,
            IFNULL(emb.Descripcion, ''),
            YEAR(enc.FechaSalida),
            WEEK(enc.FechaSalida, 3)
        ORDER BY
            IFNULL(cli.Nombre, enc.Cliente) ASC,
            IFNULL(clr.Region, 'Sin región') ASC,
            prd.DescripProducto ASC,
            IFNULL(emb.Descripcion, '') ASC,
            anio ASC,
            semana ASC";

$stmtS = $enlace->prepare($sqlSamples);
$filasSamples = [];

if ($stmtS) {
    $stmtS->bind_param("ss", $fechaDesde, $fechaHasta);
    $stmtS->execute();
    $stmtS->bind_result($sCliente, $sRegion, $sDescripcion, $sUnidades, $sAnio, $sSemana, $sFechaInicioSemana, $sCajas);
    while ($stmtS->fetch()) {
        $filasSamples[] = [
            "cliente"           => $sCliente,
            "region"            => $sRegion,
            "descripcion"       => $sDescripcion,
            "unidades"          => $sUnidades,
            "anio"              => (int)$sAnio,
            "semana"            => (int)$sSemana,
            "fechaInicioSemana" => $sFechaInicioSemana,
            "cajas"             => round((float)$sCajas, 4)
        ];
    }
    $stmtS->close();
}

$enlace->close();

echo json_encode([
    "success"      => true,
    "datos"        => $filas,
    "datosSamples" => $filasSamples,
    "fechaDesde"   => $fechaDesde,
    "fechaHasta"   => $fechaHasta,
    "total"        => count($filas)
]);
