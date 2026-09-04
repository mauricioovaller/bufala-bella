# Bufala Bella — Instrucciones para Claude Code

**Documentación completa del proyecto:** `AGENTS.md` (leerlo antes de cualquier tarea).
**Metodología de desarrollo:** Spec-Driven Development (SDD) — ver `docs/specs/README.md`.

Stack: React 19 + Vite + Tailwind CSS + PHP 7.4 + MySQL 8.

---

## Reglas no negociables

### Spec-Driven Development (SDD)

- **Una solicitud de cambio no se implementa sin spec aprobada.** Si la solicitud no tiene spec, primero se redacta el borrador en `docs/specs/<modulo>/NNN-nombre.md` (plantilla: `docs/specs/_template.md`) y se espera la aprobación del usuario.
- Flujo: solicitud → spec borrador (con preguntas si aplica) → **aprobación del usuario** → implementación → actualizar estado de la spec (`Borrador → Aprobada → En implementación → Implementada → Verificada`).
- Al terminar un cambio, actualizar el estado en el archivo de la spec y en el índice `docs/specs/README.md`.
- La spec es la fuente de verdad: no se agregan funcionalidades que no estén en ella, ni se omiten requisitos aprobados sin actualizar la spec primero.

### PHP (`src/Api/**/*.php`)

- **NUNCA `get_result()`** — producción no tiene `mysqlnd`. Usar siempre `bind_result()` + `fetch()`.
- Siempre `prepared statements`. Nunca concatenar variables en SQL.
- Decimales: `round((float)$valor, 4)` — nunca `(int)$valor`.
- Respuesta JSON: `{ success, message, datos }` siempre.

### React/JSX (`src/**/*.jsx`)

- **Mobile First obligatorio.** Diseñar primero para 375px, escalar con `md:`, `lg:`.
- Tablas siempre dentro de `<div className="overflow-x-auto">`.
- Notificaciones solo con SweetAlert2. Nunca `alert()`.
- Pares de inputs (ej. fecha inicio/fin): `grid grid-cols-2`, no `flex-col`.
- Paleta: primario `blue-600`, éxito `green-600`, peligro `red-600`.
- Spinner de carga: `animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600`.

### General

- Antes de crear archivos, leer los existentes.
- Tests en `src/__tests__/`. Correr `npm test` antes de commit.
- Commits descriptivos según formato en `AGENTS.md` sección 11.1.

### Regla de oro de codificación de texto (tildes, ñ y caracteres especiales)

- **Los archivos PHP se guardan en UTF-8, sin BOM, y con los textos correctos** (nunca con "mojibake" tipo `Ã©`, `Ã±`, `DÃA`). Si un archivo ya tiene mojibake, se normaliza antes de editar (ver Spec SDD 0001).
- **Gate de codificación (obligatorio antes de commit):** correr `php -l <archivo>` y `php scripts/check_encoding.php` (exit 0 = limpio). Esto detecta BOM, UTF-8 inválido y secuencias mojibake que producen símbolos raros en PDF/Excel.
- En PDFs FPDF, las fuentes internas son Latin-1: convertir con `utf8_decode((string)$valor)` todo texto enviado a `Cell()` o `MultiCell()`.
- Después de conectar a la BD, usar `$enlace->set_charset('utf8mb4')`.
- En APIs JSON, usar `json_encode($payload, JSON_UNESCAPED_UNICODE)`.
- En Excel (PhpSpreadsheet) el texto va en UTF-8 puro: **no** aplicar `utf8_decode` a datos ni literales.
- En React, no convertir textos; el navegador renderiza UTF-8 nativamente.
