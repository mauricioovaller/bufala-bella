<?php
// src/Api/PlanVallejo/ApiGetFacturasConDetalle.php

ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 600);
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en pantalla, pero los logs los capturan

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

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

function limpiar_texto($txt)
{
    return trim($txt);
}
function validar_fecha($fecha)
{
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) return $fecha;
    return null;
}

$fechaDesde = validar_fecha($data['fechaDesde'] ?? '');
$fechaHasta = validar_fecha($data['fechaHasta'] ?? '');
$numeroFactura = isset($data['numeroFactura']) ? intval($data['numeroFactura']) : null;

if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "message" => "Las fechas desde y hasta son obligatorias"]);
    exit;
}

try {
    // --- Paso 1: Obtener encabezados en un array PHP ---
    $sqlEnc = "SELECT 
        ei.Id_EncabInvoice,
        ei.Fecha,
        ei.Id_Consignatario,
        c.Nombre AS Consignatario,
        ei.Observaciones,
        ei.TipoPedido
    FROM EncabInvoice ei
    LEFT JOIN Consignatarios c ON ei.Id_Consignatario = c.Id_Consignatario
    WHERE ei.Fecha BETWEEN ? AND ?";

    $params = [$fechaDesde, $fechaHasta];
    $types = "ss";

    if ($numeroFactura) {
        $sqlEnc .= " AND ei.Id_EncabInvoice = ?";
        $params[] = $numeroFactura;
        $types .= "i";
    }
    $sqlEnc .= " ORDER BY ei.Fecha DESC, ei.Id_EncabInvoice DESC";

    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param($types, ...$params);
    $stmtEnc->execute();
    $stmtEnc->bind_result($idFactura, $fecha, $idConsignatario, $nombreConsignatario, $observaciones, $tipoPedido);

    $encabezados = [];
    while ($stmtEnc->fetch()) {
        $encabezados[] = [
            'idFactura' => $idFactura,
            'fecha' => $fecha,
            'idConsignatario' => $idConsignatario,
            'consignatario' => $nombreConsignatario,
            'observaciones' => $observaciones,
            'tipoPedido' => $tipoPedido,
        ];
    }
    $stmtEnc->free_result();
    $stmtEnc->close();

    // --- Paso 2: Para cada encabezado, obtener detalles ---
    $facturas = [];
    foreach ($encabezados as $enc) {
        $sqlDet = "SELECT 
            di.Id_DetInvoice,
            di.Codigo_Siesa,
            di.Codigo_FDA,
            p.CodigoCIP,
            di.DescripFactura,
            di.Kilogramos,
            di.CantidadEmbalaje,
            di.Cajas,
            di.ValKilogramo,
            p.PlanVallejo,
            di.Dex,
            di.Dia,
            di.Mes,
            di.Anio,
            di.Pais,
            di.AD,
            di.CIP,
            di.Unidad,
            di.FOB,
            di.VAN,
            di.Porcentaje,
            di.Reposicion
        FROM DetInvoice di
        INNER JOIN Productos p ON di.Codigo_Siesa = p.Codigo_Siesa
        WHERE di.Id_EncabInvoice = ? AND p.PlanVallejo = -1
        ORDER BY di.Item";

        $stmtDet = $enlace->prepare($sqlDet);
        $stmtDet->bind_param("i", $enc['idFactura']);
        $stmtDet->execute();
        $stmtDet->bind_result(
            $idDetInvoice,
            $codigoSiesa,
            $codigoFDA,
            $codigoCIP,
            $descripFactura,
            $kilogramos,
            $cantidadEmbalaje,
            $cajas,
            $valKilogramo,
            $planVallejo,
            $dex,
            $dia,
            $mes,
            $anio,
            $pais,
            $ad,
            $cip,
            $unidad,
            $fob,
            $van,
            $porcentaje,
            $reposicion
        );

        $fechaEnc = new DateTime($enc['fecha']);
        $diaEnc = (int)$fechaEnc->format('d');
        $mesEnc = (int)$fechaEnc->format('m');
        $anioEnc = (int)$fechaEnc->format('Y');
        $items = [];
        while ($stmtDet->fetch()) {
            $items[] = [
                'idDetInvoice' => $idDetInvoice,
                'codigoSiesa' => $codigoSiesa,
                'codigoFDA' => $codigoFDA,
                'codigoCIP' => $codigoCIP,
                'descripFactura' => $descripFactura,
                'kilogramos' => $kilogramos,
                'cantidadEmbalaje' => $cantidadEmbalaje,
                'cajas' => $cajas,
                'valKilogramo' => $valKilogramo,
                'planVallejo' => $planVallejo,
                'dex' => $dex,
                'dia' => $dia ?? $diaEnc,
                'mes' => $mes ?? $mesEnc,
                'anio' => $anio ?? $anioEnc,
                'pais' => $pais,
                'ad' => $ad,
                'cip' => $cip,
                'unidad' => !empty($unidad) ? $unidad : 'Kilogramo',
                'fob' => $fob,
                'van' => $van,
                'porcentaje' => $porcentaje,
                'reposicion' => $reposicion,
            ];
        }
        $stmtDet->free_result();
        $stmtDet->close();

        $facturas[] = [
            'idFactura' => $enc['idFactura'],
            'numeroFactura' => ($enc['tipoPedido'] === 'sample' ? 'SMP-FEX-' : 'FEX-') . $enc['idFactura'],
            'fecha' => $enc['fecha'],
            'idConsignatario' => $enc['idConsignatario'],
            'consignatario' => $enc['consignatario'],
            'observaciones' => $enc['observaciones'],
            'tipoPedido' => $enc['tipoPedido'],
            'items' => $items,
        ];
    }

    echo json_encode([
        "success" => true,
        "facturas" => $facturas,
        "total" => count($facturas),
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
