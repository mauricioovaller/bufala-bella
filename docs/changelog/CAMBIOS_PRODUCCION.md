# CAMBIOS IMPLEMENTADOS - MÓDULO PRODUCCIÓN

## RESUMEN
Se ha implementado la funcionalidad de registrar cantidad por lote en el módulo de Producción. Ahora, al asignar responsable y lotes a un pedido, se pueden registrar cantidades específicas para cada lote con validación automática.

## ARCHIVOS MODIFICADOS

### 1. Frontend: `src/pages/ProduccionPedidos.jsx`
**Cambios principales:**
- ✅ Extendido estado `itemsEditados` para incluir array `cantidades: [0, 0, 0]`
- ✅ Nuevo handler `handleCantidadLoteChange()` para capturar cambios en cantidades
- ✅ Nueva función `getCantidadLoteValue()` para obtener cantidad actual de cada lote
- ✅ Nueva función `calcularTotalCantidades()` para sumar cantidades de los 3 lotes
- ✅ Nueva función `validarCantidadesLotes()` para validar que suma ≤ cantidad disponible
- ✅ Nueva función `obtenerMensajeValidacion()` para mostrar suma en tiempo real con colores
- ✅ Nueva función `validarTodosPedidos()` que ejecuta validación antes de guardar
- ✅ UI mejorada con inputs numéricos bajo cada selector de lote
- ✅ Validación visual: texto verde si es válido, rojo si hay exceso
- ✅ Mensaje detallado de error al intentar guardar con validación fallida

**Validación en tiempo real:**
- Suma de cantidades se muestra en cada fila: "Total: X / Disponible: Y"
- Color verde ✓ si suma ≤ cantidad disponible
- Color rojo ❌ si suma > cantidad disponible (muestra exceso)
- Al hacer clic en "Guardar", se validan todos los ítems antes de enviar

### 2. Backend GET: `src/Api/Produccion/ApiGetPedidoProduccion.php`
**Cambios principales:**
- ✅ Agregados campos `CantidadLote1`, `CantidadLote2`, `CantidadLote3` al SELECT
- ✅ Estos campos se retornan en la respuesta JSON como:
  ```json
  {
    "cantidadLote1": 50,
    "cantidadLote2": 40,
    "cantidadLote3": 10
  }
  ```
- ✅ Los valores se cargan en el estado del componente al abrir un pedido

### 3. Backend SAVE: `src/Api/Produccion/ApiGuardarProduccion.php`
**Cambios principales:**
- ✅ Ahora recibe estructura de datos: `{ idDet, idResponsable, lotes: [], cantidades: [] }`
- ✅ Validación en backend:
  - Suma de cantidades ≤ Cantidad del detalle
  - Si falla: lanza excepción con mensaje detallado
  - Si pasa: procede a actualizar
- ✅ SQL UPDATE ahora incluye:
  - `CantidadLote1 = ?`
  - `CantidadLote2 = ?`
  - `CantidadLote3 = ?`
- ✅ Transacción completa: si hay error en cualquier ítem, se revierte todo
- ✅ Auditoria: registra usuario y fecha de modificación

## FUNCIONALIDADES PRESERVADAS ✓
- Selección de Responsable
- Selección de Lotes (1, 2, 3)
- Búsqueda de pedidos por rango de fechas
- Carga de detalle de pedido
- Guardado y recarga de datos
- Responsividad (Desktop y Móvil)
- Estados de carga
- Mensajes de error/éxito con SweetAlert2

## FLUJO DE FUNCIONAMIENTO

### Paso 1: Buscar Pedidos
```
Usuario selecciona Tipo, Fecha Desde, Fecha Hasta → Click "Buscar pedidos"
```

### Paso 2: Cargar Pedido
```
Click en botón "Cargar" de un pedido
→ API: GET /ApiGetPedidoProduccion.php
→ Devuelve ítems CON campos: cantidadLote1, cantidadLote2, cantidadLote3
→ Se cargan en estado: itemsEditados
```

### Paso 3: Asignar Responsable, Lotes y Cantidades
```
Para cada ítem:
- Seleccionar Responsable (dropdown)
- Seleccionar Lote 1 (dropdown) + Ingresar Cantidad 1 (input numérico)
- Seleccionar Lote 2 (dropdown) + Ingresar Cantidad 2 (input numérico)
- Seleccionar Lote 3 (dropdown) + Ingresar Cantidad 3 (input numérico)

Al escribir cantidades:
- Se calcula suma en tiempo real
- Muestra: "Total: X / Disponible: Y"
- Color verde si suma ≤ disponible
- Color rojo ❌ si suma > disponible (con exceso)
```

### Paso 4: Guardar (CON VALIDACIÓN)
```
Click "Guardar Producción"
→ Frontend valida ANTES de enviar:
   - Para CADA ítem: suma(cant1, cant2, cant3) ≤ cantidad_disponible
   - Si FALLA: Muestra alerta con detalle de errores y CANCELA envío
   - Si PASA: Envía al backend
→ API: POST /ApiGuardarProduccion.php
   - Backend valida nuevamente (defensa de capas)
   - Suma de cantidades ≤ cantidad disponible
   - Si FALLA: Retorna error
   - Si PASA: UPDATE en BD y retorna éxito
→ Si éxito: Muestra mensaje "Producción guardada correctamente"
→ Recarga el pedido con datos guardados
```

## ESTRUCTURA DE DATOS

### Request al Guardar (Frontend → Backend)
```json
{
  "tipo": "normal",
  "idPedido": 123,
  "items": [
    {
      "idDet": 456,
      "idResponsable": 1,
      "lotes": [10, 20, 30],
      "cantidades": [50, 40, 10]
    },
    {
      "idDet": 457,
      "idResponsable": 2,
      "lotes": [40, null, null],
      "cantidades": [100, 0, 0]
    }
  ]
}
```

### Response al Cargar (Backend → Frontend)
```json
{
  "success": true,
  "pedido": {
    "items": [
      {
        "idDet": 456,
        "cantidad": 100,
        "cantidadLote1": 50,
        "cantidadLote2": 40,
        "cantidadLote3": 10,
        "lotes": { ... }
      }
    ]
  }
}
```

## VALIDACIONES

### Frontend (Tiempo Real)
1. ✓ Cantidades solo aceptan números ≥ 0
2. ✓ Suma de cantidades se muestra en vivo
3. ✓ Validación visual con colores

### Frontend (Al Guardar)
1. ✓ Para cada ítem: suma(cant1, cant2, cant3) ≤ cantidad_disponible
2. ✓ Si hay error: muestra alerta con lista detallada de productos con problema
3. ✓ Usuario debe corregir antes de guardar

### Backend (Al Guardar)
1. ✓ Valida que suma de cantidades ≤ cantidad disponible
2. ✓ Valida que no se repitan lotes en mismo ítem
3. ✓ Transacción: si hay error, revierte todos los cambios

## CAMPOS EN BASE DE DATOS

La tabla `DetPedido` (y `DetPedidoSample`) debe tener estos campos (ya existen con valor 0 por defecto):
```sql
- CantidadLote1 INT DEFAULT 0
- CantidadLote2 INT DEFAULT 0
- CantidadLote3 INT DEFAULT 0
```

## EJEMPLO DE USO

**Escenario:** Pedido con 100 unidades de Producto XYZ

1. Usuario abre Producción → Busca pedidos → Carga pedido
2. Ve fila con:
   - Producto: XYZ
   - Cantidad: 100
   - Responsable: [--Sin asignar--]
   - Lote 1: [--] + Input: 0
   - Lote 2: [--] + Input: 0
   - Lote 3: [--] + Input: 0
   - Mensaje: "Total: 0 / Disponible: 100" (verde ✓)

3. Usuario selecciona:
   - Responsable: Juan García
   - Lote 1: LOTE-001 → Ingresa 50
   - Lote 2: LOTE-002 → Ingresa 40
   - Lote 3: LOTE-003 → Ingresa 10

4. Se actualiza mensaje: "Total: 100 / Disponible: 100" (verde ✓)

5. Click "Guardar Producción"
   - Validación OK
   - Se envía al backend
   - Backend guarda en BD:
     - Id_Responsable = 1
     - Lote1 = 10, Lote2 = 20, Lote3 = 30
     - CantidadLote1 = 50, CantidadLote2 = 40, CantidadLote3 = 10
   - Retorna éxito

**CASO ERROR:** Si usuario intenta asignar 120 unidades (50+40+30):
1. Mensaje en rojo: "Total: 120 / Disponible: 100" ❌ Exceso: 20
2. Click "Guardar"
3. Alerta: "Error en validación de cantidades:
   - Producto: XYZ
   - Cantidad disponible: 100
   - Total asignado: 120
   - Exceso: 20 unidades"
4. Usuario debe corregir

## TESTING

### Casos a Probar
1. ✓ Cargar pedido → Verificar que trae cantidades guardadas
2. ✓ Asignar responsable + lotes + cantidades válidas → Guardar OK
3. ✓ Ingresar cantidades que suman más que disponible → Validación error
4. ✓ Dejar cantidades en 0 → Guardar OK (sin asignar cantidad)
5. ✓ Cambiar cantidades → Se recalcula suma automáticamente
6. ✓ Recargar página → Mantiene datos guardados

## NOTAS IMPORTANTES

1. **Validación en Capas**: El frontend valida para UX, el backend valida para seguridad
2. **Transacciones**: Si hay error al guardar un ítem, se revierte TODO
3. **Auditoría**: Se registra usuario y fecha de cada cambio
4. **Compatibilidad**: Los cambios son compatibles con la estructura existente
5. **Performance**: Las validaciones son rápidas (no hay queries adicionales innecesarias)

## PRÓXIMOS PASOS OPCIONALES

- [ ] Agregar reportes por cantidad asignada a lotes
- [ ] Permitir editar cantidades después de guardar
- [ ] Historial de cambios de cantidades
- [ ] Exportar detalle de asignación a Excel
