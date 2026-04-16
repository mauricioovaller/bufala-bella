# 🔐 Admin API - Endpoints de Administración

Endpoints seguros para administración del sistema.

## 📋 Endpoints Disponibles

### **ApiEstructuraBD.php** - Estructura de Base de Datos

**Propósito:** Obtener información de tablas, columnas e índices de forma segura.

**Uso:**
```
POST https://[tu-servidor]/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php
```

**Parámetros:**
```json
{
  "accion": "tablas" | "estructura" | "completa",
  "tabla": "nombre_tabla" (opcional)
}
```

**Acciones:**

1. **tablas** - Solo lista de tablas
```json
{
  "accion": "tablas"
}
```
Retorna: Lista de todas las tablas con información de tamaño

2. **estructura** - Estructura detallada de tabla(s)
```json
{
  "accion": "estructura",
  "tabla": "correos_enviados"
}
```
Retorna: Columnas, tipos, índices de la tabla especificada

3. **completa** - Todo (tablas + estructura)
```json
{
  "accion": "completa"
}
```
Retorna: Información completa de la BD

**Respuesta Ejemplo:**
```json
{
  "success": true,
  "base_de_datos": "DiBufala",
  "tablas": [
    {
      "nombre": "correos_enviados",
      "filas": 127,
      "tamaño_datos_kb": 45.5,
      "tamaño_índices_kb": 12.3,
      "colación": "utf8mb4_unicode_ci",
      "comentario": "Historial de correos enviados"
    }
  ],
  "estructura": {
    "correos_enviados": {
      "columnas": [
        {
          "nombre": "id",
          "posicion": 1,
          "tipo": "int(11)",
          "nulo": false,
          "default": null,
          "clave": "PRIMARY",
          "extra": "auto_increment"
        }
      ],
      "indices": [...]
    }
  }
}
```

## 🔐 Seguridad

```
✅ Solo consultas SELECT
✅ No modifica datos
✅ Usa INFORMATION_SCHEMA
✅ Sin exposición de datos sensibles
✅ Validación de entrada
```

## 🔗 Integración con MCP

Este endpoint se usa con MCP para:
- Visualizar estructura de BD
- Entender arquitectura de datos
- Debugging y análisis
- Documentación automática

## 📝 Documentación

Ver también:
- [database/scripts/README.md](../../database/scripts/README.md) - Scripts SQL
- [AGENTS.md](../../AGENTS.md) - Sección 3: Estructura del Proyecto
