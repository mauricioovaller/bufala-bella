# 📐 Spec-Driven Development (SDD) — Bufala Bella

Este directorio centraliza las **especificaciones** de cada cambio o funcionalidad del proyecto.
La metodología que seguimos es **Spec-Driven Development (SDD)**: primero se escribe y se
**aprueba la especificación** de lo que se va a construir, y solo después se implementa.

> ⚠️ **Regla de oro:** no se implementa ningún cambio sin una spec aprobada. Si una solicitud
> no tiene spec, lo primero que se hace es redactarla (borrador) y esperar aprobación.

---

## 🔁 Flujo de trabajo

| Paso | Responsable | Qué ocurre |
|---|---|---|
| 1. Solicitud | Usuario / equipo | Llega una petición de cambio o funcionalidad nueva |
| 2. Spec borrador | Agente de desarrollo | Redacta `docs/specs/<modulo>/NNN-nombre.md` usando la plantilla `_template.md` e incluye preguntas si hace falta |
| 3. Revisión / aprobación | Usuario | Aprueba la spec o pide correcciones (en el chat o como comentarios) |
| 4. Implementación | Agente de desarrollo | Implementa **estrictamente** lo especificado, con sus pruebas/verificaciones |
| 5. Actualización de estado | Agente de desarrollo | Cambia el estado de la spec a `Implementada` y documenta evidencia |
| 6. Verificación | Usuario | Verifica en su entorno (PDF, Excel, pantalla, etc.) y confirma el cierre |

### Estados de una spec

`Borrador` → `Aprobada` → `En implementación` → `Implementada` → `Verificada` → `Cerrada` (o `Cancelada`)

---

## 🗂️ Estructura

```
docs/specs/
├── README.md                 ← este índice
├── _template.md              ← plantilla obligatoria para nuevas specs
└── <modulo>/
    └── NNN-nombre-corto.md   ← una spec por cambio
```

- **Numeración:** correlativa por módulo (001, 002, …).
- **Nombres de archivo:** `NNN-kebab-case-descriptivo.md` (sin tildes/ñ en el nombre de archivo).
- **Una spec = un cambio.** Si un cambio toca varios módulos, se crea una spec por módulo y se
  referencian entre sí.

---

## 📋 Índice de specs

| ID | Módulo | Título | Estado | Fecha |
|---|---|---|---|---|
| 0001 | Consolidación | Corrección de codificación (tildes/ñ) en generadores PDF/Excel de Reportes por Área | ✅ Cerrada | 2026-09-02 |
| 0002 | Facturación | Anexos Autodeclaración Chile: preselección por cliente y guardado exacto por planilla (consulta/correo) | ✅ Cerrada | 2026-09-02 |

---

## ✅ Reglas transversales (resumen)

1. **Spec antes de código**: crear/editar la spec primero; esperar aprobación explícita.
2. **Criterios verificables**: toda spec incluye requisitos medibles o un checklist de aceptación.
3. **Cambios pequeños y trazables**: una spec por archivo de spec; commits descriptivos referenciando `docs/specs/<id>`.
4. **Evidencia**: al marcar `Implementada`, anotar qué se ejecutó (`php -l`, tests, scripts de verificación, capturas…).
5. **Documentación viva**: CLAUDE.md y AGENTS.md se actualizan cuando el cambio altera reglas o convenciones del proyecto.
