import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerResumenInicio } from "../services/inicioService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Inicio() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const res = await obtenerResumenInicio();
        setDatos(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  const fmt = (n) => {
    if (n == null) return "0";
    return Number(n).toLocaleString("es-CO");
  };

  const fmtPeso = (kg) => {
    if (kg == null) return "0 kg";
    if (kg >= 1000) return (kg / 1000).toFixed(1) + " ton";
    return Number(kg).toLocaleString("es-CO") + " kg";
  };

  const fmtCOP = (v) => {
    if (v == null) return "$0";
    const n = Number(v);
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
    return "$" + n.toLocaleString("es-CO");
  };

  const accionesRapidas = [
    { titulo: "Crear Pedido", desc: "Registrar nuevo pedido", ruta: "/pedidos", icono: "📦", color: "from-blue-500 to-blue-600" },
    { titulo: "Facturación", desc: "Generar facturas", ruta: "/facturacion", icono: "🧾", color: "from-green-500 to-green-600" },
    { titulo: "Consolidación", desc: "Consolidar pedidos", ruta: "/consolidacion", icono: "📈", color: "from-purple-500 to-purple-600" },
    { titulo: "Dashboard", desc: "Ver analíticas", ruta: "/dashboard", icono: "📊", color: "from-orange-500 to-orange-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500">Cargando panel de inicio...</p>
      </div>
    );
  }

  if (error && !datos) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Error al cargar datos</h2>
        <p className="text-slate-500 mb-4 max-w-md">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Reintentar
        </button>
      </div>
    );
  }

  const { totales, mesActual, ultimasFacturas, ultimosPedidos, tendenciaKg } = datos || {};

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      {/* Hero Section con gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="absolute top-0 right-0 opacity-10">
          <svg width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="white"/></svg>
        </div>
        <div className="absolute bottom-0 left-1/2 opacity-5">
          <svg width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="120" fill="white"/></svg>
        </div>
        <div className="relative z-10">
          <p className="text-blue-200 text-sm md:text-base font-medium tracking-wide mb-1">SISTEMA DE GESTIÓN INTEGRAL</p>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            {saludo} 👋
          </h1>
          <p className="text-blue-200 text-sm md:text-lg max-w-xl">
            Resumen operativo de Bufala Bella · {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>

          {totales && (
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center bg-white/15 backdrop-blur-sm text-white text-xs md:text-sm px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                {fmt(totales.pedidosActivos)} pedidos activos
              </span>
              <span className="inline-flex items-center bg-white/15 backdrop-blur-sm text-white text-xs md:text-sm px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-sky-400 rounded-full mr-2"></span>
                {fmtPeso(mesActual?.kgDespachados)} despachados este mes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { titulo: "Pedidos Activos", valor: totales?.pedidosActivos, icono: "📦", color: "blue", sub: fmtPeso(totales?.pesoNetoTotal) + " kg neto" },
          { titulo: "Clientes", valor: totales?.clientes, icono: "👥", color: "green", sub: "registrados" },
          { titulo: "Productos", valor: totales?.productos, icono: "📊", color: "purple", sub: "activos" },
          { titulo: "Facturas Mes", valor: mesActual?.facturas, icono: "🧾", color: "orange", sub: fmtPeso(mesActual?.kgDespachados) },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl bg-${kpi.color}-100`}>
                {kpi.icono}
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">{kpi.titulo}</h3>
            <p className={`text-xl md:text-3xl font-bold text-${kpi.color}-700`}>{fmt(kpi.valor)}</p>
            <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Grid: Tendencia + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Gráfico tendencia kg */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Kilogramos Despachados — Últimos 7 Días</h2>
          {tendenciaKg && tendenciaKg.length > 0 ? (
            <div className="h-[180px] md:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendenciaKg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
                  }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                    formatter={(value) => [fmtPeso(value), "Kilogramos"]}
                    labelFormatter={(label) => `Fecha: ${new Date(label + "T00:00:00").toLocaleDateString("es-CO")}`}
                  />
                  <Bar dataKey="kg" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-gray-400 text-sm">
              Sin datos de despachos en los últimos 7 días
            </div>
          )}
        </div>

        {/* Columna derecha: últimos pedidos + facturas */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Últimos pedidos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3">Últimos Pedidos</h2>
            {ultimosPedidos && ultimosPedidos.length > 0 ? (
              <div className="space-y-2">
                {ultimosPedidos.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">#{p.id}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-medium text-slate-800 truncate">{p.cliente}</p>
                        <p className="text-[10px] md:text-xs text-slate-500">{p.fecha}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Sin pedidos recientes</p>
            )}
          </div>

          {/* Últimas facturas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3">Últimas Facturas</h2>
            {ultimasFacturas && ultimasFacturas.length > 0 ? (
              <div className="space-y-2">
                {ultimasFacturas.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{f.fecha}</span>
                        {f.guiaMaster && (
                          <span className="text-[10px] md:text-xs font-mono text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded truncate">{f.guiaMaster}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-xs md:text-sm font-semibold text-slate-700">{fmtPeso(f.kg)}</p>
                      <p className="text-[10px] text-slate-400">{fmt(f.items)} items</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Sin facturas recientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Acciones Rápidas con navegación */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {accionesRapidas.map((accion, i) => (
            <button
              key={i}
              onClick={() => navigate(accion.ruta)}
              className="flex flex-col items-center text-center p-3 md:p-4 rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${accion.color} flex items-center justify-center text-lg md:text-xl mb-2 shadow-sm`}>
                {accion.icono}
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-slate-800">{accion.titulo}</h3>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">{accion.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Estado del sistema con datos reales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">Resumen Operativo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 rounded-xl border border-gray-100">
            <div className="text-xl md:text-2xl font-bold text-sky-600 mb-0.5">{fmt(totales?.facturasHistorico)}</div>
            <div className="text-[10px] md:text-xs text-slate-500">Facturas totales</div>
          </div>
          <div className="text-center p-3 md:p-4 rounded-xl border border-gray-100">
            <div className="text-xl md:text-2xl font-bold text-green-600 mb-0.5">{fmtCOP(mesActual?.valorTotal)}</div>
            <div className="text-[10px] md:text-xs text-slate-500">Valor facturado mes</div>
          </div>
          <div className="text-center p-3 md:p-4 rounded-xl border border-gray-100">
            <div className="text-xl md:text-2xl font-bold text-amber-600 mb-0.5">{fmt(mesActual?.costosFlete)}</div>
            <div className="text-[10px] md:text-xs text-slate-500">Costos flete mes</div>
          </div>
          <div className="text-center p-3 md:p-4 rounded-xl border border-gray-100">
            <div className="text-xl md:text-2xl font-bold text-indigo-600 mb-0.5">{fmtCOP(mesActual?.totalFleteCOP)}</div>
            <div className="text-[10px] md:text-xs text-slate-500">Total flete COP mes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
