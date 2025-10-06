// src/services/pedidosService.js
export async function getDatosSelect() {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGetDatosSelect.php",
      {
        method: "POST",
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales:", err);
    throw err;
  }
}

export async function getClienteRegion(clienteId) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGetClienteRegion.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clienteId } ),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales:", err);
    throw err;
  }
}

export async function guardarPedido(encabezado, detalle) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGuardarPedido.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encabezado, detalle }),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al guardar el pedido:", err);
    throw err;
  }
}

export async function getPedidos() {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGetPedidos.php",
      {
        method: "POST",
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales:", err);
    throw err;
  }
}

export async function getPedidoEspecifico(idPedido) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGetPedido.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idPedido }),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al guardar el pedido:", err);
    throw err;
  }
}

export async function actualizarPedido(encabezado, detalle) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiActualizarPedido.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encabezado, detalle }),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al guardar el pedido:", err);
    throw err;
  }
}

export async function imprimirPedido(idPedido) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirPedido.php";
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPedido: idPedido }),
    });

    if (!response.ok) {
      throw new Error("Error al generar el PDF");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error en imprimirPedido:", error);
    throw error;
  }
}







const STORAGE_KEY = "demo_pedidos_v1";

/**
 * Estructura guardada:
 * [
 *   { id, header: {...}, items: [...] , createdAt }
 * ]
 */

function _readAll() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function _writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default {
  async getAll() {
    return _readAll();
  },

  async getById(id) {
    const all = _readAll();
    return all.find((x) => x.id === id) || null;
  },

  async save(order) {
    // Si order.id existe -> actualizar, si no -> crear nuevo
    const all = _readAll();
    if (!order.id) {
      order.id = `${Date.now()}`; // id simple
      order.createdAt = new Date().toISOString();
      all.push(order);
    } else {
      const idx = all.findIndex((x) => x.id === order.id);
      if (idx >= 0) all[idx] = order;
      else {
        order.createdAt = new Date().toISOString();
        all.push(order);
      }
    }
    _writeAll(all);
    return order;
  },

  async remove(id) {
    const all = _readAll();
    const filtered = all.filter((x) => x.id !== id);
    _writeAll(filtered);
    return true;
  },
};
