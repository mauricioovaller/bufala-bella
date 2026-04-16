# DIAGNÓSTICO DE PROBLEMAS - DASHBOARD DE TRANSPORTE

## 🚨 PROBLEMAS IDENTIFICADOS POR EL USUARIO

### **1. Ejes X muestran "undefined"**
- **Causa probable**: Los datos no tienen el campo `fechaCorta` o está vacío
- **Solución aplicada**: Agregar valores por defecto en la preparación de datos
- **Archivos modificados**: 
  - `ChartFletesDiarios.jsx` - Línea 38-46
  - `ChartEstibasDiarias.jsx` - Línea 38-46  
  - `ChartComparacionAcumulada.jsx` - Línea 38-46

### **2. Texto montado uno sobre otro**
- **Causa probable**: Problemas de layout/estilos CSS
- **Solución aplicada**: Simplificar componentes, eliminar elementos complejos
- **Archivos modificados**: 
  - Todas las gráficas simplificadas
  - Eliminados tooltips complejos y elementos de layout

### **3. Gráfica de fletes vacía (no muestra línea)**
- **Causa probable**: 
  - Datos incorrectos (valores null/undefined)
  - Problema con la función `dot` personalizada (error React #31)
- **Solución aplicada**:
  - Corregido error React #31 (función `dot` devolvía objeto en lugar de elemento)
  - Simplificado a `dot={false}` o `dot={{ r: 4 }}`
  - Agregado manejo de valores por defecto
- **Archivo modificado**: `ChartFletesDiarios.jsx`

### **4. Barras no claramente diferenciables**
- **Causa probable**: 
  - Colores muy similares
  - Opacidad baja
  - Barras muy delgadas
- **Solución aplicada**:
  - Simplificar colores (un color sólido por gráfica)
  - Eliminar colores dinámicos complejos
  - Aumentar tamaño de barras
- **Archivos modificados**:
  - `ChartEstibasDiarias.jsx` - Color verde sólido
  - `ChartComparacionAcumulada.jsx` - Colores sólidos diferenciados

## 🔧 SOLUCIONES APLICADAS

### **1. Datos de Prueba Temporales**
- **Problema**: API no accesible localmente
- **Solución**: Función `generarDatosPrueba()` en `dashboardService.js`
- **Beneficio**: Permite probar las gráficas sin depender de la API

### **2. Gráficas Simplificadas**
- **Problema**: Componentes demasiado complejos
- **Solución**: Versiones simplificadas de las 3 gráficas
- **Cambios**:
  - Eliminados promedios móviles complejos
  - Eliminados tooltips personalizados complejos
  - Eliminados colores dinámicos
  - Simplificado layout y estilos

### **3. Manejo de Valores por Defecto**
- **Problema**: Datos con valores null/undefined
- **Solución**: Agregar valores por defecto en `map()`
- **Ejemplo**: `item.fechaCorta || ''`

### **4. Logs de Depuración**
- **Problema**: Difícil diagnosticar problemas
- **Solución**: Agregar `console.log()` en cada gráfica
- **Beneficio**: Ver datos reales en consola del navegador

## 📊 ESTRUCTURA DE DATOS ACTUAL

Cada gráfica espera datos con esta estructura mínima:

```javascript
// Gráfica 1: Fletes Diarios
{
  fecha: "2026-03-01",      // String - Fecha completa
  fechaCorta: "01/03",      // String - Fecha formateada (dd/mm)
  costoTransporte: 450751,   // Number - Valor del flete
  costoFormateado: "450.751" // String - Valor formateado
}

// Gráfica 2: Estibas Pagas Diarias  
{
  fecha: "2026-03-01",
  fechaCorta: "01/03",
  estibasPagas: 13,          // Number - Cantidad de estibas
  valorEstibasPagas: 1046500 // Number - Valor monetario
}

// Gráfica 3: Comparación
{
  fecha: "2026-03-01",
  fechaCorta: "01/03",
  costoTransporte: 450751,
  valorEstibasPagas: 1046500
}
```

## 🧪 PARA PROBAR AHORA

### **1. Abrir consola del navegador (F12)**
- Verificar que no hay errores
- Ver logs de datos de cada gráfica

### **2. Verificar datos en consola**
- Debería ver: `ChartFletesDiarios - Datos recibidos: [...]`
- Debería ver: `ChartEstibasDiarias - Datos recibidos: [...]`
- Debería ver: `ChartComparacionAcumulada - Datos recibidos: [...]`

### **3. Verificar estructura de datos**
- Cada objeto debe tener `fechaCorta` (no undefined)
- Valores numéricos deben ser números (no strings)
- No debe haber valores null

### **4. Probar funcionalidades básicas**
- KPIs deben mostrar 4 métricas
- Gráficas deben renderizar sin errores
- Ejes X deben mostrar fechas (no "undefined")
- Barras/líneas deben ser visibles

## 🔄 PASOS SIGUIENTES

### **Si las gráficas funcionan:**
1. Restaurar gradualmente funcionalidades complejas
2. Agregar tooltips personalizados de nuevo
3. Agregar colores dinámicos
4. Agregar promedios móviles

### **Si persisten problemas:**
1. Verificar datos específicos en consola
2. Probar con datos estáticos de prueba
3. Verificar estilos CSS/Tailwind
4. Verificar versiones de dependencias (recharts)

## 📞 SOPORTE TÉCNICO

### **Para diagnosticar:**
1. **Consola del navegador (F12 → Console)**
   - Errores JavaScript
   - Logs de datos
   - Advertencias

2. **Consola del navegador (F12 → Network)**
   - Peticiones a la API
   - Respuestas de la API
   - Errores HTTP

3. **Inspeccionar elementos (F12 → Elements)**
   - Estilos CSS aplicados
   - Estructura HTML
   - Clases Tailwind

### **Archivos clave para revisar:**
1. `src/services/dashboard/dashboardService.js` - Datos de prueba
2. `src/components/dashboard/ChartFletesDiarios.jsx` - Gráfica 1
3. `src/components/dashboard/ChartEstibasDiarias.jsx` - Gráfica 2
4. `src/components/dashboard/ChartComparacionAcumulada.jsx` - Gráfica 3
5. `src/components/dashboard/SeccionTransporte.jsx` - Layout principal