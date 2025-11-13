// src/components/facturacion/FiltrosFecha.jsx
import React from "react";

const FiltrosFecha = ({ filtros, onFiltroChange, onBuscar }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <div className="w-1 h-6 sm:h-8 bg-blue-500 rounded-full mr-3"></div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Filtros de Fecha</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Fecha Desde */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Fecha Desde
          </label>
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => onFiltroChange("fechaDesde", e.target.value)}
            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Fecha Hasta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Fecha Hasta
          </label>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => onFiltroChange("fechaHasta", e.target.value)}
            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Botón Buscar */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 opacity-0 sm:opacity-100">
            Buscar
          </label>
          <button 
            onClick={onBuscar}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            Buscar Pedidos
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosFecha;