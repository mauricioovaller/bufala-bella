# Convenciones de endpoints

## Inicio común para JSON

Los endpoints JSON nuevos deben:

1. Enviar `Content-Type: application/json; charset=UTF-8`.
2. Aceptar `POST`; aceptar `OPTIONS` solo si el cliente y el servidor lo requieren.
3. Responder `405` para otros métodos.
4. Leer `php://input` una sola vez y validar `json_last_error()`.
5. Responder siempre un objeto con `success`, `message` y, cuando aplique, `datos`.
6. Usar `400` para entrada inválida, `404` para entidad ausente, `409` para conflicto de negocio y `500` para error interno.
7. Registrar el detalle técnico en `error_log`; no exponer credenciales ni trazas al cliente.

El CORS debe seguir la configuración de despliegue existente. No ampliar ni restringir orígenes en una migración sin revisar frontend, sesiones y servidor Apache.

## Carga de configuración y conexión

Usar la ruta de conexión ya establecida por el módulo. No incrustar credenciales ni crear conexiones paralelas. Después de conectarse:

```php
$enlace->set_charset('utf8mb4');
```

## Lectura y validación

- Convertir IDs con `intval` y rechazar valores menores o iguales a cero.
- Validar fechas como fechas y comprobar que inicio no sea posterior a fin.
- Distinguir campo ausente de valor opcional vacío.
- Validar enums contra una lista permitida.
- Aplicar límites de paginación antes de usarlos en `LIMIT` y `OFFSET`.
- Normalizar booleanos a `1/0` al guardar y a `true/false` solo si ese es el contrato existente de salida.
- Redondear decimales con `round((float)$valor, 4)`; no truncarlos con `(int)`.

## Respuesta y cierre

Cerrar cada statement después de consumir sus resultados. En `catch`, establecer el código HTTP antes de responder y devolver la estructura de fallback que espera el servicio React.

Antes de migrar un endpoint, conservar las claves existentes y revisar `src/services/` y `src/__tests__/`. La estandarización mejora la implementación interna, no cambia silenciosamente el contrato público.
