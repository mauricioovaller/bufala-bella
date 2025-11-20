<?php
echo "<h2>Verificación Laravel - Flor Colombia</h2>";

$required_extensions = [
    'OpenSSL PHP Extension' => 'openssl',
    'PDO PHP Extension' => 'pdo',
    'PDO MySQL Driver' => 'pdo_mysql',
    'Mbstring PHP Extension' => 'mbstring',
    'Tokenizer PHP Extension' => 'tokenizer',
    'XML PHP Extension' => 'xml',
    'Ctype PHP Extension' => 'ctype',
    'JSON PHP Extension' => 'json',
    'BCMath PHP Extension' => 'bcmath',
];

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Extensión</th><th>Estado</th></tr>";

foreach ($required_extensions as $name => $ext) {
    $status = extension_loaded($ext) ? '✅ ACTIVA' : '❌ FALTANTE';
    $color = extension_loaded($ext) ? 'green' : 'red';
    echo "<tr><td>$name ($ext)</td><td style='color: $color; font-weight: bold;'>$status</td></tr>";
}

echo "</table>";

// Verificar permisos de escritura
echo "<h3>Permisos de Directorios:</h3>";
$writable_dirs = ['storage', 'bootstrap/cache'];
foreach ($writable_dirs as $dir) {
    $status = is_writable($dir) ? '✅ ESCRIBIBLE' : '❌ NO ESCRIBIBLE';
    $color = is_writable($dir) ? 'green' : 'red';
    echo "<p>/$dir: <span style='color: $color; font-weight: bold;'>$status</span></p>";
}

// Verificar mod_rewrite (para URLs amigables)
echo "<h3>Mod_Rewrite (URLs Amigables):</h3>";
if (function_exists('apache_get_modules')) {
    $rewrite_status = in_array('mod_rewrite', apache_get_modules()) ? '✅ ACTIVO' : '❌ INACTIVO';
} else {
    $rewrite_status = '⚠️ NO APACHE (probablemente nginx)';
}
echo "<p>mod_rewrite: <strong>$rewrite_status</strong></p>";
?>