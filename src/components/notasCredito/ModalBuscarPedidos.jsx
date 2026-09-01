// src/components/notasCredito/ModalBuscarPedidos.jsx
import React, { useState, useEffect } from "react";
import { getPedidosPorCliente } from "../../services/notasCreditoService";

export default function ModalBuscarPedidos({
  isOpen,
  onClose,
  onSeleccionar,
  idCliente,
}) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [seleccionados, setSeleccionados] = useState({});

  useEffect(() => {
    if (isOpen && idCliente) {
      cargarPedidos();
    }
  }, [isOpen, idCliente]);

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const res = await getPedidosPorCliente(idCliente);
      if (res.success) {
        setPedidos(res.pedidos || []);
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccion = (idPedido) => {
    setSeleccionados((prev) => ({
      ...prev,
      [idPedido]: !prev[idPedido],
    }));
  };

  const seleccionarTodos = () => {
    if (pedidosFiltrados.every((p) => seleccionados[p.idPedido])) {
      setSeleccionados({});
    } else {
      const nuevos = {};
      pedidosFiltrados.forEach((p) => {
        nuevos[p.idPedido] = true;
      });
      setSeleccionados(nuevos);
    }
  };

  const handleConfirmar = () => {
    const ids = Object.entries(seleccionados)
      .filter(([, v]) => v)
      .map(([k]) => parseInt(k));
    if (ids.length === 0) return;
    onSeleccionar(ids);
    setSeleccionados({});
    setFiltro("");
  };

  const handleClose = () => {
    setSeleccionados({});
    setFiltro("");
    onClose();
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (!filtro) return true;
    const f = filtro.toLowerCase();
    return (
      String(p.idPedido).includes(f) ||
      (p.PurchaseOrder && p.PurchaseOrder.toLowerCase().includes(f)) ||
      (p.FacturaNo && p.FacturaNo.toLowerCase().includes(f)) ||
      (p.FechaOrden && p.FechaOrden.includes(f))
    );
  });

  const totalSeleccionados = Object.values(seleccionados).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-20 bg-black/50">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
          <h3 className="text-lg font-semibold">
            Buscar Pedidos ({pedidosFiltrados.length})
            {totalSeleccionados > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({totalSeleccionados} seleccionados)
              </span>
            )}
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrar por ID, P.O., Factura o fecha..."
              className="border rounded px-3 py-2 flex-1 min-w-[200px] text-sm"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button onClick={handleClose} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-sm">
              Cerrar
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-8">Cargando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-600 border-2 border-dashed rounded-lg bg-gray-50">
            {filtro ? "No se encontraron pedidos con ese filtro." : "No hay pedidos para este cliente."}
          </div>
        ) : (
          <div className="overflow-auto max-h-96">
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="text-left border-b bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 w-10">
                      <input
                        type="checkbox"
                        checked={pedidosFiltrados.length > 0 && pedidosFiltrados.every((p) => seleccionados[p.idPedido])}
                        onChange={seleccionarTodos}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="py-2 px-2 font-semibold">ID</th>
                    <th className="py-2 px-2 font-semibold">Factura</th>
                    <th className="py-2 px-2 font-semibold">Fecha Salida</th>
                    <th className="py-2 px-2 font-semibold">P.O.</th>
                    <th className="py-2 px-2 font-semibold text-right">Cajas</th>
                    <th className="py-2 px-2 font-semibold text-right">Peso Neto</th>
                    <th className="py-2 px-2 font-semibold text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((p) => (
                    <tr
                      key={p.idPedido}
                      className={`hover:bg-gray-50 border-b cursor-pointer ${seleccionados[p.idPedido] ? "bg-blue-50" : ""}`}
                      onClick={() => toggleSeleccion(p.idPedido)}
                    >
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={!!seleccionados[p.idPedido]}
                          onChange={() => toggleSeleccion(p.idPedido)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-2 px-2 font-medium">PED-{String(p.idPedido).padStart(6, "0")}</td>
                      <td className="py-2 px-2">{p.FacturaNo || "-"}</td>
                      <td className="py-2 px-2">{p.FechaSalida}</td>
                      <td className="py-2 px-2">{p.PurchaseOrder || "-"}</td>
                      <td className="py-2 px-2 text-right">{p.totalCajas}</td>
                      <td className="py-2 px-2 text-right">{p.totalPesoNeto.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-medium">${p.totalValor.toLocaleString("es-CO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="block md:hidden space-y-3">
              {pedidosFiltrados.map((p) => (
                <div
                  key={p.idPedido}
                  className={`border rounded-lg p-4 shadow-sm cursor-pointer ${seleccionados[p.idPedido] ? "bg-blue-50 border-blue-300" : "bg-white"}`}
                  onClick={() => toggleSeleccion(p.idPedido)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!seleccionados[p.idPedido]}
                      onChange={() => toggleSeleccion(p.idPedido)}
                      className="w-5 h-5 mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold">PED-{String(p.idPedido).padStart(6, "0")}</p>
                        <span className="text-sm font-medium text-green-700">${p.totalValor.toLocaleString("es-CO")}</span>
                      </div>
                      <p className="text-sm text-gray-600">Salida: {p.FechaSalida}</p>
                      {p.FacturaNo && (
                        <p className="text-sm bg-purple-50 p-1.5 rounded border border-purple-200">Factura: {p.FacturaNo}</p>
                      )}
                      {p.PurchaseOrder && (
                        <p className="text-sm bg-blue-50 p-1.5 rounded border border-blue-200">P.O: {p.PurchaseOrder}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Cajas: {p.totalCajas}</span>
                        <span>Peso: {p.totalPesoNeto.toFixed(2)} kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalSeleccionados > 0 && (
          <div className="mt-4 flex justify-end border-t pt-4">
            <button
              onClick={handleConfirmar}
              className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition font-medium text-sm"
            >
              Cargar {totalSeleccionados} pedido(s) seleccionado(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
