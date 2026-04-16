<?php

/**
 * SCRIPT DE DIAGNÓSTICO para encontrar conexionbd.php
 * Sube esto a la carpeta raíz del servidor y accede desde navegador:
 * https://portal.datenbankensoluciones.com.co/diagnostico_conexion_bd.php
 */

header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>

<head>
    <title>Diagnóstico - Ubicación de conexionbd.php</title>
    <style>
        body {
            font-family: Arial;
            margin: 20px;
            background: #f5f5f5;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }

        h1 {
            color: #333;
        }

        .resultado {
            margin: 20px 0;
            padding: 15px;
            border-radius: 4px;
        }

        .encontrado {
            background: #d4edda;
            border: 1px solid #28a745;
            color: #155724;
        }

        .no-encontrado {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .intento {
            margin: 10px 0;
            padding: 10px;
            background: #f9f9f9;
            border-left: 3px solid #ccc;
        }

        .intento.ok {
            border-left-color: #28a745;
            background: #f1f9f0;
        }

        .intento.fail {
            border-left-color: #f5c6cb;
            background: #fff5f5;
        }

        .ruta {
            font-family: monospace;
            background: #eee;
            padding: 5px 8px;
            border-radius: 3px;
        }

        code {
            background: #f0f0f0;
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>🔍 Diagnóstico de Ubicación de conexionbd.php</h1>

        <h2>Información del Servidor</h2>
        <div class="resultado">
            <p><strong>DOCUMENT_ROOT:</strong> <span class="ruta"><?php echo $_SERVER['DOCUMENT_ROOT']; ?></span></p>
            <p><strong>Script actual:</strong> <span class="ruta"><?php echo __FILE__; ?></span></p>
            <p><strong>Directorio actual:</strong> <span class="ruta"><?php echo __DIR__; ?></span></p>
        </div>

        <h2>Búsqueda de conexionbd.php</h2>

        <?php
        $rutas_a_buscar = [
            // Desde DOCUMENT_ROOT
            $_SERVER['DOCUMENT_ROOT'] . "/conexionBaseDatos/conexionbd.php",
            $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
            $_SERVER['DOCUMENT_ROOT'] . "/../../conexionBaseDatos/conexionbd.php",
            $_SERVER['DOCUMENT_ROOT'] . "/../../DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",

            // Desde el directorio actual (si es desde el servidor web)
            __DIR__ . "/conexionBaseDatos/conexionbd.php",
            __DIR__ . "/../conexionBaseDatos/conexionbd.php",
            __DIR__ . "/../../conexionBaseDatos/conexionbd.php",
            __DIR__ . "/../../../conexionBaseDatos/conexionbd.php",
            __DIR__ . "/../../../../conexionBaseDatos/conexionbd.php",
            __DIR__ . "/../../../../../conexionBaseDatos/conexionbd.php",

            // Rutas absolutas comunes
            "/home/datenban/portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
            "/home/datenban/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php",
            "/var/www/html/conexionBaseDatos/conexionbd.php",
            "/var/www/conexionBaseDatos/conexionbd.php",
            "/opt/apps/conexionBaseDatos/conexionbd.php",
        ];

        $encontradas = [];

        foreach ($rutas_a_buscar as $ruta) {
            $existe = file_exists($ruta);
            $clase = $existe ? 'ok' : 'fail';
            echo '<div class="intento ' . $clase . '">';
            echo ($existe ? '✓ ' : '✗ ');
            echo '<span class="ruta">' . htmlspecialchars($ruta) . '</span>';
            if ($existe) {
                echo ' <strong style="color: green;">[ENCONTRADO]</strong>';
                $encontradas[] = $ruta;
            }
            echo '</div>';
        }

        if (!empty($encontradas)) {
            echo '<div class="resultado encontrado">';
            echo '<h3>✓ Archivos encontrados:</h3>';
            foreach ($encontradas as $ruta) {
                echo '<p><strong>✓</strong> <code>' . htmlspecialchars($ruta) . '</code></p>';
            }
            echo '</div>';
        } else {
            echo '<div class="resultado no-encontrado">';
            echo '<h3>✗ No se encontró conexionbd.php en ninguna ruta</h3>';
            echo '<p>Por favor, verifica manualmente dónde está ubicado el archivo en tu servidor.</p>';
            echo '</div>';
        }
        ?>

        <h2>Búsqueda Manual en el Servidor</h2>
        <p>Ejecuta este comando en tu servidor para encontrar el archivo:</p>
        <div class="resultado">
            <code>find / -name "conexionbd.php" -type f 2>/dev/null</code>
        </div>

        <h2>Instrucciones para Arreglar ApiEnviarCorreoSimple.php</h2>
        <ol>
            <li>Una vez encuentres la ruta correcta de <code>conexionbd.php</code></li>
            <li>Edita el archivo <code>src/Api/Correos/ApiEnviarCorreoSimple.php</code></li>
            <li>Modifica la sección de rutas al inicio del archivo con la ruta correcta encontrada</li>
            <li>Compila: <code>npm run build</code></li>
            <li>Sube los cambios a producción</li>
        </ol>
    </div>
</body>

</html>