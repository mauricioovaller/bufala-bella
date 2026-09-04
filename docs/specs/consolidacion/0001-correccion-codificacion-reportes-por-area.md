# SPEC 0001 — Corrección de codificación (tildes/ñ) en generadores PDF/Excel de Reportes por Área

## Metadatos

| Campo | Valor |
|---|---|
| **ID** | `0001` |
| **Módulo** | `Consolidacion` |
| **Título** | Corrección de codificación de textos fijos en los generadores PDF/Excel de "Reportes por Área" (Producción, Empaque, Transporte y Excel Proceso Actual) |
| **Fecha** | 2026-09-02 |
| **Autor** | Agente de desarrollo (equipo) |
| **Estado** | `Cerrada` |
| **Prioridad** | Alta |

## 1. Contexto / Problema

En el apartado **Reportes por Área** del módulo Consolidación (3 pestañas: Pedidos Locales,
Pedidos Chile y Consolidado) se generan PDF y Excel desde 15 endpoints. Los **textos fijos**
(títulos, subtítulos, "Período", "Página", encabezados como DESCRIPCIÓN/CÓDIGO, pestañas de
Excel, mensajes "No se encontraron datos…" y mensajes de error) se ven con **caracteres raros**
(por ejemplo `Ã©`, `Ã±`, `DÃA`, símbolos tipo `ƒ`, `ˆ`, comillas raras) en lugar de tildes y ñ.

### Causa raíz (diagnóstico verificado con inspección de bytes)

Varios archivos PHP tienen sus literales de texto guardados con **doble o triple codificación**
("mojibake", típicamente generado al pasar texto UTF-8 por una lectura/escritura Windows-1252
o Latin-1 repetida). En el código se ve, por ejemplo:

- `utf8_decode('TRANSPORTE POR DÃA')` en lugar de `'TRANSPORTE POR DÍA'`
- `utf8_decode('PerÃodo: …')` en lugar de `'Período: …'`
- `'DESCRIPCIÓN'` guardado como `'DESCRIPCIÃN'`
- `'Año'` guardado como `'AÃ±o'`

En PDF, `utf8_decode()` (Latin-1, regla del proyecto) se aplica sobre el literal ya corrupto y
produce símbolos raros. En Excel (PhpSpreadsheet, texto UTF-8 directo) el literal corrupto se
escribe tal cual. **Los datos de la BD (clientes, productos, descripciones) se ven bien**; el
problema está solo en textos fijos del código. También se detectó que **varios generadores ya
están correctos** (UTF-8 limpio), por lo que el arreglo es puntual y debe dejar un control que
evite la regresión.

## 2. Objetivos (verificables)

1. Que todos los **textos fijos** visibles de los PDF y Excel de "Reportes por Área" muestren
   tildes, ñ y caracteres españoles correctos (sin símbolos raros).
2. Que los 15 generadores + helper del módulo queden en **UTF-8 válido, sin BOM y sin
   secuencias mojibake**, conservando la convención de finales de línea (CRLF).
3. Dejar un **control automático** (`scripts/check_encoding.php`) que detecte mojibake/BOM y
   falle (exit ≠ 0) para que el problema no regrese.
4. Documentar la regla en `CLAUDE.md` y `AGENTS.md` (codificación de texto + uso del control).
5. **No alterar** la lógica de negocio, las consultas SQL ni el comportamiento de los reportes
   (cambio puramente de codificación de texto).

## 3. Alcance

### Incluye

**12 archivos a normalizar** (tienen literales con mojibake), todos de Reportes por Área:

- PDF Producción: `ApiConsolidadoProduccionChile.php`, `ApiConsolidadoProduccionTotal.php`
- PDF Empaque: `ApiConsolidadoEmpaqueChile.php`, `ApiConsolidadoEmpaqueTotal.php`
- PDF Transporte: `ApiConsolidadoTransporte.php`, `ApiConsolidadoTransporteChile.php`, `ApiConsolidadoTransporteTotal.php`
- Excel Proceso Actual: `ApiGenerarExcelConsolidacionChile.php`, `ApiGenerarExcelConsolidacionTotal.php`
- Excel Transporte: `ApiGenerarExcelTransporte.php`, `ApiGenerarExcelTransporteChile.php`, `ApiGenerarExcelTransporteTotal.php`

**Verificación (sin modificar)** de los archivos ya limpios:

- `ApiConsolidadoProduccion.php`, `ApiConsolidadoEmpaque.php`, `ApiGenerarExcelConsolidacion.php`,
  `consolidacion_reportes_helper.php` y demás PHP del módulo.

**Textos incluidos en la corrección** (los que el usuario ve):

- Títulos y subtítulos de PDF (p. ej. `TRANSPORTE POR DÍA`, `DESPACHOS POR DÍA`, `PRODUCCIÓN POR DÍA`, "DETALLE POR GUÍA…").
- `Período: …`, `Página …`.
- Encabezados de columnas con acentos/ñ (p. ej. `DESCRIPCIÓN`, `CÓDIGO`, `Año`).
- Pestañas/títulos de hojas Excel (p. ej. `Consolidación…`).
- Mensajes: "No se encontraron datos para el período seleccionado.", "No hay datos…".
- Mensajes de error JSON mostrados en pantalla (p. ej. "Método no permitido. Usa POST.",
  "Debe proporcionar un rango de fechas válido.", "Campo de fecha no válido.").
- Comentarios del código (se normalizan también para que no haya mojibake residual que
  contamine futuras copias/ediciones).

### No incluye (fuera de alcance)

- Datos provenientes de la base de datos (no presentan el problema).
- Textos del frontend React (ya son UTF-8).
- Otros módulos fuera de Consolidación.
- Cambiar los PDF a fuente Unicode (DejaVu) / soporte de caracteres fuera de Latin-1.
- Cambiar títulos, nombres o el contenido semántico de los reportes.
- El comportamiento funcional recién entregado del detalle por Guía Master/Hija en Transporte.

## 4. Requisitos

### Funcionales

- **RF1** Los 12 archivos listados quedan con texto UTF-8 correcto: al abrirlos ya no hay
  secuencias tipo `Ã©`, `Ã±`, `Ã`, `ƒ`, `ˆ`, etc.
- **RF2** Los textos visibles de los PDF conservan el flujo `utf8_decode()` (Latin-1) y salen
  correctos (tildes, ñ, signos de puntuación españoles).
- **RF3** Los textos visibles de los Excel salen correctos en UTF-8 (ningún generador Excel
  debe usar `utf8_decode`).
- **RF4** El resto del contenido (números, fechas, formato de celdas PDF/Excel) no cambia.

### No funcionales / calidad

- **RNF1** `php -l` pasa en los 15 generadores + helper.
- **RNF2** `scripts/check_encoding.php` (nuevo) reporta **0 archivos** con mojibake o BOM en
  `src/Api/Consolidacion` (y en los directorios PHP indicados).
- **RNF3** Los archivos quedan sin BOM y con CRLF (convención del repo).
- **RNF4** El diff debe revisarse para confirmar que solo cambian caracteres de texto
  (sin cambios de lógica).
- **RNF5** Se actualizan `CLAUDE.md` y `AGENTS.md` (sección SDD + regla de codificación).

## 5. Decisiones de diseño

- **D1 — Normalizar el archivo completo, no solo las cadenas visibles.** Corrige también
  comentarios y evita que queden restos que reaparezcan al copiar/editar. Riesgo controlado
  con validaciones (UTF-8 resultante válido, sin marcadores, `php -l`, diff revisado).
- **D2 — Normalización reversible por niveles con Windows-1252.** El mojibake detectado es de
  tipo UTF-8 → Windows-1252/Latin-1 repetido (2 y 3 niveles). El script invierte por niveles
  hasta estabilizar, validando cada paso; ante cualquier duda o archivo mixto se corrige a mano.
- **D3 — Conservar CRLF y UTF-8 sin BOM.**
- **D4 — Gate automático:** `scripts/check_encoding.php` (PHP puro, sin dependencias),
  ejecutable con `php scripts/check_encoding.php`; exit 0 = limpio, exit ≠ 0 = reporta archivos.
- **D5 — Mantener la regla existente del proyecto:** FPDF con `utf8_decode` (Latin-1) y Excel
  con UTF-8 puro. (Si a futuro se requieren caracteres fuera de Latin-1, será una spec aparte.)
- **D6 — Esta tarea es la Spec Piloto N.º 1 del proceso SDD del proyecto.**

## 6. Preguntas abiertas / respuestas

| Pregunta | Respuesta | Estado |
|---|---|---|
| ¿El arreglo aplica a todo Reportes por Área o solo Transporte? | Todo el apartado (Producción, Empaque, Transporte, Excel Proceso) en las 3 pestañas | Resuelta |
| ¿Los caracteres raros también están en datos de BD? | No: solo en textos fijos del reporte | Resuelta |
| ¿Solución Latin-1 corregida o fuente Unicode? | Latin-1 corregida + gate automático (sin DejaVu) | Resuelta |
| ¿Esta tarea arranca el proceso SDD? | Sí, es la Spec Piloto N.º 1 | Resuelta |
| ¿Flujo de aprobación? | Spec borrador → aprobación en chat → implementar → actualizar estado | Resuelta |

## 7. Plan de implementación

1. **Andamiaje SDD (este documento):** `docs/specs/README.md`, `_template.md`, spec 0001 en `docs/specs/consolidacion/`.
2. **Script de normalización temporal:** script PHP que invierte el mojibake por niveles
   (Windows-1252), valida UTF-8 resultante, sin marcadores y conserva CRLF; aplica solo a los
   12 archivos; revisión del diff por archivo y arreglos manuales puntuales si hay residuos
   (p. ej. emojis en comentarios).
3. **Gate permanente:** crear `scripts/check_encoding.php` (detecta BOM y secuencias mojibake
   en archivos PHP; exit ≠ 0 con lista) y ejecutarlo sobre el módulo.
4. **Documentación:** actualizar `CLAUDE.md` (regla de oro de texto + sección SDD resumida) y
   `AGENTS.md` (sección 12/13 + checklist pre-commit) apuntando a `docs/specs/`.
5. **Verificación automática:** `php -l` de todos los PHP del módulo + `scripts/check_encoding.php` + revisión del `git diff`.
6. **Cierre:** marcar la spec como `Implementada`, dejar checklist de verificación visual para
   el usuario y, cuando el usuario confirme en su entorno, pasarla a `Verificada`.

## 8. Criterios de aceptación / checklist de verificación

- [x] `php -l` pasa en los 15 generadores + helper (25 archivos del módulo OK).
- [x] `php scripts/check_encoding.php` termina con exit 0 (0 archivos con mojibake/BOM) en `src/Api/Consolidacion`.
- [x] Ningún archivo quedó con BOM y todos conservan CRLF.
- [x] Ejemplos visibles quedan correctos: `TRANSPORTE POR DÍA`, `DESPACHOS POR DÍA`,
      `Período`, `Página`, `DESCRIPCIÓN`, `CÓDIGO`, `Año`, `Consolidación`,
      "No se encontraron datos para el período seleccionado.".
- [x] Los generadores Excel no contienen `utf8_decode` (se mantiene UTF-8 puro).
- [x] `git diff` revisado: solo cambios de caracteres de texto, sin cambios de lógica/SQL.
- [x] `CLAUDE.md` y `AGENTS.md` actualizados con la regla y el comando de verificación.
- [x] El usuario genera (en su entorno) al menos un PDF de cada tipo (Producción, Empaque,
      Transporte) y un Excel (Transporte y Excel Proceso) en una pestaña y confirma que las
      tildes/ñ salen correctas → cierre (`Verificada`). **Confirmado por el usuario el 2026-09-02.**

## 9. Evidencia de verificación

- Normalizados 12 archivos (mojibake → UTF-8 correcto, reversión por niveles Windows-1252):
  Producción/Empaque Chile y Consolidado, Transporte PDF (3 pestañas), Excel Transporte (3
  pestañas), Excel Proceso Actual Chile y Consolidado.
- Ejemplo del diff (solo texto): `"MÃ©todo no permitido"` → `"Método no permitido"`,
  `"ConsolidaciÃ³n Chile"` → `"Consolidación Chile"`, `'AÃ±o'` → `'Año'`,
  `utf8_decode('TRANSPORTE POR DÃA')` → `utf8_decode('TRANSPORTE POR DÍA')`.
- `php -l` → OK en los 25 PHP del módulo.
- `php scripts/check_encoding.php src/Api/Consolidacion` → `OK: 25 archivos ... exit 0`.
- Archivos sin BOM y con CRLF (verificado por script).
- Generadores Excel con 0 usos de `utf8_decode` (UTF-8 puro, como corresponde).
- Resto de `src/Api` reportó 4 archivos con mojibake/BOM **fuera de alcance** de esta spec
  (otros módulos: CostosTransporteAereo, CostosTransporte, Dashboard, PedidosChile) — quedan
  como candidatos de una spec futura si el equipo lo requiere.

## 10. Historial

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-09-02 | v0.1 | Creación del borrador (Spec Piloto SDD N.º 1) |
| 2026-09-02 | v1.0 | Aprobada por el usuario — inicio de implementación |
| 2026-09-02 | v1.1 | Implementada: 12 archivos normalizados, gate `scripts/check_encoding.php`, CLAUDE.md/AGENTS.md actualizados. Pendiente verificación visual del usuario (`Verificada`) |
| 2026-09-02 | v1.2 | **Verificada**: el usuario confirmó que los textos con tildes/ñ salen correctos en PDF y Excel |
| 2026-09-02 | v1.3 | **Cerrada** por decisión del usuario — fin del ciclo SDD de la Spec 0001 |
