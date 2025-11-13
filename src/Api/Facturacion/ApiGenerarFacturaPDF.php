<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar si se recibió el ID de factura correctamente
if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no válido."]));
}

$id_factura = intval($input['id_factura']);

// 🔴 CONSULTA 1: ENCABEZADO DE FACTURA
$sqlEncabezado = "SELECT
                    enc.Id_EncabInvoice AS id_factura,
                    CONCAT('FEX-', enc.Id_EncabInvoice) AS numero_factura,
                    DATE_FORMAT(enc.Fecha, '%d/%m/%Y') AS fecha_factura,
                    csg.Nombre AS Consignatario,
                    csg.DUNS,
                    csg.Direccion,
                    csg.Telefono,
                    '30 Days' AS Payment_Term,
                    enc.GuiaMaster,
                    enc.GuiaHija,
                    aer.NOMAEROLINEA AS Aerolinea,
                    age.NOMAGENCIA AS Agencia,
                    'FCA AEROPUERTO' AS Termino_Negociacion,
                    enc.CantidadEstibas,
                    ROUND(SUM(det.Kilogramos), 2) AS tot_kgm_netos,
                    ROUND(SUM(det.Kilogramos) * 2.6, 2) AS tot_kgm_brutos,
                    ROUND(SUM(det.Kilogramos * det.ValKilogramo), 2) AS total_valor
                FROM
                    EncabInvoice enc
                INNER JOIN DetInvoice det ON enc.Id_EncabInvoice = det.Id_EncabInvoice
                INNER JOIN Consignatarios csg ON enc.Id_Consignatario = csg.Id_Consignatario
                INNER JOIN Aerolineas aer ON enc.IdAerolinea = aer.IdAerolinea
                INNER JOIN Agencias age ON enc.IdAgencia = age.IdAgencia
                WHERE
                    enc.Id_EncabInvoice = ?
                GROUP BY 
                    enc.Id_EncabInvoice, enc.Fecha, csg.Nombre, csg.DUNS, csg.Direccion, csg.Telefono,
                    enc.GuiaMaster, enc.GuiaHija, aer.NOMAEROLINEA, age.NOMAGENCIA, enc.CantidadEstibas";

$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $id_factura);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $id_factura,
    $numero_factura,
    $fecha_factura,
    $consignatario,
    $duns,
    $direccion,
    $telefono,
    $payment_term,
    $guia_master,
    $guia_hija,
    $aerolinea,
    $agencia,
    $termino_negociacion,
    $cantidad_estibas,
    $tot_kgm_netos,
    $tot_kgm_brutos,
    $total_valor
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Factura no encontrada."]));
}
$stmtEncabezado->close();

// 🔴 CONSULTA 2: DETALLE DE FACTURA
$sqlDetalle = "SELECT
                det.Item,
                det.Codigo_Siesa,
                det.Codigo_FDA,
                det.Kilogramos,
                emb.Cantidad AS Embalaje,
                det.CantidadEmbalaje AS Unidades,
                det.Cajas,
                det.DescripFactura AS Producto,
                det.ValKilogramo AS Valor_Kilo,
                ROUND(det.Kilogramos * det.ValKilogramo, 2) AS Valor_Total
            FROM
                DetInvoice det
            INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
            WHERE
                det.Id_EncabInvoice = ?
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
    $cajas,
    $producto,
    $valor_kilo,
    $valor_total
);

$detalles = [];
$total_general = 0;
while ($stmtDetalle->fetch()) {
    $detalles[] = [
        'item' => $item,
        'codigo_siesa' => $codigo_siesa,
        'codigo_fda' => $codigo_fda,
        'kilogramos' => $kilogramos,
        'embalaje' => $embalaje,
        'unidades' => $unidades,
        'cajas' => $cajas,
        'producto' => $producto,
        'valor_kilo' => $valor_kilo,
        'valor_total' => $valor_total
    ];
    $total_general += $valor_total;
}
$stmtDetalle->close();

// 🔴 FUNCIÓN: CONVERTIR NÚMERO A LETRAS
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

        // Millones
        if ($entero >= 1000000) {
            $millones = floor($entero / 1000000);
            $texto .= convertirGrupo($millones) . ' MILLÓN' . ($millones > 1 ? 'ES ' : ' ');
            $entero %= 1000000;
        }

        // Miles
        if ($entero >= 1000) {
            $miles = floor($entero / 1000);
            if ($miles == 1) {
                $texto .= 'MIL ';
            } else {
                $texto .= convertirGrupo($miles) . ' MIL ';
            }
            $entero %= 1000;
        }

        // Centenas, decenas y unidades
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

    // Centenas
    $centena = floor($numero / 100);
    if ($centena > 0) {
        if ($centena == 1 && $numero % 100 == 0) {
            $texto .= 'CIEN';
        } else {
            $texto .= $centenas[$centena] . ' ';
        }
        $numero %= 100;
    }

    // Decenas y unidades
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

// ======================
// GENERAR PDF - ESTRUCTURA SIMILAR AL SEGUNDO ARCHIVO
// ======================
class PDF extends FPDF
{
    function Header()
    {
        // Logo Bufalabella - similar estructura al segundo archivo
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg", 15, 15, 40);

        // Información de la empresa - estructura similar
        $this->SetFont('Helvetica', 'B', 10);
        $this->SetXY(90, 15);
        $this->Cell(60, 4, 'BUFALABELLA S.A.S', 0, 1, 'C');
        $this->SetFont('Helvetica', '', 9);
        $this->SetX(90);
        $this->Cell(60, 4, 'Nit. 900.254.183-4', 0, 1, 'C');
        $this->SetX(90);
        $this->Cell(60, 4, 'Resolucion No. 18764072143394  Vigente de Jun-04-2024 Hasta Dic-04-2025', 0, 1, 'C');
        $this->SetX(90);
        $this->Cell(60, 4, 'Numeracion Autorizada FEX-1105 al FEX-5000', 0, 1, 'C');

        $this->Ln(3);
    }

    function Footer()
    {
        $this->SetY(-45);
        

        $this->SetFont('Helvetica', 'B', 7);
        $this->Cell(22, 4, 'Elaborado por:', 0, 0, 'R');
        $this->Cell(34, 4, 'Jhon Vera', 0, 1, 'L');
        $this->Cell(22, 4, '', 0, 0, 'R');
        $this->Cell(34, 4, 'Coordinador de Exportaciones', 0, 1, 'L');

        $this->Ln(12);

        $this->SetFont('Helvetica', 'B', 6);
        $this->Cell(80, 4, utf8_decode('Address. Autopista Medellín Km 18 El Rosal, Cundinamarca-Colombia:'), 0, 0, 'C');
        $this->Cell(53, 4, 'E-Mail. exportaciones@bufalabella.com ', 0, 0, 'C');
        $this->Cell(65, 4, ' Phone. (60) 1 917 2185 ', 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 6);
        $this->Cell(80, 4, utf8_decode('Calle 93 Bis No. 19-50 Of. 305 Bogotá, Colombia'), 0, 0, 'C');
        $this->Cell(53, 4, '', 0, 0, 'C');
        $this->Cell(65, 4, 'Movil. (57) 321 242 45 52', 0, 1, 'C');
    }
}

$pdf = new PDF('P', 'mm', 'Letter');
$pdf->SetMargins(10, 5, 10);
$pdf->AliasNbPages();
$pdf->AddPage();

// NÚMERO DE FACTURA
$pdf->SetFont('Helvetica', 'B', 14);
$pdf->Cell(155, 10);
$pdf->Cell(30, 10, $numero_factura, 1, 1, 'C');
$pdf->Ln(3);

// INFORMACIÓN DEL CONSIGNATARIO - Estructura similar al segundo archivo
$pdf->SetFont('Helvetica', 'B', 9);
$pdf->Cell(20, 5, 'Consigne', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 5, $consignatario, 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(30, 5, 'Date', 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(50, 5, $fecha_factura, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(20, 5, 'DUNS', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 5, $duns, 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(30, 5, 'Payment Term', 0, 0, 'R');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(50, 5, $payment_term, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(20, 5, 'Address', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 5, $direccion, 0, 1, 'L');

$pdf->SetFont('Helvetica', 'B', 10);
$pdf->Cell(20, 5, 'Phone', 0, 0, 'L');
$pdf->SetFont('Helvetica', '', 10);
$pdf->Cell(100, 5, $telefono, 0, 1, 'L');

$pdf->Ln(2);

// TABLA DE DETALLE - Estructura similar
$pdf->SetFont('Helvetica', 'B', 7);
// Encabezado de la tabla
$pdf->Cell(198, 0.5, '', 'TB', 1, 'C');
$pdf->Cell(8, 5, 'Item', 0, 0, 'C');
$pdf->Cell(14, 5, 'Cod Siesa', 0, 0, 'C');
$pdf->Cell(15, 5, 'Codigo FDA', 0, 0, 'C');
$pdf->Cell(11, 5, 'KI/Gr', 0, 0, 'C');
$pdf->Cell(8, 5, 'Emb', 0, 0, 'C');
$pdf->Cell(12, 5, 'Unid', 0, 0, 'C');
$pdf->Cell(12, 5, 'Caja', 0, 0, 'C');
$pdf->Cell(83, 5, 'Producto', 0, 0, 'C');
$pdf->Cell(15, 5, 'Valor Kilo', 0, 0, 'C');
$pdf->Cell(20, 5, 'Valor Total', 0, 1, 'C');
$pdf->Cell(198, 0.5, '', 'TB', 1, 'C');

// Detalle de items
$totUnidades = 0;
$totCajas = 0;
$commercialDiscounts = 0;
$pdf->SetFont('Helvetica', '', 7);
foreach ($detalles as $detalle) {
    $pdf->Cell(8, 5, $detalle['item'], 0, 0, 'C');
    $pdf->Cell(14, 5, $detalle['codigo_siesa'], 0, 0, 'C');
    $pdf->Cell(15, 5, $detalle['codigo_fda'], 0, 0, 'C');
    $pdf->Cell(11, 5, number_format($detalle['kilogramos'], 2), 0, 0, 'R');
    $pdf->Cell(8, 5, number_format($detalle['embalaje'], 0), 0, 0, 'C');
    $pdf->Cell(12, 5, number_format($detalle['unidades'], 0), 0, 0, 'R');
    $pdf->Cell(12, 5, number_format($detalle['cajas'], 0), 0, 0, 'R');
    $pdf->Cell(83, 5, utf8_decode($detalle['producto']), 0, 0, 'L');
    $pdf->Cell(15, 5, '$' . number_format($detalle['valor_kilo'], 2), 0, 0, 'R');
    $pdf->Cell(20, 5, '$' . number_format($detalle['valor_total'], 2), 0, 1, 'R');
    $totUnidades += $detalle['unidades'];
    $totCajas += $detalle['cajas'];
}

// TOTAL
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(56, 6, 'Total', 0, 0, 'R');
$pdf->Cell(12, 6, number_format($totUnidades, 0), 0, 0, 'R');
$pdf->Cell(12, 6, number_format($totCajas, 0), 0, 0, 'R');
$pdf->Cell(98, 6, '', 0, 0, 'R');
$pdf->Cell(20, 6, '$' . number_format($total_general, 2), 0, 1, 'R');
$pdf->Cell(198, 0.5, '', 'TB', 1, 'C');

$pdf->Cell(198, 4, '', 'B', 1, 'R');

$pdf->Cell(22, 6, '', 0, 0, 'R');
$posX = $pdf->GetX(); // Guarda la posición X antes de MultiCell
$posY = $pdf->GetY(); // Guarda la posición Y actual
$pdf->MultiCell(15, 3, 'Codigo FDA', 0,  'C');
$pdf->SetXY($posX + 15, $posY); // Regresa a la posición correcta
$posX = $pdf->GetX(); // Guarda la posición X antes de MultiCell
$posY = $pdf->GetY(); // Guarda la posición Y actual
$pdf->MultiCell(19, 3, 'Posicion Arancelaria', 0, 'C');
$pdf->SetXY($posX + 19, $posY); // Regresa a la posición correcta
$pdf->Cell(107, 6, '', 0, 0, 'L');
$pdf->Cell(15, 6, 'SubTotal', 0, 0, 'R');
$pdf->Cell(20, 6, '$' . number_format($total_general, 2), 0, 1, 'R');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(15, 4, '12AGO19', 0, 0, 'C');
$pdf->Cell(19, 4, '0406100000', 0, 0, 'C');
$pdf->Cell(107, 4, '', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(15, 4, 'Commercial Discounts', 0, 0, 'R');
$pdf->Cell(20, 4, '$' . number_format($commercialDiscounts, 2), 0, 1, 'R');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(15, 4, '12CGO11', 0, 0, 'C');
$pdf->Cell(19, 4, '0406100000', 0, 0, 'C');
$pdf->Cell(107, 4, '', 0, 0, 'L');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(15, 4, 'Us $ Total Amount', 0, 0, 'R');
$pdf->Cell(20, 4, '$' . number_format($total_general + $commercialDiscounts, 2), 0, 1, 'R');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(15, 4, '09CGO15', 0, 0, 'C');
$pdf->Cell(19, 4, '0403200090', 0, 0, 'C');
$pdf->Cell(142, 4, '', 0, 1, 'L');

$pdf->Cell(198, 2, '', 'B', 1, 'R');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Observaciones', 0, 0, 'C');
$pdf->Cell(32, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Total Estibas', 0, 1, 'C');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(15, 4, number_format($tot_kgm_netos, 2), 0, 0, 'R');
$pdf->Cell(19, 4, 'Peso Neto', 0, 0, 'R');
$pdf->Cell(32, 4, '', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(34, 4, $cantidad_estibas, 0, 1, 'C');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(15, 4, number_format($tot_kgm_brutos, 2), 0, 0, 'R');
$pdf->Cell(19, 4, 'Peso Bruto', 0, 1, 'R');

$pdf->Cell(198, 2, '', 'B', 1, 'R');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Agencia de Carga', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(32, 4, $agencia, 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Aerolinea', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(32, 4, $aerolinea, 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Guia Master ', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(32, 4, utf8_decode($guia_master), 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Guia Hija ', 0, 0, 'R');
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(32, 4, $guia_hija, 0, 1, 'L');

$pdf->SetFont('Helvetica', '', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$posX = $pdf->GetX(); // Guarda la posición X antes de MultiCell
$posY = $pdf->GetY(); // Guarda la posición Y actual
$pdf->MultiCell(34, 4, 'Termino de Negociacion', 0, 'R');
$pdf->SetXY($posX + 34, $posY); // Regresa a la posición correcta
$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(32, 4, $termino_negociacion, 0, 1, 'L');

$pdf->Cell(198, 2, '', 'B', 1, 'R');

$pdf->SetFont('Helvetica', 'B', 8);
$pdf->Cell(22, 4, '', 0, 0, 'R');
$pdf->Cell(34, 4, 'Us $ TOTAL AMOUNT', 0, 0, 'R');
$pdf->Cell(32, 4, utf8_decode($valor_en_letras), 0, 1, 'L');




$pdf->Output('I', $numero_factura . '.pdf');
