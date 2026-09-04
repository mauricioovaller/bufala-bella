<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

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

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

function limpiar_texto($txt) { return trim($txt); }
function validar_entero($valor) { return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null; }

$facturasIds = $data["facturasIds"] ?? [];
$configuracion = $data["configuracion"] ?? [];
$tipoPedido = $data["tipoPedido"] ?? "normal";

if (empty($facturasIds)) {
    echo json_encode(["success" => false, "message" => "No se seleccionaron facturas"]);
    exit;
}
if (!$configuracion) {
    echo json_encode(["success" => false, "message" => "No hay configuración de despacho"]);
    exit;
}

$esChile = ($tipoPedido === 'chile');

try {
    $enlace->begin_transaction();

    $placeholders = str_repeat('?,', count($facturasIds) - 1) . '?';

    // SELECCIONAR TABLA DE FACTURAS SEGUN TIPO
    $tablaFacturas = $esChile ? 'EncabInvoiceChile' : 'EncabInvoice';
    $campoEntidad = $esChile ? 'Id_Cliente' : 'Id_Consignatario';

    $sqlFacturas = "SELECT 
        Id_EncabInvoice, Fecha, IdAerolinea, GuiaMaster, GuiaHija,
        {$campoEntidad} AS id_entidad,
        IdAgencia, CantidadEstibas, TipoPedido
    FROM {$tablaFacturas}
    WHERE Id_EncabInvoice IN ($placeholders)";

    $stmtFacturas = $enlace->prepare($sqlFacturas);
    $stmtFacturas->bind_param(str_repeat('i', count($facturasIds)), ...$facturasIds);
    $stmtFacturas->execute();
    $stmtFacturas->bind_result($idFactura, $fechaFactura, $idAerolinea, $guiaMaster, $guiaHija, $idEntidad, $idAgencia, $cantidadEstibas, $tipoPedidoFactura);

    $facturasData = [];
    $fechas = []; $aerolineas = []; $guiasMaster = []; $guiasHija = [];
    $entidades = []; $agencias = []; $totalPiezas = 0;

    while ($stmtFacturas->fetch()) {
        $facturasData[] = [
            'Id_EncabInvoice' => $idFactura, 'Fecha' => $fechaFactura, 'IdAerolinea' => $idAerolinea,
            'GuiaMaster' => $guiaMaster, 'GuiaHija' => $guiaHija,
            'id_entidad' => $idEntidad, 'IdAgencia' => $idAgencia,
            'CantidadEstibas' => $cantidadEstibas, 'TipoPedido' => $tipoPedidoFactura
        ];
        $fechas[] = $fechaFactura; $aerolineas[] = $idAerolinea;
        $guiasMaster[] = $guiaMaster; $guiasHija[] = $guiaHija;
        $entidades[] = $idEntidad; $agencias[] = $idAgencia;
        $totalPiezas += $cantidadEstibas;
    }
    $stmtFacturas->close();

    if (empty($facturasData)) {
        throw new Exception("No se encontraron las facturas seleccionadas");
    }

    if (count(array_unique($fechas)) > 1) throw new Exception("Las facturas tienen fechas diferentes");
    if (count(array_unique($aerolineas)) > 1) throw new Exception("Las facturas tienen aerolíneas diferentes");
    if (count(array_unique($entidades)) > 1) throw new Exception("Las facturas tienen " . ($esChile ? "clientes" : "consignatarios") . " diferentes");
    if (count(array_unique($agencias)) > 1) throw new Exception("Las facturas tienen agencias diferentes");

    $fechaPlanilla = $fechas[0];
    $idAerolineaPlanilla = $aerolineas[0];
    $guiaMasterPlanilla = $guiasMaster[0];
    $guiaHijaPlanilla = $guiasHija[0];
    $idEntidadPlanilla = $entidades[0];
    $idAgenciaPlanilla = $agencias[0];

    // FORMATO DE NUMEROS DE FACTURA
    $numerosFacturasFormateados = [];
    foreach ($facturasData as $f) {
        if ($f['TipoPedido'] === 'chile') $prefijo = 'FEX-';
        elseif ($f['TipoPedido'] === 'sample') $prefijo = 'SMP-FEX-';
        else $prefijo = 'FEX-';
        $numerosFacturasFormateados[] = $prefijo . $f['Id_EncabInvoice'];
    }
    $facturasString = implode(', ', $numerosFacturasFormateados);

    // DATOS DE CONFIGURACION
    $precinto = limpiar_texto($configuracion["precintoSeguridad"] ?? "");
    $idConductor = validar_entero($configuracion["conductor"]["id"] ?? null);
    $idAyudante = validar_entero($configuracion["ayudante"]["id"] ?? null);
    $placa = limpiar_texto($configuracion["placaVehiculo"] ?? "");
    $vehiculo = limpiar_texto($configuracion["descripcionVehiculo"] ?? "");
    $termografoNo = limpiar_texto($configuracion["termografoNo"] ?? "");
    $mercanciaSeleccionada = isset($configuracion["mercanciaSeleccionada"]) ? json_encode($configuracion["mercanciaSeleccionada"]) : null;
    $anexosSeleccionados = isset($configuracion["anexosSeleccionados"]) ? json_encode($configuracion["anexosSeleccionados"]) : null;

    if (!$idConductor) throw new Exception("Conductor no válido");
    if (!$precinto) throw new Exception("Precinto no válido");
    if (!$placa) throw new Exception("Placa del vehículo no válida");

    // INSERTAR EN PLANILLAS (o PlanillasChile)
    if ($esChile) {
        $sqlPlanilla = "INSERT INTO PlanillasChile
            (Fecha, IdAerolinea, Facturas, GuiaMaster, GuiaHija, Id_Cliente, TotalPiezas, Precinto, TermografoNo, IdAgencia, Id_Conductor, Id_Ayudante, Placa, Vehiculo, MercanciaSeleccionada, AnexosSeleccionados)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtPlanilla = $enlace->prepare($sqlPlanilla);
        $stmtPlanilla->bind_param("sisssiissiiissss",
            $fechaPlanilla, $idAerolineaPlanilla, $facturasString,
            $guiaMasterPlanilla, $guiaHijaPlanilla, $idEntidadPlanilla,
            $totalPiezas, $precinto, $termografoNo, $idAgenciaPlanilla,
            $idConductor, $idAyudante, $placa, $vehiculo,
            $mercanciaSeleccionada, $anexosSeleccionados
        );
    } else {
        $sqlPlanilla = "INSERT INTO Planillas
            (Fecha, IdAerolinea, Facturas, GuiaMaster, GuiaHija, Id_Consignatario, TotalPiezas, Precinto, IdAgencia, Id_Conductor, Id_Ayudante, Placa, Vehiculo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtPlanilla = $enlace->prepare($sqlPlanilla);
        $stmtPlanilla->bind_param("sisssiisiiiss",
            $fechaPlanilla, $idAerolineaPlanilla, $facturasString,
            $guiaMasterPlanilla, $guiaHijaPlanilla, $idEntidadPlanilla,
            $totalPiezas, $precinto, $idAgenciaPlanilla,
            $idConductor, $idAyudante, $placa, $vehiculo
        );
    }

    $stmtPlanilla->execute();
    if ($stmtPlanilla->affected_rows <= 0) {
        throw new Exception("Error al crear la planilla");
    }

    $idPlanilla = $enlace->insert_id;

    // ACTUALIZAR FACTURAS CON ID_PLANILLA
    foreach ($facturasIds as $idFactura) {
        $sqlUpdate = "UPDATE {$tablaFacturas} SET Id_Planilla = ? WHERE Id_EncabInvoice = ?";
        $stmtUpdate = $enlace->prepare($sqlUpdate);
        if ($stmtUpdate) {
            $stmtUpdate->bind_param("ii", $idPlanilla, $idFactura);
            $stmtUpdate->execute();
            $stmtUpdate->close();
        }
    }

    // SPEC 0002: GUARDAR ANEXOS SELECCIONADOS POR PLANILLA (una fila por anexo,
    // con el id exacto de documentos_chile_items) para clientes Chile.
    if ($esChile) {
        // Re-ejecutable: limpiar filas previas de la planilla (si se reconfigura)
        $sqlLimpiarAnexos = "DELETE FROM planillas_chile_documentos WHERE Id_Planilla = ?";
        $stmtLimpiarAnexos = $enlace->prepare($sqlLimpiarAnexos);
        $stmtLimpiarAnexos->bind_param("i", $idPlanilla);
        $stmtLimpiarAnexos->execute();
        $stmtLimpiarAnexos->close();

        $anexosConfig = (isset($configuracion["anexosSeleccionados"]) && is_array($configuracion["anexosSeleccionados"]))
            ? $configuracion["anexosSeleccionados"]
            : [];

        if (!empty($anexosConfig)) {
            $sqlInsertAnexo = "INSERT INTO planillas_chile_documentos (Id_Planilla, Id_Documento, Tipo) VALUES (?, ?, 'anexo')";
            $stmtInsertAnexo = $enlace->prepare($sqlInsertAnexo);
            foreach ($anexosConfig as $idDocumento) {
                $idDocumentoInt = validar_entero($idDocumento);
                if (!$idDocumentoInt) continue;
                $stmtInsertAnexo->bind_param("ii", $idPlanilla, $idDocumentoInt);
                $stmtInsertAnexo->execute();
            }
            $stmtInsertAnexo->close();
        }
    }

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "message" => "Planilla creada exitosamente",
        "idPlanilla" => $idPlanilla,
        "fecha" => $fechaPlanilla,
        "facturas" => $facturasString,
        "totalPiezas" => $totalPiezas,
        "precinto" => $precinto,
        "aerolinea" => $idAerolineaPlanilla,
        $esChile ? "cliente" : "consignatario" => $idEntidadPlanilla,
        "tipoPedido" => $tipoPedido
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>
