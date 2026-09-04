# SPEC 0002 — Preselección de anexos por cliente y persistencia de la selección (Autodeclaración Chile)

## Metadatos

| Campo | Valor |
|---|---|
| **ID** | `0002` |
| **Módulo** | `Facturacion` (clientes Chile) |
| **Título** | Anexos de la Autodeclaración Chile: preselección por cliente (Globe Italia / Cencosud), selección editable y guardado exacto por planilla para consulta y correo |
| **Fecha** | 2026-09-02 |
| **Autor** | Agente de desarrollo (equipo) |
| **Estado** | `Cerrada` |
| **Prioridad** | Alta |

## 1. Contexto / Problema

En el módulo **Facturación**, pestaña **Crear Facturas**, para facturas de clientes Chile existe el
apartado **Configuración de Despacho → Anexos - Autodeclaración Chile** (modal
`ModalDocumentosDespacho`), donde se marcan los anexos que acompañan al despacho.

Situación actual:

- La lista de anexos sale de `documentos_chile_items` (`Tipo = 'anexo'`) y hoy **se marcan todos
  por defecto**, sin importar el cliente.
- Al guardar el despacho se crea una **PlanillaChile** (`ApiGuardarPlanilla`) y la selección se
  guarda como **JSON** en `PlanillasChile.AnexosSeleccionados`.
- Al **consultar una factura existente** (`DocumentosFacturaModal`) se usa la configuración de su
  planilla (si tiene).
- Al **enviar por correo** (individual o múltiple) la autodeclaración se genera **sin** la
  selección → el PDF termina incluyendo todos los anexos activos, ignorando lo marcado.

Requisito del usuario:

1. Que la preselección de anexos **dependa del cliente**, por ejemplo:
   - **Distribuidora de Alimentos Globe Italia SPA**: Anexo 2 (FT-PT-047 V6 FICHA TECNICA
     CILIEGINE CHILE), Anexo 3 (FT-PT-048 V6 FICHA TECNICA OVOLINE CHILE), Anexo 4 (FT-PT-049 V6
     FICHA TECNICA BURRATA CHILE), Anexo 5 (FT-PT-050 V4 FICHA TECNICA CAPRESE CHILE), Anexo 7
     (Fotografías Producto y Lote).
   - **Cencosud Retail S.A.**: Anexo 2 (FT-PT-055 V0 FICHA TECNICA CILIEGINE C&C CHILE), Anexo 4
     (FT-PT-056 V0 FICHA TECNICA BURRATA C&C CHILE), Anexo 7 (Fotografías Producto y Lote).
2. Que el usuario **pueda marcar/desmarcar** sobre esa preselección (como hoy).
3. Que la selección quede **guardada de forma exacta y específica** (cada anexo por su id real en
   `documentos_chile_items`, porque p. ej. el "Anexo 2" es un documento distinto según el cliente)
   y **relacionada con la planilla** (los documentos de despacho se siguen asociando a la
   planilla).
4. Que al **consultar existente** o **enviar por correo** aparezcan **exactamente los anexos que
   se marcaron**.

## 2. Objetivos (verificables)

1. Al abrir "Configuración de Despacho" con facturas Chile de un cliente con mapeo, la lista de
   anexos abre con **marcados solo los anexos del mapeo de ese cliente** (0..N según BD).
2. Los clientes sin mapeo abren **sin anexos marcados** (el usuario los marca si lo requiere).
3. El usuario puede marcar/desmarcar y al guardar, la selección se persiste **por cada anexo
   (id exacto)** vinculado a la planilla creada.
4. Consultar una factura existente y generar su autodeclaración usa **exactamente** la selección
   guardada.
5. El envío por correo (individual y múltiple) genera la autodeclaración con **exactamente** la
   selección guardada.
6. El mapeo cliente → anexos por defecto es **100 % configurable desde BD** (no hay datos fijos
   en código).

## 3. Alcance

### Incluye

- **Dos tablas nuevas (script SQL):**
  - `clientes_chile_anexos_default` — mapeo configurable `Id_Cliente → Id_Documento(anexo)`
    (única fuente de la preselección y de los respaldos).
  - `planillas_chile_documentos` — selección guardada por planilla: una fila por anexo marcado
    (`Id_Planilla`, `Id_Documento`, `Tipo = 'anexo'`).
- **Backend:**
  - `Api/Planillas/ApiGuardarPlanilla.php` — al crear planilla Chile, insertar una fila en
    `planillas_chile_documentos` por cada anexo marcado (además se mantiene el JSON de
    compatibilidad en `PlanillasChile.AnexosSeleccionados`).
  - `Api/Planillas/ApiGetPlanillaConfiguracion.php` — devolver los anexos con prioridad:
    filas de `planillas_chile_documentos` → JSON de la planilla → default del cliente → vacío.
  - `Api/Planillas/ApiAutodeclaracionChile.php` — si no llegan `anexos_ids`, resolver la
    selección de la factura: planilla (filas) → JSON planilla → default del cliente → sin anexos.
  - Endpoint de lectura para la preselección del modal (puede ser `ApiGetDocumentosChileItems.php`
    ampliado con `id_cliente`) que devuelva los anexos disponibles **y** los ids por defecto del
    cliente.
- **Frontend:**
  - `components/facturacion/ModalDocumentosDespacho.jsx` — preseleccionar según el cliente del
    despacho; seguir permitiendo marcar/desmarcar; mostrar el cliente del despacho y una
    validación si las facturas seleccionadas son de clientes distintos.
  - `components/facturacion/FacturacionMain.jsx` — pasar el `Id_Cliente` al modal / validar que
    las facturas del despacho sean del mismo cliente antes de abrirlo.
  - `services/planillasService.js` — soporte del nuevo parámetro (id_cliente / defaults).
- **Scripts SQL** de creación (`database/scripts/`) y un **seed provisional** del mapeo para
  Globe Italia y Cencosud que se completará con los ids verificados (ver preguntas abiertas).
- Validación: `php -l`, `scripts/check_encoding.php`, checklist manual en pantalla.

### No incluye (fuera de alcance)

- Pantalla administrativa para mantener el mapeo cliente→anexos (por ahora se edita en BD;
  el diseño queda listo para una futura pantalla).
- Cambiar la relación de documentos/planillas a nivel de factura (se mantiene la relación con la
  planilla, como pidió el usuario).
- La selección de mercancía para las cartas (sigue en JSON como hoy).
- Otros módulos ni documentos distintos a la Autodeclaración Chile.

## 4. Requisitos

### Funcionales

- **RF1** El modal abre con la lista de anexos disponibles (`Tipo='anexo'` y `Activo=1`).
- **RF2** El modal **solo muestra los anexos correspondientes al cliente** de la factura
  (los del mapeo en `clientes_chile_anexos_default`), todos marcados; el usuario puede
  marcar/desmarcar dentro de esa lista. Si el cliente no tiene mapeo, la lista de anexos no
  se muestra (vacía).
- **RF3** El usuario puede marcar/desmarcar cada anexo (comportamiento actual de los checkboxes).
- **RF4** Al guardar la planilla Chile, por cada anexo marcado se inserta una fila en
  `planillas_chile_documentos` (`Id_Planilla`, `Id_Documento`, `Tipo='anexo'`); si no hay anexos
  marcados, no se insertan filas. Se mantiene la escritura del JSON por compatibilidad.
- **RF5** Consultar existente (DocumentosFacturaModal) entrega los anexos guardados para la
  factura según la prioridad: filas de la planilla → JSON de la planilla → default del cliente →
  vacío.
- **RF6** El correo individual y el correo múltiple generan la autodeclaración con la misma
  resolución (RF5) cuando el frontend no envía `anexos_ids` explícitos; si el frontend envía ids,
  se respetan tal cual.
- **RF7** Validación de un solo cliente por despacho (backend ya la tiene en
  `ApiGuardarPlanilla`; se agrega validación visual en el frontend antes de abrir el modal).

### No funcionales / calidad

- **RNF1** Todo el SQL con `prepared statements`; respuestas JSON `{success, message, datos}`;
  sin `get_result()`.
- **RNF2** `php -l` y `php scripts/check_encoding.php` en los archivos tocados.
- **RNF3** Los scripts SQL son re-ejecutables/idempotentes o están documentados como migración.
- **RNF4** Sin regresión: las planillas creadas antes del cambio siguen leyéndose por su JSON.
- **RNF5** Actualizar `docs/specs/` (estado) y el changelog al terminar.

## 5. Decisiones de diseño

- **D1 — Persistencia normalizada por planilla:** tabla `planillas_chile_documentos` con una
  fila por anexo y el **id exacto** del documento (`documentos_chile_items.Id`). Esto elimina la
  ambigüedad de que el mismo "Anexo N" sea un documento distinto según el cliente.
- **D2 — Mapeo configurable 100 % desde BD:** tabla `clientes_chile_anexos_default`
  (`Id_Cliente → Id_Documento`). La preselección y los respaldos se resuelven consultando esta
  tabla; no hay listas de ids en código.
- **D3 — Doble escritura de compatibilidad:** al guardar se escribe la tabla **y** el JSON de
  `PlanillasChile.AnexosSeleccionados`, para no romper lecturas existentes (planillas históricas).
- **D4 — Resolución central en el backend** (ApiAutodeclaracionChile y
  ApiGetPlanillaConfiguracion) con prioridad: ids explícitos → filas de planilla → JSON de
  planilla → default del cliente → vacío. Con esto el correo individual/múltiple queda correcto
  sin tocar sus pantallas.
- **D5 — Despacho de un solo cliente:** se valida en el frontend (y ya se valida en el backend)
  que las facturas seleccionadas pertenezcan al mismo cliente.
- **D6 — Mantenimiento por BD:** items maestros y mapeos se ajustan por SQL; se entregan scripts
  de creación y seed documentado (los valores exactos se confirman en el paso 0 de verificación).

## 6. Preguntas abiertas / respuestas

| Pregunta | Respuesta | Estado |
|---|---|---|
| ¿Dónde guardamos la selección? | Relacionada con la **planilla** (se mantiene el flujo actual) pero en una **tabla normalizada** por anexo (ids exactos) | Resuelta |
| ¿Modelo de defaults por cliente? | Tabla en BD (`clientes_chile_anexos_default`), configurable sin deploy | Resuelta |
| ¿Default para clientes sin mapeo? | Vacío (sin anexos preseleccionados) | Resuelta |
| ¿Los items FT-PT-055/056 C&C y versiones V6 existen? | **Pendiente de verificar** en pantalla (paso 0) — si no existen se crean en `documentos_chile_items` (datos maestros) | Pendiente |
| ¿Facturas históricas sin selección guardada? | Usar el default del cliente (mapeo) | Resuelta |
| ¿Despacho con varios clientes? | No permitido: un solo cliente por despacho (validación front + backend) | Resuelta |
| ¿Ids/nombres exactos de clientes y anexos? | Configurable 100 % desde BD; los valores del seed se confirman en el paso 0 con listados de la pantalla | Pendiente (paso 0) |

## 7. Plan de implementación (después de aprobación)

0. **Paso 0 — Verificación de datos (con el usuario):** confirmar en pantalla/BD los
   `Id_Cliente` exactos (ClientesChile) de Globe Italia y Cencosud, y los anexos existentes en
   `documentos_chile_items` (ids + textos: FT-PT-047/048/049/050 V4-V6 y FT-PT-055/056 C&C V0,
   Fotografías). Si faltan items, crearlos/ajustarlos en `documentos_chile_items` (master data).
1. **Scripts SQL:** `database/scripts/` con creación de `clientes_chile_anexos_default` y
   `planillas_chile_documentos` (+ índices/unicidad) y seed del mapeo con los ids verificados.
2. **Backend:** modificar `ApiGuardarPlanilla.php` (insertar filas por anexo), ampliar
   `ApiGetDocumentosChileItems.php` (devolver defaults del cliente), ajustar
   `ApiGetPlanillaConfiguracion.php` y `ApiAutodeclaracionChile.php` con la resolución D4.
3. **Frontend:** `FacturacionMain.jsx` (validar un solo cliente y pasar `Id_Cliente`),
   `ModalDocumentosDespacho.jsx` (preselección por cliente + info del cliente),
   `services/planillasService.js` (parámetros nuevos).
4. **Verificación:** `php -l` + `scripts/check_encoding.php` + prueba manual (crear despacho de
   Globe y de Cencosud, marcar/desmarcar, consultar existente y enviar correo individual/múltiple).
5. **Cierre:** actualizar estado de la spec y changelog.

## 8. Criterios de aceptación / checklist

- [ ] Tablas `clientes_chile_anexos_default` y `planillas_chile_documentos` creadas (script).
- [ ] Seed del mapeo Globe Italia y Cencosud con los ids verificados (paso 0).
- [ ] Modal muestra **solo los anexos del cliente** del despacho (Globe = sus 5, Cencosud = sus 3,
      marcados); clientes sin mapeo = lista vacía.
- [ ] El usuario puede marcar/desmarcar y guardar; quedan filas por anexo en la tabla + JSON.
- [ ] Consultar existente muestra/genera exactamente los anexos guardados.
- [ ] Correo individual y múltiple generan la autodeclaración con exactamente los anexos guardados.
- [ ] Despacho con clientes distintos no se puede guardar (validación).
- [ ] `php -l` y `scripts/check_encoding.php` OK en archivos tocados.
- [x] Verificación visual del usuario en su entorno → `Verificada`. **Confirmado por el usuario el 2026-09-02** (prueba funcionando).

## 9. Evidencia de verificación

_(Se completa durante la implementación.)_

## 10. Historial

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-09-02 | v0.1 | Creación del borrador (SDD) |
| 2026-09-02 | v1.0 | Aprobada por el usuario — inicio de implementación |
| 2026-09-02 | v1.1 | Implementada (código listo). Pendientes del usuario: aplicar scripts SQL, confirmar Paso 0 (ids/items), desplegar y verificar en pantalla → `Verificada` |
| 2026-09-02 | v1.2 | Ajuste en verificación (usuario): el modal debe mostrar **solo los anexos del cliente** (no todos); cliente sin mapeo = lista vacía |
| 2026-09-02 | v1.3 | **Verificada**: el usuario probó en su entorno y confirmó que funciona |
| 2026-09-02 | v1.4 | **Cerrada** por el usuario — fin del ciclo SDD. (Si el usuario hace observaciones, se reabre con una versión nueva o una spec 0003 que referencia esta.) |
