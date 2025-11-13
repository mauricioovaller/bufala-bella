import React, { useState, useEffect } from "react";

export default function PedidoHeaderSample({
  header,
  onChange,
  clientes = [],
  transportadoras = [],
  bodegas = [],
  aerolineas = [],
  agencias = [],
  inputRefs = {},
}) {
  const [modoCliente, setModoCliente] = useState("select"); // "select" o "manual"
  const [textoAdicional, setTextoAdicional] = useState("");

  // Cuando se selecciona un cliente del dropdown
  const handleClienteSelect = (clienteId) => {
    const clienteSeleccionado = clientes.find(c => String(c.Id_Cliente) === String(clienteId));
    if (clienteSeleccionado) {
      // Combinar nombre del cliente + texto adicional
      const textoFinal = clienteSeleccionado.Nombre + (textoAdicional ? ` - ${textoAdicional}` : "");
      onChange("clienteTexto", textoFinal);
      onChange("clienteId", clienteId);
    } else {
      onChange("clienteTexto", "");
      onChange("clienteId", "");
    }
  };

  // Cuando se cambia el texto adicional
  const handleTextoAdicionalChange = (texto) => {
    setTextoAdicional(texto);
    
    // Si hay un cliente seleccionado, actualizar el texto final
    if (header.clienteId) {
      const clienteSeleccionado = clientes.find(c => String(c.Id_Cliente) === String(header.clienteId));
      if (clienteSeleccionado) {
        const textoFinal = clienteSeleccionado.Nombre + (texto ? ` - ${texto}` : "");
        onChange("clienteTexto", textoFinal);
      }
    }
  };

  // Cuando se escribe manualmente
  const handleClienteManualChange = (texto) => {
    onChange("clienteTexto", texto);
    onChange("clienteId", ""); // Limpiar ID cuando es manual
    setTextoAdicional(""); // Limpiar texto adicional
  };

  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-700">Encabezado de Muestra/Sample</h3>

      {/* PRIMERA FILA - 4 campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Número (readonly) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Número</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
            {header.numero || "SAMP-000000"}
          </div>
        </div>

        {/* Cliente/Destinatario MEJORADO */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Cliente/Destinatario *
            </label>
            <button
              type="button"
              onClick={() => setModoCliente(modoCliente === "select" ? "manual" : "select")}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
            >
              {modoCliente === "select" ? "↳ Escribir manualmente" : "↳ Seleccionar cliente"}
            </button>
          </div>

          {modoCliente === "select" ? (
            // MODO SELECT - con posibilidad de agregar texto
            <div className="space-y-2">
              <select
                ref={inputRefs.cliente}
                value={header.clienteId || ""}
                onChange={(e) => handleClienteSelect(e.target.value)}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">-- Seleccione un cliente --</option>
                {clientes.map((c) => (
                  <option key={c.Id_Cliente} value={c.Id_Cliente}>
                    {c.Nombre}
                  </option>
                ))}
              </select>
              
              {/* Campo para texto adicional */}
              {header.clienteId && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textoAdicional}
                    onChange={(e) => handleTextoAdicionalChange(e.target.value)}
                    className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Agregar texto adicional (opcional)..."
                  />
                </div>
              )}

              {/* Texto final que se guardará */}
              {header.clienteTexto && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                  <strong>Se guardará:</strong> {header.clienteTexto}
                </div>
              )}
            </div>
          ) : (
            // MODO MANUAL - escribir libremente
            <div className="space-y-2">
              <input
                type="text"
                value={header.clienteTexto || ""}
                onChange={(e) => handleClienteManualChange(e.target.value)}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Escribir destinatario manualmente..."
              />
              <div className="text-xs text-gray-500">
                Escribe directamente el nombre del destinatario
              </div>
            </div>
          )}
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
      </div>

      {/* SEGUNDA FILA - 6 campos (PO + 5 fechas) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
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

        {/* Fecha Ingreso */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Fecha Ingreso QB</label>
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

        {/* Campo extra para completar 6 (puede ser vacío o útil en el futuro) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Extra</label>
          <div className="border rounded-lg p-2 bg-gray-50 text-sm text-gray-500">
            Disponible
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