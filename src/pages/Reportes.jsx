import React, { useState } from "react";
import ReporteKilosSemanales from "../components/reportes/ReporteKilosSemanales";

const REPORTES = [
    {
        id: "kilos-semanales",
        label: "Cajas Despachadas por Semana",
        descripcion: "Cantidad de cajas despachadas por cliente, región y producto agrupadas por semana.",
        componente: <ReporteKilosSemanales />,
    },
    // Aquí se pueden agregar más reportes en el futuro
];

export default function Reportes() {
    const [reporteActivo, setReporteActivo] = useState(REPORTES[0].id);

    const reporte = REPORTES.find((r) => r.id === reporteActivo);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col md:flex-row min-h-screen">

                {/* ── Sidebar desktop / tabs móvil ── */}
                <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 shrink-0">
                    {/* Título — solo desktop */}
                    <div className="hidden md:block p-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Reportes
                        </h2>
                    </div>

                    {/* Móvil: pestañas horizontales con scroll */}
                    <nav className="md:hidden flex overflow-x-auto gap-2 px-3 py-2 scrollbar-hide">
                        {REPORTES.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setReporteActivo(r.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${reporteActivo === r.id
                                        ? "bg-blue-600 text-white shadow"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop: lista vertical con descripción */}
                    <nav className="hidden md:block p-2">
                        {REPORTES.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setReporteActivo(r.id)}
                                className={`w-full text-left px-3 py-3 rounded-lg mb-1 transition-colors text-sm ${reporteActivo === r.id
                                        ? "bg-blue-600 text-white font-medium"
                                        : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <div className="font-medium">{r.label}</div>
                                <div className={`text-xs mt-0.5 leading-snug ${reporteActivo === r.id ? "text-blue-100" : "text-gray-400"
                                    }`}>
                                    {r.descripcion}
                                </div>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Contenido del reporte */}
                <main className="flex-1 overflow-auto">
                    {reporte ? reporte.componente : null}
                </main>
            </div>
        </div>
    );
}
