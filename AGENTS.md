╔═══════════════════════════════════════════════════════════════════════════════╗
║ ║
║ 🤖 AGENTS.md - DOCUMENTO MAESTRO DEL PROYECTO ║
║ Buenas Prácticas, Arquitectura, Patrones ║
║ ║
║ Bufala Bella - Sistema de Gestión Integrado ║
║ ║
╚═══════════════════════════════════════════════════════════════════════════════╝

**Última actualización:** 12 de Mayo de 2026  
**Versión:** 1.5  
**Responsable:** Equipo de Desarrollo

---

## ⚡ REGLAS RÁPIDAS — LEER ANTES DE CODIFICAR

> **Para cualquier agente de IA:** antes de escribir código, lee los archivos de reglas específicos listados abajo. Son concisos y contienen las restricciones críticas que aplican a cada tipo de archivo.

| Tipo de archivo    | Archivo de reglas                                  | Contenido                                                                  |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/**/*.jsx`     | `.github/instructions/jsx-react.instructions.md`   | Mobile First, tablas, SweetAlert2, paleta de colores, spinner              |
| `src/Api/**/*.php` | `.github/instructions/php-backend.instructions.md` | Prohibición `get_result()`, prepared statements, decimales, respuesta JSON |

**Estos archivos son la fuente de verdad de las reglas de codificación.** Este documento (`AGENTS.md`) es la fuente de verdad de arquitectura, patrones y procesos.

> **Integración por agente de IA:**
>
> - **GitHub Copilot (VS Code):** lee `.github/copilot-instructions.md` + los `.instructions.md` se inyectan automáticamente según el tipo de archivo editado.
> - **Claude Code:** lee `CLAUDE.md` en la raíz.
> - **Cursor:** lee `.cursorrules` en la raíz.
> - **Cualquier otro agente:** leer este `AGENTS.md` y seguir los links de la tabla de arriba.

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
17. [MCP - Integración con Base de Datos](#17-mcp---integración-con-base-de-datos)
18. [Reglas de Diseño e Implementación](#18-reglas-de-diseño-e-implementación)

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
├─ npm scripts (Build, dev, test)
└─ MCP (Model Context Protocol) ← GitHub Copilot accede a la BD en tiempo real
```

### Testing

```
├─ Vitest 4.x (Test runner, integrado con Vite)
├─ @testing-library/react (Testing de componentes React)
├─ @testing-library/jest-dom (Matchers DOM adicionales)
├─ @testing-library/user-event (Simulación de interacciones)
├─ @testing-library/dom (Utilidades DOM)
├─ @vitest/coverage-v8 (Cobertura de código)
└─ jsdom (Entorno DOM simulado para Node.js)
```

### Dependencias Principales

```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "react-router-dom": "^7.x",
  "sweetalert2": "latest"
}
```

### Dependencias de Desarrollo (Testing)

```json
{
  "vitest": "^4.x",
  "@vitest/coverage-v8": "latest",
  "jsdom": "latest",
  "@testing-library/react": "^16.x",
  "@testing-library/jest-dom": "^6.x",
  "@testing-library/user-event": "latest",
  "@testing-library/dom": "^10.x"
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
├── 📁 mcp-mysql/                       ⭐ Servidor MCP para GitHub Copilot
│   ├── index.js                       (Servidor Node.js MCP - conexión BD)
│   ├── package.json
│   └── node_modules/
│
├── 📁 .vscode/
│   └── mcp.json                       (Configuración MCP para VS Code)
│
├── 📁 database/                       Scripts de BD
│   └── scripts/
│       ├── crear_tabla_historial_correos.sql
│       ├── crear_tabla_configuraciones_sistema.sql
│       ├── crear_tabla_correos_cuentas.sql
│       ├── create_costos_transporte_diario.sql
│       └── README.md (Cómo ejecutar scripts)
│
├── 📁 src/
│   └── __tests__/                     ⭐ Tests automatizados
│       ├── services/                  (Tests de servicios)
│       │   ├── correoService.test.js
│       │   ├── clientesService.test.js
│       │   ├── productosService.test.js
│       │   ├── facturacionService.test.js
│       │   ├── pedidosService.test.js
│       │   ├── conductoresService.test.js
│       │   ├── dashboardService.test.js
│       │   ├── produccionService.test.js
│       │   ├── menuPrincipalService.test.js
│       │   └── consolidacionService.test.js
│       ├── pages/                     (Tests de páginas)
│       │   ├── Inicio.test.jsx
│       │   ├── Clientes.test.jsx
│       │   ├── Conductores.test.jsx
│       │   └── Productos.test.jsx
│       └── App.test.jsx               (Tests de enrutamiento)
│
│   └── test/
│       └── setup.js                   (Configuración global de tests)
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
Unitarias:   Funciones individuales (servicios, helpers)
Integración: Componentes + Servicios (páginas con mocks)
Enrutamiento: Navegación y rutas de la app (App.test.jsx)
E2E:         Flujos completos del usuario (manual o Playwright)
Manual:      Testing visual y de UX
```

### 10.2 Configuración del Entorno de Tests

Vitest está configurado en `vite.config.js`:

```javascript
// vite.config.js
test: {
  globals: true,           // describe/it/expect sin importar
  environment: 'jsdom',    // Simula el DOM del navegador
  setupFiles: './src/test/setup.js',  // Setup global
  css: false,              // Ignora CSS para mayor velocidad
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'html']
  }
}
```

El archivo `src/test/setup.js` configura globalmente:

- Mock de `fetch` API (`global.fetch = vi.fn()`)
- Mock de SweetAlert2 (evita UI real en tests)
- Mock de `URL.createObjectURL/revokeObjectURL`
- Limpieza automática de mocks entre tests (`vi.clearAllMocks()`)

### 10.3 Comandos de Testing

```bash
npm test              # Ejecuta todos los tests una vez
npm run test:watch    # Modo observador (re-ejecuta al guardar)
npm run test:coverage # Tests + reporte de cobertura
npm run test:ui       # Interfaz visual de Vitest

# Ejecutar un archivo específico:
npx vitest run src/__tests__/services/clientesService.test.js

# Ejecutar tests que coincidan con un patrón:
npx vitest run --grep "validarEmail"
```

### 10.4 Cobertura Actual de Tests

```
Total: 228 tests | 17 archivos | 0 fallos (6 Mayo 2026) ✅

Servicios (11 archivos):
  correoService.test.js         - validarEmail, parsearEmails, generarNombre...
  clientesService.test.js       - listarClientes, guardar, actualizar, validar
  productosService.test.js      - listarProductos, guardar, actualizar
  facturacionService.test.js    - obtenerPedidos, guardarFactura
  pedidosService.test.js        - getDatosSelect, guardar, actualizar
  conductoresService.test.js    - listarConductores, guardar, actualizar
  dashboardService.test.js      - fetchDashboardData, APPS_CONFIG
  produccionService.test.js     - getLotes, guardarLote, getResponsables
  menuPrincipalService.test.js  - getPermisos, manejo de errores
  consolidacionService.test.js  - generarExcel, generarReportes
  pedidosChileService.test.js   - getDatosSelect, guardar, actualizar, imprimir

Páginas (5 archivos):
  Inicio.test.jsx       - renderiza, métricas, actividad reciente
  Clientes.test.jsx     - formulario, listar, toggle vista
  Conductores.test.jsx  - formulario, listar, manejo errores
  Productos.test.jsx    - formulario, listar, manejo errores
  PedidosChile.test.jsx - toolbar, modal búsqueda, filtrado, carga pedido

Enrutamiento (1 archivo):
  App.test.jsx          - las rutas de la aplicación
```

### 10.5 Convenciones para Escribir Tests

```javascript
// ✅ CORRECTO: Estructura de un test de servicio
import { describe, it, expect, vi, beforeEach } from "vitest";
import { miFuncion } from "../../services/miServicio";

describe("miFuncion", () => {
  beforeEach(() => {
    // fetch ya está mockeado globalmente en setup.js
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, datos: [] }),
    });
  });

  it("retorna datos cuando la API responde con éxito", async () => {
    const resultado = await miFuncion();
    expect(resultado).toEqual([]);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("lanza error cuando la API falla", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(miFuncion()).rejects.toThrow();
  });
});
```

```javascript
// ✅ CORRECTO: Estructura de un test de componente/página
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MiPagina from "../../pages/MiPagina";
import * as miServicio from "../../services/miServicio";

vi.mock("../../services/miServicio");

describe("MiPagina", () => {
  beforeEach(() => {
    miServicio.listarItems.mockResolvedValue({ items: [] });
  });

  it("renderiza sin errores", async () => {
    render(<MiPagina />);
    await waitFor(() => {
      expect(miServicio.listarItems).toHaveBeenCalled();
    });
  });
});
```

**⚠️ Notas importantes al escribir tests:**

- La API retorna propiedades en **PascalCase** (`Nombre`, `Id_Cliente`) — usar esas mismas en los mocks
- El `Layout` usa `<Outlet>` de React Router, no `{children}` — mockear con `vi.importActual`
- Componentes con vista desktop+mobile renderizarán el mismo texto **dos veces** → usar `getAllByText` en lugar de `getByText`
- Labels sin `htmlFor` → buscar inputs por `getByPlaceholderText` en lugar de `getByRole`
- **El primer test de un archivo de páginas puede ser lento** (carga fría del módulo) → usar `async/await` con `findByText` en lugar de `getByText` para evitar timeouts:

```javascript
// ❌ PUEDE HACER TIMEOUT en el primer test del archivo
it("renderiza el título", () => {
  render(<MiPagina />);
  expect(screen.getByText(/título/i)).toBeInTheDocument();
});

// ✅ CORRECTO: async + findByText aguanta la carga inicial
it("renderiza el título", async () => {
  render(<MiPagina />);
  expect(await screen.findByText(/título/i)).toBeInTheDocument();
});
```

### 10.6 Checklist Pre-Deploy

```
✅ npm test → 0 fallos
✅ Compilación sin errores (npm run build)
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

### 10.7 Testing de Funcionalidades Nuevas

Cuando agregues una funcionalidad nueva:

1. Crea el archivo de test en `src/__tests__/services/` o `src/__tests__/pages/`
2. Sigue las convenciones de la sección 10.5
3. Ejecuta `npm test` para verificar que no rompiste nada existente
4. Actualiza el conteo en la sección 10.4 de este documento

Ver también: `docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md`

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

2. Implementa siguiendo buenas prácticas

3. Escribe los tests (servicios + página)
   npm test → 0 fallos antes de continuar

4. ⭐ DOCUMENTA INMEDIATAMENTE — NO al final, AHORA:
   a) Actualiza AGENTS.md (sección 10.4 conteo de tests, arquitectura si cambió)
   b) Registra el cambio en docs/changelog/CAMBIOS_PRODUCCION.md
   c) Si es un sistema nuevo: crea guía en docs/guides/

5. Commit descriptivo que incluya qué se documentó

6. Push y pull request (si es equipo)

7. Merge a develop cuando esté revisado

8. Merge develop a main cuando esté listo production
```

> ⚠️ **REGLA DE ORO — Documentación Inmediata**
> La documentación se hace EN EL MISMO MOMENTO que la implementación, no después.
> Si no hay tiempo para documentar, no hay tiempo para implementar.
> GitHub Copilot debe siempre proponer la actualización de changelog y AGENTS.md
> al terminar cualquier implementación, sin esperar a que el desarrollador lo pida.

### 13.2 Qué Documentar y Dónde

| Tipo de cambio              | Dónde documentar                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| Nuevo módulo/página         | AGENTS.md (arquitectura, tests) + `docs/changelog/CAMBIOS_PRODUCCION.md` + guía en `docs/guides/` |
| Nuevo servicio PHP/JS       | AGENTS.md (sección 10.4) + `docs/changelog/CAMBIOS_PRODUCCION.md`                                 |
| Tablas SQL nuevas           | `database/scripts/README.md` + AGENTS.md (sección 17.6)                                           |
| Corrección de bug           | `docs/changelog/CAMBIOS_PRODUCCION.md` con causa y solución                                       |
| Regla nueva de arquitectura | AGENTS.md (sección 4 o 18 según aplique)                                                          |
| Cambio en tests             | AGENTS.md sección 10.4 (actualizar conteo)                                                        |

### 13.3 Estructura Mínima

```
Cada funcionalidad debe tener:

✅ Componentes bien separados
✅ Servicios con lógica centralizada
✅ Validaciones robustas
✅ Manejo de errores completo
✅ UI responsive (mobile + desktop)
✅ Tests automatizados (servicio + página)
✅ AGENTS.md actualizado (conteo tests, arquitectura)
✅ Entrada en docs/changelog/CAMBIOS_PRODUCCION.md
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

## 18. REGLAS DE DISEÑO E IMPLEMENTACIÓN

> Estas reglas son **no negociables**. Se aplican en cada archivo, en cada módulo, en cada cambio. GitHub Copilot debe respetarlas siempre.

### 18.1 PHP — Prohibiciones Estrictas

```php
// ❌ NUNCA usar get_result() — no está disponible en el servidor de producción
// (requiere mysqlnd que no está instalado)
$stmt->get_result(); // ← PROHIBIDO

// ✅ USAR SIEMPRE bind_result() + fetch()
$stmt = $conn->prepare("SELECT id, nombre FROM Clientes WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$stmt->bind_result($id, $nombre);
$stmt->fetch();

// ✅ O para múltiples filas:
$resultados = [];
while ($stmt->fetch()) {
    $resultados[] = ['id' => $id, 'nombre' => $nombre];
}
$stmt->close();
```

**Motivo:** El servidor de producción no tiene el driver `mysqlnd` habilitado.
Usar `get_result()` causa error fatal silencioso en producción aunque funcione en local.

### 18.2 Responsividad — Mobile First

La aplicación **debe verse igual de atractiva y funcional en móvil que en pantalla grande**.

```jsx
// ✅ CORRECTO: Diseño mobile-first con breakpoints Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Se apila en móvil, 2 col en tablet, 3 col en desktop */}
</div>

// ✅ Texto adaptable
<h1 className="text-lg md:text-2xl lg:text-3xl font-bold">

// ✅ Botones táctiles (mínimo 44px de alto en móvil)
<button className="py-2 px-4 md:py-1 md:px-3">

// ✅ Tablas: scroll horizontal en móvil
<div className="overflow-x-auto">
  <table className="min-w-full">

// ❌ EVITAR: Diseño fijo que no escala
<div style={{ width: '800px' }}>
```

**Checklist de responsividad antes de cada commit:**

- [ ] Probado en viewport 375px (móvil)
- [ ] Probado en viewport 768px (tablet)
- [ ] Probado en viewport 1280px+ (desktop)
- [ ] Sin scroll horizontal no deseado en móvil
- [ ] Texto legible sin hacer zoom
- [ ] Botones y campos táctiles con tamaño adecuado

### 18.3 Uniformidad Visual

Todos los módulos deben seguir el mismo lenguaje visual. **No inventar estilos nuevos** — reusar los patrones establecidos.

**Paleta de colores (Tailwind):**

```
Primario:     blue-600 / blue-700
Éxito:        green-600 / green-500
Peligro:      red-600 / red-500
Advertencia:  yellow-500 / yellow-600
Neutro:       gray-100 a gray-800
Fondo cards:  white + shadow-sm o shadow-md
```

**Estructura estándar de una página/módulo:**

```jsx
// ✅ Patrón uniforme para todas las páginas
<div className="p-4 md:p-6">
  {/* Encabezado */}
  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Título</h1>
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
      Acción Principal
    </button>
  </div>

  {/* Filtros/Búsqueda */}
  <div className="bg-white rounded-lg shadow-sm p-4 mb-4">{/* ... */}</div>

  {/* Contenido principal */}
  <div className="bg-white rounded-lg shadow-sm">
    {/* tabla, lista, cards */}
  </div>
</div>
```

**Notificaciones:** Siempre con SweetAlert2, nunca `alert()` nativo:

```javascript
// ✅ CORRECTO
Swal.fire({
  icon: "success",
  title: "Guardado",
  text: "Registro guardado correctamente.",
});

// ❌ PROHIBIDO
alert("Guardado");
```

**Estados de carga:** Siempre mostrar feedback visual:

```jsx
// ✅ Loading spinner uniforme
{
  loading && (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
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

## 17. MCP - INTEGRACIÓN CON BASE DE DATOS

### ¿Qué es el MCP aquí?

El **Model Context Protocol (MCP)** permite a GitHub Copilot acceder directamente a la base de datos MySQL de Bufala Bella en tiempo real, sin necesidad de preguntar la estructura al desarrollador.

### 17.1 Arquitectura del MCP

```
VS Code (GitHub Copilot)
        │
        ▼
  .vscode/mcp.json  ←  apunta al servidor local
        │
        ▼
  mcp-mysql/index.js  ←  servidor MCP Node.js
        │
        ▼
  MySQL remoto (datenbankensoluciones.com.co)
        │
        ▼
  Base de datos: datenban_DiBufala
```

### 17.2 Archivos Clave

| Archivo                            | Propósito                                                         |
| ---------------------------------- | ----------------------------------------------------------------- |
| `mcp-mysql/index.js`               | Servidor MCP — lógica de conexión y herramientas                  |
| `mcp-mysql/package.json`           | Dependencias del servidor (`@modelcontextprotocol/sdk`, `mysql2`) |
| `.vscode/mcp.json`                 | Configuración que VS Code usa para lanzar el servidor             |
| `docs/development/MCP_DATABASE.md` | Documentación detallada del MCP                                   |

### 17.3 Configuración Activa

**`.vscode/mcp.json`:**

```json
{
  "servers": {
    "mysql-bufala-bella": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-mysql/index.js"]
    }
  }
}
```

**Credenciales en `mcp-mysql/index.js`:**

```
Host:     datenbankensoluciones.com.co
Usuario:  datenban_Dibufala_Prueba
Base de datos: datenban_DiBufala
Puerto:   3306
```

### 17.4 Herramientas Disponibles para Copilot

| Herramienta MCP  | Qué hace                                         |
| ---------------- | ------------------------------------------------ |
| `list_tables`    | Lista todas las tablas de la BD (43 tablas)      |
| `describe_table` | Muestra columnas y tipos de una tabla específica |
| `query_db`       | Ejecuta consultas SELECT personalizadas          |

> **Seguridad:** Solo se permiten `SELECT`. INSERT, UPDATE, DELETE y DROP están bloqueados.

### 17.5 Cómo Arrancar / Reiniciar el MCP

El servidor MCP se lanza automáticamente cuando VS Code abre el workspace.

Si no responde o hay error:

1. `Ctrl+Shift+P` → **"MCP: Restart Server"**
2. O: `Ctrl+Shift+P` → **"Developer: Reload Window"**

Para probar manualmente la conexión:

```bash
cd mcp-mysql
node -e "import('mysql2/promise').then(async ({default: mysql}) => {
  const conn = await mysql.createConnection({
    host: 'TU_HOST_BD',
    user: 'TU_USUARIO_BD',
    password: 'TU_PASSWORD_BD',
    database: 'TU_BASE_DE_DATOS',
    port: 3306
  });
  const [rows] = await conn.execute('SHOW TABLES');
  console.log('Tablas:', rows.length);
  await conn.end();
})"
```

### 17.6 Tablas Disponibles en la BD (43)

```
Clientes           Conductores        Productos          Lotes
Embalajes          Bodegas            Transportadoras    Aerolineas
Agencias           Ayudantes          Responsables       Consignatarios
Agrupamientos      ClientesRegion     Permisos           PermisosAcciones
ConfiguracionesSistema  Comentarios   RegistrosExcel     CostosTransporteDiario
EncabPedido        DetPedido          ResumenPorPedido   Planillas
EncabInvoice       DetInvoice         DetInvoiceCopia
EncabPedidoSample  DetPedidoSample
ProductosTransitorios

--- Módulo Correos ---
correos_cuentas_configuracion    correos_cuentas_modulos
correos_destinatarios            correos_enviados
correos_envios_log               historial_correos
plantillas_correo                plantillas_correos_modulos
documentos_adjuntables

--- Vistas (Views) ---
vw_correos_predeterminados       vw_correos_resumen
vw_estadisticas_correos          vw_historial_reciente
```

### 17.7 Ejemplos de Uso con Copilot

Una vez activo el MCP, GitHub Copilot puede responder preguntas como:

- _"¿Qué columnas tiene la tabla Clientes?"_
- _"¿Cuántos registros hay en correos_enviados?"_
- _"Muéstrame la estructura de EncabPedido"_
- _"¿Qué relaciones tienen DetPedido y EncabPedido?"_

---

## 📚 REFERENCIAS RÁPIDAS

### Archivos Importantes

- `docs/guides/GUIA_ENVIO_CORREOS_GENERICO.md` - Cómo usar sistema de correos
- `docs/guides/GUIA_TESTING_SISTEMA_CORREOS.md` - Pruebas
- `docs/development/MCP_DATABASE.md` - Configuración MCP con BD
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
npm test          # Ejecutar todos los tests
npm run test:watch    # Tests en modo observador
npm run test:coverage # Tests + cobertura
git log --oneline # Ver commits
```

---

## ✅ CHECKLIST: ANTES DE HACER COMMIT

**Código:**

- [ ] Código sigue convenciones de nombres
- [ ] Sin errores en console
- [ ] Validaciones en lugar
- [ ] Responsivo en mobile
- [ ] Sin credenciales en código
- [ ] Sin archivos temporales

**Tests:**

- [ ] `npm test` → 0 fallos
- [ ] Tests nuevos creados para la funcionalidad implementada
- [ ] Conteo de tests en AGENTS.md sección 10.4 actualizado

**Documentación (OBLIGATORIA — no opcional):**

- [ ] AGENTS.md actualizado si hubo cambios de arquitectura o tests
- [ ] `docs/changelog/CAMBIOS_PRODUCCION.md` con entrada del cambio realizado
- [ ] Si es módulo nuevo: guía creada en `docs/guides/`
- [ ] Si hay tablas SQL nuevas: `database/scripts/README.md` actualizado

**Git:**

- [ ] Commit message descriptivo (incluye qué se implementó y qué se documentó)

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

**Última actualización:** 6 de Mayo de 2026  
**Mantenido por:** Equipo de Desarrollo  
**Próxima revisión:** Cuando agregues nueva funcionalidad importante
