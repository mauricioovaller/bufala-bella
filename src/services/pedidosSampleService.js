// src/services/pedidosService.js
export async function getDatosSelect() {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiGetDatosSelect.php",
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
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiGetClienteRegion.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clienteId }),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales:", err);
    throw err;
  }
}

export async function guardarSample(encabezado, detalle) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiGuardarSample.php",
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

export async function getSamples() {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiGetSamples.php",
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

export async function getSampleEspecifico(idPedido) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiGetSample.php",
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

export async function actualizarSample(encabezado, detalle) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiActualizarSample.php",
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

// En services/pedidosService.js - AGREGAR ESTAS FUNCIONES:

export async function imprimirSample(idPedido, tipoDocumento = "pedido") {
  try {
    // Mapear los tipos de documento a los endpoints correspondientes
    const endpoints = {
      pedido:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirPedido.php",
      bol: "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirBOL.php",
      listaempaque:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirListaEmpaque.php",
      listaempaqueprecios:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirListaEmpaquePrecios.php",
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

// También puedes mantener la función original por compatibilidad
export async function imprimirBOL(idPedido) {
  return await imprimirSample(idPedido, "bol");
}

export async function imprimirListaEmpaque(idPedido) {
  return await imprimirSample(idPedido, "listaempaque");
}

// 👇 NUEVA FUNCIÓN PARA IMPRIMIR MÚLTIPLES SAMPLES
export async function imprimirSamplesMultiples(filtros) {
  try {
    // Mapear los tipos de documento a los endpoints correspondientes
    const endpoints = {
      pedido:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirMultiplesPedidos.php",
      bol: "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirMultiplesBOL.php",
      listaempaque:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirMultiplesListaEmpaque.php",
      listaempaqueprecios:
        "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiImprimirMultiplesListaEmpaquePrecios.php",
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
    console.error("Error en imprimirSamplesMultiples:", error);
    throw error;
  }
}

// 👇 NUEVA FUNCIÓN PARA OBTENER RANGO DE SAMPLES
export async function getRangeSamples(filtros) {
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
        throw new Error("Números de sample requeridos para modo por números");
      }
      datosEnvio.numeroDesde = parseInt(filtros.numeroDesde);
      datosEnvio.numeroHasta = parseInt(filtros.numeroHasta);
    }

    console.log("Datos enviados a API:", datosEnvio);

    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PedidosSample/ApiGetRangoPedidos.php",
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
      throw new Error(resultado.message || "Error al obtener samples");
    }

    return resultado;
  } catch (error) {
    console.error("Error en getRangeSamples:", error);
    // Devolver un error estructurado
    return {
      success: false,
      message: error.message || "Error al obtener samples",
      total: 0,
      pedidos: [],
    };
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
