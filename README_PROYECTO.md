# 🐃 Bufala Bella - Sistema de Gestión Integrado

![Status](https://img.shields.io/badge/Status-Producción-green)
![Version](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-Privado-red)

**Sistema integral de gestión empresarial para Bufala Bella - Productos y Servicios Lácteos**

## 📖 Descripción General

Bufala Bella es una aplicación web completa que centraliza:

- 📦 **Gestión de Productos** - Catálogo y control de inventario
- 👥 **Administración de Clientes y Conductores** - Base de datos consolidada
- 📋 **Facturación Electrónica** - Emisión de FEX y documentos
- 🚚 **Gestión de Pedidos** - Recepción, procesamiento y seguimiento
- 📊 **Dashboard Ejecutivo** - Reportes y análisis
- 📧 **Sistema de Correos Automatizado** - Documentos y notificaciones
- 🏗️ **Planificación de Producción** - Plan Vallejo y consolidación

## 🚀 Quick Start

### Requisitos Previos

```
- Node.js 16+ y npm
- PHP 7.4+
- MySQL 8.0+
- XAMPP (recomendado para desarrollo local)
```

### Instalación

```bash
# 1. Clonar repositorio
git clone [tu-repo]
cd bufala-bella

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores

# 4. Ejecutar base de datos
# Ver: database/scripts/README.md

# 5. Iniciar servidor de desarrollo
npm run dev

# La app estará en: http://localhost:5173
```

### Compilar para Producción

```bash
npm run build
npm run preview  # Ver build localmente
```

## 📚 Documentación

### 🎯 Para Empezar

1. **[AGENTS.md](./AGENTS.md)** ⭐ **LEE ESTO PRIMERO**
   - Visión general del proyecto
   - Arquitectura completa
   - Stack tecnológico
   - Convenciones de código
   - Buenas prácticas

### 📖 Documentación Extendida

- **[docs/guides/](./docs/guides/)** - Guías prácticas
  - Cómo usar sistema de correos
  - Testing y validación
  - Integración de módulos
- **[docs/development/](./docs/development/)** - Documentación técnica
  - Arquitectura detallada
  - Patrones de diseño
  - Convenciones de código
- **[docs/changelog/](./docs/changelog/)** - Historial de cambios
  - Versiones y releases
  - Cambios producción
  - Registro histórico

### 🔧 Documentación de BD

- **[database/scripts/](./database/scripts/)** - Scripts SQL
  - Cómo ejecutar migraciones
  - Descripción de tablas
  - Vistas y stored procedures

## 🏗️ Estructura del Proyecto

```
bufala-bella/
├── src/
│   ├── components/          (Componentes React)
│   ├── services/            (Lógica de negocio)
│   ├── pages/               (Páginas principales)
│   ├── assets/              (Recursos estáticos)
│   └── App.jsx              (Componente raíz)
│
├── docs/                    (Documentación)
│   ├── guides/              (Guías prácticas)
│   ├── development/         (Documentación técnica)
│   └── changelog/           (Historial de cambios)
│
├── database/scripts/        (Scripts SQL)
├── public/                  (Archivos públicos)
├── dist/                    (Build output)
│
├── AGENTS.md               (⭐ Documento maestro)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md               (Este archivo)
```

Detalle completo: ver [AGENTS.md - Sección 3](./AGENTS.md#3-estructura-del-proyecto)

## 💻 Stack Tecnológico

### Frontend

- **React 18+** - Framework UI
- **Vite** - Build tool (súper rápido)
- **Tailwind CSS** - Utilidad-first CSS
- **SweetAlert2** - Notificaciones elegantes
- **Fetch API** - HTTP requests

### Backend

- **PHP 7.4+** - Servidor
- **MySQL 8.0+** - Base de datos
- **REST API** - Integración

### Herramientas

- **Git** - Control de versiones
- **ESLint** - Code linting
- **npm** - Package manager

## 📊 Módulos Principales

| Módulo            | Estado           | Descripción                 |
| ----------------- | ---------------- | --------------------------- |
| 📦 Productos      | ✅ Producción    | Gestión de catálogo         |
| 👥 Clientes       | ✅ Producción    | Base de datos de clientes   |
| 👨‍🚗 Conductores | ✅ Producción    | Gestión de conductores      |
| 📋 Facturación    | ✅ Producción    | Emisión de FEX              |
| 📧 Correos        | ✅ Producción    | Sistema genérico de correos |
| 🚚 Pedidos        | 🔄 En desarrollo | Gestión de pedidos          |
| 📊 Dashboard      | ✅ Producción    | Reportes y análisis         |
| 🏗️ Consolidación  | 🔄 En desarrollo | Consolidación de envíos     |
| 📝 Plan Vallejo   | ✅ Producción    | Planificación FEX           |

## 🎯 Características Principales

### ✨ Sistema de Correos (Nuevo - 16/04/2026)

- ✅ Envío de correos genérico reutilizable
- ✅ Generación automática de documentos
- ✅ Adjuntos dinámicos (PDFs, etc)
- ✅ Plantillas personalizables
- ✅ Historial centralizado en BD
- ✅ Disponible en Facturación, Pedidos, Consolidación
- Ver: [GUIA_ENVIO_CORREOS_GENERICO.md](./docs/guides/GUIA_ENVIO_CORREOS_GENERICO.md)

### 📋 Facturación

- Emisión electrónica (FEX)
- Generación de PDFs
- Múltiples documentos (cartas, reportes)
- Envío automático por correo

### 🚚 Gestión de Pedidos

- Creación y seguimiento
- Estados configurables
- Documentos asociados
- Integración con transportes

### 📊 Dashboard

- Reportes en tiempo real
- Gráficas interactivas
- KPIs principales
- Exportación de datos

## 🔐 Seguridad

```
✅ Validaciones en cliente y servidor
✅ HTTPS en producción
✅ Contraseñas encriptadas
✅ Control de acceso por rol
✅ Auditoría de cambios
✅ Historial de operaciones
```

Más detalles: [AGENTS.md - Sección 15](./AGENTS.md#15-seguridad)

## 🧪 Testing

### Testing Manual

1. Sigue [GUIA_TESTING_SISTEMA_CORREOS.md](./docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md)
2. Usa [CHECKLIST](./AGENTS.md#%EF%B8%8F-checklist-antes-de-hacer-commit)

### Pre-Deploy Checklist

- [ ] Compilación sin errores: `npm run build`
- [ ] Console limpia (F12)
- [ ] Flujos críticos probados
- [ ] Responsive en mobile + desktop
- [ ] BD actualizada con scripts
- [ ] No hay credenciales en código
- [ ] Git commit descriptivo

## 🚀 Deployment

### A Desarrollo

```bash
git checkout develop
git pull
npm install
npm run dev
```

### A Producción

```bash
git checkout main
git pull
npm run build
# Copiar dist/ al servidor
# Ver documentación de hosting
```

## 📝 Convenciones de Código

**Nombres de archivos:**

```
✅ Components: PascalCase.jsx (MiComponente.jsx)
✅ Services: camelCase.js (miServicio.js)
✅ Files: Descriptivos y específicos
```

**Estructura de componentes:**

```javascript
// 1. Imports
// 2. JSDoc comments
// 3. Componente
// 4. Export
```

Completo: [AGENTS.md - Sección 5 & 6](./AGENTS.md#5-buenas-prácticas-de-código)

## 🐛 Troubleshooting

| Problema                      | Solución                                |
| ----------------------------- | --------------------------------------- |
| `npm install` falla           | Limpia node_modules y package-lock.json |
| `undefined is not a function` | Verifica imports en el archivo          |
| `CORS error`                  | Configura CORS en backend (API)         |
| `BD no se conecta`            | Revisa credenciales en .env             |
| `Build falla`                 | Verifica errores en `npm run build`     |

Más: [AGENTS.md - Sección 16](./AGENTS.md#16-troubleshooting)

## 🤝 Contribuir

### Proceso de desarrollo

1. Crea rama `feature/nombre-descriptivo`
2. Implementa siguiendo [AGENTS.md](./AGENTS.md)
3. Testa manualmente completamente
4. Commit con mensaje descriptivo
5. Push y crea pull request
6. Merge a `develop` cuando esté revisado

### Estándares

- Sigue convenciones en [AGENTS.md - Sección 6](./AGENTS.md#6-convenciones-de-nombres)
- Documenta cambios importantes
- Actualiza changelogs
- Tests deben pasar

## 📞 Soporte y Contacto

**Preguntas sobre arquitectura:**  
Ver [AGENTS.md](./AGENTS.md)

**Problemas técnicos:**  
Busca en [docs/](./docs/) o revisa git logs

**Cambios propuestos:**  
Abre issue o contacta al equipo

## 📜 Licencia

Privado - Bufala Bella  
© 2026 Todos los derechos reservados

## 🗓️ Histórico de Cambios

### v1.0.0 (16-04-2026)

- ✨ Sistema genérico de correos
- ✨ Reorganización de proyecto
- 📚 Documentación centralizada (AGENTS.md)
- 🏗️ Arquitectura mejorada

### Historial Completo

Ver [docs/changelog/](./docs/changelog/)

## 🎯 Roadmap

### Próximas Mejoras

- [ ] Completar módulo Pedidos
- [ ] Completar módulo Consolidación
- [ ] Dashboard avanzado
- [ ] Reportes exportables
- [ ] Integración con más APIs
- [ ] Performance optimizations
- [ ] Mobile app (React Native)

---

## 🚀 Comenzar Ahora

### 1️⃣ Primero: Lee [AGENTS.md](./AGENTS.md)

Tiempo: ~20 minutos  
Te da contexto completo del proyecto

### 2️⃣ Luego: Explora el código

```
src/components/correos/          # Sistema de correos
src/services/                     # Servicios
src/pages/                        # Páginas
```

### 3️⃣ Finalmente: Lee la guía que necesites

- [Guía de Correos](./docs/guides/GUIA_ENVIO_CORREOS_GENERICO.md)
- [Testing](./docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md)
- [Arquitectura](./docs/development/README.md)

---

**Última actualización:** 16 de Abril de 2026  
**Versión:** 1.0.0  
**Responsable:** Equipo de Desarrollo

**¿Preguntas?** Consulta [AGENTS.md](./AGENTS.md) - está todo ahí 📖
