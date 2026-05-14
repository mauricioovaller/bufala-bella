// src/components/pedidosChile/PedidoChileHeader.jsx
import React from "react";

export default function PedidoChileHeader({
    header,
    onChange,
    clientesChile = [],
    agencias = [],
    aerolineas = [],
    inputRefs = {},
    comentariosSeleccionados = {},
    onComentariosChange,
}) {
    return (
        <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">Encabezado del Pedido</h3>

            {/* PRIMERA FILA - 5 campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
                {/* Número (readonly) */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Número</label>
                    <div className="border rounded-lg p-2 bg-gray-50 text-sm font-medium text-gray-900">
                        {header.numero || "CHI-000000"}
                    </div>
                </div>

                {/* Cliente Chile */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                    <select
                        ref={inputRefs.clienteId}
                        value={header.clienteId || ""}
                        onChange={(e) => onChange("clienteId", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="">-- Seleccione --</option>
                        {clientesChile.map((c) => (
                            <option key={c.Id_ClienteChile} value={c.Id_ClienteChile}>
                                {c.Nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Número de Orden */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Número de Orden</label>
                    <input
                        value={header.numeroOrden || ""}
                        onChange={(e) => onChange("numeroOrden", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Ej: 488"
                    />
                </div>

                {/* Guía Aérea AWB */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Guía Aérea AWB No.</label>
                    <input
                        value={header.guiaAerea || ""}
                        onChange={(e) => onChange("guiaAerea", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Número de guía aérea"
                    />
                </div>

                {/* Factura No. FEX */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Factura No. FEX-</label>
                    <input
                        value={header.facturaNo || ""}
                        onChange={(e) => onChange("facturaNo", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="FEX-"
                    />
                </div>
            </div>

            {/* SEGUNDA FILA - 6 campos (fechas) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                {/* Fecha Recepción Orden */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Fecha Orden *</label>
                    <input
                        ref={inputRefs.fechaRecepcionOrden}
                        type="date"
                        value={header.fechaRecepcionOrden || ""}
                        onChange={(e) => onChange("fechaRecepcionOrden", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* Fecha Salida */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Fecha Salida</label>
                    <input
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
                        type="date"
                        value={header.fechaDelivery || ""}
                        onChange={(e) => onChange("fechaDelivery", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* Fecha Solicitud Entrega (El Dorado) */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Fecha Solicitud Entrega (El Dorado)</label>
                    <input
                        type="date"
                        value={header.fechaSolicitudEntrega || ""}
                        onChange={(e) => onChange("fechaSolicitudEntrega", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* Fecha Final Entrega Cliente */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Fecha Final Entrega Cliente</label>
                    <input
                        type="date"
                        value={header.fechaFinalEntrega || ""}
                        onChange={(e) => onChange("fechaFinalEntrega", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* TERCERA FILA - 6 campos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                {/* Cantidad Estibas */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Cantidad Estibas</label>
                    <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={header.cantidadEstibas || 1}
                        onChange={(e) => onChange("cantidadEstibas", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* Aerolínea */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Aerolínea</label>
                    <select
                        value={header.idAerolinea || ""}
                        onChange={(e) => onChange("idAerolinea", e.target.value)}
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

                {/* Agencia Carga Colombia */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Agencia Carga Colombia</label>
                    <select
                        value={header.idAgencia || ""}
                        onChange={(e) => onChange("idAgencia", e.target.value)}
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

                {/* Descuento Comercial */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Descuento Comercial ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={header.descuentoComercial || 0}
                        onChange={(e) => onChange("descuentoComercial", e.target.value)}
                        className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                {/* Comentarios PDF */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Comentarios PDF</label>
                    <div className="border rounded-lg p-2 bg-white space-y-2">
                        <label className="flex items-center space-x-2 text-xs">
                            <input
                                type="checkbox"
                                checked={comentariosSeleccionados.incluirPrimario || false}
                                onChange={(e) => onComentariosChange?.("incluirPrimario", e.target.checked)}
                                className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">Incluir Primario</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs">
                            <input
                                type="checkbox"
                                checked={comentariosSeleccionados.incluirSecundario || false}
                                onChange={(e) => onComentariosChange?.("incluirSecundario", e.target.checked)}
                                className="w-3 h-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">Incluir Secundario</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Observaciones - full width */}
            <div className="mt-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                    value={header.observaciones || ""}
                    onChange={(e) => onChange("observaciones", e.target.value)}
                    rows={3}
                    className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Observaciones adicionales..."
                />
            </div>
        </section>
    );
}
