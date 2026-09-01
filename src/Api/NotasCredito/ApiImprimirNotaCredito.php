<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['idNotaCredito']) || empty($input['idNotaCredito'])) {
    die(json_encode(["error" => "ID de nota crédito no válido."]));
}

$idNotaCredito = intval($input['idNotaCredito']);

// Consultar encabezado
$sqlEnc = "SELECT 
            enc.Numero,
            enc.Fecha,
            enc.Motivo,
            enc.ValorTotalCOP,
            enc.ValorTotalUSD,
            enc.Estado,
            cli.Nombre AS NombreCliente
          FROM EncabNotaCredito enc
          INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
          WHERE enc.Id_EncabNotaCredito = ?";

$stmtEnc = $enlace->prepare($sqlEnc);
$stmtEnc->bind_param("i", $idNotaCredito);
$stmtEnc->execute();
$stmtEnc->bind_result($numero, $fecha, $motivo, $valorTotalCOP, $valorTotalUSD, $estado, $nombreCliente);

if (!$stmtEnc->fetch()) {
    die(json_encode(["error" => "Nota crédito no encontrada."]));
}
$stmtEnc->close();

// Consultar detalle
$sqlDet = "SELECT 
            dnc.Id_EncabPedido,
            dnc.CantidadOriginal,
            dnc.CantidadCredito,
            dnc.PesoNetoCredito,
            dnc.PrecioUnitario,
            dnc.ValorCreditoCOP,
            dnc.Item,
            prd.DescripProducto,
            emb.Descripcion AS NombreEmbalaje,
            enc.PurchaseOrder,
            clr.Region
          FROM DetNotaCredito dnc
          LEFT JOIN Productos prd ON dnc.Id_Producto = prd.Id_Producto
          LEFT JOIN Embalajes emb ON dnc.Id_Embalaje = emb.Id_Embalaje
          LEFT JOIN EncabPedido enc ON dnc.Id_EncabPedido = enc.Id_EncabPedido
          LEFT JOIN ClientesRegion clr ON enc.Id_ClienteRegion = clr.Id_ClienteRegion
          WHERE dnc.Id_EncabNotaCredito = ?
          ORDER BY dnc.Item";

$stmtDet = $enlace->prepare($sqlDet);
$stmtDet->bind_param("i", $idNotaCredito);
$stmtDet->execute();
$stmtDet->bind_result($idEncabPedido, $cantidadOriginal, $cantidadCredito, $pesoNetoCredito, $precioUnitario, $valorCreditoCOP, $item, $descripProducto, $nombreEmbalaje, $purchaseOrder, $region);

$detalles = [];
$totalCajas = 0;
$totalValor = 0;
while ($stmtDet->fetch()) {
    $detalles[] = [
        'pedido' => 'PED-' . str_pad($idEncabPedido, 6, '0', STR_PAD_LEFT),
        'producto' => $descripProducto,
        'embalaje' => $nombreEmbalaje ?? '',
        'cajasOriginal' => number_format($cantidadOriginal, 0),
        'cajasCredito' => number_format($cantidadCredito, 0),
        'precio' => number_format($precioUnitario, 2),
        'valor' => number_format($valorCreditoCOP, 2),
        'purchaseOrder' => $purchaseOrder ?? '',
        'region' => $region ?? ''
    ];
    $totalCajas += $cantidadCredito;
    $totalValor += $valorCreditoCOP;
}
$stmtDet->close();

// ======================
// GENERAR PDF
// ======================
class PDF extends FPDF {
    function Header() {
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/Logo_08.jpg", 10, 8, 20);
        $this->SetFont('Arial', 'B', 14);
        $this->Cell(188, 7, 'NOTA CREDITO', 'LTR', 1, 'C');
        $this->SetFont('Arial', '', 9);
        $this->Cell(188, 5, 'SISTEMA DE GESTION', 'LBR', 1, 'C');
        $this->Ln(4);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, utf8_decode('Página ') . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('P', 'mm', array(216, 280));
$pdf->AliasNbPages();
$pdf->AddPage();

// INFORMACION GENERAL
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(188, 6, 'INFORMACION GENERAL', 1, 1, 'C');

$pdf->SetFont('Arial', '', 9);
$pdf->Cell(47, 6, 'No. Nota Credito:', 1);
$pdf->Cell(47, 6, $numero, 1);
$pdf->Cell(47, 6, 'Fecha:', 1);
$pdf->Cell(47, 6, $fecha, 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Cliente:', 1);
$pdf->Cell(141, 6, utf8_decode($nombreCliente), 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Estado:', 1);
$pdf->Cell(141, 6, $estado, 1);
$pdf->Ln();

if (!empty($motivo)) {
    $pdf->Cell(47, 6, 'Motivo:', 1);
    $pdf->SetFont('Arial', '', 8);
    $pdf->Cell(141, 6, utf8_decode(substr($motivo, 0, 80)), 1);
    $pdf->Ln(10);
} else {
    $pdf->Ln(8);
}

// DETALLE
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(188, 6, 'DETALLE', 1, 1, 'C');

$pdf->SetFont('Arial', 'B', 7);
$pdf->Cell(12, 6, 'Item', 1);
$pdf->Cell(22, 6, utf8_decode('Pedido'), 1);
$pdf->Cell(24, 6, 'P.O.', 1);
$pdf->Cell(16, 6, utf8_decode('Región'), 1);
$pdf->Cell(40, 6, 'Producto', 1);
$pdf->Cell(14, 6, 'Emb.', 1);
$pdf->Cell(14, 6, 'Cjas Orig.', 1, 0, 'C');
$pdf->Cell(14, 6, 'Cjas Cred.', 1, 0, 'C');
$pdf->Cell(18, 6, 'Precio', 1, 0, 'R');
$pdf->Cell(16, 6, 'Valor', 1, 0, 'R');
$pdf->Ln();

$pdf->SetFont('Arial', '', 7);
foreach ($detalles as $det) {
    $pdf->Cell(12, 5, '', 1);
    $pdf->Cell(22, 5, $det['pedido'], 1);
    $pdf->Cell(24, 5, substr(utf8_decode($det['purchaseOrder']), 0, 15), 1);
    $pdf->Cell(16, 5, substr(utf8_decode($det['region']), 0, 10), 1);
    $pdf->Cell(40, 5, substr(utf8_decode($det['producto']), 0, 22), 1);
    $pdf->Cell(14, 5, utf8_decode($det['embalaje']), 1);
    $pdf->Cell(14, 5, $det['cajasOriginal'], 1, 0, 'C');
    $pdf->Cell(14, 5, $det['cajasCredito'], 1, 0, 'C');
    $pdf->Cell(18, 5, '$' . $det['precio'], 1, 0, 'R');
    $pdf->Cell(16, 5, '$' . $det['valor'], 1, 0, 'R');
    $pdf->Ln();
}

// TOTALES
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(142, 6, 'TOTALES:', 1);
$pdf->Cell(14, 6, number_format($totalCajas, 0), 1, 0, 'C');
$pdf->Cell(34, 6, '$' . number_format($totalValor, 2), 1, 0, 'R');
$pdf->Ln(12);

$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(188, 6, utf8_decode('Nota: Este documento es un soporte interno. No tiene validez fiscal.'), 0, 1, 'C');

$pdf->Output('I', 'nota_credito_' . $numero . '.pdf');
?>
