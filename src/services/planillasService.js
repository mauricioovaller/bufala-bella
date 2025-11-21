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

// 🔴 CORREGIDO: Función específica para generar cartas
export async function generarCartaResponsabilidad(tipoCarta, idPlanilla) {
  try {
    console.log("📄 Generando carta:", {
      tipoCarta,
      idPlanilla,
      timestamp: new Date().toISOString(),
    });

    const requestBody = {
      tipo_carta: tipoCarta,
      id_planilla: idPlanilla,
    };

    console.log("📤 Enviando request:", requestBody);

    const response = await fetch(`${API_BASE_URL}/ApiGenerarPlanillasPDF.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📊 Respuesta del servidor:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
    });

    if (!response.ok) {
      let errorText = "Error desconocido";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "No se pudo leer el mensaje de error";
      }
      console.error("❌ Error del servidor:", errorText);
      throw new Error(
        `Error HTTP ${response.status}: ${errorText.substring(0, 200)}`
      );
    }

    // Verificar que sea un PDF
    const contentType = response.headers.get("content-type");
    console.log("📋 Content-Type recibido:", contentType);

    if (!contentType || !contentType.includes("application/pdf")) {
      let responseText = "No se pudo leer la respuesta";
      try {
        responseText = await response.text();
        console.error("❌ Respuesta no PDF:", responseText.substring(0, 500));
      } catch (e) {
        console.error("❌ No se pudo leer la respuesta del servidor");
      }
      throw new Error(
        "El servidor no devolvió un PDF válido. Contacte al administrador."
      );
    }

    // Obtener el blob del PDF
    const blob = await response.blob();
    console.log("📦 Blob recibido:", {
      size: blob.size,
      type: blob.type,
      blob: blob,
    });

    if (blob.size === 0) {
      throw new Error("El PDF recibido está vacío (0 bytes)");
    }

    // Crear URL para descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Nombre del archivo
    const nombreArchivo = `Carta_${
      tipoCarta === "carta-aerolinea" ? "Aerolinea" : "Policia"
    }_${idPlanilla}.pdf`;
    link.download = nombreArchivo;

    // Simular click para descargar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar memoria después de un tiempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

    console.log("✅ PDF generado y descargado correctamente:", nombreArchivo);

    return {
      success: true,
      message: "Documento generado correctamente",
      fileName: nombreArchivo,
    };
  } catch (err) {
    console.error("❌ Error al generar carta:", err);
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

    // Para PDF, manejamos la respuesta como blob
    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Abrir en nueva pestaña
    window.open(pdfUrl, "_blank");

    return { success: true };
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

    // Para PDF, manejamos la respuesta como blob
    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Abrir en nueva pestaña
    window.open(pdfUrl, "_blank");

    return { success: true };
  } catch (error) {
    console.error("Error generando Plan Vallejo:", error);
    return {
      success: false,
      message: error.message || "Error generando el Plan Vallejo",
    };
  }
};
