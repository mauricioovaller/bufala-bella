# 🐄 Bufala Bella - Sistema de Gestión Integral

## 📋 Descripción del Proyecto

Sistema de gestión empresarial desarrollado para **Bufala Bella**, especializado en la administración integral de operaciones de producción, ventas, logística y facturación. La aplicación proporciona una plataforma centralizada para gestionar todos los aspectos del negocio con un enfoque en eficiencia, seguridad y experiencia de usuario.

## ✨ Características Principales

### 📊 **Dashboard Analítico**
- KPIs en tiempo real de ventas, producción y clientes
- Gráficos interactivos con Recharts
- Filtros por fechas personalizables
- Métricas de rendimiento por producto y región

### 🛒 **Gestión de Pedidos**
- Creación y edición completa de pedidos
- Validación en tiempo real de órdenes de compra
- Sistema de muestras (Samples) separado
- Impresión múltiple de documentos (BOL, listas de empaque, precios)
- Integración con producción y facturación

### 🏭 **Módulo de Producción**
- Asignación de responsables y lotes a pedidos
- Control de cantidades producidas vs. solicitadas
- Seguimiento en tiempo real del estado de producción
- Integración con despachos y logística

### 📄 **Sistema de Facturación**
- Generación automática de facturas
- Complementos de facturación (Plan Vallejo)
- Configuración de documentos por cliente
- Impresión masiva y personalizada
- Integración con contabilidad
- **Consulta de facturas existentes** con filtros avanzados
- **Estadísticas en tiempo real** basadas en resultados
- **Visualización de documentos asociados** (cartas, reportes, planillas)
- **Paginación y ordenamiento** de facturas

### 👥 **Gestión de Clientes y Productos**
- CRUD completo de clientes con regiones
- Catálogo de productos (orgánicos/convencionales)
- Precios y configuraciones específicas por cliente
- Historial de compras y preferencias

### 🚚 **Logística y Transporte**
- Gestión de conductores y vehículos
- Planillas de despacho
- Consolidación de pedidos por ruta
- Control de costos de transporte

### 🔐 **Sistema de Seguridad**
- Permisos por ruta basados en roles
- Autenticación con sesiones PHP
- Validación en capas (frontend y backend)
- Auditoría de operaciones críticas

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 19.1.1** - Biblioteca principal para UI
- **Vite 7.1.7** - Build tool y servidor de desarrollo
- **Tailwind CSS 3.4.1** - Framework de estilos utility-first
- **React Router DOM 7.9.2** - Enrutamiento de la aplicación
- **Recharts 3.7.0** - Gráficos y visualizaciones de datos
- **Lucide React 0.544.0** - Biblioteca de iconos
- **SweetAlert2 11.23.0** - Alertas y notificaciones

### **Backend**
- **PHP 7.4+** - Servidor backend y APIs
- **MySQL 5.7+** - Base de datos relacional
- **Apache/Nginx** - Servidor web

### **Herramientas de Desarrollo**
- **ESLint 9.36.0** - Linting y análisis de código
- **PostCSS + Autoprefixer** - Procesamiento de CSS
- **Git** - Control de versiones

## 🚀 Instalación y Configuración

### **Requisitos Previos**

1. **Node.js 18+** y npm
2. **XAMPP 8.0+** o servidor equivalente con:
   - PHP 7.4 o superior
   - MySQL 5.7 o superior
   - Apache configurado
3. **Git** para clonar el repositorio

### **Paso 1: Clonar el Repositorio**

```bash
git clone <url-del-repositorio>
cd bufala-bella
```

### **Paso 2: Instalar Dependencias de Frontend**

```bash
npm install
```

### **Paso 3: Configurar el Entorno Backend**

1. **Configurar la base de datos:**
   - Importar el archivo SQL de la base de datos
   - Configurar credenciales en `conexionbd.php`

2. **Configurar rutas en Vite:**
   - Editar `vite.config.js` y ajustar la propiedad `base` según la ruta de despliegue:
   ```javascript
   export default defineConfig({
     base: '/ruta/de/tu/aplicacion/', // Ajustar según el servidor
     plugins: [react()],
   });
   ```

3. **Configurar rutas en React Router:**
   - Ajustar el `basename` en `main.jsx` para coincidir con la ruta del servidor:
   ```jsx
   <BrowserRouter basename="/ruta/de/tu/aplicacion">
   ```

### **Paso 4: Configurar Permisos de Archivos**

```bash
# En sistemas Linux/Mac
chmod 755 src/Api/
chmod 644 src/Api/**/*.php

# Configurar permisos de escritura para logs y archivos temporales
```

### **Paso 5: Ejecutar la Aplicación**

**Modo Desarrollo:**
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`

**Build de Producción:**
```bash
npm run build
npm run preview
```

## 🏗️ Estructura del Proyecto

```
bufala-bella/
├── src/
│   ├── Api/                    # Endpoints PHP organizados por módulo
│   │   ├── Clientes/          # APIs para gestión de clientes
│   │   ├── Conductores/       # APIs para gestión de conductores
│   │   ├── Consolidacion/     # APIs para consolidación de pedidos
│   │   ├── Dashboard/         # APIs para datos del dashboard
│   │   ├── Facturacion/       # APIs para facturación
│   │   ├── MenuPrincipal/     # APIs para permisos y menú
│   │   ├── Pedidos/           # APIs para pedidos regulares
│   │   ├── PedidosSample/     # APIs para pedidos de muestra
│   │   ├── PlanVallejo/       # APIs para complementos de facturación
│   │   ├── Planillas/         # APIs para planillas de despacho
│   │   ├── Produccion/        # APIs para producción
│   │   └── Productos/         # APIs para productos
│   ├── assets/                # Recursos estáticos (imágenes, iconos)
│   ├── components/            # Componentes React reutilizables
│   │   ├── consolidacion/     # Componentes de consolidación
│   │   ├── dashboard/         # Componentes del dashboard
│   │   ├── facturacion/       # Componentes de facturación
│   │   ├── pedidos/           # Componentes de pedidos regulares
│   │   └── pedidosSample/     # Componentes de pedidos de muestra
│   ├── pages/                 # Páginas principales de la aplicación
│   │   ├── Clientes.jsx       # Página de gestión de clientes
│   │   ├── Conductores.jsx    # Página de gestión de conductores
│   │   ├── Pedidos.jsx        # Página principal de pedidos
│   │   ├── PedidosSample.jsx  # Página de pedidos de muestra
│   │   ├── Productos.jsx      # Página de gestión de productos
│   │   ├── ProduccionPedidos.jsx # Página de producción
│   │   ├── ComplementoFacturas.jsx # Página de complementos
│   │   └── Inicio.jsx         # Página de inicio
│   └── services/              # Servicios para comunicación con APIs
│       ├── conductores/       # Servicios para conductores
│       ├── dashboard/         # Servicios para dashboard
│       ├── menuPrincipal/     # Servicios para menú y permisos
│       ├── planVallejo/       # Servicios para Plan Vallejo
│       ├── produccion/        # Servicios para producción
│       └── [otros servicios]  # Servicios por módulo
├── public/                    # Archivos estáticos públicos
├── dist/                      # Build de producción (generado)
├── package.json              # Dependencias y scripts
├── vite.config.js            # Configuración de Vite
├── tailwind.config.js        # Configuración de Tailwind CSS
├── postcss.config.js         # Configuración de PostCSS
└── README.md                 # Este archivo
```

## 💻 Guía de Desarrollo

### **Convenciones de Código**

#### **Nomenclatura**
- **Componentes React**: PascalCase (ej: `DashboardDibufala.jsx`)
- **Servicios**: camelCase (ej: `pedidosService.js`)
- **APIs PHP**: PascalCase con prefijo Api (ej: `ApiGetClientes.php`)
- **Variables y funciones**: camelCase (ej: `getDatosSelect`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `MAX_PRODUCTOS`)

#### **Estructura de Componentes React**
```jsx
// 1. Imports
import React, { useState, useEffect } from "react";
import { getDatos } from "../services/miServicio";

// 2. Componente principal
export default function MiComponente({ prop1, prop2 }) {
  // 3. Hooks al inicio
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // 4. Efectos
  useEffect(() => {
    cargarDatos();
  }, []);
  
  // 5. Funciones auxiliares
  const cargarDatos = async () => {
    try {
      const datos = await getDatos();
      setEstado(datos);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };
  
  // 6. Render condicional
  if (cargando) {
    return <div>Cargando...</div>;
  }
  
  // 7. JSX principal
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Contenido */}
    </div>
  );
}
```

#### **Estilos con Tailwind CSS**
- Usar clases de utilidad de Tailwind en lugar de CSS personalizado
- Mantener consistencia en colores, espaciado y tipografía
- Utilizar componentes reutilizables para patrones comunes
- Implementar diseño responsive con breakpoints

```jsx
// Ejemplo de componente estilizado
<div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg">
  <h2 className="text-2xl font-bold text-slate-800 mb-4">Título</h2>
  <p className="text-slate-600 mb-6">Descripción del contenido.</p>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
    Acción
  </button>
</div>
```

### **Creación de Nuevos Componentes**

1. **Identificar la ubicación correcta** según el módulo
2. **Crear el archivo** con nombre en PascalCase
3. **Implementar la lógica** siguiendo la estructura estándar
4. **Conectar con servicios** correspondientes
5. **Agregar al sistema de rutas** si es una nueva página
6. **Actualizar permisos** en el sistema de menú

### **Servicios y APIs**

#### **Estructura de Servicios**
```javascript
// src/services/miModulo/miServicio.js
export async function obtenerDatos(parametro) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/MiModulo/ApiObtenerDatos.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parametro }),
        credentials: "include", // Para cookies de sesión
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerDatos:", error);
    throw error;
  }
}
```

#### **Creación de Nuevas APIs PHP**
```php
<?php
// src/Api/MiModulo/ApiNuevaFuncionalidad.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Incluir conexión a base de datos
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

// Validar conexión
if ($enlace->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $enlace->connect_error]);
    exit;
}

// Obtener y validar datos del request
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['parametro'])) {
    echo json_encode(["success" => false, "message" => "Parámetro requerido"]);
    exit;
}

// Sanitizar inputs
$parametro = $enlace->real_escape_string($data['parametro']);

// Consulta preparada para seguridad
$sql = "SELECT * FROM tabla WHERE campo = ?";
$stmt = $enlace->prepare($sql);
$stmt->bind_param("s", $parametro);
$stmt->execute();
$result = $stmt->get_result();

$datos = [];
while ($row = $result->fetch_assoc()) {
    $datos[] = $row;
}

echo json_encode(["success" => true, "datos" => $datos]);

$stmt->close();
$enlace->close();
?>
```

## 📏 Estándares de Código y Buenas Prácticas

### **Principios SOLID Aplicados**

1. **Responsabilidad Única**: Cada componente/servicio tiene una responsabilidad clara
2. **Abierto/Cerrado**: Extensible mediante composición, no modificación
3. **Sustitución de Liskov**: Componentes intercambiables manteniendo comportamiento
4. **Segregación de Interfaces**: Interfaces específicas para cada cliente
5. **Inversión de Dependencias**: Depender de abstracciones, no de implementaciones

### **Patrones de Diseño Implementados**

#### **Patrón de Servicios**
- Separación clara entre lógica de negocio y presentación
- Reutilización de lógica entre componentes
- Centralización del manejo de errores

#### **Componentización**
- Componentes pequeños y enfocados
- Props bien definidas y documentadas
- Composición sobre herencia

#### **Manejo de Estado**
- Estado local para datos de componente
- Props para comunicación padre-hijo
- Servicios para datos compartidos entre componentes no relacionados

### **Calidad de Código**

#### **Linting y Formateo**
```bash
# Ejecutar linter
npm run lint

# Verificar tipos (si se implementa TypeScript)
npm run typecheck
```

#### **Comentarios y Documentación**
```javascript
/**
 * Obtiene los datos de pedidos dentro de un rango de fechas
 * @param {string} fechaInicio - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} fechaFin - Fecha de fin en formato YYYY-MM-DD
 * @returns {Promise<Array>} - Lista de pedidos con detalles
 * @throws {Error} - Si hay error en la conexión o parámetros inválidos
 */
export async function getRangoPedidos(fechaInicio, fechaFin) {
  // Implementación...
}
```

#### **Manejo de Errores**
```javascript
try {
  const datos = await servicio.obtenerDatos();
  // Procesar datos exitosos
} catch (error) {
  // Mostrar error al usuario de forma amigable
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: 'No se pudieron cargar los datos. Por favor, intente nuevamente.',
    confirmButtonText: 'Entendido'
  });
  
  // Log para desarrollo
  console.error('Error detallado:', error);
  
  // Fallback de UI
  return <EstadoError mensaje="Error al cargar datos" />;
}
```

## 🔒 Seguridad y Protección

### **Frontend**

#### **Validación de Formularios**
- Validación en tiempo real con feedback inmediato
- Validación antes del envío al servidor
- Mensajes de error claros y específicos
- Prevención de envíos múltiples

#### **Protección contra XSS**
- Escape automático de React para contenido dinámico
- Uso de `dangerouslySetInnerHTML` solo cuando es absolutamente necesario
- Sanitización de inputs del usuario
- Content Security Policy (CSP) configurada

#### **Manejo de Sesiones**
- Credenciales almacenadas de forma segura
- Timeout de sesión automático
- Limpieza de localStorage/sessionStorage al cerrar sesión
- Protección contra ataques de fuerza bruta

### **Backend (APIs PHP)**

#### **Validación de Inputs**
```php
// Validación exhaustiva de parámetros
if (!isset($data['campo']) || empty(trim($data['campo']))) {
    echo json_encode(["success" => false, "message" => "Campo requerido"]);
    exit;
}

// Validación de tipos
if (!is_numeric($data['id'])) {
    echo json_encode(["success" => false, "message" => "ID inválido"]);
    exit;
}

// Validación de rangos
if ($data['cantidad'] < 1 || $data['cantidad'] > 1000) {
    echo json_encode(["success" => false, "message" => "Cantidad fuera de rango"]);
    exit;
}
```

#### **Protección contra SQL Injection**
- Uso exclusivo de prepared statements
- Nunca concatenar variables directamente en queries
- Sanitización de todos los inputs
- Validación de tipos antes de consultas

#### **Control de Acceso**
- Verificación de permisos por ruta
- Validación de sesión activa
- Registro de actividades sensibles
- Limitación de intentos fallidos

#### **Headers de Seguridad**
```php
// Configuración recomendada de headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: https://portal.datenbankensoluciones.com.co");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
```

### **Base de Datos**

#### **Privilegios Mínimos**
- Usuario de aplicación con permisos restringidos
- Solo SELECT, INSERT, UPDATE, DELETE en tablas necesarias
- Sin permisos de DROP, ALTER, GRANT

#### **Backup y Recuperación**
- Backups automáticos diarios
- Pruebas regulares de restauración
- Retención de backups por 30 días
- Backup antes de migraciones importantes

## 📱 Diseño Responsive y UX

### **Breakpoints de Tailwind**
```css
/* Configuración estándar */
sm: 640px   /* Móviles en landscape */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Pantallas grandes */
```

### **Patrones Responsive Comunes**

#### **Grids Adaptativos**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Los elementos se reorganizan según el tamaño de pantalla */}
</div>
```

#### **Mostrar/Ocultar Elementos**
```jsx
{/* Visible solo en desktop */}
<div className="hidden md:block">Contenido para desktop</div>

{/* Visible solo en móvil */}
<div className="md:hidden">Contenido para móvil</div>
```

#### **Tipografía Responsive**
```jsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Título que escala
</h1>
```

### **Accesibilidad**

#### **ARIA Labels y Roles**
```jsx
<button 
  aria-label="Cerrar modal"
  className="p-2 rounded hover:bg-gray-100"
>
  <X size={20} />
</button>

<nav role="navigation" aria-label="Menú principal">
  {/* Elementos de navegación */}
</nav>
```

#### **Navegación por Teclado**
- Todos los elementos interactivos son focusables
- Orden lógico de tabulación
- Atajos de teclado para acciones comunes
- Skip links para saltar navegación repetitiva

#### **Contraste y Legibilidad**
- Contraste mínimo de 4.5:1 para texto normal
- Contraste mínimo de 3:1 para texto grande
- No dependencia exclusiva del color para transmitir información
- Tamaños de fuente responsivos

### **Performance Frontend**

#### **Optimización de Imágenes**
- Uso de formatos modernos (WebP)
- Lazy loading para imágenes fuera del viewport
- Tamaños adecuados para diferentes dispositivos
- CDN para assets estáticos

#### **Code Splitting**
```jsx
// Lazy loading de rutas
const Pedidos = React.lazy(() => import('./pages/Pedidos'));

<Suspense fallback={<div>Cargando...</div>}>
  <Pedidos />
</Suspense>
```

#### **Memoización**
```jsx
// useCallback para funciones estables
const handleSubmit = useCallback((data) => {
  // Lógica que no cambia
}, []);

// React.memo para componentes puros
const MiComponente = React.memo(function MiComponente({ datos }) {
  return <div>{datos}</div>;
});
```

## 🚀 Despliegue y Mantenimiento

### **Build de Producción**

```bash
# Build optimizado
npm run build

# Preview del build
npm run preview

# El build se genera en la carpeta /dist
```

### **Configuración del Servidor**

#### **Apache (.htaccess)**
```apache
RewriteEngine On
RewriteBase /DatenBankenApp/DiBufala/

# Redirigir todas las rutas a index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# Headers de seguridad
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
```

#### **Nginx**
```nginx
location /DatenBankenApp/DiBufala/ {
    try_files $uri $uri/ /DatenBankenApp/DiBufala/index.html;
    
    # Headers de seguridad
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "DENY";
    add_header X-XSS-Protection "1; mode=block";
}
```

### **Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
VITE_API_BASE_URL=https://portal.datenbankensoluciones.com.co
VITE_APP_BASE_PATH=/DatenBankenApp/DiBufala/
VITE_ENVIRONMENT=production
```

### **Monitoreo y Logs**

#### **Logs de Aplicación**
- Logs de errores de frontend a consola
- Logs de APIs PHP a archivo
- Monitoreo de errores 4xx/5xx
- Tracking de performance

#### **Métricas Recomendadas**
- Tiempo de carga de página
- Tiempo de respuesta de APIs
- Uso de memoria del frontend
- Errores por tipo y frecuencia

### **Backup y Recuperación**

#### **Estrategia de Backup**
```bash
# Backup diario de base de datos
mysqldump -u usuario -p base_de_datos > backup_$(date +%Y%m%d).sql

# Backup semanal del código
tar -czf codigo_$(date +%Y%m%d).tar.gz src/ package.json *.config.js

# Retención: 7 días diarios, 4 semanas semanales, 12 meses mensuales
```

#### **Procedimiento de Restauración**
1. Restaurar backup de base de datos
2. Desplegar código desde backup
3. Verificar integridad de datos
4. Notificar a usuarios si es necesario

## 🔍 Módulo de Consulta de Facturas (Nuevo)

### **Funcionalidades Implementadas**

#### **Filtros de Búsqueda Avanzados**
- **Tipo de factura**: Normal, Sample, o Todos
- **Rango de fechas**: Desde/Hasta con validación
- **Número de factura**: Búsqueda por parte numérica (ej: "123" para FACT-123 o SMP-FACT-123)
- **Búsqueda en tiempo real**: Resultados actualizados automáticamente

#### **Estadísticas en Tiempo Real**
- **Total de facturas** encontradas
- **Desglose por tipo** (Normales vs Samples)
- **Valor total acumulado** de facturas
- **Actualización automática** al cambiar filtros

#### **Lista de Facturas**
- **Ordenamiento descendente** por Id_EncabInvoice (más recientes primero)
- **Datos completos**: Número, fecha, cliente, valor, tipo
- **Acciones por factura**:
  - 👁️ **Ver factura PDF**: Visualización preliminar
  - 📄 **Documentos asociados**: Cartas, reportes, planillas
- **Diseño responsive**: Adaptable a diferentes tamaños de pantalla

#### **Documentos Asociados**
- **Factura PDF**: Generado desde ApiGenerarFacturaPDF.php
- **Cartas de responsabilidad** (requieren planilla asociada):
  - ✈️ **Carta para Aerolínea**: Para transporte aéreo con opción **con firma/sin firma**
  - 👮 **Carta para Policía**: Para autorizaciones policiales con opción **con firma/sin firma**
- **Reporte de despacho**: Documento de logística
- **Plan Vallejo**: Complemento de facturación

**Nota**: Las cartas de responsabilidad utilizan el mismo componente y lógica que la pestaña "Crear Facturas", incluyendo la opción de firma mediante SweetAlert.

**Nota sobre cartas de responsabilidad**: Solo disponibles para facturas que tienen una planilla asociada (`Id_Planilla` no es null ni 0).

### **Arquitectura Técnica**

#### **Componentes React**
1. **FacturacionMain.jsx**: Componente principal con pestañas
2. **ListaFacturasGeneradas.jsx**: Componente reutilizable con modo consulta
3. **DocumentosFacturaModal.jsx**: Modal para visualizar documentos asociados

#### **Servicios Actualizados**
1. **facturacionService.js**: Nuevas funciones con filtros avanzados
   - `obtenerFacturasConFiltros()`: Para modo consulta
   - `obtenerFacturasGeneradas()`: Para modo creación (backward compatible)

#### **APIs PHP Modificadas**
1. **ApiObtenerFacturasGeneradas.php**: Agregados nuevos parámetros:
   - `tipo_factura`: Filtro por tipo (normal/sample/todos)
   - `numero_factura`: Búsqueda por número
   - `modo_consulta`: Flag para diferenciar modos
   - Campo `Id_Planilla` agregado al SELECT

#### **Patrones de Diseño Aplicados**
- **Modo dual**: Componente reutilizable con prop `modoConsulta`
- **Backward compatibility**: Funcionalidad existente no afectada
- **Separación de responsabilidades**: Lógica de filtros separada de UI
- **Paginación implícita**: Máximo 10 facturas por página (configurable)

### **Flujo de Datos**

```
Usuario establece filtros
    ↓
Componente FacturacionMain actualiza estado
    ↓
ListaFacturasGeneradas detecta cambios
    ↓
Llama a obtenerFacturasConFiltros()
    ↓
API procesa filtros y retorna datos
    ↓
Componente actualiza lista y estadísticas
    ↓
Usuario interactúa con facturas/documentos
```

### **Consideraciones de Performance**
- **Lazy loading**: Documentos se generan solo al solicitarlos
- **Paginación implícita**: API retorna máximo 10 registros
- **Cache de resultados**: Reutilización de datos entre filtros similares
- **Ordenamiento en backend**: Por Id_EncabInvoice descendente

### **Mantenimiento y Extensión**

#### **Agregar Nuevos Filtros**
1. Agregar campo en `filtrosConsulta` state
2. Actualizar UI en FacturacionMain.jsx
3. Modificar `obtenerFacturasConFiltros()` service
4. Actualizar API PHP para aceptar nuevo parámetro

#### **Agregar Nuevos Documentos**
1. Crear función en `planillasService.js`
2. Agregar botón en `DocumentosFacturaModal.jsx`
3. Implementar handler correspondiente
4. Verificar API existente o crear nueva

#### **Ajustes Realizados en Documentos (Marzo 2025)**
1. **Consistencia con "Crear Facturas"**: 
   - `DocumentosFacturaModal.jsx` ahora usa la misma lógica que `DashboardDocumentosDespacho.jsx`
   - SweetAlert para opción "con firma/sin firma" en cartas de responsabilidad
   - Mismos parámetros a `ApiGenerarPlanillasPDF.php`

2. **Validación mejorada**:
   - Cartas solo visibles cuando `Id_Planilla` no es null ni 0
   - Mensajes claros cuando no hay planilla asociada

3. **Nomenclatura actualizada**:
   - "Carta para Aerolínea" (en lugar de "Carta Aerolínea")
   - "Carta para Policía" (en lugar de "Carta Policía")
   - Colores consistentes: azul para aerolínea, verde para policía

#### **Personalizar Estadísticas**
1. Modificar `actualizarEstadisticas()` en FacturacionMain.jsx
2. Agregar nuevos cálculos según necesidades
3. Actualizar UI de resumen estadístico

### **Testing y Validación**

#### **Casos de Prueba**
1. **Filtros básicos**: Tipo (normal/sample/todos), fechas, número
2. **Estadísticas**: Cálculos correctos con diferentes datasets
3. **Documentos**: Generación y visualización de cada tipo
4. **Cartas de responsabilidad**: Opción "con firma/sin firma" funcionando correctamente
5. **Validación de planilla**: Cartas solo disponibles para facturas con planilla asociada
6. **Responsive**: Comportamiento en diferentes tamaños de pantalla
7. **Backward compatibility**: Modo creación sigue funcionando
8. **Consistencia**: Misma experiencia de usuario que pestaña "Crear Facturas"

#### **Validación de Datos**
- Fechas: Formato YYYY-MM-DD, validación de rango
- Número factura: Solo dígitos, sanitización de entrada
- Tipo factura: Valores permitidos (normal/sample/todos)
- Respuestas API: Estructura esperada, manejo de errores

## 📚 Documentación para Desarrollo Futuro

### **Agregar Nuevos Módulos**

#### **Paso 1: Crear Estructura de Carpetas**
```
src/
├── components/nuevoModulo/
│   ├── ComponentePrincipal.jsx
│   └── ComponenteSecundario.jsx
├── services/nuevoModulo/
│   └── nuevoModuloService.js
└── Api/NuevoModulo/
    ├── ApiObtenerDatos.php
    └── ApiGuardarDatos.php
```

#### **Paso 2: Implementar Servicios**
```javascript
// src/services/nuevoModulo/nuevoModuloService.js
export async function obtenerDatosNuevos() {
  // Implementación del servicio
}
```

#### **Paso 3: Crear APIs PHP**
```php
<?php
// src/Api/NuevoModulo/ApiObtenerDatos.php
// Implementación del endpoint
?>
```

#### **Paso 4: Agregar Ruta**
```jsx
// En App.jsx
import NuevoModulo from "./pages/NuevoModulo";

<Route path="nuevo-modulo" element={<NuevoModulo />} />
```

#### **Paso 5: Actualizar Permisos**
- Agregar ruta al sistema de permisos
- Configurar roles que pueden acceder
- Actualizar menú de navegación

### **Integración con APIs Externas**

#### **Patrón Recomendado**
```javascript
// Servicio dedicado para API externa
export class ApiExternaService {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }
  
  async obtenerDatos(parametros) {
    try {
      const response = await fetch(`${this.baseURL}/endpoint`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parametros)
      });
      
      return await response.json();
    } catch (error) {
      // Manejo de errores específico
      throw new Error(`Error API externa: ${error.message}`);
    }
  }
}

// Uso en componente
const apiService = new ApiExternaService(
  process.env.VITE_API_EXTERNA_URL,
  process.env.VITE_API_EXTERNA_KEY
);
```

#### **Consideraciones de Seguridad**
- Nunca exponer API keys en frontend
- Usar proxy backend para APIs sensibles
- Validar y sanitizar respuestas externas
- Implementar rate limiting

### **Mejoras de Performance**

#### **Lazy Loading de Rutas**
```jsx
// En App.jsx
const Pedidos = React.lazy(() => import('./pages/Pedidos'));
const Productos = React.lazy(() => import('./pages/Productos'));

<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="pedidos" element={<Pedidos />} />
    <Route path="productos" element={<Productos />} />
  </Routes>
</Suspense>
```

#### **Optimización de Bundles**
- Analizar bundle con `npm run build -- --report`
- Eliminar dependencias no utilizadas
- Implementar code splitting dinámico
- Usar imports dinámicos para librerías grandes

#### **Cache de Datos**
```javascript
// Estrategia de cache simple
const cache = new Map();

export async function obtenerDatosConCache(clave, fetcher) {
  if (cache.has(clave)) {
    return cache.get(clave);
  }
  
  const datos = await fetcher();
  cache.set(clave, datos);
  
  // Limpiar cache después de 5 minutos
  setTimeout(() => cache.delete(clave), 5 * 60 * 1000);
  
  return datos;
}
```

### **Testing**

#### **Estrategia Recomendada**
1. **Pruebas Unitarias**: Componentes y servicios individuales
2. **Pruebas de Integración**: Flujos completos entre componentes
3. **Pruebas E2E**: Flujos de usuario completos
4. **Pruebas de Performance**: Carga y rendimiento

#### **Configuración de Testing**
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

## 🤝 Contribución

### **Flujo de Trabajo Git**

1. **Fork** del repositorio
2. **Branch** descriptiva: `feature/nueva-funcionalidad` o `fix/correccion-error`
3. **Commits** atómicos con mensajes claros
4. **Pull Request** con descripción detallada
5. **Code Review** por al menos un mantenedor
6. **Merge** después de aprobación

### **Estándares de Commits**
```
feat: agregar nueva funcionalidad de exportación
fix: corregir validación de purchase order
docs: actualizar documentación de API
style: ajustar espaciado en componente
refactor: reorganizar servicios por módulo
test: agregar pruebas para dashboard
chore: actualizar dependencias
```

### **Code Review**

#### **Qué Revisar**
- Cumplimiento de estándares de código
- Coherencia con arquitectura existente
- Cobertura de pruebas adecuada
- Documentación actualizada
- Consideraciones de seguridad

#### **Checklist de Revisión**
- [ ] El código sigue las convenciones establecidas
- [ ] No introduce vulnerabilidades de seguridad
- [ ] Incluye pruebas adecuadas
- [ ] La documentación está actualizada
- [ ] No rompe funcionalidad existente
- [ ] El performance no se degrada significativamente

## 📞 Soporte y Contacto

### **Canales de Soporte**
- **Issues de GitHub**: Para reportar bugs y solicitar features
- **Documentación**: Esta guía y comentarios en código
- **Equipo de Desarrollo**: Contacto interno para preguntas técnicas

### **Reporte de Bugs**
Al reportar un bug, incluir:
1. **Descripción detallada** del problema
2. **Pasos para reproducir**
3. **Comportamiento esperado** vs **actual**
4. **Capturas de pantalla** si aplica
5. **Entorno** (navegador, SO, versión)

### **Solicitud de Features**
Al solicitar una nueva feature:
1. **Descripción clara** de la funcionalidad
2. **Caso de uso** específico
3. **Beneficio esperado**
4. **Alternativas consideradas**

## 📄 Licencia

Este proyecto es propiedad de **Bufala Bella** y está destinado para uso interno. El código fuente es confidencial y no debe ser distribuido fuera de la organización sin autorización expresa.

---

**Última actualización**: Marzo 2025 (Ajustes módulo consulta de facturas)  
**Versión**: 1.1.0  
**Mantenedores**: Equipo de Desarrollo Bufala Bella