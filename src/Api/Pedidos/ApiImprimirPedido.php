<?php
require_once($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/fpdf/fpdf.php");  // Incluye la librería FPDF
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
$enlace->set_charset("utf8mb4"); // 👈 importante
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar si la petición es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(["error" => "Método no permitido. Usa POST."]));
}

// Obtener los datos enviados en formato JSON
$input = json_decode(file_get_contents("php://input"), true);

// Verificar si se recibió el ID del pedido correctamente
if (!isset($input['idPedido']) || empty($input['idPedido'])) {
    die(json_encode(["error" => "ID de pedido no válido."]));
}

$idPedido = intval($input['idPedido']);

// Consultar datos del encabezado del pedido
$sqlEncabezado = "SELECT 
                    enc.Id_EncabPedido AS NoPedido,
                    enc.FechaOrden,
                    enc.FechaSalida,
                    enc.FechaEnroute,
                    enc.FechaDelivery,
                    enc.FechaIngreso,
                    enc.PurchaseOrder,
                    enc.CantidadEstibas,
                    enc.Observaciones,
                    cli.Nombre AS NombreCliente,
                    cliReg.Region,
                    cliReg.Direccion,
                    trans.Nombre AS Transportadora,
                    bod.Descripcion AS Bodega
                  FROM EncabPedido enc
                  INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
                  INNER JOIN ClientesRegion cliReg ON enc.Id_ClienteRegion = cliReg.Id_ClienteRegion
                  LEFT JOIN Transportadoras trans ON enc.Id_Transportadora = trans.Id_Transportadora
                  LEFT JOIN Bodegas bod ON enc.Id_Bodega = bod.Id_Bodega
                  WHERE enc.Id_EncabPedido = ?";
                  
$stmtEncabezado = $enlace->prepare($sqlEncabezado);
$stmtEncabezado->bind_param("i", $idPedido);
$stmtEncabezado->execute();
$stmtEncabezado->bind_result(
    $noPedido, $fechaOrden, $fechaSalida, $fechaEnroute, $fechaDelivery, 
    $fechaIngreso, $purchaseOrder, $cantidadEstibas, $observaciones, 
    $nombreCliente, $region, $direccion, $transportadora, $bodega
);

if (!$stmtEncabezado->fetch()) {
    die(json_encode(["error" => "Pedido no encontrado."]));
}
$stmtEncabezado->close();

// Consultar datos del detalle del pedido
$sqlDetalle = "SELECT 
                det.Id_DetPedido,
                prod.DescripProducto,
                prod.DescripFactura,
                prod.Codigo_Siesa,
                det.Descripcion,
                emb.Descripcion AS Embalaje,
                emb.Cantidad AS CantidadEmbalaje,
                det.Cantidad,
                det.PrecioUnitario,
                prod.PesoGr,
                prod.FactorPesoBruto,
                (det.Cantidad * emb.Cantidad * prod.PesoGr / 1000) AS PesoNeto,
                (det.Cantidad * emb.Cantidad * prod.PesoGr * prod.FactorPesoBruto / 1000) AS PesoBruto,
                ((det.Cantidad * emb.Cantidad * prod.PesoGr / 1000) * det.PrecioUnitario) AS Subtotal
               FROM DetPedido det
               INNER JOIN Productos prod ON det.Id_Producto = prod.Id_Producto
               INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
               WHERE det.Id_EncabPedido = ?
               ORDER BY det.Id_DetPedido";
               
$stmtDetalle = $enlace->prepare($sqlDetalle);
$stmtDetalle->bind_param("i", $idPedido);
$stmtDetalle->execute();
$stmtDetalle->bind_result(
    $idDetalle, $descripProducto, $descripFactura, $codigoSiesa, $descripcion, 
    $embalaje, $cantidadEmbalaje, $cantidad, $precioUnitario, $pesoGr, 
    $factorPesoBruto, $pesoNeto, $pesoBruto, $subtotal
);

// Calcular totales
$totalCajas = 0;
$totalPesoNeto = 0;
$totalPesoBruto = 0;
$totalValor = 0;

$detalles = [];
while ($stmtDetalle->fetch()) {
    $detalles[] = [
        'producto' => $descripProducto,
        'descripcion' => $descripFactura,
        'codigo_siesa' => $codigoSiesa,
        'embalaje' => $embalaje,
        'cantidad' => $cantidad,
        'precio' => $precioUnitario,
        'peso_neto' => $pesoNeto,
        'peso_bruto' => $pesoBruto,
        'subtotal' => $subtotal
    ];
    
    $totalCajas += $cantidad;
    $totalPesoNeto += $pesoNeto;
    $totalPesoBruto += $pesoBruto;
    $totalValor += $subtotal;
}
$stmtDetalle->close();

// ======================
// GENERAR PDF
// ======================
class PDF extends FPDF {
    function Header() {
        // Logo alineado a la izquierda
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/Logo_08.jpg", 10, 8, 20);
        // Título centrado
        $this->SetFont('Arial', 'B', 12);
        $this->Cell(188, 7, 'ORDEN DE PEDIDO', 'LTR', 1, 'C');
        $this->Cell(188, 7, 'SISTEMA DE GESTION DE PEDIDOS', 'LBR', 1, 'C');
        $this->Ln(2);
    }
    
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Pagina ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

$pdf = new PDF('P', 'mm', array(216, 280)); // P = Portrait, mm = milímetros, tamaño media carta
$pdf->AliasNbPages();
$pdf->AddPage();

// ENCABEZADO DEL PEDIDO
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(188, 6, 'INFORMACION GENERAL DEL PEDIDO', 1, 1, 'C');

$pdf->SetFont('Arial', '', 9);
$pdf->Cell(47, 6, 'No. Pedido:', 1); 
$pdf->Cell(47, 6, 'PED-' . str_pad($noPedido, 6, '0', STR_PAD_LEFT), 1);
$pdf->Cell(47, 6, 'Fecha Orden:', 1); 
$pdf->Cell(47, 6, $fechaOrden, 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Cliente:', 1); 
$pdf->Cell(141, 6, utf8_decode($nombreCliente), 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Region/Destino:', 1); 
$pdf->Cell(141, 6, utf8_decode($region), 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Direccion:', 1); 
$pdf->Cell(141, 6, utf8_decode($direccion), 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Purchase Order:', 1); 
$pdf->Cell(47, 6, $purchaseOrder, 1);
$pdf->Cell(47, 6, 'Cant. Estibas:', 1); 
$pdf->Cell(47, 6, $cantidadEstibas, 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Transportadora:', 1); 
$pdf->Cell(47, 6, utf8_decode($transportadora), 1);
$pdf->Cell(47, 6, 'Bodega:', 1); 
$pdf->Cell(47, 6, utf8_decode($bodega), 1);
$pdf->Ln();

// FECHAS PROGRAMADAS
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(188, 6, 'FECHAS PROGRAMADAS', 1, 1, 'C');

$pdf->SetFont('Arial', '', 9);
$pdf->Cell(47, 6, 'Fecha Salida:', 1); 
$pdf->Cell(47, 6, $fechaSalida, 1);
$pdf->Cell(47, 6, 'Fecha Enroute:', 1); 
$pdf->Cell(47, 6, $fechaEnroute, 1);
$pdf->Ln();

$pdf->Cell(47, 6, 'Fecha Delivery:', 1); 
$pdf->Cell(47, 6, $fechaDelivery, 1);
$pdf->Cell(47, 6, 'Fecha Ingreso:', 1); 
$pdf->Cell(47, 6, $fechaIngreso, 1);
$pdf->Ln(8);

// DETALLE DEL PEDIDO
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(188, 6, 'DETALLE DEL PEDIDO', 1, 1, 'C');

// Encabezado de la tabla de detalle
$pdf->SetFont('Arial', 'B', 8);
$pdf->Cell(80, 6, 'Producto', 1);
$pdf->Cell(27, 6, 'Embalaje', 1);
$pdf->Cell(27, 6, 'Cajas', 1);
$pdf->Cell(27, 6, 'Peso Neto KG', 1);
$pdf->Cell(27, 6, 'Peso Bruto KG', 1);
$pdf->Ln();

// Detalle de productos
$pdf->SetFont('Arial', '', 8);
foreach ($detalles as $detalle) {
    $pdf->Cell(80, 6, substr(utf8_decode($detalle['descripcion']), 0, 40), 1);
    $pdf->Cell(27, 6, utf8_decode($detalle['embalaje']), 1);
    $pdf->Cell(27, 6, $detalle['cantidad'], 1, 0, 'R');
    $pdf->Cell(27, 6, number_format($detalle['peso_neto'], 2), 1, 0, 'R');
    $pdf->Cell(27, 6, number_format($detalle['peso_bruto'], 2), 1, 0, 'R');
    $pdf->Ln();
}

// TOTALES
$pdf->SetFont('Arial', 'B', 9);
$pdf->Cell(107, 6, 'TOTALES:', 1);
$pdf->Cell(27, 6, $totalCajas, 1, 0, 'R');
$pdf->Cell(27, 6, number_format($totalPesoNeto, 2) . ' Kg', 1, 0, 'R');
$pdf->Cell(27, 6, number_format($totalPesoBruto, 2) . ' Kg', 1, 0, 'R');

$pdf->Ln();

$pdf->Ln(8);

// OBSERVACIONES
if (!empty($observaciones)) {
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->Cell(188, 6, 'OBSERVACIONES', 1, 1, 'C');
    $pdf->SetFont('Arial', '', 9);
    $pdf->MultiCell(188, 6, utf8_decode($observaciones), 1);
}

$pdf->Output('I', 'pedido_' . $noPedido . '.pdf'); // 'I' para mostrar en navegador
?>