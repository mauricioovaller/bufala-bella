// src/services/facturacionService.js
export async function obtenerPedidosPorFecha(filtros) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiObtenerPedidos.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta
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
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
    
  } catch (error) {
    console.error("Error en obtenerPedidosPorFecha:", error);
    throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  }
}

export async function guardarFactura(encabezado, pedidosIds) {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiGuardarFactura.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ encabezado, pedidosIds }),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error al guardar la factura:", err);
    throw err;
  }
}

// 🔴 FUNCIÓN: Obtener facturas generadas
export async function obtenerFacturasGeneradas(fechaDesde, fechaHasta) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiObtenerFacturasGeneradas.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
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
      throw new Error(data.message || "Error en la respuesta del servidor");
    }

    return data;
    
  } catch (error) {
    console.error("Error en obtenerFacturasGeneradas:", error);
    throw new Error(`No se pudieron cargar las facturas: ${error.message}`);
  }
}

// 🔴 NUEVA FUNCIÓN: Generar PDF de factura
export async function generarFacturaPDF(idFactura) {
  try {
    const endpoint = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Facturacion/ApiGenerarFacturaPDF.php";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_factura: idFactura
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

    // El servidor retorna un PDF
    const pdfBlob = await response.blob();
    return pdfBlob;
    
  } catch (error) {
    console.error("Error en generarFacturaPDF:", error);
    throw new Error(`No se pudo generar el PDF de la factura: ${error.message}`);
  }
}