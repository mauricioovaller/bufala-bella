// src/services/facturacionService.js
export async function obtenerPedidosPorFecha(filtros) {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiObtenerPedidos.php";

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

// 🔴 NUEVA FUNCIÓN SIMPLIFICADA: Filtrar por tipo en el frontend
export async function obtenerSamplesPorFecha(filtros) {
  try {
    // Usamos la misma función pero filtramos por tipo después
    const resultado = await obtenerPedidosPorFecha(filtros);
    
    if (resultado.pedidos && resultado.pedidos.length > 0) {
      // Filtrar solo los samples (SMP-)
      const samples = resultado.pedidos.filter(pedido => 
        pedido.numero.startsWith('SMP-') || pedido.tipo === 'SMP'
      );
      
      return {
        ...resultado,
        pedidos: samples,
        total: samples.length
      };
    }
    
    return resultado;
  } catch (error) {
    console.error("Error en obtenerSamplesPorFecha:", error);
    throw new Error(`No se pudieron cargar los samples: ${error.message}`);
  }
}

// 🔴 FUNCIÓN ACTUALIZADA: Guardar factura para ambos tipos
export async function guardarFactura(encabezado, pedidosIds, tipoPedido = "normal") {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiGuardarFactura.php";

    const bodyData = {
      encabezado: {
        ...encabezado,
        tipoPedido: tipoPedido
      },
      pedidosIds: pedidosIds,
      tipoPedido: tipoPedido
    };

    console.log('📤 Enviando datos al backend:', bodyData);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    
    const result = await res.json();
    console.log('📥 Respuesta del backend:', result);
    return result;
    
  } catch (err) {
    console.error("Error al guardar la factura:", err);
    throw err;
  }
}

// 🔴 FUNCIÓN ACTUALIZADA: Obtener facturas generadas (para modo creación)
export async function obtenerFacturasGeneradas(fechaDesde, fechaHasta, tipoPedido = "todos") {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiObtenerFacturasGeneradas.php";

    const bodyData = {
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      tipo_pedido: tipoPedido
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
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
    console.error("Error en obtenerFacturasGeneradas:", error);
    throw new Error(`No se pudieron cargar las facturas: ${error.message}`);
  }
}

// 🔴 NUEVA FUNCIÓN: Obtener facturas con filtros avanzados (para modo consulta)
export async function obtenerFacturasConFiltros(filtros) {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiObtenerFacturasGeneradas.php";

    const bodyData = {
      fecha_desde: filtros.fechaDesde,
      fecha_hasta: filtros.fechaHasta,
      numero_factura: filtros.numeroFactura || ""
    };
    
    // Solo enviar tipo_factura si no es "todos" o está vacío
    if (filtros.tipoFactura && filtros.tipoFactura !== 'todos') {
      bodyData.tipo_factura = filtros.tipoFactura;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
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
    console.error("Error en obtenerFacturasConFiltros:", error);
    throw new Error(`No se pudieron cargar las facturas: ${error.message}`);
  }
}

// 🔴 FUNCIÓN ACTUALIZADA: Generar PDF de factura
export async function generarFacturaPDF(idFactura, tipoPedido = "normal") {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiGenerarFacturaPDF.php";

    const bodyData = {
      id_factura: idFactura,
      tipo_pedido: tipoPedido
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
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

    const pdfBlob = await response.blob();
    return pdfBlob;
  } catch (error) {
    console.error("Error en generarFacturaPDF:", error);
    throw new Error(
      `No se pudo generar el PDF de la factura: ${error.message}`
    );
  }
}

// 🔴 FUNCIÓN ACTUALIZADA: Eliminar factura completa
export async function eliminarFacturaCompleta(facturaId, numeroFactura, tipoPedido = "normal") {
  try {
    const endpoint =
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiEliminarFactura.php";

    const bodyData = {
      facturaId: facturaId,
      numeroFactura: numeroFactura,
      tipoPedido: tipoPedido
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
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
    console.error("Error en eliminarFacturaCompleta:", error);
    throw new Error(`No se pudo eliminar la factura: ${error.message}`);
  }
}

// ============================================================================
// SERVICIOS PARA FACTURACION CHILE
// ============================================================================

const BASE_CHILE = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion";

export async function obtenerPedidosChilePorFecha(filtros) {
  const response = await fetch(BASE_CHILE + "/ApiObtenerPedidosChile.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
  return data;
}

export async function guardarFacturaChile(encabezado, pedidosIds) {
  const response = await fetch(BASE_CHILE + "/ApiGuardarFacturaChile.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encabezado, pedidosIds }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Error al guardar la factura Chile");
  return result;
}

export async function obtenerFacturasChile(fechaDesde, fechaHasta) {
  const response = await fetch(BASE_CHILE + "/ApiObtenerFacturasChile.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
  return data;
}

export async function generarFacturaPDFChile(idFactura) {
  const response = await fetch(BASE_CHILE + "/ApiGenerarFacturaPDFChile.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_factura: idFactura }),
  });
  if (!response.ok) throw new Error("Error " + response.status);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Error al generar PDF");
  const byteCharacters = atob(data.pdf);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  return blob;
}

export async function obtenerFacturasChileConFiltros(filtros) {
  const response = await fetch(BASE_CHILE + "/ApiObtenerFacturasChile.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fecha_desde: filtros.fechaDesde,
      fecha_hasta: filtros.fechaHasta,
      numero_factura: filtros.numeroFactura || ""
    }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Error en la respuesta del servidor");
  return data;
}

export async function eliminarFacturaChile(facturaId, numeroFactura) {
  const response = await fetch(BASE_CHILE + "/ApiEliminarFacturaChile.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ facturaId, numeroFactura }),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Error al eliminar la factura Chile");
  return data;
}