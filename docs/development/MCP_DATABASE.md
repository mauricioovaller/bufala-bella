# 🔍 MCP - Database Context Protocol

Integración de MCP para que GitHub Copilot acceda a la base de datos de Bufala Bella en tiempo real.

---

## ✅ Configuración Activa (Mayo 2026)

### Servidor MCP local (RECOMENDADO)

La solución definitiva usa un servidor MCP Node.js local en la carpeta `mcp-mysql/`.

**Archivos:**

```
bufala-bella/
├── mcp-mysql/
│   ├── index.js          ← Servidor MCP
│   ├── package.json
│   └── node_modules/
└── .vscode/
    └── mcp.json          ← Apunta a mcp-mysql/index.js
```

**Credenciales activas en `mcp-mysql/index.js`:**

```js
const dbConfig = {
  host: "datenbankensoluciones.com.co",
  user: "datenban_Dibufala_Prueba",
  password: "m(?Bw6OOTR9n~b,I",
  database: "datenban_DiBufala",
  port: 3306,
};
```

**Configuración en `.vscode/mcp.json`:**

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

**Herramientas disponibles:**
| Herramienta | Descripción |
|---|---|
| `list_tables` | Lista todas las tablas de la BD |
| `describe_table` | Muestra columnas de una tabla |
| `query_db` | Ejecuta SELECT personalizados |

**Para reiniciar el MCP:** `Ctrl+Shift+P` → "MCP: Restart Server" (o Reload Window)

**Tablas disponibles (43 en total):**

- Clientes, Conductores, Productos, Lotes, Embalajes
- EncabPedido, DetPedido, EncabInvoice, DetInvoice
- Planillas, CostosTransporteDiario, Transportadoras
- correos_cuentas_configuracion, correos_enviados, historial_correos, plantillas_correo...
- vw*correos_resumen, vw_historial_reciente *(views)\_

---

## 📊 ¿Qué es?

Un **MCP (Model Context Protocol)** es un protocolo que permite a un asistente IA (como yo) acceder a contexto externo. En este caso, usamos MCP para:

```
✅ Ver estructura de tablas de BD en tiempo real
✅ Entender relaciones entre datos
✅ Hacer consultas SELECT
✅ Debugging y análisis
✅ Documentación automática
```

## 🎯 Configuración

### **Paso 1: Endpoint PHP**

El endpoint está en:

```
src/Api/Admin/ApiEstructuraBD.php
```

URL completa:

```
https://[tu-servidor]/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php
```

### **Paso 2: Verificar Funcionamiento**

Prueba con curl:

```bash
curl -X POST https://[tu-servidor]/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "mcp_estructura_bd_2024",
    "accion": "tablas"
  }'
```

Deberías recibir JSON con lista de tablas.

**⚠️ API Key:** `mcp_estructura_bd_2024` (obligatorio en todas las peticiones)

### **Paso 3: Configurar MCP**

El MCP se configura en VS Code para usar este endpoint.

Información necesaria:

```
URL: https://[tu-servidor]/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php
Método: POST
Headers: Content-Type: application/json
```

## 💬 Uso en Conversación

Después de configurar, puedo:

**Tú dices:** "Muéstrame la estructura de la BD"

**Yo consulto:** El endpoint `/Api/Admin/ApiEstructuraBD.php`

**Yo respondo:**

```
Tablas encontradas:
✓ correos_enviados (127 registros)
✓ clientes (243 registros)
✓ conductores (45 registros)
...

Columnas de correos_enviados:
- id (INT, PRIMARY KEY)
- modulo (VARCHAR)
- referencia_numero (VARCHAR)
...
```

## 🔒 Seguridad

```
✅ Endpoint solo hace SELECT
✅ No expone contraseñas
✅ No modifica datos
✅ CORS habilitado
✅ Manejo de errores robusto
✅ Requiere API Key válida
```

## 📝 Acciones Disponibles

**⚠️ Todas las peticiones REQUIEREN el API Key:**

```
"api_key": "mcp_estructura_bd_2024"
```

### 1. Ver Tablas

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "tablas"
}
```

### 2. Ver Estructura de Tabla

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "estructura",
  "tabla": "correos_enviados"
}
```

### 3. Ver Todo

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "completa"
}
```

## 🐛 Troubleshooting

### Error: "API Key inválida o no proporcionada"

```
Solución: Incluir api_key en el JSON
Correcto: { "api_key": "mcp_estructura_bd_2024", "accion": "tablas" }
Incorrecto: { "accion": "tablas" }
```

### Error: "Método no permitido"

```
Solución: El endpoint solo acepta POST
Verifica que usas POST, no GET
```

### Error: "conexionbd.php no encontrado"

```
Solución: El path de inclusión puede variar
Verifica: $_SERVER['DOCUMENT_ROOT'] correcto
```

### Error: "Access denied"

```
Solución: Usuario MySQL sin permisos en INFORMATION_SCHEMA
Verifica permisos en BD: GRANT SELECT ON INFORMATION_SCHEMA.*
```

## 🎓 Para Desarrolladores

Si necesitas modificar el endpoint:

1. Archivo: `src/Api/Admin/ApiEstructuraBD.php`
2. Es documentado con JSDoc
3. Sigue estructura de otros endpoints
4. Mantiene compatibilidad con MCP

## 📚 Documentación Relacionada

- [src/Api/Admin/README.md](./README.md) - Endpoints disponibles
- [database/scripts/README.md](../../database/scripts/README.md) - Scripts SQL
- [AGENTS.md](../../AGENTS.md#3-estructura-del-proyecto) - Estructura del proyecto

---

**Próximo paso:** Decirle a tu IA cuál es la URL del endpoint para que lo use. 🚀
