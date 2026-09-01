import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import NotaCreditoHeader from "../components/notasCredito/NotaCreditoHeader";
import NotaCreditoDetail from "../components/notasCredito/NotaCreditoDetail";
import ModalBuscarPedidos from "../components/notasCredito/ModalBuscarPedidos";
import ModalVisorPreliminar from "../components/ModalVisorPreliminar";
import {
  getDatosSelect,
  getDetallePedidosSeleccionados,
  guardarNotaCredito,
  getNotasCredito,
  getNotaCreditoEspecifica,
  actualizarNotaCredito,
  anularNotaCredito,
  imprimirNotaCredito,
} from "../services/notasCreditoService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function NotasCredito() {
  const [header, setHeader] = useState({
    numero: "NC-000000",
    clienteId: "",
    fecha: todayISODate(),
    motivo: "",
    estado: "Activo",
  });

  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [datosSelect, setDatosSelect] = useState({
    clientes: [],
    embalajes: [],
    productos: [],
  });

  const [loadingDatos, setLoadingDatos] = useState(true);
  const [showModalBuscar, setShowModalBuscar] = useState(false);
  const [showModalBuscarNC, setShowModalBuscarNC] = useState(false);
  const [notas, setNotas] = useState([]);
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [filtroNotas, setFiltroNotas] = useState("");
  const [urlPDF, setUrlPDF] = useState(null);

  const headerRefs = {
    cliente: useRef(null),
    fecha: useRef(null),
  };

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        const res = await getDatosSelect();
        setDatosSelect({
          clientes: res.clientes || [],
          embalajes: res.embalajes || [],
          productos: res.productos || [],
        });
      } catch (err) {
        console.error("Error cargando selects:", err);
      } finally {
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  function handleHeaderChange(field, value) {
    setHeader((p) => ({ ...p, [field]: value }));
  }

  function handleItemsChange(newItems) {
    setItems(newItems);
  }

  function validateAll() {
    if (!header.clienteId || String(header.clienteId).trim() === "") {
      headerRefs.cliente.current?.focus();
      Swal.fire("Error", "El cliente es obligatorio.", "warning");
      return false;
    }
    if (!header.fecha) {
      headerRefs.fecha.current?.focus();
      Swal.fire("Error", "La fecha es obligatoria.", "warning");
      return false;
    }
    if (!items || items.length === 0) {
      Swal.fire("Error", "Debe cargar al menos un pedido con productos.", "warning");
      return false;
    }
    const tieneCreditos = items.some((it) => (it.cantidadCredito || 0) > 0);
    if (!tieneCreditos) {
      Swal.fire("Error", "Debe acreditar al menos una caja en el detalle.", "warning");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!validateAll()) {
        setIsSaving(false);
        return;
      }

      const encabezado = { ...header };

      if (header.id && header.id !== 0) {
        const res = await actualizarNotaCredito({ ...encabezado, id: header.id }, items);
        if (res.success) {
          Swal.fire("Actualizado!", "Nota credito actualizada correctamente.", "success");
        } else {
          Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
        }
      } else {
        const res = await guardarNotaCredito(encabezado, items);
        if (res.success) {
          setHeader((p) => ({ ...p, id: res.idNotaCredito, numero: res.numero }));
          Swal.fire("Guardado!", "Nota credito guardada correctamente.", "success");
        } else {
          Swal.fire("Error", res.message || "No se pudo guardar.", "error");
        }
      }
    } catch (err) {
      Swal.fire("Error", "Ocurrio un error al procesar la nota credito.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function handleNew() {
    setHeader({
      numero: "NC-000000",
      clienteId: "",
      fecha: todayISODate(),
      motivo: "",
      estado: "Activo",
    });
    setItems([]);
  }

  async function handleOpenModalBuscarNC() {
    setShowModalBuscarNC(true);
    setCargandoNotas(true);
    setFiltroNotas("");

    try {
      const res = await getNotasCredito();
      if (res.success) {
        setNotas(res.notas || []);
      } else {
        Swal.fire("Error", "No se pudieron cargar las notas credito", "error");
      }
    } catch (err) {
      console.error("Error cargando notas credito:", err);
      Swal.fire("Error", "Error al obtener notas credito", "error");
    } finally {
      setCargandoNotas(false);
    }
  }

  const cerrarModalBuscarNC = () => {
    setShowModalBuscarNC(false);
    setNotas([]);
    setFiltroNotas("");
  };

  const notasFiltradas = notas.filter((n) => {
    if (!filtroNotas) return true;
    const f = filtroNotas.toLowerCase();
    return (
      String(n.idNotaCredito).includes(f) ||
      (n.Numero && n.Numero.toLowerCase().includes(f)) ||
      (n.NombreCliente && n.NombreCliente.toLowerCase().includes(f)) ||
      (n.Fecha && n.Fecha.includes(f))
    );
  });

  async function handleSelectNotaCredito(id) {
    try {
      const res = await getNotaCreditoEspecifica(id);
      if (!res || !res.success) {
        Swal.fire("Error", res?.message || "No se pudo cargar la nota credito", "error");
        return;
      }

      const enc = res.encabezado;
      const det = res.detalle || [];

      setHeader({
        id: enc.id,
        numero: enc.numero,
        clienteId: String(enc.idCliente),
        fecha: enc.fecha,
        motivo: enc.motivo || "",
        estado: enc.estado,
      });

      const mappedItems = det.map((d) => {
        const prodInfo = datosSelect.productos.find(
          (p) => String(p.Id_Producto) === String(d.idProducto)
        );
        const embInfo = datosSelect.embalajes.find(
          (e) => String(e.Id_Embalaje) === String(d.idEmbalaje)
        );
        return {
          _key: d.idDetNotaCredito || `nc_${d.item}`,
          idEncabPedido: d.idEncabPedido,
          idDetPedido: d.idDetPedido,
          idProducto: d.idProducto,
          descripcion: d.descripcion || "",
          descripProducto: d.descripProducto || "",
          idEmbalaje: d.idEmbalaje,
          nombreEmbalaje: d.nombreEmbalaje || (embInfo ? embInfo.Descripcion : ""),
          cantidadOriginal: d.cantidadOriginal,
          cantidadCredito: d.cantidadCredito,
          pesoNetoOriginal: d.pesoNetoCredito,
          pesoNetoCredito: d.pesoNetoCredito,
          precioUnitario: d.precioUnitario,
          valorCreditoCOP: d.valorCreditoCOP,
          fechaSalidaPedido: d.fechaSalidaPedido || "",
          item: d.item,
          purchaseOrder: d.purchaseOrder || "",
          region: d.region || "",
        };
      });

      setItems(mappedItems);
      cerrarModalBuscarNC();
      Swal.fire("Cargado", "Nota credito cargada correctamente.", "success");
    } catch (err) {
      console.error("Error en handleSelectNotaCredito:", err);
      Swal.fire("Error", "Error al obtener la nota credito", "error");
    }
  }

  const handleSeleccionarPedidos = async (idsPedidos) => {
    setShowModalBuscar(false);
    try {
      Swal.fire({
        title: "Cargando productos...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await getDetallePedidosSeleccionados(idsPedidos);
      Swal.close();

      if (!res.success) {
        Swal.fire("Error", res.message || "Error al cargar productos", "error");
        return;
      }

      const rawItems = res.items || [];
      if (rawItems.length === 0) {
        Swal.fire("Aviso", "Los pedidos seleccionados no tienen productos.", "info");
        return;
      }

      // NO agrupar por producto - cada linea de detalle es independiente
      // Cada item mantiene su Id_DetPedido original y su FechaSalidaPedido
      const newItems = rawItems.map((it, idx) => {
        const embInfo = datosSelect.embalajes.find(
          (e) => String(e.Id_Embalaje) === String(it.Id_Embalaje)
        );
        const pesoNeto = it.PesoNeto || 0;
        const precio = it.PrecioUnitario || 0;
        const valor = parseFloat((pesoNeto * precio).toFixed(0));
        return {
          _key: `item_${Date.now()}_${idx}`,
          idEncabPedido: it.Id_EncabPedido,
          idDetPedido: it.Id_DetPedido,
          idProducto: it.Id_Producto,
          descripcion: it.Descripcion || "",
          descripProducto: it.DescripProducto || "",
          idEmbalaje: it.Id_Embalaje,
          nombreEmbalaje: embInfo ? embInfo.Descripcion : "",
          cantidadOriginal: it.Cantidad || 0,
          cantidadCredito: it.Cantidad || 0,
          pesoNetoOriginal: pesoNeto,
          pesoNetoCredito: pesoNeto,
          precioUnitario: precio,
          valorCreditoCOP: valor,
          fechaSalidaPedido: it.FechaSalida || "",
          item: items.length + idx + 1,
          purchaseOrder: it.PurchaseOrder || "",
          region: it.Region || "",
        };
      });

      // APPEND a items existentes (para permitir agregar mas pedidos)
      setItems((prev) => [...prev, ...newItems]);
    } catch (err) {
      Swal.close();
      console.error("Error cargando detalle:", err);
      Swal.fire("Error", "Error al cargar productos de los pedidos", "error");
    }
  };

  async function handleAnular() {
    if (!header.id) {
      Swal.fire("Aviso", "No hay nota credito cargada para anular.", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "Anular Nota Credito?",
      text: `Esta seguro de anular la nota credito ${header.numero}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Si, Anular",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await anularNotaCredito(header.id);
      if (res.success) {
        setHeader((p) => ({ ...p, estado: "Anulado" }));
        Swal.fire("Anulada!", "Nota credito anulada correctamente.", "success");
      } else {
        Swal.fire("Error", res.message || "No se pudo anular.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Error al anular la nota credito.", "error");
    }
  }

  async function handlePrint() {
    if (!header.id) return;
    try {
      Swal.fire({ title: "Generando PDF...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const blob = await imprimirNotaCredito(header.id);
      Swal.close();
      const fileURL = URL.createObjectURL(blob);
      if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
        window.open(fileURL, "_blank");
      } else {
        setUrlPDF(fileURL);
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "No se pudo generar el PDF.", "error");
    }
  }

  if (loadingDatos)
    return <p className="text-center text-gray-500 py-4">Cargando datos iniciales...</p>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Gestion de Notas Credito</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleOpenModalBuscarNC}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
          >
            Buscar Notas Credito
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || header.estado === "Anulado"}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              isSaving || header.estado === "Anulado"
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isSaving
              ? header.id ? "Actualizando..." : "Guardando..."
              : header.id && header.id !== 0
                ? "Actualizar Nota Credito"
                : "Guardar Nota Credito"}
          </button>
          <button
            onClick={handleNew}
            className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
          >
            Nueva Nota Credito
          </button>
          <button
            onClick={handleAnular}
            disabled={!header.id || header.estado === "Anulado"}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              header.id && header.estado !== "Anulado"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Anular Nota Credito
          </button>
          <button
            onClick={handlePrint}
            disabled={!header.id}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              header.id
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Imprimir PDF
          </button>
        </div>
      </div>

      <NotaCreditoHeader
        header={header}
        onChange={handleHeaderChange}
        clientes={datosSelect.clientes}
        inputRefs={headerRefs}
        modoVisualizacion={header.estado === "Anulado"}
        onCargarPedidos={() => setShowModalBuscar(true)}
      />

      <NotaCreditoDetail
        items={items}
        onChangeItems={handleItemsChange}
        productos={datosSelect.productos}
        embalajes={datosSelect.embalajes}
      />

      {/* Modal buscar pedidos del cliente */}
      <ModalBuscarPedidos
        isOpen={showModalBuscar}
        onClose={() => setShowModalBuscar(false)}
        onSeleccionar={handleSeleccionarPedidos}
        idCliente={header.clienteId}
      />

      {/* Modal buscar notas credito */}
      {showModalBuscarNC && (
        <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-20 bg-black/50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h3 className="text-lg font-semibold">
                Buscar Notas Credito ({notasFiltradas.length})
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filtrar por N cliente o fecha..."
                  className="border rounded px-3 py-2 flex-1 min-w-[200px] text-sm"
                  value={filtroNotas}
                  onChange={(e) => setFiltroNotas(e.target.value)}
                />
                <button
                  onClick={cerrarModalBuscarNC}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {cargandoNotas ? (
              <div className="text-center py-8">Cargando notas credito...</div>
            ) : notasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-600 border-2 border-dashed rounded-lg bg-gray-50">
                {filtroNotas ? "No se encontraron notas con ese filtro." : "No hay notas credito registradas."}
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-left border-b bg-gray-50">
                      <tr>
                        <th className="py-2 px-2 font-semibold">N</th>
                        <th className="py-2 px-2 font-semibold">Cliente</th>
                        <th className="py-2 px-2 font-semibold">P.O.</th>
                        <th className="py-2 px-2 font-semibold">Región</th>
                        <th className="py-2 px-2 font-semibold">Fecha</th>
                        <th className="py-2 px-2 font-semibold text-right">Valor COP</th>
                        <th className="py-2 px-2 font-semibold">Estado</th>
                        <th className="py-2 px-2 font-semibold text-center">Items</th>
                        <th className="py-2 px-2 font-semibold text-right">Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notasFiltradas.map((n) => (
                        <tr key={n.idNotaCredito} className="hover:bg-gray-50 border-b">
                          <td className="py-2 px-2 font-medium">{n.Numero}</td>
                          <td className="py-2 px-2">{n.NombreCliente}</td>
                          <td className="py-2 px-2 text-blue-700 font-medium">{n.PurchaseOrders || "-"}</td>
                          <td className="py-2 px-2 text-gray-600">{n.Regiones || "-"}</td>
                          <td className="py-2 px-2">{n.Fecha}</td>
                          <td className="py-2 px-2 text-right">${n.ValorTotalCOP.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              n.Estado === "Anulado" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}>
                              {n.Estado}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">{n.totalItems}</td>
                          <td className="py-2 px-2 text-right">
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                              onClick={() => handleSelectNotaCredito(n.idNotaCredito)}
                            >
                              Cargar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="block md:hidden space-y-3">
                  {notasFiltradas.map((n) => (
                    <div key={n.idNotaCredito} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{n.Numero}</p>
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                          onClick={() => handleSelectNotaCredito(n.idNotaCredito)}
                        >
                          Cargar
                        </button>
                      </div>
                      <p className="text-sm text-gray-700">{n.NombreCliente}</p>
                      {n.PurchaseOrders && <p className="text-xs text-blue-700 font-medium">PO: {n.PurchaseOrders}</p>}
                      {n.Regiones && <p className="text-xs text-gray-500">Reg: {n.Regiones}</p>}
                      <p className="text-sm text-gray-600">Fecha: {n.Fecha}</p>
                      <p className="text-sm font-medium text-red-700">${n.ValorTotalCOP.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        n.Estado === "Anulado" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>{n.Estado}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {urlPDF && <ModalVisorPreliminar url={urlPDF} onClose={() => { setUrlPDF(null); URL.revokeObjectURL(urlPDF); }} />}
    </div>
  );
}
