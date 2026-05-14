import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

// 1. Configuración de la conexión — Base de datos Bufala Bella
const dbConfig = {
  host: "datenbankensoluciones.com.co",
  user: "datenban_Dibufala_MCP",
  password: "Q!iVse$Y!Jx)U+Lw",
  database: "dateban_Dibufala",
  port: 3306,
};

// 2. Crear el Servidor MCP
const server = new Server(
  { name: "bufala-bella-db-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// 3. Definir las herramientas disponibles para Copilot
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_tables",
        description:
          "Muestra todas las tablas de la base de datos Bufala Bella",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "describe_table",
        description: "Muestra la estructura (columnas) de una tabla específica",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Nombre de la tabla" },
          },
          required: ["table"],
        },
      },
      {
        name: "query_db",
        description: "Ejecuta una consulta SQL SELECT en la base de datos",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "La consulta SQL SELECT a ejecutar",
            },
          },
          required: ["sql"],
        },
      },
    ],
  };
});

// 4. Lógica de las herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    if (request.params.name === "list_tables") {
      const [rows] = await connection.execute("SHOW TABLES");
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    }

    if (request.params.name === "describe_table") {
      const table = request.params.arguments.table;
      const [rows] = await connection.execute(`DESCRIBE \`${table}\``);
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    }

    if (request.params.name === "query_db") {
      const sql = request.params.arguments.sql;
      if (!sql.toLowerCase().trim().startsWith("select")) {
        return {
          content: [
            { type: "text", text: "Error: Solo se permiten consultas SELECT." },
          ],
          isError: true,
        };
      }
      const [rows] = await connection.execute(sql);
      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en la DB: ${error.message}` }],
      isError: true,
    };
  } finally {
    await connection.end();
  }
});

// 5. Arrancar el servidor
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Servidor MCP Bufala Bella funcionando por STDIO");
