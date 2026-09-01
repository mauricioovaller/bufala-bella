// src/services/planillasService.js

const API_BASE_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Planillas";

// Crear planilla
export async function crearPlanilla(facturasIds, configuracion, tipoPedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/ApiGuardarPlanilla.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        facturasIds,
        configuracion,
        tipoPedido,
      }),
    });

    return await res.json();
  } catch (err) {
    console.error("Error al crear la planilla:", err);
    throw err;
  }
}

// Crear planilla Chile
export async function crearPlanillaChile(facturasIds, configuracion) {
  const res = await fetch(`${API_BASE_URL}/ApiGuardarPlanilla.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facturasIds, configuracion, tipoPedido: "chile" }),
  });
  return await res.json();
}

// Obtener items seleccionables para documentos Chile
export const getDocumentosChileItems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiGetDocumentosChileItems.php`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Error al obtener items");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo items documentos Chile:", error);
    return { success: false, items: { mercancia: [], anexo: [] } };
  }
};

// Obtener configuración guardada de una planilla (mercancia/anexos seleccionados)
export const obtenerPlanillaConfiguracion = async (idPlanilla, tipoPedido = "chile") => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiGetPlanillaConfiguracion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_planilla: idPlanilla, tipo_pedido: tipoPedido }),
    });
    if (!response.ok) throw new Error("Error al obtener configuración de la planilla");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo configuración de planilla:", error);
    return { success: false, message: error.message };
  }
};

// Carta Responsabilidad Chile
export const generarCartaResponsabilidadChile = async (tipoCarta, idPlanilla, conFirma = true, mercanciaSeleccionada = null) => {
  try {
    const body = { tipo_carta: tipoCarta, id_planilla: idPlanilla, con_firma: conFirma };
    if (mercanciaSeleccionada) {
      body.mercancia_ids = mercanciaSeleccionada;
    }
    const response = await fetch(`${API_BASE_URL}/ApiGenerarPlanillasPDFChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Error en la generación de la carta");
    return await response.blob();
  } catch (error) {
    console.error("Error generando carta Chile:", error);
    return { success: false, message: error.message || "Error generando la carta" };
  }
};

// Reporte Despacho Chile
export const generarReporteDespachoChile = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiReporteDespachoChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_factura: idFactura }),
    });
    if (!response.ok) throw new Error("Error en la generación del reporte");
    return await response.blob();
  } catch (error) {
    return { success: false, message: error.message || "Error generando el reporte" };
  }
};

// Plan Vallejo Chile
export const generarPlanVallejoChile = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiPlanVallejoChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_factura: idFactura }),
    });
    if (!response.ok) throw new Error("Error en la generación del Plan Vallejo");
    return await response.blob();
  } catch (error) {
    return { success: false, message: error.message || "Error generando el Plan Vallejo" };
  }
};

// Autodeclaracion Chile
export const generarAutodeclaracionChile = async (idFactura, anexosSeleccionados = null) => {
  try {
    const body = { id_factura: idFactura };
    if (anexosSeleccionados) {
      body.anexos_ids = anexosSeleccionados;
    }
    const response = await fetch(`${API_BASE_URL}/ApiAutodeclaracionChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Error en la generación de la autodeclaración");
    return await response.blob();
  } catch (error) {
    console.error("Error generando autodeclaración Chile:", error);
    return { success: false, message: error.message || "Error generando la autodeclaración" };
  }
};

// Planilla Despacho Chile
export const generarPlanillaDespachoChile = async (idFactura) => {
  const response = await fetch(`${API_BASE_URL}/ApiPlanillaDespachoChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_factura: idFactura }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Error HTTP ${response.status} al generar planilla de despacho`);
  }
  return await response.blob();
};

// Carta Dataloger Chile
export const generarCartaDatalogerChile = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiCartaDatalogerChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_factura: idFactura }),
    });
    if (!response.ok) throw new Error("Error al generar la carta dataloger Chile");
    return await response.blob();
  } catch (error) {
    console.error("Error generando carta dataloger Chile:", error);
    return { success: false, message: error.message || "Error generando la carta dataloger" };
  }
};

// Solicitud ICA Chile
export const generarSolicitudICAChile = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiSolicitudICAChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_factura: idFactura }),
    });
    if (!response.ok) throw new Error("Error al generar la solicitud ICA Chile");
    return await response.blob();
  } catch (error) {
    console.error("Error generando solicitud ICA Chile:", error);
    return { success: false, message: error.message || "Error generando la solicitud ICA" };
  }
};

// Certificado Tratamiento Térmico Chile
export const generarCertificadoTratamientoChile = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiCertificadoTratamientoChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_factura: idFactura }),
    });
    if (!response.ok) throw new Error("Error al generar el certificado de tratamiento térmico");
    return await response.blob();
  } catch (error) {
    console.error("Error generando certificado tratamiento térmico:", error);
    return { success: false, message: error.message || "Error generando el certificado" };
  }
};

// Tabla HC Lácteos Chile
export const generarTablaHCLacteosChile = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiTablaHCLacteosChile.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_factura: idFactura }),
    });
    if (!response.ok) throw new Error("Error al generar la tabla HC lácteos Chile");
    return await response.blob();
  } catch (error) {
    console.error("Error generando tabla HC lácteos Chile:", error);
    return { success: false, message: error.message || "Error generando la tabla HC" };
  }
};

// Eliminar planilla
export async function eliminarPlanilla(idPlanilla) {
  try {
    const res = await fetch(`${API_BASE_URL}/ApiEliminarPlanilla.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idPlanilla }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al eliminar la planilla:", err);
    throw err;
  }
}

// Función legacy para otros documentos (mantener compatibilidad)
export async function generarDocumentoPlanilla(tipoDocumento, idPlanilla) {
  try {
    const res = await fetch(`${API_BASE_URL}/ApiGenerarDocumento.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipoDocumento,
        idPlanilla,
      }),
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const blob = await res.blob();
    return blob;
  } catch (err) {
    console.error("Error al generar documento:", err);
    throw err;
  }
}

// Función para generar Carta de Responsabilidad (Aerolínea/Policía) - ACTUALIZADA
export const generarCartaResponsabilidad = async (
  tipoCarta,
  idPlanilla,
  conFirma = true
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiGenerarPlanillasPDF.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo_carta: tipoCarta,
        id_planilla: idPlanilla,
        con_firma: conFirma, // 🔴 NUEVO parámetro
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la generación de la carta");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error generando carta de responsabilidad:", error);
    return {
      success: false,
      message: error.message || "Error generando la carta de responsabilidad",
    };
  }
};
// Función para generar Reporte de Despacho
export const generarReporteDespacho = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiReporteDespacho.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_factura: idFactura,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la generación del reporte");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error generando reporte de despacho:", error);
    return {
      success: false,
      message: error.message || "Error generando el reporte de despacho",
    };
  }
};

// Función para generar Plan Vallejo
export const generarPlanVallejo = async (idFactura) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ApiPlanVallejo.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_factura: idFactura,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la generación del Plan Vallejo");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error generando Plan Vallejo:", error);
    return {
      success: false,
      message: error.message || "Error generando el Plan Vallejo",
    };
  }
};
