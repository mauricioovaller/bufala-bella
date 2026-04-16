/**
 * COMPONENTE: SelectorDocumentos
 * PROPÓSITO: Selector reutilizable de documentos para cualquier módulo
 * USO: Facturación, Pedidos, Consolidación
 * CARACTERÍSTICAS:
 *   - Selección múltiple con checkboxes
 *   - Generación y progreso
 *   - Estado visual de documentos
 *   - Responsivo y accesible
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';

const SelectorDocumentos = ({
  documentosDisponibles = [],
  documentosGenerados = {},
  onDocumentoChange = () => {},
  onGenerarDocumento = async () => {},
  moduloNombre = 'Módulo',
  permitirMultiples = true,
  mostrarProgreso = false,
  generandoDocumento = null,
  className = ''
}) => {
  const [expandido, setExpandido] = useState(true);

  // Documentos activos (no ocultos)
  const documentosActivos = documentosDisponibles.filter(doc => !doc.oculto);

  // Documentos seleccionados
  const seleccionados = documentosDisponibles.filter(doc => doc.seleccionado);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* HEADER - CLICKEABLE PARA EXPANDIR/CONTRAER */}
      <div
        onClick={() => setExpandido(!expandido)}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                📎 Documentos a Adjuntar
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {seleccionados.length} de {documentosActivos.length} seleccionados
              </p>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${expandido ? 'rotate-180' : ''}`}>
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* CONTENIDO - EXPANDIBLE */}
      {expandido && (
        <div className="px-4 sm:px-6 py-4 space-y-3">
          {documentosActivos.length === 0 ? (
            <div className="py-6 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No hay documentos disponibles para este módulo</p>
            </div>
          ) : (
            documentosActivos.map((doc) => (
              <div
                key={doc.id}
                className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                  doc.seleccionado
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* CHECKBOX */}
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={doc.seleccionado}
                      onChange={() => onDocumentoChange(doc.id)}
                      disabled={doc.obligatorio || doc.generando || generandoDocumento === doc.id}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* INFORMACIÓN Y ACCIONES */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          {doc.nombre}
                          {doc.obligatorio && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Obligatorio
                            </span>
                          )}
                        </h4>
                        {doc.descripcion && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{doc.descripcion}</p>
                        )}
                      </div>

                      {/* BOTÓN GENERAR O ESTADO */}
                      <div className="flex-shrink-0">
                        {documentosGenerados[doc.id] ? (
                          // GENERADO - MOSTRAR CHECKMARK
                          <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-medium">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Generado
                          </div>
                        ) : doc.generando || generandoDocumento === doc.id ? (
                          // GENERANDO - MOSTRAR SPINNER
                          <div className="flex items-center gap-1 text-blue-600 text-xs sm:text-sm font-medium">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            Generando...
                          </div>
                        ) : (
                          // NO GENERADO - BOTÓN GENERAR (SOLO SI SELECCIONADO)
                          doc.seleccionado && (
                            <button
                              onClick={() => onGenerarDocumento(doc.id)}
                              disabled={doc.generando || generandoDocumento === doc.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-105"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Generar
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* INFORMACIÓN DE TAMAÑO (SI EXISTE) */}
                    {documentosGenerados[doc.id] && (
                      <p className="text-xs text-gray-500 mt-2">
                        Tamaño: {Math.round(documentosGenerados[doc.id].blob.size / 1024)} KB
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* RESUMEN Y ADVERTENCIAS */}
          {documentosActivos.length > 0 && (
            <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-gray-400 mt-1">ℹ️</div>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p className="font-semibold mb-1">
                    {seleccionados.length} de {documentosActivos.length} documentos seleccionados
                  </p>
                  <ul className="space-y-1 list-disc list-inside text-gray-600">
                    <li>{documentosGenerados ? Object.keys(documentosGenerados).length : 0} documento(s) generado(s)</li>
                    <li>Los documentos obligatorios no pueden deseleccionarse</li>
                    <li>Click en "Generar" para crear el PDF</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectorDocumentos;