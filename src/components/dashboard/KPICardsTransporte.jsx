// src/components/dashboard/KPICardsTransporte.jsx
import React from 'react';

/**
 * Componente de KPIs para la sección de transporte
 * Muestra métricas clave de costos de transporte y estibas pagas
 */
const KPICardsTransporte = ({ kpis, colorPrincipal = '#8B5CF6' }) => {




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
        costoPromedioDiario: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
        costoTotal: colorPrincipal, // Violeta principal
        estibasPagas: '#10B981',    // Verde
        costoPromedioDiario: '#3B82F6', // Azul
        camionesTotales: '#6366F1'  // Índigo
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
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            kpi.interpretacion === 'Excelente' ? 'bg-green-100 text-green-800' :
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
    const ordenKPIs = ['costoTotal', 'estibasPagas', 'costoPromedioDiario', 'camionesTotales'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {ordenKPIs.map(clave => {
                if (kpis[clave]) {
                    return renderTarjetaKPI(clave, kpis[clave]);
                }
                return null;
            })}
        </div>
    );
};

export default KPICardsTransporte;