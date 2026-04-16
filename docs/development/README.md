# 🏗️ Documentación de Desarrollo

Este directorio contiene documentación técnica sobre arquitectura, patrones y estándares de código del proyecto Bufala Bella.

## 📋 Documentos Disponibles

### Arquitectura y Diseño

- **AGENTS.md** (en raíz) ⭐ **DOCUMENTO MAESTRO**
  - Visión general del proyecto
  - Stack tecnológico completo
  - Patrones de arquitectura
  - Convenciones de nombres
  - Buenas prácticas
  - Git workflow

- **[ARQUITECTURA.md](./ARQUITECTURA.md)** (Por crear si necesario)
  - Diagramas detallados
  - Flujos de datos
  - Interacción entre módulos
  - Decisiones arquitectónicas

- **[PATRONES_DISEÑO.md](./PATRONES_DISEÑO.md)** (Por crear si necesario)
  - Patrones React utilizados
  - Patrones de servicios
  - Patrones de BD
  - Antipatterns a evitar

- **[CONVENCIONES_CODIGO.md](./CONVENCIONES_CODIGO.md)**
  - Referencia de convenciones (en AGENTS.md por ahora)
  - Estilos de código
  - Estructura de carpetas

## 📚 Cómo Usar Esta Documentación

### Para Desarrolladores Nuevos

1. Lee **AGENTS.md** (20 minutos)
2. Explora la estructura en `src/`
3. Lee una guía que te interese en `docs/guides/`
4. Estudia el código fuente (componentes + servicios)

### Para Code Reviews

1. Verifica que siga convenciones de AGENTS.md
2. Revisa patrones en PATRONES_DISEÑO.md
3. Chequea estructura en ARQUITECTURA.md
4. Valida contra CONVENCIONES_CODIGO.md

### Para Decisiones Arquitectónicas

1. Consulta ARQUITECTURA.md
2. Revisa precedentes en code
3. Propone cambios con documentación
4. Actualiza AGENTS.md si aprueba

## 🏭 Patrones Principales (Resumen)

### Service Layer Pattern

```
Componente → Servicio → API REST → BD
```

La lógica de negocio va en servicios, no en componentes.

### Component Composition Pattern

```
App
├── Layout
├── PageComponent
│   ├── ListComponent
│   ├── DetailComponent
│   └── FormComponent
```

Componentes pequeños y reutilizables.

### Generic Modal Pattern

```
EnviarCorreoModal (Genérico)
├── EnviarPedidoCorreoModal (Wrapper para Pedidos)
├── EnviarFacturaCorreoModal (Refactorizado para Facturación)
└── EnviarConsolidacionCorreoModal (Wrapper para Consolidación)
```

Componente genérico + wrappers específicos por módulo.

## 🔍 Referencias Cruzadas

```
AGENTS.md ─────────────┬─────────────── Visión General
                       │
                   Contiene
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Arquitectura    Patrones      Convenciones
        │              │              │
        ↓              ↓              ↓
   (Detalles)     (Ejemplos)    (Estándares)
        │              │              │
        └──────────────┼──────────────┘
                       │
            Aplicados en código
                       │
        src/components/
        src/services/
        src/pages/
```

## 📊 Estructura de la Documentación

```
docs/
├── AGENTS.md                          ⭐ MAESTRO
│
├── guides/                             📚 PRÁCTICO
│   ├── GUIA_ENVIO_CORREOS_GENERICO.md
│   ├── GUIA_TESTING_SISTEMA_CORREOS.md
│   └── README.md
│
├── development/                        🏗️ TÉCNICO
│   ├── ARQUITECTURA.md
│   ├── PATRONES_DISEÑO.md
│   ├── CONVENCIONES_CODIGO.md
│   └── README.md (este archivo)
│
└── changelog/                          📝 HISTÓRICO
    ├── VERSION_HISTORY.md
    ├── CHANGELOG_CORREOS.md
    ├── CAMBIOS_PRODUCCION.md
    └── README.md
```

## 🎯 Decisiones Arquitectónicas Importantes

### 1. Service Layer Centralizado

**Decisión:** Toda la lógica de negocio en `src/services/`  
**Razón:** Reutilización, testabilidad, separación de responsabilidades  
**Implicación:** Los componentes solo manejan UI

### 2. Componentes Genéricos + Wrappers

**Decisión:** `EnviarCorreoModal` genérico + wrappers por módulo  
**Razón:** DRY (Don't Repeat Yourself), reutilización entre módulos  
**Implicación:** Fácil agregar a nuevos módulos

### 3. Historial en BD, No en Memoria

**Decisión:** Correos registrados en `correos_enviados` tabla  
**Razón:** Auditoría, reportes, recuperación ante fallos  
**Implicación:** Cada envío deja rastro inmutable

### 4. Vistas (Views) para Reportes

**Decisión:** Usar vistas SQL para queries complejas  
**Razón:** Performance, mantenibilidad, reutilización  
**Implicación:** Reportes más rápidos y fiables

### 5. Context API vs Redux

**Decisión:** Context API para estado local complejo  
**Razón:** Simplifica dependencias, suficiente para escala actual  
**Implicación:** Redux si la app crece x3 en complejidad

## 🚀 Cómo Agregar Documentación Nueva

### Para Crear ARQUITECTURA.md:

```
1. Analiza el proyecto actual
2. Documenta:
   - Componentes principales
   - Flujos de datos
   - Integraciones
   - Decisiones de diseño
3. Incluye diagramas (Mermaid o Excalidraw)
4. Añade ejemplos de código
5. Actualiza referencias en AGENTS.md
```

### Para Crear PATRONES_DISEÑO.md:

```
1. Identifica patrones usados
2. Para cada patrón:
   - Descripción
   - Cuándo usarlo
   - Ejemplo en código
   - Alternativas
3. Listar antipatterns
4. Mejores prácticas
```

## ✅ Checklist: Antes de Llamar "Documentado"

- [ ] Hay descripción clara del objetivo
- [ ] Hay ejemplos de código funcionales
- [ ] Hay diagrama si es complejo
- [ ] Está actualizado con versión actual del código
- [ ] Se referencia desde AGENTS.md
- [ ] No hay links rotos
- [ ] Alguien más puede entenderlo sin pedir ayuda

## 🔗 Cómo Referenciar Documentos

### Dentro de documentos (Markdown):

```markdown
Ver [AGENTS.md](../../AGENTS.md) para estándares generales.
Ver [GUIA_ENVIO_CORREOS_GENERICO.md](../guides/GUIA_ENVIO_CORREOS_GENERICO.md) para usar sistema de correos.
```

### Desde componentes (comentarios):

```javascript
/**
 * Para entender cómo funciona este patrón:
 * Ver: docs/development/PATRONES_DISEÑO.md#generic-components
 */
```

### Desde commits:

```bash
git commit -m "Feature: Implementar X

Ver documentación en: docs/development/ARQUITECTURA.md#seccion"
```

## 📊 Documentación por Módulo

### Facturación

```
AGENTS.md
├── Sección 4: Arquitectura
├── Sección 7: Componentes
└── Sección 12: Documentación de Sistemas

GUIA_ENVIO_CORREOS_GENERICO.md
├── Integración en Facturación
└── Documentos específicos

Código
├── src/components/facturacion/
├── src/services/facturacionService.js
└── src/services/envioCorreosGenericoService.js
```

### Correos (Genérico)

```
AGENTS.md
├── Sección 4.2: Patterns (Generic Modal)
├── Sección 7.1: Módulos Principales
└── Sección 8: Estado Management

GUIA_ENVIO_CORREOS_GENERICO.md (Completo)

GUIA_TESTING_SISTEMA_CORREOS.md (Completo)

Código
├── src/components/correos/
├── src/services/envioCorreosGenericoService.js
├── src/services/correoService.js
└── database/scripts/crear_tabla_historial_correos.sql
```

## 🔮 Mejoras Futuras de Documentación

```
[ ] Agregar ARQUITECTURA.md con diagramas Mermaid
[ ] Agregar PATRONES_DISEÑO.md con ejemplos
[ ] Crear videos tutoriales cortos (2-5 min)
[ ] Agregar diagrama interactivo de componentes
[ ] Documentar APIs más en detalle
[ ] Guía de migraciones de BD
[ ] Guía de deployment a producción
[ ] Checklist de security
```

## 📞 Preguntas Frecuentes

**P: ¿Dónde encuentro cómo funciona X?**
R: Busca en AGENTS.md, luego en el código fuente.

**P: ¿Quién mantiene la documentación?**
R: Todo el equipo - es responsabilidad de todos.

**P: ¿Con qué frecuencia se actualiza?**
R: Después de cambios importantes, al menos cada trimestre.

**P: ¿Puedo proponer cambios a la documentación?**
R: Sí, abre un issue o edita directamente.

---

**Última actualización:** 16 de Abril de 2026  
**Mantenido por:** Equipo de Desarrollo  
**Próxima revisión:** Cuando se agregue documentación de nuevos módulos
