<?php
//src/Api/PedidosSample/ApiImprimirMultiplesPedidos.php
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

// Verificar filtros
if (!isset($input['tipoDocumento'])) {
    die(json_encode(["error" => "Filtro requerido: tipoDocumento"]));
}

// 👇 NUEVO: Obtener modo
$modo = $input['modo'] ?? 'porFechas'; // 'porFechas' o 'porNumeros'
$bodegaId = $input['bodegaId'] ?? '';
$tipoDocumento = $input['tipoDocumento'];

// 👇 MODIFICADO: Consultar samples según el MODO
if ($modo === 'porFechas') {
    // Modo por fechas (comportamiento original)
    if (!isset($input['fechaDesde']) || !isset($input['fechaHasta'])) {
        die(json_encode(["error" => "Para modo por fechas se requieren: fechaDesde, fechaHasta"]));
    }
    
    $fechaDesde = $input['fechaDesde'];
    $fechaHasta = $input['fechaHasta'];
    
    $sqlPedidos = "SELECT ep.Id_EncabPedido 
                   FROM EncabPedidoSample ep
                   WHERE (ep.FechaSalida BETWEEN ? AND ?)";
                   
    $params = [$fechaDesde, $fechaHasta];
    $types = "ss";
    
} else if ($modo === 'porNumeros') {
    // Modo por números (NUEVO)
    if (!isset($input['numeroDesde']) || !isset($input['numeroHasta'])) {
        die(json_encode(["error" => "Para modo por números se requieren: numeroDesde, numeroHasta"]));
    }
    
    $numeroDesde = intval($input['numeroDesde']);
    $numeroHasta = intval($input['numeroHasta']);
    
    $sqlPedidos = "SELECT ep.Id_EncabPedido 
                   FROM EncabPedidoSample ep
                   WHERE (ep.Id_EncabPedido BETWEEN ? AND ?)";
                   
    $params = [$numeroDesde, $numeroHasta];
    $types = "ii";
    
} else {
    die(json_encode(["error" => "Modo no válido. Use 'porFechas' o 'porNumeros'"]));
}

// 👇 MANTENER: Filtro por bodega (común para ambos modos)
if (!empty($bodegaId)) {
    $sqlPedidos .= " AND ep.Id_Bodega = ?";
    $params[] = $bodegaId;
    $types .= "i";
}

$sqlPedidos .= " ORDER BY ep.FechaSalida, ep.Id_EncabPedido";

$stmtPedidos = $enlace->prepare($sqlPedidos);
if ($stmtPedidos === false) {
    die(json_encode(["error" => "Error en la consulta: " . $enlace->error]));
}

$stmtPedidos->bind_param($types, ...$params);
$stmtPedidos->execute();
$stmtPedidos->bind_result($idPedido);

$pedidosIds = [];
while ($stmtPedidos->fetch()) {
    $pedidosIds[] = $idPedido;
}
$stmtPedidos->close();

if (empty($pedidosIds)) {
    die(json_encode(["error" => "No se encontraron samples con los filtros especificados"]));
}

// ======================
// CLASE PDF PARA MÚLTIPLES SAMPLES
// ======================
class PDF extends FPDF {
    private $tipoDocumento;
    private $pedidoCount = 0; // 👈 NUEVO: Contador de pedidos
    
    function setTipoDocumento($tipo) {
        $this->tipoDocumento = $tipo;
    }
    
    function Header() {
        // Logo alineado a la izquierda
        $this->Image($_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/img/Logo_08.jpg", 10, 8, 20);
        
        // Título según tipo de documento
        $this->SetFont('Arial', 'B', 12);
        
        $titulos = [
            'pedido' => 'ORDEN DE SAMPLE',
            'bol' => 'BILL OF LADING',
            'listaempaque' => 'LISTA DE EMPAQUE',
            'listaempaqueprecios' => 'LISTA DE EMPAQUE CON PRECIOS'
        ];
        
        $titulo = $titulos[$this->tipoDocumento] ?? 'DOCUMENTO';
        $this->Cell(188, 7, $titulo, 'LTR', 1, 'C');
        $this->Cell(188, 7, 'SISTEMA DE GESTION DE SAMPLES', 'LBR', 1, 'C');
        $this->Ln(2);
    }
    
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, utf8_decode('Página ') . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
    
    function agregarPedido($idPedido, $enlace) {
        $this->pedidoCount++; // 👈 Incrementar contador
        
        // 👇 NUEVA LÓGICA: Agregar nueva página para cada pedido después del primero
        if ($this->pedidoCount > 1) {
            $this->AddPage();
        }

        // Consultar datos del encabezado del sample
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
                            enc.Cliente AS NombreCliente,
                            '' AS Region,
                            '' AS Direccion,
                            trans.Nombre AS Transportadora,
                            bod.Descripcion AS Bodega
                          FROM EncabPedidoSample enc
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
            $stmtEncabezado->close();
            return false; // Sample no encontrado
        }
        $stmtEncabezado->close();

        // Consultar datos del detalle del sample
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
                       FROM DetPedidoSample det
                       INNER JOIN EncabPedidoSample enc ON det.Id_EncabPedido = enc.Id_EncabPedido
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

        // ENCABEZADO DEL SAMPLE
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(188, 6, 'INFORMACION GENERAL DEL SAMPLE', 1, 1, 'C');

        $this->SetFont('Arial', '', 9);
        $this->Cell(47, 6, 'No. Sample:', 1); 
        $this->Cell(47, 6, 'SAMP-' . str_pad($noPedido, 6, '0', STR_PAD_LEFT), 1);
        $this->Cell(47, 6, 'Fecha Orden:', 1); 
        $this->Cell(47, 6, $fechaOrden, 1);
        $this->Ln();

        $this->Cell(47, 6, 'Cliente:', 1); 
        $this->Cell(141, 6, utf8_decode($nombreCliente), 1);
        $this->Ln();

        if (!empty($region)) {
            $this->Cell(47, 6, 'Region/Destino:', 1); 
            $this->Cell(141, 6, utf8_decode($region), 1);
            $this->Ln();
        }

        if (!empty($direccion)) {
            $this->Cell(47, 6, 'Direccion:', 1); 
            $this->Cell(141, 6, utf8_decode($direccion), 1);
            $this->Ln();
        }

        $this->Cell(47, 6, 'Purchase Order:', 1); 
        $this->Cell(47, 6, $purchaseOrder, 1);
        $this->Cell(47, 6, 'Cant. Estibas:', 1); 
        $this->Cell(47, 6, $cantidadEstibas, 1);
        $this->Ln();

        if (!empty($transportadora)) {
            $this->Cell(47, 6, 'Transportadora:', 1); 
            $this->Cell(47, 6, utf8_decode($transportadora), 1);
        }
        if (!empty($bodega)) {
            $this->Cell(47, 6, 'Bodega:', 1); 
            $this->Cell(47, 6, utf8_decode($bodega), 1);
        }
        if (!empty($transportadora) || !empty($bodega)) {
            $this->Ln();
        }

        // FECHAS PROGRAMADAS
        if (!empty($fechaSalida) || !empty($fechaEnroute) || !empty($fechaDelivery) || !empty($fechaIngreso)) {
            $this->SetFont('Arial', 'B', 10);
            $this->Cell(188, 6, 'FECHAS PROGRAMADAS', 1, 1, 'C');

            $this->SetFont('Arial', '', 9);
            $this->Cell(47, 6, 'Fecha Salida:', 1); 
            $this->Cell(47, 6, $fechaSalida ?? '', 1);
            $this->Cell(47, 6, 'Fecha Enroute:', 1); 
            $this->Cell(47, 6, $fechaEnroute ?? '', 1);
            $this->Ln();

            $this->Cell(47, 6, 'Fecha Delivery:', 1); 
            $this->Cell(47, 6, $fechaDelivery ?? '', 1);
            $this->Cell(47, 6, 'Fecha Ingreso:', 1); 
            $this->Cell(47, 6, $fechaIngreso ?? '', 1);
            $this->Ln(8);
        }

        // DETALLE DEL SAMPLE
        $this->SetFont('Arial', 'B', 10);
        $this->Cell(188, 6, 'DETALLE DEL SAMPLE', 1, 1, 'C');

        // Encabezado de la tabla de detalle
        $this->SetFont('Arial', 'B', 8);
        $this->Cell(80, 6, 'Producto', 1);
        $this->Cell(27, 6, 'Embalaje', 1);
        $this->Cell(27, 6, 'Cajas', 1);
        $this->Cell(27, 6, 'Peso Neto KG', 1);
        $this->Cell(27, 6, 'Peso Bruto KG', 1);
        $this->Ln();

        // Detalle de productos
        $this->SetFont('Arial', '', 8);
        foreach ($detalles as $detalle) {
            // Truncar descripción si es muy larga
            $descripcion = strlen($detalle['descripcion']) > 40 ? 
                          substr($detalle['descripcion'], 0, 37) . '...' : 
                          $detalle['descripcion'];
            
            $this->Cell(80, 6, utf8_decode($descripcion), 1);
            $this->Cell(27, 6, utf8_decode($detalle['embalaje']), 1);
            $this->Cell(27, 6, $detalle['cantidad'], 1, 0, 'R');
            $this->Cell(27, 6, number_format($detalle['peso_neto'], 2), 1, 0, 'R');
            $this->Cell(27, 6, number_format($detalle['peso_bruto'], 2), 1, 0, 'R');
            $this->Ln();
        }

        // TOTALES
        $this->SetFont('Arial', 'B', 9);
        $this->Cell(107, 6, 'TOTALES:', 1);
        $this->Cell(27, 6, $totalCajas, 1, 0, 'R');
        $this->Cell(27, 6, number_format($totalPesoNeto, 2) . ' Kg', 1, 0, 'R');
        $this->Cell(27, 6, number_format($totalPesoBruto, 2) . ' Kg', 1, 0, 'R');
        $this->Ln();

        $this->Ln(8);

        // OBSERVACIONES
        if (!empty($observaciones)) {
            $this->SetFont('Arial', 'B', 9);
            $this->Cell(188, 6, 'OBSERVACIONES', 1, 1, 'C');
            $this->SetFont('Arial', '', 9);
            $this->MultiCell(188, 6, utf8_decode($observaciones), 1);
        }

        return true;
    }
}

// Crear PDF
$pdf = new PDF('P', 'mm', array(216, 280));
$pdf->setTipoDocumento($tipoDocumento);
$pdf->AliasNbPages();
$pdf->AddPage();

// Agregar cada sample al PDF
$pedidosProcesados = 0;
foreach ($pedidosIds as $idPedido) {
    if ($pdf->agregarPedido($idPedido, $enlace)) {
        $pedidosProcesados++;
    }
}

if ($pedidosProcesados === 0) {
    die(json_encode(["error" => "No se pudieron procesar los samples"]));
}

// Generar nombre del archivo
$nombreArchivo = 'sample_' . $tipoDocumento . '_multiple_' . date('Y-m-d') . '.pdf';

// Enviar PDF
$pdf->Output('I', $nombreArchivo);
?>
