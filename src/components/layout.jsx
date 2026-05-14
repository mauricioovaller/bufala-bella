// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Users, ShoppingCart, Package, Menu, X, LogOut, BarChart3, FileText, FlaskRound, LayoutDashboard, Car, Factory, BookOpenCheck, Mail, Globe, ClipboardList } from "lucide-react";
import { getPermisos } from "../services/menuPrincipal/menuPrincipalService"; // Servicio para obtener permisos

// Todas las opciones del menú (sin filtrar)
const menuItems = [
  { to: "/", icon: <Home size={20} />, label: "Inicio" },
  { to: "/clientes", icon: <Users size={20} />, label: "Clientes" },
  { to: "/conductores", icon: <Car size={20} />, label: "Conductores" },
  { to: "/productos", icon: <Package size={20} />, label: "Productos" },
  { to: "/configuracion-correos", icon: <Mail size={20} />, label: "Configuración de Correos" },
  { to: "/pedidos", icon: <ShoppingCart size={20} />, label: "Pedidos" },
  { to: "/pedidos-chile", icon: <Globe size={20} />, label: "Pedidos Chile" },
  { to: "/samples", icon: <FlaskRound size={20} />, label: "Samples" },
  { to: "/produccion", icon: <Factory size={20} />, label: "Despachos" },
  { to: "/consolidacion", icon: <BarChart3 size={20} />, label: "Consolidación" },
  { to: "/facturacion", icon: <FileText size={20} />, label: "Facturación" },
  { to: "/complemento-facturas", icon: <BookOpenCheck size={20} />, label: "Complemento Facturación" },
  { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
  { to: "/reportes", icon: <ClipboardList size={20} />, label: "Reportes" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Estados para permisos y carga
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Banner "Nueva opción: Reportes" ─────────────────────────────────────
  // Se muestra durante 7 días desde la primera vez que el usuario lo ve.
  // La fecha de primer aviso se guarda en localStorage.
  const BANNER_KEY = "banner_reportes_desde";
  const BANNER_DIAS = 7;
  const [mostrarBanner, setMostrarBanner] = useState(() => {
    try {
      const guardado = localStorage.getItem(BANNER_KEY);
      if (!guardado) {
        localStorage.setItem(BANNER_KEY, new Date().toISOString());
        return true;
      }
      const diasTranscurridos =
        (Date.now() - new Date(guardado).getTime()) / (1000 * 60 * 60 * 24);
      return diasTranscurridos < BANNER_DIAS;
    } catch {
      return false;
    }
  });

  const cerrarBanner = () => {
    setMostrarBanner(false);
    try { localStorage.setItem(BANNER_KEY, new Date(0).toISOString()); } catch { /* noop */ }
  };

  // Cargar permisos al montar el componente
  useEffect(() => {
    async function cargarPermisos() {
      try {
        const rutasPermitidas = await getPermisos();
        setPermisos(rutasPermitidas);
      } catch (error) {
        console.error("Error al obtener permisos:", error);
        setPermisos([]); // En caso de error, asumimos que no tiene permisos
      } finally {
        setCargando(false);
      }
    }
    cargarPermisos();
  }, []);

  // Filtrar las opciones del menú según los permisos obtenidos
  const menuItemsPermitidos = cargando ? [] : menuItems.filter(item =>
    permisos.includes(item.to)
  );

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "https://portal.datenbankensoluciones.com.co/";
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg border-b border-slate-700 px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo y título (sin cambios) */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">SI</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Sistema de Información
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestión Integral
            </p>
          </div>
        </div>

        {/* Mientras carga, mostramos un spinner */}
        {cargando ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="text-sm text-slate-300">Cargando menú...</span>
          </div>
        ) : (
          <>
            {/* Menú desktop (solo si hay opciones) */}
            {menuItemsPermitidos.length > 0 && (
              <nav className="hidden md:flex gap-1 items-center bg-slate-700/50 rounded-2xl p-1 backdrop-blur-sm overflow-x-auto flex-nowrap max-w-[calc(100vw-300px)]">
                {menuItemsPermitidos.map((item) => {
                  const isActive = location.pathname === item.to ||
                    (item.to !== "/" && location.pathname.startsWith(item.to + "/"));
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive
                        ? "bg-white text-slate-900 shadow-lg transform scale-105"
                        : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                        }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
                <div className="w-px h-6 bg-slate-600 mx-2 flex-shrink-0"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 group"
                >
                  <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Salir</span>
                </button>
              </nav>
            )}
            {/* Si no hay opciones permitidas, mostramos solo botón de salir */}
            {menuItemsPermitidos.length === 0 && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200"
                >
                  <LogOut size={18} />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Botón de menú móvil (siempre visible, pero deshabilitado mientras carga) */}
        <button
          className="md:hidden text-white p-2 rounded-lg hover:bg-slate-700 transition-all duration-200"
          onClick={() => setMenuOpen(!menuOpen)}
          disabled={cargando}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Menú móvil (solo se muestra si no está cargando y hay opciones o queremos mostrar al menos el logout) */}
      {menuOpen && !cargando && (
        <div className="md:hidden fixed inset-0 z-40 pt-16">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute top-0 right-0 w-80 h-full bg-slate-800 border-l border-slate-700 shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Menú de Navegación</h2>
              <p className="text-slate-400 text-sm mt-1">Selecciona una opción</p>
            </div>
            <div className="p-4 space-y-2">
              {menuItemsPermitidos.map((item) => {
                const isActive = location.pathname === item.to ||
                  (item.to !== "/" && location.pathname.startsWith(item.to + "/"));

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-4 p-4 rounded-xl text-base font-medium transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                      }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : ''}`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setTimeout(handleLogout, 300);
                }}
                className="flex items-center justify-center gap-3 w-full p-4 rounded-xl text-base font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-200"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Contenido principal */}
      <main className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* ── Banner "Nueva opción: Reportes" ── */}
        {mostrarBanner && !cargando && permisos.includes("/reportes") && (
          <div className="container mx-auto px-4 sm:px-6 pt-4 pb-0">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-2xl shadow-lg">
              <div className="flex-shrink-0 bg-white/20 rounded-xl p-2">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">✨ ¡Nueva opción disponible: Reportes!</p>
                <p className="text-blue-100 text-xs mt-0.5 leading-tight">
                  Consulta información de despachos por semana al instante. Búscala en el menú.
                </p>
              </div>
              <button
                onClick={cerrarBanner}
                className="flex-shrink-0 text-white/70 hover:text-white transition-colors ml-1"
                aria-label="Cerrar aviso"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      {/* Elementos decorativos de fondo */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-purple-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
    </>
  );
}