<?php
// src/Api/PedidosChile/ApiGetPedidoChile.php
// Retorna un pedido Chile completo (encabezado + detalle) por Id
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    http_response_code(405);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$idPedido = filter_var($data["idPedido"] ?? null, FILTER_VALIDATE_INT);
if (!$idPedido) {
    echo json_encode(["success" => false, "message" => "ID de pedido inválido"]);
    exit;
}

// ── Encabezado ─────────────────────────────────────────────────────────────
// NOTA: Se usa bind_result() + fetch() — NO get_result() (no disponible en prod)
$stmtEnc = $enlace->prepare(
    "SELECT e.Id_EncabPedidoChile,
            e.Id_ClienteChile,
            c.Nombre       AS NombreCliente,
            c.Direccion,
            c.Ciudad,
            c.Pais,
            e.NumeroOrden,
            e.FechaRecepcionOrden,
            e.FechaSolicitudEntrega,
            e.FechaFinalEntrega,
            e.CantidadEstibas,
            e.GuiaAerea,
            e.IdAgencia,
            ag.NOMAGENCIA  AS NombreAgencia,
            e.IdAerolinea,
            ae.NOMAEROLINEA AS NombreAerolinea,
            e.DescuentoComercial,
            e.Observaciones,
            e.FacturaNo,
            e.Estado
     FROM EncabPedidoChile e
     JOIN ClientesChile c   ON e.Id_ClienteChile = c.Id_ClienteChile
     LEFT JOIN Agencias ag  ON e.IdAgencia       = ag.IdAgencia
     LEFT JOIN Aerolineas ae ON e.IdAerolinea    = ae.IdAerolinea
     WHERE e.Id_EncabPedidoChile = ?"
);
$stmtEnc->bind_param("i", $idPedido);
$stmtEnc->execute();
$stmtEnc->bind_result(
    $idEnc,
    $idCli,
    $nomCli,
    $dir,
    $ciudad,
    $pais,
    $numOrden,
    $fechaRec,
    $fechaSol,
    $fechaFin,
    $cantEst,
    $guia,
    $idAg,
    $nomAg,
    $idAe,
    $nomAe,
    $descuento,
    $obs,
    $factNo,
    $estado
);

$encabezado = null;
if ($stmtEnc->fetch()) {
    $encabezado = [
        'idPedido'            => $idEnc,
        'clienteId'           => $idCli,
        'nombreCliente'       => $nomCli,
        'direccion'           => $dir,
        'ciudad'              => $ciudad,
        'pais'                => $pais,
        'numeroOrden'         => $numOrden,
        'fechaRecepcionOrden' => $fechaRec,
        'fechaSolicitudEntrega' => $fechaSol,
        'fechaFinalEntrega'   => $fechaFin,
        'cantidadEstibas'     => $cantEst,
        'guiaAerea'           => $guia,
        'idAgencia'           => $idAg,
        'nombreAgencia'       => $nomAg,
        'idAerolinea'         => $idAe,
        'nombreAerolinea'     => $nomAe,
        'descuentoComercial'  => $descuento,
        'observaciones'       => $obs,
        'facturaNo'           => $factNo,
        'estado'              => $estado,
    ];
}
$stmtEnc->close();

if (!$encabezado) {
    echo json_encode(["success" => false, "message" => "Pedido no encontrado"]);
    exit;
}

// ── Detalle ────────────────────────────────────────────────────────────────
$stmtDet = $enlace->prepare(
    "SELECT d.Id_DetPedidoChile,
            d.Id_ProductoChile,
            d.Descripcion,
            d.CodigoCliente,
            d.CodigoSiesa,
            d.Lote,
            d.FechaElaboracion,
            d.FechaVencimiento,
            d.PesoNetoGr,
            d.CantidadCajas,
            d.EnvaseInternoxCaja,
            d.PesoEscurridoKg,
            d.FactorPesoBruto,
            d.ValorXKilo
     FROM DetPedidoChile d
     WHERE d.Id_EncabPedidoChile = ?
     ORDER BY d.Id_DetPedidoChile"
);
$stmtDet->bind_param("i", $idPedido);
$stmtDet->execute();
$stmtDet->bind_result(
    $idDet,
    $idProd,
    $desc,
    $codCli,
    $codSiesa,
    $lote,
    $fechaElab,
    $fechaVenc,
    $pesoNetoGr,
    $cantCajas,
    $envase,
    $pesoEsc,
    $factor,
    $valorKilo
);

$detalle = [];
while ($stmtDet->fetch()) {
    $detalle[] = [
        'idDet'             => $idDet,
        'productoId'        => $idProd,
        'descripcion'       => $desc,
        'codigoCliente'     => $codCli,
        'codigoSiesa'       => $codSiesa,
        'lote'              => $lote,
        'fechaElaboracion'  => $fechaElab,
        'fechaVencimiento'  => $fechaVenc,
        'pesoNetoGr'        => (float)$pesoNetoGr,
        'cantidadCajas'     => (float)$cantCajas,
        'envaseInternoxCaja' => (int)$envase,
        'pesoEscurridoKg'   => (float)$pesoEsc,
        'factorPesoBruto'   => (float)$factor,
        'valorxKilo'        => (float)$valorKilo,
    ];
}
$stmtDet->close();

echo json_encode([
    'success'    => true,
    'encabezado' => $encabezado,
    'detalle'    => $detalle,
]);

$enlace->close();
