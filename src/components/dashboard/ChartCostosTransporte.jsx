// src/components/dashboard/ChartCostosTransporte.jsx
import React from 'react';
import { formatearFechaLocal } from '../../services/dashboard/dashboardService';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

/**
 * Componente de gráfico de línea para tendencia de costos de transporte
 * Muestra la evolución diaria de costos y camiones utilizados
 */
const ChartCostosTransporte = ({ data, color = '#8B5CF6' }) => {
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
                <p className="text-gray-500 text-center">No hay datos de costos para mostrar</p>
            </div>
        );
    }

    // Preparar datos para el gráfico
    const datosGrafico = data.map(item => ({
        fecha: item.fecha,
        fechaCorta: item.fechaCorta,
        costoTransporte: item.costoTransporte,
        costoFormateado: item.costoFormateado,
        cantidadCamiones: item.cantidadCamiones,
        costoPorCamion: item.costoPorCamion,
        costoPorCamionFormateado: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(item.costoPorCamion),
        observaciones: item.observaciones
    }));

    // Calcular promedio móvil de 7 días
    const calcularPromedioMovil = (datos, dias = 7) => {
        const resultado = [];
        for (let i = 0; i < datos.length; i++) {
            if (i < dias - 1) {
                resultado.push(null);
            } else {
                const ventana = datos.slice(i - dias + 1, i + 1);
                const suma = ventana.reduce((acc, item) => acc + item.costoTransporte, 0);
                resultado.push(suma / dias);
            }
        }
        return resultado;
    };

    const promediosMoviles = calcularPromedioMovil(datosGrafico, 7);

    // Agregar promedio móvil a los datos
    const datosConPromedio = datosGrafico.map((item, index) => ({
        ...item,
        promedioMovil: promediosMoviles[index],
        promedioMovilFormateado: promediosMoviles[index]
            ? new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(promediosMoviles[index])
            : null
    }));

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                    {/* Fecha */}
                    <div className="mb-3 pb-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-800 text-sm">
                            {formatearFechaLocal(data.fecha)}
                        </p>
                    </div>

                    {/* Costo de transporte */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: color }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Costo Transporte:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.costoFormateado}
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

                        {/* Costo por camión */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: '#3B82F6' }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Costo por camión:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.costoPorCamionFormateado}
                            </span>
                        </div>

                        {/* Promedio móvil (si existe) */}
                        {data.promedioMovil && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: '#A78BFA' }}
                                    ></div>
                                    <span className="text-sm font-medium text-gray-700">Promedio 7 días:</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">
                                    {data.promedioMovilFormateado}
                                </span>
                            </div>
                        )}

                        {/* Observaciones (si existen) */}
                        {data.observaciones && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-600">
                                    <span className="font-medium">Observaciones:</span> {data.observaciones}
                                </p>
                            </div>
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

    // Encontrar valor máximo para ajustar el dominio del eje Y
    const maxCosto = Math.max(...datosGrafico.map(d => d.costoTransporte));
    const yAxisDomain = [0, maxCosto * 1.1]; // 10% de margen superior

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={datosConPromedio}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickMargin={10}
                        interval="preserveStartEnd"
                        minTickGap={50}
                    />

                    {/* Eje Y - Valores monetarios */}
                    <YAxis
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickFormatter={formatearEjeY}
                        domain={yAxisDomain}
                        width={60}
                    />

                    {/* Tooltip personalizado */}
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />

                    {/* Leyenda */}
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', color: '#374151' }}
                    />

                    {/* Línea principal: Costo de transporte */}
                    <Line
                        type="monotone"
                        dataKey="costoTransporte"
                        name="Costo Transporte"
                        stroke={color}
                        strokeWidth={3}
                        dot={{
                            r: 4,
                            stroke: color,
                            strokeWidth: 2,
                            fill: 'white',
                            fillOpacity: 1
                        }}
                        activeDot={{
                            r: 6,
                            stroke: color,
                            strokeWidth: 2,
                            fill: 'white'
                        }}
                        connectNulls={true}
                    />

                    {/* Línea secundaria: Promedio móvil (7 días) */}
                    <Line
                        type="monotone"
                        dataKey="promedioMovil"
                        name="Promedio 7 días"
                        stroke="#A78BFA"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls={true}
                    />

                    {/* Línea para costo por camión (opcional, se puede activar/desactivar) */}
                    <Line
                        type="monotone"
                        dataKey="costoPorCamion"
                        name="Costo por camión"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="3 3"
                        connectNulls={true}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Información adicional debajo del gráfico */}
            <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: color }}
                            ></div>
                            <span>Costo diario</span>
                        </div>
                        <div className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: '#A78BFA' }}
                            ></div>
                            <span>Promedio 7 días</span>
                        </div>
                        <div className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: '#3B82F6' }}
                            ></div>
                            <span>Costo por camión</span>
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-0">
                        <span className="text-gray-400">
                            {datosGrafico.length} días · {new Date(datosGrafico[0]?.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {new Date(datosGrafico[datosGrafico.length - 1]?.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartCostosTransporte;