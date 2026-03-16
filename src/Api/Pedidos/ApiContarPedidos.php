<?php
//src/Api/Pedidos/ApiContarPedidos.php - VERSIÓN MEJORADA
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

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos"]);
    exit;
}

// 👇 NUEVO: Obtener modo de búsqueda
$modo = $data["modo"] ?? "porFechas"; // "porFechas" o "porNumeros"
$bodegaId = $data["bodegaId"] ?? "";
$tipoDocumento = $data["tipoDocumento"] ?? "listaempaque";

try {
    $total = 0;
    $sql = "";
    $params = [];
    $types = "";
    
    if ($modo === "porFechas") {
        // 👇 MODO POR FECHAS (existente)
        $fechaDesde = $data["fechaDesde"] ?? "";
        $fechaHasta = $data["fechaHasta"] ?? "";
        
        if (empty($fechaDesde) || empty($fechaHasta)) {
            echo json_encode(["success" => false, "message" => "Fechas requeridas para modo por fechas"]);
            exit;
        }
        
        $sql = "SELECT COUNT(*) as total 
                FROM EncabPedido ep
                WHERE (ep.FechaSalida BETWEEN ? AND ?) AND ep.Estado = 'Activo'";
        
        $params = [$fechaDesde, $fechaHasta];
        $types = "ss";
        
    } else if ($modo === "porNumeros") {
        // 👇 NUEVO MODO POR NÚMEROS
        $numeroDesde = $data["numeroDesde"] ?? 0;
        $numeroHasta = $data["numeroHasta"] ?? 0;
        
        if ($numeroDesde <= 0 || $numeroHasta <= 0) {
            echo json_encode(["success" => false, "message" => "Números de pedido requeridos para modo por números"]);
            exit;
        }
        
        // Validar límite de 50 pedidos
        $cantidad = $numeroHasta - $numeroDesde + 1;
        if ($cantidad > 50) {
            echo json_encode([
                "success" => false, 
                "message" => "Límite máximo de 50 pedidos excedido. Seleccionó {$cantidad} pedidos."
            ]);
            exit;
        }
        
        if ($numeroDesde > $numeroHasta) {
            echo json_encode(["success" => false, "message" => "El número 'Desde' no puede ser mayor que 'Hasta'"]);
            exit;
        }
        
        $sql = "SELECT COUNT(*) as total 
                FROM EncabPedido ep
                WHERE (ep.Id_EncabPedido BETWEEN ? AND ?) AND ep.Estado = 'Activo'";
        
        $params = [$numeroDesde, $numeroHasta];
        $types = "ii";
        
    } else {
        echo json_encode(["success" => false, "message" => "Modo de búsqueda no válido"]);
        exit;
    }
    
    // 👇 AGREGAR FILTRO DE BODEGA (común para ambos modos)
    if (!empty($bodegaId)) {
        $sql .= " AND ep.Id_Bodega = ?";
        $params[] = $bodegaId;
        $types .= "i";
    }
    
    // Ejecutar consulta
    $stmt = $enlace->prepare($sql);
    
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Error preparando consulta: " . $enlace->error]);
        exit;
    }
    
    // Vincular parámetros dinámicamente
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $stmt->bind_result($total);
    $stmt->fetch();
    $stmt->close();

    // 👇 INFORMACIÓN ADICIONAL PARA DEBUG
    $infoFiltros = [
        "modo" => $modo,
        "bodegaId" => $bodegaId,
        "tipoDocumento" => $tipoDocumento,
        "total" => $total
    ];
    
    if ($modo === "porFechas") {
        $infoFiltros["fechaDesde"] = $data["fechaDesde"] ?? "";
        $infoFiltros["fechaHasta"] = $data["fechaHasta"] ?? "";
    } else {
        $infoFiltros["numeroDesde"] = $data["numeroDesde"] ?? 0;
        $infoFiltros["numeroHasta"] = $data["numeroHasta"] ?? 0;
    }

    echo json_encode([
        "success" => true,
        "total" => $total,
        "filtros" => $infoFiltros,
        "mensaje" => "Se encontraron {$total} pedidos"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => "Error: " . $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}

$enlace->close();
?>