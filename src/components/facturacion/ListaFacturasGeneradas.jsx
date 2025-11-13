// src/components/facturacion/ListaFacturasGeneradas.jsx
import React, { useState, useEffect, useRef } from "react";
import { obtenerFacturasGeneradas, generarFacturaPDF } from '../../services/facturacionService';
import ModalVisorPreliminar from '../ModalVisorPreliminar';

const ListaFacturasGeneradas = ({
    filtros,
    facturasSeleccionadas,
    onFacturasChange,
    onSelectAllFacturas
}) => {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // 🔴 NUEVOS ESTADOS PARA EL MODAL DE PDF
    const [mostrarModalPDF, setMostrarModalPDF] = useState(false);
    const [urlPDF, setUrlPDF] = useState(null);
    const [generandoPDF, setGenerandoPDF] = useState(false);

    // 🔴 REF para controlar cambios en filtros
    const filtrosAnteriores = useRef({ fechaDesde: '', fechaHasta: '' });

    // 🔴 EFECTO CORREGIDO: Cargar facturas cuando cambien los filtros
    useEffect(() => {
        const cargarFacturas = async () => {
            if (!filtros.fechaDesde || !filtros.fechaHasta) {
                return;
            }

            // 🔴 Evitar llamadas duplicadas con los mismos filtros
            if (filtros.fechaDesde === filtrosAnteriores.current.fechaDesde && 
                filtros.fechaHasta === filtrosAnteriores.current.fechaHasta) {
                return;
            }

            // 🔴 Actualizar referencia
            filtrosAnteriores.current = {
                fechaDesde: filtros.fechaDesde,
                fechaHasta: filtros.fechaHasta
            };

            setLoading(true);
            setError(null);

            try {
                const resultado = await obtenerFacturasGeneradas(filtros.fechaDesde, filtros.fechaHasta);

                if (resultado.facturas && resultado.facturas.length > 0) {
                    // 🔴 Inicializar sin selecciones
                    const facturasConSeleccion = resultado.facturas.map(factura => ({
                        ...factura,
                        seleccionada: false
                    }));
                    setFacturas(facturasConSeleccion);
                } else {
                    setFacturas([]);
                }
            } catch (err) {
                setError(err.message);
                setFacturas([]);
            } finally {
                setLoading(false);
            }
        };

        cargarFacturas();
    }, [filtros.fechaDesde, filtros.fechaHasta]);

    // 🔴 Manejar selección individual de factura - VERSIÓN CORREGIDA
    const handleFacturaSelect = (facturaId) => {
        setFacturas(prevFacturas => {
            const nuevasFacturas = prevFacturas.map(factura =>
                factura.id === facturaId
                    ? { ...factura, seleccionada: !factura.seleccionada }
                    : factura
            );

            // 🔴 Notificar al padre SOLO con los IDs o datos necesarios
            const seleccionadas = nuevasFacturas.filter(f => f.seleccionada);
            onFacturasChange(seleccionadas);
            
            return nuevasFacturas;
        });
    };

    // 🔴 Manejar selección de todas las facturas - VERSIÓN CORREGIDA
    const handleSelectAll = () => {
        setFacturas(prevFacturas => {
            const allSelected = prevFacturas.every(factura => factura.seleccionada);
            const nuevasFacturas = prevFacturas.map(factura => ({
                ...factura,
                seleccionada: !allSelected
            }));

            // 🔴 Notificar al padre
            const seleccionadas = nuevasFacturas.filter(f => f.seleccionada);
            onFacturasChange(seleccionadas);
            
            return nuevasFacturas;
        });
    };

    // 🔴 FUNCIÓN ACTUALIZADA: Ver factura con PDF
    const handleVerFactura = async (facturaId, numeroFactura) => {
        setGenerandoPDF(true);
        
        try {
            const pdfBlob = await generarFacturaPDF(facturaId);
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setUrlPDF(pdfUrl);
            setMostrarModalPDF(true);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert(`Error al generar la factura: ${error.message}`);
        } finally {
            setGenerandoPDF(false);
        }
    };

    // 🔴 FUNCIÓN: Cerrar modal y limpiar URL
    const handleCloseModal = () => {
        setMostrarModalPDF(false);
        if (urlPDF) {
            URL.revokeObjectURL(urlPDF);
            setUrlPDF(null);
        }
    };

    const facturasActualesSeleccionadas = facturas.filter(factura => factura.seleccionada);

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                    <div className="w-1 h-6 sm:h-8 bg-orange-500 rounded-full mr-3"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Facturas Generadas</h2>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Cargando facturas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                    <div className="w-1 h-6 sm:h-8 bg-orange-500 rounded-full mr-3"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Facturas Generadas</h2>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div className="flex items-center">
                        <div className="w-1 h-6 sm:h-8 bg-orange-500 rounded-full mr-3"></div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Facturas Generadas</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm text-gray-600">
                            {facturasActualesSeleccionadas.length} de {facturas.length} seleccionadas
                        </span>
                        <button
                            onClick={handleSelectAll}
                            disabled={facturas.length === 0}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {facturas.every(factura => factura.seleccionada) ? 'Desel. Todas' : 'Sel. Todas'}
                        </button>
                    </div>
                </div>

                {/* LISTA DE FACTURAS */}
                <div className="space-y-3">
                    {facturas.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No se encontraron facturas para las fechas seleccionadas
                        </div>
                    ) : (
                        facturas.map((factura) => (
                            <div
                                key={factura.id}
                                className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 ${factura.seleccionada
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={factura.seleccionada}
                                        onChange={() => handleFacturaSelect(factura.id)}
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 rounded focus:ring-orange-500"
                                    />

                                    <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{factura.numero}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">{factura.fecha}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Cliente</p>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">{factura.cliente}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-gray-600">Valor Total</p>
                                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                                                ${factura.valorTotal.toLocaleString('es-CO')}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <button 
                                                onClick={() => handleVerFactura(factura.id, factura.numero)}
                                                disabled={generandoPDF}
                                                className={`flex items-center gap-1 font-medium text-xs sm:text-sm transition-all hover:scale-105 ${
                                                    generandoPDF 
                                                        ? 'text-gray-400 cursor-not-allowed' 
                                                        : 'text-blue-600 hover:text-blue-800'
                                                }`}
                                            >
                                                {generandoPDF ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                                        Generando...
                                                    </>
                                                ) : (
                                                    '👁️ Ver Factura'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 🔴 MODAL PARA VISUALIZAR PDF */}
            {mostrarModalPDF && urlPDF && (
                <ModalVisorPreliminar
                    url={urlPDF}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default ListaFacturasGeneradas;