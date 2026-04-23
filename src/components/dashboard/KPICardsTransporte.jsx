// src/components/dashboard/KPICardsTransporte.jsx
import React from 'react';

/**
 * Componente de KPIs para la sección de transporte
 * Muestra métricas clave de costos de transporte y estibas pagas
 */
const KPICardsTransporte = ({ kpis, colorPrincipal = '#8B5CF6', pesoNetoTotal = 0 }) => {




    // Iconos para cada KPI
    const iconos = {
        costoTotal: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        estibasPagas: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        costoPorKg: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
        ),
        camionesTotales: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    };

    // Colores para cada KPI
    const coloresKPIs = {
        costoTotal: colorPrincipal,
        estibasPagas: '#10B981',
        costoPorKg: '#F59E0B',
        camionesTotales: '#6366F1'
    };

    // Calcular indicadores por kilogramo
    const totalFlete = kpis?.costoTotal?.valor ?? 0;
    const totalEstibas = kpis?.estibasPagas?.valorMonetario ?? 0;
    const totalTransporte = totalFlete + totalEstibas;

    const fletePorKg = pesoNetoTotal > 0 ? Math.round(totalFlete / pesoNetoTotal) : 0;
    const estibasPorKg = pesoNetoTotal > 0 ? Math.round(totalEstibas / pesoNetoTotal) : 0;
    const totalPorKg = pesoNetoTotal > 0 ? Math.round(totalTransporte / pesoNetoTotal) : 0;

    const fmt = (n) => n.toLocaleString('es-CO');

    // Tarjeta especial: Costo por kilogramo (3 sub-métricas)
    const renderTarjetaCostoPorKg = () => {
        const color = coloresKPIs.costoPorKg;
        return (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                {/* Encabezado */}
                <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color }}>{iconos.costoPorKg}</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${color}10`, color }}>
                        TRANSPORTE
                    </span>
                </div>

                <h3 className="text-sm font-medium text-gray-600 mb-3">Costo por Kilogramo</h3>

                {pesoNetoTotal > 0 ? (
                    <div className="space-y-2">
                        {/* Flete / kg */}
                        <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-600">Flete / kg</span>
                            <span className="text-sm font-bold" style={{ color: colorPrincipal }}>
                                ${fmt(fletePorKg)}
                            </span>
                        </div>
                        {/* Estibas / kg */}
                        <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-600">Estibas / kg</span>
                            <span className="text-sm font-bold text-green-700">
                                ${fmt(estibasPorKg)}
                            </span>
                        </div>
                        {/* Total / kg */}
                        <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: `${color}15` }}>
                            <span className="text-xs font-semibold text-gray-700">Total / kg</span>
                            <span className="text-sm font-bold" style={{ color }}>
                                ${fmt(totalPorKg)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">Sin datos de peso neto en el período</p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full rounded-full" style={{ backgroundColor: color, width: '100%' }}></div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {fmt(Math.round(pesoNetoTotal))} kg totales
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Renderizar tarjeta individual de KPI
    const renderTarjetaKPI = (clave, kpi) => {
        if (!kpi) return null;

        return (
            <div
                key={clave}
                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
                {/* Encabezado con icono y etiqueta */}
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${coloresKPIs[clave] || colorPrincipal}20` }}
                    >
                        <div style={{ color: coloresKPIs[clave] || colorPrincipal }}>
                            {iconos[clave]}
                        </div>
                    </div>
                    <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                            backgroundColor: `${coloresKPIs[clave] || colorPrincipal}10`,
                            color: coloresKPIs[clave] || colorPrincipal
                        }}
                    >
                        TRANSPORTE
                    </span>
                </div>

                {/* Título del KPI */}
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                    {kpi.titulo}
                </h3>

                {/* Valor principal */}
                <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                    {kpi.formateado}
                </p>

                {/* Valor secundario (si existe) */}
                {kpi.valorMonetarioFormateado && (
                    <p className="text-sm font-medium text-gray-500">
                        {kpi.valorMonetarioFormateado}
                    </p>
                )}

                {/* Interpretación (para relación costo/estiba) */}
                {kpi.interpretacion && (
                    <div className="mt-2 inline-block">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.interpretacion === 'Excelente' ? 'bg-green-100 text-green-800' :
                                kpi.interpretacion === 'Buena' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                            }`}>
                            {kpi.interpretacion}
                        </span>
                    </div>
                )}

                {/* Barra de progreso y descripción */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                            <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        backgroundColor: coloresKPIs[clave] || colorPrincipal,
                                        width: '100%'
                                    }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {kpi.descripcion}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Si no hay KPIs, mostrar mensaje
    if (!kpis || Object.keys(kpis).length === 0) {
        return (
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin datos de transporte</h3>
                <p className="text-gray-500">
                    No se encontraron datos de costos de transporte para el período seleccionado.
                </p>
            </div>
        );
    }

    // Orden de visualización de los KPIs (4 KPIs)
    const ordenKPIs = ['costoTotal', 'estibasPagas', 'camionesTotales'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {ordenKPIs.map(clave => {
                if (kpis[clave]) {
                    return renderTarjetaKPI(clave, kpis[clave]);
                }
                return null;
            })}
            {/* Tarjeta de costo por kg (calculada en frontend) */}
            {renderTarjetaCostoPorKg()}
        </div>
    );
};

export default KPICardsTransporte;