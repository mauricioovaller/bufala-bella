<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Solo POST permitido
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Conexión a la base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Leer JSON
$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// Funciones de sanitización
function limpiar_texto($txt) {
    return trim($txt);
}
function validar_entero($valor) {
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}

// Extraer datos
$facturasIds = $data["facturasIds"] ?? [];
$configuracion = $data["configuracion"] ?? [];
$tipoPedido = $data["tipoPedido"] ?? "normal";

// Validaciones básicas
if (empty($facturasIds)) {
    echo json_encode(["success" => false, "message" => "No se seleccionaron facturas"]);
    exit;
}

if (!$configuracion) {
    echo json_encode(["success" => false, "message" => "No hay configuración de despacho"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // OBTENER DATOS DE LAS FACTURAS SELECCIONADAS
    $placeholders = str_repeat('?,', count($facturasIds) - 1) . '?';
    
    $sqlFacturas = "SELECT 
        Id_EncabInvoice,
        Fecha,
        IdAerolinea,
        GuiaMaster,
        GuiaHija,
        Id_Consignatario,
        IdAgencia,
        CantidadEstibas,
        TipoPedido
    FROM EncabInvoice 
    WHERE Id_EncabInvoice IN ($placeholders)";
    
    $stmtFacturas = $enlace->prepare($sqlFacturas);
    $tiposFacturas = str_repeat('i', count($facturasIds));
    $stmtFacturas->bind_param($tiposFacturas, ...$facturasIds);
    $stmtFacturas->execute();
    
    $stmtFacturas->bind_result(
        $idFactura,
        $fechaFactura,
        $idAerolinea,
        $guiaMaster,
        $guiaHija,
        $idConsignatario,
        $idAgencia,
        $cantidadEstibas,
        $tipoPedidoFactura
    );
    
    $facturasData = [];
    $fechas = [];
    $aerolineas = [];
    $guiasMaster = [];
    $guiasHija = [];
    $consignatarios = [];
    $agencias = [];
    $totalPiezas = 0;
    
    while ($stmtFacturas->fetch()) {
        $facturasData[] = [
            'Id_EncabInvoice' => $idFactura,
            'Fecha' => $fechaFactura,
            'IdAerolinea' => $idAerolinea,
            'GuiaMaster' => $guiaMaster,
            'GuiaHija' => $guiaHija,
            'Id_Consignatario' => $idConsignatario,
            'IdAgencia' => $idAgencia,
            'CantidadEstibas' => $cantidadEstibas,
            'TipoPedido' => $tipoPedidoFactura
        ];
        
        $fechas[] = $fechaFactura;
        $aerolineas[] = $idAerolinea;
        $guiasMaster[] = $guiaMaster;
        $guiasHija[] = $guiaHija;
        $consignatarios[] = $idConsignatario;
        $agencias[] = $idAgencia;
        $totalPiezas += $cantidadEstibas;
    }
    $stmtFacturas->close();
    
    if (empty($facturasData)) {
        throw new Exception("No se encontraron las facturas seleccionadas");
    }
    
    // VALIDAR CONSISTENCIA DE DATOS
    if (count(array_unique($fechas)) > 1) {
        throw new Exception("Las facturas seleccionadas tienen fechas diferentes");
    }
    
    if (count(array_unique($aerolineas)) > 1) {
        throw new Exception("Las facturas seleccionadas tienen aerolíneas diferentes");
    }
    
    if (count(array_unique($consignatarios)) > 1) {
        throw new Exception("Las facturas seleccionadas tienen consignatarios diferentes");
    }
    
    if (count(array_unique($agencias)) > 1) {
        throw new Exception("Las facturas seleccionadas tienen agencias diferentes");
    }
    
    // PREPARAR DATOS PARA LA PLANILLA
    $fechaPlanilla = $fechas[0];
    $idAerolineaPlanilla = $aerolineas[0];
    $guiaMasterPlanilla = $guiasMaster[0];
    $guiaHijaPlanilla = $guiasHija[0];
    $idConsignatarioPlanilla = $consignatarios[0];
    $idAgenciaPlanilla = $agencias[0];
    
    // Lista de facturas con formato FEX-2324, FEX-2325
    $numerosFacturasFormateados = [];
    foreach ($facturasData as $factura) {
        $prefijo = $factura['TipoPedido'] === 'sample' ? 'FEX-' : 'FEX-';
        $numerosFacturasFormateados[] = $prefijo . $factura['Id_EncabInvoice'];
    }
    $facturasString = implode(', ', $numerosFacturasFormateados);
    
    // Datos de la configuración
    $precinto = limpiar_texto($configuracion["precintoSeguridad"] ?? "");
    $idConductor = validar_entero($configuracion["conductor"]["id"] ?? null);
    $idAyudante = validar_entero($configuracion["ayudante"]["id"] ?? null);
    $placa = limpiar_texto($configuracion["placaVehiculo"] ?? "");
    $vehiculo = limpiar_texto($configuracion["descripcionVehiculo"] ?? "");
    
    // Validar datos de configuración
    if (!$idConductor) {
        throw new Exception("Conductor no válido");
    }
    
    if (!$precinto) {
        throw new Exception("Precinto no válido");
    }
    
    if (!$placa) {
        throw new Exception("Placa del vehículo no válida");
    }
    
    // INSERTAR EN TABLA PLANILLAS
    $sqlPlanilla = "INSERT INTO Planillas 
        (Fecha, IdAerolinea, Facturas, GuiaMaster, GuiaHija, Id_Consignatario, TotalPiezas, Precinto, IdAgencia, Id_Conductor, Id_Ayudante, Placa, Vehiculo) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmtPlanilla = $enlace->prepare($sqlPlanilla);
    $stmtPlanilla->bind_param(
        "sisssiisiiiss", 
        $fechaPlanilla,
        $idAerolineaPlanilla,
        $facturasString,
        $guiaMasterPlanilla,
        $guiaHijaPlanilla,
        $idConsignatarioPlanilla,
        $totalPiezas,
        $precinto,
        $idAgenciaPlanilla,
        $idConductor,
        $idAyudante,
        $placa,
        $vehiculo
    );
    
    $stmtPlanilla->execute();
    
    if ($stmtPlanilla->affected_rows <= 0) {
        throw new Exception("Error al crear la planilla");
    }
    
    $idPlanilla = $enlace->insert_id;
    
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
        "consignatario" => $idConsignatarioPlanilla,
        "tipoPedido" => "mixto"
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
?>