/**
 * SERVICIO: envioCorreosGenericoService
 * PROPÓSITO: Lógica reutilizable para envío de correos en cualquier módulo
 * MÓDULOS SOPORTADOS: facturación, pedidos, consolidación (extensible)
 * 
 * CARACTERÍSTICAS:
 * - Generación dinámica de documentos por módulo
 * - Gestión centralizada de historial
 * - Validaciones genéricas
 * - Preparación de adjuntos agnóstica
 * - Registro de auditoría
 */

import { enviarCorreo, obtenerDestinatariosPredeterminados, obtenerPlantillaPredeterminada } from './correoService';

const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api";

// ============================================
// TIPOS Y CONFIGURACIONES
// ============================================

/**
 * Generadores de documentos por módulo
 * Estructura: { modulo: { tipoDoc: { funcion, servicio } } }
 */
const GENERADORES_DOCUMENTOS = {
  facturacion: {
    factura: {
      funcion: 'generarFacturaPDF',
      servicio: 'facturacionService',
      obligatorio: true
    },
    'carta-policia': {
      funcion: 'generarCartaResponsabilidad',
      servicio: 'planillasService',
      obligatorio: false
    },
    'carta-aerolinea': {
      funcion: 'generarCartaResponsabilidad',
      servicio: 'planillasService',
      obligatorio: false
    },
    'plan-vallejo': {
      funcion: 'generarPlanVallejo',
      servicio: 'planillasService',
      obligatorio: false
    },
    'reporte-despacho': {
      funcion: 'generarReporteDespacho',
      servicio: 'planillasService',
      obligatorio: false
    }
  },
  // Estructura preparada para Pedidos
  pedidos: {
    // Se llenará según necesidades
  },
  // Estructura preparada para Consolidación
  consolidacion: {
    // Se llenará según necesidades
  }
};

// ============================================
// FUNCIÓN PRINCIPAL: ENVIAR CORREO GENÉRICO
// ============================================

/**
 * Envía un correo con generación automática de documentos
 * @param {Object} config - Configuración del envío
 * @param {string} config.modulo - Módulo (facturacion, pedidos, consolidacion)
 * @param {number} config.referencia_id - ID de la factura/pedido/consolidación
 * @param {string} config.referencia_numero - Número legible (FEX-001, PED-002, etc)
 * @param {Array} config.destinatarios - Array de emails o array de objetos {email, nombre}
 * @param {Array} config.documentos_seleccionados - Array con IDs de documentos a generar
 * @param {string} config.asunto - Asunto del correo
 * @param {string} config.cuerpo - Cuerpo del correo
 * @param {Object} config.datosReferencia - Datos del objeto referenciado (factura, pedido, etc)
 * @param {Function} config.generador - Función que genera documentos del módulo
 * @param {string} config.usuario - Nombre del usuario
 * @param {number} config.usuario_id - ID del usuario (opcional)
 * @param {string} config.usuario_email - Email del usuario (opcional)
 * @returns {Promise} Resultado del envío con información de historial
 */
export async function enviarCorreoGenerico(config) {
  try {
    console.log('📧 Iniciando envío genérico:', { modulo: config.modulo, referencia: config.referencia_numero });

    // Validar configuración básica
    validarConfiguracion(config);

    // Paso 1: Normalizar destinatarios
    const destinatariosNormalizados = normalizarDestinatarios(config.destinatarios);
    if (destinatariosNormalizados.length === 0) {
      throw new Error('No hay destinatarios válidos');
    }

    // Paso 2: Generar documentos
    console.log('📄 Generando documentos:', config.documentos_seleccionados);
    const archivosGenerados = await generarDocumentosModulo(
      config.modulo,
      config.documentos_seleccionados,
      config.datosReferencia,
      config.generador
    );

    // Paso 3: Preparar adjuntos
    const adjuntos = prepararAdjuntos(archivosGenerados);
    console.log(`📎 Total adjuntos: ${adjuntos.length}`);

    // Paso 4: Enviar correo
    const resultadoEnvio = await enviarCorreo({
      destinatarios: destinatariosNormalizados.map(d => d.email || d),
      asunto: config.asunto,
      cuerpo: config.cuerpo,
      adjuntos: adjuntos,
      modulo: config.modulo,
      referencia_id: config.referencia_id,
      usuario: config.usuario
    });

    if (!resultadoEnvio.success) {
      throw new Error(resultadoEnvio.message || 'Error al enviar correo');
    }

    // Paso 5: Guardar en historial
    const historialId = await guardarEnHistorial({
      modulo: config.modulo,
      referencia_id: config.referencia_id,
      referencia_numero: config.referencia_numero,
      destinatarios: destinatariosNormalizados,
      asunto: config.asunto,
      cuerpo: config.cuerpo,
      adjuntos: archivosGenerados,
      estado: resultadoEnvio.success ? 'enviado' : 'fallido',
      usuario_id: config.usuario_id,
      usuario_nombre: config.usuario,
      usuario_email: config.usuario_email,
      mensaje_error: resultadoEnvio.success ? null : resultadoEnvio.message,
      respuesta_api: resultadoEnvio
    });

    console.log('✅ Correo enviado y registrado:', { historialId, destinatarios: destinatariosNormalizados.length });

    return {
      success: true,
      message: 'Correo enviado exitosamente',
      historial_id: historialId,
      destinatarios_enviados: destinatariosNormalizados.length,
      adjuntos_enviados: adjuntos.length,
      modulo: config.modulo,
      referencia_numero: config.referencia_numero
    };

  } catch (error) {
    console.error('❌ Error en envioGenérico:', error);

    // Si hay referencia, intentar guardar el error en historial
    if (config.referencia_id) {
      try {
        await guardarEnHistorial({
          modulo: config.modulo,
          referencia_id: config.referencia_id,
          referencia_numero: config.referencia_numero,
          destinatarios: normalizarDestinatarios(config.destinatarios),
          asunto: config.asunto,
          cuerpo: config.cuerpo,
          adjuntos: [],
          estado: 'fallido',
          usuario_id: config.usuario_id,
          usuario_nombre: config.usuario,
          usuario_email: config.usuario_email,
          mensaje_error: error.message,
          respuesta_api: null
        });
      } catch (historialError) {
        console.error('Error guardando en historial:', historialError);
      }
    }

    throw error;
  }
}

// ============================================
// FUNCIONES AUXILIARES - DOCUMENTOS
// ============================================

/**
 * Genera documentos específicos del módulo
 * @param {string} modulo - Módulo de origen
 * @param {Array} documentoIds - Array de IDs de documentos a generar
 * @param {Object} datosReferencia - Datos de la referencia (factura, pedido, etc)
 * @param {Function} generador - Función que genera documentos específicos
 * @returns {Promise<Array>} Array de documentos generados {id, nombre, blob}
 */
export async function generarDocumentosModulo(
  modulo,
  documentoIds,
  datosReferencia,
  generador
) {
  const archivos = [];

  if (!documentoIds || documentoIds.length === 0) {
    throw new Error('Debe seleccionar al menos un documento');
  }

  for (const docId of documentoIds) {
    try {
      console.log(`📄 Generando: ${docId} del módulo ${modulo}`);

      // Llamar al generador específico del módulo
      const blob = await generador(docId, datosReferencia);

      if (!blob || blob.size === 0) {
        throw new Error(`Documento vacío: ${docId}`);
      }

      archivos.push({
        id: docId,
        nombre: generarNombreDocumento(docId, datosReferencia),
        blob: blob,
        tipo: 'application/pdf'
      });

      console.log(`✅ ${docId} generado: ${Math.round(blob.size / 1024)} KB`);

    } catch (error) {
      console.error(`❌ Error generando ${docId}:`, error);
      throw new Error(`No se pudo generar ${docId}: ${error.message}`);
    }
  }

  return archivos;
}

/**
 * Genera nombre automatizado para un documento
 */
function generarNombreDocumento(tipoDocumento, datos) {
  const fecha = new Date().toISOString().split('T')[0];
  const numero = datos.numero || datos.id || 'documento';

  const nombres = {
    factura: `factura-${numero}-${fecha}.pdf`,
    'carta-policia': `carta-policia-${numero}-${fecha}.pdf`,
    'carta-aerolinea': `carta-aerolinea-${numero}-${fecha}.pdf`,
    'plan-vallejo': `plan-vallejo-${numero}-${fecha}.pdf`,
    'reporte-despacho': `reporte-despacho-${numero}-${fecha}.pdf`
  };

  return nombres[tipoDocumento] || `documento-${tipoDocumento}-${numero}-${fecha}.pdf`;
}

/**
 * Prepara adjuntos para envío (convierte blob a base64)
 */
function prepararAdjuntos(archivos) {
  return archivos.map(archivo => ({
    nombre: archivo.nombre,
    blob: archivo.blob,
    tipo: archivo.tipo
  }));
}

// ============================================
// FUNCIONES AUXILIARES - DESTINATARIOS
// ============================================

/**
 * Normaliza destinatarios a array de objetos {email, nombre}
 */
function normalizarDestinatarios(destinatarios) {
  if (!destinatarios) return [];

  return destinatarios.map(dest => {
    if (typeof dest === 'string') {
      return { email: dest, nombre: dest.split('@')[0] };
    }
    return dest;
  }).filter(dest => dest.email);
}

// ============================================
// FUNCIONES AUXILIARES - VALIDACIÓN
// ============================================

/**
 * Valida la configuración del envío
 */
function validarConfiguracion(config) {
  const campos = [
    'modulo',
    'referencia_id',
    'referencia_numero',
    'destinatarios',
    'documentos_seleccionados',
    'asunto',
    'cuerpo',
    'datosReferencia',
    'generador',
    'usuario'
  ];

  for (const campo of campos) {
    if (!config[campo]) {
      throw new Error(`Configuración incompleta: falta ${campo}`);
    }
  }

  if (!GENERADORES_DOCUMENTOS[config.modulo]) {
    throw new Error(`Módulo no soportado: ${config.modulo}`);
  }

  if (typeof config.generador !== 'function') {
    throw new Error('Generador debe ser una función');
  }
}

// ============================================
// FUNCIONES AUXILIARES - HISTORIAL
// ============================================

/**
 * Guarda el correo en el historial de la BD
 */
async function guardarEnHistorial(datos) {
  try {
    const respuesta = await fetch(`${BASE_URL}/Correos/ApiHistorialCorreos.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accion: 'crear',
        ...datos,
        destinatarios_lista: JSON.stringify(datos.destinatarios),
        adjuntos_lista: JSON.stringify(
          datos.adjuntos.map(a => ({ nombre: a.nombre, tipo: a.tipo }))
        ),
        adjuntos_count: datos.adjuntos.length,
        destinatarios_count: datos.destinatarios.length,
        fecha_envio: new Date().toISOString()
      })
    });

    if (!respuesta.ok) {
      console.warn(`Aviso: No se guardó en historial (${respuesta.status}), pero el correo se envió`);
      return `temp-${Date.now()}`;
    }

    const resultado = await respuesta.json();
    return resultado.id || resultado.historial_id || `temp-${Date.now()}`;

  } catch (error) {
    console.warn('Aviso: Error guardando historial, pero el correo se envió:', error);
    return `temp-${Date.now()}`;
  }
}

// ============================================
// OBTENER HISTORIAL
// ============================================

/**
 * Obtiene historial de correos
 * @param {Object} filtros - Filtros opcionales {modulo, estado, fecha_desde, fecha_hasta}
 * @returns {Promise<Array>} Array de correos históricos
 */
export async function obtenerHistorialCorreos(filtros = {}) {
  try {
    const respuesta = await fetch(`${BASE_URL}/Correos/ApiHistorialCorreos.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accion: 'listar',
        ...filtros
      })
    });

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    return datos.success ? datos.correos : [];

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de correos por módulo
 */
export async function obtenerEstadisticasCorreos(modulo) {
  try {
    const respuesta = await fetch(`${BASE_URL}/Correos/ApiHistorialCorreos.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accion: 'estadisticas',
        modulo: modulo
      })
    });

    if (!respuesta.ok) {
      return { total: 0, exitosos: 0, fallidos: 0 };
    }

    const datos = await respuesta.json();
    return datos.success ? datos.estadisticas : { total: 0, exitosos: 0, fallidos: 0 };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return { total: 0, exitosos: 0, fallidos: 0 };
  }
}

// ============================================
// DOCUMENTOS DISPONIBLES POR MÓDULO
// ============================================

/**
 * Obtiene lista de documentos disponibles para un módulo
 */
export function obtenerDocumentosDisponibles(modulo) {
  return GENERADORES_DOCUMENTOS[modulo] || {};
}

/**
 * Registra generadores de documentos para un módulo
 * Permite extensión dinámica
 */
export function registrarGeneradoresModulo(modulo, generadores) {
  if (!GENERADORES_DOCUMENTOS[modulo]) {
    GENERADORES_DOCUMENTOS[modulo] = {};
  }
  Object.assign(GENERADORES_DOCUMENTOS[modulo], generadores);
  console.log(`✅ Generadores registrados para ${modulo}`);
}

export default {
  enviarCorreoGenerico,
  generarDocumentosModulo,
  obtenerHistorialCorreos,
  obtenerEstadisticasCorreos,
  obtenerDocumentosDisponibles,
  registrarGeneradoresModulo
};