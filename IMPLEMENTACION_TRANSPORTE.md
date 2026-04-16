# IMPLEMENTACIÓN DE GRÁFICAS DE COSTOS DE TRANSPORTE

## 📋 Resumen del Proyecto

Se han implementado gráficas para visualizar costos de transporte en el dashboard, incluyendo:
- **3 Gráficas**: Tendencia diaria, comparación costos vs estibas, y KPIs
- **Diseño Responsivo**: Funciona en móvil, tablet y desktop
- **Integración Completa**: Sección independiente en el dashboard principal
- **Código Limpio**: Documentado y con buenas prácticas

## 🏗️ Estructura Implementada

### 1. **APIs (PHP)**
- `ApiDashboardCostosTransporte.php` - API principal (necesita tabla `ConfiguracionesSistema`)
- `ApiDashboardCostosTransporte_simple.php` - Versión de prueba con datos simulados

### 2. **Servicios (JavaScript)**
- `dashboardService.js` - Extendido con `fetchCostosTransporte()` y configuraciones

### 3. **Componentes React**
- `KPICardsTransporte.jsx` - 4-5 KPIs con métricas clave
- `ChartCostosTransporte.jsx` - Gráfico de línea (tendencia diaria)
- `ChartCostosVsEstibas.jsx` - Gráfico de barras combinado
- `SeccionTransporte.jsx` - Contenedor principal con estados y manejo de errores

### 4. **Integración**
- `DashboardDibufala.jsx` - Agregada sección de transporte después de ventas

## 🔧 Pasos Pendientes para Completar la Implementación

### **PRIORIDAD 1: Configurar Base de Datos**

#### 1.1 Crear tabla `ConfiguracionesSistema`
```sql
-- Ejecutar en phpMyAdmin o línea de comandos MySQL
CREATE TABLE IF NOT EXISTS ConfiguracionesSistema (
    Id_Config INT PRIMARY KEY AUTO_INCREMENT,
    Clave VARCHAR(50) UNIQUE NOT NULL,
    Valor VARCHAR(255) NOT NULL,
    Descripcion TEXT,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UsuarioActualizacion VARCHAR(100) DEFAULT 'Sistema'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar valor de estiba
INSERT INTO ConfiguracionesSistema (Clave, Valor, Descripcion) 
VALUES ('valor_estiba_paga', '80500', 'Valor unitario por estiba paga en COP');
```

#### 1.2 Verificar tablas existentes
- `CostosTransporteDiario` - Ya existe (ver `create_costos_transporte_diario.sql`)
- `EncabPedido` - Debe existir con columnas `CantidadEstibas` y `FechaSalida`

### **PRIORIDAD 2: Activar API Real**

#### 2.1 Modificar `dashboardService.js`
```javascript
// Cambiar de versión simplificada a real
export const fetchCostosTransporte = async (app, fechaInicio, fechaFin) => {
  try {
    // CAMBIAR ESTA LÍNEA:
    const response = await fetch(`${API_BASE}/ApiDashboardCostosTransporte_simple.php`, {
    // POR ESTA:
    const response = await fetch(`${API_BASE}/ApiDashboardCostosTransporte.php`, {
      // ... resto del código
    });
  } catch (error) {
    // Eliminar o modificar el bloque de datos de prueba
  }
};
```

#### 2.2 Verificar conexión API
- Ejecutar `test_configuracion.php` para verificar tablas
- Ejecutar `test_transporte_api.php` para probar la API

### **PRIORIDAD 3: Personalización Visual**

#### 3.1 Colores (opcional)
Los colores actuales son:
- Principal: `#8B5CF6` (Violeta)
- Estibas: `#10B981` (Verde)
- Promedio: `#3B82F6` (Azul)
- Relación: `#F59E0B` (Ámbar)

Para cambiar colores, modificar en `dashboardService.js`:
```javascript
export const TRANSPORTE_CONFIG = {
  colorPrincipal: "#TU_COLOR", // Cambiar aquí
  // ... otros colores
};
```

#### 3.2 Dimensiones (opcional)
Ajustar en `dashboardService.js`:
```javascript
export const TRANSPORTE_DIMENSIONS = {
  CHART_HEIGHT: "300px", // Ajustar altura
  // ... otras dimensiones
};
```

## 🚀 Pruebas y Verificación

### 1. **Prueba de Componentes**
1. Abrir el dashboard (`DashboardDibufala.jsx`)
2. Verificar que aparece la sección "Costos de Transporte"
3. Comprobar que los KPIs se muestran correctamente
4. Verificar que los gráficos se renderizan

### 2. **Prueba Responsiva**
1. Redimensionar ventana del navegador
2. Verificar que en móvil los gráficos se apilan verticalmente
3. Comprobar que en desktop se muestran en grid 2x2

### 3. **Prueba de Errores**
1. Simular error de conexión (desconectar internet)
2. Verificar que muestra mensaje de error apropiado
3. Probar botón "Reintentar"

## 📊 Estructura de Datos Esperada

### API Response (ejemplo real)
```json
{
  "success": true,
  "app": "dibufala",
  "periodo": { "inicio": "2025-01-01", "fin": "2025-03-31" },
  "configuracion": {
    "valorEstiba": 80500,
    "valorEstibaFormateado": "$80.500"
  },
  "resumen": {
    "diasConDatos": 45,
    "totalCostoTransporte": 12500000,
    "totalCostoTransporteFormateado": "$12.500.000",
    "totalEstibasPagas": 320,
    "totalValorEstibasPagas": 25760000,
    "totalValorEstibasFormateado": "$25.760.000",
    "totalCamiones": 67
  },
  "kpis": { ... },
  "graficos": {
    "tendencia": [ ... ],
    "comparacion": [ ... ]
  }
}
```

## 🛠️ Solución de Problemas

### **Problema 1: No se muestra la sección**
- Verificar que `SeccionTransporte` está importado en `DashboardDibufala.jsx`
- Revisar consola del navegador para errores JavaScript

### **Problema 2: Gráficos no se renderizan**
- Verificar que Recharts está instalado: `npm install recharts`
- Comprobar que los datos llegan correctamente desde la API

### **Problema 3: API no responde**
- Verificar ruta de la API en `dashboardService.js`
- Probar con `ApiDashboardCostosTransporte_simple.php` primero
- Revisar permisos y configuración del servidor

### **Problema 4: Datos incorrectos**
- Verificar consulta SQL en `ApiDashboardCostosTransporte.php`
- Comprobar que las tablas existen y tienen datos
- Revisar cálculos de estibas pagas (≥20 cajas)

## 🔄 Mantenimiento Futuro

### **Actualizar valor de estiba**
```sql
UPDATE ConfiguracionesSistema 
SET Valor = '85000', 
    Descripcion = 'Nuevo valor por estiba paga',
    UsuarioActualizacion = 'admin'
WHERE Clave = 'valor_estiba_paga';
```

### **Agregar nuevas métricas**
1. Modificar `ApiDashboardCostosTransporte.php` para incluir nuevos cálculos
2. Actualizar `KPICardsTransporte.jsx` para mostrar nuevas tarjetas
3. Agregar nuevos gráficos si es necesario

### **Exportar datos**
Los componentes están preparados para futura implementación de:
- Exportación a PDF
- Exportación a Excel
- Descarga de imágenes de gráficos

## 📞 Soporte

### Archivos importantes:
- `crear_tabla_configuraciones_sistema.sql` - Script para crear tabla de configuración
- `test_configuracion.php` - Verificar estado de base de datos
- `test_transporte_api.php` - Probar API

### Ubicaciones clave:
- APIs: `src/Api/Dashboard/`
- Servicios: `src/services/dashboard/dashboardService.js`
- Componentes: `src/components/dashboard/`
- Dashboard principal: `src/components/dashboard/DashboardDibufala.jsx`

---

## ✅ Checklist de Implementación Completa

- [ ] Ejecutar script para crear `ConfiguracionesSistema`
- [ ] Verificar que `CostosTransporteDiario` tiene datos
- [ ] Cambiar a API real en `dashboardService.js`
- [ ] Probar con datos reales
- [ ] Ajustar colores/dimensiones si es necesario
- [ ] Documentar para usuarios finales

---

**Estado Actual**: ✅ Implementación completa del frontend y estructura backend
**Pendiente**: ⚠️ Configuración de base de datos y conexión a API real
**Tiempo Estimado**: 1-2 horas para completar configuración