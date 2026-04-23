// src/components/dashboard/ChartEstibasDiarias.jsx
import React from 'react';
import { formatearFechaLocal } from '../../services/dashboard/dashboardService';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
    Cell
} from 'recharts';

/**
 * Componente de gráfico de barras simple para estibas pagas diarias
 * Muestra cantidad de estibas pagas por día con valor monetario
 */
const ChartEstibasDiarias = ({ data, color = '#10B981', valorEstiba = 80500 }) => {
    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
                <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <p className="text-gray-500 text-center">No hay datos de estibas pagas para mostrar</p>
                <p className="text-gray-400 text-sm mt-1">Las estibas se pagan cuando un pedido tiene 20+ cajas</p>
            </div>
        );
    }

    // Preparar datos para el gráfico - VERSIÓN SIMPLIFICADA
    const datosGrafico = data.map(item => ({
        fecha: item.fecha || '',
        fechaCorta: item.fechaCorta || '',
        estibasPagas: item.estibasPagas || 0,
        valorEstibasPagas: item.valorEstibasPagas || 0,
        valorEstibasFormateado: item.valorEstibasFormateado || '0'
    }));

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload }) => {
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

                    {/* Estibas pagas */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: color }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Estibas Pagas:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.estibasPagas} estibas
                            </span>
                        </div>

                        {/* Valor estibas pagas */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: '#34D399' }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Valor Estibas:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.valorEstibasFormateado}
                            </span>
                        </div>

                        {/* Información sobre cálculo */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-600">
                                <span className="font-medium">Cálculo:</span> {data.estibasPagas} estibas × ${valorEstiba.toLocaleString('es-CO')} = {data.valorEstibasFormateado}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Se paga 1 estiba por cada pedido con 20+ cajas
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Formateador personalizado para el eje Y (cantidad de estibas)
    const formatearEjeY = (value) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`;
        }
        return value;
    };

    // Calcular promedio de estibas
    const promedioEstibas = datosGrafico.reduce((sum, item) => sum + item.estibasPagas, 0) / datosGrafico.length;

    // Encontrar valor máximo para ajustar dominio del eje Y
    const maxEstibas = Math.max(...datosGrafico.map(d => d.estibasPagas));

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={datosGrafico}
                        margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                        barSize={25}
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

                        {/* Eje Y - Cantidad de estibas */}
                        <YAxis
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={formatearEjeY}
                            domain={[0, maxEstibas * 1.2]}
                            width={60}
                        />

                        {/* Línea de referencia para promedio */}
                        <ReferenceLine
                            y={promedioEstibas}
                            stroke={color}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={{
                                value: `Prom: ${Math.round(promedioEstibas)}`,
                                position: 'right',
                                fill: color,
                                fontSize: 10
                            }}
                        />

                        {/* Tooltip personalizado */}
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'transparent' }}
                        />

                        {/* Leyenda - simplificada */}
                        <Legend
                            verticalAlign="top"
                            height={30}
                            iconSize={10}
                            wrapperStyle={{ fontSize: '11px', paddingBottom: '5px' }}
                        />

                        {/* Barras de estibas pagas */}
                        <Bar
                            dataKey="estibasPagas"
                            name="Estibas Pagas Diarias"
                            fill={color}
                            radius={[4, 4, 0, 0]}
                        >
                            {datosGrafico.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.estibasPagas >= 15 ? '#065F46' :
                                            entry.estibasPagas >= 5 ? '#10B981' :
                                                '#A7F3D0'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Información adicional debajo del gráfico */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Rango de fechas y valor unitario */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                    <div className="font-medium">{datosGrafico.length} días analizados</div>
                    <div className="text-gray-500">
                        Valor por estiba: ${valorEstiba.toLocaleString('es-CO')}
                    </div>
                </div>

                {/* Resumen estadístico */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded text-center">
                        <div className="text-gray-500 text-xs mb-0.5">Prom/día</div>
                        <div className="font-bold text-sm" style={{ color: color }}>
                            {Math.round(promedioEstibas).toLocaleString('es-CO')}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">est.</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded text-center">
                        <div className="text-gray-500 text-xs mb-0.5">Total</div>
                        <div className="font-bold text-sm" style={{ color: color }}>
                            {datosGrafico.reduce((sum, item) => sum + item.estibasPagas, 0).toLocaleString('es-CO')}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">est.</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded text-center">
                        <div className="text-gray-500 text-xs mb-0.5">Valor</div>
                        <div className="font-bold text-sm" style={{ color: color }}>
                            ${(datosGrafico.reduce((sum, item) => sum + item.valorEstibasPagas, 0) / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">total</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ChartEstibasDiarias;