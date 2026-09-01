# Bufala Bella — Instrucciones para Claude Code

**Documentación completa del proyecto:** `AGENTS.md` (leerlo antes de cualquier tarea).

Stack: React 19 + Vite + Tailwind CSS + PHP 7.4 + MySQL 8.

---

## Reglas no negociables

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

- En PDFs FPDF, las fuentes internas son Latin-1: convertir con `utf8_decode((string)$valor)` todo texto enviado a `Cell()` o `MultiCell()`.
- Después de conectar a la BD, usar `$enlace->set_charset('utf8mb4')`.
- En APIs JSON, usar `json_encode($payload, JSON_UNESCAPED_UNICODE)`.
- En React, no convertir textos; el navegador renderiza UTF-8 nativamente.
