<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$fechaDesde = $data["fechaDesde"] ?? date("Y-m-01");
$fechaHasta = $data["fechaHasta"] ?? date("Y-m-d");

try {
    $sql = "SELECT
                COUNT(DISTINCT e.Id_EncabPedido) AS totalPedidos,
                COALESCE(SUM(d.Cantidad), 0) AS unidadesDespachadas,
                COALESCE(SUM(CASE WHEN d.Cantidad_Orig > 0 THEN d.Cantidad_Orig ELSE d.Cantidad END), 0) AS unidadesPedidas,
                COALESCE(SUM(CASE WHEN e.FechaSalida_Orig IS NULL OR e.FechaSalida_Orig >= e.FechaSalida THEN d.Cantidad ELSE 0 END), 0) AS unidadesOnTime,
                COALESCE(MAX(nc.totalCreditos), 0) AS unidadesCreditadas
            FROM EncabPedido e
            INNER JOIN DetPedido d ON e.Id_EncabPedido = d.Id_EncabPedido
            LEFT JOIN (
                SELECT dnc.Id_EncabPedido, SUM(dnc.CantidadCredito) AS totalCreditos
                FROM DetNotaCredito dnc
                INNER JOIN EncabNotaCredito encNC ON dnc.Id_EncabNotaCredito = encNC.Id_EncabNotaCredito
                WHERE encNC.Estado = 'Activo'
                GROUP BY dnc.Id_EncabPedido
            ) nc ON e.Id_EncabPedido = nc.Id_EncabPedido
            WHERE e.FechaSalida BETWEEN ? AND ?
              AND e.Estado = 'Activo'";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ss", $fechaDesde, $fechaHasta);
    $stmt->execute();
    $stmt->bind_result($totalPedidos, $unidadesDespachadas, $unidadesPedidas, $unidadesOnTime, $unidadesCreditadas);
    $stmt->fetch();
    $stmt->close();
    $enlace->close();

    // Restar las unidades creditadas (NC) de las despachadas para IN FULL
    $unidadesEfectivas = $unidadesDespachadas - $unidadesCreditadas;
    if ($unidadesEfectivas < 0) $unidadesEfectivas = 0;

    $inFull = 0;
    $onTime = 0;
    $otif = 0;

    if ($unidadesPedidas > 0) {
        $inFull = round($unidadesEfectivas / $unidadesPedidas, 4);
    }

    if ($unidadesDespachadas > 0) {
        $onTime = round($unidadesOnTime / $unidadesDespachadas, 4);
    }

    $otif = round($inFull * $onTime, 4);

    echo json_encode([
        "success" => true,
        "indicadores" => [
            "inFull" => $inFull,
            "onTime" => $onTime,
            "otif" => $otif,
            "inFullPct" => round($inFull * 100, 1),
            "onTimePct" => round($onTime * 100, 1),
            "otifPct" => round($otif * 100, 1)
        ],
        "detalle" => [
            "totalPedidos" => $totalPedidos,
            "unidadesDespachadas" => $unidadesDespachadas,
            "unidadesPedidas" => $unidadesPedidas,
            "unidadesOnTime" => $unidadesOnTime,
            "unidadesCreditadas" => (float)$unidadesCreditadas,
            "unidadesEfectivas" => (float)$unidadesEfectivas,
            "periodo" => "$fechaDesde a $fechaHasta"
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
