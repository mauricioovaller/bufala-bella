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

// Nuevo servicio para Excel de Transporte
export async function generarExcelTransporte(filtros) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiGenerarExcelTransporte.php",
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
    let fileName = 'Transporte_Consolidado.xlsx';
    
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
      message: "Archivo Excel de transporte generado y descargado correctamente" 
    };

  } catch (err) {
    console.error("Error al generar Excel de transporte:", err);
    throw new Error(err.message || "Error al generar el archivo Excel de transporte");
  }
}

// ============================================================================
// SERVICIOS CHILE Y CONSOLIDADO PARA REPORTES
// ============================================================================

async function descargarArchivo(res, nombreDefault) {
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = res.headers.get('Content-Disposition');
  let fileName = nombreDefault;
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
}

const API_CONS_BASE = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion";

export async function generarReporteProduccionChile(filtros) {
  const response = await fetch(`${API_CONS_BASE}/ApiConsolidadoProduccionChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!response.ok) throw new Error("Error al generar el reporte de producciÃ³n Chile");
  return await response.blob();
}

export async function generarReporteProduccionConsolidado(filtros) {
  const response = await fetch(`${API_CONS_BASE}/ApiConsolidadoProduccionTotal.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!response.ok) throw new Error("Error al generar el reporte de producciÃ³n consolidado");
  return await response.blob();
}

export async function generarReporteEmpaqueChile(filtros) {
  const response = await fetch(`${API_CONS_BASE}/ApiConsolidadoEmpaqueChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!response.ok) throw new Error("Error al generar el reporte de empaque Chile");
  return await response.blob();
}

export async function generarReporteEmpaqueConsolidado(filtros) {
  const response = await fetch(`${API_CONS_BASE}/ApiConsolidadoEmpaqueTotal.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!response.ok) throw new Error("Error al generar el reporte de empaque consolidado");
  return await response.blob();
}

export async function generarReporteTransporteChile(filtros) {
  const response = await fetch(`${API_CONS_BASE}/ApiConsolidadoTransporteChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!response.ok) throw new Error("Error al generar el reporte de transporte Chile");
  return await response.blob();
}

export async function generarReporteTransporteConsolidado(filtros) {
  const response = await fetch(`${API_CONS_BASE}/ApiConsolidadoTransporteTotal.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!response.ok) throw new Error("Error al generar el reporte de transporte consolidado");
  return await response.blob();
}

export async function generarExcelConsolidacionChile(filtros) {
  const res = await fetch(`${API_CONS_BASE}/ApiGenerarExcelConsolidacionChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  await descargarArchivo(res, "Consolidacion_Pedidos_Chile.xlsx");
  return { success: true, message: "Archivo Excel de Chile generado correctamente" };
}

export async function generarExcelConsolidacionConsolidado(filtros) {
  const res = await fetch(`${API_CONS_BASE}/ApiGenerarExcelConsolidacionTotal.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  await descargarArchivo(res, "Consolidacion_Pedidos_Consolidado.xlsx");
  return { success: true, message: "Archivo Excel consolidado generado correctamente" };
}

export async function generarExcelTransporteChile(filtros) {
  const res = await fetch(`${API_CONS_BASE}/ApiGenerarExcelTransporteChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  await descargarArchivo(res, "Transporte_Chile.xlsx");
  return { success: true, message: "Archivo Excel de transporte Chile generado correctamente" };
}

export async function generarExcelTransporteConsolidado(filtros) {
  const res = await fetch(`${API_CONS_BASE}/ApiGenerarExcelTransporteTotal.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, tipoFecha: filtros.tipoFecha }),
  });
  if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
  await descargarArchivo(res, "Transporte_Consolidado.xlsx");
  return { success: true, message: "Archivo Excel de transporte consolidado generado correctamente" };
}

export async function obtenerPedidosPorFecha(filtros) {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion/ApiObtenerPedidos.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
      }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Detalle del error:", errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log("No se pudo leer el detalle del error");
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
  } catch (error) {
    console.error("Error en obtenerPedidosPorFecha:", error);
    throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  }
}

// ============================================================================
// SERVICIOS PARA COSTOS DE TRANSPORTE AEREO
// ============================================================================

const API_COSTOS_AEREO = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/CostosTransporteAereo";

export async function obtenerGuiasMasterPorFecha(fecha, tipoPedido = 'normal') {
  try {
    const response = await fetch(`${API_COSTOS_AEREO}/ApiObtenerGuiasMaster.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, tipoPedido }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en obtenerGuiasMasterPorFecha:", error);
    throw new Error(`No se pudieron obtener las guías master: ${error.message}`);
  }
}

export async function obtenerCostosAereo(filtros, tipoPedido = 'normal') {
  try {
    const response = await fetch(`${API_COSTOS_AEREO}/ApiGetCostosAereo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        tipoPedido,
      }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en obtenerCostosAereo:", error);
    throw new Error(`No se pudieron cargar los costos aéreos: ${error.message}`);
  }
}

export async function obtenerCostoAereo(id) {
  try {
    const response = await fetch(`${API_COSTOS_AEREO}/ApiGetCostoAereo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en obtenerCostoAereo:", error);
    throw new Error(`No se pudo cargar el costo aéreo: ${error.message}`);
  }
}

export async function guardarCostoAereo(datos) {
  try {
    const response = await fetch(`${API_COSTOS_AEREO}/ApiGuardarCostoAereo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en guardarCostoAereo:", error);
    throw new Error(`No se pudo guardar el costo aéreo: ${error.message}`);
  }
}

export async function modificarCostoAereo(id, datos) {
  try {
    const response = await fetch(`${API_COSTOS_AEREO}/ApiModificarCostoAereo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...datos }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en modificarCostoAereo:", error);
    throw new Error(`No se pudo modificar el costo aéreo: ${error.message}`);
  }
}

export async function eliminarCostoAereo(id) {
  try {
    const response = await fetch(`${API_COSTOS_AEREO}/ApiEliminarCostoAereo.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en eliminarCostoAereo:", error);
    throw new Error(`No se pudo eliminar el costo aéreo: ${error.message}`);
  }
}

// ============================================================================
// SERVICIOS PARA CONSOLIDACION CHILE
// ============================================================================

const API_CONS_CHILE = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Consolidacion";

export async function obtenerEstadisticasChile(filtros) {
  try {
    const response = await fetch(API_CONS_CHILE + "/ApiEstadisticasChile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        tipoFecha: filtros.tipoFecha
      }),
    });
    if (!response.ok) throw new Error("Error " + response.status);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en obtenerEstadisticasChile:", error);
    throw new Error("No se pudieron cargar las estadísticas Chile: " + error.message);
  }
}

export async function obtenerPedidosChilePorFecha(filtros) {
  try {
    const response = await fetch(API_CONS_CHILE + "/ApiObtenerPedidosChile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
      }),
    });
    if (!response.ok) throw new Error("Error " + response.status);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en obtenerPedidosChilePorFecha:", error);
    throw new Error("No se pudieron cargar los pedidos Chile: " + error.message);
  }
}

export async function actualizarFechaSalidaChile(pedidoId, nuevaFecha) {
  try {
    const response = await fetch(API_CONS_CHILE + "/ApiActualizarFechaSalidaChile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedidoId, nuevaFechaSalida: nuevaFecha }),
    });
    if (!response.ok) throw new Error("Error " + response.status);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error al actualizar la fecha");
    return data;
  } catch (error) {
    console.error("Error en actualizarFechaSalidaChile:", error);
    throw new Error("No se pudo actualizar la fecha: " + error.message);
  }
}

export const actualizarDatosEnLoteChile = async (filtros, datosEnLote) => {
  try {
    const response = await fetch(API_CONS_CHILE + "/ApiActualizarEnLoteChile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filtros, datosEnLote }),
    });
    if (!response.ok) throw new Error("Error al actualizar datos en lote");
    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

// ============================================================================
// SERVICIOS PARA COSTOS DE TRANSPORTE DIARIO
// ============================================================================

export async function obtenerCostosTransporte(filtros, tipoPedido = 'normal') {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/CostosTransporte/ApiGetCostosTransporte.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        tipoPedido,
      }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Detalle del error:", errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log("No se pudo leer el detalle del error");
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
  } catch (error) {
    console.error("Error en obtenerCostosTransporte:", error);
    throw new Error(`No se pudieron cargar los costos de transporte: ${error.message}`);
  }
}

export async function obtenerCostoTransporte(id) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/CostosTransporte/ApiGetCostoTransporte.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Detalle del error:", errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log("No se pudo leer el detalle del error");
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
  } catch (error) {
    console.error("Error en obtenerCostoTransporte:", error);
    throw new Error(`No se pudo cargar el costo de transporte: ${error.message}`);
  }
}

export async function guardarCostoTransporte(datos) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/CostosTransporte/ApiGuardarCostoTransporte.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Detalle del error:", errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log("No se pudo leer el detalle del error");
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
  } catch (error) {
    console.error("Error en guardarCostoTransporte:", error);
    throw new Error(`No se pudo guardar el costo de transporte: ${error.message}`);
  }
}

export async function modificarCostoTransporte(id, datos) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/CostosTransporte/ApiModificarCostoTransporte.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...datos }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Detalle del error:", errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log("No se pudo leer el detalle del error");
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
  } catch (error) {
    console.error("Error en modificarCostoTransporte:", error);
    throw new Error(`No se pudo modificar el costo de transporte: ${error.message}`);
  }
}

export async function eliminarCostoTransporte(id) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/CostosTransporte/ApiEliminarCostoTransporte.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;

      try {
        const errorText = await response.text();
        console.log("Detalle del error:", errorText);
        errorDetail += ` - ${errorText}`;
      } catch (e) {
        console.log("No se pudo leer el detalle del error");
      }

      throw new Error(errorDetail);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
  } catch (error) {
    console.error("Error en eliminarCostoTransporte:", error);
    throw new Error(`No se pudo eliminar el costo de transporte: ${error.message}`);
  }
}
