// src/components/facturacion/DocumentosFacturaModal.jsx
import React, { useState } from "react";
import { generarCartaResponsabilidad, generarReporteDespacho, generarPlanVallejo } from '../../services/planillasService';
import ModalVisorPreliminar from '../ModalVisorPreliminar';
import Swal from 'sweetalert2';

const DocumentosFacturaModal = ({
    factura,
    isOpen,
    onClose
}) => {
    const [mostrarModalPDF, setMostrarModalPDF] = useState(false);
    const [urlPDF, setUrlPDF] = useState(null);
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [tipoDocumentoActual, setTipoDocumentoActual] = useState('');

    // Función para generar y mostrar un documento
    const generarYMostrarDocumento = async (generadorFunc, tipoDocumento, parametros = []) => {
        setGenerandoPDF(true);
        setTipoDocumentoActual(tipoDocumento);
        
        try {
            const pdfBlob = await generadorFunc(...parametros);
            
            if (pdfBlob.success === false) {
                throw new Error(pdfBlob.message || `Error al generar ${tipoDocumento}`);
            }
            
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setUrlPDF(pdfUrl);
            setMostrarModalPDF(true);
        } catch (error) {
            console.error(`Error al generar ${tipoDocumento}:`, error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error al generar ${tipoDocumento}: ${error.message}`,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setGenerandoPDF(false);
            setTipoDocumentoActual('');
        }
    };

    // Función para generar carta de responsabilidad (IGUAL QUE DashboardDocumentosDespacho.jsx)
    const handleGenerarCarta = async (tipoCarta) => {
        if (!factura.Id_Planilla || factura.Id_Planilla === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin planilla asociada',
                text: 'Esta factura no tiene una planilla asociada para generar cartas de responsabilidad.',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }
        
        // SweetAlert para preguntar "con firma" o "sin firma" (IGUAL QUE DashboardDocumentosDespacho.jsx)
        const result = await Swal.fire({
            title: '¿Incluir firma?',
            text: 'Selecciona si deseas incluir la firma en el documento',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '✅ Con Firma',
            cancelButtonText: '❌ Sin Firma',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            reverseButtons: true
        });

        // result.isConfirmed es true cuando se confirma (Con Firma), false cuando se cancela (Sin Firma)
        const conFirma = result.isConfirmed;
        
        await generarYMostrarDocumento(
            generarCartaResponsabilidad,
            `Carta de ${tipoCarta === 'aerolinea' ? 'Aerolínea' : 'Policía'}`,
            [tipoCarta === 'aerolinea' ? 'carta-aerolinea' : 'carta-policia', factura.Id_Planilla, conFirma]
        );
    };

    // Función para generar reporte de despacho
    const handleGenerarReporteDespacho = async () => {
        await generarYMostrarDocumento(
            generarReporteDespacho,
            'Reporte de Despacho',
            [factura.id]
        );
    };

    // Función para generar plan vallejo
    const handleGenerarPlanVallejo = async () => {
        await generarYMostrarDocumento(
            generarPlanVallejo,
            'Plan Vallejo',
            [factura.id]
        );
    };

    // Función: Cerrar modal y limpiar URL
    const handleCloseModal = () => {
        setMostrarModalPDF(false);
        if (urlPDF) {
            URL.revokeObjectURL(urlPDF);
            setUrlPDF(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Modal principal */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                    {/* Fondo */}
                    <div 
                        className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
                        onClick={onClose}
                    />

                    {/* Contenido del modal */}
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        {/* Header */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Documentos de Factura
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                    Factura: <span className="font-semibold">{factura.numero}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Cliente: <span className="font-semibold">{factura.cliente}</span>
                                </p>
                                {factura.Id_Planilla && factura.Id_Planilla !== 0 && (
                                    <p className="text-sm text-gray-600">
                                        Planilla asociada: <span className="font-semibold">#{factura.Id_Planilla}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                            <div className="space-y-4">
                                {/* Documentos de planilla (si existe Id_Planilla y no es 0) */}
                                {factura.Id_Planilla && factura.Id_Planilla !== 0 ? (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-700">Cartas de Responsabilidad</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleGenerarCarta('aerolinea')}
                                                disabled={generandoPDF && tipoDocumentoActual.includes('Aerolínea')}
                                                className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg border border-blue-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generandoPDF && tipoDocumentoActual.includes('Aerolínea') ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                        Generando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-lg">✈️</span>
                                                        <span className="font-medium">Carta para Aerolínea</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleGenerarCarta('policia')}
                                                disabled={generandoPDF && tipoDocumentoActual.includes('Policía')}
                                                className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg border border-green-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generandoPDF && tipoDocumentoActual.includes('Policía') ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                        Generando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-lg">👮</span>
                                                        <span className="font-medium">Carta para Policía</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-yellow-700 text-sm">
                                            <span className="font-medium">Nota:</span> Esta factura no tiene una planilla asociada. 
                                            Las cartas de responsabilidad requieren una planilla.
                                        </p>
                                    </div>
                                )}

                                {/* Documentos de factura */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-700">Documentos de Factura</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={handleGenerarReporteDespacho}
                                            disabled={generandoPDF && tipoDocumentoActual.includes('Reporte')}
                                            className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg border border-green-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generandoPDF && tipoDocumentoActual.includes('Reporte') ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                                    Generando...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-lg">📋</span>
                                                    <span className="font-medium">Reporte Despacho</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleGenerarPlanVallejo}
                                            disabled={generandoPDF && tipoDocumentoActual.includes('Plan Vallejo')}
                                            className="flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg border border-orange-200 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generandoPDF && tipoDocumentoActual.includes('Plan Vallejo') ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                                    Generando...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-lg">📊</span>
                                                    <span className="font-medium">Plan Vallejo</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Información adicional */}
                                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Nota:</span> Todos los documentos se generan en formato PDF y se pueden visualizar en el visor preliminar.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para visualizar PDF */}
            {mostrarModalPDF && urlPDF && (
                <ModalVisorPreliminar
                    url={urlPDF}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default DocumentosFacturaModal;