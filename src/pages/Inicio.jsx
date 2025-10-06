import React from "react";

export default function Inicio() {
  // Datos de ejemplo para las métricas
  const metricas = [
    { 
      titulo: "Pedidos del Mes", 
      valor: "24", 
      cambio: "+12%", 
      tendencia: "alta",
      icono: "📦",
      color: "blue"
    },
    { 
      titulo: "Clientes Activos", 
      valor: "18", 
      cambio: "+5%", 
      tendencia: "alta",
      icono: "👥",
      color: "green"
    },
    { 
      titulo: "Productos Stock", 
      valor: "156", 
      cambio: "-2%", 
      tendencia: "baja",
      icono: "📊",
      color: "purple"
    },
    { 
      titulo: "Facturación Mensual", 
      valor: "$45.2M", 
      cambio: "+8%", 
      tendencia: "alta",
      icono: "💰",
      color: "orange"
    }
  ];

  // Actividades recientes
  const actividades = [
    { id: 1, accion: "Nuevo pedido creado", usuario: "Juan Pérez", tiempo: "Hace 5 min", tipo: "pedido" },
    { id: 2, accion: "Cliente actualizado", usuario: "María García", tiempo: "Hace 15 min", tipo: "cliente" },
    { id: 3, accion: "Producto agregado", usuario: "Carlos López", tiempo: "Hace 1 hora", tipo: "producto" },
    { id: 4, accion: "Pedido completado", usuario: "Ana Rodríguez", tiempo: "Hace 2 horas", tipo: "pedido" }
  ];

  // Acciones rápidas
  const accionesRapidas = [
    { titulo: "Crear Pedido", descripcion: "Registrar nuevo pedido", ruta: "/pedidos", icono: "➕", color: "bg-blue-500" },
    { titulo: "Gestionar Clientes", descripcion: "Administrar clientes", ruta: "/clientes", icono: "👥", color: "bg-green-500" },
    { titulo: "Inventario", descripcion: "Ver productos", ruta: "/productos", icono: "📦", color: "bg-purple-500" },
    { titulo: "Reportes", descripcion: "Generar reportes", ruta: "/reportes", icono: "📊", color: "bg-orange-500" }
  ];

  return (
    <div className="space-y-6">
      {/* Header de Bienvenida */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">Bienvenido de vuelta 👋</h1>
            <p className="text-slate-600">Aquí tienes un resumen de tu actividad reciente.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-sm text-slate-500">Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map((metrica, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`text-2xl ${metrica.color === 'blue' ? 'bg-blue-100' : metrica.color === 'green' ? 'bg-green-100' : metrica.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'} p-3 rounded-lg`}>
                {metrica.icono}
              </div>
              <span className={`text-sm font-medium ${metrica.tendencia === 'alta' ? 'text-green-600' : 'text-red-600'} bg-${metrica.tendencia === 'alta' ? 'green' : 'red'}-50 px-2 py-1 rounded-full`}>
                {metrica.cambio}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{metrica.titulo}</h3>
            <p className="text-2xl font-bold text-slate-900">{metrica.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividades Recientes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Actividad Reciente</h2>
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">Últimas 24h</span>
          </div>
          <div className="space-y-4">
            {actividades.map((actividad) => (
              <div key={actividad.id} className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                  actividad.tipo === 'pedido' ? 'bg-blue-500' : 
                  actividad.tipo === 'cliente' ? 'bg-green-500' : 
                  'bg-purple-500'
                }`}>
                  {actividad.tipo === 'pedido' ? '📦' : actividad.tipo === 'cliente' ? '👥' : '📊'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{actividad.accion}</p>
                  <p className="text-xs text-slate-500">por {actividad.usuario}</p>
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {actividad.tiempo}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border border-dashed border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
            Ver toda la actividad
          </button>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accionesRapidas.map((accion, index) => (
              <button
                key={index}
                className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
              >
                <div className={`${accion.color} text-white p-2 rounded-lg text-lg group-hover:scale-110 transition-transform`}>
                  {accion.icono}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">{accion.titulo}</h3>
                  <p className="text-sm text-slate-600">{accion.descripcion}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Estado del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-slate-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">100%</div>
            <div className="text-sm text-slate-600">Disponibilidad</div>
          </div>
          <div className="text-center p-4 border border-slate-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">2.3s</div>
            <div className="text-sm text-slate-600">Tiempo Respuesta</div>
          </div>
          <div className="text-center p-4 border border-slate-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">1.2K</div>
            <div className="text-sm text-slate-600">Sesiones Hoy</div>
          </div>
        </div>
      </div>
    </div>
  );
}