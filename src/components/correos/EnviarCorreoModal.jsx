/**
 * COMPONENTE: EnviarCorreoModal
 * PROPÓSITO: Modal genérico reutilizable para envío de correos en cualquier módulo
 * MÓDULOS: Facturación, Pedidos, Consolidación
 * 
 * CARACTERÍSTICAS:
 *   - Agnóstico al módulo de origen
 *   - Generación dinámmica de documentos
 *   - Selección flexible de destinatarios
 *   - Plantillas de correo reutilizables
 *   - Diseño responsivo y atractivo
 *   - Registro automático en historial
 */

import React, { useState, useEffect } from 'react';
import {
  obtenerDestinatariosPredeterminados,
  obtenerPlantillaPredeterminada,
  aplicarVariablesPlantilla,
  parsearListaEmails,
  validarEmail,
  generarVariablesFactura
} from '../../services/correoService';
import { enviarCorreoGenerico } from '../../services/envioCorreosGenericoService';
import DestinatariosSelector from '../facturacion/DestinatariosSelector';
import SelectorDocumentos from './SelectorDocumentos';
import Swal from 'sweetalert2';

const EnviarCorreoModal = ({
  isOpen,
  onClose,
  modulo = 'facturacion',
  referencia = {},
  documentosDisponibles = [],
  generadorDocumentos = null,
  onEnvioExitoso = () => {}
}) => {
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Estados de destinatarios
  const [destinatarios, setDestinatarios] = useState([]);
  const [destinatariosManual, setDestinatariosManual] = useState('');

  // Estados de contenido
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [plantillaId, setPlantillaId] = useState(null);

  // Estados de documentos
  const [docs, setDocs] = useState([]);
  const [archivosGenerados, setArchivosGenerados] = useState({});
  const [generandoDocumento, setGenerandoDocumento] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales();
    }
  }, [isOpen]);

  // Actualizar variables de plantilla cuando cambien documentos
  useEffect(() => {
    if (plantillaId && referencia) {
      actualizarVariablesPlantilla();
    }
  }, [docs, archivosGenerados]);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Inicializar documentos
      const docsConEstado = documentosDisponibles.map(doc => ({
        ...doc,
        seleccionado: doc.obligatorio || false,
        generando: false
      }));
      setDocs(docsConEstado);

      // Cargar destinatarios predeterminados
      const respDestinatarios = await obtenerDestinatariosPredeterminados();
      if (respDestinatarios.success) {
        const emails = respDestinatarios.destinatarios.map(d => d.email);
        setDestinatarios(emails);
        setDestinatariosManual(emails.join(', '));
      }

      // Cargar plantilla predeterminada
      const respPlantilla = await obtenerPlantillaPredeterminada(modulo);
      if (respPlantilla.success) {
        const plantilla = respPlantilla.plantilla;
        setPlantillaId(plantilla.id);

        // Aplicar variables
        const variables = generarVariablesFactura(referencia, []);
        const respVariables = await aplicarVariablesPlantilla(plantilla.id, variables);

        if (respVariables.success) {
          setAsunto(respVariables.asunto);
          setCuerpo(respVariables.cuerpo);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos iniciales',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  const actualizarVariablesPlantilla = async () => {
    if (!plantillaId) return;

    try {
      const documentosSeleccionados = docs
        .filter(doc => doc.seleccionado && archivosGenerados[doc.id])
        .map(doc => ({ nombre: doc.nombre }));

      const variables = generarVariablesFactura(referencia, documentosSeleccionados);
      const respuesta = await aplicarVariablesPlantilla(plantillaId, variables);

      if (respuesta.success) {
        setAsunto(respuesta.asunto);
        setCuerpo(respuesta.cuerpo);
      }
    } catch (error) {
      console.error('Error actualizando variables:', error);
    }
  };

  const handleDestinatariosChange = (texto) => {
    setDestinatariosManual(texto);
    const emails = parsearListaEmails(texto);
    setDestinatarios(emails);
  };

  const handleDocumentoChange = (id) => {
    setDocs(prev =>
      prev.map(doc =>
        doc.id === id && !doc.obligatorio
          ? { ...doc, seleccionado: !doc.seleccionado }
          : doc
      )
    );
  };

  const handleGenerarDocumento = async (docId) => {
    if (!generadorDocumentos) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se proporcionó el generador de documentos',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    try {
      setGenerandoDocumento(docId);
      setDocs(prev =>
        prev.map(doc =>
          doc.id === docId ? { ...doc, generando: true } : doc
        )
      );

      const blob = await generadorDocumentos(docId, referencia);

      if (!blob || blob.size === 0) {
        throw new Error(`El documento se generó vacío`);
      }

      const doc = documentosDisponibles.find(d => d.id === docId);
      const nombreArchivo = `${docId}-${referencia.numero || referencia.id}.pdf`;

      setArchivosGenerados(prev => ({
        ...prev,
        [docId]: {
          blob: blob,
          nombre: nombreArchivo,
          tipo: 'application/pdf'
        }
      }));

      Swal.fire({
        icon: 'success',
        title: 'Documento generado',
        text: `${doc?.nombre || docId} generado correctamente`,
        timer: 2000,
        showConfirmButton: false
      });

      actualizarVariablesPlantilla();

    } catch (error) {
      console.error('Error generando documento:', error);

      setDocs(prev =>
        prev.map(doc =>
          doc.id === docId ? { ...doc, seleccionado: false } : doc
        )
      );

      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `No se pudo generar el documento<br><small>${error.message}</small>`,
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setGenerandoDocumento(null);
      setDocs(prev =>
        prev.map(doc =>
          doc.id === docId ? { ...doc, generando: false } : doc
        )
      );
    }
  };

  const validarFormulario = () => {
    if (destinatarios.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Destinatarios requeridos',
        text: 'Debe ingresar al menos un correo válido',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    if (!asunto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Asunto requerido',
        text: 'El asunto del correo es obligatorio',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    const documentosSeleccionados = docs.filter(d => d.seleccionado);
    if (documentosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Documentos requeridos',
        text: 'Selecciona al menos un documento',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    const documentosFaltantes = documentosSeleccionados.filter(d => !archivosGenerados[d.id]);
    if (documentosFaltantes.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Documentos no generados',
        text: `Genera los siguientes documentos: ${documentosFaltantes.map(d => d.nombre).join(', ')}`,
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    return true;
  };

  const handleEnviar = async () => {
    if (!validarFormulario()) return;

    const confirmacion = await Swal.fire({
      title: '¿Enviar correo?',
      html: `Se enviará a <strong>${destinatarios.length}</strong> destinatario(s)<br>con <strong>${docs.filter(d => d.seleccionado).length}</strong> documento(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    });

    if (!confirmacion.isConfirmed) return;

    setEnviando(true);

    try {
      const documentosSeleccionados = docs.filter(d => d.seleccionado).map(d => d.id);
      const adjuntos = documentosSeleccionados
        .filter(id => archivosGenerados[id])
        .map(id => archivosGenerados[id]);

      const resultado = await enviarCorreoGenerico({
        modulo: modulo,
        referencia_id: referencia.id,
        referencia_numero: referencia.numero,
        destinatarios: destinatarios,
        documentos_seleccionados: documentosSeleccionados,
        asunto: asunto,
        cuerpo: cuerpo,
        datosReferencia: referencia,
        generador: generadorDocumentos,
        usuario: localStorage.getItem('usuario_nombre') || 'Usuario',
        usuario_id: localStorage.getItem('usuario_id'),
        usuario_email: localStorage.getItem('usuario_email')
      });

      Swal.fire({
        icon: 'success',
        title: '¡Correo enviado!',
        html: `<div class="text-left"><p>📧 Destinatarios: ${resultado.destinatarios_enviados}</p><p>📎 Adjuntos: ${resultado.adjuntos_enviados}</p><p>🆔 ID: ${resultado.historial_id}</p></div>`,
        confirmButtonColor: '#10b981',
        timer: 5000,
        timerProgressBar: true
      });

      onEnvioExitoso(resultado);
      onClose();

    } catch (error) {
      console.error('Error enviando:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar el correo',
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
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📧</span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Enviar Correo
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {referencia.numero || referencia.id}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="mt-3 text-gray-600">Cargando datos...</p>
              </div>
            ) : (
              <>
                {/* DESTINATARIOS */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    👥 Destinatarios
                  </label>
                  <textarea
                    value={destinatariosManual}
                    onChange={(e) => handleDestinatariosChange(e.target.value)}
                    placeholder="Ingresa emails separados por comas, punto y coma o saltos de línea..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 text-sm"
                  />
                  {destinatarios.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {destinatarios.map((email, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {email}
                          <button onClick={() => handleDestinatariosChange(destinatariosManual.replace(email, '').replace(/[,;]\s*/g, ',').trim())}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ASUNTO */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    📝 Asunto
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Asunto del correo..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* CUERPO */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    ✍️ Mensaje
                  </label>
                  <textarea
                    value={cuerpo}
                    onChange={(e) => setCuerpo(e.target.value)}
                    placeholder="Mensaje del correo..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 text-sm"
                  />
                </div>

                {/* SELECTOR DE DOCUMENTOS */}
                {docs.length > 0 && (
                  <SelectorDocumentos
                    documentosDisponibles={docs}
                    documentosGenerados={archivosGenerados}
                    onDocumentoChange={handleDocumentoChange}
                    onGenerarDocumento={handleGenerarDocumento}
                    moduloNombre={modulo}
                    generandoDocumento={generandoDocumento}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              onClick={handleEnviar}
              disabled={loading || enviando}
              className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? '⏳ Enviando...' : '✅ Enviar Correo'}
            </button>
            <button
              onClick={onClose}
              disabled={loading || enviando}
              className="w-full sm:w-auto px-6 py-2 bg-white border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnviarCorreoModal;