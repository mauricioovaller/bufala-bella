---
name: bufala-modulo-chile
description: Use cuando se requiera crear, duplicar o extender un módulo de Bufala Bella con variantes por tipo de pedido (Nacional + Chile), como CRUD de Clientes/Productos Chile, pestañas Normal|Chile, búsqueda server-side, o endpoints PHP para tablas Chile. También aplica para replicar dashboards entre Colombia y Chile. Triggers: "Clientes Chile", "Productos Chile", "pedidos Chile", "módulo con pestañas", "dashboard Chile", "CRUD Chile", "tablas Chile", "datos_chile".
---

# Skill: Módulo Bufala Bella con variantes Nacional + Chile

Guía para implementar módulos en **Bufala Bella** siguiendo los patrones ya establecidos en el proyecto. Aplicar SIEMPRE las reglas de `AGENTS.md` y `.github/instructions/`.

## 1. Reglas de oro obligatorias

1. **Verificar con MCP antes de escribir SQL**: ejecutar `SHOW COLUMNS FROM tabla` (via mcp-mysql) para confirmar nombres exactos de columnas de las tablas Chile/Colombia involucradas.
2. **Prohibido `get_result()`** en PHP: usar SIEMPRE `bind_result()` + `fetch()`.
3. **Validar antes de transacción**: no consumir IDs con INSERT antes de validar todo.
4. **Mobile First**: tabla desktop (`hidden md:block`) + cards móvil (`md:hidden`), botones táctiles.
5. **Paleta uniforme**: blue-600 primario, purple-600 secundario, yellow-500 editar, gray-500 cancelar, green-600 estado.
6. **SweetAlert2** para notificaciones, nunca `alert()` nativo.
7. **No romper funcionalidad existente**: extender, no reescribir. Backward compatible siempre.
8. **Documentar**: AGENTS.md + `docs/changelog/CAMBIOS_PRODUCCION.md` al finalizar.
9. **Verificar antes de crear carpetas**: usar `glob` para confirmar que la carpeta del módulo no exista ya con otro nombre.

## 2. Patrón de pestañas Normal | Chile (frontend)

```jsx
// Componente página con pestañas (mismo patrón en Clientes.jsx, Productos.jsx, DashboardDibufala.jsx)
export default function ModuloX() {
  const [pestanaActiva, setPestanaActiva] = useState("normal");
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Título</h1>
      </div>
      {/* Pestañas */}
      <div className="bg-white rounded-xl shadow-md p-2">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPestanaActiva("normal")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${
              pestanaActiva === "normal" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🇨🇴 Normal
          </button>
          <button
            onClick={() => setPestanaActiva("chile")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${
              pestanaActiva === "chile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🇨🇱 Chile
          </button>
        </div>
      </div>
      {pestanaActiva === "normal" ? <ContenidoNormal /> : <ContenidoChile />}
    </div>
  );
}
```

**Estrategia segura para componentes existentes grandes:** NO reescribir el contenido. Envolver el render actual en un ternario `{pestanaActiva === "colombia" ? (<><contenido actual/></>) : (<NuevoComponente />)}` con fragmento `<>` para los múltiples hijos.

## 3. Patrón de servicio JS (5 funciones)

```js
// src/services/{modulo}ChileService.js
const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/{Modulo}Chile";

export async function listar{Modulo}Chile() {
  const res = await fetch(`${BASE_URL}/ApiGet{Modulo}Chile.php`, {
    method: "POST", headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Error HTTP al listar ...");
  return await res.json();
}
export async function obtener{Modulo}Chile(id) { /* POST { idX } a ApiGet{Modulo}ChileEspecifico.php */ }
export const guardar{Modulo}Chile = async (data) => { /* POST body completo a ApiGuardar{Modulo}Chile.php */ };
export const actualizar{Modulo}Chile = async (data) => { /* POST body a ApiModificar{Modulo}Chile.php */ };
export const validar{Modulo}Chile = async (tipo, id, nombre) => { /* POST { tipo, idX, nombre } a ApiValidar{Modulo}Chile.php */ };
```

## 4. Patrón de endpoints PHP (5 archivos por módulo)

| # | Archivo | Función |
|---|---------|---------|
| 1 | `ApiGet{Modulo}Chile.php` | Lista todos (POST, respuesta `{ "items": [...] }` o `{ "clientes": [...] }`) |
| 2 | `ApiGet{Modulo}ChileEspecifico.php` | Uno por ID (POST `{ idX }`, respuesta objeto directo) |
| 3 | `ApiGuardar{Modulo}Chile.php` | Crear (INSERT, transacción si hay hijos) |
| 4 | `ApiModificar{Modulo}Chile.php` | Actualizar (UPDATE) |
| 5 | `ApiValidar{Modulo}Chile.php` | Validar duplicado (`store_result()` + `num_rows`) |

**Estructura base de cada endpoint:**
```php
<?php
header("Content-Type: application/json");
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}
include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";
if ($enlace->connect_error) { /* error */ }
$json = file_get_contents("php://input");
$data = json_decode($json, true);
// sanitizar: limpiar_texto(), validar_entero(), validar_flotante() con str_replace(',', '.', ...)
// prepared statements + bind_result() SIEMPRE
```

## 5. Patrón de formulario CRUD con decimales

```jsx
const CAMPOS_DECIMALES = ["pesoGr", "precioVenta", "factorPesoBruto", "fobValor", "vanValor"];
const normalizarDecimal = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numero = parseFloat(String(value).replace(",", "."));
  return isNaN(numero) ? "" : numero;
};
// handleChange:
//   [name]: CAMPOS_DECIMALES.includes(name) ? normalizarDecimal(value) : value
// Inputs decimales: type="text" inputMode="decimal" (NO type="number" -> bloquea coma en navegadores)
// En PHP: validar_flotante() debe hacer str_replace(',', '.', $valor) ANTES de filter_var
```

## 6. Patrón de búsqueda server-side (modal)

```jsx
// 1. handleOpenModal: setShowModal(true); setItems([]); setFiltroItems(""); setCargando(false);
// 2. handleBuscarModal: requiere término, llama getItems(termino), setItems(res.pedidos||[])
// 3. Modal: input + botón "🔍 Buscar" + onKeyDown Enter + botón Cerrar
// 4. Backend: $termino = $_POST['termino']; si vacío -> devolver [] ; LIKE con prepared statement + LIMIT 200
```

## 7. Patrón de dashboard (réplica Colombia -> Chile)

Para duplicar un dashboard/sistema de gráficos para Chile:

1. **Crear endpoint PHP `datos_chile.php`**: réplica de `datos.php` cambiando tablas `EncabPedido`→`EncabPedidoChile`, `DetPedido`→`DetPedidoChile`, `Productos`→`ProductosChile`, `Clientes`→`ClientesChile`, `EncabNotaCredito`→`EncabNotaCreditoChile`, `DetNotaCredito`→`DetNotaCreditoChile`.
2. **Funciones de servicio Chile** en `dashboardService.js`: `fetchDashboardDataChile`, `fetchIndicadoresOTIFChile`, `fetchDetalleIndicadorOTIFChile`, `fetchClientesProductoChile` apuntando a los endpoints `_chile.php`.
3. **Componente nuevo** (ej. `DashboardChile.jsx`) que REUTILIZA los componentes de gráficos existentes (KPICards, KPIOTIFCards, ChartProveedoresClientes, ChartProductos, ChartTendencia, ChartClientesProducto, ModalDetalleOTIF) — son agnósticos a los datos.
4. **Clasificación de productos**: Colombia usa Org/NoOrg (`LIKE '%Org%'` o IDs fijos). Chile no tiene "orgánico" — usar `PlanVallejo` (0/1) y renombrar títulos ("Plan Vallejo" / "No Plan Vallejo").
5. **Drill-down regiones**: NO aplica para Chile (no hay ClientesRegion para ClientesChile). Omitir o adaptar.
6. **Columna `TipoPedido`** para separar costos: si la tabla compartida no la tiene, crear script ALTER (default 'normal' para backward compatible) y filtrar con `WHERE TipoPedido = 'chile'`.
7. **Componentes reutilizados con hardcode**: si un componente llama un endpoint con `'dibufala'` hardcodeado (ej. SeccionTransporte), agregar prop opcional `tipoPedido = ""` con default para no romper el uso actual.

## 8. Checklist de verificación

- [ ] `php -l` en todos los PHP nuevos/modificados
- [ ] `npm test` -> 0 fallos
- [ ] `npm run build` sin errores
- [ ] SQL verificado contra BD real (mcp-mysql) con datos reales
- [ ] Backward compatible: endpoints existentes sin cambios de comportamiento cuando no se pasa el parámetro nuevo
- [ ] Documentar en AGENTS.md + CAMBIOS_PRODUCCION.md
