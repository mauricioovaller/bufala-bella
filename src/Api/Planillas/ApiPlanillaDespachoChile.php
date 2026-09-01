<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Metodo no permitido. Usa POST."]));
}

$input = json_decode(file_get_contents("php://input"), true);
if (!isset($input['id_factura']) || empty($input['id_factura'])) {
    die(json_encode(["error" => "ID de factura no valido."]));
}
$id_factura = intval($input['id_factura']);

function pdu8($str)
{
    return $str === null ? '' : iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str);
}

function mesEspanol($mes)
{
    $meses = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return $meses[intval($mes)];
}

try {

    // ============================================================
    // CONSULTA: FACTURA + PLANILLA + CLIENTE + AEROLINEA + CONDUCTOR + AYUDANTE
    // ============================================================
    $sql = "SELECT
    enc.Id_EncabInvoice,
    enc.GuiaMaster,
    enc.GuiaHija,
    enc.Fecha AS fecha_factura,
    enc.CantidadEstibas,
    pl.Id_Planilla,
    pl.Precinto,
    pl.Placa,
    pl.Vehiculo,
    al.NOMAEROLINEA AS aerolinea,
    ag.NOMAGENCIA AS agencia,
    cli.Nombre AS cliente,
    cli.Direccion,
    cli.Ciudad,
    cli.Pais,
    c.Nombre AS conductor,
    c.NoDocumento AS cedula_conductor,
    a.Nombre AS ayudante,
    a.NoDocumento AS cedula_ayudante
FROM EncabInvoiceChile enc
LEFT JOIN PlanillasChile pl ON enc.Id_Planilla = pl.Id_Planilla
LEFT JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
LEFT JOIN Aerolineas al ON enc.IdAerolinea = al.IdAerolinea
LEFT JOIN Agencias ag ON enc.IdAgencia = ag.IdAgencia
LEFT JOIN Conductores c ON pl.Id_Conductor = c.Id_Conductor
LEFT JOIN Conductores a ON pl.Id_Ayudante = a.Id_Conductor
WHERE enc.Id_EncabInvoice = ?";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $id_factura);
    $stmt->execute();
    $stmt->bind_result(
        $id_factura,
        $guia_master,
        $guia_hija,
        $fecha_factura,
        $cantidad_estibas,
        $id_planilla,
        $precinto,
        $placa,
        $vehiculo,
        $aerolinea,
        $agencia,
        $cliente,
        $direccion,
        $ciudad,
        $pais,
        $conductor,
        $cedula_conductor,
        $ayudante,
        $cedula_ayudante
    );

    if (!$stmt->fetch()) {
        die(json_encode(["error" => "Factura Chile no encontrada."]));
    }
    $stmt->close();

    // ============================================================
    // CONSULTA: PRODUCTOS Y CAJAS
    // ============================================================
    $sqlDet = "SELECT
    CONCAT(det.DescripFactura, ' - ', prd.DescripProducto) AS producto,
    emb.Descripcion AS tipo_empaque,
    det.CantidadEmbalaje AS piezas,
    det.Cajas AS cajas_full,
    det.CantidadEmbalaje * emb.Cantidad AS unidades
FROM DetInvoiceChile det
INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
INNER JOIN ProductosChile prd ON det.Codigo_Siesa = prd.Codigo_Siesa
WHERE det.Id_EncabInvoice = ?
ORDER BY det.Item";

    $stmtDet = $enlace->prepare($sqlDet);
    $stmtDet->bind_param("i", $id_factura);
    $stmtDet->execute();
    $stmtDet->bind_result($producto, $tipo_empaque, $piezas, $cajas_full, $unidades);

    $productos = [];
    $total_unidades = 0;
    while ($stmtDet->fetch()) {
        $productos[] = [
            'producto' => $producto,
            'empaque' => $tipo_empaque,
            'piezas' => $piezas,
            'cajas_full' => $cajas_full,
            'unidades' => $unidades
        ];
        $total_unidades += $unidades;
    }
    $stmtDet->close();

    // ============================================================
    // FECHA FORMATEADA
    // ============================================================
    $ts = strtotime($fecha_factura ?: 'now');
    $fecha_formateada = date('j', $ts) . pdu8(' de ' . mesEspanol(date('n', $ts)) . ' de ') . date('Y', $ts);

    // ============================================================
    // CLASE PDF
    // ============================================================
    class PDF_PlanillaDespacho extends FPDF
    {
        function Header()
        {
            $this->SetFillColor(33, 74, 127);
            $this->Rect(0, 0, 216, 3, 'F');

            $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg";
            if (file_exists($logoPath)) $this->Image($logoPath, 12, 15, 38);
            $this->SetFont('Helvetica', 'B', 11);
            $this->SetXY(55, 20);
            $this->Cell(150, 5, pdu8('BUFALABELLA S.A.S'), 0, 1, 'C');
            $this->SetFont('Helvetica', '', 9);
            $this->SetX(55);
            $this->Cell(150, 4, pdu8('Nit. 900.254.183-4'), 0, 1, 'C');
            $this->Ln(8);
        }

        function Footer()
        {
            $this->SetY(-18);
            $this->SetDrawColor(33, 74, 127);
            $this->SetLineWidth(0.3);
            $this->Line(12, $this->GetY(), 204, $this->GetY());
            $this->SetLineWidth(0.2);
            $this->SetDrawColor(0);
            $this->SetFont('Helvetica', 'I', 6);
            $this->SetTextColor(100, 100, 100);
            $this->Cell(96, 4, pdu8('Address. Autopista Medellin Km 18 El Rosal, Cundinamarca-Colombia'), 0, 0, 'L');
            $this->Cell(96, 4, pdu8('E-Mail. exportaciones@bufalabella.com'), 0, 1, 'R');
            $this->Cell(96, 4, pdu8('Calle 93 Bis No. 19-50 Of. 305 Bogota, Colombia'), 0, 0, 'L');
            $this->Cell(96, 4, pdu8('Phone. (60) 1 9172185/5466633'), 0, 0, 'R');
            $this->SetTextColor(0, 0, 0);
        }
    }

    $pdf = new PDF_PlanillaDespacho('P', 'mm', 'Letter');
    $pdf->SetMargins(12, 10, 12);
    $pdf->AliasNbPages();
    $pdf->SetAutoPageBreak(true, 24);
    $pdf->AddPage();

    $margen = 12;
    $ancho = 192;

    // ============================================================
    // TÍTULO Y FECHA
    // ============================================================
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 6, pdu8('PLANILLA DE DESPACHO No. ' . ($id_planilla ?: 'N/A')), 0, 1, 'C');
    $pdf->SetDrawColor(33, 74, 127);
    $pdf->SetLineWidth(0.3);
    $pdf->Line($margen + 50, $pdf->GetY() + 0.5, $margen + $ancho - 50, $pdf->GetY() + 0.5);
    $pdf->SetLineWidth(0.2);
    $pdf->SetDrawColor(0);
    $pdf->Ln(3);
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->Cell(140, 5, '', 0, 0, 'L');
    $pdf->Cell(12, 5, pdu8('Fecha:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->Cell(20, 5, $fecha_formateada, 0, 1, 'L');
    $pdf->Ln(2);

    // Señor(es) y Aerolínea - ambos a la izquierda
    $pdf->SetFont('Helvetica', '', 8);
    $pdf->Cell(20, 4, pdu8('Señor(es)'), 0, 1, 'L');
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(0, 4, pdu8($aerolinea ?: ''), 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 8);
    $pdf->Cell(0, 4, pdu8('Aerolinea'), 0, 1, 'L');
    $pdf->Ln(6);

    // Descripción fija
    $pdf->SetFont('Helvetica', '', 8);
    $pdf->MultiCell(0, 4, pdu8('Con la presente estamos haciendo el despacho de Queso Mozzarella con las siguientes caracteristicas:'), 0, 'J');
    $pdf->Ln(3);

    // ============================================================
    // BLOQUE 1: CUADRO DATOS DEL DESPACHO (1 columna)
    // ============================================================
    $y1 = $pdf->GetY();
    $col1_x = $margen + 5;
    $row_h = 5;
    $rows_count = 6;
    $rect_h = 6 + $row_h * $rows_count;
    $borde_color = 180;

    $pdf->SetDrawColor($borde_color);
    $pdf->Rect($margen, $y1, $ancho, $rect_h);

    $campos = [
        ['AGENCIA DE CARGA:', pdu8($agencia ?: '')],
        ['GUIA MASTER No.:', $guia_master ?: ''],
        ['GUIA HIJA No.:', $guia_hija ?: ''],
        ['DESTINO:', pdu8('Santiago de Chile / Chile')],
        ['REMITENTE:', pdu8('BUFALABELLA S.A.S')],
    ];
    foreach ($campos as $i => $campo) {
        $y_row = $y1 + 3 + $i * $row_h;
        $pdf->SetFont('Helvetica', 'B', 7);
        $pdf->SetXY($col1_x, $y_row);
        $pdf->Cell(45, $row_h, $campo[0], 0, 0, 'L');
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->Cell(0, $row_h, $campo[1], 0, 1, 'L');
    }

    // DESTINATARIO (última fila, con texto compuesto)
    $y_row = $y1 + 3 + 5 * $row_h;
    $cliente_completo = $cliente ? pdu8($cliente) : '';
    if ($ciudad) $cliente_completo .= ' - ' . pdu8($ciudad);
    if ($pais) $cliente_completo .= ' - ' . pdu8($pais);
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($col1_x, $y_row);
    $pdf->Cell(45, $row_h, pdu8('DESTINATARIO:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(0, $row_h, $cliente_completo, 0, 1, 'L');

    $pdf->SetY($y1 + $rect_h + 4);

    // ============================================================
    // BLOQUE 2: INFORMACIÓN DEL TRANSPORTADOR
    // ============================================================
    $y2 = $pdf->GetY();
    $box2_h = 40;
    $pdf->SetDrawColor($borde_color);
    $pdf->Rect($margen, $y2, $ancho, $box2_h);

    $pdf->SetFillColor(237, 237, 237);
    $pdf->Rect($margen, $y2, $ancho, 6, 'F');
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->SetXY($margen, $y2);
    $pdf->Cell($ancho, 6, pdu8('INFORMACION DEL TRANSPORTADOR PLANTA'), 0, 1, 'C');
    $pdf->SetDrawColor($borde_color);
    $pdf->Line($margen, $y2 + 6, $margen + $ancho, $y2 + 6);

    $ly = $y2 + 7;
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($margen + 3, $ly);
    $pdf->Cell(22, $row_h, pdu8('CONDUCTOR:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(55, $row_h, pdu8($conductor ?: ''), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->Cell(40, $row_h, pdu8('CC:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(0, $row_h, $cedula_conductor ?: '', 0, 1, 'L');

    $ly += $row_h + 1;
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($margen + 3, $ly);
    $pdf->Cell(22, $row_h, pdu8('ESCOLTA:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(55, $row_h, pdu8($ayudante ?: ''), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->Cell(40, $row_h, pdu8('CC:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(0, $row_h, $cedula_ayudante ?: '', 0, 1, 'L');

    $ly += $row_h + 1;
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($margen + 3, $ly);
    $pdf->Cell(22, $row_h, pdu8('TIPO VEHICULO:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(55, $row_h, pdu8($vehiculo ?: ''), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->Cell(40, $row_h, pdu8('PLACAS:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(0, $row_h, $placa ?: '', 0, 1, 'L');

    $ly += $row_h + 1;
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($margen + 3, $ly);
    $pdf->Cell(22, $row_h, pdu8('PRECINTO:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(55, $row_h, $precinto ?: '', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->Cell(40, $row_h, pdu8('DESPACHADOR DE PLANTA:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->Cell(0, $row_h, pdu8('JOHN JAIRO VERA RIANO  CC: 11.449.717'), 0, 1, 'L');

    $pdf->SetY($y2 + $box2_h + 4);

    // ============================================================
    // BLOQUE 3: INFORMACIÓN DE CAJAS
    // ============================================================
    $y3 = $pdf->GetY();
    $col_w = [42, 28, 78, 44];
    $x0 = $margen;

    $pdf->SetDrawColor($borde_color);
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->SetXY($x0, $y3);
    $pdf->Cell(array_sum($col_w), 6, pdu8('INFORMACION DE CAJAS'), 1, 1, 'C');

    $y_h = $pdf->GetY();
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetFillColor(200, 200, 200);
    $hx = $x0;
    $headers = ['PIEZAS', 'CAJAS FULL', 'TIPO DE EMPAQUE', 'UNIDADES'];
    foreach ($headers as $i => $h) {
        $pdf->SetXY($hx, $y_h);
        $pdf->Cell($col_w[$i], 6, pdu8($h), 1, 0, 'C', true);
        $hx += $col_w[$i];
    }
    $pdf->Ln();

    // Fila de datos
    $y_data = $pdf->GetY();
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetXY($x0, $y_data);
    $pdf->Cell($col_w[0], 6, number_format($cantidad_estibas, 0, ',', '.'), 1, 0, 'C');
    $pdf->Cell($col_w[1], 6, '-', 1, 0, 'C');
    $pdf->Cell($col_w[2], 6, pdu8('Carton'), 1, 0, 'C');
    $pdf->Cell($col_w[3], 6, number_format($cantidad_estibas, 0, ',', '.'), 1, 1, 'C');

    // Fila de total
    $y_tot = $pdf->GetY();
    $pdf->SetFillColor(220, 220, 220);
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->SetXY($x0, $y_tot);
    $pdf->Cell($col_w[0] + $col_w[1] + $col_w[2], 6, pdu8('TOTAL UNIDADES'), 1, 0, 'R', true);
    $pdf->SetFont('Helvetica', 'B', 7);
    $pdf->Cell($col_w[3], 6, number_format($cantidad_estibas, 0, ',', '.'), 1, 0, 'C', true);
    $pdf->Ln(18);

    // ============================================================
    // FIRMAS
    // ============================================================
    $pdf->SetDrawColor($borde_color);
    $pdf->Line($margen, $pdf->GetY(), $margen + $ancho, $pdf->GetY());
    $pdf->Ln(4);

    $pdf->SetDrawColor(0);
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Line($margen + 30, $pdf->GetY(), $margen + $ancho - 30, $pdf->GetY());
    $pdf->Cell(0, 5, pdu8('FIRMA PLANTA'), 0, 1, 'C');
    $pdf->Ln(1);    
    $pdf->Ln(12);

    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Line($margen + 30, $pdf->GetY(), $margen + $ancho - 30, $pdf->GetY());
    $pdf->Cell(0, 5, pdu8('FIRMA AEROLINEA'), 0, 1, 'C');

    $pdf->Output('I', 'Planilla_Despacho_Chile_' . $id_factura . '.pdf');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error PHP: " . $e->getMessage()]);
}
