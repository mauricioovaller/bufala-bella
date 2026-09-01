<?php
// api/dashboard/ApiDetalleIndicadoresOTIF_chile.php - Detalle de indicadores OTIF para pedidos Chile
// Réplica de ApiDetalleIndicadoresOTIF.php usando tablas Chile
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

$json = file_get_contents("php://input");
$data = json_decode($json, true);

$fechaDesde = $data["fechaDesde"] ?? date("Y-m-01");
$fechaHasta = $data["fechaHasta"] ?? date("Y-m-d");
$tipo = $data["tipo"] ?? "inFull"; // "inFull" o "onTime"

try {
    if ($tipo === "inFull") {
        // Pedidos con bajo despacho O con Notas Crédito activas
        $sql = "SELECT
                    e.Id_EncabPedido,
                    e.PurchaseOrder,
                    e.FechaSalida,
                    e.FacturaNo,
                    c.Nombre AS NombreCliente,
                    d.Id_DetPedido,
                    d.Id_Producto,
                    p.DescripProducto,
                    d.Cantidad AS CantidadDespachada,
                    CASE WHEN d.Cantidad_Orig > 0 THEN d.Cantidad_Orig ELSE d.Cantidad END AS CantidadPedida,
                    COALESCE(nc_cred.CantidadCredito, 0) AS CantidadCreditada
                FROM EncabPedidoChile e
                INNER JOIN DetPedidoChile d ON e.Id_EncabPedido = d.Id_EncabPedido
                INNER JOIN ClientesChile c ON e.Id_Cliente = c.Id_Cliente
                LEFT JOIN ProductosChile p ON d.Id_Producto = p.Id_Producto
                LEFT JOIN (
                    SELECT dnc.Id_DetPedido, dnc.Id_EncabPedido, SUM(dnc.CantidadCredito) AS CantidadCredito
                    FROM DetNotaCreditoChile dnc
                    INNER JOIN EncabNotaCreditoChile encNC ON dnc.Id_EncabNotaCredito = encNC.Id_EncabNotaCredito
                    WHERE encNC.Estado = 'Activo'
                    GROUP BY dnc.Id_DetPedido, dnc.Id_EncabPedido
                ) nc_cred ON d.Id_DetPedido = nc_cred.Id_DetPedido AND e.Id_EncabPedido = nc_cred.Id_EncabPedido
                WHERE e.FechaSalida BETWEEN ? AND ?
                  AND e.Estado = 'Activo'
                  AND (
                    d.Cantidad < CASE WHEN d.Cantidad_Orig > 0 THEN d.Cantidad_Orig ELSE d.Cantidad END
                    OR e.Id_EncabPedido IN (
                        SELECT DISTINCT dnc2.Id_EncabPedido
                        FROM DetNotaCreditoChile dnc2
                        INNER JOIN EncabNotaCreditoChile encNC2 ON dnc2.Id_EncabNotaCredito = encNC2.Id_EncabNotaCredito
                        WHERE encNC2.Estado = 'Activo'
                    )
                  )
                ORDER BY e.Id_EncabPedido, d.Id_DetPedido";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ss", $fechaDesde, $fechaHasta);
        $stmt->execute();
        $stmt->bind_result($idPedido, $po, $fechaSalida, $factura, $cliente, $idDet, $idProd, $producto, $cantDesp, $cantPed, $cantCred);

        $pedidosMap = [];
        while ($stmt->fetch()) {
            if (!isset($pedidosMap[$idPedido])) {
                $pedidosMap[$idPedido] = [
                    'idPedido' => $idPedido,
                    'PurchaseOrder' => $po ?? '',
                    'FechaSalida' => $fechaSalida,
                    'FacturaNo' => $factura ?? '',
                    'Cliente' => $cliente,
                    'Region' => '',
                    'totalCreditosNC' => 0,
                    'productos' => []
                ];
            }
            $pedidosMap[$idPedido]['totalCreditosNC'] += (float)$cantCred;
            $pedidosMap[$idPedido]['productos'][] = [
                'idDetPedido' => $idDet,
                'producto' => $producto ?? '',
                'cantidadDespachada' => (float)$cantDesp,
                'cantidadPedida' => (float)$cantPed,
                'diferencia' => (float)($cantPed - $cantDesp),
                'cantidadCreditadaNC' => (float)$cantCred
            ];
        }
        $stmt->close();

        echo json_encode([
            "success" => true,
            "tipo" => "inFull",
            "pedidos" => array_values($pedidosMap),
            "total" => count($pedidosMap)
        ]);

    } elseif ($tipo === "onTime") {
        // Pedidos donde FechaSalida_Orig es diferente de FechaSalida
        $sql = "SELECT
                    e.Id_EncabPedido,
                    e.PurchaseOrder,
                    e.FechaSalida AS FechaSalidaReal,
                    e.FechaSalida_Orig AS FechaSalidaOriginal,
                    e.FacturaNo,
                    c.Nombre AS NombreCliente,
                    COUNT(d.Id_DetPedido) AS totalProductos,
                    SUM(d.Cantidad) AS totalCajas
                FROM EncabPedidoChile e
                INNER JOIN DetPedidoChile d ON e.Id_EncabPedido = d.Id_EncabPedido
                INNER JOIN ClientesChile c ON e.Id_Cliente = c.Id_Cliente
                WHERE e.FechaSalida BETWEEN ? AND ?
                  AND e.Estado = 'Activo'
                  AND e.FechaSalida_Orig IS NOT NULL
                  AND e.FechaSalida < e.FechaSalida_Orig
                GROUP BY e.Id_EncabPedido, e.PurchaseOrder, e.FechaSalida, e.FechaSalida_Orig, e.FacturaNo, c.Nombre
                ORDER BY e.Id_EncabPedido";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ss", $fechaDesde, $fechaHasta);
        $stmt->execute();
        $stmt->bind_result($idPedido, $po, $fechaReal, $fechaOrig, $factura, $cliente, $totalProd, $totalCajas);

        $pedidos = [];
        while ($stmt->fetch()) {
            $diasDiferencia = null;
            if ($fechaOrig && $fechaReal) {
                $f1 = new DateTime($fechaOrig);
                $f2 = new DateTime($fechaReal);
                $diasDiferencia = $f1->diff($f2)->days;
                if ($fechaReal < $fechaOrig) $diasDiferencia *= -1;
            }
            $pedidos[] = [
                'idPedido' => $idPedido,
                'PurchaseOrder' => $po ?? '',
                'FechaSalidaOriginal' => $fechaOrig,
                'FechaSalidaReal' => $fechaReal,
                'FacturaNo' => $factura ?? '',
                'Cliente' => $cliente,
                'Region' => '',
                'totalProductos' => (int)$totalProd,
                'totalCajas' => (float)$totalCajas,
                'diasDiferencia' => $diasDiferencia
            ];
        }
        $stmt->close();

        echo json_encode([
            "success" => true,
            "tipo" => "onTime",
            "pedidos" => $pedidos,
            "total" => count($pedidos)
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Tipo de indicador no válido"]);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
