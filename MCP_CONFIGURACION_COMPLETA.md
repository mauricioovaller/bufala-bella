# 🚀 Configuración MCP - Bufala Bella

**Última actualización:** 17 de Abril de 2026  
**Estado:** ✅ Configuración Completada

---

## 📋 Resumen Ejecutivo

Se ha configurado un **MCP (Model Context Protocol)** que permite al asistente IA acceder a:

✅ Estructura completa de las tablas de base de datos  
✅ Información detallada de columnas, índices y relaciones  
✅ Ejecución de consultas SELECT para análisis y debugging  
✅ Información en tiempo real sin necesidad de documentación manual

---

## ⚙️ Credenciales Configuradas

```
✓ Host:           [Ver mcp-mysql/index.js — no versionar]
✓ Usuario:        [Ver mcp-mysql/index.js — no versionar]
✓ Base de Datos:  [Ver mcp-mysql/index.js — no versionar]
✓ Permisos:       Solo lectura (SELECT)
✓ Ubicación:      /DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php
```

### Archivo de Conexión Actualizado

El archivo `conexionbd.php` se ha actualizado automáticamente con las nuevas credenciales:

```php
// Configuración actualizada — ver credenciales en servidor (no versionar)
$servidor_bd = getenv('DB_HOST');
$usuario_bd = getenv('DB_USER');
$contrasena_bd = getenv('DB_PASSWORD');
$base_datos = getenv('DB_NAME');
```

---

## 🧪 Pruebas Disponibles

### Opción 1: Usar el Archivo HTML de Prueba

```bash
Archivo: test_mcp_config.html
Ubicación: c:\xampp\htdocs\Proyectos_React\bufala-bella\
Acceso: Abre en navegador
```

**Pasos:**

1. Abre `test_mcp_config.html` en tu navegador
2. Verás un panel con botones para:
   - ✅ Probar conexión
   - 📊 Obtener tablas
   - 🏗️ Obtener estructura completa
   - 🔍 Ejecutar SELECT personalizado

### Opción 2: Probar con cURL

```bash
# Obtener lista de tablas
curl -X POST http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "mcp_estructura_bd_2024",
    "accion": "tablas"
  }'

# Ejecutar consulta SELECT
curl -X POST http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "mcp_estructura_bd_2024",
    "accion": "query",
    "sql": "SELECT * FROM Clientes LIMIT 5"
  }'
```

### Opción 3: Postman o Thunderclient

**URL:** `http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php`

**Método:** POST

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "tablas"
}
```

---

## 📊 Acciones Disponibles en el Endpoint

### 1. **tablas** - Listar todas las tablas

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "tablas"
}
```

**Respuesta:**

```json
{
  "success": true,
  "base_de_datos": "dateban_Dibufala",
  "cantidad_tablas": 25,
  "tablas": [
    {
      "nombre": "Clientes",
      "filas": 243,
      "tamaño_datos_kb": 125.5,
      "tamaño_índices_kb": 45.2,
      "colación": "utf8mb4_unicode_ci",
      "comentario": "Tabla de clientes"
    }
  ]
}
```

### 2. **estructura** - Detalles de columnas e índices

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "estructura",
  "tabla": "Clientes"
}
```

**Respuesta:**

```json
{
  "success": true,
  "estructura": {
    "Clientes": {
      "columnas": [
        {
          "nombre": "Id_Cliente",
          "posicion": 1,
          "tipo": "INT",
          "nulo": false,
          "default": null,
          "clave": "PRIMARY",
          "extra": "auto_increment",
          "comentario": ""
        }
      ],
      "indices": [
        {
          "nombre": "PRIMARY",
          "columnas": ["Id_Cliente"],
          "es_unico": true
        }
      ]
    }
  }
}
```

### 3. **completa** - Todas las tablas + estructura

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "completa"
}
```

### 4. **query** - Ejecutar SELECT personalizado

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "query",
  "sql": "SELECT * FROM Clientes WHERE Nombre LIKE '%test%' LIMIT 10"
}
```

**Respuesta:**

```json
{
  "success": true,
  "sql": "SELECT * FROM Clientes LIMIT 5",
  "cantidad_registros": 5,
  "registros": [
    {
      "Id_Cliente": 1,
      "Nombre": "Cliente A",
      "DiasFechaSalida": 2
    }
  ]
}
```

---

## 🛡️ Seguridad

✅ **Validación por API Key:** `mcp_estructura_bd_2024`  
✅ **Solo SELECT:** No se permite UPDATE, DELETE, DROP, etc.  
✅ **CORS Habilitado:** Compatible con cualquier origen  
✅ **Charset UTF-8:** Soporta caracteres especiales  
✅ **Manejo de Errores:** Respuestas estructuradas en JSON

---

## ❌ Limitaciones

- ❌ NO se pueden ejecutar INSERT, UPDATE, DELETE
- ❌ NO se pueden usar subconsultas complejas
- ❌ Máximo 10,000 registros por consulta
- ❌ Máximo timeout 30 segundos
- ❌ La API Key es obligatoria

---

## 🔍 Troubleshooting

### Problema: "Connection refused"

**Solución:**

```
1. Verifica que el servidor está en línea:
   ping www.datenbankensoluciones.com.co

2. Verifica que el endpoint existe:
   http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php

3. Si está en localhost, asegúrate de que XAMPP está corriendo
```

### Problema: "API Key inválida"

**Solución:**

```
Usa la API Key exacta: mcp_estructura_bd_2024
Verifica que esté en el payload JSON
No incluyas espacios en blanco
```

### Problema: "Acceso denegado a la BD"

**Solución:**

```
1. Verifica que el usuario existe:
   Usuario: [ver credenciales en servidor — no están versionadas]

2. Verifica que el usuario tiene permisos SELECT:
   GRANT SELECT ON <base_de_datos>.* TO '<usuario>'@'%';

3. Verifica que la BD existe:
   La BD debe estar en el servidor
```

### Problema: "Consulta SQL inválida"

**Solución:**

```
✓ Las consultas DEBEN comenzar con SELECT
✓ No use UPDATE, DELETE, DROP, INSERT
✓ Verifique la sintaxis SQL
✓ Pruebe primero en phpMyAdmin
```

---

## 📚 Próximos Pasos

### 1. Verificar Conexión (AHORA)

```bash
cd c:\xampp\htdocs\Proyectos_React\bufala-bella
# Abre test_mcp_config.html en navegador
# Haz clic en "Probar Conexión BD"
```

### 2. Integrar con VS Code (OPCIONAL)

Si VS Code tiene soporte para MCP:

1. Instala extension MCP de VS Code
2. Configura endpoint: `http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php`
3. Agrega API Key: `mcp_estructura_bd_2024`
4. Reinicia VS Code

### 3. Usar en Desarrollo

Ahora puedes:

- Ver estructura de BD en tiempo real
- Hacer pruebas rápidas de consultas
- Debuggear problemas de datos
- Compartir el contexto de BD con el asistente

---

## 📄 Archivo de Referencia Rápida

**Ubicación de archivos modificados:**

```
✓ /DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php
  └─ Credenciales actualizadas

✓ /Proyectos_React/bufala-bella/src/Api/Admin/ApiEstructuraBD.php
  └─ Endpoint MCP + nueva acción "query"

✓ /Proyectos_React/bufala-bella/test_mcp_config.html
  └─ Herramienta de prueba interactiva
```

---

## ✅ Checklist de Configuración

- [x] Crear usuario `datenban_Admin_MCP` con permisos SELECT
- [x] Actualizar `conexionbd.php` con nuevas credenciales
- [x] Crear endpoint `ApiEstructuraBD.php`
- [x] Agregar acción `query` para SELECTs personalizados
- [x] Crear `test_mcp_config.html` para pruebas
- [x] Documentar en este archivo
- [ ] **Probar que todo funciona** ← TÚ AQUÍ

---

## 💡 Tips

**Para ver estructura de una tabla específica:**

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "estructura",
  "tabla": "Clientes"
}
```

**Para contar registros:**

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "query",
  "sql": "SELECT COUNT(*) as total FROM Clientes"
}
```

**Para buscar por patrón:**

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "query",
  "sql": "SELECT * FROM Clientes WHERE Nombre LIKE '%Bufala%' LIMIT 20"
}
```

---

**¿Necesitas ayuda?** Reporta el problema con el endpoint URL exacto y el error completo.
