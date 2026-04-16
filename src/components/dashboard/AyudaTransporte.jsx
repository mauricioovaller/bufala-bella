// src/components/dashboard/AyudaTransporte.jsx
import React, { useState } from 'react';

/**
 * Componente de ayuda y explicaciones para la sección de transporte
 */
const AyudaTransporte = ({ valorEstiba = 80500 }) => {
    const [mostrarAyuda, setMostrarAyuda] = useState(false);

    const toggleAyuda = () => {
        setMostrarAyuda(!mostrarAyuda);
    };

    return (
        <div className="relative">
            {/* Botón de ayuda */}
            <button
                onClick={toggleAyuda}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                title="Mostrar ayuda"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ayuda</span>
            </button>

            {/* Panel de ayuda */}
            {mostrarAyuda && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10 p-4">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">📚 Guía de Transporte</h3>
                        <button
                            onClick={toggleAyuda}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Sección 1: KPIs */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">📊 KPIs Explicados</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-purple-600 font-medium mr-2">•</span>
                                    <span><strong>Costo Total Transporte:</strong> Suma de todos los fletes en el período</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 font-medium mr-2">•</span>
                                    <span><strong>Estibas Pagas Totales:</strong> Cantidad de estibas pagadas (${valorEstiba.toLocaleString('es-CO')} c/u)</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 font-medium mr-2">•</span>
                                    <span><strong>Costo Promedio Diario:</strong> Promedio de costo de flete por día</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-600 font-medium mr-2">•</span>
                                    <span><strong>Camiones Totales:</strong> Total de camiones utilizados</span>
                                </li>
                            </ul>
                        </div>

                        {/* Sección 2: Gráficas */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">📈 Gráficas Explicadas</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-purple-600 font-medium mr-2">•</span>
                                    <span><strong>Fletes Diarios:</strong> Evolución del costo de flete día a día</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 font-medium mr-2">•</span>
                                    <span><strong>Estibas Pagas Diarias:</strong> Cantidad de estibas pagadas por día</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-purple-600 font-medium mr-2">•</span>
                                    <span><strong>Comparación Fletes vs Estibas:</strong> Análisis diario de relación</span>
                                </li>
                            </ul>
                        </div>

                        {/* Sección 3: Conceptos */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">📦 Conceptos Clave</h4>
                            <div className="text-sm text-gray-600 space-y-2">
                                <p>
                                    <strong>¿Qué es una estiba paga?</strong><br/>
                                    Se paga 1 estiba (${valorEstiba.toLocaleString('es-CO')}) por cada pedido que tenga 20 o más cajas.
                                </p>
                                <p>
                                    <strong>¿Cómo se calcula?</strong><br/>
                                    Si un pedido tiene 20+ cajas → se paga la estiba. Menos de 20 cajas → no se paga estiba.
                                </p>
                                <p>
                                    <strong>Días sin datos:</strong><br/>
                                    Los días sin actividad aparecen con valor 0. Esto ayuda a identificar períodos sin operaciones.
                                </p>
                            </div>
                        </div>

                        {/* Sección 4: Interpretación */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">🔍 Cómo Interpretar</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">✓</span>
                                    <span><strong>Verde en comparación:</strong> Las estibas cubren el flete</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-red-600 mr-2">⚠️</span>
                                    <span><strong>Rojo en comparación:</strong> El flete supera las estibas</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-600 mr-2">•</span>
                                    <span><strong>Línea punteada:</strong> Promedio de 7 días (tendencia)</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            <strong>Nota:</strong> Los datos se actualizan automáticamente al cambiar el período.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Para más detalles, consulte el módulo de Consolidación.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AyudaTransporte;