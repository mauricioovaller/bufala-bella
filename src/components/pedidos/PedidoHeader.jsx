import React from "react";

export default function PedidoHeader({
  header,
  onChange,
  clientes = [],
  transportadoras = [],
  bodegas = [],
  regiones = [],
  inputRefs = {},
}) {
  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-700">Encabezado del Pedido</h3>

      {/* Grid principal - MEJORADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Número (readonly) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Número</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
            {header.numero || "PED-000000"}
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

        {/* Región */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Región *</label>
          <select
            ref={inputRefs.region}
            value={header.regionId || ""}
            onChange={(e) => onChange("regionId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {regiones.map((r) => (
              <option key={r.idClienteRegion} value={r.idClienteRegion}>
                {r.region}
              </option>
            ))}
          </select>
        </div>

        {/* Transportadora */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Transportadora</label>
          <select
            ref={inputRefs.transportadora}
            value={header.transportadoraId || ""}
            onChange={(e) => onChange("transportadoraId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {transportadoras.map((t) => (
              <option key={t.Id_Transportadora} value={t.Id_Transportadora}>
                {t.Nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Bodega */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Bodega</label>
          <select
            ref={inputRefs.bodega}
            value={header.bodegaId || ""}
            onChange={(e) => onChange("bodegaId", e.target.value)}
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Seleccione --</option>
            {bodegas.map((b) => (
              <option key={b.Id_Bodega} value={b.Id_Bodega}>
                {b.Descripcion}
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
        
        {/* Fechas adicionales */}
        {[
          ["fechaSalida", "Fecha Salida"],
          ["fechaEnroute", "Fecha Enroute"],
          ["fechaDelivery", "Fecha Delivery"],
          ["fechaIngreso", "Fecha Ingreso"],
        ].map(([key, label]) => (
          <div key={key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <input
              ref={inputRefs[key]}
              type="date"
              value={header[key] || ""}
              onChange={(e) => onChange(key, e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        ))}

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
      </div>

      {/* Comentarios */}
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