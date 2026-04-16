╔═══════════════════════════════════════════════════════════════════════════════╗
║ ║
║ 🤖 AGENTS.md - DOCUMENTO MAESTRO DEL PROYECTO ║
║ Buenas Prácticas, Arquitectura, Patrones ║
║ ║
║ Bufala Bella - Sistema de Gestión Integrado ║
║ ║
╚═══════════════════════════════════════════════════════════════════════════════╝

**Última actualización:** 16 de Abril de 2026  
**Versión:** 1.0  
**Responsable:** Equipo de Desarrollo

---

## 📌 TABLA DE CONTENIDOS

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Arquitectura y Patrones](#4-arquitectura-y-patrones)
5. [Buenas Prácticas de Código](#5-buenas-prácticas-de-código)
6. [Convenciones de Nombres](#6-convenciones-de-nombres)
7. [Componentes y Servicios](#7-componentes-y-servicios)
8. [Estado Management](#8-estado-management)
9. [API Integration](#9-api-integration)
10. [Testing y QA](#10-testing-y-qa)
11. [Git Workflow](#11-git-workflow)
12. [Documentación de Sistemas](#12-documentación-de-sistemas)
13. [Proceso de Desarrollo](#13-proceso-de-desarrollo)
14. [Performance y Optimización](#14-performance-y-optimización)
15. [Seguridad](#15-seguridad)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. VISIÓN GENERAL DEL PROYECTO

### Propósito

**Bufala Bella** es un sistema integral de gestión empresarial que centraliza:

- 📦 Gestión de Productos
- 👥 Administración de Clientes y Conductores
- 📋 Facturación y Documentos
- 🚚 Gestión de Pedidos y Consolidación
- 📊 Dashboard y Reportes
- 📧 Sistema de Correos Automatizado
- 🏗️ Planificación de Producción

### Alcance

- Facturación electrónica (FEX)
- Documentos de despacho y transporte
- Integración con múltiples transportes
- Generación automática de PDFs
- Envío de correos con adjuntos automáticos
- Auditoría y historial centralizado

### Usuarios Objetivo

- Administradores
- Operarios de facturación
- Gestores de pedidos
- Coordinadores de consolidación
- Personal de producción

---

## 2. STACK TECNOLÓGICO

### Frontend

```
├─ React 18.x
│  └─ Hooks (useState, useEffect, useContext, useCallback, useRef)
├─ Vite (Build tool)
├─ Tailwind CSS (Utilidad-First CSS)
├─ SweetAlert2 (Notificaciones)
├─ File API (Manejo de archivos/PDFs)
└─ Fetch API (HTTP requests)
```

### Backend

```
├─ PHP 7.4+
├─ MySQL 8.x
├─ SMTP (Correos)
├─ Archivos (PDF generation)
└─ REST API (Endpoints)
```

### Herramientas

```
├─ Git & GitHub
├─ phpMyAdmin (BD management)
├─ VS Code
├─ npm (Package manager)
├─ ESLint (Linting)
└─ npm scripts (Build, dev)
```

### Dependencias Principales

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "sweetalert2": "latest"
}
```

---

## 3. ESTRUCTURA DEL PROYECTO

### Estructura Física Recomendada

```
bufala-bella/
│
├── 📁 src/
│   ├── components/
│   │   ├── layout/                    (Componentes base)
│   │   ├── facturacion/               (Módulo Facturación)
│   │   ├── pedidos/                   (Módulo Pedidos)
│   │   ├── consolidacion/             (Módulo Consolidación)
│   │   ├── produccion/                (Módulo Producción)
│   │   ├── correos/                   (Sistema genérico de correos)
│   │   ├── dashboard/                 (Módulo Dashboard)
│   │   ├── clientes/                  (Módulo Clientes)
│   │   ├── conductores/               (Módulo Conductores)
│   │   ├── productos/                 (Módulo Productos)
│   │   └── planVallejo/               (Módulo Plan Vallejo)
│   │
│   ├── services/
│   │   ├── correoService.js           (Gestión de correos básica)
│   │   ├── envioCorreosGenericoService.js (Sistema genérico de correos)
│   │   ├── facturacionService.js      (Facturación)
│   │   ├── pedidosService.js          (Pedidos)
│   │   ├── consolidacionService.js    (Consolidación)
│   │   ├── planillasService.js        (Documentos de despacho)
│   │   ├── clientesService.js         (Clientes)
│   │   ├── conductoresService.js      (Conductores)
│   │   ├── productosService.js        (Productos)
│   │   └── dashboardService.js        (Dashboard)
│   │
│   ├── pages/                         (Páginas principales)
│   ├── assets/                        (Recursos estáticos)
│   ├── App.jsx                        (Componente raíz)
│   ├── main.jsx                       (Entry point)
│   └── index.css                      (Estilos globales)
│
├── 📁 docs/                           ⭐ NUEVA: Documentación
│   ├── AGENTS.md                      (Este archivo)
│   ├── guides/
│   │   ├── GUIA_ENVIO_CORREOS_GENERICO.md
│   │   ├── GUIA_TESTING_SISTEMA_CORREOS.md
│   │   └── GUIA_INTEGRACION_MODULOS.md
│   ├── development/
│   │   ├── ARQUITECTURA.md            (Detalles de arquitectura)
│   │   ├── PATRONES_DISEÑO.md         (Patrones utilizados)
│   │   ├── CONVENCIONES_CODIGO.md     (Normas de código)
│   │   └── CHECKLIST_NUEVAS_FUNCIONALIDADES.md
│   └── changelog/
│       ├── CHANGELOG_CORREOS.md
│       ├── CAMBIOS_PRODUCCION.md
│       └── VERSION_HISTORY.md
│
├── 📁 database/                       ⭐ NUEVA: Scripts de BD
│   └── scripts/
│       ├── crear_tabla_historial_correos.sql
│       ├── crear_tabla_configuraciones_sistema.sql
│       ├── crear_tabla_correos_cuentas.sql
│       ├── create_costos_transporte_diario.sql
│       └── README.md (Cómo ejecutar scripts)
│
├── 📁 public/                         (Archivos públicos)
├── 📁 dist/                           (Build output)
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── README.md                          (Overview del proyecto)
├── CONTRIBUTING.md                    (Guía de contribución)
└── .env.example                       (Variables de entorno)
```

### Estructura Lógica por Módulos

```
Módulo = Carpeta con estructura consistente

módulo/
├── components/
│   ├── Main.jsx                       (Componente principal del módulo)
│   ├── Detail.jsx                     (Componente de detalle)
│   ├── Form.jsx                       (Componente de formulario)
│   ├── List.jsx                       (Componente de listado)
│   └── [otros].jsx
│
├── services/
│   └── módulo-Service.js              (Lógica de negocio)
│
└── styles/
    └── módulo.css                     (Estilos específicos)
```

---

## 4. ARQUITECTURA Y PATRONES

### 4.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                      PRESENTACIÓN (React)                │
│  Componentes, Pages, Layouts - Manejo de UI y eventos  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  SERVICIOS (Lógica)                      │
│  - Gestión de estado                                    │
│  - Transformación de datos                              │
│  - Llamadas a API                                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   API REST (PHP)                         │
│  - Endpoints                                            │
│  - Validaciones                                         │
│  - Lógica de negocio backend                            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  BASE DE DATOS (MySQL)                   │
│  - Tablas                                               │
│  - Índices                                              │
│  - Relaciones                                           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Patrones Principales

#### Pattern 1: Service Layer

```javascript
// ✅ CORRECTO: Lógica en servicios
// facturacionService.js
export async function obtenerFacturas(filtros) {
  try {
    const response = await fetch(API_URL, {
      /* ... */
    });
    const datos = await response.json();
    return transformarDatos(datos);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// ✅ En componentes: solo usar el servicio
const [facturas, setFacturas] = useState([]);
useEffect(() => {
  obtenerFacturas(filtros).then(setFacturas);
}, [filtros]);
```

#### Pattern 2: Component Composition

```javascript
// ✅ CORRECTO: Componentes pequeños y reutilizables
// SelectorDocumentos.jsx - Componente genérico
const SelectorDocumentos = ({ documentos, onSeleccionar }) => {
  // Lógica específica del selector
};

// En diferentes módulos:
// facturacion, pedidos, consolidacion, etc.
<SelectorDocumentos documentos={docs} onSeleccionar={...} />
```

#### Pattern 3: Prop Drilling vs Context

```javascript
// ❌ EVITAR: Demasiados niveles de props
<Component1 user={user}>
  <Component2 user={user}>
    <Component3 user={user}>{user.name}</Component3>
  </Component2>
</Component1>;

// ✅ USAR: Context API para datos globales
const UserContext = React.createContext();
// ... usar en componentes con useContext()
```

#### Pattern 4: Async Operations

```javascript
// ✅ CORRECTO: Manejo completo de estados async
const [datos, setDatos] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const cargar = async () => {
    setLoading(true);
    try {
      const resultado = await fetchDatos();
      setDatos(resultado);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  cargar();
}, []);
```

#### Pattern 5: Generic Modal para Reutilización

```javascript
// ✅ CORRECTO: Modal genérico que funciona en múltiples módulos
const EnviarCorreoModal = ({
  modulo,
  referencia,
  documentosDisponibles,
  generadorDocumentos,
  onEnvioExitoso
}) => {
  // Lógica agnóstica del módulo
};

// Usar en Facturación
<EnviarCorreoModal modulo="facturacion" {...props} />

// Usar en Pedidos
<EnviarCorreoModal modulo="pedidos" {...props} />

// Usar en Consolidación
<EnviarCorreoModal modulo="consolidacion" {...props} />
```

---

## 5. BUENAS PRÁCTICAS DE CÓDIGO

### 5.1 React Components

```javascript
// ✅ BUENA PRÁCTICA: Componente bien estructurado
import React, { useState, useEffect, useCallback } from "react";
import { obtenerDatos } from "../../services/miServicio";
import Swal from "sweetalert2";

/**
 * MiComponente
 * @description Descripción clara del componente
 * @param {Object} props - Props del componente
 * @param {string} props.id - ID del elemento
 * @param {Function} props.onSuccess - Callback de éxito
 * @returns {JSX.Element}
 */
const MiComponente = ({ id, onSuccess = () => {} }) => {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);

  // Efectos de inicialización
  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Funciones memoizadas para evitar recreaciones innecesarias
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await obtenerDatos(id);
      setDatos(resultado);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleAccion = useCallback(async () => {
    // Lógica
    onSuccess();
  }, [onSuccess]);

  // Render condicional claro
  if (loading) return <div>Cargando...</div>;
  if (!datos) return <div>Sin datos</div>;

  return <div>{/* JSX */}</div>;
};

export default MiComponente;
```

### 5.2 Servicios

```javascript
// ✅ BUENA PRÁCTICA: Servicio bien estructurado
const BASE_URL = "https://api.ejemplo.com/v1";

/**
 * Obtiene lista de elementos
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Array>} Array de elementos
 * @throws {Error} Si hay error en la API
 */
export async function obtenerElementos(filtros = {}) {
  try {
    const params = new URLSearchParams(filtros);
    const response = await fetch(`${BASE_URL}/elementos?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const datos = await response.json();

    if (!datos.success) {
      throw new Error(datos.message || "Error desconocido");
    }

    return datos.elementos || [];
  } catch (error) {
    console.error("Error en obtenerElementos:", error);
    throw error;
  }
}

/**
 * Crea un nuevo elemento
 * @param {Object} elemento - Datos del elemento
 * @returns {Promise<Object>} Elemento creado
 */
export async function crearElemento(elemento) {
  try {
    if (!elemento || !elemento.nombre) {
      throw new Error("Datos incompletos");
    }

    const response = await fetch(`${BASE_URL}/elementos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(elemento),
    });

    const datos = await response.json();
    return datos.success ? datos.elemento : null;
  } catch (error) {
    console.error("Error en crearElemento:", error);
    throw error;
  }
}
```

### 5.3 Validaciones

```javascript
// ✅ BUENA PRÁCTICA: Validaciones centralizadas
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarTeléfono(telefono) {
  const regex = /^\d{7,12}$/;
  return regex.test(telefono);
}

export function validarFormulario(datos, reglas) {
  const errores = {};

  for (const [campo, regla] of Object.entries(reglas)) {
    if (regla.requerido && !datos[campo]) {
      errores[campo] = `${campo} es requerido`;
    }
    if (regla.minLength && datos[campo]?.length < regla.minLength) {
      errores[campo] =
        `${campo} debe tener al menos ${regla.minLength} caracteres`;
    }
    if (regla.validador && !regla.validador(datos[campo])) {
      errores[campo] = regla.mensaje || `${campo} es inválido`;
    }
  }

  return Object.keys(errores).length === 0 ? null : errores;
}
```

### 5.4 Manejo de Errores

```javascript
// ✅ BUENA PRÁCTICA: Manejo robusto de errores
async function operacionCritica() {
  try {
    // Operación
    const resultado = await fetch("/api/datos");

    if (!resultado.ok) {
      throw new Error(`HTTP ${resultado.status}`);
    }

    return resultado.json();
  } catch (error) {
    // Log para debugging
    console.error("Error en operacionCritica:", error);

    // Mostrar al usuario
    Swal.fire({
      icon: "error",
      title: "Operación Fallida",
      text: error.message || "Intenta nuevamente",
      confirmButtonColor: "#dc2626",
    });

    // Re-lanzar para que el caller sepa que falló
    throw error;
  }
}
```

---

## 6. CONVENCIONES DE NOMBRES

### 6.1 Archivos y Carpetas

```
✅ CORRECTO:
- components/pedidos/PedidoDetail.jsx          (PascalCase)
- services/facturacionService.js               (camelCase)
- helpers/formatData.js                        (camelCase)
- styles/pedidos.css                           (kebab-case o camelCase)
- database/scripts/crear_tabla_pedidos.sql     (snake_case)

❌ EVITAR:
- components/pedidos/pedido_detail.jsx         (snake_case en .jsx)
- services/FacuracionService.js                (PascalCase en .js de servicio)
- helpers/format-data.js                       (kebab-case en .js)
```

### 6.2 Componentes React

```javascript
// ✅ CORRECTO: Nombre descriptivo en PascalCase
const ListaPedidos = ({ pedidos, onSeleccionar }) => {
  return (
    // JSX
  );
};

export default ListaPedidos;

// ❌ EVITAR: Nombres vagos
const List = ({ items }) => { /* ... */ };
const Component = () => { /* ... */ };
```

### 6.3 Funciones y Variables

```javascript
// ✅ CORRECTO: Nombres descriptivos
const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
const handleGuardarCambios = async () => {
  /* ... */
};
const formatearFecha = (fecha) => {
  /* ... */
};
const esValido = true;

// ❌ EVITAR: Nombres ambiguos
const [data, setData] = useState([]);
const handleClick = () => {
  /* ... */
};
const format = (x) => {
  /* ... */
};
const valid = true;
```

### 6.4 Constantes

```javascript
// ✅ CORRECTO: UPPERCASE para constantes
export const MAX_INTENTOS_LOGIN = 5;
export const TIEMPO_TIMEOUT = 30000; // ms
export const ESTADO_FACTURA = {
  PENDIENTE: "pendiente",
  ENVIADA: "enviada",
  PAGADA: "pagada",
};

// En componentes: camelCase para variables normales
const [intentos, setIntentos] = useState(0);
const maxIntentos = MAX_INTENTOS_LOGIN;
```

---

## 7. COMPONENTES Y SERVICIOS

### 7.1 Módulos Principales

#### Facturación

```
Responsabilidad: Gestión de facturas electrónicas
Componentes: EnviarCorreoFacturaModal, ListaFacturasGeneradas
Servicios: facturacionService, envioCorreosGenericoService
Documentos: PDF facturas, cartas, reportes
```

#### Pedidos

```
Responsabilidad: Gestión de pedidos de clientes
Componentes: PedidoDetail, ListaPedidos
Servicios: pedidosService
Próxima funcionalidad: Envío de correos con documentos
```

#### Consolidación

```
Responsabilidad: Consolidación de envíos
Componentes: ConsolidacionMain
Servicios: consolidacionService
Próxima funcionalidad: Envío de correos con documentos
```

#### Correos

```
Responsabilidad: Sistema genérico de envío de correos
Componentes: EnviarCorreoModal, SelectorDocumentos
Wrappers: EnviarPedidoCorreoModal, EnviarConsolidacionCorreoModal
Servicios: correoService, envioCorreosGenericoService
Características:
  - Generación automática de documentos
  - Selección flexible de destinatarios
  - Plantillas reutilizables
  - Historial centralizado en BD
```

### 7.2 Jerarquía de Componentes

```
App
├── FacturacionMain
│   ├── FiltrosFecha
│   ├── ListaPedidos
│   ├── ConfiguracionFactura
│   ├── ListaFacturasGeneradas
│   │   └── EnviarCorreoFacturaModal (usa SelectorDocumentos)
│   └── DashboardDocumentosDespacho
│
├── PedidosMain
│   ├── PedidoDetail
│   └── EnviarPedidoCorreoModal (usa SelectorDocumentos)
│
└── ConsolidacionMain
    └── EnviarConsolidacionCorreoModal (usa SelectorDocumentos)
```

---

## 8. ESTADO MANAGEMENT

### Recomendaciones

```javascript
// Para datos compartidos entre pocos componentes:
// ✅ useState + props drilling (aceptable)

// Para datos compartidos en toda la app:
// ✅ Context API (estado local complejo)
// ⚠️ Redux (si la app crece más)

// NUNCA guardar en localStorage sin necesidad
// Solo: tokens, preferencias, datos persistentes críticos
```

### Ejemplo: Context para Usuario

```javascript
// contexts/UserContext.jsx
const UserContext = React.createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarioActual();
  }, []);

  const cargarUsuarioActual = async () => {
    try {
      // Cargar usuario de API
      const usuario = await obtenerUsuarioActual();
      setUser(usuario);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de UserProvider");
  }
  return context;
}

// En App.jsx:
<UserProvider>
  <Router>{/* ... */}</Router>
</UserProvider>;

// En componentes:
const { user, loading } = useUser();
```

---

## 9. API INTEGRATION

### 9.1 Configuración

```javascript
// constants/api.js
export const API_CONFIG = {
  BASE_URL:
    "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const ENDPOINTS = {
  FACTURACION: "/Facturacion",
  PEDIDOS: "/Pedidos",
  CORREOS: "/Correos",
  CLIENTES: "/Clientes",
  CONDUCTORES: "/Conductores",
};
```

### 9.2 Wrapper HTTP

```javascript
// services/httpClient.js
export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Uso en servicios:
export async function obtenerFacturas() {
  return fetchAPI(`${ENDPOINTS.FACTURACION}/ApiObtenerFacturas.php`);
}
```

### 9.3 Manejo de Respuestas

```javascript
// ✅ PATRÓN: Respuesta consistente
// API debe retornar:
{
  success: true/false,
  message: "Descripción",
  data: { /* ... */ },
  errors: [/* si hay */ ]
}

// En servicio:
export async function guardarDatos(datos) {
  const response = await fetchAPI('/endpoint', {
    method: 'POST',
    body: JSON.stringify(datos)
  });

  if (!response.success) {
    throw new Error(response.message);
  }

  return response.data;
}
```

---

## 10. TESTING Y QA

### 10.1 Tipos de Pruebas

```
Unitarias: Funciones individuales
Integración: Componentes + Servicios
E2E: Flujos completos del usuario
Manual: Testing visual y de UX
```

### 10.2 Checklist Pre-Deploy

```
✅ Compilación sin errores
✅ Console sin advertencias/errores rojos
✅ Flujos críticos probados manualmente
✅ Responsive en mobile y desktop
✅ BD con datos de prueba actualizados
✅ Scripts SQL ejecutados
✅ Git commit con mensaje descriptivo
✅ Push a rama correcta
✅ No hay archivos .log o temporales
✅ .env variables correctas
```

### 10.3 Testing de Funcionalidades Nuevas

Ver: `docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md`

---

## 11. GIT WORKFLOW

### 11.1 Formato de Commits

```bash
# ✅ CORRECTO
git commit -m "Feature: Implementar envío de correos genérico

- Servicio reutilizable para todos los módulos
- Modal genérico + selectores dinámicos
- Historial automático en BD
- Soporta facturación, pedidos, consolidación
- Tests pasando"

# ✅ CORRECTO (pequeño cambio)
git commit -m "Fix: Corregir validación de email en DestinatariosSelector"

git commit -m "Docs: Actualizar AGENTS.md con nuevas convenciones"

git commit -m "Refactor: Reorganizar estructura de carpetas del proyecto"

# ❌ EVITAR
git commit -m "cambios varios"
git commit -m "x"
git commit -m "Fix bug"
```

### 11.2 Estructura de Ramas

```
main (producción)
├── develop (desarrollo)
│   ├── feature/envio-correos-generico
│   ├── feature/dashboard-reportes
│   └── bugfix/validacion-email
```

### 11.3 Proceso de Push

```bash
# 1. Asegúrate de estar en develop o feature branch
git status

# 2. Añade cambios
git add .

# 3. Commit con mensaje descriptivo
git commit -m "Feature: Descripción clara"

# 4. Pull para sincronizar
git pull origin develop

# 5. Push
git push origin [nombre-rama]

# 6. Si hay cambios en develop, merge:
git checkout main
git pull origin main
git merge develop
git push origin main
```

---

## 12. DOCUMENTACIÓN DE SISTEMAS

### 12.1 Documentación Existente

```
docs/guides/
  ├── GUIA_ENVIO_CORREOS_GENERICO.md          ✅ Sistema de correos
  ├── GUIA_TESTING_SISTEMA_CORREOS.md         ✅ Testing
  └── [más guías según se agreguen]

docs/development/
  ├── ARQUITECTURA.md                          (detallar cuando sea necesario)
  ├── PATRONES_DISEÑO.md                       (detallar cuando sea necesario)
  └── CONVENCIONES_CODIGO.md                   (en este AGENTS.md)

docs/changelog/
  ├── CHANGELOG_CORREOS.md                    ✅ Historia de correos
  ├── CAMBIOS_PRODUCCION.md                   ✅ Cambios production
  └── VERSION_HISTORY.md                       (mantener actualizado)
```

### 12.2 Cómo Documentar una Funcionalidad Nueva

```markdown
# Titulo: [Nombre de la Funcionalidad]

## 🎯 Objetivo

Descripción clara de qué resuelve

## 📋 Requisitos

- Qué necesita estar en lugar
- Dependencias

## 🏗️ Arquitectura

- Componentes
- Servicios
- Base de datos

## 🔧 Implementación

- Paso a paso
- Código ejemplo

## 🧪 Testing

- Cómo probar
- Casos de éxito
- Casos de error

## 📝 Notas

- Limitaciones
- Mejoras futuras
```

---

## 13. PROCESO DE DESARROLLO

### 13.1 Cuando Empiezas una Funcionalidad Nueva

```
1. Créate rama feature
   git checkout -b feature/nombre-descriptivo

2. Actualiza AGENTS.md si cambias arquitectura

3. Implementa siguiendo buenas prácticas

4. Testa manualmente

5. Commit descriptivo

6. Push y pull request (si es equipo)

7. Merge a develop cuando esté revisado

8. Merge develop a main cuando esté listo production
```

### 13.2 Estructura Mínima

```
Cada funcionalidad debe tener:

✅ Componentes bien separados
✅ Servicios con lógica centralizada
✅ Validaciones robustas
✅ Manejo de errores completo
✅ UI responsive (mobile + desktop)
✅ Documentación clara
✅ Testing manual completado
✅ Commit bien escrito
```

---

## 14. PERFORMANCE Y OPTIMIZACIÓN

### 14.1 React Performance

```javascript
// ✅ EVITAR re-renders innecesarios
import React, { memo } from "react";

const MiComponente = memo(({ prop1, prop2 }) => {
  return (
    <div>
      {prop1} {prop2}
    </div>
  );
});

// ✅ Memoizar funciones
const handleClick = useCallback(() => {
  // Lógica
}, [dependencias]);

// ✅ Lazy loading
const ComponenteGrande = React.lazy(() => import("./ComponenteGrande"));

<Suspense fallback={<div>Cargando...</div>}>
  <ComponenteGrande />
</Suspense>;

// ✅ Virtualización para listas grandes
// Usar windowing para listas > 100 items
```

### 14.2 Optimizaciones de Red

```javascript
// ✅ Evitar múltiples requests
// NO: Llamar API en cada onChange
// SÍ: Debounce o validación al blur

const [valor, setValor] = useState("");
const [buscando, setBuscando] = useState(false);

const debouncedBusqueda = useCallback(
  debounce(async (termino) => {
    if (termino.length > 2) {
      const resultados = await buscar(termino);
      setResultados(resultados);
    }
  }, 500),
  [],
);

const handleBuscar = (e) => {
  setValor(e.target.value);
  debouncedBusqueda(e.target.value);
};
```

### 14.3 Bundle Size

```javascript
// Revisar con:
// npm run build + analizar dist/

// ✅ Evitar librerías innecesarias
// ✅ Tree-shaking activo
// ✅ Code splitting por rutas

const PedidosPage = lazy(() => import("./pages/Pedidos"));
const FacturacionPage = lazy(() => import("./pages/Facturacion"));
```

---

## 15. SEGURIDAD

### 15.1 Frontend Security

```javascript
// ✅ NO guardes tokens en localStorage
// ✅ Usa httpOnly cookies para tokens

// ✅ Valida en cliente Y servidor
export function validarEmail(email) {
  // ... validación
  // PERO: Backend TAMBIÉN valida
}

// ✅ Sanitiza datos de usuario
const sanitizado = data.replace(/<script>/g, "");

// ✅ CSRF tokens en formularios importantes
// ❌ NUNCA expongas credenciales en código
// ❌ NUNCA hagas requests a APIs externas sin CORS
```

### 15.2 API Security

```php
// Backend (PHP)

// ✅ Valida entrada SIEMPRE
$email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);

// ✅ Usa prepared statements
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);

// ✅ Hash de contraseñas
$hash = password_hash($password, PASSWORD_BCRYPT);

// ✅ CORS headers
header('Access-Control-Allow-Origin: https://dominio.com');
```

### 15.3 Data Protection

```
✅ Encriptar datos sensibles en BD
✅ HTTPS en producción SIEMPRE
✅ Logs sin datos sensibles
✅ Auditoría de cambios
✅ Backup regular
✅ Control de acceso por rol
```

---

## 16. TROUBLESHOOTING

### 16.1 Problemas Comunes

| Problema                      | Causa                    | Solución                   |
| ----------------------------- | ------------------------ | -------------------------- |
| `undefined is not a function` | Servicio no importado    | Verifica import en archivo |
| `CORS error`                  | API en diferente dominio | Configura CORS en backend  |
| `Modal no se abre`            | Props incorrectos        | Verifica isOpen={true}     |
| `No genera PDF`               | Función no existe        | Importa generador correcto |
| `BD no guarda`                | Tabla no existe          | Ejecuta script SQL         |

### 16.2 Debug Tips

```javascript
// ✅ Usa console.log estratégicamente
console.log("📧 Iniciando envío...", { modulo, referencia });

// ✅ F12 > Console para errores
// ✅ F12 > Network para requests fallidos
// ✅ F12 > Application para localStorage/cookies

// ✅ Errors informativos
if (!documento) {
  throw new Error("Documento es requerido para generar PDF");
}
```

### 16.3 Donde Buscar Errores

```
1. Console del navegador (F12)
2. Network tab (respuestas API)
3. Storage (localStorage, cookies)
4. phpMyAdmin (datos BD)
5. Logs del servidor
```

---

## 📚 REFERENCIAS RÁPIDAS

### Archivos Importantes

- `docs/guides/GUIA_ENVIO_CORREOS_GENERICO.md` - Cómo usar sistema de correos
- `docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md` - Pruebas
- `database/scripts/` - Scripts SQL
- `.env.example` - Variables de entorno

### Links Útiles

- React Docs: https://react.dev
- Tailwind: https://tailwindcss.com
- SweetAlert: https://sweetalert2.github.io

### Comandos Útiles

```bash
npm run dev       # Desarrollo
npm run build     # Build production
npm run preview   # Ver build localmente
git log --oneline # Ver commits
```

---

## ✅ CHECKLIST: ANTES DE HACER COMMIT

- [ ] Código sigue convenciones de nombres
- [ ] Sin errores en console
- [ ] Validaciones en lugar
- [ ] Responsivo en mobile
- [ ] Documentación actualizada
- [ ] Tests pasando
- [ ] Commit message descriptivo
- [ ] Sin archivos temporales
- [ ] Sin credenciales en código

---

## 🎓 CONCLUSIÓN

Este documento es la **biblia del desarrollo** en Bufala Bella.

**Mantenerlo actualizado es responsabilidad de todos.**

Cuando implementes algo nuevo:

1. Actualiza este AGENTS.md
2. Documenta en docs/guides/
3. Comenta tu código
4. Haz commits descriptivos

**La calidad del código es proporcional a la claridad de la documentación.**

---

**Última actualización:** 16 de Abril de 2026  
**Mantenido por:** Equipo de Desarrollo  
**Próxima revisión:** Cuando agregues nueva funcionalidad importante
