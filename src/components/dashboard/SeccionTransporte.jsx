// src/components/dashboard/SeccionTransporte.jsx
import React, { useState, useEffect } from 'react';
import { fetchCostosTransporte, fetchCostosAereo, TRANSPORTE_CONFIG, TRANSPORTE_DIMENSIONS } from '../../services/dashboard/dashboardService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import KPICardsTransporte from './KPICardsTransporte';
import ChartFletesDiarios from './ChartFletesDiarios';
import ChartEstibasDiarias from './ChartEstibasDiarias';
import ChartComparacionAcumulada from './ChartComparacionAcumulada';
import AyudaTransporte from './AyudaTransporte';
import Swal from 'sweetalert2';

/**
 * Sección principal de transporte en el dashboard
 * Contiene KPIs, gráficos de tendencia y comparación
 */
const SeccionTransporte = ({ fechaInicio, fechaFin, pesoNetoTotal = 0, tipoPedido = "" }) => {
    // Estados para datos y carga
    const [datos, setDatos] = useState(null);
    const [datosAereo, setDatosAereo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recargando, setRecargando] = useState(false);

    // Cargar datos al montar el componente o cambiar fechas
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            setError(null);

            try {
                const [dataTransporte, dataAereo] = await Promise.all([
                    fetchCostosTransporte('dibufala', fechaInicio, fechaFin, tipoPedido),
                    fetchCostosAereo(fechaInicio, fechaFin).catch(() => null)
                ]);
                setDatos(dataTransporte);
                setDatosAereo(dataAereo);
            } catch (err) {
                console.error('Error cargando datos de transporte:', err);
                setError(err.message);

                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar datos',
                    text: 'No se pudieron cargar los datos de costos de transporte. Por favor, intente nuevamente.',
                    confirmButtonColor: TRANSPORTE_CONFIG.colorPrincipal,
                });
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [fechaInicio, fechaFin, tipoPedido]);

    // Función para recargar datos
    const handleRecargar = async () => {
        setRecargando(true);
        try {
            const data = await fetchCostosTransporte('dibufala', fechaInicio, fechaFin, tipoPedido);
            setDatos(data);

            // Mostrar notificación de éxito
            Swal.fire({
                icon: 'success',
                title: 'Datos actualizados',
                text: 'Los datos de costos de transporte se han actualizado correctamente.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
        } catch (err) {
            console.error('Error recargando datos:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error al actualizar',
                text: 'No se pudieron actualizar los datos. Por favor, intente nuevamente.',
                confirmButtonColor: TRANSPORTE_CONFIG.colorPrincipal,
            });
        } finally {
            setRecargando(false);
        }
    };

    // Mostrar spinner mientras carga por primera vez
    if (loading && !datos) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full mr-3"
                                style={{ backgroundColor: `${TRANSPORTE_CONFIG.colorPrincipal}20`, color: TRANSPORTE_CONFIG.colorPrincipal }}
                            >
                                📦
                            </span>
                            Costos de Transporte
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Período: {fechaInicio} al {fechaFin}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
                        style={{ borderColor: TRANSPORTE_CONFIG.colorPrincipal }}></div>
                    <p className="text-gray-600">Cargando datos de transporte...</p>
                </div>
            </div>
        );
    }

    // Mostrar mensaje de error con opción de reintentar
    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full mr-3"
                                style={{ backgroundColor: `${TRANSPORTE_CONFIG.colorPrincipal}20`, color: TRANSPORTE_CONFIG.colorPrincipal }}
                            >
                                📦
                            </span>
                            Costos de Transporte
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Período: {fechaInicio} al {fechaFin}
                        </p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-red-800 text-xl font-semibold mb-2">Error al cargar datos</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={handleRecargar}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                        disabled={recargando}
                    >
                        {recargando ? 'Recargando...' : 'Reintentar'}
                    </button>
                </div>
            </div>
        );
    }

    // Si no hay datos después de cargar
    if (!datos || !datos.success || datos.resumen.diasConDatos === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full mr-3"
                                style={{ backgroundColor: `${TRANSPORTE_CONFIG.colorPrincipal}20`, color: TRANSPORTE_CONFIG.colorPrincipal }}
                            >
                                📦
                            </span>
                            Costos de Transporte
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Período: {fechaInicio} al {fechaFin}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón de ayuda (móvil) */}
                        <div className="sm:hidden">
                            <AyudaTransporte valorEstiba={80500} />
                        </div>

                        <button
                            onClick={handleRecargar}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: TRANSPORTE_CONFIG.colorPrincipal,
                                color: 'white'
                            }}
                            disabled={recargando}
                        >
                            <svg className={`w-4 h-4 ${recargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {recargando ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <div className="text-blue-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-blue-800 text-xl font-semibold mb-2">Sin datos de transporte</h3>
                    <p className="text-blue-600 mb-4">
                        {datos?.mensaje || 'No se encontraron datos de costos de transporte para el período seleccionado.'}
                    </p>
                    <p className="text-gray-500 text-sm">
                        Los datos aparecerán cuando se registren costos de transporte en el módulo de Consolidación.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
            {/* =====================================
                HEADER: Título y botón de actualización
            ===================================== */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="mb-3 lg:mb-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full mr-3"
                            style={{ backgroundColor: `${TRANSPORTE_CONFIG.colorPrincipal}20`, color: TRANSPORTE_CONFIG.colorPrincipal }}
                        >
                            📦
                        </span>
                        Costos de Transporte
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">
                            Período: {fechaInicio} al {fechaFin}
                        </p>
                        {datos.resumen.diasConDatos > 0 && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                                style={{
                                    backgroundColor: `${TRANSPORTE_CONFIG.colorPrincipal}10`,
                                    color: TRANSPORTE_CONFIG.colorPrincipal
                                }}>
                                {datos.resumen.diasConDatos} días con datos
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="hidden sm:block">
                        <AyudaTransporte valorEstiba={datos?.configuracion?.valorEstiba || 80500} />
                    </div>
                    <button
                        onClick={handleRecargar}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:shadow-md"
                        style={{
                            backgroundColor: TRANSPORTE_CONFIG.colorPrincipal,
                            color: 'white'
                        }}
                        disabled={recargando}
                        title="Actualizar datos de transporte"
                    >
                        <svg className={`w-4 h-4 ${recargando ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {recargando ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* =====================================
                SECCIÓN 1: Costo Aéreo (aparece primero)
            ===================================== */}
            {datosAereo && datosAereo.costos && datosAereo.costos.length > 0 && (() => {
                const totalCostoUSD = datosAereo.costos.reduce((s, c) => s + parseFloat(c.ValorFleteUSD || 0), 0);
                const totalCostoCOP = datosAereo.costos.reduce((s, c) => s + Math.round(c.CostoCOP), 0);
                const costoUSDporKg = pesoNetoTotal > 0 ? totalCostoUSD / pesoNetoTotal : 0;
                const costoCOPporKg = pesoNetoTotal > 0 ? Math.round(totalCostoCOP / pesoNetoTotal) : 0;

                const fmtUSD = (v) => v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const fmtCOP = (v) => '$' + Math.round(v).toLocaleString('es-CO');

                return (
                    <div className="mb-8 bg-gradient-to-br from-sky-50 to-white border border-sky-200 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-1 h-8 bg-sky-500 rounded-full mr-3"></div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Costos de Transporte Aéreo
                            </h3>
                            <span className="ml-3 text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                                {datosAereo.total} registros
                            </span>
                        </div>

                        {/* Tarjetas KPI estilo Métricas Clave: USD primero y destacado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Tarjeta 1: Costo Total Aéreo - USD destacado */}
                            <div className="bg-gradient-to-br from-white to-sky-50 border border-sky-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#0EA5E920' }}>
                                        <svg className="w-6 h-6" style={{ color: '#0EA5E9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700">AÉREO</span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Costo Total Aéreo</h3>
                                <p className="text-2xl md:text-3xl font-bold text-emerald-600 mb-1">
                                    USD ${fmtUSD(totalCostoUSD)}
                                </p>
                                <p className="text-sm font-medium text-gray-500">
                                    {fmtCOP(totalCostoCOP)} COP
                                </p>
                                <div className="mt-4 pt-3 border-t border-sky-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 mr-2">
                                            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                                <div className="h-full rounded-full bg-sky-500" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{datosAereo.total} guías</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta 2: Costo Aéreo / Kg - USD destacado */}
                            <div className="bg-gradient-to-br from-white to-sky-50 border border-sky-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: '#0284C720' }}>
                                        <svg className="w-6 h-6" style={{ color: '#0284C7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700">AÉREO</span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">Costo Aéreo / Kg</h3>
                                {pesoNetoTotal > 0 ? (
                                    <>
                                        <p className="text-2xl md:text-3xl font-bold text-emerald-600 mb-1">
                                            USD ${fmtUSD(costoUSDporKg)}
                                        </p>
                                        <p className="text-sm font-medium text-gray-500">
                                            {fmtCOP(costoCOPporKg)} COP / kg
                                        </p>
                                        <div className="mt-4 pt-3 border-t border-sky-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 mr-2">
                                                    <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ backgroundColor: '#0284C7', width: '100%' }}></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">{Math.round(pesoNetoTotal).toLocaleString('es-CO')} kg despachados</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Sin datos de peso neto</p>
                                )}
                            </div>
                        </div>

                        {/* Gráfico de barras: USD destacado en tooltip */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">
                                Costo Aéreo Diario
                            </h4>
                            {(() => {
                                const datosGrafico = Object.values(
                                    datosAereo.costos.reduce((acc, c) => {
                                        if (!acc[c.Fecha]) acc[c.Fecha] = { fecha: c.Fecha, costoCOP: 0, costoUSD: 0 };
                                        acc[c.Fecha].costoCOP += Math.round(c.CostoCOP);
                                        acc[c.Fecha].costoUSD += parseFloat(c.ValorFleteUSD || 0);
                                        return acc;
                                    }, {})
                                ).sort((a, b) => a.fecha.localeCompare(b.fecha));

                                return (
                                    <div className="h-[200px] md:h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={datosGrafico}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                                                <Tooltip
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            const d = payload[0].payload;
                                                            return (
                                                                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                                                                    <p className="font-medium text-gray-700 mb-1">Fecha: {label}</p>
                                                                    <p className="text-emerald-600 font-bold text-base">
                                                                        USD ${d.costoUSD.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </p>
                                                                    <p className="text-sky-700 font-medium">
                                                                        COP ${d.costoCOP.toLocaleString('es-CO')}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="costoCOP" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                );
            })()}

            {/* =====================================
                SECCIÓN 2: Transporte Terrestre
            ===================================== */}
            <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                    <div className="w-1 h-8 bg-violet-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        Costos de Transporte Terrestre
                    </h3>
                </div>

                {/* Resumen informativo */}
                {datos.resumen.diasConDatos > 0 && (
                    <div className="mb-6 p-4 rounded-lg"
                        style={{ backgroundColor: TRANSPORTE_CONFIG.colorFondo, border: `1px solid ${TRANSPORTE_CONFIG.colorBorde}` }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: TRANSPORTE_CONFIG.colorPrincipal }}>
                                    {datos.resumen.totalCostoTransporteFormateado}
                                </div>
                                <div className="text-sm text-gray-600">Costo total transporte</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#10B981' }}>
                                    {datos.resumen.totalEstibasPagas.toLocaleString('es-CO')}
                                </div>
                                <div className="text-sm text-gray-600">Estibas pagas totales</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold" style={{ color: '#6366F1' }}>
                                    {datos.resumen.totalCamiones.toLocaleString('es-CO')}
                                </div>
                                <div className="text-sm text-gray-600">Camiones utilizados</div>
                            </div>
                        </div>
                        <div className="mt-3 text-center text-xs text-gray-500">
                            💡 Valor por estiba: {datos.configuracion.valorEstibaFormateado} (se paga cuando un pedido tiene 20+ cajas)
                        </div>
                    </div>
                )}

            {/* KPIs: Métricas Clave */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2" style={{ color: TRANSPORTE_CONFIG.colorPrincipal }}>📊</span>
                    Métricas Clave
                </h3>
                <KPICardsTransporte
                    kpis={datos.kpis}
                    colorPrincipal={TRANSPORTE_CONFIG.colorPrincipal}
                    pesoNetoTotal={pesoNetoTotal}
                />
            </div>

            {/* Gráficos: Desktop */}
            <div className="hidden xl:block">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2" style={{ color: TRANSPORTE_CONFIG.colorPrincipal }}>📈</span>
                    Análisis Gráfico
                </h3>

                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Fletes Diarios</h4>
                            <span className="text-xs text-gray-500">{datos.graficos.fletes.length} días</span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                            <ChartFletesDiarios data={datos.graficos.fletes} color={TRANSPORTE_CONFIG.colorPrincipal} />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Estibas Pagas Diarias</h4>
                            <span className="text-xs text-gray-500">Valor unitario: {datos.configuracion.valorEstibaFormateado}</span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                            <ChartEstibasDiarias data={datos.graficos.estibas} color="#10B981" valorEstiba={datos.configuracion.valorEstiba} />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Comparación Fletes vs Estibas</h4>
                            <span className="text-xs text-gray-500">Análisis diario</span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                            <ChartComparacionAcumulada data={datos.graficos.comparacion} colorFletes={TRANSPORTE_CONFIG.colorPrincipal} colorEstibas="#10B981" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos: Móvil/Tablet */}
            <div className="block xl:hidden">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2" style={{ color: TRANSPORTE_CONFIG.colorPrincipal }}>📈</span>
                    Análisis Gráfico
                </h3>
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Fletes Diarios</h4>
                            <span className="text-xs text-gray-500">{datos.graficos.fletes.length} días</span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT_MOBILE}>
                            <ChartFletesDiarios data={datos.graficos.fletes} color={TRANSPORTE_CONFIG.colorPrincipal} />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Estibas Pagas Diarias</h4>
                            <span className="text-xs text-gray-500">Valor unitario: {datos.configuracion.valorEstibaFormateado}</span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT_MOBILE}>
                            <ChartEstibasDiarias data={datos.graficos.estibas} color="#10B981" valorEstiba={datos.configuracion.valorEstiba} />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">Comparación Fletes vs Estibas</h4>
                            <span className="text-xs text-gray-500">Análisis diario</span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT_MOBILE}>
                            <ChartComparacionAcumulada data={datos.graficos.comparacion} colorFletes={TRANSPORTE_CONFIG.colorPrincipal} colorEstibas="#10B981" />
                        </div>
                    </div>
                </div>
            </div>

            </div>{/* Fin contenedor Terrestre */}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500">
                    <div>
                        <p className="mb-1"><span className="font-medium">📝 Notas:</span> Los datos se obtienen del módulo de Consolidación.</p>
                        <p><span className="font-medium">📦 Estibas:</span> Se pagan cuando un pedido tiene 20+ cajas ({datos.configuracion.valorEstibaFormateado} c/u).</p>
                        <p className="mt-1 text-xs text-gray-400">Los días sin actividad aparecen con valor 0 para mostrar períodos sin operaciones.</p>
                    </div>
                    <div className="mt-3 md:mt-0 text-right">
                        <p>🔄 Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                        <p className="text-xs mt-1">Dashboard de Transporte v2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeccionTransporte;