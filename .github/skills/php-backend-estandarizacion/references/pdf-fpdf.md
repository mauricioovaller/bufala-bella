# Endpoints PDF con FPDF

## Separación de responsabilidades

Un endpoint PDF puede consultar y preparar datos, pero su salida final es binaria. No debe emitir JSON, warnings, HTML, espacios fuera de `<?php`, ni mensajes de depuración antes de `$pdf->Output()`.

Flujo:

1. Validar método y entrada.
2. Cargar la configuración, conexión y `FPDF_PATH` existentes.
3. Consultar datos con prepared statements y validar ausencia de registros.
4. Verificar logo con las constantes de configuración del proyecto.
5. Crear el documento, configurar márgenes y salto de página.
6. Enviar `Content-Type: application/pdf` y, cuando corresponda, `Content-Disposition`.
7. Emitir el PDF como última operación.

## Configuración

Usar las constantes de empresa y rutas de logo existentes. No hardcodear nombre, NIT, contacto, rutas de servidor ni logos de otro proyecto. Mantener la codificación esperada por FPDF y aplicar `utf8_decode` solo de forma consistente con la versión instalada y el texto usado.

## Errores

Antes de generar el PDF, los errores deben responder con JSON y código HTTP apropiado. Después de iniciar la salida binaria, no intentar cambiar a JSON. No activar `display_errors` en producción; registrar diagnóstico con `error_log`.

Validar manualmente al menos: registro inexistente, detalle vacío, logo ausente, texto largo, varias páginas y caracteres españoles. Comparar el PDF con el contrato visual actual antes de migrar un endpoint existente.
