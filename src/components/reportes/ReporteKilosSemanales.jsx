import React, { useState, useMemo } from "react";
import { getReporteKilosSemanales } from "../../services/reportesService";
import Swal from "sweetalert2";
import XLSXStyle from "xlsx-js-style";

export default function ReporteKilosSemanales() {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const hoyStr = hoy.toISOString().split("T")[0];

    const [fechaDesde, setFechaDesde] = useState(primerDiaMes);
    const [fechaHasta, setFechaHasta] = useState(hoyStr);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState(null); // { filas, semanas }
    const [busqueda, setBusqueda] = useState("");
    const [mostrarSamples, setMostrarSamples] = useState(false);

    // ── Filtro de búsqueda sobre los resultados ──────────────────────────────
    const filasFiltradas = useMemo(() => {
        if (!resultado) return [];
        const term = busqueda.toLowerCase();
        if (!term) return resultado.filas;
        return resultado.filas.filter(
            (f) =>
                f.cliente.toLowerCase().includes(term) ||
                f.region.toLowerCase().includes(term) ||
                f.descripcion.toLowerCase().includes(term) ||
                (f.unidades || "").toLowerCase().includes(term)
        );
    }, [resultado, busqueda]);

    // ── Totales por columna de semana ────────────────────────────────────────
    const totalesPorSemana = useMemo(() => {
        if (!resultado) return {};
        const totales = {};
        resultado.semanas.forEach(({ clave }) => {
            totales[clave] = filasFiltradas.reduce(
                (acc, fila) => acc + (fila[clave] || 0),
                0
            );
        });
        totales["total"] = filasFiltradas.reduce(
            (acc, fila) => acc + (fila.total || 0),
            0
        );
        return totales;
    }, [filasFiltradas, resultado]);

    // ── Filas de muestras filtradas ──────────────────────────────────────────
    const filasSampleFiltradas = useMemo(() => {
        if (!resultado) return [];
        const term = busqueda.toLowerCase();
        if (!term) return resultado.filasSample;
        return resultado.filasSample.filter(
            (f) =>
                f.cliente.toLowerCase().includes(term) ||
                f.region.toLowerCase().includes(term) ||
                f.descripcion.toLowerCase().includes(term) ||
                (f.unidades || "").toLowerCase().includes(term)
        );
    }, [resultado, busqueda]);

    // ── Subtotales de muestras ───────────────────────────────────────────────
    const totalesSamplePorSemana = useMemo(() => {
        if (!resultado) return {};
        const totales = {};
        resultado.semanas.forEach(({ clave }) => {
            totales[clave] = filasSampleFiltradas.reduce(
                (acc, fila) => acc + (fila[clave] || 0),
                0
            );
        });
        totales["total"] = filasSampleFiltradas.reduce(
            (acc, fila) => acc + (fila.total || 0),
            0
        );
        return totales;
    }, [filasSampleFiltradas, resultado]);

    // ── Gran total (despachos + muestras) ────────────────────────────────────
    const totalesGrandPorSemana = useMemo(() => {
        if (!resultado) return {};
        const haySamples = mostrarSamples && filasSampleFiltradas.length > 0;
        const totales = {};
        resultado.semanas.forEach(({ clave }) => {
            totales[clave] =
                (totalesPorSemana[clave] || 0) +
                (haySamples ? totalesSamplePorSemana[clave] || 0 : 0);
        });
        totales["total"] =
            (totalesPorSemana["total"] || 0) +
            (haySamples ? totalesSamplePorSemana["total"] || 0 : 0);
        return totales;
    }, [totalesPorSemana, totalesSamplePorSemana, mostrarSamples, resultado, filasSampleFiltradas]);

    // ── Consultar reporte ────────────────────────────────────────────────────
    const handleConsultar = async () => {
        if (!fechaDesde || !fechaHasta) {
            Swal.fire({
                icon: "warning",
                title: "Fechas requeridas",
                text: "Por favor ingrese las fechas de inicio y fin.",
            });
            return;
        }
        if (fechaDesde > fechaHasta) {
            Swal.fire({
                icon: "warning",
                title: "Rango inválido",
                text: "La fecha de inicio no puede ser mayor que la fecha fin.",
            });
            return;
        }

        setLoading(true);
        setResultado(null);
        setBusqueda("");

        try {
            const data = await getReporteKilosSemanales(fechaDesde, fechaHasta);
            setResultado(data);

            if (data.filas.length === 0) {
                Swal.fire({
                    icon: "info",
                    title: "Sin resultados",
                    text: "No se encontraron despachos en el rango de fechas seleccionado.",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error al cargar el reporte",
                text: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Exportar a Excel ─────────────────────────────────────────────────────
    const handleExportarExcel = () => {
        if (!resultado || filasFiltradas.length === 0) return;

        const haySamples = mostrarSamples && filasSampleFiltradas.length > 0;
        const numSemanas = resultado.semanas.length;
        const totalCols = 4 + numSemanas + 1;

        // ── Construir AOA dinámicamente ──
        const semHeaders = resultado.semanas.map((s) => `${s.labelSem}\n${s.labelRango}`);
        const aoa = [];

        // Fila 0: encabezados
        aoa.push(["Cliente", "Región", "Descripción", "Unidades", ...semHeaders, "Total"]);

        // Filas de despachos regulares
        for (const fila of filasFiltradas) {
            aoa.push([
                fila.cliente, fila.region, fila.descripcion, fila.unidades || "",
                ...resultado.semanas.map(({ clave }) => fila[clave] || 0),
                fila.total,
            ]);
        }

        // Bloque de muestras (opcional)
        let rSubtotalDesp = -1;
        let rSepMuestras = -1;
        let rPrimeraMuestra = -1;
        let rSubtotalMuestras = -1;

        if (haySamples) {
            // Subtotal despachos
            rSubtotalDesp = aoa.length;
            aoa.push([
                "SUBTOTAL DESPACHOS", "", "", "",
                ...resultado.semanas.map(({ clave }) => totalesPorSemana[clave] || 0),
                totalesPorSemana["total"] || 0,
            ]);

            // Separador
            rSepMuestras = aoa.length;
            aoa.push(["🧪 MUESTRAS (SAMPLES)", "", "", "", ...resultado.semanas.map(() => ""), ""]);

            // Filas de muestras
            rPrimeraMuestra = aoa.length;
            for (const fila of filasSampleFiltradas) {
                aoa.push([
                    fila.cliente, fila.region, fila.descripcion, fila.unidades || "",
                    ...resultado.semanas.map(({ clave }) => fila[clave] || 0),
                    fila.total,
                ]);
            }

            // Subtotal muestras
            rSubtotalMuestras = aoa.length;
            aoa.push([
                "SUBTOTAL MUESTRAS", "", "", "",
                ...resultado.semanas.map(({ clave }) => totalesSamplePorSemana[clave] || 0),
                totalesSamplePorSemana["total"] || 0,
            ]);
        }

        // Fila gran total
        const rGranTotal = aoa.length;
        const labelTotal = haySamples ? "GRAN TOTAL" : "TOTAL GENERAL";
        aoa.push([
            labelTotal, "", "", "",
            ...resultado.semanas.map(({ clave }) => totalesGrandPorSemana[clave] || 0),
            totalesGrandPorSemana["total"] || 0,
        ]);

        const hoja = XLSXStyle.utils.aoa_to_sheet(aoa);

        // ── Definición de estilos ──
        const sHeaderBase = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
            fill: { patternType: "solid", fgColor: { rgb: "1E293B" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { right: { style: "thin", color: { rgb: "475569" } } },
        };
        const sHeaderTotal = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
            fill: { patternType: "solid", fgColor: { rgb: "1D4ED8" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
        };
        const sSepMuestras = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
            fill: { patternType: "solid", fgColor: { rgb: "78350F" } },
            alignment: { horizontal: "left", vertical: "center" },
        };

        // ── Aplicar estilos fila por fila ──
        for (let r = 0; r < aoa.length; r++) {
            for (let c = 0; c < totalCols; c++) {
                const ref = XLSXStyle.utils.encode_cell({ r, c });
                if (!hoja[ref]) hoja[ref] = { v: c >= 4 ? 0 : "" };
                const isTotal = c === totalCols - 1;

                if (r === 0) {
                    // Encabezados
                    hoja[ref].s = isTotal ? sHeaderTotal : sHeaderBase;
                } else if (r >= 1 && r < 1 + filasFiltradas.length) {
                    // Filas de despachos regulares
                    const bgHex = (r - 1) % 2 === 0 ? "FFFFFF" : "F9FAFB";
                    hoja[ref].s = {
                        font: isTotal ? { bold: true, color: { rgb: "1D4ED8" } } : { color: { rgb: "374151" } },
                        fill: { patternType: "solid", fgColor: { rgb: isTotal ? "EFF6FF" : bgHex } },
                        alignment: { horizontal: c >= 4 ? "center" : "left", vertical: "center" },
                        border: { right: { style: "thin", color: { rgb: "E5E7EB" } } },
                    };
                } else if (r === rSubtotalDesp) {
                    hoja[ref].s = {
                        font: { bold: true, color: { rgb: isTotal ? "1D4ED8" : "334155" }, sz: 10 },
                        fill: { patternType: "solid", fgColor: { rgb: isTotal ? "DBEAFE" : "E2E8F0" } },
                        alignment: { horizontal: c >= 4 ? "center" : "left", vertical: "center" },
                        border: { top: { style: "medium", color: { rgb: "94A3B8" } } },
                    };
                } else if (r === rSepMuestras) {
                    hoja[ref].s = sSepMuestras;
                } else if (rPrimeraMuestra !== -1 && r >= rPrimeraMuestra && r < rSubtotalMuestras) {
                    const mi = r - rPrimeraMuestra;
                    const bgHex = mi % 2 === 0 ? "FFFBEB" : "FEF3C7";
                    hoja[ref].s = {
                        font: isTotal ? { bold: true, color: { rgb: "92400E" } } : { color: { rgb: "374151" } },
                        fill: { patternType: "solid", fgColor: { rgb: isTotal ? "FEF3C7" : bgHex } },
                        alignment: { horizontal: c >= 4 ? "center" : "left", vertical: "center" },
                        border: { right: { style: "thin", color: { rgb: "FDE68A" } } },
                    };
                } else if (r === rSubtotalMuestras) {
                    hoja[ref].s = {
                        font: { bold: true, color: { rgb: "92400E" }, sz: 10 },
                        fill: { patternType: "solid", fgColor: { rgb: isTotal ? "FCD34D" : "FDE68A" } },
                        alignment: { horizontal: c >= 4 ? "center" : "left", vertical: "center" },
                        border: { top: { style: "medium", color: { rgb: "D97706" } } },
                    };
                } else if (r === rGranTotal) {
                    hoja[ref].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" }, sz: isTotal ? 11 : 10 },
                        fill: { patternType: "solid", fgColor: { rgb: isTotal ? "1D4ED8" : "1E293B" } },
                        alignment: { horizontal: c >= 4 ? "center" : "left", vertical: "center" },
                        border: { top: { style: "medium", color: { rgb: "475569" } } },
                    };
                }
            }
        }

        // Ancho de columnas
        hoja["!cols"] = [
            { wch: 30 }, { wch: 20 }, { wch: 35 }, { wch: 20 },
            ...resultado.semanas.map(() => ({ wch: 14 })),
            { wch: 14 },
        ];

        // Altura de fila encabezado (doble línea) y separador muestras
        const rowHeights = [{ hpt: 36 }];
        if (rSepMuestras !== -1) {
            while (rowHeights.length <= rSepMuestras) rowHeights.push({ hpt: 15 });
            rowHeights[rSepMuestras] = { hpt: 20 };
        }
        hoja["!rows"] = rowHeights;

        const libro = XLSXStyle.utils.book_new();
        XLSXStyle.utils.book_append_sheet(libro, hoja, "Kilos Semanales");

        const nombreArchivo = `Reporte_Cajas_Semanales_${fechaDesde}_${fechaHasta}.xlsx`;
        XLSXStyle.writeFile(libro, nombreArchivo);
    };

    return (
        <div className="py-4 px-2 md:py-6 md:px-3">
            {/* ── Encabezado ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                        Reporte de Cajas Despachadas por Semana
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Consolidado por cliente, región y producto
                    </p>
                </div>

                {resultado && filasFiltradas.length > 0 && (
                    <button
                        onClick={handleExportarExcel}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                        </svg>
                        Exportar Excel
                    </button>
                )}
            </div>

            {/* ── Panel de filtros ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                {/* Fila 1: fechas lado a lado en móvil y desktop */}
                <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4 md:items-end mb-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs md:text-sm font-medium text-gray-600">Fecha inicio</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs md:text-sm font-medium text-gray-600">Fecha fin</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                    </div>
                </div>
                {/* Fila 2: toggle + botón en la misma fila en móvil */}
                <div className="flex items-center justify-between gap-3">
                    {/* Toggle: incluir muestras */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                            role="switch"
                            aria-checked={mostrarSamples}
                            onClick={() => setMostrarSamples((v) => !v)}
                            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${mostrarSamples ? "bg-amber-500" : "bg-gray-300"
                                }`}
                        >
                            <div
                                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${mostrarSamples ? "translate-x-5" : "translate-x-0.5"
                                    }`}
                            />
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">Incluir muestras</span>
                    </label>

                    <button
                        onClick={handleConsultar}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Cargando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Consultar
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Búsqueda sobre resultados ── */}
            {resultado && resultado.filas.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Filtrar por cliente, región o producto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="flex-1 text-sm border-none outline-none text-gray-700 placeholder-gray-400"
                        />
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda("")}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {filasFiltradas.length} despachos
                        {mostrarSamples && resultado.filasSample.length > 0 &&
                            ` · ${filasSampleFiltradas.length} muestras`}
                        {" · "}{resultado.semanas.length} semanas
                    </span>
                </div>
            )}

            {/* ── Spinner de carga ── */}
            {loading && (
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-500 text-sm">
                        Generando reporte...
                    </span>
                </div>
            )}

            {/* ── Tabla de resultados ── */}
            {!loading && resultado && filasFiltradas.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Indicador de scroll */}
                    <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6-6m0 0l6 6m-6-6v12M3 21h18" />
                        </svg>
                        Semanas: Lunes a Domingo (ISO 8601) · Las columnas Cliente, Región y Descripción quedan fijas al desplazarse
                    </div>

                    {/* Contenedor con scroll horizontal Y vertical */}
                    <div className="overflow-auto" style={{ maxHeight: "72vh" }}>
                        <table className="text-sm border-collapse" style={{ minWidth: "max-content" }}>
                            <thead>
                                <tr className="bg-slate-800 text-white">
                                    {/* Columnas fijas: sticky top + sticky left */}
                                    <th
                                        className="sticky top-0 left-0 z-30 bg-slate-800 px-4 py-3 text-left font-semibold whitespace-nowrap border-r border-slate-600"
                                        style={{ minWidth: 190 }}
                                    >
                                        Cliente
                                    </th>
                                    <th
                                        className="sticky top-0 z-30 bg-slate-800 px-4 py-3 text-left font-semibold whitespace-nowrap border-r border-slate-600"
                                        style={{ minWidth: 130, left: 190 }}
                                    >
                                        Región
                                    </th>
                                    <th
                                        className="sticky top-0 z-30 bg-slate-800 px-4 py-3 text-left font-semibold whitespace-nowrap border-r border-slate-500"
                                        style={{ minWidth: 220, left: 320 }}
                                    >
                                        Descripción
                                    </th>
                                    <th
                                        className="sticky top-0 z-30 bg-slate-800 px-4 py-3 text-left font-semibold whitespace-nowrap border-r border-slate-500"
                                        style={{ minWidth: 140, left: 540 }}
                                    >
                                        Unidades
                                    </th>
                                    {/* Columnas de semanas: solo sticky top */}
                                    {resultado.semanas.map(({ clave, labelSem, labelRango }) => (
                                        <th
                                            key={clave}
                                            className="sticky top-0 z-20 bg-slate-800 px-2 py-2 text-center font-semibold border-r border-slate-700"
                                            style={{ minWidth: 110 }}
                                        >
                                            <div className="font-bold text-white text-xs">{labelSem}</div>
                                            <div className="text-slate-300 font-normal text-[9px] mt-0.5 whitespace-nowrap">
                                                {labelRango}
                                            </div>
                                        </th>
                                    ))}
                                    <th
                                        className="sticky top-0 z-20 bg-blue-700 px-4 py-3 text-center font-semibold whitespace-nowrap"
                                        style={{ minWidth: 100 }}
                                    >
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filasFiltradas.map((fila, idx) => {
                                    const bgBase = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
                                    return (
                                        <tr
                                            key={idx}
                                            className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                                            style={{ backgroundColor: bgBase }}
                                        >
                                            {/* Columnas fijas: sticky left con fondo explícito */}
                                            <td
                                                className="sticky left-0 z-10 px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap border-r border-gray-200"
                                                style={{ minWidth: 190, backgroundColor: bgBase }}
                                            >
                                                {fila.cliente}
                                            </td>
                                            <td
                                                className="sticky z-10 px-4 py-2.5 text-gray-600 whitespace-nowrap border-r border-gray-200"
                                                style={{ minWidth: 130, left: 190, backgroundColor: bgBase }}
                                            >
                                                {fila.region}
                                            </td>
                                            <td
                                                className="sticky z-10 px-4 py-2.5 text-gray-700 border-r border-gray-300"
                                                style={{ minWidth: 220, left: 320, backgroundColor: bgBase }}
                                            >
                                                {fila.descripcion}
                                            </td>
                                            <td
                                                className="sticky z-10 px-4 py-2.5 text-gray-600 whitespace-nowrap border-r border-gray-300"
                                                style={{ minWidth: 140, left: 540, backgroundColor: bgBase }}
                                            >
                                                {fila.unidades || ""}
                                            </td>
                                            {/* Columnas de semanas */}
                                            {resultado.semanas.map(({ clave }) => (
                                                <td
                                                    key={clave}
                                                    className="px-3 py-2.5 text-center text-gray-700 border-r border-gray-100"
                                                >
                                                    {fila[clave] ? (
                                                        <span className="font-medium">
                                                            {fila[clave].toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2.5 text-center font-bold text-blue-700 bg-blue-50">
                                                {fila.total.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* ── Bloque Muestras (condicional) ── */}
                                {mostrarSamples && filasSampleFiltradas.length > 0 && (
                                    <>
                                        {/* Subtotal despachos */}
                                        <tr className="border-t-2 border-slate-300" style={{ backgroundColor: "#e2e8f0" }}>
                                            <td className="sticky left-0 z-10 px-4 py-2.5 font-bold text-slate-700 text-xs whitespace-nowrap border-r border-slate-300" style={{ minWidth: 190, backgroundColor: "#e2e8f0" }}>
                                                SUBTOTAL DESPACHOS
                                            </td>
                                            <td className="sticky z-10 border-r border-slate-300" style={{ minWidth: 130, left: 190, backgroundColor: "#e2e8f0" }} />
                                            <td className="sticky z-10 border-r border-slate-400" style={{ minWidth: 220, left: 320, backgroundColor: "#e2e8f0" }} />
                                            <td className="sticky z-10 border-r border-slate-400" style={{ minWidth: 140, left: 540, backgroundColor: "#e2e8f0" }} />
                                            {resultado.semanas.map(({ clave }) => (
                                                <td key={clave} className="px-3 py-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                                                    {(totalesPorSemana[clave] || 0).toLocaleString()}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2.5 text-center font-bold text-blue-700 bg-blue-100">
                                                {(totalesPorSemana["total"] || 0).toLocaleString()}
                                            </td>
                                        </tr>

                                        {/* Separador sección Muestras */}
                                        <tr style={{ backgroundColor: "#78350f" }}>
                                            <td colSpan={4 + resultado.semanas.length + 1} className="px-4 py-2 font-bold text-white text-xs tracking-wider">
                                                🧪 MUESTRAS (SAMPLES)
                                            </td>
                                        </tr>

                                        {/* Filas de muestras */}
                                        {filasSampleFiltradas.map((fila, idx) => {
                                            const bgBase = idx % 2 === 0 ? "#fffbeb" : "#fef3c7";
                                            return (
                                                <tr key={`s-${idx}`} className="border-b border-amber-100 hover:bg-amber-100 transition-colors" style={{ backgroundColor: bgBase }}>
                                                    <td className="sticky left-0 z-10 px-4 py-2.5 font-medium text-gray-800 border-r border-amber-200" style={{ minWidth: 190, maxWidth: 190, backgroundColor: bgBase }}>
                                                        <div className="truncate" title={fila.cliente}>{fila.cliente}</div>
                                                    </td>
                                                    <td className="sticky z-10 px-4 py-2.5 text-gray-600 border-r border-amber-200" style={{ minWidth: 130, maxWidth: 130, left: 190, backgroundColor: bgBase }}>
                                                        <div className="truncate" title={fila.region}>{fila.region}</div>
                                                    </td>
                                                    <td className="sticky z-10 px-4 py-2.5 text-gray-700 border-r border-amber-300" style={{ minWidth: 220, maxWidth: 220, left: 320, backgroundColor: bgBase }}>
                                                        <div className="truncate" title={fila.descripcion}>{fila.descripcion}</div>
                                                    </td>
                                                    <td className="sticky z-10 px-4 py-2.5 text-gray-600 whitespace-nowrap border-r border-amber-300" style={{ minWidth: 140, left: 540, backgroundColor: bgBase }}>
                                                        {fila.unidades || ""}
                                                    </td>
                                                    {resultado.semanas.map(({ clave }) => (
                                                        <td key={clave} className="px-3 py-2.5 text-center text-gray-700 border-r border-amber-100">
                                                            {fila[clave] ? <span className="font-medium">{fila[clave].toLocaleString()}</span> : <span className="text-amber-200">—</span>}
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-2.5 text-center font-bold text-amber-800 bg-amber-50">{fila.total.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}

                                        {/* Subtotal muestras */}
                                        <tr className="border-t-2 border-amber-400" style={{ backgroundColor: "#fde68a" }}>
                                            <td className="sticky left-0 z-10 px-4 py-2.5 font-bold text-amber-900 text-xs whitespace-nowrap border-r border-amber-400" style={{ minWidth: 190, backgroundColor: "#fde68a" }}>SUBTOTAL MUESTRAS</td>
                                            <td className="sticky z-10 border-r border-amber-300" style={{ minWidth: 130, left: 190, backgroundColor: "#fde68a" }} />
                                            <td className="sticky z-10 border-r border-amber-400" style={{ minWidth: 220, left: 320, backgroundColor: "#fde68a" }} />
                                            <td className="sticky z-10 border-r border-amber-400" style={{ minWidth: 140, left: 540, backgroundColor: "#fde68a" }} />
                                            {resultado.semanas.map(({ clave }) => (
                                                <td key={clave} className="px-3 py-2.5 text-center font-bold text-amber-900 border-r border-amber-300">
                                                    {(totalesSamplePorSemana[clave] || 0).toLocaleString()}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2.5 text-center font-bold text-amber-900 bg-amber-200">
                                                {(totalesSamplePorSemana["total"] || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>

                            {/* Gran total */}
                            <tfoot>
                                <tr className="border-t-2 border-slate-400" style={{ backgroundColor: "#1e293b" }}>
                                    <td className="sticky left-0 z-10 px-4 py-3 font-bold text-white text-sm whitespace-nowrap border-r border-slate-600" style={{ minWidth: 190, backgroundColor: "#1e293b" }}>
                                        {mostrarSamples && filasSampleFiltradas.length > 0 ? "GRAN TOTAL" : "TOTAL GENERAL"}
                                    </td>
                                    <td className="sticky z-10 border-r border-slate-600" style={{ minWidth: 130, left: 190, backgroundColor: "#1e293b" }} />
                                    <td className="sticky z-10 border-r border-slate-600" style={{ minWidth: 220, left: 320, backgroundColor: "#1e293b" }} />
                                    <td className="sticky z-10 border-r border-slate-600" style={{ minWidth: 140, left: 540, backgroundColor: "#1e293b" }} />
                                    {resultado.semanas.map(({ clave }) => (
                                        <td key={clave} className="px-3 py-3 text-center font-bold text-white border-r border-slate-600">
                                            {(totalesGrandPorSemana[clave] || 0).toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-center font-bold text-white bg-blue-700 text-base">
                                        {(totalesGrandPorSemana["total"] || 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Estado vacío inicial ── */}
            {!loading && !resultado && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mb-4 opacity-30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <p className="text-sm font-medium">
                        Seleccione un rango de fechas y presione Consultar
                    </p>
                </div>
            )}
        </div>
    );
}
