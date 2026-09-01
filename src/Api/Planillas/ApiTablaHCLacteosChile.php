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

function u8($str) {
    return $str === null ? '' : iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str);
}

function mesEspanol($mes) {
    $meses = ['', 'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return $meses[intval($mes)];
}

try {

    // ============================================================
    // CONSULTA: FACTURA + CLIENTE
    // ============================================================
    $sqlEnc = "SELECT enc.Id_EncabInvoice, enc.Fecha AS fecha_factura,
                      cli.Nombre AS cliente, cli.Rut
               FROM EncabInvoiceChile enc
               INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
               WHERE enc.Id_EncabInvoice = ?";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("i", $id_factura);
    $stmtEnc->execute();
    $stmtEnc->bind_result($id_factura, $fecha_factura, $cliente, $rut);
    if (!$stmtEnc->fetch()) {
        die(json_encode(["error" => "Factura Chile no encontrada."]));
    }
    $stmtEnc->close();

    // ============================================================
    // CONSULTA: PEDIDO CHILE ASOCIADO A LA FACTURA
    // ============================================================
    $sqlPed = "SELECT Id_EncabPedido FROM EncabPedidoChile
               WHERE FacturaNo = CONCAT('FEX-', ?) OR FacturaNo = CONCAT('CHI-FEX-', ?)
               LIMIT 1";
    $stmtPed = $enlace->prepare($sqlPed);
    $stmtPed->bind_param("ii", $id_factura, $id_factura);
    $stmtPed->execute();
    $stmtPed->bind_result($id_encab_pedido);
    if (!$stmtPed->fetch()) {
        die(json_encode(["error" => "Pedido Chile no encontrado para esta factura."]));
    }
    $stmtPed->close();

    // ============================================================
    // CONSULTA: DETALLE DEL PEDIDO CON PRODUCTOS, EMBALAJES, LOTES
    // ============================================================
    $sqlDet = "SELECT d.Id_DetPedido,
                      p.DescripProducto, p.DescripFactura,
                      p.PesoGr AS PesoUnitarioGr,
                      d.Cantidad AS Cajas,
                      d.Lote1, REPLACE(COALESCE(l.CodigoLote, ''), '-', '') AS LoteCodigo,
                      d.FechaVencimiento,
                      d.TemperaturaInicial, d.TemperaturaFinal,
                      emb.Descripcion AS DescEmbalaje, emb.Cantidad AS UnidadesPorCaja
               FROM DetPedidoChile d
               INNER JOIN ProductosChile p ON d.Id_Producto = p.Id_Producto
               INNER JOIN Embalajes emb ON d.Id_Embalaje = emb.Id_Embalaje
               LEFT JOIN Lotes l ON d.Lote1 = l.Id_Lote
               WHERE d.Id_EncabPedido = ?
               ORDER BY d.Id_DetPedido";
    $stmtDet = $enlace->prepare($sqlDet);
    $stmtDet->bind_param("i", $id_encab_pedido);
    $stmtDet->execute();
    $stmtDet->bind_result($idDet, $descProducto, $descFactura, $pesoUnitarioGr,
        $cajas, $lote1, $loteCodigo, $fechaVenc,
        $tempIni, $tempFin, $descEmbalaje, $unidadesPorCaja);

    $items = [];
    while ($stmtDet->fetch()) {
        $producto_completo = $descFactura ? ($descFactura . "\n" . $descProducto) : $descProducto;
        $pesoKg = $cajas && $unidadesPorCaja && $pesoUnitarioGr
            ? number_format((float)($cajas * $unidadesPorCaja * $pesoUnitarioGr / 1000), 2, ',', '.') . ' kg'
            : '';
        $presentacion = '';
        if ($unidadesPorCaja && $pesoUnitarioGr) {
            $presentacion = 'CAJAS ' . $unidadesPorCaja . ' UNIDADES DE ' . $pesoUnitarioGr . ' G';
        }
        $rango_temp = '';
        if ($tempIni !== null && $tempFin !== null && $tempIni !== '' && $tempFin !== '') {
            $rango_temp = number_format((float)$tempIni, 1, ',', '.') . ' - ' . number_format((float)$tempFin, 1, ',', '.');
        } elseif ($tempIni !== null && $tempIni !== '') {
            $rango_temp = number_format((float)$tempIni, 1, ',', '.');
        }
        $fecha_venc = $fechaVenc ? date('d/m/Y', strtotime($fechaVenc)) : '';

        $items[] = [
            'producto' => u8($producto_completo),
            'cajas' => $cajas ?: '',
            'presentacion' => u8($presentacion),
            'peso_kg' => $pesoKg,
            'rango_temp' => $rango_temp ? '' : '',
            'lote' => u8($loteCodigo ?: ''),
            'vencimiento' => $fecha_venc,
        ];
    }
    $stmtDet->close();

    // ============================================================
    // FECHA FORMATEADA
    // ============================================================
    $ts = strtotime($fecha_factura ?: 'now');
    $fecha_formateada = date('j', $ts) . u8(' de ' . mesEspanol(date('n', $ts)) . ' de ') . date('Y', $ts);

    // ============================================================
    // CLASE PDF
    // ============================================================
    class PDF_TablaHC extends FPDF
    {
        function Header()
        {
            $this->SetFillColor(33, 74, 127);
            $this->Rect(0, 0, $this->w, 3, 'F');

            $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg";
            if (file_exists($logoPath)) $this->Image($logoPath, 12, 15, 38);
            $this->SetFont('Helvetica', 'B', 11);
            $this->SetXY(55, 20);
            $this->Cell(150, 5, u8('BUFALABELLA S.A.S'), 0, 1, 'C');
            $this->SetFont('Helvetica', '', 9);
            $this->SetX(55);
            $this->Cell(150, 4, u8('Nit. 900.254.183-4'), 0, 1, 'C');
            $this->Ln(7);
        }

        function Footer()
        {
            $ancho_linea = 259;
            $this->SetY(-18);
            $this->SetDrawColor(33, 74, 127);
            $this->SetLineWidth(0.3);
            $this->Line(10, $this->GetY(), 10 + $ancho_linea, $this->GetY());
            $this->SetLineWidth(0.2);
            $this->SetDrawColor(0);
            $this->SetY($this->GetY() + 1);
            $this->SetFont('Helvetica', 'I', 6);
            $this->SetTextColor(100, 100, 100);
            $this->Cell(130, 4, u8('Address. Autopista Medellin Km 18 El Rosal, Cundinamarca-Colombia'), 0, 0, 'L');
            $this->Cell(129, 4, u8('E-Mail. exportaciones@bufalabella.com'), 0, 1, 'R');
            $this->Cell(130, 4, u8('Calle 93 Bis No. 19-50 Of. 305 Bogota, Colombia'), 0, 0, 'L');
            $this->Cell(129, 4, u8('Phone. (60) 1 9172185/5466633'), 0, 0, 'R');
            $this->SetTextColor(0, 0, 0);
        }
    }

    $pdf = new PDF_TablaHC('L', 'mm', array(216, 279));
    $pdf->SetMargins(10, 10, 10);
    $pdf->AliasNbPages();
    $pdf->SetAutoPageBreak(true, 24);
    $pdf->AddPage();

    $margen = 10;
    $ancho = 259;
    $x0 = $margen;

    // ============================================================
    // TÍTULO Y DATOS DEL DOCUMENTO
    // ============================================================
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 6, u8('TABLA HC LÁCTEOS CHILE'), 0, 1, 'C');
    $pdf->SetDrawColor(33, 74, 127);
    $pdf->SetLineWidth(0.3);
    $pdf->Line($x0 + 60, $pdf->GetY() + 0.5, $x0 + $ancho - 60, $pdf->GetY() + 0.5);
    $pdf->SetLineWidth(0.2);
    $pdf->SetDrawColor(0);
    $pdf->Ln(3);

    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(30, 4, u8('Fecha:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 8);
    $pdf->Cell(50, 4, $fecha_formateada, 0, 1, 'L');
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(30, 4, u8('Factura:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 8);
    $pdf->Cell(50, 4, u8('FEX - ' . $id_factura), 0, 1, 'L');
    $pdf->SetFont('Helvetica', 'B', 8);
    $pdf->Cell(30, 4, u8('Cliente:'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 8);
    $pdf->Cell(0, 4, u8($cliente ?: ''), 0, 1, 'L');
    $pdf->Ln(4);

    // ============================================================
    // TABLA: ENCABEZADOS (3 filas)
    // ============================================================
    $col_w = [65, 20, 45, 33, 33, 33, 30];
    $c0 = $col_w[0]; $c1 = $col_w[1]; $c2 = $col_w[2]; $c3 = $col_w[3];
    $c4 = $col_w[4]; $c5 = $col_w[5]; $c6 = $col_w[6];

    $pdf->SetDrawColor(180);

    // === FILA H1: PRODUCTO | EMBALAJE | (vacio) | VENCIMIENTO | INSPECCIÓN ===
    $pdf->SetFillColor(33, 74, 127);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetFont('Helvetica', 'B', 7);
    $y_h1 = $pdf->GetY();
    $pdf->SetXY($x0, $y_h1);
    $pdf->Cell($c0, 6, u8('PRODUCTO'), 1, 0, 'C', true);
    $pdf->Cell($c1 + $c2, 6, u8('EMBALAJE'), 1, 0, 'C', true);
    $pdf->Cell($c3 + $c4, 6, '', 1, 0, 'C', true);
    $pdf->Cell($c5, 6, u8('VENCIMIENTO'), 1, 0, 'C', true);
    $pdf->Cell($c6, 6, u8('INSPECCIÓN'), 1, 1, 'C', true);

    // === FILA H2: (vacio) | Cantidad | Presentación | PESO/VOL | Temp °C | (vacio) | (vacio) ===
    $pdf->SetFillColor(200, 200, 200);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('Helvetica', 'B', 5.5);
    $y_h2 = $pdf->GetY();
    $pdf->SetXY($x0, $y_h2);
    $pdf->Cell($c0, 6, '', 1, 0, 'C', true);
    $pdf->Cell($c1, 6, u8('Cantidad'), 1, 0, 'C', true);
    $pdf->Cell($c2, 6, u8('Presentación'), 1, 0, 'C', true);
    $pdf->Cell($c3, 6, u8('PESO / VOL'), 1, 0, 'C', true);
    $pdf->Cell($c4, 6, u8('Temp °C'), 1, 0, 'C', true);
    $pdf->Cell($c5, 6, '', 1, 0, 'C', true);
    $pdf->Cell($c6, 6, '', 1, 1, 'C', true);

    // === FILA H3: (vacio) | (vacio) | (vacio) | LOTE / LOT (merged) | (vacio) | (vacio) ===
    $pdf->SetFillColor(210, 210, 210);
    $y_h3 = $pdf->GetY();
    $pdf->SetXY($x0, $y_h3);
    $pdf->Cell($c0 + $c1 + $c2, 6, '', 1, 0, 'C', true);
    $pdf->Cell($c3 + $c4, 6, u8('LOTE / LOT'), 1, 0, 'C', true);
    $pdf->Cell($c5, 6, '', 1, 0, 'C', true);
    $pdf->Cell($c6, 6, '', 1, 1, 'C', true);

    $pdf->SetDrawColor(0);
    $pdf->SetLineWidth(0.2);

    // ============================================================
    // TABLA: FILAS DE DATOS
    // ============================================================
    $pdf->SetFont('Helvetica', '', 6.5);
    $fill = false;

    $x_prod = $x0;
    $x_cant = $x0 + $c0;
    $x_med = $x0 + $c0 + $c1 + $c2;
    $x_venc = $x0 + $c0 + $c1 + $c2 + $c3 + $c4;

    foreach ($items as $item) {
        $y_row = $pdf->GetY();

        // Calcular altura de fila
        $ancho_prod = $pdf->GetStringWidth($item['producto']);
        $num_lineas_prod = max(1, ceil($ancho_prod / ($c0 - 4)));
        $row_h = max($num_lineas_prod * 4, 10);
        $half_h1 = ceil($row_h / 2);
        $half_h2 = $row_h - $half_h1;

        // === PASO 1: Dibujar bordes de todas las celdas (altura uniforme) ===
        // PRODUCTO
        $pdf->SetXY($x_prod, $y_row);
        $pdf->Cell($c0, $row_h, '', 1, 0, 'L', $fill);
        // Cantidad
        $pdf->Cell($c1, $row_h, '', 1, 0, 'C', $fill);
        // Presentación
        $pdf->Cell($c2, $row_h, '', 1, 0, 'C', $fill);
        // PESO/VOL (sub-línea superior)
        $pdf->Cell($c3, $half_h1, '', 1, 0, 'C', $fill);
        // Temp (sub-línea superior)
        $pdf->Cell($c4, $half_h1, '', 1, 1, 'C', $fill);
        // LOTE (sub-línea inferior, fusionado)
        $pdf->SetXY($x_med, $y_row + $half_h1);
        $pdf->Cell($c3 + $c4, $half_h2, '', 1, 0, 'C', $fill);
        // Vencimiento
        $pdf->SetXY($x_venc, $y_row);
        $pdf->Cell($c5, $row_h, '', 1, 0, 'C', $fill);
        // Inspección
        $pdf->Cell($c6, $row_h, '', 1, 1, 'C', $fill);

        // === PASO 2: Escribir texto dentro de los bordes (sin bordes propios) ===
        // PRODUCTO — MultiCell sin borde
        $pdf->SetXY($x_prod + 1, $y_row + 0.5);
        $pdf->MultiCell($c0 - 2, 4, $item['producto'], 0, 'L');
        // Cantidad
        $pdf->SetXY($x_cant, $y_row);
        $pdf->Cell($c1, $row_h, $item['cajas'], 0, 0, 'C');
        // Presentación
        $pdf->Cell($c2, $row_h, $item['presentacion'], 0, 0, 'C');
        // PESO/VOL
        $pdf->SetXY($x_med, $y_row);
        $pdf->Cell($c3, $half_h1, $item['peso_kg'], 0, 0, 'C');
        // Temp
        $pdf->Cell($c4, $half_h1, $item['rango_temp'], 0, 1, 'C');
        // LOTE
        $pdf->SetXY($x_med, $y_row + $half_h1);
        $pdf->Cell($c3 + $c4, $half_h2, $item['lote'], 0, 0, 'C');
        // Vencimiento
        $pdf->SetXY($x_venc, $y_row);
        $pdf->Cell($c5, $row_h, $item['vencimiento'], 0, 0, 'C');
        // Inspección
        $pdf->Cell($c6, $row_h, u8('Aprobado'), 0, 1, 'C');

        $fill = !$fill;
    }

    $pdf->Output('I', 'Tabla_HC_Lacteos_Chile_' . $id_factura . '.pdf');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error PHP: " . $e->getMessage()]);
}
