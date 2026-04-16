# 🤝 Guía de Contribución - Bufala Bella

Gracias por contribuir a Bufala Bella. Esta guía te ayudará a contribuir de forma efectiva.

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Antes de Empezar](#antes-de-empezar)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Commits y Pull Requests](#commits-y-pull-requests)
6. [Documentación](#documentación)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Código de Conducta

### Principios

- **Respeto:** Trata a todos con respeto y profesionalismo
- **Colaboración:** El objetivo es mejorar juntos
- **Claridad:** Comunica de forma clara y directa
- **Responsabilidad:** Hazte cargo de tu trabajo

### Comportamiento Esperado

```
✅ Respeta las opiniones diferentes
✅ Comunica constructivamente
✅ Ayuda a otros miembros del equipo
✅ Comparte conocimiento
✅ Eres accountable por tu código
```

### Comportamiento No Aceptable

```
❌ Lenguaje ofensivo o acoso
❌ Ataques personales
❌ Spam o auto-promoción
❌ Merging sin revisión
❌ Código sin testing
```

---

## 👷 Antes de Empezar

### Lee Esto (En Orden)

1. **[AGENTS.md](./AGENTS.md)** - Estándares del proyecto (30 min)
2. **[README.md](./README_PROYECTO.md)** - Overview (10 min)
3. **Documentación relevante** - Según tu tarea
4. **Código existente** - Entiende el patrón usado

### Configura tu Ambiente

```bash
# 1. Clone y instala
git clone [repo]
cd bufala-bella
npm install

# 2. Crea rama
git checkout -b feature/tu-nombre-descriptivo

# 3. Levanta servidor dev
npm run dev

# 4. Abre navegador
# http://localhost:5173
```

### Familiarízate con Estructura

```
src/
├── components/          (Componentes React)
├── services/            (Lógica de negocio)
├── pages/               (Páginas)
└── assets/              (Recursos)

docs/
├── guides/              (Guías de uso)
├── development/         (Documentación técnica)
└── changelog/           (Historial)
```

---

## 🔧 Proceso de Desarrollo

### Fase 1: Planificación

```
1. Abre/sigue un issue
2. Entiende el alcance
3. Identifica cambios necesarios
4. Crea rama feature
```

**Nombre de rama:**

```
feature/nombre-descriptivo      ✅
bugfix/nombre-descriptivo       ✅
refactor/nombre-descriptivo     ✅
docs/nombre-descriptivo         ✅

feature/x                       ❌ (vago)
nueva-cosa                      ❌ (no sigue patrón)
```

### Fase 2: Implementación

```bash
# Mientras desarrollas:
git status              # Ver cambios
git add [files]         # Agregar cambios
git commit -m "..."     # Commit descriptivo

# Mantente actualizado:
git pull origin develop # Sincronizar
```

**Estructura de archivos:**

```
Nuevo componente:
src/components/[modulo]/MiComponente.jsx

Nuevo servicio:
src/services/miServicio.js

Nuevos estilos:
src/components/[modulo]/styles/

Documentación:
docs/guides/GUIA_MI_FUNCIONALIDAD.md
```

### Fase 3: Testing

```bash
# Antes de commit:
npm run build           # Compilar
npm run lint            # Verificar código
# Prueba manual (F12 > Console)

# Checklist:
[ ] Compile sin errores
[ ] Console limpia
[ ] Funciona en mobile + desktop
[ ] BD actualizada si necesario
[ ] Documentación actualizada
```

### Fase 4: Commit y Push

```bash
git add .
git commit -m "Feature: Descripción clara (ABC-123)"
git push origin feature/mi-rama
```

### Fase 5: Pull Request

```
Crea PR con:
- Descripción clara
- Cambios principales
- Testing realizado
- Screenshots si es UI
- Links a documentación
```

---

## 📝 Estándares de Código

### React Components

```javascript
// ✅ CORRECTO: Bien estructurado
import React, { useState, useEffect } from "react";
import { obtenerDatos } from "../../services/miServicio";

/**
 * MiComponente - Descripción clara
 * @param {Object} props
 * @param {string} props.id - Qué es esto
 * @returns {JSX.Element}
 */
const MiComponente = ({ id, onSuccess = () => {} }) => {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      const resultado = await obtenerDatos(id);
      setDatos(resultado);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return <div>{/* JSX */}</div>;
};

export default MiComponente;

// ❌ EVITAR:
const Component = ({ x }) => <div>{x}</div>; // Nombre vago
```

### Servicios

```javascript
// ✅ CORRECTO: Con documentación y error handling
/**
 * Obtiene datos del servidor
 * @param {string} id - ID del elemento
 * @returns {Promise<Object>} Datos obtenidos
 * @throws {Error} Si hay error en API
 */
export async function obtenerDatos(id) {
  if (!id) throw new Error("ID requerido");

  try {
    const response = await fetch(`/api/datos/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error("Error en obtenerDatos:", error);
    throw error;
  }
}
```

### Validaciones

```javascript
// ✅ Validar entrada SIEMPRE
export function validarEmail(email) {
  if (!email || typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// En componentes:
if (!validarEmail(email)) {
  throw new Error("Email inválido");
}
```

---

## 💬 Commits y Pull Requests

### Formato de Commit

```bash
# Feature
git commit -m "Feature: Agregar envío de correos (ABC-123)

- Descripción de qué hace
- Cambios principales
- Impacto
"

# Bug
git commit -m "Fix: Corregir validación de email

- Problema: Aceptaba emails inválidos
- Solución: Mejorar regex
- Testing: ✅ Casos cubiertos
"

# Refactor
git commit -m "Refactor: Reorganizar servicios

- Movido lógica a nuevos servicios
- Mejor separación de responsabilidades
- Cero cambio funcional
"

# Docs
git commit -m "Docs: Actualizar AGENTS.md

- Agregar sección sobre testing
- Mejorar ejemplos
"
```

### Pull Request Template

```markdown
## Descripción

Descripción clara de qué hace este PR

## Cambios Principales

- Cambio 1
- Cambio 2
- Cambio 3

## Tipo de Cambio

- [ ] Feature nueva
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentación

## Testing

- [ ] Tested en Chrome
- [ ] Tested en Firefox
- [ ] Responsive OK
- [ ] BD migrada (si necesario)
- [ ] Sin errores en console

## Screenshots (si aplica)

[Mostrar cambios visuales]

## Links

- Closes: #123
- Relacionado con: docs/guides/...
- Tests: docs/guides/GUIA*TESTING*\*.md

## Notas para Reviewer

Instrucciones especiales para reviewer
```

---

## 📚 Documentación

### Cuando Documentar

```
✅ Feature nueva importante
✅ Cambio en arquitectura
✅ Nuevo patrón implementado
✅ Funcionalidad compleja
❌ Typo corregido
❌ Cambio interno menor
```

### Dónde Documentar

```
Guías prácticas:
docs/guides/GUIA_MI_FUNCIONALIDAD.md

Documentación técnica:
docs/development/ARQUITECTURA.md

Historial de cambios:
docs/changelog/CHANGELOG_*.md

Cambios importantes:
Actualizar AGENTS.md Sección relevante
```

### Ejemplo de Documentación Nueva

```markdown
# GUIA_MI_FUNCIONALIDAD.md

## 🎯 Objetivo

Qué resuelve esta funcionalidad

## 📋 Requisitos

Qué necesitas tener listo

## 🏗️ Arquitectura

Componentes, servicios, BD

## 🔧 Implementación

1. Paso a paso
2. Código ejemplo
3. Testing

## 🐛 Troubleshooting

Problemas comunes
```

---

## 🧪 Testing

### Testing Manual (Requerido)

Antes de cada commit:

```
1. Funcionalidad principal
   [ ] Happy path funciona
   [ ] Estados alternativos OK
   [ ] Errores manejados

2. UI/UX
   [ ] Responsive (mobile + desktop)
   [ ] Estilos correctos
   [ ] Sin layout shift
   [ ] Accesibilidad OK (Tab, Enter, etc)

3. Performance
   [ ] No demora notablemente
   [ ] Console sin errores
   [ ] Red requests razonables

4. Integración
   [ ] Otras features no se rompieron
   [ ] BD si necesario
   [ ] APIs respondiendo
```

### Cómo Testear Sistema de Correos

Ver [docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md](./docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md)

### Checklist Pre-Commit

```bash
# 1. Compilar
npm run build

# 2. Abrir F12 > Console
# Verificar: Sin errores rojos, solo warnings aceptables

# 3. Testing manual (5-10 minutos)
# Prueba funcionalidad en navegador

# 4. Responsive (F12 > Toggle device toolbar)
# [ ] Desktop (1920px)
# [ ] Tablet (768px)
# [ ] Mobile (375px)

# 5. Ready para commit
git add .
git commit -m "..."
git push
```

---

## 🆘 Troubleshooting

### "My branch is behind develop"

```bash
git fetch origin
git rebase origin/develop
# O merge si prefieres:
git merge origin/develop
git push origin feature/mi-rama
```

### "Conflict en merge"

```bash
# 1. VSCode te mostrará conflictos
# 2. Resuelve manually
# 3. git add [archivos]
# 4. git commit -m "Merge: Resolver conflictos"
# 5. git push
```

### "Build falla"

```bash
npm run build
# Lee los errores cuidadosamente
# Más común: imports incorrectos o typos
```

### "Console tiene errores"

```
1. Abre F12
2. Busca línea roja
3. Click para ver detalles
4. Haz debugging en VSCode
5. Usa console.log() si necesario
```

### "PR comentado con cambios"

```bash
# 1. Haz los cambios solicitados
# 2. Commit: "Review: Implementar sugerencias"
# 3. Push (auto-actualiza PR)
# 4. Responde comentarios en GitHub
```

---

## ✅ Checklist Finalización

Antes de marcar como "Ready":

### Código

- [ ] Sigue estándares en AGENTS.md
- [ ] Sin errores en console
- [ ] Imports correctos
- [ ] Nombres descriptivos
- [ ] Comentarios donde necesario

### Documentación

- [ ] AGENTS.md actualizado (si aplica)
- [ ] Guía creada (si es feature)
- [ ] Comentarios en código claro
- [ ] JSDoc en funciones públicas

### Testing

- [ ] Tested en multiple navegadores
- [ ] Responsive OK
- [ ] Flujos principales funcionan
- [ ] Errors manejados
- [ ] BD actualizada (si necesario)

### Commit

- [ ] Mensaje descriptivo
- [ ] Referencias a issues/docs
- [ ] Branch limpia
- [ ] Listo para merge

---

## 🎓 Recursos

- [AGENTS.md](./AGENTS.md) - Todo sobre el proyecto
- [README.md](./README_PROYECTO.md) - Overview
- [docs/guides/](./docs/guides/) - Guías prácticas
- [docs/development/](./docs/development/) - Documentación técnica

---

## 🎊 ¡Gracias por Contribuir!

Tu trabajo mejora Bufala Bella para todos. Si tienes preguntas, abre un issue o contacta al equipo.

**Happy coding! 🚀**
