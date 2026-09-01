<?php
/**
 * Helper de datos para los reportes de Consolidacion.
 * Reutilizado por los endpoints Chile y Consolidado sin modificar
 * el comportamiento de los endpoints Locales existentes.
 */

if (!function_exists('consolidacion_mapear_campo_fecha')) {
    function consolidacion_mapear_campo_fecha($tipoFecha)
    {
        $mapeo = [
            'fechaSalida' => 'FechaSalida',
            'fechaEnroute' => 'FechaEnroute',
            'fechaDelivery' => 'FechaDelivery',
            'fechaIngreso' => 'FechaIngreso'
        ];
        return $mapeo[$tipoFecha] ?? 'FechaSalida';
    }
}

if (!function_exists('consolidacion_obtener_produccion_local')) {
    function consolidacion_obtener_produccion_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
                    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
                    prd.Codigo_Siesa,
                    CONCAT(prd.DescripProducto) AS Descripcion,
                    SUM(det.Cantidad) AS Cajas,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
                    'Normal' AS TipoDato
                FROM EncabPedido enc
                INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT dp.Id_EncabPedido, SUM(dp.Cantidad) AS TotalCajasPedido
                    FROM DetPedido dp
                    INNER JOIN EncabPedido ep ON dp.Id_EncabPedido = ep.Id_EncabPedido
                    WHERE ep.Estado = 'Activo'
                    GROUP BY dp.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.{$campoFechaBD}, prd.Codigo_Siesa

                UNION ALL

                SELECT
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
                    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
                    prd.Codigo_Siesa,
                    CONCAT(prd.DescripProducto) AS Descripcion,
                    SUM(det.Cantidad) AS Cajas,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
                    'Sample' AS TipoDato
                FROM EncabPedidoSample enc
                INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT ds.Id_EncabPedido, SUM(ds.Cantidad) AS TotalCajasPedido
                    FROM DetPedidoSample ds
                    INNER JOIN EncabPedidoSample es ON ds.Id_EncabPedido = es.Id_EncabPedido
                    WHERE es.Estado = 'Activo'
                    GROUP BY ds.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.{$campoFechaBD}, prd.Codigo_Siesa

                ORDER BY FechaSalida, Codigo_Siesa";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaSalida, $diaSemana, $codigoSiesa, $descripcion, $cajas, $totalTM, $kgNet, $cantidadEstibas, $tipoDato);

        $datosPorFecha = [];
        while ($stmt->fetch()) {
            if (!isset($datosPorFecha[$fechaSalida])) {
                $datosPorFecha[$fechaSalida] = ['dia_semana' => $diaSemana, 'productos' => []];
            }
            $claveProducto = $fechaSalida . '|' . $codigoSiesa . '|' . $descripcion;
            if (isset($datosPorFecha[$fechaSalida]['productos'][$claveProducto])) {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['Cajas'] += $cajas;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['TotalTM'] += $totalTM;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['KgNet'] += $kgNet;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['CantidadEstibas'] += $cantidadEstibas;
            } else {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto] = [
                    'Codigo_Siesa' => $codigoSiesa,
                    'Descripcion' => $descripcion,
                    'Cajas' => $cajas,
                    'TotalTM' => $totalTM,
                    'KgNet' => $kgNet,
                    'CantidadEstibas' => $cantidadEstibas
                ];
            }
        }
        $stmt->close();

        foreach ($datosPorFecha as $fecha => $datosFecha) {
            $datosPorFecha[$fecha]['productos'] = array_values($datosFecha['productos']);
        }

        return $datosPorFecha;
    }
}

if (!function_exists('consolidacion_obtener_transporte_local')) {
    function consolidacion_obtener_transporte_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
                    SUM(det.Cantidad) AS CantidadCajas,
                    ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
                    ROUND(SUM(det.PesoNeto * 2.6), 2) AS PesoBruto,
                    enc.GuiaMaster,
                    enc.GuiaHija,
                    MAX(est.TotalEstibas) AS CantidadEstibas,
                    COALESCE(etp.TotalEstibasPagas, 0) AS CantidadEstibasPagas,
                    '07:00:00' AS HoraCargue,
                    'Normal' AS TipoDato,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT Id_EncabInvoice ORDER BY Id_EncabInvoice SEPARATOR '-') FROM EncabInvoice WHERE DATE(enc.FechaSalida) = Fecha AND TipoPedido = 'normal'), '') AS Facturas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoice ei LEFT JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha AND ei.TipoPedido = 'normal'), '') AS Precintos,
                    COALESCE(ctr.CostoTransporte, 0) AS CostoTransporte
                FROM EncabPedido enc
                INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT {$campoFechaBD}, SUM(CantidadEstibas) AS TotalEstibas
                    FROM EncabPedido
                    WHERE {$campoFechaBD} BETWEEN ? AND ? AND Estado = 'Activo'
                    GROUP BY {$campoFechaBD}
                ) est ON est.{$campoFechaBD} = enc.{$campoFechaBD}
                LEFT JOIN (
                    SELECT FechaSalida, SUM(EstibasPagas) AS TotalEstibasPagas
                    FROM (
                        SELECT enc.FechaSalida, IF(SUM(det.Cantidad) < 20, 0, enc.CantidadEstibas) AS EstibasPagas
                        FROM EncabPedido enc
                        INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                        WHERE enc.FechaSalida BETWEEN ? AND ?
                        GROUP BY enc.Id_EncabPedido
                    ) AS pedidos_agrupados
                    GROUP BY FechaSalida
                ) etp ON etp.FechaSalida = enc.FechaSalida
                LEFT JOIN (
                    SELECT Fecha, SUM(ValorFlete) AS CostoTransporte
                    FROM CostosTransporteDiario
                    WHERE Fecha BETWEEN ? AND ?
                    GROUP BY Fecha
                ) ctr ON ctr.Fecha = enc.{$campoFechaBD}
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.{$campoFechaBD}

                UNION ALL

                SELECT
                    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
                    SUM(det.Cantidad) AS CantidadCajas,
                    ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
                    ROUND(SUM(det.PesoNeto * 2.6), 2) AS PesoBruto,
                    enc.GuiaMaster,
                    enc.GuiaHija,
                    MAX(est.TotalEstibas) AS CantidadEstibas,
                    0 AS CantidadEstibasPagas,
                    '07:00:00' AS HoraCargue,
                    'Sample' AS TipoDato,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT Id_EncabInvoice ORDER BY Id_EncabInvoice SEPARATOR '-') FROM EncabInvoice WHERE DATE(enc.FechaSalida) = Fecha AND TipoPedido = 'sample'), '') AS Facturas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoice ei LEFT JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha AND ei.TipoPedido = 'sample'), '') AS Precintos,
                    0 AS CostoTransporte
                FROM EncabPedidoSample enc
                INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT {$campoFechaBD}, SUM(CantidadEstibas) AS TotalEstibas
                    FROM EncabPedidoSample
                    WHERE {$campoFechaBD} BETWEEN ? AND ? AND Estado = 'Activo'
                    GROUP BY {$campoFechaBD}
                ) est ON est.{$campoFechaBD} = enc.{$campoFechaBD}
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.{$campoFechaBD}

                ORDER BY FechaCorta ASC";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ssssssssssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaCompleta, $fechaCorta, $cantidadCajas, $pesoNeto, $pesoBruto, $guiaMaster, $guiaHija, $cantidadEstibas, $cantidadEstibasPagas, $horaCargue, $tipoDato, $facturas, $precintos, $costoTransporte);

        $datosConsolidados = [];
        while ($stmt->fetch()) {
            $claveUnica = $fechaCorta;
            if (isset($datosConsolidados[$claveUnica])) {
                $datosConsolidados[$claveUnica]['CantidadCajas'] += $cantidadCajas;
                $datosConsolidados[$claveUnica]['PesoNeto'] += $pesoNeto;
                $datosConsolidados[$claveUnica]['PesoBruto'] += $pesoBruto;
                $datosConsolidados[$claveUnica]['CantidadEstibas'] += $cantidadEstibas;
                $datosConsolidados[$claveUnica]['CantidadEstibasPagas'] += $cantidadEstibasPagas;
                $datosConsolidados[$claveUnica]['CostoTransporte'] += $costoTransporte;
                if ($tipoDato === 'Normal') {
                    $datosConsolidados[$claveUnica]['GuiaMaster'] = $guiaMaster;
                    $datosConsolidados[$claveUnica]['GuiaHija'] = $guiaHija;
                }
                if (!empty($facturas)) {
                    $existingFacturas = $datosConsolidados[$claveUnica]['Facturas'] ?? '';
                    $combined = array_unique(array_merge(
                        $existingFacturas !== '' ? explode('-', $existingFacturas) : [],
                        explode('-', $facturas)
                    ));
                    $datosConsolidados[$claveUnica]['Facturas'] = implode('-', array_filter($combined));
                }
                if (!empty($precintos)) {
                    $existingPrecintos = $datosConsolidados[$claveUnica]['Precintos'] ?? '';
                    $combined = array_unique(array_merge(
                        $existingPrecintos !== '' ? explode('-', $existingPrecintos) : [],
                        explode('-', $precintos)
                    ));
                    $datosConsolidados[$claveUnica]['Precintos'] = implode('-', array_filter($combined));
                }
            } else {
                $datosConsolidados[$claveUnica] = [
                    'FechaCompleta' => $fechaCompleta,
                    'FechaCorta' => $fechaCorta,
                    'CantidadCajas' => $cantidadCajas,
                    'PesoNeto' => $pesoNeto,
                    'PesoBruto' => $pesoBruto,
                    'GuiaMaster' => $guiaMaster,
                    'GuiaHija' => $guiaHija,
                    'CantidadEstibas' => $cantidadEstibas,
                    'CantidadEstibasPagas' => $cantidadEstibasPagas,
                    'HoraCargue' => $horaCargue,
                    'Facturas' => $facturas,
                    'Precintos' => $precintos,
                    'CostoTransporte' => $costoTransporte
                ];
            }
        }
        $stmt->close();

        return array_values($datosConsolidados);
    }
}

if (!function_exists('consolidacion_obtener_excel_proceso_local')) {
    function consolidacion_obtener_excel_proceso_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    YEAR(enc.FechaSalida) AS Anio,
                    MONTHNAME(enc.FechaSalida) AS Mes,
                    crg.Frecuencia,
                    crg.Region,
                    enc.PurchaseOrder AS Orden,
                    enc.Id_EncabPedido AS ListaEmpaque,
                    prd.Codigo_Siesa,
                    prd.Codigo_FDA,
                    cli.Nombre AS Cliente,
                    crg.Direccion,
                    '' AS Lote,
                    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
                    prd.DescripFactura,
                    SUM(det.Cantidad) AS CajasOrden,
                    SUM(det.Cantidad) AS CajasDespachadas,
                    emb.Cantidad AS CantidadCaja,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    (prd.PesoGr / 1000) AS PesoUnd,
                    ROUND((emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoCj,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr * prd.FactorPesoBruto / 1000), 2) AS KgBrt,
                    det.PrecioUnitario AS ValorKg,
                    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario), 2) AS USD,
                    ROUND(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido), 3) AS CantidadEstibas,
                    DATE_FORMAT(enc.FechaOrden, '%d/%m/%Y') AS FechaOrden,
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaETD,
                    DATE_FORMAT(enc.FechaEnroute, '%d/%m/%Y') AS FechaETA,
                    DATE_FORMAT(enc.FechaDelivery, '%d/%m/%Y') AS FechaETAF,
                    DATE_FORMAT(enc.FechaIngreso, '%d/%m/%Y') AS FechaQB,
                    (SELECT pt.Productos FROM ProductosTransitorios pt WHERE pt.Id_Producto = det.Id_Producto AND pt.Id_Embalaje = det.Id_Embalaje LIMIT 1) AS DescripcionExcel,
                    (SELECT pt.DescripcionFactura FROM ProductosTransitorios pt WHERE pt.Id_Producto = det.Id_Producto AND pt.Id_Embalaje = det.Id_Embalaje LIMIT 1) AS DescripFacExcel,
                    'Normal' AS TipoDato,
                    enc.GuiaMaster
                FROM EncabPedido enc
                INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Clientes cli ON enc.Id_Cliente = cli.Id_Cliente
                INNER JOIN ClientesRegion crg ON enc.Id_ClienteRegion = crg.Id_ClienteRegion
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT dp.Id_EncabPedido, SUM(dp.Cantidad) AS TotalCajasPedido
                    FROM DetPedido dp
                    INNER JOIN EncabPedido ep ON dp.Id_EncabPedido = ep.Id_EncabPedido
                    WHERE ep.Estado = 'Activo'
                    GROUP BY dp.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.Id_EncabPedido, det.Id_Producto, det.Id_Embalaje

                UNION ALL

                SELECT
                    YEAR(enc.FechaSalida) AS Anio,
                    MONTHNAME(enc.FechaSalida) AS Mes,
                    '' AS Frecuencia,
                    '' AS Region,
                    enc.PurchaseOrder AS Orden,
                    enc.Id_EncabPedido AS ListaEmpaque,
                    prd.Codigo_Siesa,
                    prd.Codigo_FDA,
                    enc.Cliente AS Cliente,
                    '' AS Direccion,
                    '' AS Lote,
                    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
                    prd.DescripFactura,
                    SUM(det.Cantidad) AS CajasOrden,
                    SUM(det.Cantidad) AS CajasDespachadas,
                    emb.Cantidad AS CantidadCaja,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    (prd.PesoGr / 1000) AS PesoUnd,
                    ROUND((emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoCj,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr * prd.FactorPesoBruto / 1000), 2) AS KgBrt,
                    det.PrecioUnitario AS ValorKg,
                    ROUND(SUM(det.Cantidad * emb.Cantidad * prd.PesoGr / 1000 * det.PrecioUnitario), 2) AS USD,
                    ROUND(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido), 3) AS CantidadEstibas,
                    DATE_FORMAT(enc.FechaOrden, '%d/%m/%Y') AS FechaOrden,
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaETD,
                    DATE_FORMAT(enc.FechaEnroute, '%d/%m/%Y') AS FechaETA,
                    DATE_FORMAT(enc.FechaDelivery, '%d/%m/%Y') AS FechaETAF,
                    DATE_FORMAT(enc.FechaIngreso, '%d/%m/%Y') AS FechaQB,
                    (SELECT pt.Productos FROM ProductosTransitorios pt WHERE pt.Id_Producto = det.Id_Producto AND pt.Id_Embalaje = det.Id_Embalaje LIMIT 1) AS DescripcionExcel,
                    (SELECT pt.DescripcionFactura FROM ProductosTransitorios pt WHERE pt.Id_Producto = det.Id_Producto AND pt.Id_Embalaje = det.Id_Embalaje LIMIT 1) AS DescripFacExcel,
                    'Sample' AS TipoDato,
                    enc.GuiaMaster
                FROM EncabPedidoSample enc
                INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT ds.Id_EncabPedido, SUM(ds.Cantidad) AS TotalCajasPedido
                    FROM DetPedidoSample ds
                    INNER JOIN EncabPedidoSample es ON ds.Id_EncabPedido = es.Id_EncabPedido
                    WHERE es.Estado = 'Activo'
                    GROUP BY ds.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.Id_EncabPedido, det.Id_Producto, det.Id_Embalaje
                ORDER BY FechaETD, ListaEmpaque, Codigo_Siesa";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($Anio, $Mes, $Frecuencia, $Region, $Orden, $ListaEmpaque, $Codigo_Siesa, $Codigo_FDA, $Cliente, $Direccion, $Lote, $Descripcion, $DescripFactura, $CajasOrden, $CajasDespachadas, $CantidadCaja, $TotalTM, $PesoUnd, $PesoCj, $KgNet, $KgBrt, $ValorKg, $USD, $CantidadEstibas, $FechaOrden, $FechaETD, $FechaETA, $FechaETAF, $FechaQB, $DescripcionExcel, $DescripFacExcel, $TipoDato, $GuiaMaster);

        $rows = [];
        while ($stmt->fetch()) {
            $rows[] = [
                'Anio' => $Anio, 'Mes' => $Mes, 'Frecuencia' => $Frecuencia, 'Region' => $Region,
                'Orden' => $Orden, 'ListaEmpaque' => $ListaEmpaque, 'Codigo_Siesa' => $Codigo_Siesa,
                'Codigo_FDA' => $Codigo_FDA, 'Cliente' => $Cliente, 'Direccion' => $Direccion,
                'Lote' => $Lote, 'Descripcion' => $Descripcion, 'DescripFactura' => $DescripFactura,
                'CajasOrden' => $CajasOrden, 'CajasDespachadas' => $CajasDespachadas,
                'CantidadCaja' => $CantidadCaja, 'TotalTM' => $TotalTM, 'PesoUnd' => $PesoUnd,
                'PesoCj' => $PesoCj, 'KgNet' => $KgNet, 'KgBrt' => $KgBrt, 'ValorKg' => $ValorKg,
                'USD' => $USD, 'CantidadEstibas' => $CantidadEstibas, 'FechaOrden' => $FechaOrden,
                'FechaETD' => $FechaETD, 'FechaETA' => $FechaETA, 'FechaETAF' => $FechaETAF,
                'FechaQB' => $FechaQB, 'DescripcionExcel' => $DescripcionExcel,
                'DescripFacExcel' => $DescripFacExcel, 'TipoDato' => $TipoDato, 'GuiaMaster' => $GuiaMaster
            ];
        }
        $stmt->close();

        return $rows;
    }
}

if (!function_exists('consolidacion_obtener_excel_proceso_chile')) {
    function consolidacion_obtener_excel_proceso_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    YEAR(enc.FechaSalida) AS Anio,
                    MONTHNAME(enc.FechaSalida) AS Mes,
                    '' AS Frecuencia,
                    '' AS Region,
                    enc.PurchaseOrder AS Orden,
                    enc.Id_EncabPedido AS ListaEmpaque,
                    prd.Codigo_Siesa,
                    prd.Codigo_FDA,
                    cli.Nombre AS Cliente,
                    cli.Direccion,
                    '' AS Lote,
                    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
                    prd.DescripFactura,
                    SUM(det.Cantidad) AS CajasOrden,
                    SUM(det.Cantidad) AS CajasDespachadas,
                    emb.Cantidad AS CantidadCaja,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    (prd.PesoGr / 1000) AS PesoUnd,
                    ROUND((emb.Cantidad * prd.PesoGr / 1000), 2) AS PesoCj,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(det.PesoBruto), 2) AS KgBrt,
                    det.PrecioUnitario AS ValorKg,
                    ROUND(SUM(det.PesoNeto * det.PrecioUnitario), 2) AS USD,
                    ROUND(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido), 3) AS CantidadEstibas,
                    DATE_FORMAT(enc.FechaOrden, '%d/%m/%Y') AS FechaOrden,
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaETD,
                    DATE_FORMAT(enc.FechaEnroute, '%d/%m/%Y') AS FechaETA,
                    DATE_FORMAT(enc.FechaDelivery, '%d/%m/%Y') AS FechaETAF,
                    DATE_FORMAT(enc.FechaIngreso, '%d/%m/%Y') AS FechaQB,
                    '' AS DescripcionExcel,
                    '' AS DescripFacExcel,
                    'Chile' AS TipoDato,
                    enc.GuiaMaster
                FROM EncabPedidoChile enc
                INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN ClientesChile cli ON enc.Id_Cliente = cli.Id_Cliente
                INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT dp.Id_EncabPedido, SUM(dp.Cantidad) AS TotalCajasPedido
                    FROM DetPedidoChile dp
                    INNER JOIN EncabPedidoChile ep ON dp.Id_EncabPedido = ep.Id_EncabPedido
                    WHERE ep.Estado = 'Activo'
                    GROUP BY dp.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.Id_EncabPedido, det.Id_Producto, det.Id_Embalaje
                ORDER BY FechaETD, ListaEmpaque, Codigo_Siesa";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ss", $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($Anio, $Mes, $Frecuencia, $Region, $Orden, $ListaEmpaque, $Codigo_Siesa, $Codigo_FDA, $Cliente, $Direccion, $Lote, $Descripcion, $DescripFactura, $CajasOrden, $CajasDespachadas, $CantidadCaja, $TotalTM, $PesoUnd, $PesoCj, $KgNet, $KgBrt, $ValorKg, $USD, $CantidadEstibas, $FechaOrden, $FechaETD, $FechaETA, $FechaETAF, $FechaQB, $DescripcionExcel, $DescripFacExcel, $TipoDato, $GuiaMaster);

        $rows = [];
        while ($stmt->fetch()) {
            $rows[] = [
                'Anio' => $Anio, 'Mes' => $Mes, 'Frecuencia' => $Frecuencia, 'Region' => $Region,
                'Orden' => $Orden, 'ListaEmpaque' => $ListaEmpaque, 'Codigo_Siesa' => $Codigo_Siesa,
                'Codigo_FDA' => $Codigo_FDA, 'Cliente' => $Cliente, 'Direccion' => $Direccion,
                'Lote' => $Lote, 'Descripcion' => $Descripcion, 'DescripFactura' => $DescripFactura,
                'CajasOrden' => $CajasOrden, 'CajasDespachadas' => $CajasDespachadas,
                'CantidadCaja' => $CantidadCaja, 'TotalTM' => $TotalTM, 'PesoUnd' => $PesoUnd,
                'PesoCj' => $PesoCj, 'KgNet' => $KgNet, 'KgBrt' => $KgBrt, 'ValorKg' => $ValorKg,
                'USD' => $USD, 'CantidadEstibas' => $CantidadEstibas, 'FechaOrden' => $FechaOrden,
                'FechaETD' => $FechaETD, 'FechaETA' => $FechaETA, 'FechaETAF' => $FechaETAF,
                'FechaQB' => $FechaQB, 'DescripcionExcel' => $DescripcionExcel,
                'DescripFacExcel' => $DescripFacExcel, 'TipoDato' => $TipoDato, 'GuiaMaster' => $GuiaMaster
            ];
        }
        $stmt->close();

        return $rows;
    }
}

if (!function_exists('consolidacion_obtener_transporte_chile')) {
    function consolidacion_obtener_transporte_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    DATE_FORMAT(enc.FechaSalida, '%W, %e de %M de %Y') AS FechaCompleta,
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaCorta,
                    SUM(det.Cantidad) AS CantidadCajas,
                    ROUND(SUM(det.PesoNeto), 2) AS PesoNeto,
                    ROUND(SUM(det.PesoBruto), 2) AS PesoBruto,
                    enc.GuiaMaster,
                    enc.GuiaHija,
                    MAX(est.TotalEstibas) AS CantidadEstibas,
                    COALESCE(etp.TotalEstibasPagas, 0) AS CantidadEstibasPagas,
                    '07:00:00' AS HoraCargue,
                    'Chile' AS TipoDato,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT ei.Id_EncabInvoice ORDER BY ei.Id_EncabInvoice SEPARATOR '-') FROM EncabInvoiceChile ei WHERE DATE(enc.FechaSalida) = ei.Fecha), '') AS Facturas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-') FROM EncabInvoiceChile ei LEFT JOIN PlanillasChile pl ON ei.Id_Planilla = pl.Id_Planilla WHERE DATE(enc.FechaSalida) = ei.Fecha), '') AS Precintos,
                    COALESCE(ctr.CostoTransporte, 0) AS CostoTransporte
                FROM EncabPedidoChile enc
                INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT {$campoFechaBD}, SUM(CantidadEstibas) AS TotalEstibas
                    FROM EncabPedidoChile
                    WHERE {$campoFechaBD} BETWEEN ? AND ? AND Estado = 'Activo'
                    GROUP BY {$campoFechaBD}
                ) est ON est.{$campoFechaBD} = enc.{$campoFechaBD}
                LEFT JOIN (
                    SELECT FechaSalida, SUM(EstibasPagas) AS TotalEstibasPagas
                    FROM (
                        SELECT enc.FechaSalida, IF(SUM(det.Cantidad) < 20, 0, enc.CantidadEstibas) AS EstibasPagas
                        FROM EncabPedidoChile enc
                        INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
                        WHERE enc.FechaSalida BETWEEN ? AND ?
                        GROUP BY enc.Id_EncabPedido
                    ) AS pedidos_agrupados
                    GROUP BY FechaSalida
                ) etp ON etp.FechaSalida = enc.FechaSalida
                LEFT JOIN (
                    SELECT Fecha, SUM(ValorFlete) AS CostoTransporte
                    FROM CostosTransporteDiario
                    WHERE Fecha BETWEEN ? AND ? AND TipoPedido = 'chile'
                    GROUP BY Fecha
                ) ctr ON ctr.Fecha = enc.{$campoFechaBD}
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.{$campoFechaBD}
                ORDER BY FechaCorta ASC";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ssssssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaCompleta, $fechaCorta, $cantidadCajas, $pesoNeto, $pesoBruto, $guiaMaster, $guiaHija, $cantidadEstibas, $cantidadEstibasPagas, $horaCargue, $tipoDato, $facturas, $precintos, $costoTransporte);

        $datosConsolidados = [];
        while ($stmt->fetch()) {
            $datosConsolidados[$fechaCorta] = [
                'FechaCompleta' => $fechaCompleta,
                'FechaCorta' => $fechaCorta,
                'CantidadCajas' => $cantidadCajas,
                'PesoNeto' => $pesoNeto,
                'PesoBruto' => $pesoBruto,
                'GuiaMaster' => $guiaMaster,
                'GuiaHija' => $guiaHija,
                'CantidadEstibas' => $cantidadEstibas,
                'CantidadEstibasPagas' => $cantidadEstibasPagas,
                'HoraCargue' => $horaCargue,
                'Facturas' => $facturas,
                'Precintos' => $precintos,
                'CostoTransporte' => $costoTransporte
            ];
        }
        $stmt->close();

        return array_values($datosConsolidados);
    }
}

if (!function_exists('consolidacion_obtener_produccion_chile')) {
    function consolidacion_obtener_produccion_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
                    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
                    prd.Codigo_Siesa,
                    CONCAT(prd.DescripProducto) AS Descripcion,
                    SUM(det.Cantidad) AS Cajas,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
                    'Chile' AS TipoDato
                FROM EncabPedidoChile enc
                INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT dp.Id_EncabPedido, SUM(dp.Cantidad) AS TotalCajasPedido
                    FROM DetPedidoChile dp
                    INNER JOIN EncabPedidoChile ep ON dp.Id_EncabPedido = ep.Id_EncabPedido
                    WHERE ep.Estado = 'Activo'
                    GROUP BY dp.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.{$campoFechaBD}, prd.Codigo_Siesa
                ORDER BY FechaSalida, Codigo_Siesa";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ss", $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaSalida, $diaSemana, $codigoSiesa, $descripcion, $cajas, $totalTM, $kgNet, $cantidadEstibas, $tipoDato);

        $datosPorFecha = [];
        while ($stmt->fetch()) {
            if (!isset($datosPorFecha[$fechaSalida])) {
                $datosPorFecha[$fechaSalida] = ['dia_semana' => $diaSemana, 'productos' => []];
            }
            $claveProducto = $fechaSalida . '|' . $codigoSiesa . '|' . $descripcion;
            if (isset($datosPorFecha[$fechaSalida]['productos'][$claveProducto])) {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['Cajas'] += $cajas;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['TotalTM'] += $totalTM;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['KgNet'] += $kgNet;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['CantidadEstibas'] += $cantidadEstibas;
            } else {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto] = [
                    'Codigo_Siesa' => $codigoSiesa,
                    'Descripcion' => $descripcion,
                    'Cajas' => $cajas,
                    'TotalTM' => $totalTM,
                    'KgNet' => $kgNet,
                    'CantidadEstibas' => $cantidadEstibas
                ];
            }
        }
        $stmt->close();

        foreach ($datosPorFecha as $fecha => $datosFecha) {
            $datosPorFecha[$fecha]['productos'] = array_values($datosFecha['productos']);
        }

        return $datosPorFecha;
    }
}

if (!function_exists('consolidacion_obtener_empaque_local')) {
    function consolidacion_obtener_empaque_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
                    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
                    prd.Codigo_Siesa,
                    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
                    SUM(det.Cantidad) AS Cajas,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
                    'Normal' AS TipoDato
                FROM EncabPedido enc
                INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT dp.Id_EncabPedido, SUM(dp.Cantidad) AS TotalCajasPedido
                    FROM DetPedido dp
                    INNER JOIN EncabPedido ep ON dp.Id_EncabPedido = ep.Id_EncabPedido
                    WHERE ep.Estado = 'Activo'
                    GROUP BY dp.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.FechaSalida, prd.Codigo_Siesa, det.Id_Embalaje

                UNION ALL

                SELECT
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
                    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
                    prd.Codigo_Siesa,
                    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
                    SUM(det.Cantidad) AS Cajas,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
                    'Sample' AS TipoDato
                FROM EncabPedidoSample enc
                INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN Productos prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT ds.Id_EncabPedido, SUM(ds.Cantidad) AS TotalCajasPedido
                    FROM DetPedidoSample ds
                    INNER JOIN EncabPedidoSample es ON ds.Id_EncabPedido = es.Id_EncabPedido
                    WHERE es.Estado = 'Activo'
                    GROUP BY ds.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.FechaSalida, prd.Codigo_Siesa, det.Id_Embalaje

                ORDER BY FechaSalida, Codigo_Siesa";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaSalida, $diaSemana, $codigoSiesa, $descripcion, $cajas, $totalTM, $kgNet, $cantidadEstibas, $tipoDato);

        $datosPorFecha = [];
        while ($stmt->fetch()) {
            if (!isset($datosPorFecha[$fechaSalida])) {
                $datosPorFecha[$fechaSalida] = ['dia_semana' => $diaSemana, 'productos' => []];
            }
            $claveProducto = $fechaSalida . '|' . $codigoSiesa . '|' . $descripcion;
            if (isset($datosPorFecha[$fechaSalida]['productos'][$claveProducto])) {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['Cajas'] += $cajas;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['TotalTM'] += $totalTM;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['KgNet'] += $kgNet;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['CantidadEstibas'] += $cantidadEstibas;
            } else {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto] = [
                    'Codigo_Siesa' => $codigoSiesa,
                    'Descripcion' => $descripcion,
                    'Cajas' => $cajas,
                    'TotalTM' => $totalTM,
                    'KgNet' => $kgNet,
                    'CantidadEstibas' => $cantidadEstibas
                ];
            }
        }
        $stmt->close();

        foreach ($datosPorFecha as $fecha => $datosFecha) {
            $datosPorFecha[$fecha]['productos'] = array_values($datosFecha['productos']);
        }

        return $datosPorFecha;
    }
}

if (!function_exists('consolidacion_obtener_empaque_chile')) {
    function consolidacion_obtener_empaque_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    DATE_FORMAT(enc.FechaSalida, '%d/%m/%Y') AS FechaSalida,
                    DATE_FORMAT(enc.FechaSalida, '%W') AS DiaSemana,
                    prd.Codigo_Siesa,
                    CONCAT(prd.DescripProducto, ' ', emb.Descripcion) AS Descripcion,
                    SUM(det.Cantidad) AS Cajas,
                    SUM(det.Cantidad * emb.Cantidad) AS TotalTM,
                    ROUND(SUM(det.PesoNeto), 2) AS KgNet,
                    ROUND(SUM(enc.CantidadEstibas * (det.Cantidad / total_pedido.TotalCajasPedido)), 2) AS CantidadEstibas,
                    'Chile' AS TipoDato
                FROM EncabPedidoChile enc
                INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
                INNER JOIN ProductosChile prd ON det.Id_Producto = prd.Id_Producto
                INNER JOIN Embalajes emb ON det.Id_Embalaje = emb.Id_Embalaje
                INNER JOIN (
                    SELECT dp.Id_EncabPedido, SUM(dp.Cantidad) AS TotalCajasPedido
                    FROM DetPedidoChile dp
                    INNER JOIN EncabPedidoChile ep ON dp.Id_EncabPedido = ep.Id_EncabPedido
                    WHERE ep.Estado = 'Activo'
                    GROUP BY dp.Id_EncabPedido
                ) total_pedido ON enc.Id_EncabPedido = total_pedido.Id_EncabPedido
                WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                GROUP BY enc.FechaSalida, prd.Codigo_Siesa, det.Id_Embalaje
                ORDER BY FechaSalida, Codigo_Siesa";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ss", $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaSalida, $diaSemana, $codigoSiesa, $descripcion, $cajas, $totalTM, $kgNet, $cantidadEstibas, $tipoDato);

        $datosPorFecha = [];
        while ($stmt->fetch()) {
            if (!isset($datosPorFecha[$fechaSalida])) {
                $datosPorFecha[$fechaSalida] = ['dia_semana' => $diaSemana, 'productos' => []];
            }
            $claveProducto = $fechaSalida . '|' . $codigoSiesa . '|' . $descripcion;
            if (isset($datosPorFecha[$fechaSalida]['productos'][$claveProducto])) {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['Cajas'] += $cajas;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['TotalTM'] += $totalTM;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['KgNet'] += $kgNet;
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto]['CantidadEstibas'] += $cantidadEstibas;
            } else {
                $datosPorFecha[$fechaSalida]['productos'][$claveProducto] = [
                    'Codigo_Siesa' => $codigoSiesa,
                    'Descripcion' => $descripcion,
                    'Cajas' => $cajas,
                    'TotalTM' => $totalTM,
                    'KgNet' => $kgNet,
                    'CantidadEstibas' => $cantidadEstibas
                ];
            }
        }
        $stmt->close();

        foreach ($datosPorFecha as $fecha => $datosFecha) {
            $datosPorFecha[$fecha]['productos'] = array_values($datosFecha['productos']);
        }

        return $datosPorFecha;
    }
}
