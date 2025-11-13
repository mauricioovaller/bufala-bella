// src/components/Layout.jsx
import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Users, ShoppingCart, Package, Menu, X, LogOut, BarChart3, FileText, FlaskRound } from "lucide-react";

const menuItems = [
  { to: "/", icon: <Home size={20} />, label: "Inicio" },
  { to: "/clientes", icon: <Users size={20} />, label: "Clientes" },
  { to: "/pedidos", icon: <ShoppingCart size={20} />, label: "Pedidos" },
  { to: "/samples", icon: <FlaskRound size={20} />, label: "Samples" },
  { to: "/productos", icon: <Package size={20} />, label: "Productos" },
  { to: "/consolidacion", icon: <BarChart3 size={20} />, label: "Consolidación" },
  { to: "/facturacion", icon: <FileText size={20} />, label: "Facturación" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    // Limpiar sesión
    localStorage.clear();
    sessionStorage.clear();

    // Redirigir a login externo
    window.location.href = "https://portal.datenbankensoluciones.com.co/";
  };

  return (
    <>
      {/* Barra superior */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg border-b border-slate-700 px-4 sm:px-6 py-3 flex justify-between items-center">

        {/* Logo y título */}
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

        {/* Botón hamburguesa en móviles */}
        <button
          className="md:hidden text-white p-2 rounded-lg hover:bg-slate-700 transition-all duration-200"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Menú en pantallas medianas/grandes - CORREGIDO */}
        <nav className="hidden md:flex gap-1 items-center bg-slate-700/50 rounded-2xl p-1 backdrop-blur-sm">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to !== "/" && location.pathname.startsWith(item.to));
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-lg transform scale-105"
                    : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Separador visual */}
          <div className="w-px h-6 bg-slate-600 mx-2"></div>

          {/* Botón Salir */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span>Salir</span>
          </button>
        </nav>
      </header>

      {/* Menú desplegable en móviles - CORREGIDO */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16">
          {/* Overlay con blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Panel del menú */}
          <nav className="absolute top-0 right-0 w-80 h-full bg-slate-800 border-l border-slate-700 shadow-2xl">
            {/* Header del menú móvil */}
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Menú de Navegación</h2>
              <p className="text-slate-400 text-sm mt-1">Selecciona una opción</p>
            </div>

            {/* Items del menú */}
            <div className="p-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to !== "/" && location.pathname.startsWith(item.to));
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-4 p-4 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive
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

            {/* Botón Salir en móviles */}
            <div className="absolute bottom-6 left-6 right-6">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setTimeout(handleLogout, 300);
                }}
                className="flex items-center justify-center gap-3 w-full p-4 rounded-xl text-base font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Espacio para el contenido principal */}
      <main className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      {/* Efectos de gradiente decorativos */}
      <div className="fixed top-0 left-0 w-72 h-72 bg-purple-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
    </>
  );
}