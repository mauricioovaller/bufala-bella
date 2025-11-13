// src/services/consolidacionService.js
export async function generarExcelConsolidacion(filtros) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiGenerarExcelConsolidacion.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          tipoFecha: filtros.tipoFecha
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || `Error HTTP: ${res.status}`);
    }

    // Manejar la descarga del archivo Excel
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Obtener nombre del archivo del header
    const contentDisposition = res.headers.get('Content-Disposition');
    let fileName = 'Consolidacion_Pedidos.xlsx';
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = fileNameMatch[1];
      }
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { 
      success: true, 
      message: "Archivo Excel generado y descargado correctamente" 
    };

  } catch (err) {
    console.error("Error al generar Excel de consolidación:", err);
    throw new Error(err.message || "Error al generar el archivo Excel");
  }
}

// Nuevo servicio para Reporte de Producción
export async function generarReporteProduccion(filtros) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiConsolidadoProduccion.php";

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          tipoFecha: filtros.tipoFecha
        }),
      });

    if (!response.ok) {
      throw new Error("Error al generar el reporte de producción");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error en generarReporteProduccion:", error);
    throw error;
  }
}

// Nuevo servicio para Reporte de Empaque
export async function generarReporteEmpaque(filtros) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiConsolidadoEmpaque.php";

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          tipoFecha: filtros.tipoFecha
        }),
      });

    if (!response.ok) {
      throw new Error("Error al generar el reporte de empaque");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error en generarReporteEmpaque:", error);
    throw error;
  }
}

// src/services/consolidacionService.js - Agregar este nuevo servicio

// Servicio para Reporte de Transporte
export async function generarReporteTransporte(filtros) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiConsolidadoTransporte.php";

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          tipoFecha: filtros.tipoFecha
        }),
      });

    if (!response.ok) {
      throw new Error("Error al generar el reporte de transporte");
    }

    return await response.blob();
  } catch (error) {
    console.error("Error en generarReporteTransporte:", error);
    throw error;
  }
}

export async function obtenerEstadisticasConsolidacion(filtros) {
  try {
    console.log('Enviando filtros al servidor:', filtros);
    
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiEstadisticasConsolidacion.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        tipoFecha: filtros.tipoFecha
      }),
    });

    console.log('Respuesta del servidor - Status:', response.status);
    
    // Si hay error HTTP (500, 404, etc.)
    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        console.log('Detalle del error:', errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log('No se pudo leer el detalle del error');
      }
      
      throw new Error(errorDetail);
    }

    const data = await response.json();
    console.log('Datos recibidos del servidor:', data);
    
    // Si el backend responde con success: false
    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
    
  } catch (error) {
    console.error("Error completo en obtenerEstadisticasConsolidacion:", error);
    throw new Error(`No se pudieron cargar las estadísticas: ${error.message}`);
  }
}

// NUEVO SERVICIO PARA ACTUALIZAR FECHA DE SALIDA
export async function actualizarFechaSalidaPedido(pedidoId, nuevaFecha, tipoPedido = null) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiActualizarFechaSalida.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pedidoId: pedidoId,
        nuevaFechaSalida: nuevaFecha,
        tipoPedido: tipoPedido // Nuevo parámetro para identificar el tipo
      }),
    });    
    
    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        console.log('Detalle del error:', errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log('No se pudo leer el detalle del error');
      }
      
      throw new Error(errorDetail);
    }

    const data = await response.json();   
    
    if (!data.success) {
      throw new Error(data.message || "Error al actualizar la fecha de salida");
    }

    return data;
    
  } catch (error) {
    console.error("Error en actualizarFechaSalidaPedido:", error);
    throw new Error(`No se pudo actualizar la fecha: ${error.message}`);
  }
}


export const actualizarDatosEnLote = async (filtros, datosEnLote) => {
  try {
    const response = await fetch('https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiActualizarEnLote.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filtros,
        datosEnLote
      }),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar datos en lote');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};