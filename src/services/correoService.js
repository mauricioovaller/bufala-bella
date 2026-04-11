// src/services/correoService.js
const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos";

// ============================================
// GESTIÓN DE DESTINATARIOS
// ============================================

export async function obtenerDestinatarios(tipo = 'todos') {
  try {
    const response = await fetch(`${BASE_URL}/ApiCorreosDestinatarios.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'listar',
        tipo: tipo
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener destinatarios');
    }

    return data;
  } catch (error) {
    console.error('Error en obtenerDestinatarios:', error);
    throw error;
  }
}

export async function obtenerDestinatariosPredeterminados() {
  try {
    const response = await fetch(`${BASE_URL}/ApiCorreosDestinatarios.php?accion=predeterminados`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener destinatarios predeterminados');
    }

    return data;
  } catch (error) {
    console.error('Error en obtenerDestinatariosPredeterminados:', error);
    throw error;
  }
}

export async function crearDestinatario(destinatario) {
  try {
    const response = await fetch(`${BASE_URL}/ApiCorreosDestinatarios.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'crear',
        ...destinatario
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en crearDestinatario:', error);
    throw error;
  }
}

// ============================================
// GESTIÓN DE PLANTILLAS
// ============================================

export async function obtenerPlantillas(modulo = 'facturacion') {
  try {
    const response = await fetch(`${BASE_URL}/ApiPlantillasCorreo.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'listar',
        modulo: modulo
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Error al obtener plantillas');
    }

    return data;
  } catch (error) {
    console.error('Error en obtenerPlantillas:', error);
    throw error;
  }
}

export async function obtenerPlantillaPredeterminada(modulo = 'facturacion') {
  try {
    const response = await fetch(`${BASE_URL}/ApiPlantillasCorreo.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'obtener_predeterminada',
        modulo: modulo
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en obtenerPlantillaPredeterminada:', error);
    throw error;
  }
}

export async function aplicarVariablesPlantilla(plantillaId, variables) {
  try {
    const response = await fetch(`${BASE_URL}/ApiPlantillasCorreo.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accion: 'aplicar_variables',
        plantilla_id: plantillaId,
        variables: variables
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en aplicarVariablesPlantilla:', error);
    throw error;
  }
}

// ============================================
// ENVÍO DE CORREOS
// ============================================

export async function enviarCorreo(datos) {
  try {
    // Validar datos básicos
    if (!datos.destinatarios || datos.destinatarios.length === 0) {
      throw new Error('Se requiere al menos un destinatario');
    }

    if (!datos.asunto || datos.asunto.trim() === '') {
      throw new Error('El asunto es requerido');
    }

    // Preparar adjuntos (convertir archivos a base64)
    const adjuntosPreparados = await prepararAdjuntos(datos.adjuntos || []);

    // Preparar datos para enviar
    const datosEnvio = {
      destinatarios: datos.destinatarios,
      asunto: datos.asunto.trim(),
      cuerpo: datos.cuerpo || '',
      adjuntos: adjuntosPreparados,
      modulo: datos.modulo || 'facturacion',
      referencia_id: datos.referencia_id || null,
      usuario: datos.usuario || 'Sistema'
    };

    // Enviar a la API EXTERNA (método más confiable)
    const response = await fetch(`${BASE_URL}/ApiEnviarCorreoExterno.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosEnvio)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en enviarCorreo:', error);
    throw error;
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function prepararAdjuntos(adjuntos) {
  const adjuntosPreparados = [];

  for (const adjunto of adjuntos) {
    try {
      // Obtener el contenido del adjunto (puede venir en 'contenido' o 'blob')
      const contenidoAdjunto = adjunto.contenido || adjunto.blob;
      
      // Si es un blob (archivo generado), convertirlo a base64
      if (contenidoAdjunto instanceof Blob) {
        const base64 = await blobToBase64(contenidoAdjunto);
        adjuntosPreparados.push({
          nombre: adjunto.nombre,
          contenido: base64,
          tipo: adjunto.tipo || 'application/pdf'
        });
        console.log(`✅ Adjunto preparado: ${adjunto.nombre} (${Math.round(contenidoAdjunto.size / 1024)} KB)`);
      } 
      // Si ya es base64
      else if (typeof contenidoAdjunto === 'string') {
        adjuntosPreparados.push({
          nombre: adjunto.nombre,
          contenido: contenidoAdjunto,
          tipo: adjunto.tipo || 'application/pdf'
        });
        console.log(`✅ Adjunto preparado (base64): ${adjunto.nombre}`);
      }
      else {
        console.warn(`⚠️ Adjunto ignorado - formato no reconocido: ${adjunto.nombre}`);
      }
    } catch (error) {
      console.error('Error preparando adjunto:', adjunto.nombre, error);
    }
  }

  console.log(`📦 Total adjuntos preparados: ${adjuntosPreparados.length}`);
  return adjuntosPreparados;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remover el prefijo "data:application/pdf;base64,"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Función para validar emails
export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Función para parsear lista de emails (separados por comas, punto y coma, o saltos de línea)
export function parsearListaEmails(texto) {
  if (!texto) return [];
  
  return texto
    .split(/[,;\n]/)
    .map(email => email.trim())
    .filter(email => email !== '')
    .filter(validarEmail);
}

// Función para formatear lista de emails para mostrar
export function formatearListaEmails(emails) {
  return emails.join(', ');
}

// Función para generar nombre de archivo para factura
export function generarNombreFactura(factura) {
  if (!factura) return 'factura.pdf';
  
  const numero = factura.numero || 'sin-numero';
  const cliente = factura.cliente ? factura.cliente.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'cliente';
  const fecha = new Date().toISOString().split('T')[0];
  
  return `factura-${numero}-${cliente}-${fecha}.pdf`;
}

// Función para generar variables comunes para plantillas de facturación
export function generarVariablesFactura(factura, documentosSeleccionados = []) {
  // Formatear valor correctamente
  let valorFormateado = '$0';
  if (factura.valorTotal) {
    // Asegurar que es número y formatear
    const valorNum = typeof factura.valorTotal === 'number' ? factura.valorTotal : parseFloat(factura.valorTotal);
    if (!isNaN(valorNum)) {
      valorFormateado = '$' + valorNum.toLocaleString('es-CO');
    }
  }
  
  return {
    numero: factura.numero || '',
    cliente: factura.cliente || '',
    fecha: factura.fecha || new Date().toLocaleDateString('es-CO'),
    valor: valorFormateado,
    adjuntos: documentosSeleccionados.map(doc => doc.nombre)
  };
}