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
                      cli.Nombre AS cliente, cli.Rut, cli.Direccion, cli.Ciudad, cli.Pais, cli.Telefono
               FROM EncabInvoiceChile enc
               INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
               WHERE enc.Id_EncabInvoice = ?";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("i", $id_factura);
    $stmtEnc->execute();
    $stmtEnc->bind_result($id_factura, $fecha_factura, $cliente, $rut, $direccion, $ciudad, $pais, $telefono);
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
    // CONSULTA: DETALLE DEL PEDIDO (PRODUCTOS + DATOS TÉRMICOS)
    // ============================================================
    $sqlDet = "SELECT d.Id_DetPedido, p.DescripProducto, p.DescripFactura,
                      d.Cantidad, d.Lote1, REPLACE(COALESCE(l.CodigoLote, ''), '-', '') AS LoteCodigo,
                      d.FechaElaboracion, d.FechaVencimiento,
                      d.TemperaturaInicial, d.TemperaturaFinal,
                      d.HoraInicialPH, d.HoraFinalPH
               FROM DetPedidoChile d
               INNER JOIN ProductosChile p ON d.Id_Producto = p.Id_Producto
               LEFT JOIN Lotes l ON d.Lote1 = l.Id_Lote
               WHERE d.Id_EncabPedido = ?
               ORDER BY d.Id_DetPedido";
    $stmtDet = $enlace->prepare($sqlDet);
    $stmtDet->bind_param("i", $id_encab_pedido);
    $stmtDet->execute();
    $stmtDet->bind_result($idDet, $descProducto, $descFactura, $cantidad, $lote1, $loteCodigo, $fechaElab, $fechaVenc, $tempIni, $tempFin, $horaIni, $horaFin);

    $items = [];
    while ($stmtDet->fetch()) {
        $items[] = [
            'producto' => $descProducto ?: $descFactura,
            'referencia' => $descFactura,
            'lote' => $loteCodigo ?: '',
            'fechaElaboracion' => $fechaElab ?? '',
            'fechaVencimiento' => $fechaVenc ?? '',
            'temperaturaInicial' => $tempIni ?? '',
            'temperaturaFinal' => $tempFin ?? '',
            'horaInicialPH' => $horaIni ?? '',
            'horaFinalPH' => $horaFin ?? ''
        ];
    }
    $stmtDet->close();

    // ============================================================
    // FUNCIÓN: calcular tiempo total de pH
    // ============================================================
    function calcularTiempoTotalPH($horaIni, $horaFin) {
        if (!$horaIni || !$horaFin) return '';
        $t1 = strtotime($horaIni);
        $t2 = strtotime($horaFin);
        if ($t2 < $t1) $t2 += 86400;
        $diff = $t2 - $t1;
        $horas = floor($diff / 3600);
        $minutos = floor(($diff % 3600) / 60);
        return sprintf('%d HORAS %02d MINUTOS', $horas, $minutos);
    }

    // ============================================================
    // FECHA FORMATEADA
    // ============================================================
    $ts = strtotime($fecha_factura ?: 'now');
    $fecha_formateada = date('d/m/Y', $ts);

    // Calcular tiempo total pH por cada item
    foreach ($items as &$item) {
        $item['tiempoTotalPH'] = calcularTiempoTotalPH($item['horaInicialPH'], $item['horaFinalPH']);
    }
    unset($item);

    // ============================================================
    // CLASE PDF
    // ============================================================
    class PDF_CertificadoTermico extends FPDF
    {
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

            $this->SetLineWidth(0.2);
        }

        function Header()
        {
            $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalabella.jpg";
            if (!file_exists($logoPath)) {
                $logoPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/bufalaFactura.jpg";
            }
            if (file_exists($logoPath)) $this->Image($logoPath, 12, 15, 65);

            $this->SetFont('Arial', 'B', 8);
            $this->Cell(80, 5, '', 'LTR', 0, 'C');
            $this->Cell(145, 5, u8('SISTEMA INTEGRADO DE GESTIÓN'), 'LTR', 0, 'C');
            $this->Cell(34, 5, 'CERTIFICADO', 'LTR', 1, 'C');

            $this->Cell(80, 5, '', 'LR', 0, 'C');
            $this->Cell(145, 5, '', 'LRB', 0, 'C');
            $this->Cell(19, 5, u8('Página'), 1, 0, 'C');
            $this->Cell(15, 5, u8('Código'), 1, 1, 'C');

            $this->Cell(80, 5, '', 'LR', 0, 'C');
            $this->Cell(145, 5, '', 'LRT', 0, 'C');
            $this->Cell(19, 5, $this->PageNo() . ' de {nb}', 1, 0, 'C');
            $this->Cell(15, 5, 'R-PRO-099', 1, 1, 'C');

            $this->Cell(80, 5, '', 'LR', 0, 'C');
            $this->Cell(145, 5, u8('CERTIFICADO TRATAMIENTO TÉRMICO - PASTEURIZACIÓN Y pH'), 'LR', 0, 'C');
            $this->Cell(19, 5, u8('Versión'), 1, 0, 'C');
            $this->Cell(15, 5, u8('Fecha'), 1, 1, 'C');

            $this->Cell(80, 5, '', 'LRB', 0, 'C');
            $this->Cell(145, 5, '', 'LRB', 0, 'C');
            $this->Cell(19, 5, '01', 1, 0, 'C');
            $this->Cell(15, 5, '01-08-2025', 1, 1, 'C');

            $this->Ln(5);
        }

        function Footer()
        {
            $this->SetY(-15);
            $this->SetFont('Arial', 'I', 7);
            $this->Cell(0, 10, u8('Estos resultados aplican solo para la muestra analizada. Se prohibe la reproducción total o parcial sin autorización de Bufalabella S.A.S'), 0, 0, 'C');
        }
    }

    $pdf = new PDF_CertificadoTermico('L', 'mm', array(216, 279));
    $pdf->SetMargins(10, 10, 10);
    $pdf->AliasNbPages();
    $pdf->AddPage();

    $margen = 10;
    $col_w = [73, 25, 25, 25, 33, 25, 25, 28];
    // Grupos: [0-3] REFERENCIAS (139), [4] RANGO TEMP (36), [5-7] PH (84) = total 259
    $ancho_total = array_sum($col_w);
    $x0 = $margen;

    // ============================================================
    // DATOS DEL CERTIFICADO — RECUADRO CON ESQUINAS REDONDEADAS
    // ============================================================
    $pdf->SetFont('Arial', '', 9);
    $label_w = 45;
    $value_start = $x0 + $label_w;
    $box_w = 160;
    $box_h = 14;

    $pdf->RoundedRect($x0, $pdf->GetY(), $box_w, $box_h, 3);

    $pdf->SetXY($x0 + 4, $pdf->GetY() + 2);
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->Cell($label_w, 5, u8('Fecha:'), 0, 0, 'L');
    $pdf->SetFont('Arial', '', 9);
    $pdf->Cell(50, 5, $fecha_formateada, 0, 1, 'L');

    $pdf->SetX($x0 + 4);
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->Cell($label_w, 5, u8('Registro Sanitario:'), 0, 0, 'L');
    $pdf->SetFont('Arial', '', 9);
    $pdf->Cell(50, 5, 'RSA - 0034032-2024', 0, 1, 'L');

    $pdf->SetY($pdf->GetY() + 4);

    // ============================================================
    // TABLA DE PRODUCTOS Y DATOS TÉRMICOS
    // ============================================================
    // Fila 1: Títulos de sección (3 celdas agrupadas)
    $y_seccion = $pdf->GetY();
    $seccion_h = 8;
    $pdf->SetFont('Arial', 'B', 7);
    $pdf->SetFillColor(200, 200, 200);
    $group1_w = $col_w[0] + $col_w[1] + $col_w[2] + $col_w[3]; // 148
    $group2_w = $col_w[4]; // 33
    $group3_w = $col_w[5] + $col_w[6] + $col_w[7]; // 78
    $grupos_seccion = [
        ['x' => $x0, 'w' => $group1_w, 'text' => 'REFERENCIAS - PRODUCTO TERMINADO'],
        ['x' => $x0 + $group1_w, 'w' => $group2_w, 'text' => "RANGO DE TEMPERATURA\n(°C) POR 15 SEGUNDOS"],
        ['x' => $x0 + $group1_w + $group2_w, 'w' => $group3_w, 'text' => 'PH']
    ];
    // Bordes
    foreach ($grupos_seccion as $i => $g) {
        $pdf->SetXY($g['x'], $y_seccion);
        if ($i == count($grupos_seccion) - 1)
            $pdf->Cell($g['w'], $seccion_h, '', 1, 1, 'C', true);
        else
            $pdf->Cell($g['w'], $seccion_h, '', 1, 0, 'C', true);
    }
    // Texto
    $pdf->SetFont('Arial', 'B', 6);
    foreach ($grupos_seccion as $g) {
        $pdf->SetXY($g['x'], $y_seccion + 0.5);
        $pdf->MultiCell($g['w'], 3.5, u8($g['text']), 0, 'C');
    }
    $pdf->SetY($y_seccion + $seccion_h);

    // Fila 2: Encabezados de columna (8 celdas)
    $y_header = $pdf->GetY();
    $header_h = 11;
    $pdf->SetFont('Arial', 'B', 6);
    $pdf->SetFillColor(220, 220, 220);
    $headers = [
        'PRODUCTO / REFERENCIA', 'LOTE',
        "FECHA ELABORACION\nPRODUCTO",
        "FECHA VENCIMIENTO\nPRODUCTO",
        "RANGO DE TEMPERATURA\n(°C) POR 15 SEGUNDOS",
        "HORA INICIAL CON\nPH MENOR A 6",
        "HORA FINAL CON PH\nMENOR A 6 ANTES\nDE HILADO",
        "TIEMPO TOTAL DE\nPH POR DEBAJO\nDE 6"
    ];
    // Primera pasada: dibujar bordes de todas las celdas con la misma altura
    $hx = $x0;
    $row_data = [];
    foreach ($headers as $i => $h) {
        $cw = $col_w[$i];
        $pdf->SetXY($hx, $y_header);
        if ($i == 0) {
            $pdf->Cell($cw, $header_h, '', 1, 0, 'C', true);
        } else if ($i == count($headers) - 1) {
            $pdf->Cell($cw, $header_h, '', 1, 1, 'C', true);
        } else {
            $pdf->Cell($cw, $header_h, '', 1, 0, 'C', true);
        }
        $row_data[] = ['x' => $hx, 'w' => $cw, 'text' => $h];
        $hx += $cw;
    }
    // Segunda pasada: escribir texto en cada celda
    $pdf->SetFont('Arial', 'B', 5.5);
    foreach ($row_data as $pos) {
        $pdf->SetXY($pos['x'], $y_header + 0.5);
        $pdf->MultiCell($pos['w'], 3.2, u8($pos['text']), 0, 'C');
    }
    $pdf->SetY($y_header + $header_h);

    // Filas de datos
    $pdf->SetFont('Arial', '', 7);
    $fill = false;
    foreach ($items as $item) {
        $fe = $item['fechaElaboracion'] ? date('d/m/Y', strtotime($item['fechaElaboracion'])) : '';
        $fv = $item['fechaVencimiento'] ? date('d/m/Y', strtotime($item['fechaVencimiento'])) : '';

        $tempIni = $item['temperaturaInicial'] !== '' ? number_format((float)$item['temperaturaInicial'], 1, ',', '.') : '';
        $tempFin = $item['temperaturaFinal'] !== '' ? number_format((float)$item['temperaturaFinal'], 1, ',', '.') : '';
        $rango = '';
        if ($tempIni && $tempFin) {
            $rango = $tempIni . ' - ' . $tempFin;
        } elseif ($tempIni) {
            $rango = $tempIni;
        }

        $horaIni = $item['horaInicialPH'] ? substr($item['horaInicialPH'], 0, 5) : '';
        $horaFin = $item['horaFinalPH'] ? substr($item['horaFinalPH'], 0, 5) : '';
        $tiempoPH = $item['tiempoTotalPH'];

        $ref_str = $item['referencia'] ?: '';
        $celda_producto = $ref_str ? u8($ref_str . ' - ' . $item['producto']) : u8($item['producto']);

        $y_row = $pdf->GetY();

        // Producto (col 0) — MultiCell para texto largo
        $pdf->SetXY($x0, $y_row);
        $pdf->MultiCell($col_w[0], 4, u8($celda_producto), 1, 'L', $fill);
        $y_despues = $pdf->GetY();
        $row_h_real = $y_despues - $y_row;

        // Lote (col 1)
        $pdf->SetXY($x0 + $col_w[0], $y_row);
        $pdf->Cell($col_w[1], $row_h_real, u8($item['lote']), 1, 0, 'C', $fill);
        // F. Elaboración (col 2)
        $pdf->Cell($col_w[2], $row_h_real, $fe, 1, 0, 'C', $fill);
        // F. Vencimiento (col 3)
        $pdf->Cell($col_w[3], $row_h_real, $fv, 1, 0, 'C', $fill);
        // Rango temp (col 4)
        $pdf->Cell($col_w[4], $row_h_real, u8($rango), 1, 0, 'C', $fill);
        // H. Inicial pH (col 5)
        $pdf->Cell($col_w[5], $row_h_real, $horaIni, 1, 0, 'C', $fill);
        // H. Final pH (col 6)
        $pdf->Cell($col_w[6], $row_h_real, $horaFin, 1, 0, 'C', $fill);
        // Tiempo total pH (col 7)
        $pdf->Cell($col_w[7], $row_h_real, u8($tiempoPH), 1, 1, 'C', $fill);

        $fill = !$fill;
    }

    // Fila de total
    $pdf->SetFont('Arial', 'B', 7);
    $pdf->SetFillColor(220, 220, 220);
    // Datos del primer item para el total
    $primerItem = $items[0] ?? [];
    $tempIniTotal = $primerItem['temperaturaInicial'] ?? '';
    $tempFinTotal = $primerItem['temperaturaFinal'] ?? '';
    $horaIniTotal = $primerItem['horaInicialPH'] ?? '';
    $horaFinTotal = $primerItem['horaFinalPH'] ?? '';
    $tiempoTotalPH = calcularTiempoTotalPH($horaIniTotal, $horaFinTotal);
    $rangoTotal = '';
    if ($tempIniTotal !== '' && $tempFinTotal !== '') {
        $rangoTotal = number_format((float)$tempIniTotal, 1, ',', '.') . ' - ' . number_format((float)$tempFinTotal, 1, ',', '.');
    } elseif ($tempIniTotal !== '') {
        $rangoTotal = number_format((float)$tempIniTotal, 1, ',', '.');
    }

    

    $pdf->Ln(4);

    // ============================================================
    // RECUADRO: DESCRIPCIÓN DEL PROCESO
    // ============================================================
    $desc = u8('Queso elaborado con leche entera pasteurizada de Búfala (Pasteurización, control de pH durante la maduración controlando el pH por debajo de 6 por más de una hora durante el proceso de maduración.)');
    $y_desc = $pdf->GetY();
    $pdf->SetFont('Arial', '', 7);
    // Calcular altura del texto
    $pdf->SetXY($x0 + 2, $y_desc + 2);
    $pdf->MultiCell($ancho_total - 4, 4, $desc, 0, 'L');
    $desc_h = $pdf->GetY() - $y_desc;
    $pdf->SetDrawColor(0);
    $pdf->Rect($x0, $y_desc, $ancho_total, $desc_h + 2);
    $pdf->SetY($y_desc + $desc_h + 4);

    // ============================================================
    // DOS RECUADROS HORIZONTALES: OBSERVACIONES (izq) + FIRMAS (der)
    // ============================================================
    $y_obs = $pdf->GetY();
    $obs_w = $col_w[0] + $col_w[1] + $col_w[2] + $col_w[3] + $col_w[4] + $col_w[5]; // hasta col 6 inclusive
    $firmas_x = $x0 + $obs_w;
    $firmas_w = $col_w[6] + $col_w[7]; // columnas 7 y 8

    // Altura del rectángulo de firmas (fijo para firma + 2 textos)
    $firmas_h = 35;

    // RECUADRO IZQUIERDO: Observaciones
    $pdf->SetFont('Arial', '', 7);
    $pdf->SetXY($x0 + 2, $y_obs + 2);
    $pdf->MultiCell($obs_w - 4, 4, u8('Observaciones: El certificado se emite a solicitud del interesado.'), 0, 'L');
    $obs_text_h = $pdf->GetY() - $y_obs;
    $obs_h = max($obs_text_h + 2, $firmas_h);

    $pdf->SetDrawColor(0);
    $pdf->Rect($x0, $y_obs, $obs_w, $obs_h);
    $pdf->Rect($firmas_x, $y_obs, $firmas_w, $firmas_h);

    // RECUADRO DERECHO: Firmas (dividido en dos bloques)
    // Bloque superior: espacio para firma + Responsable
    $bloque_alto = $firmas_h / 2;
    $pdf->SetDrawColor(0);
    $pdf->Line($firmas_x, $y_obs + $bloque_alto, $firmas_x + $firmas_w, $y_obs + $bloque_alto);

    // Firma imagen en bloque superior
    //$firmaPath = $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/firma.jpg";
    //if (file_exists($firmaPath)) {
    //    $pdf->Image($firmaPath, $firmas_x + 2, $y_obs + 2, $firmas_w - 4);
    //}

    $pdf->SetFont('Arial', 'B', 7);
    $pdf->SetXY($firmas_x + 2, $y_obs + $bloque_alto - 5);
    $pdf->Cell($firmas_w - 4, 4, u8('Responsable: Dumar Romero'), 0, 0, 'L');

    // Bloque inferior: Revisa
    $pdf->SetXY($firmas_x + 2, $y_obs + $bloque_alto + 2);
    $pdf->SetFont('Arial', 'B', 7);
    $pdf->Cell($firmas_w - 4, 4, u8('Revisa: Dumar Romero'), 0, 1, 'L');
    $pdf->SetX($firmas_x + 2);
    $pdf->SetFont('Arial', '', 7);
    $pdf->Cell($firmas_w - 4, 4, u8('Director de Planta'), 0, 1, 'L');

    // Avanzar Y por debajo de ambos rectángulos
    $pdf->SetY(max($y_obs + $obs_h, $y_obs + $firmas_h) + 4);

    // ============================================================
    // RECUADRO FINAL: TEXTO LEGAL A LO ANCHO
    // ============================================================
    $legal = u8('Estos resultados aplican solo para la muestra analizada. Se prohibe la reproducción total o parcial de este documento sin la autorización expresa de Bufalabella S.A.S');
    $y_legal = $pdf->GetY();
    $pdf->SetFont('Arial', 'I', 7);
    $pdf->SetXY($x0 + 2, $y_legal + 2);
    $pdf->MultiCell($ancho_total - 4, 4, $legal, 0, 'C');
    $legal_h = $pdf->GetY() - $y_legal;
    $pdf->SetDrawColor(0);
    $pdf->Rect($x0, $y_legal, $ancho_total, $legal_h + 2);

    $pdf->Output('I', 'Certificado_Tratamiento_Termico_' . $id_factura . '.pdf');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} catch (Error $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error PHP: " . $e->getMessage()]);
}
