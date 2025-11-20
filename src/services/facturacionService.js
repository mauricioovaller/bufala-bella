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

// 🔴 FUNCIÓN ACTUALIZADA: Obtener facturas generadas
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