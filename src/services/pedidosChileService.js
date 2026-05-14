// src/services/pedidosChileService.js
// Servicio para el módulo Pedidos Chile
// Base URL apunta a la carpeta Api/PedidosChile/ en el servidor

const BASE_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosChile";

/**
 * Carga los datos para los selects del formulario:
 * clientesChile, productosChile, agencias, aerolineas
 */
export async function getDatosSelectChile() {
  try {
    const res = await fetch(`${BASE_URL}/ApiGetDatosSelect.php`, {
      method: "POST",
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales Chile:", err);
    throw err;
  }
}

/**
 * Guarda un nuevo pedido Chile
 * @param {Object} encabezado - Datos del encabezado
 * @param {Array}  detalle    - Líneas del detalle
 * @returns {Object} { success, idPedido, numero }
 */
export async function guardarPedidoChile(encabezado, detalle) {
  try {
    const res = await fetch(`${BASE_URL}/ApiGuardarPedidoChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encabezado, detalle }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al guardar pedido Chile:", err);
    throw err;
  }
}

/**
 * Retorna la lista de todos los pedidos Chile (para el modal de búsqueda)
 * @returns {Object} { success, pedidos: [] }
 */
export async function getPedidosChile() {
  try {
    const res = await fetch(`${BASE_URL}/ApiGetPedidosChile.php`, {
      method: "POST",
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar pedidos Chile:", err);
    throw err;
  }
}

/**
 * Retorna un pedido Chile completo (encabezado + detalle) por ID
 * @param {number} idPedido
 * @returns {Object} { success, encabezado, detalle }
 */
export async function getPedidoChileEspecifico(idPedido) {
  try {
    const res = await fetch(`${BASE_URL}/ApiGetPedidoChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPedido }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar pedido Chile:", err);
    throw err;
  }
}

/**
 * Actualiza un pedido Chile existente
 * @param {Object} encabezado - Debe incluir idPedido
 * @param {Array}  detalle
 * @returns {Object} { success }
 */
export async function actualizarPedidoChile(encabezado, detalle) {
  try {
    const res = await fetch(`${BASE_URL}/ApiActualizarPedidoChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encabezado, detalle }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al actualizar pedido Chile:", err);
    throw err;
  }
}

/**
 * Genera e imprime la Lista de Empaque Chile en PDF
 * @param {number} idPedido
 * @returns {Blob} PDF binario
 */
export async function imprimirPedidoChile(idPedido) {
  try {
    const res = await fetch(`${BASE_URL}/ApiImprimirListaEmpaqueChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPedido }),
    });
    if (!res.ok) {
      throw new Error("Error al generar el PDF");
    }
    return await res.blob();
  } catch (err) {
    console.error("Error en imprimirPedidoChile:", err);
    throw err;
  }
}
