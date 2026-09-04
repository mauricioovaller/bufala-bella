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
    /**
     * Transporte - Pedidos Locales (normales + muestras) desglosado por
     * Fecha + Guia Master + Guia Hija (una fila por cada guia del dia).
     * El costo de transporte diario se prorratea por cantidad de cajas
     * entre todas las filas (guias) del dia. Las facturas y precintos se
     * asocian a cada fila por Fecha + Guia Master.
     */
    function consolidacion_obtener_transporte_local($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    g.FechaKey,
                    DATE_FORMAT(MIN(g.FechaSalida), '%W, %e de %M de %Y') AS FechaCompleta,
                    DATE_FORMAT(MIN(g.FechaSalida), '%d/%m/%Y') AS FechaCorta,
                    COALESCE(NULLIF(g.GuiaMaster, ''), '') AS GuiaMaster,
                    COALESCE(NULLIF(g.GuiaHija, ''), '') AS GuiaHija,
                    SUM(g.Cajas) AS CantidadCajas,
                    ROUND(SUM(g.PesoNeto), 2) AS PesoNeto,
                    ROUND(SUM(g.PesoNeto * 2.6), 2) AS PesoBruto,
                    SUM(g.Estibas) AS CantidadEstibas,
                    SUM(g.EstibasPagas) AS CantidadEstibasPagas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT ei.Id_EncabInvoice ORDER BY ei.Id_EncabInvoice SEPARATOR '-')
                              FROM EncabInvoice ei
                              WHERE ei.Fecha = g.FechaKey
                                AND COALESCE(ei.GuiaMaster, '') = COALESCE(NULLIF(g.GuiaMaster, ''), '')), '') AS Facturas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-')
                              FROM EncabInvoice ei
                              INNER JOIN Planillas pl ON ei.Id_Planilla = pl.Id_Planilla
                              WHERE ei.Fecha = g.FechaKey
                                AND COALESCE(ei.GuiaMaster, '') = COALESCE(NULLIF(g.GuiaMaster, ''), '')), '') AS Precintos
                FROM (
                    SELECT enc.{$campoFechaBD} AS FechaKey,
                           enc.FechaSalida,
                           enc.GuiaMaster,
                           enc.GuiaHija,
                           SUM(det.Cantidad) AS Cajas,
                           SUM(det.PesoNeto) AS PesoNeto,
                           MAX(enc.CantidadEstibas) AS Estibas,
                           IF(SUM(det.Cantidad) < 20, 0, MAX(enc.CantidadEstibas)) AS EstibasPagas
                    FROM EncabPedido enc
                    INNER JOIN DetPedido det ON enc.Id_EncabPedido = det.Id_EncabPedido
                    WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                    GROUP BY enc.Id_EncabPedido, enc.{$campoFechaBD}, enc.FechaSalida, enc.GuiaMaster, enc.GuiaHija

                    UNION ALL

                    SELECT enc.{$campoFechaBD},
                           enc.FechaSalida,
                           enc.GuiaMaster,
                           enc.GuiaHija,
                           SUM(det.Cantidad),
                           SUM(det.PesoNeto),
                           MAX(enc.CantidadEstibas),
                           0
                    FROM EncabPedidoSample enc
                    INNER JOIN DetPedidoSample det ON enc.Id_EncabPedido = det.Id_EncabPedido
                    WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                    GROUP BY enc.Id_EncabPedido, enc.{$campoFechaBD}, enc.FechaSalida, enc.GuiaMaster, enc.GuiaHija
                ) g
                GROUP BY g.FechaKey, g.GuiaMaster, g.GuiaHija
                ORDER BY g.FechaKey ASC, g.GuiaMaster ASC, g.GuiaHija ASC";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ssss", $fechaInicio, $fechaFin, $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaKey, $fechaCompleta, $fechaCorta, $guiaMaster, $guiaHija, $cantidadCajas, $pesoNeto, $pesoBruto, $cantidadEstibas, $cantidadEstibasPagas, $facturas, $precintos);

        $filas = [];
        while ($stmt->fetch()) {
            $filas[] = [
                'FechaKey' => $fechaKey,
                'FechaCompleta' => $fechaCompleta,
                'FechaCorta' => $fechaCorta,
                'GuiaMaster' => $guiaMaster === null ? '' : (string)$guiaMaster,
                'GuiaHija' => $guiaHija === null ? '' : (string)$guiaHija,
                'CantidadCajas' => (float)$cantidadCajas,
                'PesoNeto' => (float)$pesoNeto,
                'PesoBruto' => (float)$pesoBruto,
                'CantidadEstibas' => (float)$cantidadEstibas,
                'CantidadEstibasPagas' => (float)$cantidadEstibasPagas,
                'Facturas' => $facturas === null ? '' : (string)$facturas,
                'Precintos' => $precintos === null ? '' : (string)$precintos
            ];
        }
        $stmt->close();

        // Costo de transporte terrestre del dia (tipo 'normal', incluye registros
        // historicos sin TipoPedido) para prorratear entre las guias del dia.
        $costoPorFecha = [];
        $sqlCosto = "SELECT Fecha, SUM(ValorFlete)
                     FROM CostosTransporteDiario
                     WHERE Fecha BETWEEN ? AND ? AND COALESCE(TipoPedido, 'normal') = 'normal'
                     GROUP BY Fecha";
        $stmtCosto = $enlace->prepare($sqlCosto);
        $stmtCosto->bind_param("ss", $fechaInicio, $fechaFin);
        $stmtCosto->execute();
        $stmtCosto->bind_result($costoFecha, $costoValor);
        while ($stmtCosto->fetch()) {
            $costoPorFecha[$costoFecha] = (float)$costoValor;
        }
        $stmtCosto->close();

        return consolidacion_aplicar_prorrateo_costo($filas, $costoPorFecha);
    }
}

if (!function_exists('consolidacion_aplicar_prorrateo_costo')) {
    /**
     * Asigna a cada fila (guia) su parte proporcional del costo de transporte
     * del dia segun la cantidad de cajas. La ultima fila de cada dia absorbe
     * la diferencia de redondeo para que la suma coincida con el costo diario.
     * Las filas de pedidos sin guia se etiquetan como 'SIN GUIA'.
     */
    function consolidacion_aplicar_prorrateo_costo($filas, $costoPorFecha)
    {
        $cajasPorFecha = [];
        foreach ($filas as $fila) {
            $fechaKey = $fila['FechaKey'];
            $cajasPorFecha[$fechaKey] = ($cajasPorFecha[$fechaKey] ?? 0) + $fila['CantidadCajas'];
        }

        $ultimoIndicePorFecha = [];
        foreach ($filas as $indice => $fila) {
            $ultimoIndicePorFecha[$fila['FechaKey']] = $indice;
        }

        $asignadoPorFecha = [];
        $resultado = [];
        foreach ($filas as $indice => $fila) {
            $fechaKey = $fila['FechaKey'];
            $costoDia = (float)($costoPorFecha[$fechaKey] ?? 0);
            $cajasDia = $cajasPorFecha[$fechaKey] ?? 0;
            $esUltimaFila = ($ultimoIndicePorFecha[$fechaKey] === $indice);

            if ($costoDia > 0 && $cajasDia > 0 && !$esUltimaFila) {
                $parte = round($costoDia * $fila['CantidadCajas'] / $cajasDia, 2);
            } elseif ($costoDia > 0 && $esUltimaFila) {
                $parte = round($costoDia - ($asignadoPorFecha[$fechaKey] ?? 0), 2);
            } else {
                $parte = 0.0;
            }
            $asignadoPorFecha[$fechaKey] = ($asignadoPorFecha[$fechaKey] ?? 0) + $parte;

            $guiaMaster = $fila['GuiaMaster'];
            $guiaHija = $fila['GuiaHija'];
            if ($guiaMaster === '') {
                $guiaMaster = 'SIN GUIA';
                $guiaHija = '';
            }

            $resultado[] = [
                'FechaCompleta' => $fila['FechaCompleta'],
                'FechaCorta' => $fila['FechaCorta'],
                'CantidadCajas' => $fila['CantidadCajas'],
                'PesoNeto' => $fila['PesoNeto'],
                'PesoBruto' => $fila['PesoBruto'],
                'GuiaMaster' => $guiaMaster,
                'GuiaHija' => $guiaHija,
                'CantidadEstibas' => $fila['CantidadEstibas'],
                'CantidadEstibasPagas' => $fila['CantidadEstibasPagas'],
                'CostoTransporte' => $parte,
                'Facturas' => $fila['Facturas'],
                'Precintos' => $fila['Precintos']
            ];
        }

        return $resultado;
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
    /**
     * Transporte - Pedidos Chile desglosado por Fecha + Guia Master + Guia Hija
     * (una fila por cada guia del dia). El costo diario se prorratea por cajas
     * entre las guias del dia. Facturas y precintos se asocian por Fecha + Guia Master.
     */
    function consolidacion_obtener_transporte_chile($enlace, $fechaInicio, $fechaFin, $campoFechaBD)
    {
        $sql = "SELECT
                    g.FechaKey,
                    DATE_FORMAT(MIN(g.FechaSalida), '%W, %e de %M de %Y') AS FechaCompleta,
                    DATE_FORMAT(MIN(g.FechaSalida), '%d/%m/%Y') AS FechaCorta,
                    COALESCE(NULLIF(g.GuiaMaster, ''), '') AS GuiaMaster,
                    COALESCE(NULLIF(g.GuiaHija, ''), '') AS GuiaHija,
                    SUM(g.Cajas) AS CantidadCajas,
                    ROUND(SUM(g.PesoNeto), 2) AS PesoNeto,
                    ROUND(SUM(g.PesoBruto), 2) AS PesoBruto,
                    SUM(g.Estibas) AS CantidadEstibas,
                    SUM(g.EstibasPagas) AS CantidadEstibasPagas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT ei.Id_EncabInvoice ORDER BY ei.Id_EncabInvoice SEPARATOR '-')
                              FROM EncabInvoiceChile ei
                              WHERE ei.Fecha = g.FechaKey
                                AND COALESCE(ei.GuiaMaster, '') = COALESCE(NULLIF(g.GuiaMaster, ''), '')), '') AS Facturas,
                    COALESCE((SELECT GROUP_CONCAT(DISTINCT pl.Precinto ORDER BY pl.Precinto SEPARATOR '-')
                              FROM EncabInvoiceChile ei
                              INNER JOIN PlanillasChile pl ON ei.Id_Planilla = pl.Id_Planilla
                              WHERE ei.Fecha = g.FechaKey
                                AND COALESCE(ei.GuiaMaster, '') = COALESCE(NULLIF(g.GuiaMaster, ''), '')), '') AS Precintos
                FROM (
                    SELECT enc.{$campoFechaBD} AS FechaKey,
                           enc.FechaSalida,
                           enc.GuiaMaster,
                           enc.GuiaHija,
                           SUM(det.Cantidad) AS Cajas,
                           SUM(det.PesoNeto) AS PesoNeto,
                           SUM(det.PesoBruto) AS PesoBruto,
                           MAX(enc.CantidadEstibas) AS Estibas,
                           IF(SUM(det.Cantidad) < 20, 0, MAX(enc.CantidadEstibas)) AS EstibasPagas
                    FROM EncabPedidoChile enc
                    INNER JOIN DetPedidoChile det ON enc.Id_EncabPedido = det.Id_EncabPedido
                    WHERE enc.{$campoFechaBD} BETWEEN ? AND ? AND enc.Estado = 'Activo'
                    GROUP BY enc.Id_EncabPedido, enc.{$campoFechaBD}, enc.FechaSalida, enc.GuiaMaster, enc.GuiaHija
                ) g
                GROUP BY g.FechaKey, g.GuiaMaster, g.GuiaHija
                ORDER BY g.FechaKey ASC, g.GuiaMaster ASC, g.GuiaHija ASC";

        $stmt = $enlace->prepare($sql);
        $stmt->bind_param("ss", $fechaInicio, $fechaFin);
        $stmt->execute();
        $stmt->bind_result($fechaKey, $fechaCompleta, $fechaCorta, $guiaMaster, $guiaHija, $cantidadCajas, $pesoNeto, $pesoBruto, $cantidadEstibas, $cantidadEstibasPagas, $facturas, $precintos);

        $filas = [];
        while ($stmt->fetch()) {
            $filas[] = [
                'FechaKey' => $fechaKey,
                'FechaCompleta' => $fechaCompleta,
                'FechaCorta' => $fechaCorta,
                'GuiaMaster' => $guiaMaster === null ? '' : (string)$guiaMaster,
                'GuiaHija' => $guiaHija === null ? '' : (string)$guiaHija,
                'CantidadCajas' => (float)$cantidadCajas,
                'PesoNeto' => (float)$pesoNeto,
                'PesoBruto' => (float)$pesoBruto,
                'CantidadEstibas' => (float)$cantidadEstibas,
                'CantidadEstibasPagas' => (float)$cantidadEstibasPagas,
                'Facturas' => $facturas === null ? '' : (string)$facturas,
                'Precintos' => $precintos === null ? '' : (string)$precintos
            ];
        }
        $stmt->close();

        // Costo de transporte terrestre del dia para pedidos Chile
        $costoPorFecha = [];
        $sqlCosto = "SELECT Fecha, SUM(ValorFlete)
                     FROM CostosTransporteDiario
                     WHERE Fecha BETWEEN ? AND ? AND TipoPedido = 'chile'
                     GROUP BY Fecha";
        $stmtCosto = $enlace->prepare($sqlCosto);
        $stmtCosto->bind_param("ss", $fechaInicio, $fechaFin);
        $stmtCosto->execute();
        $stmtCosto->bind_result($costoFecha, $costoValor);
        while ($stmtCosto->fetch()) {
            $costoPorFecha[$costoFecha] = (float)$costoValor;
        }
        $stmtCosto->close();

        return consolidacion_aplicar_prorrateo_costo($filas, $costoPorFecha);
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
