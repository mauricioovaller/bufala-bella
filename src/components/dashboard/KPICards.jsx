// src/components/dashboard/KPICards.jsx
import React from 'react';

const KPICards = ({ kpis, tipo, color }) => {
    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    };

    const getIcono = (tipo) => {
        if (tipo === 'compras') {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            );
        } else {
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
    };

    const iconoPeso = (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 7h16M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M12 11v4m-3-1h6" />
        </svg>
    );

    const iconoPromedio = (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Tarjeta 1: Total Transacciones */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color: color }}>
                            {getIcono(tipo)}
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {tipo === 'compras' ? 'COMPRAS' : 'VENTAS'}
                    </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transacciones</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {kpis.totalTransacciones.toLocaleString('es-CO')}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <div className="h-1 rounded-full mr-2" style={{ backgroundColor: color, width: '100%' }}></div>
                        <span>Período actual</span>
                    </div>
                </div>
            </div>

            {/* Tarjeta 2: Valor Total */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color: color }}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {tipo === 'compras' ? 'COMPRAS' : 'VENTAS'}
                    </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Valor Total</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {formatearMoneda(kpis.valorTotal)}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <div className="h-1 rounded-full mr-2" style={{ backgroundColor: color, width: '100%' }}></div>
                        <span>Período actual</span>
                    </div>
                </div>
            </div>

            {/* Tarjeta 3: Peso Neto Total Kg (con subtotales si existen) */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color: color }}>
                            {iconoPeso}
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {tipo === 'compras' ? 'COMPRAS' : 'VENTAS'}
                    </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Peso Neto Total (Kg)</h3>

                {/* Si existen los subtotales, los mostramos */}
                {kpis.pesoNetoOrganico !== undefined && kpis.pesoNetoNoOrganico !== undefined ? (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Total:</span>
                            <span className="text-xl font-bold text-gray-800">
                                {kpis.pesoNetoTotal.toLocaleString('es-CO')}
                            </span>
                        </div>
                        {/* Item Orgánico: Resaltado con fondo y borde */}
                        <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded-lg border-l-4" style={{ borderColor: '#3B82F6' }}>
                            <span className="text-xs font-semibold text-gray-700">Orgánico:</span>
                            <span className="font-bold text-lg" style={{ color: '#3B82F6' }}>
                                {kpis.pesoNetoOrganico.toLocaleString('es-CO')}
                            </span>
                        </div>
                        {/* Item Convencional */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-xs text-gray-500">Convencional:</span>
                            <span className="font-semibold" style={{ color: '#1E3A8A' }}>
                                {kpis.pesoNetoNoOrganico.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>
                ) : (
                    // Si no hay subtotales, solo mostramos el total
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">
                        {kpis.pesoNetoTotal.toLocaleString('es-CO')}
                    </p>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <div className="h-1 rounded-full mr-2" style={{ backgroundColor: color, width: '100%' }}></div>
                        <span>Período actual</span>
                    </div>
                </div>
            </div>

            {/* Tarjeta 4: Promedio por Transacción */}
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                        <div style={{ color: color }}>
                            {iconoPromedio}
                        </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {tipo === 'compras' ? 'COMPRAS' : 'VENTAS'}
                    </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Promedio por Transacción</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                    {formatearMoneda(kpis.promedioTransaccion)}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <div className="h-1 rounded-full mr-2" style={{ backgroundColor: color, width: '100%' }}></div>
                        <span>Período actual</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KPICards;