// src/components/dashboard/ChartCostosVsEstibas.jsx
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
 * Componente de gráfico de barras para comparación costos vs estibas pagas
 * Muestra barras agrupadas con doble eje Y
 */
const ChartCostosVsEstibas = ({ data, colorCosto = '#8B5CF6', colorEstibas = '#10B981' }) => {
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
            </div>
        );
    }

    // Preparar datos para el gráfico
    const datosGrafico = data.map(item => ({
        fecha: item.fecha,
        fechaCorta: item.fechaCorta,
        costoTransporte: item.costoTransporte,
        costoFormateado: item.costoFormateado,
        estibasPagas: item.estibasPagas,
        valorEstibasPagas: item.valorEstibasPagas,
        valorEstibasFormateado: item.valorEstibasFormateado,
        relacionCostoEstiba: item.relacionCostoEstiba,
        relacionPorcentaje: item.relacionPorcentaje,

        // Para tooltip y colores dinámicos
        esAltaRelacion: item.relacionCostoEstiba > 0.15, // > 15% es alta
        esMediaRelacion: item.relacionCostoEstiba > 0.05 && item.relacionCostoEstiba <= 0.15,
        esBajaRelacion: item.relacionCostoEstiba <= 0.05
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
                            {new Date(data.fecha).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Costo de transporte */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: colorCosto }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Costo Transporte:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.costoFormateado}
                            </span>
                        </div>

                        {/* Estibas pagas (cantidad) */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: colorEstibas }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Estibas Pagas:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.estibasPagas.toLocaleString('es-CO')}
                            </span>
                        </div>

                        {/* Valor estibas pagas */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                                    style={{ backgroundColor: `${colorEstibas}20` }}
                                ></div>
                                <span className="text-sm font-medium text-gray-700">Valor Estibas:</span>
                            </div>
                            <span className="text-sm font-bold text-gray-800">
                                {data.valorEstibasFormateado}
                            </span>
                        </div>

                        {/* Relación costo/estiba */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Relación Costo/Estiba:</span>
                                <span className={`text-sm font-bold ${data.esBajaRelacion ? 'text-green-600' :
                                        data.esMediaRelacion ? 'text-yellow-600' :
                                            'text-red-600'
                                    }`}>
                                    {data.relacionPorcentaje}%
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${Math.min(data.relacionPorcentaje * 5, 100)}%`,
                                        backgroundColor: data.esBajaRelacion ? '#10B981' :
                                            data.esMediaRelacion ? '#F59E0B' :
                                                '#EF4444'
                                    }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {data.esBajaRelacion ? 'Excelente relación' :
                                    data.esMediaRelacion ? 'Relación aceptable' :
                                        'Relación por mejorar'}
                            </p>
                        </div>

                        {/* Indicadores de interpretación */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                            <div className="text-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1"></div>
                                <span className="text-xs text-gray-600">≤ 5%</span>
                            </div>
                            <div className="text-center">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-1"></div>
                                <span className="text-xs text-gray-600">5-15%</span>
                            </div>
                            <div className="text-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1"></div>
                                <span className="text-xs text-gray-600">> 15%</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Formateador personalizado para el eje Y izquierdo (valores monetarios)
    const formatearEjeYIzquierdo = (value) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };

    // Formateador personalizado para el eje Y derecho (cantidad de estibas)
    const formatearEjeYDerecho = (value) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`;
        }
        return value;
    };

    // Calcular promedios para líneas de referencia
    const promedioCosto = datosGrafico.reduce((sum, item) => sum + item.costoTransporte, 0) / datosGrafico.length;
    const promedioEstibas = datosGrafico.reduce((sum, item) => sum + item.estibasPagas, 0) / datosGrafico.length;

    // Encontrar valores máximos para ajustar dominios
    const maxCosto = Math.max(...datosGrafico.map(d => d.costoTransporte));
    const maxEstibas = Math.max(...datosGrafico.map(d => d.estibasPagas));
    const maxValorEstibas = Math.max(...datosGrafico.map(d => d.valorEstibasPagas));

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={datosGrafico}
                        margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
                        barSize={30}
                        barGap={5}
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
                            minTickGap={30}
                        />

                        {/* Eje Y izquierdo - Costos */}
                        <YAxis
                            yAxisId="left"
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={formatearEjeYIzquierdo}
                            domain={[0, maxCosto * 1.2]}
                            width={60}
                            label={{
                                value: 'Costo (COP)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 10,
                                style: { fontSize: '11px', fill: '#6B7280' }
                            }}
                        />

                        {/* Eje Y derecho - Estibas */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={formatearEjeYDerecho}
                            domain={[0, maxEstibas * 1.2]}
                            width={50}
                            label={{
                                value: 'Estibas',
                                angle: 90,
                                position: 'insideRight',
                                offset: 10,
                                style: { fontSize: '11px', fill: '#6B7280' }
                            }}
                        />

                        {/* Tooltip personalizado */}
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'transparent' }}
                        />

                        {/* Leyenda */}
                        <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '12px', color: '#374151' }}
                        />

                        {/* Línea de referencia para promedio de costos */}
                        <ReferenceLine
                            yAxisId="left"
                            y={promedioCosto}
                            stroke={colorCosto}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={{
                                value: `Prom: $${Math.round(promedioCosto).toLocaleString('es-CO')}`,
                                position: 'right',
                                fill: colorCosto,
                                fontSize: 10
                            }}
                        />

                        {/* Línea de referencia para promedio de estibas */}
                        <ReferenceLine
                            yAxisId="right"
                            y={promedioEstibas}
                            stroke={colorEstibas}
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={{
                                value: `Prom: ${Math.round(promedioEstibas).toLocaleString('es-CO')}`,
                                position: 'left',
                                fill: colorEstibas,
                                fontSize: 10
                            }}
                        />

                        {/* Barras de costo de transporte */}
                        <Bar
                            yAxisId="left"
                            dataKey="costoTransporte"
                            name="Costo Transporte"
                            fill={colorCosto}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {datosGrafico.map((entry, index) => (
                                <Cell
                                    key={`costo-${index}`}
                                    fill={colorCosto}
                                    fillOpacity={0.8}
                                    stroke={colorCosto}
                                    strokeWidth={1}
                                />
                            ))}
                        </Bar>

                        {/* Barras de valor de estibas pagas */}
                        <Bar
                            yAxisId="left"
                            dataKey="valorEstibasPagas"
                            name="Valor Estibas Pagas"
                            fill={colorEstibas}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        >
                            {datosGrafico.map((entry, index) => (
                                <Cell
                                    key={`estibas-${index}`}
                                    fill={colorEstibas}
                                    fillOpacity={0.6}
                                    stroke={colorEstibas}
                                    strokeWidth={1}
                                />
                            ))}
                        </Bar>

                        {/* Puntos para cantidad de estibas (línea) */}
                        <Bar
                            yAxisId="right"
                            dataKey="estibasPagas"
                            name="Cantidad Estibas"
                            fill="transparent"
                            stroke={colorEstibas}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={0}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Información adicional debajo del gráfico */}
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Leyenda y indicadores */}
                <div className="flex flex-col gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center">
                            <div
                                className="w-2.5 h-2.5 rounded-full mr-1"
                                style={{ backgroundColor: colorCosto }}
                            ></div>
                            <span className="text-gray-600">Costo transporte</span>
                        </div>
                        <div className="flex items-center">
                            <div
                                className="w-2.5 h-2.5 rounded-full mr-1"
                                style={{ backgroundColor: colorEstibas }}
                            ></div>
                            <span className="text-gray-600">Valor estibas</span>
                        </div>
                        <div className="flex items-center">
                            <div
                                className="w-2.5 h-0.5 mr-1"
                                style={{ backgroundColor: colorEstibas }}
                            ></div>
                            <span className="text-gray-600">Cant. est.</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500">
                        <div className="flex items-center">
                            <div className="w-2.5 h-0.5 bg-green-500 mr-1"></div>
                            <span className="text-xs">≤5%</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2.5 h-0.5 bg-yellow-500 mr-1"></div>
                            <span className="text-xs">5-15%</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2.5 h-0.5 bg-red-500 mr-1"></div>
                            <span className="text-xs">>15%</span>
                        </div>
                    </div>
                </div>

                {/* Resumen estadístico */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded">
                        <div className="text-gray-500 text-xs">Prom costo:</div>
                        <div className="font-semibold text-sm" style={{ color: colorCosto }}>
                            ${Math.round(promedioCosto).toLocaleString('es-CO')}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded">
                        <div className="text-gray-500 text-xs">Prom est:</div>
                        <div className="font-semibold text-sm" style={{ color: colorEstibas }}>
                            {Math.round(promedioEstibas)}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded">
                        <div className="text-gray-500 text-xs">Relación:</div>
                        <div className="font-semibold text-sm">
                            {((promedioCosto / (promedioEstibas > 0 ? promedioEstibas * 80500 : 1)) * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded">
                        <div className="text-gray-500 text-xs">Dias:</div>
                        <div className="font-semibold text-sm">
                            {datosGrafico.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartCostosVsEstibas;