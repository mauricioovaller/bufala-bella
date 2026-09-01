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

if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no válido."]));
}

$id_factura = intval($input['id_factura']);

function u8($str) {
    return $str === null ? '' : iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str);
}

$sqlEncabezado = "SELECT
    enc.Id_EncabInvoice AS id_factura,
    CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
    DATE_FORMAT(enc.Fecha, '%d/%m/%Y') AS fecha_factura,
    DATE_FORMAT(enc.FechaVencimiento, '%d/%m/%Y') AS fecha_vencimiento,
    cli.Nombre AS Cliente,
    cli.Rut,
    cli.Direccion,
    cli.Telefono,
    'Pago 35 días' AS Payment_Term,
    enc.GuiaMaster,
    enc.GuiaHija,
    aer.NOMAEROLINEA AS Aerolinea,
    age.NOMAGENCIA AS Agencia,
    'FCA AEROPUERTO' AS Termino_Negociacion,
    enc.CantidadEstibas,
    enc.NumeroOrden,
    ROUND(SUM(det.Kilogramos), 2) AS tot_kgm_netos,
    ROUND(SUM(det.Kilogramos) * 2.33, 2) AS tot_kgm_brutos,
    ROUND(SUM(det.Kilogramos * det.ValKilogramo), 2) AS total_valor
FROM EncabInvoiceChile enc
INNER JOIN DetInvoiceChile det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
INNER JOIN Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
INNER JOIN Agencias age ON enc.IdAgencia = age.IdAgencia
WHERE enc.Id_EncabInvoice = ?
GROUP BY enc.Id_EncabInvoice";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $id_factura);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $id_factura,
    $numero_factura,
    $fecha_factura,
    $fecha_vencimiento,
    $cliente,
    $rut,
    $direccion,
    $telefono,
    $payment_term,
    $guia_master,
    $guia_hija,
    $aerolinea,
    $agencia,
    $termino_negociacion,
    $cantidad_estibas,
    $numero_orden,
    $tot_kgm_netos,
    $tot_kgm_brutos,
    $total_valor
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Factura Chile no encontrada."]));
}
$stmtEncabezado->close();

// Cliente Cencosud: no aplica ajuste de flete internacional (usa Valor_Kilo y Valor_Total)
$esCencosud = stripos(trim((string)$cliente), 'cencosud') !== false;

$sqlDetalle = "SELECT
    det.Item,
    det.Codigo_Siesa,
    det.Codigo_FDA,
    det.Kilogramos,
    emb.Cantidad AS Embalaje,
    det.CantidadEmbalaje AS Unidades,
    det.CantidadEmbalaje * p.PesoNetoUndGr AS PesoNetoAprox,
    det.Cajas,
    p.DescripProducto AS Producto,    
    det.DescripFactura AS Referencia,
    det.ValKilogramo  AS Valor_Kilo,
    (det.ValKilogramo - 4.3105) AS Valor_KiloAjustado,
    ROUND(det.Kilogramos * det.ValKilogramo, 2) AS Valor_Total,
    ROUND(det.Kilogramos * (det.ValKilogramo - 4.3105), 2) AS Valor_TotalAjustado,
    COALESCE((SELECT PlanVallejo FROM ProductosChile WHERE Codigo_Siesa = det.Codigo_Siesa LIMIT 1), 0) AS PlanVallejo
FROM DetInvoiceChile det
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN ProductosChile p ON det.Codigo_Siesa = p.Codigo_Siesa
WHERE det.Id_EncabInvoice = ?
ORDER BY det.Item";

$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $id_factura);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $item,
    $codigo_siesa,
    $codigo_fda,
    $kilogramos,
    $embalaje,
    $unidades,
    $peso_neto_aprox,
    $cajas,
    $producto,
    $referencia,
    $valor_kilo,
    $valor_kilo_ajustado,
    $valor_total,
    $valor_total_ajustado,
    $plan_vallejo
);

$detalles = [];
$total_general = 0;
$total_general_ajustado = 0;
$total_peso_neto_aprox = 0;
while ($stmtDetalle->fetch()) {
    $detalles[] = [
        'item' => $item,
        'codigo_siesa' => $codigo_siesa,
        'codigo_fda' => $codigo_fda,
        'kilogramos' => $kilogramos,
        'embalaje' => $embalaje,
        'unidades' => $unidades,
        'peso_neto_aprox' => $peso_neto_aprox,
        'cajas' => $cajas,
        'producto' => $producto,
        'referencia' => $referencia,
        'valor_kilo' => $valor_kilo,
        'valor_kilo_ajustado' => $valor_kilo_ajustado,
        'valor_total' => $valor_total,
        'valor_total_ajustado' => $valor_total_ajustado,
        'plan_vallejo' => $plan_vallejo,
    ];
    $total_general += $valor_total;
    $total_general_ajustado += $valor_total_ajustado;
    $total_peso_neto_aprox += $peso_neto_aprox;
}
$stmtDetalle->close();

function numeroALetras($numero)
{
    $unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    $decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    $especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    $centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    $partes = explode('.', number_format($numero, 2, '.', ''));
    $entero = intval($partes[0]);
    $decimal = intval($partes[1]);

    if ($entero == 0) {
        $texto = 'CERO';
    } else {
        $texto = '';

        if ($entero >= 1000000) {
            $millones = floor($entero / 1000000);
            $texto .= convertirGrupo($millones) . ' MILLÓN' . ($millones > 1 ? 'ES ' : ' ');
            $entero %= 1000000;
        }

        if ($entero >= 1000) {
            $miles = floor($entero / 1000);
            if ($miles == 1) {
                $texto .= 'MIL ';
            } else {
                $texto .= convertirGrupo($miles) . ' MIL ';
            }
            $entero %= 1000;
        }

        $texto .= convertirGrupo($entero);
    }

    $texto .= ' DÓLARES';

    if ($decimal > 0) {
        $texto .= ' CON ' . $decimal . '/100';
    }

    return $texto;
}

function convertirGrupo($numero)
{
    $unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    $decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    $especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    $centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    $texto = '';

    $centena = floor($numero / 100);
    if ($centena > 0) {
        if ($centena == 1 && $numero % 100 == 0) {
            $texto .= 'CIEN';
        } else {
            $texto .= $centenas[$centena] . ' ';
        }
        $numero %= 100;
    }

    if ($numero >= 10 && $numero <= 19) {
        $texto .= $especiales[$numero - 10] . ' ';
    } else {
        $decena = floor($numero / 10);
        $unidad = $numero % 10;

        if ($decena > 0) {
            $texto .= $decenas[$decena];
            if ($unidad > 0) {
                $texto .= ' Y ';
            }
        }

        if ($unidad > 0) {
            $texto .= $unidades[$unidad];
        }
    }

    return trim($texto);
}

$valor_en_letras = numeroALetras($total_valor);

class PDF_Chile extends FPDF
{
    function Header()
    {
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg", 15, 10, 40);

        $this->SetFont('Helvetica', 'B', 10);
        $this->SetXY(90, 10);
        $this->Cell(60, 4, u8('BUFALABELLA S.A.S'), 0, 1, 'C');
        $this->SetFont('Helvetica', '', 9);
        $this->SetX(90);
        $this->Cell(60, 4, u8('Nit. 900.254.183-4'), 0, 1, 'C');
        $this->SetX(90);
        $this->Cell(60, 4, u8('Resolución No. 18764102570782 Vigente de Dic-04-2025 Hasta Jun-04-2027'), 0, 1, 'C');
        $this->SetX(90);
        $this->Cell(60, 4, u8('Numeración Autorizada FEX-2337 al FEX-5000'), 0, 1, 'C');
        $this->SetX(90);        

        $this->Ln(4);
    }

    function Footer()
    {
        $this->SetY(-45);

        $this->SetFont('Helvetica', 'B', 7);
        $this->Cell(22, 4, u8('Elaborado por:'), 0, 0, 'R');
        $this->Cell(34, 4, u8('John Jairo Vera Riaño'), 0, 1, 'L');
        $this->Cell(22, 4, '', 0, 0, 'R');
        $this->Cell(34, 4, u8('Coordinador de Exportaciones'), 0, 1, 'L');

        $this->Ln(12);

        $this->SetFont('Helvetica', 'B', 6);
        $this->Cell(80, 4, u8('Address. Autopista Medellín Km 18 El Rosal, Cundinamarca-Colombia:'), 0, 0, 'C');
        $this->Cell(53, 4, u8('E-Mail. exportaciones@bufalabella.com '), 0, 0, 'C');
        $this->Cell(65, 4, u8(' Phone. (60) 1 917 2185 '), 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 6);
        $this->Cell(80, 4, u8('Calle 93 Bis No. 19-50 Of. 305 Bogotá, Colombia'), 0, 0, 'C');
        $this->Cell(53, 4, '', 0, 0, 'C');
        $this->Cell(65, 4, u8('Movil. (57) 321 242 45 52'), 0, 1, 'C');
    }

    function RoundedRect($x, $y, $w, $h, $r)
    {
        $this->SetDrawColor(0);
        $this->SetLineWidth(0.3);
        $n = 6;
        $paso = 90 / $n;

        $this->Line($x + $r, $y, $x + $w - $r, $y);
        $this->Line($x + $w, $y + $r, $x + $w, $y + $h - $r);
        $this->Line($x + $r, $y + $h, $x + $w - $r, $y + $h);
        $this->Line($x, $y + $r, $x, $y + $h - $r);

        $cx = $x + $r; $cy = $y + $r;
        for ($i = 0; $i < $n; $i++) {
            $a1 = deg2rad(180 + $i * $paso);
            $a2 = deg2rad(180 + ($i + 1) * $paso);
            $this->Line($cx + $r * cos($a1), $cy + $r * sin($a1), $cx + $r * cos($a2), $cy + $r * sin($a2));
        }

        $cx = $x + $w - $r; $cy = $y + $r;
        for ($i = 0; $i < $n; $i++) {
            $a1 = deg2rad(270 + $i * $paso);
            $a2 = deg2rad(270 + ($i + 1) * $paso);
            $this->Line($cx + $r * cos($a1), $cy + $r * sin($a1), $cx + $r * cos($a2), $cy + $r * sin($a2));
        }

        $cx = $x + $w - $r; $cy = $y + $h - $r;
        for ($i = 0; $i < $n; $i++) {
            $a1 = deg2rad(0 + $i * $paso);
            $a2 = deg2rad(0 + ($i + 1) * $paso);
            $this->Line($cx + $r * cos($a1), $cy + $r * sin($a1), $cx + $r * cos($a2), $cy + $r * sin($a2));
        }

        $cx = $x + $r; $cy = $y + $h - $r;
        for ($i = 0; $i < $n; $i++) {
            $a1 = deg2rad(90 + $i * $paso);
            $a2 = deg2rad(90 + ($i + 1) * $paso);
            $this->Line($cx + $r * cos($a1), $cy + $r * sin($a1), $cx + $r * cos($a2), $cy + $r * sin($a2));
        }
    }
}

$pdf = new PDF_Chile('P', 'mm', 'Letter');
$pdf->SetMargins(10, 10, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// NUMERO DE FACTURA
$cx = $pdf->GetX();
$cy = $pdf->GetY();

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(155, 4);
$pdf->Cell(30, 8, 'FACTURA DE VENTA', 0, 1, 'C');
$pdf->Cell(155, 4);
$pdf->Cell(30, 4, $numero_factura, 0, 1, 'C');

$cy_end = $pdf->GetY();
// Recuadro redondeado solo para Factura Proforma
$pdf->RoundedRect(($cx + 150) - 2, $cy  - 2, 45, $cy_end - $cy + 4, 3);

$pdf->Ln(5);

// INFORMACION DEL CLIENTE
$cx = $pdf->GetX();
$cy = $pdf->GetY();

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 4, 'Cliente', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(100, 4, u8($cliente), 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(50, 5, u8('Fecha Emisión'), 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(28, 4, $fecha_factura, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 4, 'Rut', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(100, 4, u8($rut ?: 'Pendiente'), 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(50, 5, u8('Fecha Vencimiento'), 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(28, 4, $fecha_vencimiento, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 4, u8('Dirección'), 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(100, 4, u8($direccion), 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(50, 5, u8('Términos de Pago'), 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(28, 4, u8($payment_term), 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(20, 4, u8('Teléfono'), 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(100, 4, u8($telefono), 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(50, 5, u8('Número de Orden'), 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(28, 4, u8($numero_orden), 0, 1, 'L');

// Recuadro redondeado solo para Cliente, Rut, Direccion, Telefono (lado izquierdo)
$cy_end = $pdf->GetY();
$pdf->RoundedRect($cx - 2, $cy - 2, 124, $cy_end - $cy + 4, 3);

// Recuadro redondeado solo para Fecha Emision, Fecha Vencimiento, Términos de Pago, Número de Orden (lado derecho)
$pdf->RoundedRect(($cx + 138) - 2, $cy  - 2, 62, $cy_end - $cy + 4, 3);

$pdf->Ln(4);

// TABLA DE DETALLE
$pdf->SetFont('Helvetica', 'B', 7);
$pdf->Cell(198, 0.5, '', 'TB', 1, 'C');
$pdf->Cell(8, 5, 'Item', 0, 0, 'C');
$pdf->Cell(14, 5, u8('Código'), 0, 0, 'C');
$pdf->Cell(11, 5, 'KI/Gr', 0, 0, 'C');
$pdf->Cell(8, 5, 'Emb', 0, 0, 'C');
$pdf->Cell(12, 5, 'Unid', 0, 0, 'C');
$pdf->Cell(11, 5, 'Caja', 0, 0, 'C');
$pdf->Cell(55, 5, u8('Referencia'), 0, 0, 'C');
$pdf->Cell(45, 5, u8('Producto'), 0, 0, 'C');
$pdf->Cell(14, 5, u8('Valor Kilo'), 0, 0, 'C');
$pdf->Cell(20, 5, u8('Valor Total'), 0, 1, 'C');
$pdf->Cell(198, 0.5, '', 'TB', 1, 'C');

$totUnidades = 0;
$totCajas = 0;
$commercialDiscounts = 0;

foreach ($detalles as $detalle) {
    if ($detalle['plan_vallejo'] <> 0) {
        $pdf->SetFont('Helvetica', 'B', 7);
    } else {
        $pdf->SetFont('Helvetica', '', 7);
    }

    $x_inicial = $pdf->GetX();
    $y_inicial = $pdf->GetY();

    $pdf->Cell(8, 4, $detalle['item'], 0, 0, 'C');
    $pdf->Cell(14, 4, $detalle['codigo_siesa'], 0, 0, 'C');
    $pdf->Cell(11, 4, number_format($detalle['kilogramos'], 2), 0, 0, 'R');
    $pdf->Cell(8, 4, number_format($detalle['embalaje'], 0), 0, 0, 'C');
    $pdf->Cell(12, 4, number_format($detalle['unidades'], 0), 0, 0, 'R');
    $pdf->Cell(11, 4, number_format($detalle['cajas'], 0), 0, 0, 'R');

    // Posición después de las 6 primeras columnas (64mm = 8+14+11+8+12+11)
    $x_col6 = $pdf->GetX();
    $y_col6 = $pdf->GetY();

    // Referencia (55mm)
    $pdf->MultiCell(55, 4, u8($detalle['referencia']), 0, 'L');
    $y_ref_end = $pdf->GetY();
    $alto_ref = $y_ref_end - $y_col6;

    // Producto (45mm) - posición X correcta después de Referencia
    $x_producto = $x_col6 + 55;
    $pdf->SetXY($x_producto, $y_col6);
    $pdf->MultiCell(45, 4, u8($detalle['producto']), 0, 'L');
    $y_prod_end = $pdf->GetY();
    $alto_prod = $y_prod_end - $y_col6;

    // La altura de la fila es la mayor entre las dos MultiCell
    $altura_fila = max($alto_ref, $alto_prod, 4);

    // Valor Kilo y Valor Total alineados a la derecha de Producto
    $pdf->SetXY($x_producto + 45, $y_col6);
    $valorKiloMostrar = $esCencosud ? $detalle['valor_kilo'] : $detalle['valor_kilo_ajustado'];
    $valorTotalMostrar = $esCencosud ? $detalle['valor_total'] : $detalle['valor_total_ajustado'];
    $pdf->Cell(14, $altura_fila, '$' . number_format($valorKiloMostrar, 3), 0, 0, 'R');
    $pdf->Cell(20, $altura_fila, '$' . number_format($valorTotalMostrar, 2), 0, 1, 'R');

    // Avanzar Y por la altura real de la fila
    $pdf->SetY($y_col6 + $altura_fila);

    $totUnidades += $detalle['unidades'];
    $totCajas += $detalle['cajas'];
}

// TOTAL
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(22, 6, 'Total   ', 0, 0, 'R');
$pdf->Cell(11, 6, number_format($tot_kgm_netos, 2), 0, 0, 'R');
$pdf->Cell(8, 6, '', 0, 0, 'R');
$pdf->Cell(12, 6, number_format($totUnidades, 0), 0, 0, 'R');
$pdf->Cell(11, 6, number_format($totCajas, 0), 0, 0, 'R');
$pdf->Cell(114, 6, '', 0, 1, 'R');
//$pdf->Cell(20, 6, '$' . number_format($total_general_ajustado, 2), 0, 1, 'R');
$pdf->Cell(198, 0.5, '', 'TB', 1, 'C');

$pdf->Cell(198, 4, '', 'B', 1, 'R');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, number_format($tot_kgm_netos), 0, 0, 'R');
$pdf->Cell(25, 5, 'Peso Escurrido (Kg)', 0, 0, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(96, 5, '', 0, 0, 'L');
$pdf->Cell(15, 5, 'SubTotal', 0, 0, 'R');
$pdf->Cell(20, 5, '$' . number_format($esCencosud ? $total_general : $total_general_ajustado, 2), 0, 1, 'R');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, number_format($total_peso_neto_aprox/1000, 2), 0, 0, 'R');
$pdf->Cell(25, 5, 'Peso Neto Aproximado (Kg)', 0, 0, 'L');
$pdf->Cell(96, 5, '', 0, 0, 'L');
if ($esCencosud) {
    // Para Cencosud no se muestra la línea de Flete Internacional
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(35, 5, '', 0, 1, 'R');
} else {
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(15, 5, 'Flete Internacional', 0, 0, 'R');
    $pdf->Cell(20, 5, '$' . number_format($total_general - $total_general_ajustado, 2), 0, 1, 'R');
}

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, number_format($tot_kgm_brutos, 2), 0, 0, 'R');
$pdf->Cell(25, 5, 'Peso Bruto Aproximado (Kg)', 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, '2 a 6 ', 0, 0, 'R');
$pdf->Cell(25, 5, 'Temperatura (C)', 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, 'Partida Arancelaria', 0, 0, 'L');
$pdf->Cell(25, 5, '', 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, '0406100000 ', 0, 0, 'R');
$pdf->Cell(25, 5, 'Queso Fresco - Mozzarella', 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(12, 5, '', 0, 0, 'R');
$pdf->Cell(30, 5, 'Agencia de Carga', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(25, 5, u8($agencia), 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, 'Aerolinea', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(25, 5, u8($aerolinea), 0, 0, 'L');
$pdf->Cell(35, 5, '', 0, 0, 'R');
$pdf->Cell(15, 5, 'Total Piezas', 0, 1, 'C');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, 'Guia Master', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(25, 5, u8($guia_master), 0, 0, 'L');
$pdf->Cell(35, 5, '', 0, 0, 'R');
$pdf->Cell(15, 5, $cantidad_estibas, 0, 1, 'C');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 5, '', 0, 0, 'R');
$pdf->Cell(20, 5, 'Incoterm', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(25, 5, 'Costo y Flete CPT', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(96, 5, '', 0, 0, 'L');
$pdf->Cell(15, 5, u8('Us $ Total Costo y Flete'), 0, 0, 'R');
$pdf->Cell(20, 5, '$' . number_format($total_general , 2), 0, 1, 'R');

$pdf->Cell(198, 2, '', 'B', 1, 'R');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, u8('Son : '), 0, 0, 'R');
$pdf->Cell(32, 4, u8($valor_en_letras), 0, 1, 'L');

$pdfContent = $pdf->Output('S');
echo json_encode([
    "success" => true,
    "pdf" => base64_encode($pdfContent),
    "filename" => "Factura_Chile_{$id_factura}.pdf"
]);
?>
