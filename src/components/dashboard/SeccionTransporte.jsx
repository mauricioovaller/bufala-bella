// src/components/dashboard/SeccionTransporte.jsx
import React, { useState, useEffect } from 'react';
import { fetchCostosTransporte, TRANSPORTE_CONFIG, TRANSPORTE_DIMENSIONS } from '../../services/dashboard/dashboardService';
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
const SeccionTransporte = ({ fechaInicio, fechaFin, pesoNetoTotal = 0 }) => {
    // Estados para datos y carga
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recargando, setRecargando] = useState(false);

    // Cargar datos al montar el componente o cambiar fechas
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchCostosTransporte('dibufala', fechaInicio, fechaFin);
                setDatos(data);
            } catch (err) {
                console.error('Error cargando datos de transporte:', err);
                setError(err.message);

                // Mostrar alerta de error
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
    }, [fechaInicio, fechaFin]);

    // Función para recargar datos
    const handleRecargar = async () => {
        setRecargando(true);
        try {
            const data = await fetchCostosTransporte('dibufala', fechaInicio, fechaFin);
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

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Botón de ayuda */}
                    <div className="hidden sm:block">
                        <AyudaTransporte valorEstiba={datos?.configuracion?.valorEstiba || 80500} />
                    </div>

                    {/* Botón de actualización */}
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
                RESUMEN INFORMATIVO
            ===================================== */}
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

            {/* =====================================
                SECCIÓN KPIs: Métricas principales
            ===================================== */}
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

            {/* =====================================
                SECCIÓN GRÁFICOS: Desktop (≥1280px)
            ===================================== */}
            <div className="hidden xl:block">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2" style={{ color: TRANSPORTE_CONFIG.colorPrincipal }}>📈</span>
                    Análisis Gráfico
                </h3>

                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* Gráfico 1: Tendencia de fletes diarios */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">
                                Fletes Diarios
                            </h4>
                            <span className="text-xs text-gray-500">
                                {datos.graficos.fletes.length} días
                            </span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                            <ChartFletesDiarios
                                data={datos.graficos.fletes}
                                color={TRANSPORTE_CONFIG.colorPrincipal}
                            />
                        </div>
                    </div>

                    {/* Gráfico 2: Estibas pagas diarias */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">
                                Estibas Pagas Diarias
                            </h4>
                            <span className="text-xs text-gray-500">
                                Valor unitario: {datos.configuracion.valorEstibaFormateado}
                            </span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                            <ChartEstibasDiarias
                                data={datos.graficos.estibas}
                                color="#10B981"
                                valorEstiba={datos.configuracion.valorEstiba}
                            />
                        </div>
                    </div>

                    {/* Gráfico 3: Comparación acumulada */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">
                                Comparación Fletes vs Estibas
                            </h4>
                            <span className="text-xs text-gray-500">
                                Análisis diario
                            </span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                            <ChartComparacionAcumulada
                                data={datos.graficos.comparacion}
                                colorFletes={TRANSPORTE_CONFIG.colorPrincipal}
                                colorEstibas="#10B981"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================
                SECCIÓN GRÁFICOS: Móvil/Tablet (<1280px)
            ===================================== */}
            <div className="block xl:hidden">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2" style={{ color: TRANSPORTE_CONFIG.colorPrincipal }}>📈</span>
                    Análisis Gráfico
                </h3>

                <div className="space-y-6">
                    {/* Gráfico 1: Tendencia de fletes diarios (móvil) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">
                                Fletes Diarios
                            </h4>
                            <span className="text-xs text-gray-500">
                                {datos.graficos.fletes.length} días
                            </span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT_MOBILE}>
                            <ChartFletesDiarios
                                data={datos.graficos.fletes}
                                color={TRANSPORTE_CONFIG.colorPrincipal}
                            />
                        </div>
                    </div>

                    {/* Gráfico 2: Estibas pagas diarias (móvil) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">
                                Estibas Pagas Diarias
                            </h4>
                            <span className="text-xs text-gray-500">
                                Valor unitario: {datos.configuracion.valorEstibaFormateado}
                            </span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT_MOBILE}>
                            <ChartEstibasDiarias
                                data={datos.graficos.estibas}
                                color="#10B981"
                                valorEstiba={datos.configuracion.valorEstiba}
                            />
                        </div>
                    </div>

                    {/* Gráfico 3: Comparación acumulada (móvil) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-semibold text-gray-800">
                                Comparación Fletes vs Estibas
                            </h4>
                            <span className="text-xs text-gray-500">
                                Análisis diario
                            </span>
                        </div>
                        <div className={TRANSPORTE_DIMENSIONS.CHART_CONTAINER_HEIGHT_MOBILE}>
                            <ChartComparacionAcumulada
                                data={datos.graficos.comparacion}
                                colorFletes={TRANSPORTE_CONFIG.colorPrincipal}
                                colorEstibas="#10B981"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================
                PIE DE PÁGINA: Información adicional
            ===================================== */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500">
                    <div>
                        <p className="mb-1">
                            <span className="font-medium">📝 Notas:</span> Los datos se obtienen del módulo de Consolidación.
                        </p>
                        <p>
                            <span className="font-medium">📦 Estibas:</span> Se pagan cuando un pedido tiene 20+ cajas ({datos.configuracion.valorEstibaFormateado} c/u).
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Los días sin actividad aparecen con valor 0 para mostrar períodos sin operaciones.
                        </p>
                    </div>
                    <div className="mt-3 md:mt-0 text-right">
                        <p>🔄 Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
                        <p className="text-xs mt-1">Dashboard de Transporte v2.0 (simplificado)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeccionTransporte;