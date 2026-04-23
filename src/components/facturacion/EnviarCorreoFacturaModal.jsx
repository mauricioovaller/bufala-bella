// src/components/facturacion/EnviarCorreoFacturaModal.jsx
// REFACTORIZADO: Ahora usa el servicio genérico de envío de correos
// COMPATIBILIDAD: 100% - Props y comportamiento sin cambios
import React, { useState, useEffect } from "react";
import {
  obtenerDestinatariosPredeterminados,
  obtenerPlantillaPredeterminada,
  aplicarVariablesPlantilla,
  parsearListaEmails,
  validarEmail,
  generarVariablesFactura,
  generarNombreFactura
} from '../../services/correoService';
import { enviarCorreoGenerico } from '../../services/envioCorreosGenericoService';
import { generarFacturaPDF } from '../../services/facturacionService';
import { generarCartaResponsabilidad, generarReporteDespacho, generarPlanVallejo } from '../../services/planillasService';
import DestinatariosSelector from './DestinatariosSelector';
import Swal from 'sweetalert2';

const EnviarCorreoFacturaModal = ({
  factura,
  isOpen,
  onClose,
  onEnvioExitoso
}) => {
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Estados para datos del correo
  const [destinatarios, setDestinatarios] = useState([]);
  const [destinatariosManual, setDestinatariosManual] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [plantillaId, setPlantillaId] = useState(null);

  // Estados para documentos adjuntos
  const [documentosDisponibles, setDocumentosDisponibles] = useState([
    { id: 'factura', nombre: 'Factura PDF', seleccionado: true, obligatorio: true, generando: false },
    { id: 'carta-policia', nombre: 'Carta para Policía', seleccionado: false, obligatorio: false, generando: false },
    { id: 'carta-aerolinea', nombre: 'Carta para Aerolínea', seleccionado: false, obligatorio: false, generando: false },
    { id: 'plan-vallejo', nombre: 'Plan Vallejo', seleccionado: false, obligatorio: false, generando: false },
    { id: 'reporte-despacho', nombre: 'Reporte de Despacho', seleccionado: false, obligatorio: false, generando: false }
  ]);

  // Estados para archivos generados
  const [archivosGenerados, setArchivosGenerados] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen && factura) {
      cargarDatosIniciales();
    }
  }, [isOpen, factura]);

  // Actualizar variables cuando cambien los documentos seleccionados
  useEffect(() => {
    if (plantillaId && factura) {
      actualizarVariablesPlantilla();
    }
  }, [documentosDisponibles, archivosGenerados]);

  // Función para actualizar variables de plantilla
  const actualizarVariablesPlantilla = async () => {
    if (!plantillaId) return;

    try {
      // Obtener documentos seleccionados
      const documentosSeleccionados = documentosDisponibles
        .filter(doc => doc.seleccionado && archivosGenerados[doc.id])
        .map(doc => ({ nombre: doc.nombre }));

      // Generar variables actualizadas
      const variables = generarVariablesFactura(factura, documentosSeleccionados);

      // Aplicar variables a la plantilla
      const respuesta = await aplicarVariablesPlantilla(plantillaId, variables);

      if (respuesta.success) {
        setAsunto(respuesta.asunto);
        setCuerpo(respuesta.cuerpo);
      }
    } catch (error) {
      console.error('Error actualizando variables:', error);
    }
  };

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Cargar destinatarios predeterminados
      const respuestaDestinatarios = await obtenerDestinatariosPredeterminados();
      if (respuestaDestinatarios.success) {
        const emails = respuestaDestinatarios.destinatarios.map(d => d.email);
        setDestinatarios(emails);
        setDestinatariosManual(emails.join(', '));
      }

      // Cargar plantilla predeterminada
      const respuestaPlantilla = await obtenerPlantillaPredeterminada('facturacion');
      if (respuestaPlantilla.success) {
        const plantilla = respuestaPlantilla.plantilla;
        setPlantillaId(plantilla.id);

        // Aplicar variables a la plantilla
        const variables = generarVariablesFactura(factura, []);
        const respuestaVariables = await aplicarVariablesPlantilla(plantilla.id, variables);

        if (respuestaVariables.success) {
          setAsunto(respuestaVariables.asunto);
          setCuerpo(respuestaVariables.cuerpo);
        }
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos iniciales: ' + error.message,
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en destinatarios manuales
  const handleDestinatariosChange = (e) => {
    const texto = e.target.value;
    setDestinatariosManual(texto);

    // Parsear emails válidos
    const emails = parsearListaEmails(texto);
    setDestinatarios(emails);
  };

  // Manejar cambio en selección de documentos
  const handleDocumentoChange = (id) => {
    setDocumentosDisponibles(prev =>
      prev.map(doc =>
        doc.id === id && !doc.obligatorio
          ? { ...doc, seleccionado: !doc.seleccionado }
          : doc
      )
    );
  };

  // Generar un documento específico
  const generarDocumento = async (tipoDocumento) => {
    try {
      console.log(`🔄 Generando documento: ${tipoDocumento}`, { factura });

      // Marcar como generando
      setDocumentosDisponibles(prev =>
        prev.map(doc =>
          doc.id === tipoDocumento ? { ...doc, generando: true } : doc
        )
      );

      let archivoBlob;
      let nombreArchivo;

      switch (tipoDocumento) {
        case 'factura':
          console.log(`📄 Generando factura PDF para ID: ${factura.id}, tipo: ${factura.tipoPedido || 'normal'}`);
          archivoBlob = await generarFacturaPDF(factura.id, factura.tipoPedido || 'normal');
          nombreArchivo = generarNombreFactura(factura);
          console.log(`✅ Factura generada: ${nombreArchivo}, tamaño: ${archivoBlob.size} bytes`);
          break;

        case 'carta-policia':
          if (!factura.Id_Planilla) {
            throw new Error('La factura no tiene planilla asociada para generar carta de policía');
          }
          console.log(`📄 Generando carta policía para planilla: ${factura.Id_Planilla}`);
          archivoBlob = await generarCartaResponsabilidad('carta-policia', factura.Id_Planilla, true);
          nombreArchivo = `carta-policia-factura-${factura.numero}.pdf`;
          console.log(`✅ Carta policía generada: ${nombreArchivo}`);
          break;

        case 'carta-aerolinea':
          if (!factura.Id_Planilla) {
            throw new Error('La factura no tiene planilla asociada para generar carta de aerolínea');
          }
          console.log(`📄 Generando carta aerolínea para planilla: ${factura.Id_Planilla}`);
          archivoBlob = await generarCartaResponsabilidad('carta-aerolinea', factura.Id_Planilla, true);
          nombreArchivo = `carta-aerolinea-factura-${factura.numero}.pdf`;
          console.log(`✅ Carta aerolínea generada: ${nombreArchivo}`);
          break;

        case 'plan-vallejo':
          console.log(`📄 Generando plan vallejo para factura: ${factura.id}`);
          archivoBlob = await generarPlanVallejo(factura.id);
          nombreArchivo = `plan-vallejo-factura-${factura.numero}.pdf`;
          console.log(`✅ Plan vallejo generado: ${nombreArchivo}`);
          break;

        case 'reporte-despacho':
          console.log(`📄 Generando reporte despacho para factura: ${factura.id}`);
          archivoBlob = await generarReporteDespacho(factura.id);
          nombreArchivo = `reporte-despacho-factura-${factura.numero}.pdf`;
          console.log(`✅ Reporte despacho generado: ${nombreArchivo}`);
          break;

        default:
          throw new Error('Tipo de documento no válido');
      }

      // Verificar que el blob sea válido
      if (!archivoBlob || archivoBlob.size === 0) {
        throw new Error(`El documento ${tipoDocumento} se generó vacío`);
      }

      // Guardar archivo generado
      setArchivosGenerados(prev => ({
        ...prev,
        [tipoDocumento]: {
          blob: archivoBlob,
          nombre: nombreArchivo,
          tipo: 'application/pdf'
        }
      }));

      console.log(`📁 Archivo guardado: ${tipoDocumento}`, {
        nombre: nombreArchivo,
        tamaño: archivoBlob.size,
        tipo: 'application/pdf'
      });

      Swal.fire({
        icon: 'success',
        title: 'Documento generado',
        text: `${nombreArchivo} generado correctamente (${Math.round(archivoBlob.size / 1024)} KB)`,
        timer: 2000,
        showConfirmButton: false
      });

      // Actualizar variables después de generar documento
      actualizarVariablesPlantilla();

    } catch (error) {
      console.error(`❌ Error generando ${tipoDocumento}:`, error);

      // Desmarcar documento si falla
      setDocumentosDisponibles(prev =>
        prev.map(doc =>
          doc.id === tipoDocumento ? { ...doc, seleccionado: false } : doc
        )
      );

      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `No se pudo generar el documento: <strong>${tipoDocumento}</strong><br><br>
               <small>${error.message}</small>`,
        confirmButtonColor: '#dc2626'
      });
    } finally {
      // Quitar estado de generando
      setDocumentosDisponibles(prev =>
        prev.map(doc =>
          doc.id === tipoDocumento ? { ...doc, generando: false } : doc
        )
      );
    }
  };

  // Generar todos los documentos seleccionados
  const generarDocumentosSeleccionados = async () => {
    const documentosSeleccionados = documentosDisponibles.filter(doc => doc.seleccionado);

    for (const doc of documentosSeleccionados) {
      if (!archivosGenerados[doc.id]) {
        await generarDocumento(doc.id);
      }
    }
  };

  // Validar formulario antes de enviar
  const validarFormulario = () => {
    // Validar destinatarios
    if (destinatarios.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Destinatarios requeridos',
        text: 'Debe ingresar al menos un destinatario válido',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    // Validar asunto
    if (!asunto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Asunto requerido',
        text: 'El asunto del correo es requerido',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    // Validar que la factura esté generada (es obligatoria)
    const facturaSeleccionada = documentosDisponibles.find(doc => doc.id === 'factura' && doc.seleccionado);
    if (!facturaSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Factura requerida',
        text: 'La factura PDF es obligatoria para enviar',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    // Validar que la factura esté generada en archivos
    if (!archivosGenerados.factura) {
      Swal.fire({
        icon: 'warning',
        title: 'Factura no generada',
        text: 'Debe generar la factura PDF antes de enviar',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    return true;
  };

  // Enviar correo usando el servicio genérico
  const handleEnviarCorreo = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Confirmar envío
    const confirmacion = await Swal.fire({
      title: '¿Enviar correo?',
      html: `Se enviará el correo a <strong>${destinatarios.length}</strong> destinatario(s)<br>
             con <strong>${documentosDisponibles.filter(d => d.seleccionado).length}</strong> documento(s) adjunto(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    setEnviando(true);

    try {
      console.log('📤 Iniciando envío de correo...');

      // Generador de documentos específico para facturación
      const generadorFacturacion = async (tipoDocumento, datos) => {
        let blob;

        switch (tipoDocumento) {
          case 'factura':
            blob = await generarFacturaPDF(datos.id, datos.tipoPedido || 'normal');
            break;
          case 'carta-policia':
            if (!datos.Id_Planilla) throw new Error('Sin planilla asociada');
            blob = await generarCartaResponsabilidad('carta-policia', datos.Id_Planilla, true);
            break;
          case 'carta-aerolinea':
            if (!datos.Id_Planilla) throw new Error('Sin planilla asociada');
            blob = await generarCartaResponsabilidad('carta-aerolinea', datos.Id_Planilla, true);
            break;
          case 'plan-vallejo':
            blob = await generarPlanVallejo(datos.id);
            break;
          case 'reporte-despacho':
            blob = await generarReporteDespacho(datos.id);
            break;
          default:
            throw new Error('Tipo de documento desconocido');
        }

        return blob;
      };

      // Usar el servicio genérico
      const resultado = await enviarCorreoGenerico({
        modulo: 'facturacion',
        referencia_id: factura.id,
        referencia_numero: factura.numero,
        destinatarios: destinatarios,
        documentos_seleccionados: documentosDisponibles
          .filter(d => d.seleccionado)
          .map(d => d.id),
        asunto: asunto,
        cuerpo: cuerpo,
        datosReferencia: factura,
        generador: generadorFacturacion,
        usuario: localStorage.getItem('usuario_nombre') || 'Usuario',
        usuario_id: localStorage.getItem('usuario_id'),
        usuario_email: localStorage.getItem('usuario_email')
      });

      console.log('📨 Resultado del envío:', resultado);

      if (resultado.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Correo enviado!',
          html: `<strong>Correo enviado exitosamente</strong><br><br>
                 <div class="text-left">
                   <p>📧 Destinatarios: ${resultado.destinatarios_enviados}</p>
                   <p>📎 Adjuntos enviados: ${resultado.adjuntos_enviados}</p>
                   <p>🆔 Referencia: #${resultado.historial_id}</p>
                 </div>`,
          confirmButtonColor: '#10b981',
          timer: 5000,
          timerProgressBar: true
        });

        if (onEnvioExitoso) {
          onEnvioExitoso(resultado);
        }

        onClose();
      } else {
        throw new Error(resultado.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error enviando correo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        html: `<strong>No se pudo enviar el correo</strong><br><br>
               <small>${error.message}</small>`,
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Fondo */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Contenido del modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-blue-50 px-4 py-3 sm:px-6 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-blue-800">
                  📧 Enviar Factura por Correo
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-blue-400 hover:text-blue-600 transition-colors"
                disabled={enviando}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-blue-700">
                Factura: <span className="font-semibold">{factura.numero}</span> |
                Cliente: <span className="font-semibold">{factura.cliente}</span> |
                Valor: <span className="font-semibold">${factura.valorTotal?.toLocaleString('es-CO') || '0'}</span>
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando configuración...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sección 1: Destinatarios - Nuevo selector mejorado */}
                <DestinatariosSelector
                  destinatariosSeleccionados={destinatarios}
                  onCambio={setDestinatarios}
                  puedeAgregar={true}
                  puedeEditar={true}
                  puedeEliminar={true}
                />

                {/* Sección 2: Asunto y Cuerpo */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 flex items-center">
                    <span className="mr-2">✉️</span> Contenido del Correo
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asunto
                    </label>
                    <input
                      type="text"
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={enviando}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      value={cuerpo}
                      onChange={(e) => setCuerpo(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="6"
                      disabled={enviando}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variables disponibles: {'{numero}'}, {'{cliente}'}, {'{fecha}'}, {'{valor}'}, {'{adjuntos}'}
                    </p>
                  </div>
                </div>

                {/* Sección 3: Documentos Adjuntos */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 flex items-center">
                    <span className="mr-2">📎</span> Documentos Adjuntos
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Seleccione los documentos que desea adjuntar al correo:
                    </p>
                    <div className="space-y-2">
                      {documentosDisponibles.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`doc-${doc.id}`}
                              checked={doc.seleccionado}
                              onChange={() => handleDocumentoChange(doc.id)}
                              disabled={doc.obligatorio || doc.generando || enviando}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`doc-${doc.id}`} className="ml-2 text-sm text-gray-700">
                              {doc.nombre} {doc.obligatorio && <span className="text-red-500">*</span>}
                            </label>
                            {doc.generando && (
                              <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {archivosGenerados[doc.id] ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                ✅ Generado
                              </span>
                            ) : doc.seleccionado ? (
                              <button
                                onClick={() => generarDocumento(doc.id)}
                                disabled={doc.generando || enviando}
                                className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                              >
                                {doc.generando ? 'Generando...' : 'Generar'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <span className="text-red-500">*</span> Documento obligatorio
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-800 mb-2">Resumen del envío</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Destinatarios:</span>
                      <span className="ml-2 font-medium">{destinatarios.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Documentos:</span>
                      <span className="ml-2 font-medium">
                        {documentosDisponibles.filter(d => d.seleccionado).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Factura generada:</span>
                      <span className="ml-2 font-medium">
                        {archivosGenerados.factura ? '✅ Sí' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Estado:</span>
                      <span className="ml-2 font-medium">
                        {enviando ? '🔄 Enviando...' : '📤 Listo para enviar'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                onClick={onClose}
                disabled={enviando}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <div className="space-x-3">
                <button
                  onClick={generarDocumentosSeleccionados}
                  disabled={enviando || documentosDisponibles.filter(d => d.seleccionado && !archivosGenerados[d.id]).length === 0}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Generar Documentos
                </button>
                <button
                  onClick={handleEnviarCorreo}
                  disabled={enviando || !archivosGenerados.factura}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    '📤 Enviar Correo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnviarCorreoFacturaModal;