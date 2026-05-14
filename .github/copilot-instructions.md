# Bufala Bella — Instrucciones para GitHub Copilot

Proyecto de gestión empresarial. Stack: React 19 + Vite + Tailwind CSS + PHP 7.4 + MySQL 8.

**Documentación completa:** `AGENTS.md` en la raíz del proyecto.
**Reglas por tipo de archivo:** `.github/instructions/jsx-react.instructions.md` y `.github/instructions/php-backend.instructions.md`

---

## Reglas no negociables (aplican a TODO el proyecto)

### PHP — CRÍTICO

- **NUNCA usar `get_result()`** — el servidor de producción no tiene `mysqlnd`. Usar siempre `bind_result()` + `fetch()`.
- **Siempre prepared statements** — nunca concatenar variables en queries SQL.
- **Decimales:** usar `round((float)$valor, 4)`, nunca `(int)$valor`.

### React/JSX — CRÍTICO

- **Mobile First siempre.** Todo componente debe funcionar bien en 375px. Usar breakpoints Tailwind (`md:`, `lg:`).
- **Tablas:** envolver siempre en `<div className="overflow-x-auto">`.
- **Notificaciones:** solo SweetAlert2. Nunca `alert()` nativo.
- **Fechas lado a lado en móvil:** usar `grid grid-cols-2` en lugar de `flex-col`.

### General

- Respuestas API siempre con `{ success: true/false, message: "...", datos: [...] }`.
- Feedback visual de carga obligatorio (`animate-spin` con `border-blue-600`).
- Paleta: primario `blue-600`, éxito `green-600`, peligro `red-600`.
