<?php

/**
 * SCRIPT PARA VERIFICAR Y ARREGLAR CUENTA PREDETERMINADA
 * Ejecuta en: /DatenBankenApp/DiBufala/Api/Correos/
 * O desde terminal SSH
 */

// Conectar a BD
include "/home/datenban/portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

echo "=== VERIFICAR CUENTAS DE CORREO ===\n\n";

// Ver todas las cuentas
$sql = "SELECT id, nombre, email_remitente, predeterminada, activa FROM correos_cuentas_configuracion";
$resultado = $enlace->query($sql);

if ($resultado->num_rows === 0) {
    echo "❌ No hay cuentas registradas en la tabla\n";
} else {
    echo "Cuentas actuales:\n";
    while ($fila = $resultado->fetch_assoc()) {
        $pred = $fila['predeterminada'] ? "✓ SÍ" : "✗ NO";
        $activa = $fila['activa'] ? "✓ SÍ" : "✗ NO";
        echo "  ID: {$fila['id']}, Nombre: {$fila['nombre']}, Email: {$fila['email_remitente']}, Predeterminada: $pred, Activa: $activa\n";
    }
}

// Verificar si hay una predeterminada
$sql = "SELECT COUNT(*) as total FROM correos_cuentas_configuracion WHERE predeterminada = 1 AND activa = 1";
$resultado = $enlace->query($sql);
$fila = $resultado->fetch_assoc();

if ($fila['total'] === 0) {
    echo "\n⚠️ NO HAY CUENTA PREDETERMINADA ACTIVA\n";
    echo "Para arreglarlo, ejecuta: UPDATE correos_cuentas_configuracion SET predeterminada = 1, activa = 1 WHERE id = (la ID de tu nuevo correo);\n";
} else {
    echo "\n✓ Hay una cuenta predeterminada y activa configurada\n";
}

$enlace->close();
