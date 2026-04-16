# 📚 Guías de Desarrollo

Este directorio contiene guías prácticas y tutoriales para implementar funcionalidades y realizar tareas comunes en Bufala Bella.

## 📋 Guías Disponibles

### Sistema de Correos

- **[GUIA_ENVIO_CORREOS_GENERICO.md](./GUIA_ENVIO_CORREOS_GENERICO.md)**
  - Cómo usar el sistema genérico de correos
  - Integración en Facturación, Pedidos, Consolidación
  - Ejemplos de código
  - Configuración de plantillas y documentos

- **[GUIA_TESTING_SISTEMA_CORREOS.md](./GUIA_TESTING_SISTEMA_CORREOS.md)**
  - Procedimientos de testing manual
  - Casos de prueba
  - Validación de documentos generados
  - Verificación de historial en BD

### Guías Futuras

- `GUIA_AGREGAR_NUEVO_MODULO.md` - Crear un módulo completo
- `GUIA_INTEGRACION_NUEVAS_APIS.md` - Integrar APIs externas
- `GUIA_MEJORAR_PERFORMANCE.md` - Optimizar componentes
- `GUIA_DISEÑO_RESPONSIVE.md` - Hacer componentes mobile-friendly

## 🚀 Cómo Usar Estas Guías

1. **Elige tu tarea:** Encuentra la guía que necesites arriba
2. **Lee completamente:** Entiende el contexto antes de implementar
3. **Sigue los pasos:** Ejecuta los pasos en orden
4. **Prueba manualmente:** Valida que funciona
5. **Documenta cambios:** Actualiza AGENTS.md si cambias arquitectura

## 💡 Estructura de una Guía

Cada guía sigue este formato:

```markdown
# [Título Descriptivo]

## 🎯 Objetivo

Qué se logra con esta guía

## 📋 Requisitos Previos

Qué necesitas tener configurado

## 🏗️ Arquitectura

Diagramas y explicación de componentes

## 🔧 Pasos de Implementación

1. Paso 1
2. Paso 2
   ...

## 💻 Ejemplos de Código

Código completo listo para usar

## 🧪 Testing y Validación

Cómo probar que funciona

## 🐛 Troubleshooting

Problemas comunes y soluciones

## 📝 Notas Importantes

Limitaciones, mejoras futuras, etc.
```

## 📚 Temas por Módulo

### Facturación

```
✅ GUIA_ENVIO_CORREOS_GENERICO.md
   - Sección: Integración en Facturación
   - Documentos: Facturas, cartas, reportes
   - Generador automático de PDFs
```

### Pedidos

```
🔄 Próximas guías:
   - Envío de correos (usa GUIA_ENVIO_CORREOS_GENERICO.md)
   - Creación de pedidos
   - Seguimiento de estado
```

### Consolidación

```
🔄 Próximas guías:
   - Envío de correos (usa GUIA_ENVIO_CORREOS_GENERICO.md)
   - Consolidación de envíos
   - Generación de manifiestos
```

### Correos (Genérico)

```
✅ GUIA_ENVIO_CORREOS_GENERICO.md
   - Sistema reutilizable
   - Plantillas dinámicas
   - Historial automático

✅ GUIA_TESTING_SISTEMA_CORREOS.md
   - Pruebas exhaustivas
   - Validación de documentos
   - Verificación de BD
```

## 🎓 Flujo de Aprendizaje Recomendado

Para nuevos desarrolladores:

1. Lee **AGENTS.md** (estructura general del proyecto)
2. Lee **docs/development/ARQUITECTURA.md** (cómo está diseñado)
3. Lee **GUIA_ENVIO_CORREOS_GENERICO.md** (ejemplo completo)
4. Lee **GUIA_TESTING_SISTEMA_CORREOS.md** (cómo probar)
5. Explora el código en `src/components/correos/`
6. Explora el código en `src/services/envioCorreosGenericoService.js`

## ✍️ Cómo Escribir una Nueva Guía

Si necesitas crear una guía nueva:

```
1. Crea archivo: GUIA_NOMBRE_DESCRIPTIVO.md
2. Sigue estructura de guía (ve arriba)
3. Incluye ejemplos de código completos
4. Prueba los ejemplos antes de publicar
5. Actualiza lista en este README
6. Commit a git: "Docs: Agregar nueva guía"
```

## 🔗 Enlaces Internos

Dentro de las guías, usa referencias a:

- `../development/ARQUITECTURA.md` - Detalles técnicos
- `../changelog/VERSION_HISTORY.md` - Historial de cambios
- `../../AGENTS.md` - Estándares del proyecto
- Código fuente en `../../src/`

## 📊 Estado de Documentación

| Guía                            | Estado       | Última Actualización |
| ------------------------------- | ------------ | -------------------- |
| GUIA_ENVIO_CORREOS_GENERICO.md  | ✅ Completa  | 16-04-2026           |
| GUIA_TESTING_SISTEMA_CORREOS.md | ✅ Completa  | 16-04-2026           |
| GUIA_AGREGAR_NUEVO_MODULO.md    | 🔄 Por hacer | -                    |
| GUIA_INTEGRACION_NUEVAS_APIS.md | 🔄 Por hacer | -                    |

## 🤝 Contribuir a Documentación

Para mejorar las guías:

```
1. Identifica qué falta o qué no está claro
2. Haz cambios en la guía
3. Prueba que los ejemplos funcionen
4. Commit: "Docs: Mejorar GUIA_NOMBRE (descripción)"
5. Comunica cambios al equipo
```

## 📞 Preguntas Frecuentes sobre Guías

**P: ¿Las guías incluyen código listo para usar?**  
R: Sí, todos los ejemplos son código funcional que puedes copiar.

**P: ¿Con qué frecuencia se actualizan?**  
R: Cuando hay cambios en features o se descubren nuevas best practices.

**P: ¿Puedo agregar mis propias guías?**  
R: Sí, coordina con el equipo y sigue el formato estándar.

**P: ¿Y si una guía tiene errores?**  
R: Reporta el error y actualiza el archivo con la corrección.

---

**Última actualización:** 16 de Abril de 2026  
**Mantenido por:** Equipo de Desarrollo  
**Próximo objetivo:** Completar guías pendientes
