<?php
// Cargar autoload de Composer (PhpSpreadsheet)
require $_SERVER['DOCUMENT_ROOT'] . "/vendor/autoload.php";
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

header('Content-Type: application/json'); // Para responder errores en JSON

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$fechaDesde = $data['fechaDesde'] ?? '';
$fechaHasta = $data['fechaHasta'] ?? '';

if (!$fechaDesde || !$fechaHasta) {
    echo json_encode(["success" => false, "message" => "Fechas requeridas"]);
    exit;
}

try {
    // Consulta SQL para obtener los datos de Plan Vallejo
    $sql = "SELECT 
        di.Dex,
        di.Dia,
        di.Mes,
        di.Anio,
        di.AD,
        di.Pais,
        p.DescripFactura AS Descripcion,
        di.CIP,
        di.Unidad,
        SUM(di.Kilogramos) AS CANT_KG,
        di.FOB,
        di.VAN,
        di.Porcentaje,
        di.Reposicion,
        SUM(di.CantidadEmbalaje) AS UNIDADES
    FROM DetInvoice di
    INNER JOIN Productos p ON di.Codigo_Siesa = p.Codigo_Siesa
    INNER JOIN EncabInvoice ei ON di.Id_EncabInvoice = ei.Id_EncabInvoice
    WHERE ei.Fecha BETWEEN ? AND ?
    AND p.PlanVallejo = -1
    GROUP BY di.Dex, di.Dia, di.Mes, di.Anio, di.AD, di.Pais, p.DescripFactura, di.CIP, di.FOB, di.VAN, di.Porcentaje 
    ORDER BY ei.Fecha, ei.Id_EncabInvoice, di.Item";

    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("ss", $fechaDesde, $fechaHasta);
    $stmt->execute();

    // Vincular resultados
    $stmt->bind_result(
        $Dex,
        $Dia,
        $Mes,
        $Anio,
        $AD,
        $Pais,
        $Descripcion,
        $CIP,
        $Unidad,
        $CANT_KG,
        $FOB,
        $VAN,
        $Porcentaje,
        $Reposicion,
        $UNIDADES
    );

    // Crear el objeto Spreadsheet
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle("Complemento Plan Vallejo");

    // Definir encabezados (en el orden solicitado)
    $encabezados = [
        'DEX',
        'D',
        'M',
        'AÑO',
        'AD',
        'PAIS',
        'DESCRIPCION',
        'CIP',
        'UNIDAD',
        'CANT.KG',
        'FOB',
        'VAN',
        'PORCENTAJE',
        'REPOSICION',
        'UNIDADES'
    ];

    // Escribir encabezados en la fila 1
    $col = 'A';
    foreach ($encabezados as $titulo) {
        $sheet->setCellValue($col . '1', $titulo);
        // Estilo básico: negrita, fondo lavanda
        $sheet->getStyle($col . '1')->getFont()->setBold(true);
        $sheet->getStyle($col . '1')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE6E6FA');
        $col++;
    }

    // Llenar datos desde la fila 2
    $fila = 2;
    $hayDatos = false;
    while ($stmt->fetch()) {
        $hayDatos = true;
        $sheet->setCellValueExplicit(
            'A' . $fila,
            $Dex,
            DataType::TYPE_STRING
        );
        $sheet->setCellValue('B' . $fila, $Dia);
        $sheet->setCellValue('C' . $fila, $Mes);
        $sheet->setCellValue('D' . $fila, $Anio);
        $sheet->setCellValue('E' . $fila, $AD);
        $sheet->setCellValue('F' . $fila, $Pais);
        $sheet->setCellValue('G' . $fila, $Descripcion);
        $sheet->setCellValue('H' . $fila, $CIP);
        $sheet->setCellValue('I' . $fila, $Unidad);
        $sheet->setCellValue('J' . $fila, $CANT_KG);
        $sheet->setCellValue('K' . $fila, $FOB);
        $sheet->setCellValue('L' . $fila, $VAN);
        $sheet->setCellValue('M' . $fila, $Porcentaje);
        $sheet->setCellValue('N' . $fila, $Reposicion);
        $sheet->setCellValue('O' . $fila, $UNIDADES);
        $fila++;
    }

    // Si no hay datos, mostrar mensaje en la celda A2
    if (!$hayDatos) {
        $sheet->setCellValue('A2', 'No hay datos para el rango seleccionado');
        $sheet->mergeCells('A2:O2');
    }

    // Autoajustar ancho de columnas
    foreach (range('A', 'O') as $colID) {
        $sheet->getColumnDimension($colID)->setAutoSize(true);
    }

    // Generar nombre de archivo con fecha y hora
    $nombreArchivo = "Complemento_PlanVallejo_" . date("Ymd_His") . ".xlsx";

    // Enviar archivo al navegador
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');
    header('Cache-Control: max-age=0');

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;
} catch (Exception $e) {
    // En caso de error, devolver JSON con el mensaje
    echo json_encode(["success" => false, "message" => "Error al generar Excel: " . $e->getMessage()]);
    exit;
}

$stmt->close();
$enlace->close();
