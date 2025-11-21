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

// Función para generar Carta de Responsabilidad (Aerolínea/Policía)
export const generarCartaResponsabilidad = async (tipoCarta, idPlanilla) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ApiGenerarPlanillasPDF.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo_carta: tipoCarta,
          id_planilla: idPlanilla,
        }),
      }
    );

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
