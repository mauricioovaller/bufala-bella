// src/services/produccion/produccionService.js
// Servicios para el módulo de Producción

// -------------------- Lotes --------------------
export async function getLotes(soloActivos = true) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGetLotes.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soloActivos }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en getLotes:", error);
    throw error;
  }
}

export async function guardarLote(loteData) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGuardarLote.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loteData),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en guardarLote:", error);
    throw error;
  }
}

export async function eliminarLote(idLote) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiEliminarLote.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idLote }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en eliminarLote:", error);
    throw error;
  }
}

// -------------------- Responsables --------------------
export async function getResponsables(soloActivos = true) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGetResponsables.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soloActivos }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en getResponsables:", error);
    throw error;
  }
}

export async function guardarResponsable(responsableData) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGuardarResponsable.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responsableData),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en guardarResponsable:", error);
    throw error;
  }
}

export async function eliminarResponsable(idResponsable) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiEliminarResponsable.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idResponsable }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en eliminarResponsable:", error);
    throw error;
  }
}

// -------------------- Asignación a pedidos --------------------
/**
 * Obtiene un pedido (normal o sample) con su detalle,
 * incluyendo responsable y lotes asignados a cada ítem.
 * @param {Object} params - { idPedido, tipo } (tipo: 'normal' o 'sample')
 * @returns {Promise<Object>} - { success, pedido, message? }
 */
export async function getPedidoProduccion(params) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGetPedidoProduccion.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en getPedidoProduccion:", error);
    throw error;
  }
}

/**
 * Guarda la asignación de responsable y lotes para los ítems de un pedido.
 * @param {Object} data - { tipo, idPedido, items: [{ idDet, idResponsable, lotes: [idLote1, idLote2, idLote3] }] }
 * @returns {Promise<Object>} - { success, message? }
 */
export async function guardarProduccion(data) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGuardarProduccion.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en guardarProduccion:", error);
    throw error;
  }
}

/**
 * Obtiene lista de pedidos (normal o sample) por rango de fechas.
 * @param {Object} params - { tipo, fechaDesde, fechaHasta }
 * @returns {Promise<Object>} - { success, pedidos, message? }
 */
export async function getPedidosProduccion(params) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Produccion/ApiGetPedidosProduccion.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en getPedidosProduccion:", error);
    throw error;
  }
}