// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Users, ShoppingCart, Package, Menu, X, LogOut, BarChart3, FileText, FlaskRound, LayoutDashboard, Car, Factory, BookOpenCheck, Mail, Globe, ClipboardList, FileMinus, MessageCircle } from "lucide-react";
import { getPermisos } from "../services/menuPrincipal/menuPrincipalService";

const menuItems = [
  { to: "/", icon: <Home size={18} />, label: "Inicio" },
  { to: "/clientes", icon: <Users size={18} />, label: "Clientes" },
  { to: "/comentarios", icon: <MessageCircle size={18} />, label: "Comentarios" },
  { to: "/conductores", icon: <Car size={18} />, label: "Conductores" },
  { to: "/productos", icon: <Package size={18} />, label: "Productos" },
  { to: "/configuracion-correos", icon: <Mail size={18} />, label: "Correos" },
  { to: "/pedidos", icon: <ShoppingCart size={18} />, label: "Pedidos" },
  { to: "/notas-credito", icon: <FileMinus size={18} />, label: "Notas Crédito" },
  { to: "/pedidos-chile", icon: <Globe size={18} />, label: "Pedidos Chile" },
  { to: "/samples", icon: <FlaskRound size={18} />, label: "Samples" },
  { to: "/produccion", icon: <Factory size={18} />, label: "Despachos" },
  { to: "/consolidacion", icon: <BarChart3 size={18} />, label: "Consolidación" },
  { to: "/facturacion", icon: <FileText size={18} />, label: "Facturación" },
  { to: "/complemento-facturas", icon: <BookOpenCheck size={18} />, label: "Comp. Facturación" },
  { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/reportes", icon: <ClipboardList size={18} />, label: "Reportes" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPermisos() {
      try {
        const rutasPermitidas = await getPermisos();
        setPermisos(rutasPermitidas);
      } catch (error) {
        console.error("Error al obtener permisos:", error);
        setPermisos([]);
      } finally {
        setCargando(false);
      }
    }
    cargarPermisos();
  }, []);

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 via-slate-800 to-blue-900 shadow-lg border-b border-slate-700/50">
        <div className="flex items-center h-14 px-3 sm:px-5">
          <div className="flex items-center gap-2.5 flex-shrink-0 mr-3">
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white font-bold text-xs">BB</span>
            </div>
            <div className="hidden sm:block leading-none">
              <h1 className="text-sm font-bold text-white">Bufala Bella</h1>
              <p className="text-[9px] text-blue-300/80 -mt-0.5">Sistema de Gestión</p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {cargando ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                <span className="text-xs text-slate-400">Cargando...</span>
              </div>
            ) : menuItemsPermitidos.length > 0 ? (
              <div className="hidden md:block overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
                <nav className="flex items-center gap-0.5 w-max">
                  {menuItemsPermitidos.map((item) => {
                    const isActive = location.pathname === item.to ||
                      (item.to !== "/" && location.pathname.startsWith(item.to + "/"));
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          isActive
                            ? "bg-white/15 text-white shadow-sm backdrop-blur-sm"
                            : "text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <span className={isActive ? "" : "text-slate-400"}>{item.icon}</span>
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-400 rounded-full"></span>
                      )}
                    </NavLink>
                  );
                })}
                </nav>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {!cargando && (
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Salir</span>
              </button>
            )}
            <button
              className="md:hidden text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={cargando}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && !cargando && (
        <div className="md:hidden fixed inset-0 z-40 pt-14">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav className="absolute top-0 right-0 w-72 h-full bg-slate-800 border-l border-slate-700 shadow-2xl overflow-y-auto">
            <div className="p-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-400 to-indigo-500 w-9 h-9 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xs">BB</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Bufala Bella</p>
                  <p className="text-[10px] text-slate-400">Menú de navegación</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-0.5">
              {menuItemsPermitidos.map((item) => {
                const isActive = location.pathname === item.to ||
                  (item.to !== "/" && location.pathname.startsWith(item.to + "/"));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={`p-1.5 rounded-lg ${isActive ? "bg-white/20" : ""}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-700 mt-2">
              <button
                onClick={() => { setMenuOpen(false); setTimeout(handleLogout, 200); }}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      <main className="pt-14 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      <div className="fixed top-0 left-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
    </>
  );
}