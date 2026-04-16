# 🔍 MCP - Database Context Protocol

Integración de MCP para visualizar estructura de base de datos.

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
  -d '{"accion": "tablas"}'
```

Deberías recibir JSON con lista de tablas.

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
```

## 📝 Acciones Disponibles

### 1. Ver Tablas
```json
{
  "accion": "tablas"
}
```

### 2. Ver Estructura de Tabla
```json
{
  "accion": "estructura",
  "tabla": "correos_enviados"
}
```

### 3. Ver Todo
```json
{
  "accion": "completa"
}
```

## 🐛 Troubleshooting

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
