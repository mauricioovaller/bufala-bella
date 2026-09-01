import React from "react";

function formatCurrency(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);
}

export default function NotaCreditoDetail({
  items,
  onChangeItems,
  productos = [],
  embalajes = [],
}) {
  const updateItem = (index, field, value) => {
    const copy = items.map((it) => ({ ...it }));
    const item = copy[index];
    if (!item) return;

    if (field === "cantidadCredito") {
      const nuevoValor = Math.min(Math.max(parseFloat(value) || 0, 0), item.cantidadOriginal);
      item.cantidadCredito = nuevoValor;
      const proporcion = item.cantidadOriginal > 0 ? nuevoValor / item.cantidadOriginal : 0;
      item.pesoNetoCredito = parseFloat((item.pesoNetoOriginal * proporcion).toFixed(4));
      item.valorCreditoCOP = parseFloat((item.pesoNetoCredito * item.precioUnitario).toFixed(0));
    }

    onChangeItems(copy);
  };

  const totalCajas = items.reduce((s, it) => s + (it.cantidadCredito || 0), 0);
  const totalCOP = items.reduce((s, it) => s + (it.valorCreditoCOP || 0), 0);
  const totalOriginal = items.reduce((s, it) => s + (it.cantidadOriginal || 0), 0);

  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h3 className="text-xl font-semibold text-slate-700">Detalle Nota Credito</h3>
        <span className="text-sm text-gray-500">
          {items.filter((it) => (it.cantidadCredito || 0) > 0).length} de {items.length} items con credito
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Cajas Originales</div>
          <div className="text-lg font-bold text-gray-900">{totalOriginal.toFixed(0)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Cajas a Acreditar</div>
          <div className="text-lg font-bold text-gray-900">{totalCajas.toFixed(0)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Valor Total Nota Credito</div>
          <div className="text-lg font-bold text-red-600">{formatCurrency(totalCOP)}</div>
        </div>
      </div>

      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-left text-gray-700">
                <th className="p-2 border-b font-semibold">Pedido</th>
                <th className="p-2 border-b font-semibold">P.O.</th>
                <th className="p-2 border-b font-semibold">Región</th>
                <th className="p-2 border-b font-semibold">Producto</th>
                <th className="p-2 border-b font-semibold">Embalaje</th>
                <th className="p-2 border-b font-semibold text-center w-20">Cajas Original</th>
                <th className="p-2 border-b font-semibold text-center w-20">Cajas a Acreditar</th>
                <th className="p-2 border-b font-semibold text-right w-24">Precio Unit. Kg.</th>
                <th className="p-2 border-b font-semibold text-right w-32">Valor Credito</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it._key || idx} className={`border-b hover:bg-gray-50 ${(it.cantidadCredito || 0) <= 0 ? "opacity-50" : ""}`}>
                  <td className="p-2 font-medium">
                    PED-{String(it.idEncabPedido || "").padStart(6, "0")}
                  </td>
                  <td className="p-2 text-blue-700 font-medium">{it.purchaseOrder || "-"}</td>
                  <td className="p-2 text-gray-600">{it.region || "-"}</td>
                  <td className="p-2">{it.descripProducto || it.descripcion || ""}</td>
                  <td className="p-2">{it.nombreEmbalaje || ""}</td>
                  <td className="p-2 text-center">{it.cantidadOriginal}</td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max={it.cantidadOriginal}
                      step="1"
                      value={it.cantidadCredito || 0}
                      onChange={(e) => updateItem(idx, "cantidadCredito", e.target.value)}
                      className="border rounded p-1 w-20 text-center text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="p-2 text-right">{formatCurrency(it.precioUnitario || 0)}</td>
                  <td className="p-2 text-right text-red-600 font-medium">
                    {formatCurrency(it.valorCreditoCOP || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50 m-2">
            <p className="text-sm">No hay productos cargados</p>
            <p className="text-xs mt-1">Use el boton "Cargar Pedidos" del encabezado para cargar productos</p>
          </div>
        )}
      </div>

      <div className="md:hidden space-y-3">
        {items.map((it, idx) => (
          <div key={it._key || idx} className={`border rounded-lg p-4 shadow-sm ${(it.cantidadCredito || 0) <= 0 ? "opacity-50 bg-gray-50" : "bg-white"}`}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm">
                  PED-{String(it.idEncabPedido || "").padStart(6, "0")}
                </p>
                <span className="text-sm font-bold text-red-600">{formatCurrency(it.valorCreditoCOP || 0)}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-700 font-medium">PO: {it.purchaseOrder || "-"}</span>
                <span className="text-gray-500">Reg: {it.region || "-"}</span>
              </div>
              <p className="text-sm">{it.descripProducto || it.descripcion || ""}</p>
              <p className="text-xs text-gray-500">{it.nombreEmbalaje || ""}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cajas Original</label>
                  <p className="text-sm font-medium">{it.cantidadOriginal}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cajas a Acreditar</label>
                  <input
                    type="number"
                    min="0"
                    max={it.cantidadOriginal}
                    step="1"
                    value={it.cantidadCredito || 0}
                    onChange={(e) => updateItem(idx, "cantidadCredito", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded">
                <div className="text-center">
                  <div className="text-gray-600">Precio Kg.</div>
                  <div className="font-medium">{formatCurrency(it.precioUnitario || 0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Valor Credito</div>
                  <div className="font-medium text-red-600">{formatCurrency(it.valorCreditoCOP || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
            <p>No hay productos cargados</p>
          </div>
        )}
      </div>
    </section>
  );
}
