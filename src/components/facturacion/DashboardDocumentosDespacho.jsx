// src/components/facturacion/DashboardDocumentosDespacho.jsx
import React, { useState } from 'react';
import { generarCartaResponsabilidad, generarReporteDespacho, generarPlanVallejo } from '../../services/planillasService';
import Swal from 'sweetalert2';
import ModalVisorPreliminar from "../ModalVisorPreliminar";

const DashboardDocumentosDespacho = ({
  planilla,
  facturas,
  configuracion,
  onClose,
  onGenerarDocumento,
  onReversarDocumentos
}) => {
  const [generandoDocumento, setGenerandoDocumento] = useState('');
  
  // Estados para el visor de PDF - IGUAL QUE Pedidos.jsx
  const [urlPDF, setUrlPDF] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Documentos disponibles
  const documentosPlanilla = [
    {
      id: "carta-aerolinea",
      titulo: "✈️ Carta para Aerolínea",
      descripcion: "Documento dirigido a la aerolínea con información completa del despacho",
      tipo: "planilla",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      id: "carta-policia",
      titulo: "👮 Carta para Policía",
      descripcion: "Documento para autorización de las autoridades policiales",
      tipo: "planilla",
      color: "bg-green-500 hover:bg-green-600"
    }
  ];

  const documentosFactura = [
    {
      id: "plan-vallejo",
      titulo: "📋 Plan Vallejo",
      descripcion: "Reporte específico por factura para trámites de plan vallejo",
      tipo: "factura",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      id: "reporte-despacho",
      titulo: "🚚 Reporte de Despacho",
      descripcion: "Reporte detallado por factura con información del vehículo",
      tipo: "factura",
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  const handleGenerarDocumento = async (tipoDocumento, factura = null) => {
    console.log('🔄 Iniciando generación de documento:', { tipoDocumento, factura, planilla });

    setGenerandoDocumento(tipoDocumento);

    try {
      let blob;

      // Para cartas de aerolínea y policía
      if (tipoDocumento === 'carta-aerolinea' || tipoDocumento === 'carta-policia') {
        const idPlanilla = planilla?.Id_Planilla || planilla?.idPlanilla;

        if (!idPlanilla) {
          console.error('❌ No se pudo obtener el ID de la planilla:', planilla);
          throw new Error('No se encontró información de la planilla. ID no disponible.');
        }

        console.log('📋 ID de planilla a usar:', idPlanilla);
        blob = await generarCartaResponsabilidad(tipoDocumento, idPlanilla);

      }
      // Para Reporte de Despacho
      else if (tipoDocumento === 'reporte-despacho') {
        console.log('📋 Generando Reporte de Despacho para factura:', factura);

        const idFactura = factura?.id || factura?.Id_EncabInvoice;

        if (!factura || !idFactura) {
          throw new Error('No se encontró información completa de la factura');
        }

        blob = await generarReporteDespacho(idFactura);

      }
      // Para Plan Vallejo
      else if (tipoDocumento === 'plan-vallejo') {
        console.log('📋 Generando Plan Vallejo para factura:', factura);

        const idFactura = factura?.id || factura?.Id_EncabInvoice;

        if (!factura || !idFactura) {
          throw new Error('No se encontró información completa de la factura');
        }

        blob = await generarPlanVallejo(idFactura);

      }
      // Para otros documentos (mantener lógica existente)
      else {
        await onGenerarDocumento(tipoDocumento, factura, configuracion);
        setGenerandoDocumento('');
        return; // Salir temprano para documentos que no son PDF
      }

      // CREAR URL Y MOSTRAR MODAL - IGUAL QUE Pedidos.jsx
      const fileURL = URL.createObjectURL(blob);
      setUrlPDF(fileURL);
      setMostrarModal(true);

      // Mostrar mensaje de éxito
      let tituloDocumento = '';
      if (tipoDocumento === 'carta-aerolinea') tituloDocumento = 'Carta para Aerolínea';
      else if (tipoDocumento === 'carta-policia') tituloDocumento = 'Carta para Policía';
      else if (tipoDocumento === 'reporte-despacho') tituloDocumento = 'Reporte de Despacho';
      else if (tipoDocumento === 'plan-vallejo') tituloDocumento = 'Plan Vallejo';

      Swal.fire({
        icon: 'success',
        title: '¡Documento Generado!',
        text: `${tituloDocumento} generado correctamente`,
        confirmButtonColor: '#10b981',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('❌ Error generando documento:', error);

      let errorMessage = 'No se pudo generar el documento';
      if (error.message.includes('HTTP')) {
        errorMessage = `Error del servidor: ${error.message}`;
      } else if (error.message.includes('PDF')) {
        errorMessage = 'El documento generado no es válido';
      } else if (error.message.includes('ID no disponible')) {
        errorMessage = 'Error: No se encontró la información completa de la planilla. Por favor, configura el despacho nuevamente.';
      } else if (error.message.includes('información completa de la factura')) {
        errorMessage = 'Error: No se encontró información completa de la factura.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setGenerandoDocumento('');
    }
  };

  // Función para cerrar el modal - IGUAL QUE Pedidos.jsx
  const handleCloseModal = () => {
    setMostrarModal(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

  const handleReversarTodo = async () => {
    const result = await Swal.fire({
      title: '¿Reversar Documentos?',
      text: 'Esta acción eliminará todos los documentos generados y la configuración. ¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, reversar todo',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await onReversarDocumentos();
      Swal.fire({
        icon: 'success',
        title: 'Documentos Reversados',
        text: 'Todos los documentos han sido eliminados y la configuración ha sido limpiada.',
        confirmButtonColor: '#10b981'
      });
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Dashboard de Documentos</h2>
          <p className="text-gray-600">Genera y gestiona todos los documentos de despacho</p>
        </div>
        <button
          onClick={handleReversarTodo}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          🗑️ Reversar Todo
        </button>
      </div>

      {/* RESUMEN DE CONFIGURACIÓN */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-blue-800 mb-4">📦 Resumen de Despacho Configurado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600 font-medium">Conductor</p>
            <p className="text-blue-900">{configuracion.conductor?.nombre}</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Ayudante</p>
            <p className="text-blue-900">{configuracion.ayudante ? configuracion.ayudante.nombre : 'No asignado'}</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Vehículo</p>
            <p className="text-blue-900">{configuracion.placaVehiculo} - {configuracion.descripcionVehiculo}</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Precinto</p>
            <p className="text-blue-900">{configuracion.precintoSeguridad}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-blue-700 text-sm">
            <strong>{facturas.length}</strong> factura(s) incluidas en este despacho
          </p>
        </div>
      </div>

      {/* DOCUMENTOS DE PLANILLA */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-1 h-8 bg-blue-500 rounded-full mr-3"></div>
          <h3 className="text-xl font-semibold text-gray-800">📄 Documentos de la Planilla</h3>
        </div>
        <p className="text-gray-600 mb-4">Documentos que incluyen todas las facturas del despacho</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documentosPlanilla.map((documento) => (
            <div key={documento.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {documento.titulo}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {documento.descripcion}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleGenerarDocumento(documento.id)}
                disabled={generandoDocumento === documento.id}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${generandoDocumento === documento.id
                  ? 'bg-gray-400 cursor-not-allowed'
                  : documento.color
                  }`}
              >
                {generandoDocumento === documento.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generando...</span>
                  </div>
                ) : (
                  'Generar Documento'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DOCUMENTOS POR FACTURA */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-1 h-8 bg-green-500 rounded-full mr-3"></div>
          <h3 className="text-xl font-semibold text-gray-800">📊 Documentos por Factura</h3>
        </div>
        <p className="text-gray-600 mb-4">Documentos individuales para cada factura del despacho</p>

        <div className="space-y-6">
          {facturas.map((factura, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">
                    Factura: {factura.numero}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Cliente: {factura.cliente} • Valor: ${factura.valorTotal?.toLocaleString('es-CO')}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  📦 {factura.tipo === 'sample' ? 'Sample' : 'Normal'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentosFactura.map((documento) => (
                  <div key={documento.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-1">
                          {documento.titulo}
                        </h5>
                        <p className="text-gray-600 text-xs">
                          {documento.descripcion}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGenerarDocumento(documento.id, factura)}
                      disabled={generandoDocumento === `${documento.id}-${factura.numero}`}
                      className={`w-full py-2 px-3 rounded-lg font-medium text-white text-sm transition-all ${generandoDocumento === `${documento.id}-${factura.numero}`
                        ? 'bg-gray-400 cursor-not-allowed'
                        : documento.color
                        }`}
                    >
                      {generandoDocumento === `${documento.id}-${factura.numero}` ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Generando...</span>
                        </div>
                      ) : (
                        'Generar'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INFORMACIÓN ADICIONAL */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-3 text-xl">💡</div>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Información Importante</h4>
            <p className="text-yellow-700 text-sm">
              • Puedes generar múltiples documentos simultáneamente<br />
              • Los documentos de planilla incluyen todas las facturas<br />
              • Los documentos por factura se generan individualmente<br />
              • Usa "Reversar Todo" para eliminar todos los documentos y empezar de nuevo
            </p>
          </div>
        </div>
      </div>

      {/* MODAL PARA VISUALIZAR PDF - IGUAL QUE Pedidos.jsx */}
      {mostrarModal && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DashboardDocumentosDespacho;