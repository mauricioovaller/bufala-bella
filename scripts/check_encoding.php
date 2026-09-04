<?php
/**
 * scripts/check_encoding.php
 *
 * Control de codificación de texto (Spec SDD 0001 - Consolidación).
 *
 * Detecta en archivos PHP:
 *   1) BOM UTF-8 (EF BB BF)
 *   2) Contenido que no es UTF-8 válido
 *   3) Secuencias "mojibake" por doble/triple codificación (marcadores
 *      'Ã' / 'Â' y caracteres de reemplazo U+FFFD), que hacen que las
 *      tildes y la ñ salgan como símbolos raros en PDF/Excel.
 *
 * Uso:
 *   php scripts/check_encoding.php [archivo|directorio ...]
 *   (sin argumentos analiza src/Api por defecto)
 *
 * Exit code:
 *   0 = todo limpio
 *   1 = se encontraron problemas (lista en pantalla)
 */

$rutas = $argv;
array_shift($rutas); // quitar nombre del script
if (empty($rutas)) {
    $rutas = ['src/Api'];
}

$archivos = [];
foreach ($rutas as $ruta) {
    if (is_file($ruta)) {
        $archivos[] = $ruta;
    } elseif (is_dir($ruta)) {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($ruta, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($it as $f) {
            if ($f->getExtension() === 'php') {
                $archivos[] = $f->getPathname();
            }
        }
    } else {
        fwrite(STDERR, "Ruta no encontrada: {$ruta}\n");
        exit(2);
    }
}
sort($archivos);

$problemas = 0;
foreach ($archivos as $archivo) {
    $bytes = file_get_contents($archivo);
    $incidencias = [];

    if (strncmp($bytes, "\xEF\xBB\xBF", 3) === 0) {
        $incidencias[] = 'BOM UTF-8 presente';
    }

    if (!mb_check_encoding($bytes, 'UTF-8')) {
        $incidencias[] = 'no es UTF-8 valido';
    } else {
        $texto = mb_convert_encoding($bytes, 'UTF-8', 'UTF-8');
        if (preg_match_all('/[ÃÂ]/u', $texto, $m) > 0) {
            $incidencias[] = 'posible mojibake (marcadores \'Ã\'/\'Â\': ' . count($m[0]) . ')';
        }
        if (strpos($texto, "\u{FFFD}") !== false) {
            $incidencias[] = 'contiene caracteres de reemplazo U+FFFD';
        }
    }

    if (!empty($incidencias)) {
        echo $archivo . "  ->  " . implode('; ', $incidencias) . "\n";
        $problemas++;
    }
}

if ($problemas === 0) {
    echo 'OK: ' . count($archivos) . " archivos PHP revisados, sin problemas de codificacion.\n";
    exit(0);
}

echo "\n" . $problemas . " archivo(s) con problemas de codificacion.\n";
exit(1);
