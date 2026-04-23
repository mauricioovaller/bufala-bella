# 🎯 Ejemplos Prácticos MCP - Bufala Bella

**Referencia rápida con ejemplos reales**

---

## 1️⃣ Ejemplo: Ver Todas las Tablas

### Request

```javascript
const payload = {
  api_key: "mcp_estructura_bd_2024",
  accion: "tablas",
};

fetch(
  "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
)
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Response Esperada

```json
{
  "success": true,
  "base_de_datos": "dateban_Dibufala",
  "timestamp": "2026-04-17 10:30:45",
  "accion": "tablas",
  "tablas": [
    {
      "nombre": "Clientes",
      "filas": 243,
      "tamaño_datos_kb": 125.5,
      "tamaño_índices_kb": 45.2,
      "colación": "utf8mb4_unicode_ci",
      "comentario": "Tabla de clientes registrados"
    },
    {
      "nombre": "Conductores",
      "filas": 45,
      "tamaño_datos_kb": 34.8,
      "tamaño_índices_kb": 12.3,
      "colación": "utf8mb4_unicode_ci",
      "comentario": "Tabla de conductores"
    },
    {
      "nombre": "Facturación",
      "filas": 1023,
      "tamaño_datos_kb": 567.2,
      "tamaño_índices_kb": 234.5,
      "colación": "utf8mb4_unicode_ci",
      "comentario": "Tabla de facturas electrónicas"
    }
  ],
  "cantidad_tablas": 3
}
```

---

## 2️⃣ Ejemplo: Ver Estructura Detallada de Tabla

### Request

```javascript
const payload = {
  api_key: "mcp_estructura_bd_2024",
  accion: "estructura",
  tabla: "Clientes",
};

fetch(
  "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
)
  .then((res) => res.json())
  .then((data) => console.table(data.estructura.Clientes.columnas));
```

### Response Esperada

```json
{
  "success": true,
  "base_de_datos": "dateban_Dibufala",
  "timestamp": "2026-04-17 10:35:22",
  "accion": "estructura",
  "estructura": {
    "Clientes": {
      "columnas": [
        {
          "nombre": "Id_Cliente",
          "posicion": 1,
          "tipo": "INT(11)",
          "nulo": false,
          "default": null,
          "clave": "PRIMARY",
          "extra": "auto_increment",
          "comentario": "ID único del cliente"
        },
        {
          "nombre": "Nombre",
          "posicion": 2,
          "tipo": "VARCHAR(255)",
          "nulo": false,
          "default": null,
          "clave": "NONE",
          "extra": "",
          "comentario": "Nombre de la empresa/cliente"
        },
        {
          "nombre": "DiasFechaSalida",
          "posicion": 3,
          "tipo": "INT(11)",
          "nulo": true,
          "default": "2",
          "clave": "NONE",
          "extra": "",
          "comentario": "Días hasta salida"
        },
        {
          "nombre": "DiasFechaEnroute",
          "posicion": 4,
          "tipo": "INT(11)",
          "nulo": true,
          "default": "3",
          "clave": "NONE",
          "extra": "",
          "comentario": "Días en ruta"
        },
        {
          "nombre": "DiasFechaDelivery",
          "posicion": 5,
          "tipo": "INT(11)",
          "nulo": true,
          "default": "2",
          "clave": "NONE",
          "extra": "",
          "comentario": "Días para delivery"
        }
      ],
      "indices": [
        {
          "nombre": "PRIMARY",
          "columnas": ["Id_Cliente"],
          "es_unico": true
        },
        {
          "nombre": "idx_nombre",
          "columnas": ["Nombre"],
          "es_unico": false
        }
      ]
    }
  }
}
```

---

## 3️⃣ Ejemplo: Ejecutar Consulta SELECT

### Caso: Obtener primeros 5 clientes

```javascript
const payload = {
  api_key: "mcp_estructura_bd_2024",
  accion: "query",
  sql: "SELECT Id_Cliente, Nombre, DiasFechaSalida FROM Clientes LIMIT 5",
};

fetch(
  "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
)
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      console.table(data.registros);
    } else {
      console.error("Error:", data.error);
    }
  });
```

### Response Esperada

```json
{
  "success": true,
  "base_de_datos": "dateban_Dibufala",
  "timestamp": "2026-04-17 10:40:15",
  "accion": "query",
  "sql": "SELECT Id_Cliente, Nombre, DiasFechaSalida FROM Clientes LIMIT 5",
  "registros": [
    {
      "Id_Cliente": 1,
      "Nombre": "Empresa Bufala SA",
      "DiasFechaSalida": "2"
    },
    {
      "Id_Cliente": 2,
      "Nombre": "Productos Lacteos LTD",
      "DiasFechaSalida": "3"
    },
    {
      "Id_Cliente": 3,
      "Nombre": "Distribuidora Central",
      "DiasFechaSalida": "2"
    },
    {
      "Id_Cliente": 4,
      "Nombre": "Comercio Mayorista",
      "DiasFechaSalida": "4"
    },
    {
      "Id_Cliente": 5,
      "Nombre": "Tienda Regional",
      "DiasFechaSalida": "2"
    }
  ],
  "cantidad_registros": 5
}
```

---

## 4️⃣ Ejemplo: Buscar Clientes por Patrón

```javascript
const payload = {
  api_key: "mcp_estructura_bd_2024",
  accion: "query",
  sql: "SELECT * FROM Clientes WHERE Nombre LIKE '%Bufala%'",
};

fetch(
  "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
)
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      console.log(`Encontrados ${data.cantidad_registros} clientes:`);
      data.registros.forEach((cliente) => {
        console.log(`- ${cliente.Nombre} (ID: ${cliente.Id_Cliente})`);
      });
    }
  });
```

---

## 5️⃣ Ejemplo: Contar Registros por Tabla

```javascript
async function contarTablas() {
  const tablas = ["Clientes", "Conductores", "Facturación"];

  for (const tabla of tablas) {
    const payload = {
      api_key: "mcp_estructura_bd_2024",
      accion: "query",
      sql: `SELECT COUNT(*) as total FROM ${tabla}`,
    };

    const res = await fetch(
      "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    if (data.success) {
      console.log(`${tabla}: ${data.registros[0].total} registros`);
    }
  }
}

contarTablas();
```

---

## 6️⃣ Ejemplo: JOIN entre Tablas

```javascript
const payload = {
  api_key: "mcp_estructura_bd_2024",
  accion: "query",
  sql: `
    SELECT 
      c.Nombre as Cliente,
      p.Numero_Pedido,
      COUNT(p.Id_Pedido) as Total_Items
    FROM Clientes c
    LEFT JOIN Pedidos p ON c.Id_Cliente = p.Id_Cliente
    WHERE p.Numero_Pedido IS NOT NULL
    GROUP BY c.Nombre, p.Numero_Pedido
    LIMIT 10
  `,
};

fetch(
  "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
)
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      console.table(data.registros);
    }
  });
```

---

## 7️⃣ Ejemplo: Debugging - ¿Qué columnas tiene esta tabla?

```javascript
async function debugTabla(nombreTabla) {
  const payload = {
    api_key: "mcp_estructura_bd_2024",
    accion: "estructura",
    tabla: nombreTabla,
  };

  const res = await fetch(
    "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const data = await res.json();

  if (data.success) {
    const columnas = data.estructura[nombreTabla].columnas;
    console.log(`\n📊 Estructura de ${nombreTabla}:`);
    columnas.forEach((col) => {
      const nullable = col.nulo ? "✓ Nullable" : "✗ NOT NULL";
      console.log(`  ${col.nombre} (${col.tipo}) - ${nullable}`);
    });
  }
}

debugTabla("Clientes");
```

---

## 8️⃣ Ejemplo: Wrapper Function en React

```javascript
// services/mcpService.js
export async function consultarMCP(accion, params = {}) {
  const payload = {
    api_key: "mcp_estructura_bd_2024",
    accion: accion,
    ...params,
  };

  try {
    const response = await fetch(
      "http://localhost/DatenBankenApp/DiBufala/Api/Admin/ApiEstructuraBD.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("MCP Error:", error);
    throw error;
  }
}

// Uso en componentes:
import { consultarMCP } from "../services/mcpService";

const obtenerTablas = async () => {
  const data = await consultarMCP("tablas");
  console.log(`Encontradas ${data.cantidad_tablas} tablas`);
};

const ejecutarConsulta = async (sql) => {
  const data = await consultarMCP("query", { sql });
  return data.registros;
};
```

---

## ❌ Ejemplos de Errores

### Error: API Key incorrecta

**Request:**

```json
{
  "api_key": "clave_incorrecta",
  "accion": "tablas"
}
```

**Response:**

```json
{
  "success": false,
  "error": "API Key inválida o no proporcionada",
  "timestamp": "2026-04-17 10:45:30"
}
```

### Error: Consulta no permitida

**Request:**

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "query",
  "sql": "UPDATE Clientes SET Nombre = 'Nuevo' WHERE Id_Cliente = 1"
}
```

**Response:**

```json
{
  "success": false,
  "error": "No se permiten operaciones de modificación. Solo SELECT.",
  "timestamp": "2026-04-17 10:46:15"
}
```

### Error: Tabla no existe

**Request:**

```json
{
  "api_key": "mcp_estructura_bd_2024",
  "accion": "query",
  "sql": "SELECT * FROM TablaQueNoExiste"
}
```

**Response:**

```json
{
  "success": false,
  "error": "Error en la consulta: Table 'dateban_Dibufala.TablaQueNoExiste' doesn't exist",
  "timestamp": "2026-04-17 10:47:00"
}
```

---

## 🎓 Casos de Uso Reales

### Caso 1: Validar integridad de datos

```javascript
async function validarDatos() {
  // Verificar que todos los pedidos tienen cliente asignado
  const result = await consultarMCP("query", {
    sql: "SELECT COUNT(*) as sin_cliente FROM Pedidos WHERE Id_Cliente IS NULL",
  });

  if (result.registros[0].sin_cliente > 0) {
    console.warn(`⚠️ ${result.registros[0].sin_cliente} pedidos sin cliente`);
  }
}
```

### Caso 2: Generar reporte rápido

```javascript
async function reporteFacturacion() {
  const result = await consultarMCP("query", {
    sql: `
      SELECT 
        YEAR(Fecha_Factura) as Año,
        MONTH(Fecha_Factura) as Mes,
        COUNT(*) as Total_Facturas,
        SUM(Monto_Total) as Total_Ingresos
      FROM Facturacion
      GROUP BY Año, Mes
      ORDER BY Año DESC, Mes DESC
    `,
  });

  console.table(result.registros);
}
```

---

**¿Necesitas más ejemplos? Pregunta al asistente.**
