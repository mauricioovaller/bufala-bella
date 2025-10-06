import React, { useEffect } from "react";

function formatCurrency(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(v || 0);
}

export default function PedidoDetail({
  items,
  onChangeItems,
  productos = [],
  embalajes = [],
  itemRefsRef,
}) {

  // Efecto para recalcular campos cuando cambian items, productos o embalajes
  useEffect(() => {
    const recalculatedItems = items.map(item => {
      // Convertir campos a string para consistencia
      const productoStr = String(item.producto || "");
      const embalajeStr = String(item.embalaje || "");
      
      // Si ya tenemos todos los datos calculados, no recalcular
      if (item.pesoNeto !== undefined && item.pesoNeto !== 0 &&
        item.pesoBruto !== undefined && item.pesoBruto !== 0) {
        return item;
      }

      // Buscar información actualizada del producto
      const productoInfo = productos.find(
        p => String(p.Id_Producto) === String(item.producto)
      );

      // Buscar información actualizada del embalaje
      const embalajeInfo = embalajes.find(
        e => String(e.Id_Embalaje) === String(item.embalaje)
      );

      const cantidad = item.cantidad || 0;
      const precio = item.precio || 0;
      const pesoGr = productoInfo?.PesoGr || item.pesoGr || 0;
      const factorPesoBruto = productoInfo?.FactorPesoBruto || item.factorPesoBruto || 0;
      const cantidadEmbalaje = embalajeInfo?.Cantidad || item.cantidadEmbalaje || 0;

      // Recalcular
      const pesoNeto = ((cantidad * cantidadEmbalaje * pesoGr) / 1000) || 0;
      const pesoBruto = ((cantidad * cantidadEmbalaje * pesoGr * factorPesoBruto) / 1000) || 0;
      const subtotal = pesoNeto * precio;

      return {
        ...item,
        producto: productoStr,
        embalaje: embalajeStr,
        pesoGr,
        factorPesoBruto,
        cantidadEmbalaje,
        pesoNeto,
        pesoBruto,
        subtotal,
      };
    });

    // Solo actualizar si hubo cambios
    const needsUpdate = recalculatedItems.some((newItem, index) => {
      const oldItem = items[index];
      return newItem.pesoNeto !== oldItem.pesoNeto ||
        newItem.pesoBruto !== oldItem.pesoBruto ||
        newItem.subtotal !== oldItem.subtotal;
    });

    if (needsUpdate) {
      onChangeItems(recalculatedItems);
    }
  }, [items, productos, embalajes, onChangeItems]);

  function addItem() {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem = {
      id,
      producto: "",
      descripcion: "",
      embalaje: "",
      cantidad: 1,
      precio: 0,
      pesoNeto: 0,
      pesoBruto: 0,
      subtotal: 0,
      pesoGr: 0,
      cantidadEmbalaje: 0,
    };
    onChangeItems([...items, newItem]);
  }

  function removeItem(index) {
    const copy = items.slice();
    copy.splice(index, 1);
    onChangeItems(copy);
  }

  function updateItem(index, field, value) {
    console.log("updateItem", { index, field, value });
    const copy = items.map((it) => ({ ...it }));
    const item = copy[index];
    if (!item) return;

    if (field === "producto") {
      const prod = productos.find((p) => String(p.Id_Producto) === String(value));
      if (prod) {
        item.producto = prod.Id_Producto;
        item.descripcion = prod.DescripFactura || "";
        item.pesoGr = prod.PesoGr || 0;
        item.factorPesoBruto = prod.FactorPesoBruto || 0;
      } else {
        item.producto = "";
        item.descripcion = "";
        item.pesoGr = 0;
        item.factorPesoBruto = 0;
      }
    } else if (field === "embalaje") {
      const emb = embalajes.find((e) => String(e.Id_Embalaje) === String(value));
      if (emb) {
        item.embalaje = emb.Id_Embalaje;
        item.cantidadEmbalaje = emb.Cantidad || 0;
      } else {
        item.embalaje = "";
        item.cantidadEmbalaje = 0;
      }
    } else if (["cantidad", "precio"].includes(field)) {
      item[field] = Number(value || 0);
    } else {
      item[field] = value;
    }

    // Calcular subtotal y peso
    item.pesoNeto =
      ((item.cantidad || 0) * (item.cantidadEmbalaje || 0) * (item.pesoGr || 0)) / 1000;
    item.pesoBruto =
      ((item.cantidad || 0) * (item.cantidadEmbalaje || 0) * (item.pesoGr || 0) * (item.factorPesoBruto || 0)) / 1000;
    item.subtotal = item.pesoNeto * (item.precio || 0);

    onChangeItems(copy);
  }

  const totalCajas = items.reduce((s, it) => s + Number(it.cantidad || 0), 0);
  const totalValor = items.reduce((s, it) => s + Number(it.subtotal || 0), 0);
  const totalPesoNeto = items.reduce((s, it) => s + Number(it.pesoNeto || 0), 0);
  const totalPesoBruto = items.reduce((s, it) => s + Number(it.pesoBruto || 0), 0);

  return (
    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h3 className="text-xl font-semibold text-slate-700">Detalle del Pedido</h3>
        <button
          type="button"
          onClick={addItem}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium text-sm sm:text-base"
        >
          + Agregar Producto
        </button>
      </div>

      {/* Totales - NUEVO DISEÑO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Cajas</div>
          <div className="text-lg font-bold text-gray-900">{totalCajas}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Peso Neto (Kg)</div>
          <div className="text-lg font-bold text-gray-900">{totalPesoNeto.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Peso Bruto (Kg)</div>
          <div className="text-lg font-bold text-gray-900">{totalPesoBruto.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 font-medium">Total Valor</div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(totalValor)}</div>
        </div>
      </div>

      {/* Tabla Desktop - CON SCROLL VERTICAL */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-y-auto max-h-96"> {/* 👈 SCROLL VERTICAL AQUÍ */}
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="text-left text-gray-700">
                <th className="p-2 border-b font-semibold">Producto</th>
                <th className="p-2 border-b font-semibold">Descripción</th>
                <th className="p-2 border-b font-semibold">Embalaje</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Cajas</th>
                <th className="p-2 border-b font-semibold w-28 text-right">Precio Unit. Kg.</th>
                <th className="p-2 border-b font-semibold w-24 text-right">Peso Neto Kg.</th>
                <th className="p-2 border-b font-semibold w-24 text-right">Peso Bruto Kg.</th>
                <th className="p-2 border-b font-semibold w-32 text-right">Valor Registro</th>
                <th className="p-2 border-b font-semibold w-20 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className="border-b hover:bg-gray-50">
                  {/* Producto */}
                  <td className="p-2">
                    <select
                      value={it.producto}
                      onChange={(e) => updateItem(idx, "producto", e.target.value)}
                      ref={(el) => {
                        if (itemRefsRef) itemRefsRef.current[idx] = el;
                      }}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {productos.map((p) => (
                        <option key={p.Id_Producto} value={p.Id_Producto}>
                          {p.DescripProducto} - {p.Codigo_Siesa}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Descripción */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={it.descripcion}
                      onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* Embalaje */}
                  <td className="p-2">
                    <select
                      value={it.embalaje}
                      onChange={(e) => updateItem(idx, "embalaje", e.target.value)}
                      className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccione...</option>
                      {embalajes.map((e) => (
                        <option key={e.Id_Embalaje} value={e.Id_Embalaje}>
                          {e.Descripcion} ({e.Cantidad})
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Cantidad */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={it.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", e.target.value)}
                      className="border rounded p-1 w-full text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* Precio */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={it.precio}
                      onChange={(e) => updateItem(idx, "precio", e.target.value)}
                      className="border rounded p-1 w-full text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>

                  {/* Peso Neto */}
                  <td className="p-2 text-right text-gray-700 font-medium">
                    {it.pesoNeto.toFixed(2)}
                  </td>

                  {/* Peso Bruto */}
                  <td className="p-2 text-right text-gray-700 font-medium">
                    {it.pesoBruto.toFixed(2)}
                  </td>

                  {/* Subtotal */}
                  <td className="p-2 text-right text-green-600 font-medium">
                    {formatCurrency(it.subtotal.toFixed(2))}
                  </td>

                  {/* Acciones */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50 m-2">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
              </svg>
            </div>
            <p className="text-sm">No hay productos en el detalle</p>
            <p className="text-xs mt-1">Haga clic en "Agregar Producto" para comenzar</p>
          </div>
        )}
      </div>

      {/* Vista Mobile - MEJORADA */}
      <div className="md:hidden space-y-3">
        {items.map((it, idx) => (
          <div key={it.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Producto</label>
                <select
                  value={it.producto}
                  onChange={(e) => updateItem(idx, "producto", e.target.value)}
                  className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {productos.map((p) => (
                    <option key={p.Id_Producto} value={p.Id_Producto}>
                      {p.DescripProducto} - {p.Codigo_Siesa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={it.descripcion}
                  className="border rounded p-2 w-full text-sm bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Embalaje</label>
                <select
                  value={it.embalaje}
                  onChange={(e) => updateItem(idx, "embalaje", e.target.value)}
                  className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione...</option>
                  {embalajes.map((e) => (
                    <option key={e.Id_Embalaje} value={e.Id_Embalaje}>
                      {e.Descripcion} ({e.Cantidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cajas</label>
                  <input
                    type="number"
                    value={it.cantidad}
                    onChange={(e) => updateItem(idx, "cantidad", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Precio Unit. Kg.</label>
                  <input
                    type="number"
                    value={it.precio}
                    onChange={(e) => updateItem(idx, "precio", e.target.value)}
                    className="border rounded p-2 w-full text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded">
                <div className="text-center">
                  <div className="text-gray-600">Peso Neto</div>
                  <div className="font-medium">{it.pesoNeto.toFixed(2)} Kg</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Peso Bruto</div>
                  <div className="font-medium">{it.pesoBruto.toFixed(2)} Kg</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Subtotal</div>
                  <div className="font-medium text-green-600">{formatCurrency(it.subtotal)}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-red-600 hover:text-red-800 text-xs font-medium bg-red-50 hover:bg-red-100 px-3 py-2 rounded transition w-full"
              >
                Eliminar Producto
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
            <p>No hay productos en el detalle</p>
          </div>
        )}
      </div>
    </section>
  );
}