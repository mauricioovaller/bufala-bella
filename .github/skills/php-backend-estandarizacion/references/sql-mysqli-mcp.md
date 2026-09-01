# SQL, mysqli y MCP

## Regla obligatoria

Toda sentencia SQL nueva o modificada se valida contra la base real antes de integrarla en PHP:

1. Ejecutar `mcp_bufala-bella-_describe_table` para cada tabla involucrada.
2. Confirmar nombres, tipos, nulabilidad, claves y columnas de anulación.
3. Probar el SELECT o una operación segura con `mcp_bufala-bella-_query_db` y datos representativos.
4. Integrar el SQL usando `prepare`, `bind_param` y comprobación de errores.
5. Si se usa `bind_result`, contar columnas del SELECT y variables en el mismo orden.

No usar credenciales del MCP en PHP.

## Consultas

Usar placeholders para valores y nunca `get_result()`:

```php
$stmt = $enlace->prepare($sql);
if (!$stmt) {
    throw new Exception('Error preparando consulta: ' . $enlace->error);
}
$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
    throw new Exception('Error ejecutando consulta: ' . $stmt->error);
}
$stmt->bind_result($idEntidad, $nombre);
while ($stmt->fetch()) {
    $resultados[] = ['id' => $idEntidad, 'nombre' => $nombre];
}
$stmt->close();
```

Para filtros dinámicos, construir solo fragmentos de columnas y operadores constantes. Los valores siempre van en parámetros. Una lista para `IN` solo puede componerse después de convertir y validar todos sus elementos como enteros.

Preferir columnas explícitas y filtros de negocio (`Anulado = 0`) cuando el módulo lo requiera. Evitar `real_escape_string` como sustituto de prepared statements en código nuevo.

## Transacciones

Usar transacción cuando una operación modifica encabezado y detalle:

- Validar todos los datos antes de `begin_transaction()`.
- Comenzar antes de la primera escritura.
- Comprobar cada `prepare` y `execute`.
- Usar IDs generados por `insert_id`, nunca valores enviados por el cliente.
- Hacer `commit` solo cuando todas las operaciones terminan.
- Hacer `rollback` en toda excepción.
- No ocultar el error original al construir la respuesta.

Los endpoints existentes pueden usar actualización lógica; conservar ese comportamiento durante una migración y registrar cualquier cambio de semántica.

## Seguridad y diagnóstico

Nunca interpolar texto, fechas, floats o IDs sin parametrizar. No devolver `$enlace->error` en producción si revela estructura sensible; usar un mensaje funcional y `error_log` con el detalle. Probar también entidad inexistente, lista vacía, duplicados, rollback y error de SQL.
