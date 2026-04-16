// src/components/dashboard/ChartComparacionAcumulada.jsx
import React from 'react';
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
 * Componente de gráfico de barras agrupadas para comparación acumulada
 * Muestra fletes vs valor de estibas pagas por día
 */
const ChartComparacionAcumulada = ({ data, colorFletes = '#8B5CF6', colorEstibas = '#10B981' }) => {
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
                <p className="text-gray-500 text-center">No hay datos para comparación</p>
                <p className="text-gray-400 text-sm mt-1">Los datos aparecerán cuando se registren fletes y estibas</p>
            </div>
        );
    }

    // Preparar datos para el gráfico - VERSIÓN SIMPLIFICADA
    const datosGrafico = data.map(item => ({
        fecha: item.fecha || '',
        fechaCorta: item.fechaCorta || '',
        costoTransporte: item.costoTransporte || 0,
        costoFormateado: item.costoFormateado || '0',
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
                            {new Date(data.fecha).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Comparación */}
                    <div className="space-y-3">
                        {/* Costo de transporte */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: colorFletes }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Costo Flete:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.costoFormateado}
                            </span>
                        </div>

                        {/* Valor estibas pagas */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: colorEstibas }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Valor Estibas:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.valorEstibasFormateado}
                            </span>
                        </div>

                        {/* Diferencia */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Diferencia:</span>
                                <span className={`text-sm font-bold ${data.valorEstibasPagas - data.costoTransporte > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {data.valorEstibasPagas - data.costoTransporte > 0 ? '+' : ''}${Math.abs(data.valorEstibasPagas - data.costoTransporte).toLocaleString('es-CO')}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${Math.min(100, Math.abs(data.valorEstibasPagas - data.costoTransporte) / Math.max(data.costoTransporte, data.valorEstibasPagas) * 100 || 0)}%`,
                                        backgroundColor: data.valorEstibasPagas - data.costoTransporte > 0 ? '#10B981' : '#EF4444'
                                    }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {data.valorEstibasPagas - data.costoTransporte > 0
                                    ? 'Las estibas superan los fletes este día'
                                    : 'Los fletes superan las estibas este día'}
                            </p>
                        </div>
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

    // Calcular promedios
    const promedioFletes = datosGrafico.reduce((sum, item) => sum + item.costoTransporte, 0) / datosGrafico.length;
    const promedioEstibas = datosGrafico.reduce((sum, item) => sum + item.valorEstibasPagas, 0) / datosGrafico.length;

    // Encontrar valor máximo para ajustar dominio del eje Y
    const maxValor = Math.max(
        ...datosGrafico.map(d => d.costoTransporte),
        ...datosGrafico.map(d => d.valorEstibasPagas)
    );

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={datosGrafico}
                        margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
                        barSize={20}
                        barGap={8}
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
                            domain={[0, maxValor * 1.2]}
                            width={60}
                        />

                        {/* Línea de referencia para promedio de fletes */}
                        <ReferenceLine
                            y={promedioFletes}
                            stroke={colorFletes}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={{
                                value: `Prom flete`,
                                position: 'insideTopRight',
                                fill: colorFletes,
                                fontSize: 9,
                                offset: 5
                            }}
                        />

                        {/* Línea de referencia para promedio de estibas */}
                        <ReferenceLine
                            y={promedioEstibas}
                            stroke={colorEstibas}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={{
                                value: `Prom estibas`,
                                position: 'insideTopLeft',
                                fill: colorEstibas,
                                fontSize: 9,
                                offset: 5
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

                        {/* Barras de costo de transporte */}
                        <Bar
                            dataKey="costoTransporte"
                            name="Costo Flete"
                            fill={colorFletes}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />

                        {/* Barras de valor de estibas pagas */}
                        <Bar
                            dataKey="valorEstibasPagas"
                            name="Valor Estibas"
                            fill={colorEstibas}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Información adicional debajo del gráfico */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Rango de fechas y análisis */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                    <div className="font-medium">{datosGrafico.length} días · Comparación diaria</div>
                    <div className="text-gray-500">
                        {datosGrafico.reduce((sum, item) => sum + (item.valorEstibasPagas - item.costoTransporte), 0) > 0
                            ? '📈 Estibas superiores'
                            : '📉 Fletes superiores'}
                    </div>
                </div>

                {/* Resumen estadístico */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded">
                        <div className="text-gray-500 text-xs mb-0.5">Total fletes</div>
                        <div className="font-bold text-sm" style={{ color: colorFletes }}>
                            ${(datosGrafico.reduce((sum, item) => sum + item.costoTransporte, 0) / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded">
                        <div className="text-gray-500 text-xs mb-0.5">Total estibas</div>
                        <div className="font-bold text-sm" style={{ color: colorEstibas }}>
                            ${(datosGrafico.reduce((sum, item) => sum + item.valorEstibasPagas, 0) / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded">
                        <div className="text-gray-500 text-xs mb-0.5">Diferencia</div>
                        <div className={`font-bold text-sm ${datosGrafico.reduce((sum, item) => sum + (item.valorEstibasPagas - item.costoTransporte), 0) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            ${(Math.abs(datosGrafico.reduce((sum, item) => sum + (item.valorEstibasPagas - item.costoTransporte), 0)) / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded">
                        <div className="text-gray-500 text-xs mb-0.5">Días</div>
                        <div className="font-bold text-sm">
                            {datosGrafico.length}
                        </div>
                    </div>
                </div>

                {/* Leyenda */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center">
                        <div
                            className="w-2.5 h-2.5 rounded-full mr-1"
                            style={{ backgroundColor: colorFletes }}
                        ></div>
                        <span>Fletes</span>
                    </div>
                    <div className="flex items-center">
                        <div
                            className="w-2.5 h-2.5 rounded-full mr-1"
                            style={{ backgroundColor: colorEstibas }}
                        ></div>
                        <span>Estibas</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartComparacionAcumulada;