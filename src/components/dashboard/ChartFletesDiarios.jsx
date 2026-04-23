// src/components/dashboard/ChartFletesDiarios.jsx
import React from 'react';
import { formatearFechaLocal } from '../../services/dashboard/dashboardService';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const ChartFletesDiarios = ({ data, color = '#8B5CF6' }) => {
    const sinDatos = (
        <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 text-center">Sin fletes registrados en este perÃ­odo</p>
            <p className="text-gray-400 text-sm mt-1">Los datos aparecerÃ¡n cuando se registren costos de transporte</p>
        </div>
    );

    if (!data || data.length === 0) return sinDatos;

    // Incluir TODOS los dÃ­as (con 0 en dÃ­as sin dato â†’ la lÃ­nea baja al eje X formando un valle)
    const datosGrafico = data.map(item => ({
        fecha: item.fecha || '',
        fechaCorta: item.fechaCorta || '',
        costoTransporte: item.costoTransporte > 0 ? item.costoTransporte : 0,
        costoFormateado: item.costoFormateado || '0',
        cantidadCamiones: item.cantidadCamiones || 0,
        observaciones: item.observaciones || '',
        sinDato: !item.costoTransporte || item.costoTransporte === 0,
    }));

    const hayDatos = datosGrafico.some(i => i.costoTransporte > 0);
    if (!hayDatos) return sinDatos;

    // EstadÃ­sticas solo sobre dÃ­as con datos reales
    const diasConDato = datosGrafico.filter(i => i.costoTransporte > 0);
    const totalCosto = diasConDato.reduce((s, i) => s + i.costoTransporte, 0);
    const promedio = totalCosto / diasConDato.length;
    const maxCosto = Math.max(...diasConDato.map(i => i.costoTransporte));

    const formatearEjeY = (v) => {
        if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
        return `$${v}`;
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;

        if (d.sinDato) {
            return (
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-[180px]">
                    <p className="font-semibold text-gray-800 text-sm mb-1">{formatearFechaLocal(d.fecha)}</p>
                    <p className="text-gray-400 text-xs italic">Sin flete registrado</p>
                </div>
            );
        }

        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4 max-w-[220px]">
                <p className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100">
                    {formatearFechaLocal(d.fecha)}
                </p>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                            Flete:
                        </span>
                        <span className="font-bold text-gray-800">${d.costoFormateado}</span>
                    </div>
                    {d.cantidadCamiones > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full inline-block bg-indigo-400" />
                                Camiones:
                            </span>
                            <span className="font-bold text-gray-800">{d.cantidadCamiones}</span>
                        </div>
                    )}
                    {d.observaciones && (
                        <p className="text-xs text-gray-500 pt-1 border-t border-gray-100 italic">
                            {d.observaciones}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={datosGrafico}
                        margin={{ top: 10, right: 8, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="gradFlete" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.75} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />

                        <XAxis
                            dataKey="fechaCorta"
                            tick={{ fontSize: 10 }}
                            tickMargin={6}
                            axisLine={false}
                            tickLine={false}
                        />

                        <YAxis
                            tickFormatter={formatearEjeY}
                            tick={{ fontSize: 10 }}
                            width={52}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, (dataMax) => Math.ceil(dataMax * 1.2)]}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }} />

                        {/*
                          type="monotone": interpolaciÃ³n Hermite cÃºbica.
                          Los dÃ­as con valor 0 forman valles suavizados hacia el eje X,
                          sin Ã¡ngulos bruscos y sin que la curva cruce el cero.
                        */}
                        <Area
                            type="monotone"
                            dataKey="costoTransporte"
                            name="Flete diario"
                            stroke={color}
                            strokeWidth={2.5}
                            fill="url(#gradFlete)"
                            dot={false}
                            activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                        Costo flete diario
                    </span>
                    <span className="text-gray-400">{diasConDato.length} dÃ­as con datos</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-gray-400 mb-0.5">Promedio</div>
                        <div className="font-bold" style={{ color }}>{formatearEjeY(Math.round(promedio))}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-gray-400 mb-0.5">MÃ¡ximo</div>
                        <div className="font-bold text-gray-700">{formatearEjeY(maxCosto)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className="text-gray-400 mb-0.5">Total</div>
                        <div className="font-bold text-gray-700">{formatearEjeY(totalCosto)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartFletesDiarios;
