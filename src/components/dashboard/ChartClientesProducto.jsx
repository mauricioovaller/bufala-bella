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

const ChartClientesProducto = ({ data, productoNombre, color }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                <p>No hay clientes para este producto en el período seleccionado.</p>
            </div>
        );
    }

    // Preparar datos para el gráfico
    const datosGrafico = data.map(item => ({
        id: item.id,
        cliente: item.nombre,
        clienteCorto: item.nombre.length > (windowWidth < 768 ? 15 : 25)
            ? item.nombre.substring(0, windowWidth < 768 ? 12 : 22) + '...'
            : item.nombre,
        valor: Math.round(item.valor),
        cantidad: item.cantidad,
        pesoNeto: Math.round(item.pesoNeto),
        valorFormateado: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(item.valor)
    }));

    const esMovil = windowWidth < 768;
    const esTablet = windowWidth >= 768 && windowWidth < 1024;

    // Calcular margen izquierdo basado en la longitud del texto
    const maxLength = Math.max(...datosGrafico.map(item => item.clienteCorto.length));
    const leftMargin = esMovil
        ? Math.min(80, Math.max(30, maxLength * 2.8))
        : esTablet
            ? Math.min(100, Math.max(40, maxLength * 3.5))
            : Math.min(120, Math.max(45, maxLength * 4));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg max-w-[250px]">
                    <p className="font-semibold text-gray-800 mb-1 text-sm break-words">{data.cliente}</p>
                    <div className="space-y-0.5">
                        <div className="flex justify-between items-center gap-3">
                            <span className="text-xs text-gray-600">Valor:</span>
                            <span className="font-medium text-xs" style={{ color }}>
                                {data.valorFormateado}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Kg:</span>
                            <span className="font-medium text-xs">{data.pesoNeto}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Pedidos:</span>
                            <span className="font-medium text-xs">{data.cantidad}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const formatearEjeX = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return `${value}`;
    };

    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-base font-semibold text-gray-700 mb-3">
                {/* Clientes que compraron: {productoNombre} */}
            </h4>
            <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={datosGrafico}
                        layout="vertical"
                        margin={{ top: 5, right: esMovil ? 5 : 10, left: leftMargin, bottom: 5 }}
                        barSize={esMovil ? 12 : 16}
                    >
                        <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" horizontal={true} vertical={false} strokeWidth={0.5} />
                        <XAxis type="number" tickFormatter={formatearEjeX} tick={{ fontSize: esMovil ? 9 : 11, fill: '#4B5563' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="clienteCorto" tick={{ fontSize: esMovil ? 10 : 11, fill: '#4B5563' }} width={leftMargin} axisLine={false} tickLine={false} tickMargin={esMovil ? 4 : 8} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                            {datosGrafico.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartClientesProducto;