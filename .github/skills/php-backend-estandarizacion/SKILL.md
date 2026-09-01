---
name: php-backend-estandarizacion
description: "Crear y revisar archivos PHP del backend de Bufala Bella: APIs JSON, endpoints CRUD, reportes SQL, transacciones y PDFs. Usar al crear PHP nuevo, modificar SQL PHP, normalizar endpoints existentes o integrar módulos Colombia/Chile. Exige mysqli preparado, respuestas con success/message/datos, validación SQL con MCP, compatibilidad con PHP 7.4 y pruebas sin romper endpoints existentes."
argument-hint: "Describe el módulo, endpoint, tablas, entrada, salida y si genera JSON o PDF"
user-invocable: true
disable-model-invocation: false
---

# PHP Backend de Bufala Bella

## Objetivo

Crear PHP nuevo con los patrones del proyecto y preparar migraciones graduales de endpoints existentes. Esta skill no autoriza reescrituras masivas: cada cambio debe preservar el contrato consumido por React o documentar una migración compatible.

## Cuándo usarla

- Crear un endpoint PHP nuevo en `src/Api/`.
- Crear o modificar un CRUD, reporte, consulta o proceso de guardado.
- Crear un PDF con FPDF.
- Agregar una transacción de encabezado y detalle.
- Normalizar un PHP existente sin cambiar su comportamiento accidentalmente.
- Trabajar con tablas Colombia o Chile, o con SQL del proyecto.

## Flujo obligatorio

1. Identificar el módulo, el servicio React consumidor y el endpoint vecino más parecido.
2. Clasificar el endpoint como JSON, PDF o transaccional. Si combina categorías, separar sus fases.
3. Confirmar tablas y columnas con `mcp_bufala-bella-_describe_table` antes de escribir SQL.
4. Probar cada SELECT o una operación segura con `mcp_bufala-bella-_query_db` antes de integrarlo.
5. Usar la conexión y configuración existentes del proyecto; nunca incrustar credenciales ni crear otra conexión.
6. Implementar validación de método, JSON, campos obligatorios, errores HTTP y respuesta estable.
7. Usar prepared statements para valores. Solo interpolar listas numéricas previamente convertidas a enteros y validadas.
8. No usar `get_result()`: usar siempre `bind_result()` y `fetch()` por compatibilidad con producción.
9. Comprobar `prepare`, `bind_param`, `execute`, `commit` y `rollback`; cerrar statements y conexión cuando corresponda.
10. Validar con `php -l`, pruebas del servicio React y prueba manual del endpoint. Para PDF, confirmar que no haya warnings antes de la salida binaria.
11. Si se modifica un endpoint existente, comparar payload, mensajes y códigos HTTP antes y después. Registrar excepciones heredadas en vez de ocultarlas.

## Recursos

- [Convenciones de endpoints](./references/convenciones-endpoints.md)
- [SQL, mysqli y MCP](./references/sql-mysqli-mcp.md)
- [PDF con FPDF](./references/pdf-fpdf.md)
- [Migración gradual](./references/migracion-existentes.md)
- [Plantilla JSON](./assets/endpoint-json.php)
- [Plantilla transaccional](./assets/endpoint-transaccional.php)
- [Plantilla PDF](./assets/endpoint-pdf.php)

## Restricciones

- Mantener compatibilidad con PHP 7.4; no usar sintaxis o tipos introducidos después de esa versión.
- No activar `display_errors` en producción.
- No usar `SELECT *` en endpoints nuevos salvo justificación clara.
- No usar SQL concatenado para texto, fechas o números recibidos del cliente.
- No cambiar nombres de claves JSON ni códigos HTTP de un endpoint existente sin revisar sus servicios y tests.
- No ejecutar SQL nuevo contra una tabla no descrita previamente por MCP.
- No imprimir texto, espacios o warnings antes de un PDF.
- No crear una segunda configuración de conexión o credenciales para un módulo.
- Todas las respuestas JSON deben conservar `success`, `message` y, cuando corresponda, `datos`.
