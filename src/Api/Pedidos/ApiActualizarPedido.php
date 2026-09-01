<?php
header("Content-Type: application/json");

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
function limpiar_texto($txt)
{
    return trim($txt); // 👈 SOLO trim, sin htmlspecialchars
}

function limpiar_descripcion($txt)
{
    // 👈 Para campos de descripción, solo trim y mantener caracteres especiales
    return trim($txt);
}
function validar_entero($valor)
{
    return filter_var($valor, FILTER_VALIDATE_INT) !== false ? intval($valor) : null;
}
function validar_flotante($valor)
{
    return filter_var($valor, FILTER_VALIDATE_FLOAT) !== false ? floatval($valor) : null;
}
function validar_tinyint($valor)
{
    // Para TINYINT: convertir boolean a 1/0, cualquier valor truthy a 1, falsy a 0
    if ($valor === true || $valor === 1 || $valor === '1' || $valor === -1) {
        return 1;
    }
    return 0;
}

// Extraer datos
$encabezado = $data["encabezado"] ?? [];
$detalle = $data["detalle"] ?? [];

$idPedido = validar_entero($encabezado["pedidoId"] ?? null);
$idCliente = validar_entero($encabezado["clienteId"] ?? null);
$idClienteRegion = validar_entero($encabezado["regionId"] ?? null);
$idTransportadora = validar_entero($encabezado["transportadoraId"] ?? null);
$idBodega = validar_entero($encabezado["bodegaId"] ?? null);
$idAerolinea = validar_entero($encabezado["aerolineaId"] ?? null);
$idAgencia = validar_entero($encabezado["agenciaId"] ?? null);
$purchaseOrder = limpiar_texto($encabezado["purchaseOrder"] ?? "");
$fechaOrden = limpiar_texto($encabezado["fechaOrden"] ?? "");
$fechaSalida = limpiar_texto($encabezado["fechaSalida"] ?? "");
$fechaEnroute = limpiar_texto($encabezado["fechaEnroute"] ?? "");
$fechaDelivery = limpiar_texto($encabezado["fechaDelivery"] ?? "");
$fechaIngreso = limpiar_texto($encabezado["fechaIngreso"] ?? "");
$cantidadEstibas = validar_flotante($encabezado["cantidadEstibas"] ?? null);
$observaciones = limpiar_texto($encabezado["comentarios"] ?? "");
$guiaMaster = limpiar_texto($encabezado["noGuia"] ?? "");
$guiaHija = limpiar_texto($encabezado["guiaHija"] ?? "");

// 👇 NUEVO: Extraer y convertir comentarios seleccionados a TINYINT
$comentariosSeleccionados = $encabezado["comentariosSeleccionados"] ?? [];
$comentarioPrimario = validar_tinyint($comentariosSeleccionados["incluirPrimario"] ?? false);
$comentarioSecundario = validar_tinyint($comentariosSeleccionados["incluirSecundario"] ?? false);

// Validaciones obligatorias
if (!$idCliente || !$idTransportadora || !$idBodega || !$fechaOrden || empty($detalle)) {
    echo json_encode(["success" => false, "message" => "Faltan datos obligatorios"]);
    exit;
}

try {
    $enlace->begin_transaction();

    // ── 1. TRACKING ENCABEZADO: leer fechas actuales antes de actualizar ──
    $dbFechaOrden = null;
    $dbFechaSalida = null;
    $dbFechaEnroute = null;
    $dbFechaDelivery = null;
    $dbFechaIngreso = null;
    $dbFechaOrdenOrig = null;

    $stmtLecEnc = $enlace->prepare(
        "SELECT FechaOrden, FechaSalida, FechaEnroute, FechaDelivery, FechaIngreso, FechaOrden_Orig
         FROM EncabPedido WHERE Id_EncabPedido = ?"
    );
    $stmtLecEnc->bind_param("i", $idPedido);
    $stmtLecEnc->execute();
    $stmtLecEnc->bind_result($dbFechaOrden, $dbFechaSalida, $dbFechaEnroute, $dbFechaDelivery, $dbFechaIngreso, $dbFechaOrdenOrig);
    $stmtLecEnc->fetch();
    $stmtLecEnc->close();

    $fechasChanged = (
        $fechaOrden   !== $dbFechaOrden   ||
        $fechaSalida  !== $dbFechaSalida  ||
        $fechaEnroute !== $dbFechaEnroute ||
        $fechaDelivery !== $dbFechaDelivery ||
        $fechaIngreso !== $dbFechaIngreso
    );

    // Solo guardar originales en la primera modificación
    if ($fechasChanged && ($dbFechaOrdenOrig === null || $dbFechaOrdenOrig === '')) {
        $stmtFecOrig = $enlace->prepare(
            "UPDATE EncabPedido
             SET FechaOrden_Orig = ?, FechaSalida_Orig = ?, FechaEnroute_Orig = ?,
                 FechaDelivery_Orig = ?, FechaIngreso_Orig = ?, FechaModificacion = NOW()
             WHERE Id_EncabPedido = ?"
        );
        $stmtFecOrig->bind_param("sssssi", $dbFechaOrden, $dbFechaSalida, $dbFechaEnroute, $dbFechaDelivery, $dbFechaIngreso, $idPedido);
        $stmtFecOrig->execute();
        $stmtFecOrig->close();
    }

    // ── 2. UPDATE ENCABEZADO ──────────────────────────────────────────────
    $sqlEnc = "UPDATE EncabPedido  
        SET Id_Cliente = ?, Id_ClienteRegion = ?, Id_Transportadora = ?, Id_Bodega = ?, PurchaseOrder = ?, FechaOrden = ?, FechaSalida = ?, FechaEnroute = ?, FechaDelivery = ?, FechaIngreso = ?, CantidadEstibas = ?, IdAerolinea = ?, IdAgencia = ?, GuiaMaster = ?, GuiaHija = ?, Observaciones = ?, ComentarioPrimario = ?, ComentarioSecundario = ?
        WHERE Id_EncabPedido = ?";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param(
        "iiiissssssdiisssiii",
        $idCliente,
        $idClienteRegion,
        $idTransportadora,
        $idBodega,
        $purchaseOrder,
        $fechaOrden,
        $fechaSalida,
        $fechaEnroute,
        $fechaDelivery,
        $fechaIngreso,
        $cantidadEstibas,
        $idAerolinea,
        $idAgencia,
        $guiaMaster,
        $guiaHija,
        $observaciones,
        $comentarioPrimario,
        $comentarioSecundario,
        $idPedido
    );
    $stmtEnc->execute();
    $stmtEnc->close();

    // ── 3. OBTENER IDs ACTUALES EN BD PARA ESTE PEDIDO ───────────────────
    $idsEnBD = [];
    $stmtIdsActuales = $enlace->prepare(
        "SELECT Id_DetPedido FROM DetPedido WHERE Id_EncabPedido = ?"
    );
    $stmtIdsActuales->bind_param("i", $idPedido);
    $stmtIdsActuales->execute();
    $stmtIdsActuales->bind_result($idDetTemp);
    while ($stmtIdsActuales->fetch()) {
        $idsEnBD[] = $idDetTemp;
    }
    $stmtIdsActuales->close();

    // ── 4. IDs VÁLIDOS QUE VIENEN EN EL PAYLOAD ──────────────────────────
    $idsEntrantes = [];
    foreach ($detalle as $item) {
        $idDet = validar_entero($item["id"] ?? null);
        if ($idDet && $idDet > 0 && in_array($idDet, $idsEnBD)) {
            $idsEntrantes[] = $idDet;
        }
    }

    // ── 5. ÍTEMS A ELIMINAR: en BD pero no en el payload ─────────────────
    $idsEliminar = array_diff($idsEnBD, $idsEntrantes);

    foreach ($idsEliminar as $idEliminar) {
        $eId = null;
        $eProd = null;
        $eDesc = null;
        $eEmb = null;
        $eCant = null;
        $ePesoN = null;
        $ePesoB = null;
        $ePrec = null;

        $stmtLeerElim = $enlace->prepare(
            "SELECT Id_DetPedido, Id_Producto, Descripcion, Id_Embalaje,
                    Cantidad, PesoNeto, PesoBruto, PrecioUnitario
             FROM DetPedido WHERE Id_DetPedido = ?"
        );
        $stmtLeerElim->bind_param("i", $idEliminar);
        $stmtLeerElim->execute();
        $stmtLeerElim->bind_result($eId, $eProd, $eDesc, $eEmb, $eCant, $ePesoN, $ePesoB, $ePrec);
        $stmtLeerElim->fetch();
        $stmtLeerElim->close();

        if ($eId) {
            $stmtInsElim = $enlace->prepare(
                "INSERT INTO pedidos_items_eliminados
                 (Id_DetPedido_Orig, Id_EncabPedido, Id_Producto, Descripcion,
                  Id_Embalaje, Cantidad, PesoNeto, PesoBruto, PrecioUnitario)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmtInsElim->bind_param("iiisidddd", $eId, $idPedido, $eProd, $eDesc, $eEmb, $eCant, $ePesoN, $ePesoB, $ePrec);
            $stmtInsElim->execute();
            $stmtInsElim->close();

            $stmtDelItem = $enlace->prepare("DELETE FROM DetPedido WHERE Id_DetPedido = ?");
            $stmtDelItem->bind_param("i", $idEliminar);
            $stmtDelItem->execute();
            $stmtDelItem->close();
        }
    }

    // ── 6. PROCESAR CADA ÍTEM: UPDATE (existente) o INSERT (nuevo) ───────
    foreach ($detalle as $item) {
        $idDetItem  = validar_entero($item["id"] ?? null);
        $idProducto = validar_entero($item["producto"] ?? null);
        $descripcion = limpiar_descripcion($item["descripcion"] ?? "");
        $idEmbalaje = validar_entero($item["embalaje"] ?? null);
        $cantidad   = validar_flotante($item["cantidad"] ?? null);
        $pesoNeto   = validar_flotante($item["pesoNeto"] ?? null);
        $pesoBruto  = validar_flotante($item["pesoBruto"] ?? null);
        $precio     = validar_flotante($item["precio"] ?? null);

        if (!$idProducto || !$descripcion || !$idEmbalaje || !$cantidad || !$precio) {
            throw new Exception("Datos inválidos en detalle");
        }

        $esExistente = ($idDetItem && $idDetItem > 0 && in_array($idDetItem, $idsEnBD));

        if ($esExistente) {
            // Leer valores actuales para comparar
            $dbProd = null;
            $dbDesc = null;
            $dbEmb = null;
            $dbCant = null;
            $dbPesoN = null;
            $dbPesoB = null;
            $dbPrec = null;
            $dbProdOrig = null;

            $stmtLeer = $enlace->prepare(
                "SELECT Id_Producto, Descripcion, Id_Embalaje, Cantidad,
                        PesoNeto, PesoBruto, PrecioUnitario, Id_Producto_Orig
                 FROM DetPedido WHERE Id_DetPedido = ?"
            );
            $stmtLeer->bind_param("i", $idDetItem);
            $stmtLeer->execute();
            $stmtLeer->bind_result($dbProd, $dbDesc, $dbEmb, $dbCant, $dbPesoN, $dbPesoB, $dbPrec, $dbProdOrig);
            $stmtLeer->fetch();
            $stmtLeer->close();

            $itemChanged = (
                $idProducto != $dbProd ||
                $descripcion !== $dbDesc ||
                $idEmbalaje != $dbEmb ||
                abs(($cantidad   ?? 0) - ($dbCant  ?? 0)) > 0.0001 ||
                abs(($pesoNeto  ?? 0) - ($dbPesoN ?? 0)) > 0.0001 ||
                abs(($pesoBruto ?? 0) - ($dbPesoB ?? 0)) > 0.0001 ||
                abs(($precio    ?? 0) - ($dbPrec  ?? 0)) > 0.0001
            );
            $yaGuardoOrig = ($dbProdOrig !== null && $dbProdOrig > 0);

            if ($itemChanged && !$yaGuardoOrig) {
                // Primera modificación: guardar valores originales junto con los nuevos
                $stmtUpOrig = $enlace->prepare(
                    "UPDATE DetPedido SET
                         Id_Producto = ?, Descripcion = ?, Id_Embalaje = ?,
                         Cantidad = ?, PesoNeto = ?, PesoBruto = ?, PrecioUnitario = ?,
                         Id_Producto_Orig = ?, Descripcion_Orig = ?, Id_Embalaje_Orig = ?,
                         Cantidad_Orig = ?, PesoNeto_Orig = ?, PesoBruto_Orig = ?, PrecioUnitario_Orig = ?,
                         FechaModificacion = NOW()
                     WHERE Id_DetPedido = ?"
                );
                $stmtUpOrig->bind_param(
                    "isiddddisiddddi",
                    $idProducto,
                    $descripcion,
                    $idEmbalaje,
                    $cantidad,
                    $pesoNeto,
                    $pesoBruto,
                    $precio,
                    $dbProd,
                    $dbDesc,
                    $dbEmb,
                    $dbCant,
                    $dbPesoN,
                    $dbPesoB,
                    $dbPrec,
                    $idDetItem
                );
                $stmtUpOrig->execute();
                $stmtUpOrig->close();
            } else {
                // Sin cambio o ya tenía originales: solo actualizar valores
                $stmtUp = $enlace->prepare(
                    "UPDATE DetPedido SET
                         Id_Producto = ?, Descripcion = ?, Id_Embalaje = ?,
                         Cantidad = ?, PesoNeto = ?, PesoBruto = ?, PrecioUnitario = ?
                     WHERE Id_DetPedido = ?"
                );
                $stmtUp->bind_param("isiddddi", $idProducto, $descripcion, $idEmbalaje, $cantidad, $pesoNeto, $pesoBruto, $precio, $idDetItem);
                $stmtUp->execute();
                $stmtUp->close();
            }
        } else {
            // Ítem nuevo: INSERT
            $stmtIns = $enlace->prepare(
                "INSERT INTO DetPedido
                 (Id_EncabPedido, Id_Producto, Descripcion, Id_Embalaje, Cantidad, PesoNeto, PesoBruto, PrecioUnitario)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmtIns->bind_param("iisidddd", $idPedido, $idProducto, $descripcion, $idEmbalaje, $cantidad, $pesoNeto, $pesoBruto, $precio);
            $stmtIns->execute();
            if ($stmtIns->affected_rows <= 0) {
                throw new Exception("Error al insertar detalle nuevo");
            }
            $stmtIns->close();
        }
    }

    $enlace->commit();

    echo json_encode(["success" => true, "idPedido" => $idPedido]);
} catch (Exception $e) {
    $enlace->rollback();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();
