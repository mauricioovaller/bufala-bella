<?php

/**
 * DIAGNÓSTICO DEFINITIVO - Ver qué devuelve la API
 * Accede desde: https://portal.datenbankensoluciones.com.co/test_api_cuentas.php
 */

header("Content-Type: application/json; charset=UTF-8");

// Conectar a BD
include "/home/datenban/portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

if (!isset($enlace) || !$enlace || $enlace->connect_error) {
    die(json_encode(["error" => "No se pudo conectar a BD"]));
}

// Ejecutar la MISMA consulta que hace la API
$sql = "SELECT id, nombre, email_remitente, usuario_smtp, servidor_smtp, puerto, usar_tls, usar_ssl, 
               predeterminada, activa, probada, ultima_prueba, fecha_creacion 
        FROM correos_cuentas_configuracion 
        ORDER BY predeterminada DESC, nombre ASC";

$resultado = $enlace->query($sql);

if (!$resultado) {
    die(json_encode(["error" => "Error en consulta: " . $enlace->error]));
}

$cuentas = [];
while ($fila = $resultado->fetch_assoc()) {
    $cuentas[] = $fila;
}

$enlace->close();

// Mostrar EXACTAMENTE lo que devuelve
echo json_encode([
    "success" => true,
    "mensaje" => "Esto es EXACTAMENTE lo que la API devuelve",
    "total_cuentas" => count($cuentas),
    "cuentas" => $cuentas
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
