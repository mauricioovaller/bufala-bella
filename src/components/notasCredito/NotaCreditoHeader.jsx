import React from "react";

export default function NotaCreditoHeader({
  header,
  onChange,
  clientes = [],
  inputRefs = {},
  modoVisualizacion = false,
  onCargarPedidos,
}) {
  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-700">Encabezado Nota Crédito</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Número</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
            {header.numero || "NC-000000"}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Cliente *</label>
          <select
            ref={inputRefs.cliente}
            value={header.clienteId || ""}
            onChange={(e) => onChange("clienteId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={modoVisualizacion}
          >
            <option value="">-- Seleccione --</option>
            {clientes.map((c) => (
              <option key={c.Id_Cliente} value={c.Id_Cliente}>
                {c.Nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha *</label>
          <input
            ref={inputRefs.fecha}
            type="date"
            value={header.fecha || ""}
            onChange={(e) => onChange("fecha", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={modoVisualizacion}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <div className={`border rounded-lg p-2 text-sm font-medium ${
            header.estado === "Anulado" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}>
            {header.estado || "Activo"}
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <label className="block text-sm font-medium text-gray-700">Motivo</label>
        <textarea
          value={header.motivo || ""}
          onChange={(e) => onChange("motivo", e.target.value)}
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={2}
          placeholder="Motivo de la nota credito..."
          disabled={modoVisualizacion}
        />
      </div>

      {/* Boton Cargar Pedidos dentro del encabezado */}
      <div className="flex justify-end border-t pt-4 mt-2">
        <button
          onClick={onCargarPedidos}
          disabled={!header.clienteId || modoVisualizacion}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
            header.clienteId && !modoVisualizacion
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          + Cargar Pedidos
        </button>
      </div>
    </section>
  );
}
