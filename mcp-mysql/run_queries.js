const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env" });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT ?? "3306")
  });
  
  console.log("=== QUERY 1: SELECT COUNT(*) FROM EncabPedidoChile WHERE Estado='Activo' ===");
  let [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM EncabPedidoChile WHERE Estado='Activo'");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 2: EncabPedidoChile + ClientesChile LIMIT 5 ===");
  [rows] = await conn.execute("SELECT e.Id_EncabPedido, e.FechaSalida, e.FechaOrden, e.PurchaseOrder, c.Nombre FROM EncabPedidoChile e JOIN ClientesChile c ON e.Id_Cliente=c.Id_Cliente WHERE e.Estado='Activo' LIMIT 5");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 3: SELECT COUNT(*) FROM DetPedidoChile ===");
  [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM DetPedidoChile");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 4: ProductosChile LIMIT 10 ===");
  [rows] = await conn.execute("SELECT p.Id_Producto, p.DescripProducto, p.PrecioVenta, p.PlanVallejo FROM ProductosChile p LIMIT 10");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 5: SHOW COLUMNS FROM DetPedidoChile ===");
  [rows] = await conn.execute("SHOW COLUMNS FROM DetPedidoChile");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 6: SHOW COLUMNS FROM CostosTransporteDiario ===");
  [rows] = await conn.execute("SHOW COLUMNS FROM CostosTransporteDiario");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 7: SHOW COLUMNS FROM EncabPedidoChile ===");
  [rows] = await conn.execute("SHOW COLUMNS FROM EncabPedidoChile");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 8: SHOW COLUMNS FROM ClientesChile ===");
  [rows] = await conn.execute("SHOW COLUMNS FROM ClientesChile");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 9: SHOW COLUMNS FROM ProductosChile ===");
  [rows] = await conn.execute("SHOW COLUMNS FROM ProductosChile");
  console.log(JSON.stringify(rows, null, 2));
  
  console.log("\n=== QUERY 10: SHOW TABLES LIKE '%Chile%' ===");
  [rows] = await conn.execute("SHOW TABLES LIKE '%Chile%'");
  console.log(JSON.stringify(rows, null, 2));

  console.log("\n=== QUERY 11: SHOW TABLES LIKE '%Nota%' ===");
  [rows] = await conn.execute("SHOW TABLES LIKE '%Nota%'");
  console.log(JSON.stringify(rows, null, 2));
  
  await conn.end();
}
run().catch(e => console.error(e));
