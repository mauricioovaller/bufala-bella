// src/services/planVallejo/planVallejoService.js
// Servicios para el módulo de Complemento de Facturación (Plan Vallejo)

/**
 * Obtiene facturas con su detalle, incluyendo campos complementarios,
 * filtrando por rango de fechas y opcionalmente número de factura.
 * @param {Object} filtros - { fechaDesde, fechaHasta, numeroFactura? }
 * @returns {Promise<Object>} - { success, facturas, message? }
 */
export async function getFacturasConDetalle(filtros) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PlanVallejo/ApiGetFacturasConDetalle.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtros),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en getFacturasConDetalle:", error);
    throw error;
  }
}

/**
 * Actualiza los campos complementarios de uno o varios ítems de factura.
 * @param {Array} items - Array de objetos con idDetInvoice y los campos a actualizar.
 * @returns {Promise<Object>} - { success, actualizados, message? }
 */
export async function actualizarComplementoFactura(items) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PlanVallejo/ApiActualizarComplementoFactura.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error en actualizarComplementoFactura:", error);
    throw error;
  }
}

/**
 * Exporta a Excel los datos complementarios de un rango de facturas.
 * Devuelve un blob para descargar.
 * @param {Object} filtros - { fechaDesde, fechaHasta }
 * @returns {Promise<Blob>}
 */
export async function exportarComplementoExcel(filtros) {
  try {
    const response = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/PlanVallejo/ApiExportarComplementoExcel.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtros),
      }
    );
    if (!response.ok) {
      throw new Error("Error al generar el Excel");
    }
    return await response.blob();
  } catch (error) {
    console.error("Error en exportarComplementoExcel:", error);
    throw error;
  }
}