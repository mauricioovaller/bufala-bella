// src/components/pedidosChile/PedidoChileDetail.jsx
import React from "react";

// ── Fórmulas de cálculo ───────────────────────────────────────────────────────
function calcularItem(item) {
    const cantCajas = parseFloat(item.cantidadCajas) || 0;
    const envase = parseFloat(item.envaseInternoxCaja) || 0;
    const pesoNetoGr = parseFloat(item.pesoNetoGr) || 0;
    const pesoEscurridoKg = parseFloat(item.pesoEscurridoKg) || 0;
    const factorPesoBruto = parseFloat(item.factorPesoBruto) || 0;
    const valorxKilo = parseFloat(item.valorxKilo) || 0;

    const unidadesSolicitadas = cantCajas * envase;
    const pesoEscurridoxCaja = pesoEscurridoKg * envase;
    const pesoEscurridoTotal = pesoEscurridoxCaja * cantCajas;
    const pesoNetoTotal = (pesoNetoGr / 1000) * unidadesSolicitadas;
    const pesoBrutoTotal = pesoNetoTotal * factorPesoBruto;
    const valorTotal = pesoEscurridoTotal * valorxKilo;

    return {
        ...item,
        unidadesSolicitadas: +unidadesSolicitadas.toFixed(4),
        pesoEscurridoxCaja: +pesoEscurridoxCaja.toFixed(4),
        pesoEscurridoTotal: +pesoEscurridoTotal.toFixed(4),
        pesoNetoTotal: +pesoNetoTotal.toFixed(4),
        pesoBrutoTotal: +pesoBrutoTotal.toFixed(4),
        valorTotal: +valorTotal.toFixed(4),
    };
}



// ── Componente ────────────────────────────────────────────────────────────────
export default function PedidoChileDetail({
    items,
    onChangeItems,
    productosChile = [],
}) {
    // ── Agregar / eliminar ────────────────────────────────────────────────────
    function addItem() {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        onChangeItems([
            ...items,
            {
                id,
                productoId: "", descripcion: "", codigoCliente: "", codigoSiesa: "",
                lote: "", fechaElaboracion: "", fechaVencimiento: "",
                pesoNetoGr: 0, cantidadCajas: 0, envaseInternoxCaja: 0,
                pesoEscurridoKg: 0, factorPesoBruto: 0, valorxKilo: 0,
                unidadesSolicitadas: 0, pesoEscurridoxCaja: 0, pesoEscurridoTotal: 0,
                pesoNetoTotal: 0, pesoBrutoTotal: 0, valorTotal: 0,
            },
        ]);
    }

    function removeItem(index) {
        const copy = items.slice();
        copy.splice(index, 1);
        onChangeItems(copy);
    }

    function updateItem(index, field, value) {
        const copy = items.map((it) => ({ ...it }));
        const item = copy[index];
        if (!item) return;

        if (field === "productoId") {
            const prod = productosChile.find(
                (p) => String(p.Id_ProductoChile) === String(value)
            );
            if (prod) {
                item.productoId = String(prod.Id_ProductoChile);
                item.descripcion = prod.DescripProducto || "";
                item.codigoCliente = prod.CodigoCliente || "";
                item.codigoSiesa = prod.CodigoSiesa || "";
                item.pesoNetoGr = parseFloat(prod.PesoNetoGr) || 0;
                item.pesoEscurridoKg = parseFloat(prod.PesoEscurridoKg) || 0;
                item.envaseInternoxCaja = parseInt(prod.EnvaseInternoxCaja) || 0;
                item.factorPesoBruto = parseFloat(prod.FactorPesoBruto) || 0;
                item.valorxKilo = parseFloat(prod.PrecioXKilo) || 0;
            } else {
                item.productoId = ""; item.descripcion = ""; item.codigoCliente = "";
                item.codigoSiesa = ""; item.pesoNetoGr = 0; item.pesoEscurridoKg = 0;
                item.envaseInternoxCaja = 0; item.factorPesoBruto = 0; item.valorxKilo = 0;
            }
        } else {
            item[field] = value;
        }

        copy[index] = calcularItem(item);
        onChangeItems(copy);
    }

    // ── Totales ───────────────────────────────────────────────────────────────
    const totalCajas = items.reduce((s, it) => s + (parseFloat(it.cantidadCajas) || 0), 0);
    const totalPesoNeto = items.reduce((s, it) => s + (parseFloat(it.pesoNetoTotal) || 0), 0);
    const totalPesoBruto = items.reduce((s, it) => s + (parseFloat(it.pesoBrutoTotal) || 0), 0);
    const totalValor = items.reduce((s, it) => s + (parseFloat(it.valorTotal) || 0), 0);

    const fmt = (n, dec = 4) =>
        n !== undefined && n !== null && n !== "" ? parseFloat(n).toFixed(dec) : "0";

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

            {/* ── Barra de totales ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                <div className="text-center">
                    <div className="text-xs text-gray-600 font-medium">Total Cajas</div>
                    <div className="text-lg font-bold text-gray-900">{totalCajas}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-600 font-medium">Peso Neto (Kg)</div>
                    <div className="text-lg font-bold text-gray-900">{totalPesoNeto.toFixed(4)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-600 font-medium">Peso Bruto (Kg)</div>
                    <div className="text-lg font-bold text-gray-900">{totalPesoBruto.toFixed(4)}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-600 font-medium">Valor Total (USD)</div>
                    <div className="text-lg font-bold text-green-600">$ {totalValor.toFixed(4)}</div>
                </div>
            </div>

            {/* ── Tabla Desktop ── */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-96">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr className="text-left text-gray-700">
                                <th className="p-2 border-b font-semibold">Producto</th>
                                <th className="p-2 border-b font-semibold">Descripción</th>
                                <th className="p-2 border-b font-semibold">Cód. Cliente</th>
                                <th className="p-2 border-b font-semibold">Cód. SIESA</th>
                                <th className="p-2 border-b font-semibold">Lote</th>
                                <th className="p-2 border-b font-semibold">Fecha Elab.</th>
                                <th className="p-2 border-b font-semibold">Fecha Venc.</th>
                                <th className="p-2 border-b font-semibold w-20 text-center">Cant. Cajas</th>
                                <th className="p-2 border-b font-semibold w-16 text-center">Env./Caja</th>
                                <th className="p-2 border-b font-semibold w-24 text-right">Valor/Kilo</th>
                                <th className="p-2 border-b font-semibold w-20 text-right">Unid. Sol.</th>
                                <th className="p-2 border-b font-semibold w-28 text-right">Peso Esc./Un (Kg)</th>
                                <th className="p-2 border-b font-semibold w-24 text-right">Peso Esc./Caja</th>
                                <th className="p-2 border-b font-semibold w-24 text-right">Peso Esc. Total</th>
                                <th className="p-2 border-b font-semibold w-24 text-right">Peso Neto (Kg)</th>
                                <th className="p-2 border-b font-semibold w-24 text-right">Peso Bruto (Kg)</th>
                                <th className="p-2 border-b font-semibold w-28 text-right">Valor Total (USD)</th>
                                <th className="p-2 border-b font-semibold w-20 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={it.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">
                                        <select
                                            value={it.productoId || ""}
                                            onChange={(e) => updateItem(idx, "productoId", e.target.value)}
                                            className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
                                        >
                                            <option value="">Seleccione...</option>
                                            {productosChile.map((p) => (
                                                <option key={p.Id_ProductoChile} value={p.Id_ProductoChile}>
                                                    {p.DescripProducto}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={it.descripcion || ""}
                                            onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                                            className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                                        />
                                    </td>
                                    <td className="p-2 text-gray-500 whitespace-nowrap">{it.codigoCliente || "—"}</td>
                                    <td className="p-2 text-gray-500 whitespace-nowrap">{it.codigoSiesa || "—"}</td>
                                    <td className="p-2">
                                        <input
                                            value={it.lote || ""}
                                            onChange={(e) => updateItem(idx, "lote", e.target.value)}
                                            className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[70px]"
                                            placeholder="Lote"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="date"
                                            value={it.fechaElaboracion || ""}
                                            onChange={(e) => updateItem(idx, "fechaElaboracion", e.target.value)}
                                            className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="date"
                                            value={it.fechaVencimiento || ""}
                                            onChange={(e) => updateItem(idx, "fechaVencimiento", e.target.value)}
                                            className="border rounded p-1 w-full text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.5"
                                            value={it.cantidadCajas || ""}
                                            onChange={(e) => updateItem(idx, "cantidadCajas", e.target.value)}
                                            className="border rounded p-1 w-full text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="1"
                                            value={it.envaseInternoxCaja || ""}
                                            onChange={(e) => updateItem(idx, "envaseInternoxCaja", e.target.value)}
                                            className="border rounded p-1 w-full text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.0001"
                                            value={it.valorxKilo || ""}
                                            onChange={(e) => updateItem(idx, "valorxKilo", e.target.value)}
                                            className="border rounded p-1 w-full text-xs text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="p-2 text-right text-gray-600">{fmt(it.unidadesSolicitadas, 0)}</td>
                                    <td className="p-2 text-right text-gray-600">{fmt(it.pesoEscurridoKg, 3)}</td>
                                    <td className="p-2 text-right text-gray-600">{fmt(it.pesoEscurridoxCaja, 4)}</td>
                                    <td className="p-2 text-right text-gray-600">{fmt(it.pesoEscurridoTotal, 4)}</td>
                                    <td className="p-2 text-right text-gray-600">{fmt(it.pesoNetoTotal, 4)}</td>
                                    <td className="p-2 text-right text-gray-600">{fmt(it.pesoBrutoTotal, 4)}</td>
                                    <td className="p-2 text-right text-green-600 font-medium">$ {fmt(it.valorTotal, 4)}</td>
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
                        <p className="text-xs mt-1">Haga clic en "+ Agregar Producto" para comenzar</p>
                    </div>
                )}
            </div>

            {/* ── Vista Mobile ── */}
            <div className="md:hidden space-y-3">
                {items.map((it, idx) => (
                    <div key={it.id} className="border rounded-lg p-4 shadow-sm bg-white">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Producto</label>
                                <select
                                    value={it.productoId || ""}
                                    onChange={(e) => updateItem(idx, "productoId", e.target.value)}
                                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Seleccione...</option>
                                    {productosChile.map((p) => (
                                        <option key={p.Id_ProductoChile} value={p.Id_ProductoChile}>
                                            {p.DescripProducto}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    value={it.descripcion || ""}
                                    onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                                    className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Lote</label>
                                    <input
                                        value={it.lote || ""}
                                        onChange={(e) => updateItem(idx, "lote", e.target.value)}
                                        className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Lote"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cant. Cajas</label>
                                    <input
                                        type="number" min="0" step="0.5"
                                        value={it.cantidadCajas || ""}
                                        onChange={(e) => updateItem(idx, "cantidadCajas", e.target.value)}
                                        className="border rounded p-2 w-full text-sm text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Elab.</label>
                                    <input
                                        type="date"
                                        value={it.fechaElaboracion || ""}
                                        onChange={(e) => updateItem(idx, "fechaElaboracion", e.target.value)}
                                        className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Venc.</label>
                                    <input
                                        type="date"
                                        value={it.fechaVencimiento || ""}
                                        onChange={(e) => updateItem(idx, "fechaVencimiento", e.target.value)}
                                        className="border rounded p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded">
                                <div className="text-center">
                                    <div className="text-gray-600">Peso Neto</div>
                                    <div className="font-medium">{fmt(it.pesoNetoTotal, 4)} Kg</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Peso Bruto</div>
                                    <div className="font-medium">{fmt(it.pesoBrutoTotal, 4)} Kg</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600">Valor Total</div>
                                    <div className="font-medium text-green-600">$ {fmt(it.valorTotal, 4)}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="w-full text-red-600 hover:text-red-800 text-xs font-medium bg-red-50 hover:bg-red-100 px-3 py-2 rounded transition"
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
