//src/components/pedidos/PedidoChileHeader.jsx
import React from "react";

export default function PedidoChileHeader({
  header,
  onChange,
  clientes = [],
  aerolineas = [],
  agencias = [],
  inputRefs = {},
  comentariosSeleccionados = {},
  onComentariosChange,
}) {
  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-700">Encabezado del Pedido Chile</h3>

      {/* PRIMERA FILA - 3 campos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Número (readonly) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Número</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
            {header.numero || "CHI-000000"}
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Cliente *</label>
          <select
            ref={inputRefs.cliente}
            value={header.clienteId || ""}
            onChange={(e) => onChange("clienteId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {clientes.map((c) => (
              <option key={c.Id_Cliente} value={c.Id_Cliente}>
                {c.Nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase Order */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Purchase Order</label>
          <input
            ref={inputRefs.purchaseOrder}
            value={header.purchaseOrder || ""}
            onChange={(e) => onChange("purchaseOrder", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Ingrese PO"
          />
        </div>
      </div>

      {/* SEGUNDA FILA - 5 fechas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {/* Fecha Orden */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Orden *</label>
          <input
            ref={inputRefs.fechaOrden}
            type="date"
            value={header.fechaOrden || ""}
            onChange={(e) => onChange("fechaOrden", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha Salida */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Salida</label>
          <input
            ref={inputRefs.fechaSalida}
            type="date"
            value={header.fechaSalida || ""}
            onChange={(e) => onChange("fechaSalida", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha Enroute */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Enroute</label>
          <input
            ref={inputRefs.fechaEnroute}
            type="date"
            value={header.fechaEnroute || ""}
            onChange={(e) => onChange("fechaEnroute", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha Delivery */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Delivery</label>
          <input
            ref={inputRefs.fechaDelivery}
            type="date"
            value={header.fechaDelivery || ""}
            onChange={(e) => onChange("fechaDelivery", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Fecha INVIMA */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha INVIMA</label>
          <input
            ref={inputRefs.fechaIngreso}
            type="date"
            value={header.fechaIngreso || ""}
            onChange={(e) => onChange("fechaIngreso", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* TERCERA FILA - 6 campos (Estibas + 5 campos de transporte) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        {/* Cantidad Estibas */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Cantidad Estibas</label>
          <input
            ref={inputRefs.cantidadEstibas}
            type="number"
            value={header.cantidadEstibas || ""}
            onChange={(e) => onChange("cantidadEstibas", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            min="1"
          />
        </div>

        {/* Aerolínea */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Aerolínea</label>
          <select
            ref={inputRefs.aerolineaId}
            value={header.aerolineaId || ""}
            onChange={(e) => onChange("aerolineaId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {aerolineas.map((a) => (
              <option key={a.IdAerolinea} value={a.IdAerolinea}>
                {a.Nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Agencia */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Agencia</label>
          <select
            ref={inputRefs.agenciaId}
            value={header.agenciaId || ""}
            onChange={(e) => onChange("agenciaId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {agencias.map((a) => (
              <option key={a.IdAgencia} value={a.IdAgencia}>
                {a.Nombre}
              </option>
            ))}
          </select>
        </div>

        {/* No. Guía */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">No. Guía (Master)</label>
          <input
            ref={inputRefs.noGuia}
            value={header.noGuia || ""}
            onChange={(e) => onChange("noGuia", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Número de guía"
          />
        </div>

        {/* Guía Hija */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Guía Hija</label>
          <input
            type="text"
            value={header.guiaHija || ""}
            onChange={(e) => onChange("guiaHija", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Guía hija"
          />
        </div>

        {/* 👇 NUEVO: Checkboxes en lugar del campo "Extra" */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Comentarios PDF</label>
          <div className="border rounded-lg p-2 bg-white space-y-2">
            {/* Checkbox Comentario Primario */}
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={comentariosSeleccionados.incluirPrimario || false}
                onChange={(e) => onComentariosChange("incluirPrimario", e.target.checked)}
                className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">Incluir Primario</span>
            </label>
            
            {/* Checkbox Comentario Secundario */}
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={comentariosSeleccionados.incluirSecundario || false}
                onChange={(e) => onComentariosChange("incluirSecundario", e.target.checked)}
                className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">Incluir Secundario</span>
            </label>
          </div>
        </div>
      </div>

      {/* Comentarios - full width */}
      <div className="mt-6 space-y-1">
        <label className="block text-sm font-medium text-gray-700">Comentarios</label>
        <textarea
          value={header.comentarios || ""}
          onChange={(e) => onChange("comentarios", e.target.value)}
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          rows={3}
          placeholder="Observaciones adicionales..."
        />
      </div>
    </section>
  );
}