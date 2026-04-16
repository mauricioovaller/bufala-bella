<?php

/**
 * ApiEstructuraBD.php
 * 
 * Endpoint seguro para obtener estructura de base de datos
 * Propósito: Devolver información de tablas y columnas en JSON
 * Para: MCP y visualización de arquitectura de BD
 * 
 * Seguridad:
 * - Solo consultas SELECT
 * - No modifica datos
 * - Usa INFORMATION_SCHEMA
 * 
 * Uso:
 * POST /Api/Admin/ApiEstructuraBD.php
 * {
 *   "accion": "tablas" | "estructura" | "completa",
 *   "tabla": "nombre_tabla" (opcional)
 * }
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ===== VALIDACIÓN POR API KEY =====
// Este endpoint no requiere sesión, usa API Key en su lugar
const API_KEY_MCP = "mcp_estructura_bd_2024";

// Validar método
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método no permitido. Use POST."]);
    exit;
}

try {
    // Obtener parámetros
    $input = json_decode(file_get_contents("php://input"), true);

    // Validar API Key
    $api_key = $input['api_key'] ?? '';
    if ($api_key !== API_KEY_MCP) {
        http_response_code(401);
        throw new Exception("API Key inválida o no proporcionada");
    }

    $accion = $input['accion'] ?? 'completa';
    $tabla_especifica = $input['tabla'] ?? null;

    // Incluir conexión a BD DESPUÉS de validar API Key
    include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
    $enlace->set_charset("utf8mb4");

    // Obtener nombre de la BD actual
    $result_bd = $enlace->query("SELECT DATABASE()");
    $row = $result_bd->fetch_row();
    $database_actual = $row[0];
    $result_bd->close();

    // ===== ACCIÓN 1: LISTAR TABLAS =====
    if ($accion === 'tablas' || $accion === 'completa') {
        $sql_tablas = "SELECT 
            TABLE_NAME,
            TABLE_ROWS,
            DATA_LENGTH,
            INDEX_LENGTH,
            TABLE_COLLATION,
            TABLE_COMMENT
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME";

        $stmt_tablas = $enlace->prepare($sql_tablas);
        if (!$stmt_tablas) {
            throw new Exception("Error en preparación: " . $enlace->error);
        }

        $stmt_tablas->bind_param("s", $database_actual);
        $stmt_tablas->execute();
        $result = $stmt_tablas->get_result();

        $tablas = [];
        while ($row = $result->fetch_assoc()) {
            $tablas[] = [
                'nombre' => $row['TABLE_NAME'],
                'filas' => (int)$row['TABLE_ROWS'],
                'tamaño_datos_kb' => round($row['DATA_LENGTH'] / 1024, 2),
                'tamaño_índices_kb' => round($row['INDEX_LENGTH'] / 1024, 2),
                'colación' => $row['TABLE_COLLATION'],
                'comentario' => $row['TABLE_COMMENT']
            ];
        }
        $stmt_tablas->close();
    }

    // ===== ACCIÓN 2: ESTRUCTURA DETALLADA =====
    if ($accion === 'estructura' || $accion === 'completa') {
        $estructura = [];

        // Si se especifica tabla, solo esa. Si no, todas.
        if ($tabla_especifica) {
            $tablas_a_procesar = [$tabla_especifica];
        } else {
            $tablas_a_procesar = array_column($tablas ?? [], 'nombre');
        }

        foreach ($tablas_a_procesar as $tabla) {
            $sql_columnas = "SELECT 
                COLUMN_NAME,
                ORDINAL_POSITION,
                COLUMN_DEFAULT,
                IS_NULLABLE,
                COLUMN_TYPE,
                COLUMN_KEY,
                EXTRA,
                COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION";

            $stmt_cols = $enlace->prepare($sql_columnas);
            if (!$stmt_cols) {
                throw new Exception("Error en preparación: " . $enlace->error);
            }

            $stmt_cols->bind_param("ss", $database_actual, $tabla);
            $stmt_cols->execute();
            $result_cols = $stmt_cols->get_result();

            $columnas = [];
            while ($col = $result_cols->fetch_assoc()) {
                $columnas[] = [
                    'nombre' => $col['COLUMN_NAME'],
                    'posicion' => (int)$col['ORDINAL_POSITION'],
                    'tipo' => $col['COLUMN_TYPE'],
                    'nulo' => $col['IS_NULLABLE'] === 'YES',
                    'default' => $col['COLUMN_DEFAULT'],
                    'clave' => $col['COLUMN_KEY'] ?: 'NONE',
                    'extra' => $col['EXTRA'],
                    'comentario' => $col['COLUMN_COMMENT']
                ];
            }
            $stmt_cols->close();

            // Obtener índices
            $sql_indices = "SELECT 
                INDEX_NAME,
                SEQ_IN_INDEX,
                COLUMN_NAME,
                NON_UNIQUE
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY INDEX_NAME, SEQ_IN_INDEX";

            $stmt_idx = $enlace->prepare($sql_indices);
            if (!$stmt_idx) {
                throw new Exception("Error en preparación: " . $enlace->error);
            }

            $stmt_idx->bind_param("ss", $database_actual, $tabla);
            $stmt_idx->execute();
            $result_idx = $stmt_idx->get_result();

            $indices = [];
            while ($idx = $result_idx->fetch_assoc()) {
                $nombre_idx = $idx['INDEX_NAME'];
                if (!isset($indices[$nombre_idx])) {
                    $indices[$nombre_idx] = [
                        'nombre' => $nombre_idx,
                        'columnas' => [],
                        'es_unico' => !$idx['NON_UNIQUE']
                    ];
                }
                $indices[$nombre_idx]['columnas'][] = $idx['COLUMN_NAME'];
            }
            $stmt_idx->close();

            $estructura[$tabla] = [
                'columnas' => $columnas,
                'indices' => array_values($indices)
            ];
        }
    }

    // ===== RESPUESTA =====
    $respuesta = [
        "success" => true,
        "base_de_datos" => $database_actual,
        "timestamp" => date('Y-m-d H:i:s'),
        "accion" => $accion
    ];

    if (in_array($accion, ['tablas', 'completa'])) {
        $respuesta['tablas'] = $tablas ?? [];
        $respuesta['cantidad_tablas'] = count($tablas ?? []);
    }

    if (in_array($accion, ['estructura', 'completa'])) {
        $respuesta['estructura'] = $estructura ?? [];
    }

    http_response_code(200);
    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
} finally {
    if (isset($enlace)) {
        $enlace->close();
    }
}
