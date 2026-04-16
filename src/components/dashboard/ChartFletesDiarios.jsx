// src/components/dashboard/ChartFletesDiarios.jsx
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';

/**
 * Componente de gráfico de línea simple para tendencia de fletes diarios
 * Muestra solo el costo diario de transporte con promedio móvil opcional
 */
const ChartFletesDiarios = ({ data, color = '#8B5CF6' }) => {
    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
                <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <p className="text-gray-500 text-center">No hay datos de fletes para mostrar</p>
                <p className="text-gray-400 text-sm mt-1">Los datos aparecerán cuando se registren costos de transporte</p>
            </div>
        );
    }

    // Preparar datos para el gráfico - VERSIÓN SIMPLIFICADA
    const datosGrafico = data.map(item => ({
        fecha: item.fecha || '',
        fechaCorta: item.fechaCorta || '',
        costoTransporte: item.costoTransporte || 0,
        costoFormateado: item.costoFormateado || '0',
        cantidadCamiones: item.cantidadCamiones || 0,
        observaciones: item.observaciones || '',
        sinDatos: item.sinDatos || false
    }));

    // Calcular promedio general simple
    const totalCosto = datosGrafico.reduce((sum, item) => sum + item.costoTransporte, 0);
    const promedioGeneral = datosGrafico.length > 0 ? totalCosto / datosGrafico.length : 0;

    // Tooltip personalizado simple
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                    {/* Fecha */}
                    <div className="mb-3 pb-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-800 text-sm">
                            {new Date(data.fecha).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Costo de transporte */}
                    <div className="space-y-2">
                        {data.sinDatos ? (
                            <div className="text-center py-4">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 font-medium">Sin actividad de fletes</p>
                                <p className="text-gray-400 text-xs mt-1">No se registraron costos de transporte este día</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: color }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">Costo Flete:</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">
                                        ${data.costoFormateado}
                                    </span>
                                </div>

                                {/* Camiones */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: '#6366F1' }}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">Camiones:</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800">
                                        {data.cantidadCamiones}
                                    </span>
                                </div>



                                {/* Observaciones (si existen) */}
                                {data.observaciones && (
                                    <div className="mt-3 pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-600">
                                            <span className="font-medium">Observaciones:</span> {data.observaciones}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Formateador personalizado para el eje Y (valores monetarios)
    const formatearEjeY = (value) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };



    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={datosGrafico}
                        margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                    >
                        {/* Grid de fondo */}
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E5E7EB"
                            vertical={false}
                        />

                        {/* Eje X - Fechas */}
                        <XAxis
                            dataKey="fechaCorta"
                            stroke="#6B7280"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickMargin={8}
                            interval="preserveStartEnd"
                            minTickGap={20}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />

                        {/* Eje Y - Valores monetarios */}
                        <YAxis
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={formatearEjeY}
                            width={60}
                        />

                        {/* Tooltip personalizado */}
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />

                        {/* Leyenda - simplificada */}
                        <Legend
                            verticalAlign="top"
                            height={30}
                            iconSize={10}
                            wrapperStyle={{ fontSize: '11px', paddingBottom: '5px' }}
                        />

                        {/* Línea principal: Costo de transporte */}
                        <Line
                            type="monotone"
                            dataKey="costoTransporte"
                            name="Costo Flete Diario"
                            stroke={color}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Información adicional debajo del gráfico */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Rango de fechas y leyenda */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                        <div
                            className="w-2.5 h-2.5 rounded-full mr-1.5"
                            style={{ backgroundColor: color }}
                        ></div>
                        <span className="font-medium">Costo flete diario</span>
                    </div>
                    <div className="text-gray-500">
                        {datosGrafico.length} días · {new Date(datosGrafico[0]?.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {new Date(datosGrafico[datosGrafico.length - 1]?.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                </div>

                {/* Resumen estadístico */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded text-center">
                        <div className="text-gray-500 text-xs mb-1">Promedio diario</div>
                        <div className="font-bold text-sm" style={{ color: color }}>
                            ${Math.round(promedioGeneral).toLocaleString('es-CO')}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded text-center">
                        <div className="text-gray-500 text-xs mb-1">Total período</div>
                        <div className="font-bold text-sm" style={{ color: color }}>
                            ${datosGrafico.reduce((sum, item) => sum + item.costoTransporte, 0).toLocaleString('es-CO')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartFletesDiarios;