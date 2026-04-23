// src/components/facturacion/ListaFacturasGeneradas.jsx
import React, { useState, useEffect, useRef } from "react";
import { obtenerFacturasGeneradas, obtenerFacturasConFiltros, generarFacturaPDF, eliminarFacturaCompleta } from '../../services/facturacionService';
import ModalVisorPreliminar from '../ModalVisorPreliminar';
import EnviarCorreoFacturaModal from './EnviarCorreoFacturaModal';
import EnviarCorreoMultipleFacturasModal from './EnviarCorreoMultipleFacturasModal';
import Swal from 'sweetalert2';

const ListaFacturasGeneradas = ({
    filtros,
    onFacturasChange,
    modoConsulta = false,
    onVerDocumentos,
    onEstadisticasChange
}) => {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el modal de PDF
    const [mostrarModalPDF, setMostrarModalPDF] = useState(false);
    const [urlPDF, setUrlPDF] = useState(null);
    const [generandoPDF, setGenerandoPDF] = useState(false);

    // Estados para eliminar factura
    const [eliminandoFactura, setEliminandoFactura] = useState(null);

    // Estados para envío de correo
    const [mostrarModalCorreo, setMostrarModalCorreo] = useState(false);
    const [facturaParaEnviar, setFacturaParaEnviar] = useState(null);

    // Estados para envío múltiple (modoConsulta)
    const [idsEnvioMultiple, setIdsEnvioMultiple] = useState([]);
    const [mostrarModalCorreoMultiple, setMostrarModalCorreoMultiple] = useState(false);

    const filtrosAnteriores = useRef({ fechaDesde: '', fechaHasta: '' });

    // Efecto: Cargar facturas cuando cambien los filtros
    useEffect(() => {
        const cargarFacturas = async () => {
            if (!filtros.fechaDesde || !filtros.fechaHasta) {
                return;
            }

            // Para modo consulta, también validamos si hay filtros específicos
            if (modoConsulta) {
                const filtrosIguales =
                    filtros.fechaDesde === filtrosAnteriores.current.fechaDesde &&
                    filtros.fechaHasta === filtrosAnteriores.current.fechaHasta &&
                    filtros.tipoFactura === filtrosAnteriores.current.tipoFactura &&
                    filtros.numeroFactura === filtrosAnteriores.current.numeroFactura;

                if (filtrosIguales) {
                    return;
                }
            } else {
                // Para modo creación, solo comparamos fechas
                if (filtros.fechaDesde === filtrosAnteriores.current.fechaDesde &&
                    filtros.fechaHasta === filtrosAnteriores.current.fechaHasta) {
                    return;
                }
            }

            filtrosAnteriores.current = {
                fechaDesde: filtros.fechaDesde,
                fechaHasta: filtros.fechaHasta,
                tipoFactura: filtros.tipoFactura,
                numeroFactura: filtros.numeroFactura
            };

            setLoading(true);
            setError(null);

            try {
                let resultado;

                if (modoConsulta) {
                    // Usar filtros avanzados para modo consulta
                    resultado = await obtenerFacturasConFiltros(filtros);
                } else {
                    // Usar función original para modo creación
                    resultado = await obtenerFacturasGeneradas(filtros.fechaDesde, filtros.fechaHasta);
                }

                if (resultado.facturas && resultado.facturas.length > 0) {
                    // Ordenar por Id_EncabInvoice descendente (más reciente primero)
                    const facturasOrdenadas = resultado.facturas.sort((a, b) =>
                        b.Id_EncabInvoice - a.Id_EncabInvoice
                    );

                    const facturasConSeleccion = facturasOrdenadas.map(factura => ({
                        ...factura,
                        seleccionada: false
                    }));
                    setFacturas(facturasConSeleccion);

                    // Actualizar estadísticas si se proporciona callback
                    if (onEstadisticasChange) {
                        onEstadisticasChange(facturasConSeleccion);
                    }
                } else {
                    setFacturas([]);
                    // Actualizar estadísticas a cero
                    if (onEstadisticasChange) {
                        onEstadisticasChange([]);
                    }
                }
            } catch (err) {
                setError(err.message);
                setFacturas([]);
            } finally {
                setLoading(false);
            }
        };

        cargarFacturas();
    }, [filtros, modoConsulta, onEstadisticasChange]);

    // Función: Manejar selección individual de factura
    const handleFacturaSelect = (facturaId) => {
        setFacturas(prevFacturas => {
            const nuevasFacturas = prevFacturas.map(factura =>
                factura.id === facturaId
                    ? { ...factura, seleccionada: !factura.seleccionada }
                    : factura
            );

            const seleccionadas = nuevasFacturas.filter(f => f.seleccionada);
            onFacturasChange(seleccionadas);

            return nuevasFacturas;
        });
    };

    // Función: Manejar selección de todas las facturas
    const handleSelectAll = () => {
        setFacturas(prevFacturas => {
            const allSelected = prevFacturas.every(factura => factura.seleccionada);
            const nuevasFacturas = prevFacturas.map(factura => ({
                ...factura,
                seleccionada: !allSelected
            }));

            const seleccionadas = nuevasFacturas.filter(f => f.seleccionada);
            onFacturasChange(seleccionadas);

            return nuevasFacturas;
        });
    };

    // Función: Ver factura con PDF
    const handleVerFactura = async (facturaId) => {
        setGenerandoPDF(true);

        try {
            const pdfBlob = await generarFacturaPDF(facturaId);
            const pdfUrl = URL.createObjectURL(pdfBlob);
            setUrlPDF(pdfUrl);
            setMostrarModalPDF(true);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error al generar la factura: ${error.message}`,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setGenerandoPDF(false);
        }
    };

    // 🔴 FUNCIÓN ACTUALIZADA: Eliminar factura con SweetAlert2
    const handleEliminarFactura = async (factura) => {
        const facturaId = factura.id;
        const numeroFactura = factura.numero;
        const tipoPedido = factura.tipoPedido || 'normal'; // Por compatibilidad con facturas existentes
        // PRIMERA CONFIRMACIÓN
        const primeraConfirmacion = await Swal.fire({
            title: '¿Está seguro?',
            html: `Va a eliminar la factura <strong>${numeroFactura}</strong><br><br>Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            focusCancel: true
        });

        if (!primeraConfirmacion.isConfirmed) {
            return;
        }

        // SEGUNDA CONFIRMACIÓN (RECONTRA-CONFIRMAR)
        const segundaConfirmacion = await Swal.fire({
            title: '⚠️ ADVERTENCIA ⚠️',
            html: `¿<strong>REALMENTE</strong> está seguro de eliminar la factura <strong>${numeroFactura}</strong>?<br><br>
                   <div class="text-left">
                   <p>✅ Esta acción:</p>
                   <ul class="list-disc ml-4">
                     <li>Eliminará la factura permanentemente</li>
                     <li>Liberará los pedidos asociados para nueva facturación</li>
                     <li>No se podrá recuperar la información</li>
                   </ul>
                   </div>`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, ELIMINAR DEFINITIVAMENTE',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            focusCancel: true,
            customClass: {
                popup: 'sweetalert-warning-popup'
            }
        });

        if (!segundaConfirmacion.isConfirmed) {
            return;
        }

        setEliminandoFactura(facturaId);

        try {
            const resultado = await eliminarFacturaCompleta(facturaId, numeroFactura, tipoPedido);

            if (resultado.success) {
                // Mostrar SweetAlert de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Factura Eliminada!',
                    html: `Factura <strong>${numeroFactura}</strong> (${tipoPedido === 'sample' ? 'Samples' : 'Regular'}) eliminada correctamente.<br>
                           <strong>${resultado.pedidosActualizados}</strong> pedidos liberados de la tabla <strong>${resultado.tablaActualizada || (tipoPedido === 'sample' ? 'EncabPedidoSample' : 'EncabPedido')}</strong>.`,
                    confirmButtonColor: '#10b981',
                    timer: 5000,
                    timerProgressBar: true
                });

                // Recargar la lista de facturas
                const resultadoActualizado = await obtenerFacturasGeneradas(filtros.fechaDesde, filtros.fechaHasta);

                if (resultadoActualizado.facturas && resultadoActualizado.facturas.length > 0) {
                    const facturasConSeleccion = resultadoActualizado.facturas.map(factura => ({
                        ...factura,
                        seleccionada: false
                    }));
                    setFacturas(facturasConSeleccion);
                    onFacturasChange([]); // Limpiar selecciones
                } else {
                    setFacturas([]);
                    onFacturasChange([]);
                }

            } else {
                throw new Error(resultado.message || 'Error al eliminar la factura');
            }
        } catch (error) {
            console.error('Error al eliminar factura:', error);

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                html: `No se pudo eliminar la factura <strong>${numeroFactura}</strong><br><br>
                       <strong>Error:</strong> ${error.message}`,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setEliminandoFactura(null);
        }
    };

    // Función: Cerrar modal y limpiar URL
    const handleCloseModal = () => {
        setMostrarModalPDF(false);
        if (urlPDF) {
            URL.revokeObjectURL(urlPDF);
            setUrlPDF(null);
        }
    };

    // Función: Alternar selección de factura para envío múltiple
    const handleToggleEnvioMultiple = (facturaId) => {
        setIdsEnvioMultiple(prev =>
            prev.includes(facturaId)
                ? prev.filter(id => id !== facturaId)
                : [...prev, facturaId]
        );
    };

    // Función: Abrir modal de envío múltiple con las facturas seleccionadas
    const handleEnviarSeleccionadas = () => {
        setMostrarModalCorreoMultiple(true);
    };

    // Facturas seleccionadas para envío múltiple
    const facturasParaEnvioMultiple = facturas.filter(f => idsEnvioMultiple.includes(f.id));

    // Validar que todas las facturas seleccionadas sean del mismo día
    const todasMismaFecha = facturasParaEnvioMultiple.length >= 2 &&
        facturasParaEnvioMultiple.every(f => f.fecha === facturasParaEnvioMultiple[0].fecha);

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
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                            {modoConsulta ? 'Facturas Existentes' : 'Facturas Generadas'}
                        </h2>
                    </div>
                    {!modoConsulta && (
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
                    )}
                    {modoConsulta && idsEnvioMultiple.length >= 2 && (
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-xs sm:text-sm text-gray-600">
                                    {idsEnvioMultiple.length} seleccionadas
                                </span>
                                {todasMismaFecha ? (
                                    <button
                                        onClick={handleEnviarSeleccionadas}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1"
                                    >
                                        📧 Enviar {idsEnvioMultiple.length} seleccionadas
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="bg-gray-300 text-gray-500 px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium cursor-not-allowed flex items-center gap-1"
                                        title="Solo se pueden enviar juntas facturas del mismo día"
                                    >
                                        📧 Enviar seleccionadas
                                    </button>
                                )}
                            </div>
                            {!todasMismaFecha && (
                                <p className="text-xs text-amber-600">
                                    ⚠️ Solo se pueden enviar juntas facturas del mismo día
                                </p>
                            )}
                        </div>
                    )}
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
                                    {!modoConsulta ? (
                                        <input
                                            type="checkbox"
                                            checked={factura.seleccionada}
                                            onChange={() => handleFacturaSelect(factura.id)}
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 rounded focus:ring-orange-500"
                                        />
                                    ) : (
                                        <input
                                            type="checkbox"
                                            checked={idsEnvioMultiple.includes(factura.id)}
                                            onChange={() => handleToggleEnvioMultiple(factura.id)}
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 rounded focus:ring-green-500"
                                            title="Seleccionar para envío múltiple"
                                        />
                                    )}

                                    <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
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
                                        <div className="flex items-center justify-end lg:justify-start gap-2">
                                            <button
                                                onClick={() => handleVerFactura(factura.id)}
                                                disabled={generandoPDF}
                                                className={`flex items-center gap-1 font-medium text-xs sm:text-sm transition-all hover:scale-105 ${generandoPDF
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
                                        <div className="flex items-center justify-end gap-2">
                                            {modoConsulta ? (
                                                <>
                                                    <button
                                                        onClick={() => onVerDocumentos && onVerDocumentos(factura)}
                                                        className="flex items-center gap-1 font-medium text-xs sm:text-sm text-green-600 hover:text-green-800 transition-all hover:scale-105"
                                                    >
                                                        📄 Documentos
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFacturaParaEnviar(factura);
                                                            setMostrarModalCorreo(true);
                                                        }}
                                                        className="flex items-center gap-1 font-medium text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-all hover:scale-105"
                                                    >
                                                        📧 Enviar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleEliminarFactura(factura)}
                                                    disabled={eliminandoFactura === factura.id}
                                                    className={`flex items-center gap-1 font-medium text-xs sm:text-sm transition-all hover:scale-105 ${eliminandoFactura === factura.id
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-red-600 hover:text-red-800'
                                                        }`}
                                                >
                                                    {eliminandoFactura === factura.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                                            Eliminando...
                                                        </>
                                                    ) : (
                                                        '🗑️ Eliminar'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL PARA VISUALIZAR PDF */}
            {mostrarModalPDF && urlPDF && (
                <ModalVisorPreliminar
                    url={urlPDF}
                    onClose={handleCloseModal}
                />
            )}

            {/* MODAL PARA ENVIAR CORREO INDIVIDUAL */}
            {mostrarModalCorreo && facturaParaEnviar && (
                <EnviarCorreoFacturaModal
                    factura={facturaParaEnviar}
                    isOpen={mostrarModalCorreo}
                    onClose={() => {
                        setMostrarModalCorreo(false);
                        setFacturaParaEnviar(null);
                    }}
                    onEnvioExitoso={(resultado) => {
                        console.log('Correo enviado exitosamente:', resultado);
                    }}
                />
            )}

            {/* MODAL PARA ENVIAR CORREO MÚLTIPLE */}
            {mostrarModalCorreoMultiple && facturasParaEnvioMultiple.length >= 2 && todasMismaFecha && (
                <EnviarCorreoMultipleFacturasModal
                    facturas={facturasParaEnvioMultiple}
                    isOpen={mostrarModalCorreoMultiple}
                    onClose={() => {
                        setMostrarModalCorreoMultiple(false);
                        setIdsEnvioMultiple([]);
                    }}
                    onEnvioExitoso={(resultado) => {
                        console.log('Correo múltiple enviado:', resultado);
                        setIdsEnvioMultiple([]);
                    }}
                />
            )}
        </>
    );
};

export default ListaFacturasGeneradas;