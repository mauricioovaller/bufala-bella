// src/components/facturacion/ListaPedidos.jsx
import React, { useState, useEffect } from "react";
import { obtenerPedidosPorFecha } from '../../services/facturacionService';

const ListaPedidos = ({
    filtros,
    pedidosSeleccionados,
    onPedidosChange
}) => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🔴 EFECTO MEJORADO: Limpiar selección cuando pedidosSeleccionados esté vacío
    useEffect(() => {
        // Si no hay pedidos seleccionados en el padre pero localmente hay seleccionados, limpiar
        if (pedidosSeleccionados.length === 0 && pedidos.some(p => p.seleccionado)) {
            console.log('🧹 Limpiando selección automáticamente...');
            const pedidosLimpios = pedidos.map(pedido => ({
                ...pedido,
                seleccionado: false
            }));
            setPedidos(pedidosLimpios);
        }
    }, [pedidosSeleccionados, pedidos]);

    // 🔴 FUNCIÓN MEJORADA: Cargar pedidos
    const cargarPedidos = async () => {
        if (!filtros.fechaDesde || !filtros.fechaHasta) {
            setError("Por favor selecciona ambas fechas");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const resultado = await obtenerPedidosPorFecha(filtros);

            if (resultado.pedidos && resultado.pedidos.length > 0) {
                const pedidosFormateados = resultado.pedidos.map(pedido => ({
                    id: pedido.id,
                    numero: pedido.numero,
                    cliente: pedido.cliente,
                    fecha: pedido.fecha,
                    cajas: pedido.cajas,
                    tms: pedido.tms,
                    pesoNeto: pedido.pesoNeto,
                    valor: pedido.valor,
                    ordenCompra: pedido.ordenCompra,
                    idAgencia: pedido.idAgencia,
                    idAerolinea: pedido.idAerolinea,
                    guiaMaster: pedido.guiaMaster,
                    guiaHija: pedido.guiaHija,
                    seleccionado: false
                }));

                setPedidos(pedidosFormateados);
            } else {
                setPedidos([]);
                setError("No se encontraron pedidos para las fechas seleccionadas");
            }
        } catch (err) {
            setError(err.message);
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔴 EFECTO MEJORADO: Cargar pedidos cuando cambien los filtros
    useEffect(() => {
        if (filtros.fechaDesde && filtros.fechaHasta) {
            cargarPedidos();
        }
    }, [filtros.fechaDesde, filtros.fechaHasta]);

    // 🔴 FUNCIÓN MEJORADA: Manejar selección de pedido
    const handlePedidoSelect = (pedidoId) => {
        const nuevosPedidos = pedidos.map(pedido =>
            pedido.id === pedidoId
                ? { ...pedido, seleccionado: !pedido.seleccionado }
                : pedido
        );

        setPedidos(nuevosPedidos);
        const seleccionados = nuevosPedidos.filter(p => p.seleccionado);
        onPedidosChange(seleccionados);
    };

    // 🔴 FUNCIÓN MEJORADA: Seleccionar todos
    const handleSelectAll = () => {
        const allSelected = pedidos.every(pedido => pedido.seleccionado);
        const nuevosPedidos = pedidos.map(pedido => ({
            ...pedido,
            seleccionado: !allSelected
        }));

        setPedidos(nuevosPedidos);
        onPedidosChange(nuevosPedidos.filter(p => p.seleccionado));
    };

    const pedidosActualesSeleccionados = pedidos.filter(pedido => pedido.seleccionado);
    const totalValor = pedidosActualesSeleccionados.reduce((sum, pedido) => sum + pedido.valor, 0);
    const totalCajas = pedidosActualesSeleccionados.reduce((sum, pedido) => sum + pedido.cajas, 0);
    const totalTms = pedidosActualesSeleccionados.reduce((sum, pedido) => sum + pedido.tms, 0);
    const totalPesoNeto = pedidosActualesSeleccionados.reduce((sum, pedido) => sum + pedido.pesoNeto, 0);

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                    <div className="w-1 h-6 sm:h-8 bg-green-500 rounded-full mr-3"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Pedidos Encontrados</h2>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Cargando pedidos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                    <div className="w-1 h-6 sm:h-8 bg-green-500 rounded-full mr-3"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Pedidos Encontrados</h2>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">Error: {error}</p>
                    <button
                        onClick={cargarPedidos}
                        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div className="flex items-center">
                    <div className="w-1 h-6 sm:h-8 bg-green-500 rounded-full mr-3"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Pedidos Encontrados</h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-gray-600">
                        {pedidosActualesSeleccionados.length} de {pedidos.length} seleccionados
                    </span>
                    <button
                        onClick={handleSelectAll}
                        disabled={pedidos.length === 0}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {pedidos.every(pedido => pedido.seleccionado) ? 'Desel. Todos' : 'Sel. Todos'}
                    </button>
                </div>
            </div>

            {/* LISTA DE PEDIDOS */}
            <div className="space-y-3">
                {pedidos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron pedidos para las fechas seleccionadas
                    </div>
                ) : (
                    pedidos.map((pedido) => (
                        <div
                            key={pedido.id}
                            className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 ${pedido.seleccionado
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={pedido.seleccionado}
                                    onChange={() => handlePedidoSelect(pedido.id)}
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 rounded focus:ring-green-500"
                                />

                                <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4">
                                    <div className="break-words">
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{pedido.numero}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">{pedido.cliente}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Fecha</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">{pedido.fecha}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">P.O.</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">{pedido.ordenCompra}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Cajas/TM</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                                            {pedido.cajas} cajas. / {pedido.tms} TM.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Peso Neto</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                                            ${pedido.pesoNeto.toLocaleString('es-CO')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Valor</p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                                            ${pedido.valor.toLocaleString('es-CO')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* RESUMEN DE SELECCIÓN */}
            {pedidosActualesSeleccionados.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-center">
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">Pedidos Seleccionados</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">{pedidosActualesSeleccionados.length}</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">Total Cajas</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">{totalCajas} unid.</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">Total TMS</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">{totalTms} unid.</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">Total Peso Neto</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">{totalPesoNeto.toLocaleString('es-CO')} kg</p>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">Valor Total</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">${totalValor.toLocaleString('es-CO')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPedidos;