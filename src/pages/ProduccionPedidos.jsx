// src/pages/ProduccionPedidos.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getPedidoProduccion,
  guardarProduccion,
  getResponsables,
  getLotes,
  getPedidosProduccion, // nueva función
} from "../services/produccion/produccionService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function ProduccionPedidos() {
  // Estados para filtros de búsqueda
  const [tipoPedido, setTipoPedido] = useState("normal");
  const [fechaDesde, setFechaDesde] = useState(todayISODate());
  const [fechaHasta, setFechaHasta] = useState(todayISODate());

  // Estado para la lista de pedidos encontrados
  const [pedidosLista, setPedidosLista] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  // Estado para el pedido seleccionado (detalle)
  const [pedido, setPedido] = useState(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);

  // Estados para las listas desplegables
  const [responsables, setResponsables] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargandoListas, setCargandoListas] = useState(false);

  // Estado para cambios locales
  const [itemsEditados, setItemsEditados] = useState({});

  // Cargar responsables y lotes al montar
  useEffect(() => {
    const cargarListas = async () => {
      setCargandoListas(true);
      try {
        const [resResp, resLotes] = await Promise.all([
          getResponsables(true),
          getLotes(true),
        ]);
        if (resResp.success) setResponsables(resResp.responsables || []);
        if (resLotes.success) setLotes(resLotes.lotes || []);
      } catch (error) {
        console.error("Error cargando listas:", error);
        Swal.fire("Error", "No se pudieron cargar los datos de responsables y lotes", "error");
      } finally {
        setCargandoListas(false);
      }
    };
    cargarListas();
  }, []);

  // Buscar pedidos por rango de fechas
  const handleBuscarPedidos = async () => {
    if (!fechaDesde || !fechaHasta) {
      Swal.fire("Aviso", "Debe seleccionar un rango de fechas", "warning");
      return;
    }

    setCargandoLista(true);
    setPedidosLista([]);
    setPedido(null);
    setItemsEditados({});

    try {
      const res = await getPedidosProduccion({
        tipo: tipoPedido,
        fechaDesde,
        fechaHasta,
      });
      if (res.success) {
        setPedidosLista(res.pedidos || []);
        if (res.pedidos.length === 0) {
          Swal.fire("Info", "No se encontraron pedidos en el rango seleccionado", "info");
        }
      } else {
        Swal.fire("Error", res.message || "Error al buscar pedidos", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error de conexión al servidor", "error");
    } finally {
      setCargandoLista(false);
    }
  };

  // Cargar un pedido específico (detalle)
  const handleCargarPedido = async (idPedido) => {
    setCargandoPedido(true);
    setPedido(null);
    setItemsEditados({});

    try {
      const res = await getPedidoProduccion({ idPedido, tipo: tipoPedido });
      if (res.success) {
        setPedido(res.pedido);
        const inicial = {};
        res.pedido.items.forEach((item) => {
          inicial[item.idDet] = {
            idResponsable: item.idResponsable || "",
            lotes: [
              item.lotes?.lote1?.id || "",
              item.lotes?.lote2?.id || "",
              item.lotes?.lote3?.id || "",
            ],
          };
        });
        setItemsEditados(inicial);
      } else {
        Swal.fire("Error", res.message || "No se pudo cargar el pedido", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error de conexión al servidor", "error");
    } finally {
      setCargandoPedido(false);
    }
  };

  const handleResponsableChange = (idDet, value) => {
    setItemsEditados((prev) => ({
      ...prev,
      [idDet]: { ...(prev[idDet] || {}), idResponsable: value },
    }));
  };

  const handleLoteChange = (idDet, posicion, value) => {
    setItemsEditados((prev) => {
      const itemPrev = prev[idDet] || { lotes: ["", "", ""] };
      const nuevosLotes = [...(itemPrev.lotes || ["", "", ""])];
      nuevosLotes[posicion] = value;
      return {
        ...prev,
        [idDet]: { ...itemPrev, lotes: nuevosLotes },
      };
    });
  };

  const handleGuardar = async () => {
    if (!pedido) {
      Swal.fire("Aviso", "No hay pedido cargado", "info");
      return;
    }

    const items = pedido.items.map((item) => {
      const editado = itemsEditados[item.idDet] || {};
      return {
        idDet: item.idDet,
        idResponsable: editado.idResponsable || null,
        lotes: editado.lotes || ["", "", ""],
      };
    });

    try {
      const res = await guardarProduccion({
        tipo: tipoPedido,
        idPedido: pedido.idPedido,
        items,
      });
      if (res.success) {
        Swal.fire("Éxito", "Producción guardada correctamente", "success");
        handleCargarPedido(pedido.idPedido); // recargar
      } else {
        Swal.fire("Error", res.message || "Error al guardar", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error de conexión al servidor", "error");
    }
  };

  const getResponsableValue = (item) => {
    const editado = itemsEditados[item.idDet];
    return editado && editado.idResponsable !== undefined ? editado.idResponsable : item.idResponsable || "";
  };

  const getLoteValue = (item, posicion) => {
    const editado = itemsEditados[item.idDet];
    if (editado && editado.lotes && editado.lotes[posicion] !== undefined) {
      return editado.lotes[posicion];
    }
    const orig = item.lotes || {};
    switch (posicion) {
      case 0: return orig.lote1?.id || "";
      case 1: return orig.lote2?.id || "";
      case 2: return orig.lote3?.id || "";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">
          Producción: Asignar Responsable y Lotes
        </h2>

        {/* Filtros de búsqueda por fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={tipoPedido}
              onChange={(e) => setTipoPedido(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="sample">Sample</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBuscarPedidos}
              disabled={cargandoLista || cargandoListas}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium w-full disabled:bg-blue-300"
            >
              {cargandoLista ? "Buscando..." : "Buscar pedidos"}
            </button>
          </div>
        </div>

        {/* Lista de pedidos encontrados */}
        {pedidosLista.length > 0 && !pedido && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Pedidos encontrados ({pedidosLista.length})
            </h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              {/* Vista escritorio/tablet: tabla */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Cliente</th>
                      <th className="p-3 text-left">P.O.</th>
                      <th className="p-3 text-left">Fecha</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosLista.map((p) => (
                      <tr key={p.idPedido} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{p.idPedido}</td>
                        <td className="p-3">{p.cliente}</td>
                        <td className="p-3">{p.po || "-"}</td>
                        <td className="p-3">{p.fecha}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleCargarPedido(p.idPedido)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil: tarjetas */}
              <div className="md:hidden space-y-2 p-2">
                {pedidosLista.map((p) => (
                  <div key={p.idPedido} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">Pedido #{p.idPedido}</div>
                        <div className="text-sm text-gray-600">{p.cliente}</div>
                        <div className="text-xs">PO: {p.po || "-"}</div>
                        <div className="text-xs">Fecha: {p.fecha}</div>
                      </div>
                      <button
                        onClick={() => handleCargarPedido(p.idPedido)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Cargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detalle del pedido seleccionado */}
        {pedido && (
          <div className="mt-6">
            <div className="bg-gray-100 p-4 rounded-lg mb-4 flex flex-wrap justify-between items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                <div>
                  <span className="text-xs text-gray-600">Pedido:</span>
                  <p className="font-semibold">{pedido.numero}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Cliente:</span>
                  <p className="font-semibold">{pedido.cliente}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">P.O.:</span>
                  <p className="font-semibold">{pedido.purchaseOrder || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Fecha:</span>
                  <p className="font-semibold">{pedido.fechaOrden}</p>
                </div>
              </div>
              <button
                onClick={() => setPedido(null)} // volver a la lista
                className="mt-2 sm:mt-0 bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
              >
                Volver a lista
              </button>
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={handleGuardar}
                className="bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 transition font-medium"
              >
                Guardar Producción
              </button>
            </div>

            {/* Vista escritorio/tablet: tabla de ítems */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Producto</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-right">Cantidad</th>
                    <th className="p-2 text-left">Responsable</th>
                    <th className="p-2 text-left" colSpan="3">Lotes</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.items.map((item) => (
                    <tr key={item.idDet} className="border-b hover:bg-gray-50">
                      <td className="p-2">{item.idProducto}</td>
                      <td className="p-2">{item.producto}</td>
                      <td className="p-2 text-right">{item.cantidad}</td>
                      <td className="p-2">
                        <select
                          value={getResponsableValue(item)}
                          onChange={(e) => handleResponsableChange(item.idDet, e.target.value)}
                          className="border rounded p-1 text-xs w-32"
                        >
                          <option value="">-- Sin asignar --</option>
                          {responsables.map((r) => (
                            <option key={r.idResponsable} value={r.idResponsable}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={getLoteValue(item, 0)}
                          onChange={(e) => handleLoteChange(item.idDet, 0, e.target.value)}
                          className="border rounded p-1 text-xs w-24"
                        >
                          <option value="">-- Lote 1 --</option>
                          {lotes.map((l) => (
                            <option key={l.idLote} value={l.idLote}>
                              {l.codigoLote} - {l.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={getLoteValue(item, 1)}
                          onChange={(e) => handleLoteChange(item.idDet, 1, e.target.value)}
                          className="border rounded p-1 text-xs w-24"
                        >
                          <option value="">-- Lote 2 --</option>
                          {lotes.map((l) => (
                            <option key={l.idLote} value={l.idLote}>
                              {l.codigoLote} - {l.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={getLoteValue(item, 2)}
                          onChange={(e) => handleLoteChange(item.idDet, 2, e.target.value)}
                          className="border rounded p-1 text-xs w-24"
                        >
                          <option value="">-- Lote 3 --</option>
                          {lotes.map((l) => (
                            <option key={l.idLote} value={l.idLote}>
                              {l.codigoLote} - {l.descripcion}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil: tarjetas de ítems */}
            <div className="md:hidden space-y-3">
              {pedido.items.map((item) => (
                <div key={item.idDet} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-semibold">{item.producto}</div>
                  <div className="text-sm text-gray-600 mb-2">Cantidad: {item.cantidad}</div>
                  
                  <div className="mb-2">
                    <label className="text-xs font-medium">Responsable</label>
                    <select
                      value={getResponsableValue(item)}
                      onChange={(e) => handleResponsableChange(item.idDet, e.target.value)}
                      className="border rounded p-1 w-full text-sm"
                    >
                      <option value="">-- Sin asignar --</option>
                      {responsables.map((r) => (
                        <option key={r.idResponsable} value={r.idResponsable}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium">Lote 1</label>
                      <select
                        value={getLoteValue(item, 0)}
                        onChange={(e) => handleLoteChange(item.idDet, 0, e.target.value)}
                        className="border rounded p-1 w-full text-sm"
                      >
                        <option value="">--</option>
                        {lotes.map((l) => (
                          <option key={l.idLote} value={l.idLote}>
                            {l.codigoLote} - {l.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Lote 2</label>
                      <select
                        value={getLoteValue(item, 1)}
                        onChange={(e) => handleLoteChange(item.idDet, 1, e.target.value)}
                        className="border rounded p-1 w-full text-sm"
                      >
                        <option value="">--</option>
                        {lotes.map((l) => (
                          <option key={l.idLote} value={l.idLote}>
                            {l.codigoLote} - {l.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Lote 3</label>
                      <select
                        value={getLoteValue(item, 2)}
                        onChange={(e) => handleLoteChange(item.idDet, 2, e.target.value)}
                        className="border rounded p-1 w-full text-sm"
                      >
                        <option value="">--</option>
                        {lotes.map((l) => (
                          <option key={l.idLote} value={l.idLote}>
                            {l.codigoLote} - {l.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}