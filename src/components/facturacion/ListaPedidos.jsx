import React, { useState, useEffect } from "react";
import { obtenerPedidosPorFecha } from '../../services/facturacionService';

const ListaPedidos = ({
    filtros,
    pedidosSeleccionados,
    onPedidosChange,
    tipoPedido,
    fetchPedidosFn
}) => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const label = (normal, sample, chile) =>
        tipoPedido === "chile" ? chile : tipoPedido === "normal" ? normal : sample;

    useEffect(() => {
        if (pedidosSeleccionados.length === 0 && pedidos.some(p => p.seleccionado)) {
            const pedidosLimpios = pedidos.map(pedido => ({
                ...pedido,
                seleccionado: false
            }));
            setPedidos(pedidosLimpios);
        }
    }, [pedidosSeleccionados, pedidos]);

    const cargarPedidos = async () => {
        if (!filtros.fechaDesde || !filtros.fechaHasta) {
            setError("Por favor selecciona ambas fechas");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const tipoLabel = label("PEDIDOS NORMALES", "SAMPLES", "PEDIDOS CHILE");
            console.log(`📋 Cargando pedidos para: ${tipoLabel}`);

            const fnFetch = fetchPedidosFn || obtenerPedidosPorFecha;
            const resultado = await fnFetch(filtros);

            if (resultado.pedidos && resultado.pedidos.length > 0) {
                let pedidosFiltrados = resultado.pedidos;

                if (tipoPedido === "normal") {
                    pedidosFiltrados = resultado.pedidos.filter(pedido =>
                        pedido.numero.startsWith('PED-') || pedido.tipo === 'PED'
                    );
                } else if (tipoPedido === "chile") {
                    pedidosFiltrados = resultado.pedidos.filter(pedido =>
                        pedido.numero.startsWith('CHI-') || pedido.tipo === 'CHI'
                    );
                } else {
                    pedidosFiltrados = resultado.pedidos.filter(pedido =>
                        pedido.numero.startsWith('SMP-') || pedido.tipo === 'SMP'
                    );
                }

                const pedidosFormateados = pedidosFiltrados.map(pedido => {
                    const pedidoBase = {
                        id: pedido.id,
                        numero: pedido.numero,
                        cliente: pedido.cliente,
                        fecha: pedido.fecha,
                        ordenCompra: pedido.ordenCompra,
                        seleccionado: false,
                        tipo: tipoPedido,
                        cajas: pedido.cajas || 0,
                        tms: pedido.tms || 0,
                        pesoNeto: pedido.pesoNeto || 0,
                        valor: pedido.valor || 0,
                        idAgencia: pedido.idAgencia,
                        idAerolinea: pedido.idAerolinea,
                        guiaMaster: pedido.guiaMaster,
                        guiaHija: pedido.guiaHija,
                        estibas: pedido.estibas || 0
                    };

                    return pedidoBase;
                });

                console.log(`✅ ${label("Pedidos normales", "Samples", "Pedidos Chile")} formateados:`, pedidosFormateados);
                setPedidos(pedidosFormateados);
            } else {
                setPedidos([]);
                setError(`No se encontraron ${label("pedidos", "samples", "pedidos Chile")} para las fechas seleccionadas`);
            }
        } catch (err) {
            console.error(`Error cargando ${tipoPedido}:`, err);
            setError(`Error al cargar ${label("pedidos", "samples", "pedidos Chile")}: ${err.message}`);
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filtros.fechaDesde && filtros.fechaHasta) {
            cargarPedidos();
        }
    }, [filtros.fechaDesde, filtros.fechaHasta, tipoPedido]);

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
    const totalEstibas = pedidosActualesSeleccionados.reduce((sum, pedido) => sum + pedido.estibas, 0);

    const barColor = tipoPedido === "normal" ? "bg-green-500" : tipoPedido === "chile" ? "bg-amber-500" : "bg-green-600";
    const spinnerColor = tipoPedido === "normal" ? "border-green-500" : tipoPedido === "chile" ? "border-amber-500" : "border-green-600";

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                    <div className={`w-1 h-6 sm:h-8 rounded-full mr-3 ${barColor}`}></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {label("Pedidos Encontrados", "Samples Encontrados", "Pedidos Chile Encontrados")}
                    </h2>
                </div>
                <div className="text-center py-8">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${spinnerColor}`}></div>
                    <p className="text-gray-600 mt-2">
                        Cargando {label("pedidos", "samples", "pedidos Chile")}...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-4">
                    <div className={`w-1 h-6 sm:h-8 rounded-full mr-3 ${barColor}`}></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {label("Pedidos Encontrados", "Samples Encontrados", "Pedidos Chile Encontrados")}
                    </h2>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
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
                    <div className={`w-1 h-6 sm:h-8 rounded-full mr-3 ${barColor}`}></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {label("Pedidos Encontrados", "Samples Encontrados", "Pedidos Chile Encontrados")}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({label("📦 PED-", "🔬 SMP-", "🌎 CHI-")})
                        </span>
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm text-gray-600">
                        {pedidosActualesSeleccionados.length} de {pedidos.length} {label("seleccionados", "seleccionados", "seleccionados")}
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

            <div className="space-y-3">
                {pedidos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron {label("pedidos", "samples", "pedidos Chile")} para las fechas seleccionadas
                    </div>
                ) : (
                    pedidos.map((pedido) => (
                        <div
                            key={pedido.id}
                            className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                                pedido.seleccionado
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
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                            {pedido.numero}
                                            {tipoPedido === "sample" && (
                                                <span className="ml-1 text-xs text-green-600 bg-green-100 px-1 rounded">SAMPLE</span>
                                            )}
                                        </p>
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
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {label("Cajas/TM", "Estibas", "Estibas")}
                                        </p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                                            {label(
                                                `${pedido.cajas} cajas / ${pedido.tms} TM`,
                                                `${pedido.estibas} estibas`,
                                                `${pedido.estibas} estibas`
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {label("Peso Neto", "Cajas", "Cajas")}
                                        </p>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                                            {label(
                                                `${pedido.pesoNeto.toLocaleString('es-CO')} kg`,
                                                `${pedido.cajas} cajas`,
                                                `${pedido.cajas} cajas`
                                            )}
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

            {pedidosActualesSeleccionados.length > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
                    <div className={`grid gap-3 sm:gap-4 text-center ${
                        tipoPedido === "normal"
                            ? "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                            : "grid-cols-1 xs:grid-cols-2 md:grid-cols-4"
                    }`}>
                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">
                                {label("Pedidos", "Samples", "Pedidos Chile")} Seleccionados
                            </p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">
                                {pedidosActualesSeleccionados.length}
                            </p>
                        </div>

                        {tipoPedido === "normal" ? (
                            <>
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
                                    <p className="text-lg sm:text-2xl font-bold text-blue-700">
                                        {totalPesoNeto.toLocaleString('es-CO')} kg
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-xs sm:text-sm text-blue-600">Total Estibas</p>
                                    <p className="text-lg sm:text-2xl font-bold text-blue-700">
                                        {totalEstibas} unid.
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-blue-600">Total Cajas</p>
                                    <p className="text-lg sm:text-2xl font-bold text-blue-700">
                                        {totalCajas} unid.
                                    </p>
                                </div>
                            </>
                        )}

                        <div>
                            <p className="text-xs sm:text-sm text-blue-600">Valor Total</p>
                            <p className="text-lg sm:text-2xl font-bold text-blue-700">
                                ${totalValor.toLocaleString('es-CO')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaPedidos;
