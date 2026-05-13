<?php

/**
 * API: Gestión de Cuentas de Correo SMTP
 * Descripción: CRUD para configuración de cuentas de correo remitente
 * Rutas:
 *   - POST: listar, crear, actualizar, eliminar, obtener_predeterminada, probar_conexion
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Obtener datos de la solicitud
$data = json_decode(file_get_contents("php://input"), true);
$accion = $data['accion'] ?? $_GET['accion'] ?? 'listar';

try {
    switch ($accion) {
        case 'listar':
            listarCuentas($enlace, $data);
            break;

        case 'obtener':
            obtenerCuenta($enlace, $data);
            break;

        case 'crear':
            crearCuenta($enlace, $data);
            break;

        case 'actualizar':
            actualizarCuenta($enlace, $data);
            break;

        case 'eliminar':
            eliminarCuenta($enlace, $data);
            break;

        case 'obtener_predeterminada':
            obtenerPredeterminada($enlace);
            break;

        case 'establecer_predeterminada':
            establecerPredeterminada($enlace, $data);
            break;

        case 'probar_conexion':
            probarConexionSMTP($enlace, $data);
            break;

        case 'listar_activas':
            listarCuentasActivas($enlace);
            break;

        default:
            echo json_encode(["success" => false, "message" => "Acción no válida"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}

$enlace->close();

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Listar todas las cuentas configuradas
 */
function listarCuentas($enlace, $data)
{
    $activas_solo = $data['activas_solo'] ?? false;

    $sql = "SELECT id, nombre, email_remitente, usuario_smtp, servidor_smtp, puerto, usar_tls, usar_ssl, 
                   predeterminada, activa, probada, ultima_prueba, fecha_creacion 
            FROM correos_cuentas_configuracion ";

    if ($activas_solo) {
        $sql .= "WHERE activa = 1 ";
    }

    $sql .= "ORDER BY predeterminada DESC, nombre ASC";

    $resultado = $enlace->query($sql);

    if (!$resultado) {
        echo json_encode(["success" => false, "message" => "Error en la consulta: " . $enlace->error]);
        return;
    }

    $cuentas = [];
    while ($fila = $resultado->fetch_assoc()) {
        // Castear explícitamente los valores a sus tipos correctos
        $fila['id'] = intval($fila['id']);
        $fila['puerto'] = intval($fila['puerto']);
        $fila['usar_tls'] = (bool) intval($fila['usar_tls']);
        $fila['usar_ssl'] = (bool) intval($fila['usar_ssl']);
        $fila['predeterminada'] = (bool) intval($fila['predeterminada']);
        $fila['activa'] = (bool) intval($fila['activa']);
        $fila['probada'] = (bool) intval($fila['probada']);

        $cuentas[] = $fila;
    }

    echo json_encode([
        "success" => true,
        "cuentas" => $cuentas,
        "total" => count($cuentas)
    ]);

    $resultado->free();
}

/**
 * Obtener una cuenta específica
 */
function obtenerCuenta($enlace, $data)
{
    $id = intval($data['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }

    $sql = "SELECT id, nombre, email_remitente, servidor_smtp, puerto, usuario_smtp, 
                   usar_tls, usar_ssl, predeterminada, activa, probada, ultima_prueba, 
                   fecha_creacion, fecha_actualizacion 
            FROM correos_cuentas_configuracion 
            WHERE id = ?";

    $stmt = $enlace->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Error preparando consulta: " . $enlace->error]);
        return;
    }

    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Error ejecutando consulta: " . $stmt->error]);
        $stmt->close();
        return;
    }

    $resultado = $stmt->get_result();
    if (!$resultado) {
        echo json_encode(["success" => false, "message" => "Error obteniendo resultados: " . $stmt->error]);
        $stmt->close();
        return;
    }

    $fila = $resultado->fetch_assoc();
    $stmt->close();

    if (!$fila) {
        echo json_encode(["success" => false, "message" => "Cuenta no encontrada"]);
        return;
    }

    // Retornar cuenta SIN contraseña
    echo json_encode([
        "success" => true,
        "cuenta" => [
            'id' => $fila['id'],
            'nombre' => $fila['nombre'],
            'email_remitente' => $fila['email_remitente'],
            'servidor_smtp' => $fila['servidor_smtp'],
            'puerto' => $fila['puerto'],
            'usuario_smtp' => $fila['usuario_smtp'],
            'usar_tls' => $fila['usar_tls'],
            'usar_ssl' => $fila['usar_ssl'],
            'predeterminada' => $fila['predeterminada'],
            'activa' => $fila['activa'],
            'probada' => $fila['probada'] ?? null,
            'ultima_prueba' => $fila['ultima_prueba'] ?? null,
            'fecha_creacion' => $fila['fecha_creacion'] ?? null,
            'fecha_actualizacion' => $fila['fecha_actualizacion'] ?? null
        ]
    ]);
}

/**
 * Crear nueva cuenta de correo
 * IMPORTANTE: Encriptar contraseña antes de guardar
 */
function crearCuenta($enlace, $data)
{
    $nombre = trim($data['nombre'] ?? '');
    $email_remitente = trim($data['email_remitente'] ?? '');
    $servidor_smtp = trim($data['servidor_smtp'] ?? '');
    $puerto = intval($data['puerto'] ?? 587);
    $usuario_smtp = trim($data['usuario_smtp'] ?? '');
    $contrasena_smtp = $data['contrasena_smtp'] ?? '';
    $usar_tls = intval($data['usar_tls'] ?? 1);
    $usar_ssl = intval($data['usar_ssl'] ?? 0);
    $predeterminada = intval($data['predeterminada'] ?? 0);

    // Validaciones
    if (empty($nombre) || empty($email_remitente) || empty($servidor_smtp) || empty($usuario_smtp) || empty($contrasena_smtp)) {
        echo json_encode(["success" => false, "message" => "Todos los campos son requeridos"]);
        return;
    }

    if (!filter_var($email_remitente, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Email remitente no válido"]);
        return;
    }

    if ($puerto < 1 || $puerto > 65535) {
        echo json_encode(["success" => false, "message" => "Puerto debe estar entre 1 y 65535"]);
        return;
    }

    // Verificar si el email ya existe
    $sqlCheck = "SELECT id FROM correos_cuentas_configuracion WHERE email_remitente = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    $stmtCheck->bind_param("s", $email_remitente);
    $stmtCheck->execute();
    $stmtCheck->store_result();

    if ($stmtCheck->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Este email de remitente ya está registrado"]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();

    // Encriptar contraseña
    $contrasena_encriptada = encriptarContrasena($contrasena_smtp);

    // Si es predeterminada, desactivar otras como predeterminadas
    if ($predeterminada) {
        $sqlUpdatePred = "UPDATE correos_cuentas_configuracion SET predeterminada = 0 WHERE predeterminada = 1";
        $enlace->query($sqlUpdatePred);
    }

    // Insertar nueva cuenta
    $sql = "INSERT INTO correos_cuentas_configuracion 
            (nombre, email_remitente, servidor_smtp, puerto, usuario_smtp, contrasena_smtp, 
             usar_tls, usar_ssl, predeterminada, activa) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

    $stmt = $enlace->prepare($sql);

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Error preparando consulta: " . $enlace->error]);
        return;
    }

    $stmt->bind_param(
        "sssissiii",
        $nombre,
        $email_remitente,
        $servidor_smtp,
        $puerto,
        $usuario_smtp,
        $contrasena_encriptada,
        $usar_tls,
        $usar_ssl,
        $predeterminada
    );

    if ($stmt->execute()) {
        $nuevoId = $stmt->insert_id;
        echo json_encode([
            "success" => true,
            "message" => "Cuenta creada exitosamente",
            "id" => $nuevoId,
            "cuenta" => [
                "id" => $nuevoId,
                "nombre" => $nombre,
                "email_remitente" => $email_remitente,
                "predeterminada" => $predeterminada,
                "activa" => 1
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al crear cuenta: " . $stmt->error]);
    }

    $stmt->close();
}

/**
 * Actualizar cuenta existente
 */
function actualizarCuenta($enlace, $data)
{
    $id = intval($data['id'] ?? 0);
    $nombre = isset($data['nombre']) ? trim($data['nombre']) : null;
    $servidor_smtp = isset($data['servidor_smtp']) ? trim($data['servidor_smtp']) : null;
    $puerto = isset($data['puerto']) ? intval($data['puerto']) : null;
    $usuario_smtp = isset($data['usuario_smtp']) ? trim($data['usuario_smtp']) : null;
    $contrasena_smtp = $data['contrasena_smtp'] ?? null;
    $usar_tls = isset($data['usar_tls']) ? intval($data['usar_tls']) : null;
    $usar_ssl = isset($data['usar_ssl']) ? intval($data['usar_ssl']) : null;
    $predeterminada = isset($data['predeterminada']) ? intval($data['predeterminada']) : null;
    $activa = isset($data['activa']) ? intval($data['activa']) : null;

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }

    // Verificar que la cuenta existe
    $sqlCheck = "SELECT id FROM correos_cuentas_configuracion WHERE id = ?";
    $stmtCheck = $enlace->prepare($sqlCheck);
    $stmtCheck->bind_param("i", $id);
    $stmtCheck->execute();
    $stmtCheck->store_result();

    if ($stmtCheck->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Cuenta no encontrada"]);
        $stmtCheck->close();
        return;
    }
    $stmtCheck->close();

    // Si se proporciona nueva contraseña, encriptarla
    if ($contrasena_smtp) {
        $contrasena_smtp = encriptarContrasena($contrasena_smtp);
    }

    // Si se marca como predeterminada, desactivar otras
    if ($predeterminada === 1) {
        $sqlUpdatePred = "UPDATE correos_cuentas_configuracion SET predeterminada = 0 WHERE id != ?";
        $stmtUpdatePred = $enlace->prepare($sqlUpdatePred);
        $stmtUpdatePred->bind_param("i", $id);
        $stmtUpdatePred->execute();
        $stmtUpdatePred->close();
    }

    // Construir UPDATE dinámicamente
    $campos = [];
    $tipos = "";
    $valores = [];

    if ($nombre !== null) {
        $campos[] = "nombre = ?";
        $tipos .= "s";
        $valores[] = $nombre;
    }
    if ($servidor_smtp !== null) {
        $campos[] = "servidor_smtp = ?";
        $tipos .= "s";
        $valores[] = $servidor_smtp;
    }
    if ($puerto !== null) {
        $campos[] = "puerto = ?";
        $tipos .= "i";
        $valores[] = $puerto;
    }
    if ($usuario_smtp !== null) {
        $campos[] = "usuario_smtp = ?";
        $tipos .= "s";
        $valores[] = $usuario_smtp;
    }
    if ($contrasena_smtp !== null) {
        $campos[] = "contrasena_smtp = ?";
        $tipos .= "s";
        $valores[] = $contrasena_smtp;
    }
    if ($usar_tls !== null) {
        $campos[] = "usar_tls = ?";
        $tipos .= "i";
        $valores[] = $usar_tls;
    }
    if ($usar_ssl !== null) {
        $campos[] = "usar_ssl = ?";
        $tipos .= "i";
        $valores[] = $usar_ssl;
    }
    if ($predeterminada !== null) {
        $campos[] = "predeterminada = ?";
        $tipos .= "i";
        $valores[] = $predeterminada;
    }
    if ($activa !== null) {
        $campos[] = "activa = ?";
        $tipos .= "i";
        $valores[] = $activa;
    }

    if (empty($campos)) {
        echo json_encode(["success" => false, "message" => "No hay campos para actualizar"]);
        return;
    }

    $sql = "UPDATE correos_cuentas_configuracion SET " . implode(", ", $campos) . " WHERE id = ?";
    $stmt = $enlace->prepare($sql);

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Error preparando query: " . $enlace->error]);
        return;
    }

    $tipos .= "i";
    $valores[] = $id;

    // Usar call_user_func_array para bind_param con parámetros dinámicos
    // IMPORTANTE: Los valores deben pasarse por referencia para bind_param
    $referencias_valores = [];
    foreach ($valores as &$valor) {
        $referencias_valores[] = &$valor;
    }
    call_user_func_array([$stmt, 'bind_param'], array_merge([$tipos], $referencias_valores));

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Cuenta actualizada exitosamente"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar: " . $stmt->error]);
    }

    $stmt->close();
}

/**
 * Eliminar (desactivar) una cuenta
 */
function eliminarCuenta($enlace, $data)
{
    $id = intval($data['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }

    // Marcar como inactiva en lugar de borrar
    $sql = "UPDATE correos_cuentas_configuracion SET activa = 0 WHERE id = ?";
    $stmt = $enlace->prepare($sql);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        // Si era predeterminada, establecer otra como predeterminada
        $sqlUpdatePred = "UPDATE correos_cuentas_configuracion 
                         SET predeterminada = 1 
                         WHERE activa = 1 AND id != ? 
                         LIMIT 1";
        $stmtUpdatePred = $enlace->prepare($sqlUpdatePred);
        $stmtUpdatePred->bind_param("i", $id);
        $stmtUpdatePred->execute();
        $stmtUpdatePred->close();

        echo json_encode([
            "success" => true,
            "message" => "Cuenta desactivada exitosamente"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al eliminar: " . $stmt->error]);
    }

    $stmt->close();
}

/**
 * Obtener cuenta predeterminada
 */
function obtenerPredeterminada($enlace)
{
    $sql = "SELECT id, nombre, email_remitente, servidor_smtp, puerto, usuario_smtp,
                   usar_tls, usar_ssl, predeterminada, activa, probada
            FROM correos_cuentas_configuracion 
            WHERE predeterminada = 1 AND activa = 1 
            LIMIT 1";

    $resultado = $enlace->query($sql);

    if (!$resultado) {
        echo json_encode(["success" => false, "message" => "Error en la consulta"]);
        return;
    }

    if ($resultado->num_rows > 0) {
        $cuenta = $resultado->fetch_assoc();
        // NO incluir contraseña
        echo json_encode(["success" => true, "cuenta" => $cuenta]);
    } else {
        echo json_encode(["success" => false, "message" => "No hay cuenta predeterminada configurada"]);
    }

    $resultado->free();
}

/**
 * Establecer una cuenta como predeterminada
 */
function establecerPredeterminada($enlace, $data)
{
    $id = intval($data['id'] ?? 0);

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID requerido"]);
        return;
    }

    // Desactivar todas las predeterminadas
    $sql1 = "UPDATE correos_cuentas_configuracion SET predeterminada = 0";
    $enlace->query($sql1);

    // Activar esta como predeterminada
    $sql2 = "UPDATE correos_cuentas_configuracion SET predeterminada = 1 WHERE id = ?";
    $stmt = $enlace->prepare($sql2);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Cuenta establecida como predeterminada"
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar: " . $stmt->error]);
    }

    $stmt->close();
}

/**
 * Listar solo cuentas activas
 */
function listarCuentasActivas($enlace)
{
    $sql = "SELECT id, nombre, email_remitente, usuario_smtp, servidor_smtp, puerto, predeterminada, activa
            FROM correos_cuentas_configuracion 
            WHERE activa = 1 
            ORDER BY predeterminada DESC, nombre ASC";

    $resultado = $enlace->query($sql);

    if (!$resultado) {
        echo json_encode(["success" => false, "message" => "Error en la consulta"]);
        return;
    }

    $cuentas = [];
    while ($fila = $resultado->fetch_assoc()) {
        // Castear explícitamente los valores a sus tipos correctos
        $fila['id'] = intval($fila['id']);
        $fila['puerto'] = intval($fila['puerto']);
        $fila['predeterminada'] = (bool) intval($fila['predeterminada']);
        $fila['activa'] = (bool) intval($fila['activa']);

        $cuentas[] = $fila;
    }

    echo json_encode([
        "success" => true,
        "cuentas" => $cuentas,
        "total" => count($cuentas)
    ]);

    $resultado->free();
}

/**
 * Probar conexión a servidor SMTP
 * NOTA: Requiere librería PHPMailer o similar
 * Por ahora retorna estructura preparada para validación
 */
function probarConexionSMTP($enlace, $data)
{
    $id = intval($data['id'] ?? 0);
    $email_prueba = trim($data['email_prueba'] ?? '');

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID de cuenta requerido"]);
        return;
    }

    if (empty($email_prueba)) {
        echo json_encode(["success" => false, "message" => "Email de prueba requerido"]);
        return;
    }

    // Obtener datos de la cuenta usando prepared statement
    $stmt = $enlace->prepare("SELECT id, nombre, email_remitente, servidor_smtp, puerto, usuario_smtp, contrasena_smtp, usar_tls, usar_ssl, predeterminada, activa 
            FROM correos_cuentas_configuracion 
            WHERE id = ? AND activa = 1 LIMIT 1");

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Error al preparar consulta"]);
        return;
    }

    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->bind_result($r_id, $r_nombre, $r_email_remitente, $r_servidor_smtp, $r_puerto, $r_usuario_smtp, $r_contrasena_smtp, $r_usar_tls, $r_usar_ssl, $r_predeterminada, $r_activa);

    if (!$stmt->fetch()) {
        $stmt->close();
        echo json_encode(["success" => false, "message" => "Cuenta no encontrada o inactiva"]);
        return;
    }
    $stmt->close();

    $cuenta = [
        'id'               => $r_id,
        'nombre'           => $r_nombre,
        'email_remitente'  => $r_email_remitente,
        'servidor_smtp'    => $r_servidor_smtp,
        'puerto'           => $r_puerto,
        'usuario_smtp'     => $r_usuario_smtp,
        'contrasena_smtp'  => $r_contrasena_smtp,
        'usar_tls'         => $r_usar_tls,
        'usar_ssl'         => $r_usar_ssl,
        'predeterminada'   => $r_predeterminada,
        'activa'           => $r_activa,
    ];

    // Desencriptar contraseña
    $contrasena = desencriptarContrasena($cuenta['contrasena_smtp']);

    try {
        // Intentar conexión simple al servidor SMTP
        $conexion = @fsockopen(
            $cuenta['servidor_smtp'],
            $cuenta['puerto'],
            $errno,
            $errstr,
            5
        );

        if ($conexion) {
            fclose($conexion);

            // Actualizar estado de la cuenta
            $sqlUpdate = "UPDATE correos_cuentas_configuracion 
                         SET probada = 1, ultima_prueba = NOW() 
                         WHERE id = ?";
            $stmtUpdate = $enlace->prepare($sqlUpdate);
            $stmtUpdate->bind_param("i", $id);
            $stmtUpdate->execute();
            $stmtUpdate->close();

            echo json_encode([
                "success" => true,
                "message" => "Conexión al servidor SMTP exitosa",
                "detalles" => [
                    "servidor" => $cuenta['servidor_smtp'],
                    "puerto" => $cuenta['puerto'],
                    "protocolo" => ($cuenta['usar_ssl'] ? "SSL" : ($cuenta['usar_tls'] ? "TLS" : "PLAIN"))
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "No se pudo conectar al servidor SMTP",
                "error" => $errstr . " (Código: " . $errno . ")"
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Error al probar conexión: " . $e->getMessage()
        ]);
    }
}

// ============================================
// FUNCIONES AUXILIARES DE ENCRIPTACIÓN
// ============================================

/**
 * Encriptar contraseña usando método seguro
 * NOTA: Cambiar SECRET_KEY por una variable de entorno
 */
function encriptarContrasena($contrasena)
{
    // Simple XOR con base64 - Para PRODUCCIÓN usar openssl_encrypt
    // define('SECRET_KEY', 'tu_clave_secreta_aqui');
    // return openssl_encrypt($contrasena, 'AES-256-CBC', SECRET_KEY, 0, base64_decode($iv));

    // Implementación básica para desarrollo
    $ciphering = "AES-128-CTR";
    $iv_length = openssl_cipher_iv_length($ciphering);
    $options = 0;
    $encryption_iv = openssl_random_pseudo_bytes($iv_length);
    $encryption_key = hash('sha256', 'bufala_bella_secret_key', true); // TODO: Cambiar en producción

    $encrypted = openssl_encrypt(
        $contrasena,
        $ciphering,
        $encryption_key,
        $options,
        $encryption_iv
    );

    return base64_encode($encryption_iv . $encrypted);
}

/**
 * Desencriptar contraseña
 */
function desencriptarContrasena($contrasena_encriptada)
{
    try {
        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_key = hash('sha256', 'bufala_bella_secret_key', true);

        $encrypted = base64_decode($contrasena_encriptada);
        $encryption_iv = substr($encrypted, 0, $iv_length);
        $encrypted = substr($encrypted, $iv_length);

        $decrypted = openssl_decrypt(
            $encrypted,
            $ciphering,
            $encryption_key,
            $options,
            $encryption_iv
        );

        return $decrypted;
    } catch (Exception $e) {
        return "";
    }
}
