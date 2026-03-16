import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const ChartProductos = ({ data, color, tipo = 'compras', onBarClick, productoSeleccionadoId }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Sin datos
            </div>
        );
    }

    // Ordenar por valor descendente
    const datosGrafico = data.map(item => ({
        id: item.id,
        producto: item.producto,
        productoCorto: item.producto.length > (windowWidth < 768 ? 15 : 20)
            ? item.producto.substring(0, windowWidth < 768 ? 12 : 15) + '...'
            : item.producto,
        valor: Math.round(item.valor),
        kilos: item.kilos || 0,
        porcentaje: item.porcentaje || 0,
        valorFormateado: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(item.valor)
    }));

    const esMovil = windowWidth < 768;
    const esTablet = windowWidth >= 768 && windowWidth < 1024;

    const leftMargin = esMovil ? 25 : 35;

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg max-w-[250px]">
                    <p className="font-semibold text-gray-800 mb-1 text-sm break-words">{data.producto}</p>
                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-xs text-gray-600">Valor:</span>
                            <span className="font-medium text-xs" style={{ color }}>
                                {data.valorFormateado}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">%:</span>
                            <span className="font-medium text-xs">{data.porcentaje}%</span>
                        </div>
                        {data.kilos > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Kg:</span>
                                <span className="font-medium text-xs">
                                    {data.kilos.toLocaleString('es-CO')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Formatear eje X (valores grandes)
    const formatearEjeX = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return `${value}`;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={datosGrafico}
                layout="vertical"
                margin={{
                    top: 5,
                    right: esMovil ? 5 : 10,
                    left: leftMargin,
                    bottom: 5
                }}
                barSize={24}
            >
                <CartesianGrid
                    strokeDasharray="2 2"
                    stroke="#f0f0f0"
                    horizontal={true}
                    vertical={false}
                    strokeWidth={0.5}
                />

                <XAxis
                    type="number"
                    tickFormatter={formatearEjeX}
                    tick={{ fontSize: esMovil ? 9 : 11, fill: '#4B5563' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 'dataMax']}
                />

                <YAxis
                    type="category"
                    dataKey="productoCorto"
                    tick={{ fontSize: esMovil ? 10 : 10, fill: '#4B5563' }}
                    width={leftMargin}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={esMovil ? 4 : 8}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />

                <Bar 
                    dataKey="valor" 
                    name="Valor" 
                    radius={[0, 4, 4, 0]}
                    onClick={(data) => {
                        if (onBarClick) {
                            onBarClick(data.payload);
                        }
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {datosGrafico.map((entry, index) => {
                        const isSelected = productoSeleccionadoId && entry.id === productoSeleccionadoId;
                        const opacity = productoSeleccionadoId ? (isSelected ? 1 : 0.3) : 1;
                        return (
                            <Cell
                                key={`cell-${index}`}
                                fill={color}
                                fillOpacity={opacity}
                            />
                        );
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ChartProductos;