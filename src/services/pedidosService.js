//src/services/pedidosService.js
export async function getDatosSelect() {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGetDatosSelect.php",
      {
        method: "POST",
      },
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
        body: JSON.stringify({ clienteId }),
      },
    );
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales:", err);
    throw err;
  }
}

export async function validarPurchaseOrder(
  purchaseOrder,
  pedidoIdActual = null,
) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiValidarPurchaseOrder.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseOrder,
          pedidoIdActual,
        }),
      },
    );
    return await res.json();
  } catch (err) {
    console.error("Error al validar Purchase Order:", err);
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
      },
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
      },
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
      },
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
      },
    );
    return await res.json();
  } catch (err) {
    console.error("Error al guardar el pedido:", err);
    throw err;
  }
}

// En services/pedidosService.js - AGREGAR ESTAS FUNCIONES:

export async function imprimirPedido(idPedido, tipoDocumento = "pedido") {
  try {
    // Mapear los tipos de documento a los endpoints correspondientes
    const endpoints = {
      pedido:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirPedido.php",
      bol: "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirBOL.php",
      listaempaque:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirListaEmpaque.php",
      listaempaqueprecios:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirListaEmpaquePrecios.php",
    };

    const endpoint = endpoints[tipoDocumento] || endpoints.pedido;

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

// 👇 FUNCIÓN MEJORADA PARA IMPRESIÓN MÚLTIPLE DE TODOS LOS REPORTES
export async function imprimirPedidosMultiples(filtros) {
  try {
    // Mapear los tipos de documento a los endpoints correspondientes
    const endpoints = {
      pedido:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirMultiplesPedidos.php",
      bol: "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirMultiplesBOL.php",
      listaempaque:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirMultiplesListaEmpaque.php",
      listaempaqueprecios:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiImprimirMultiplesListaEmpaquePrecios.php",
    };

    const endpoint = endpoints[filtros.tipoDocumento] || endpoints.pedido;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });

    if (!response.ok) {
      throw new Error(
        `Error al generar el PDF múltiple de ${filtros.tipoDocumento}`,
      );
    }

    return await response.blob();
  } catch (error) {
    console.error("Error en imprimirPedidosMultiples:", error);
    throw error;
  }
}

// 👇 FUNCIÓN ACTUALIZADA PARA CONTAR PEDIDOS SEGÚN FILTROS (AHORA SOPORTA DOS MODOS)
export async function contarPedidosPorFiltro(filtros) {
  try {
    // Preparar datos según el modo
    const datosEnvio = {
      modo: filtros.modo || "porFechas",
      tipoDocumento: filtros.tipoDocumento || "listaempaque",
      bodegaId: filtros.bodegaId || "",
      // Solo enviar los parámetros correspondientes al modo
      ...(filtros.modo === "porFechas"
        ? {
            fechaDesde: filtros.fechaDesde || "",
            fechaHasta: filtros.fechaHasta || "",
          }
        : {
            numeroDesde: filtros.numeroDesde || 0,
            numeroHasta: filtros.numeroHasta || 0,
          }),
    };

    console.log("Enviando datos a ApiContarPedidos:", datosEnvio);

    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiContarPedidos.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnvio),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.message || "Error al contar pedidos");
    }

    return resultado;
  } catch (error) {
    console.error("Error en contarPedidosPorFiltro:", error);
    // Devolver un error estructurado
    return {
      success: false,
      message: error.message || "Error al contar pedidos",
      total: 0,
    };
  }
}

// También puedes mantener la función original por compatibilidad
export async function imprimirBOL(idPedido) {
  return await imprimirPedido(idPedido, "bol");
}

export async function imprimirListaEmpaque(idPedido) {
  return await imprimirPedido(idPedido, "listaempaque");
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

// 👇 FUNCIÓN MEJORADA: Obtener lista de pedidos por rango (fechas o números)
export async function getRangoPedidos(filtros) {
  try {
    console.log("Enviando datos a ApiGetRangoPedidos.php:", filtros);

    // Asegurar que tenemos todos los campos necesarios
    const datosEnvio = {
      modo: filtros.modo || "porNumeros",
      bodegaId: filtros.bodegaId || "",
      tipoDocumento: filtros.tipoDocumento || "listaempaque",
    };

    // Agregar parámetros según el modo
    if (filtros.modo === "porFechas") {
      if (!filtros.fechaDesde || !filtros.fechaHasta) {
        throw new Error("Fechas requeridas para modo por fechas");
      }
      datosEnvio.fechaDesde = filtros.fechaDesde;
      datosEnvio.fechaHasta = filtros.fechaHasta;
    } else {
      // Modo por números
      if (!filtros.numeroDesde || !filtros.numeroHasta) {
        throw new Error("Números de pedido requeridos para modo por números");
      }
      datosEnvio.numeroDesde = parseInt(filtros.numeroDesde);
      datosEnvio.numeroHasta = parseInt(filtros.numeroHasta);
    }

    console.log("Datos enviados a API:", datosEnvio);

    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Pedidos/ApiGetRangoPedidos.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEnvio),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const resultado = await response.json();
    console.log("Respuesta de ApiGetRangoPedidos.php:", resultado);

    if (!resultado.success) {
      throw new Error(resultado.message || "Error al obtener pedidos");
    }

    return resultado;
  } catch (error) {
    console.error("Error en getRangoPedidos:", error);
    // Devolver un error estructurado
    return {
      success: false,
      message: error.message || "Error al obtener pedidos",
      total: 0,
      pedidos: [],
    };
  }
}
