// PRIMERO: Pedidos.jsx con nuevo diseño visual
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import PedidoHeader from "../components/pedidos/PedidoHeader";
import PedidoDetail from "../components/pedidos/PedidoDetail";
import ModalVisorPreliminar from "../components/ModalVisorPreliminar";
import {
  getDatosSelect,
  getClienteRegion,
  guardarPedido,
  getPedidos,
  getPedidoEspecifico,
  actualizarPedido,
  imprimirPedido,
} from "../services/pedidosService";

// --------------------------------------------------------------
// Función para fecha actual en formato ISO (YYYY-MM-DD)
// --------------------------------------------------------------
function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// --------------------------------------------------------------
// Función para sumar días a una fecha en formato ISO
// --------------------------------------------------------------
function sumarDias(fechaISO, dias) {
  if (!fechaISO) return "";
  const [year, month, day] = fechaISO.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10); // siempre YYYY-MM-DD
}

export default function Pedidos() {
  // --------------------------------------------------------------
  // Estado del encabezado
  // --------------------------------------------------------------
  const [header, setHeader] = useState({
    numero: `PED-000000`,
    clienteId: "",
    regionId: "",
    fechaOrden: todayISODate(),
    fechaSalida: "",
    fechaEnroute: "",
    fechaDelivery: "",
    fechaIngreso: "",
    purchaseOrder: "",
    comentarios: "",
    cantidadEstibas: 1,
  });

  // --------------------------------------------------------------
  // Días asociados al cliente (para cálculos automáticos de fechas)
  // --------------------------------------------------------------
  const [diasCliente, setDiasCliente] = useState({
    salida: 0,
    enroute: 0,
    delivery: 0,
    ingreso: 0,
  });

  // --------------------------------------------------------------
  // Estado del detalle
  // --------------------------------------------------------------
  const [items, setItems] = useState([]);

  // --------------------------------------------------------------
  // Datos de selects globales
  // --------------------------------------------------------------
  const [datosSelect, setDatosSelect] = useState({
    clientes: [],
    productos: [],
    bodegas: [],
    embalajes: [],
    transportadoras: [],
  });

  // Regiones dependientes del cliente seleccionado
  const [regiones, setRegiones] = useState([]);

  // Estados de carga inicial
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState(null);

  // --------------------------------------------------------------
  // Estados para búsqueda y selección de pedidos
  // --------------------------------------------------------------
  const [pedidos, setPedidos] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // --------------------------------------------------------------
  // Estados para el visor de PDF
  // --------------------------------------------------------------
  const [urlPDF, setUrlPDF] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // --------------------------------------------------------------
  // Refs para validaciones
  // --------------------------------------------------------------
  const headerRefs = {
    fechaOrden: useRef(null),
    clienteId: useRef(null),
    regionId: useRef(null),
  };
  const itemRefs = useRef([]);

  // --------------------------------------------------------------
  // Cargar datos iniciales (clientes, productos, etc.)
  // --------------------------------------------------------------
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoadingDatos(true);
        const res = await getDatosSelect();
        setDatosSelect({
          clientes: res.clientes || [],
          productos: res.productos || [],
          bodegas: res.bodegas || [],
          embalajes: res.embalajes || [],
          transportadoras: res.transportadoras || [],
        });
      } catch (err) {
        console.error("Error cargando selects:", err);
        setErrorDatos("No se pudieron cargar los datos iniciales.");
      } finally {
        setLoadingDatos(false);
      }
    }
    cargarDatos();
  }, []);

  // --------------------------------------------------------------
  // Manejo de cambios en encabezado
  // --------------------------------------------------------------
  async function handleHeaderChange(field, value) {
    // Cambio de cliente → cargar días y regiones
    if (field === "clienteId") {
      const clienteSel = datosSelect.clientes.find(
        (c) => String(c.Id_Cliente) === String(value)
      );
      if (clienteSel) {
        const nuevosDias = {
          salida: parseInt(clienteSel.DiasFechaSalida) || 0,
          enroute: parseInt(clienteSel.DiasFechaEnroute) || 0,
          delivery: parseInt(clienteSel.DiasFechaDelivery) || 0,
          ingreso: parseInt(clienteSel.DiasFechaIngreso) || 0,
        };
        setDiasCliente(nuevosDias);

        // Cargar regiones asociadas al cliente
        try {
          const res = await getClienteRegion(value);
          setRegiones(res.success ? res.regiones || [] : []);
          if (!res.success) {
            Swal.fire("Aviso", "No hay regiones para este cliente.", "info");
          }
        } catch (err) {
          console.error("Error cargando regiones:", err);
          setRegiones([]);
        }

        // Recalcular fechas si ya existe fechaOrden
        setHeader((p) => ({
          ...p,
          clienteId: value,
          regionId: "",
          fechaSalida:
            p.fechaOrden && nuevosDias.salida
              ? sumarDias(p.fechaOrden, nuevosDias.salida)
              : "",
          fechaEnroute:
            p.fechaOrden && nuevosDias.enroute
              ? sumarDias(p.fechaOrden, nuevosDias.enroute)
              : "",
          fechaDelivery:
            p.fechaOrden && nuevosDias.delivery
              ? sumarDias(p.fechaOrden, nuevosDias.delivery)
              : "",
          fechaIngreso:
            p.fechaOrden && nuevosDias.ingreso
              ? sumarDias(p.fechaOrden, nuevosDias.ingreso)
              : "",
        }));
        return;
      }
    }

    // Cambio de fechaOrden → recalcular otras fechas
    if (field === "fechaOrden") {
      const nuevaFecha = value;
      setHeader((p) => ({
        ...p,
        fechaOrden: nuevaFecha,
        fechaSalida: diasCliente.salida
          ? sumarDias(nuevaFecha, diasCliente.salida)
          : "",
        fechaEnroute: diasCliente.enroute
          ? sumarDias(nuevaFecha, diasCliente.enroute)
          : "",
        fechaDelivery: diasCliente.delivery
          ? sumarDias(nuevaFecha, diasCliente.delivery)
          : "",
        fechaIngreso: diasCliente.ingreso
          ? sumarDias(nuevaFecha, diasCliente.ingreso)
          : "",
      }));
      return;
    }

    // Otros cambios simples
    setHeader((p) => ({ ...p, [field]: value }));
  }

  // --------------------------------------------------------------
  // Manejo de cambios en detalle
  // --------------------------------------------------------------
  function handleItemsChange(newItems) {
    console.log("Datos recibidos del detalle:", newItems);
    setItems(newItems);
  }

  // --------------------------------------------------------------
  // Validaciones generales
  // --------------------------------------------------------------
  function validateAll() {
    if (!header.fechaOrden) {
      headerRefs.fechaOrden.current?.focus();
      Swal.fire("Error", "La fecha de la orden es obligatoria.", "warning");
      return false;
    }

    if (!header.clienteId || String(header.clienteId).trim() === "") {
      headerRefs.clienteId.current?.focus();
      Swal.fire("Error", "El cliente es obligatorio.", "warning");
      return false;
    }

    if (!header.regionId || String(header.regionId).trim() === "") {
      headerRefs.regionId.current?.focus();
      Swal.fire("Error", "La región es obligatoria.", "warning");
      return false;
    }

    if (
      header.cantidadEstibas !== undefined &&
      Number(header.cantidadEstibas) <= 0
    ) {
      Swal.fire(
        "Error",
        "La cantidad de estibas debe ser mayor que cero.",
        "warning"
      );
      return false;
    }

    if (!items || items.length === 0) {
      Swal.fire("Error", "Agrega al menos una línea al detalle.", "warning");
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.producto || String(it.producto).trim() === "") { // 👈 Convertir a string
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Producto es obligatorio.`,
          "warning"
        );
        return false;
      }
      if (!it.descripcion || String(it.descripcion).trim() === "") { // 👈 Convertir a string
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Descripción es obligatoria.`,
          "warning"
        );
        return false;
      }
      if (!it.embalaje || String(it.embalaje).trim() === "") { // 👈 Convertir a string
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Embalaje es obligatorio.`,
          "warning"
        );
        return false;
      }
      if (!it.cantidad || Number(it.cantidad) <= 0) {
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Cantidad debe ser mayor que cero.`,
          "warning"
        );
        return false;
      }
      if (it.precio === undefined || Number(it.precio) < 0) {
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Precio debe ser cero o mayor.`,
          "warning"
        );
        return false;
      }
    }

    return true;
  }

  // --------------------------------------------------------------
  // Guardar pedido (ahora decide si guardar nuevo o actualizar)
  // --------------------------------------------------------------
  async function handleSave() {
    if (!validateAll()) return;

    try {
      // Si el pedido ya tiene ID (diferente de 0 o null/undefined), significa que ya existe en BD → ACTUALIZAR
      if (header.id && header.id !== 0) {
        const encabezado = {
          ...header,
          pedidoId: header.id,
        };

        const res = await actualizarPedido(encabezado, items);
        if (res.success) {
          Swal.fire("¡Actualizado!", "Pedido actualizado correctamente.", "success");
          // Opcional: refrescar el pedido desde backend
          // handleSelectPedido(header.id);
        } else {
          Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
        }
      } else {
        // Si no tiene ID → GUARDAR NUEVO
        const res = await guardarPedido(header, items);
        if (res.success) {
          const nuevoNumero = `PED-${String(res.idPedido).padStart(6, "0")}`;
          setHeader((p) => ({ ...p, id: res.idPedido, numero: nuevoNumero }));
          Swal.fire("¡Guardado!", "Pedido guardado correctamente.", "success");
        } else {
          Swal.fire("Error", res.message || "No se pudo guardar.", "error");
        }
      }
    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al procesar el pedido.", "error");
    }
  }

  // --------------------------------------------------------------
  // Actualizar pedido
  // --------------------------------------------------------------
  async function handleUpdate() {
    if (!header.id) {
      Swal.fire("Aviso", "No hay pedido cargado para actualizar.", "info");
      return;
    }

    if (!validateAll()) return;

    try {
      const encabezado = {
        ...header,
        pedidoId: header.id,   // 👈 obligatorio para el backend
      };

      const res = await actualizarPedido(encabezado, items);
      if (res.success) {
        Swal.fire("¡Actualizado!", "Pedido actualizado correctamente.", "success");
        // refrescar el pedido desde backend
        //handleSelectPedido(header.id);
      } else {
        Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al actualizar.", "error");
    }
  }


  // --------------------------------------------------------------
  // Nuevo pedido
  // --------------------------------------------------------------
  function handleNew() {
    setHeader({
      numero: `PED-000000`,
      clienteId: "",
      regionId: "",
      fechaOrden: todayISODate(),
      fechaSalida: "",
      fechaEnroute: "",
      fechaDelivery: "",
      fechaIngreso: "",
      comentarios: "",
      purchaseOrder: "",
      cantidadEstibas: 1,
    });
    setItems([]);
    setRegiones([]);
    itemRefs.current = [];
  }

  // --------------------------------------------------------------
  // Buscar pedidos y seleccionar uno
  // --------------------------------------------------------------
  async function handleOpenModal() {
    try {
      const res = await getPedidos();
      if (res.success) {
        setPedidos(res.pedidos || []);
        setShowModal(true);
      } else {
        Swal.fire("Error", "No se pudieron cargar los pedidos", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Error al obtener pedidos", "error");
    }
  }

  // --------------------------------------------------------------
  // Cargar pedido seleccionado (compatibilidad con varias formas de respuesta)
  // --------------------------------------------------------------
  async function handleSelectPedido(id) {
    try {
      const res = await getPedidoEspecifico(id);
      if (!res || !res.success) {
        Swal.fire("Error", res?.message || "No se pudo cargar el pedido", "error");
        return;
      }

      // Soportar varios formatos de respuesta:
      // - { success: true, header: {...}, detalle: [...] }
      // - { success: true, pedido: { header: {...}, detalle: [...] } }
      const apiHeader = res.header ?? res.pedido?.header ?? res.pedido ?? null;
      const apiDetalle = res.detalle ?? res.pedido?.detalle ?? res.pedido?.items ?? [];

      if (!apiHeader) {
        Swal.fire("Error", "Respuesta del servidor no contiene encabezado.", "error");
        return;
      }

      // 1) Ajustar diasCliente si podemos encontrar el cliente en datosSelect
      const clienteIdStr = String(apiHeader.Id_Cliente ?? apiHeader.IdCliente ?? "");
      const clienteSel = datosSelect.clientes.find(
        (c) => String(c.Id_Cliente) === clienteIdStr
      );
      if (clienteSel) {
        const nuevosDias = {
          salida: parseInt(clienteSel.DiasFechaSalida) || 0,
          enroute: parseInt(clienteSel.DiasFechaEnroute) || 0,
          delivery: parseInt(clienteSel.DiasFechaDelivery) || 0,
          ingreso: parseInt(clienteSel.DiasFechaIngreso) || 0,
        };
        setDiasCliente(nuevosDias);
      }

      // 2) Cargar regiones del cliente (para poblar el select de regiones)
      try {
        const regionesRes = await getClienteRegion(apiHeader.Id_Cliente);
        setRegiones(regionesRes.success ? regionesRes.regiones || [] : []);
      } catch (err) {
        console.error("Error cargando regiones al cargar pedido:", err);
        setRegiones([]);
      }

      // 3) Mapear el encabezado de la API a la forma que usa la UI
      const mappedHeader = {
        id: apiHeader.Id_EncabPedido ?? apiHeader.IdEncabPedido ?? apiHeader.id ?? null,
        numero:
          apiHeader.Id_EncabPedido
            ? `PED-${String(apiHeader.Id_EncabPedido).padStart(6, "0")}`
            : header.numero,
        clienteId: String(apiHeader.Id_Cliente ?? apiHeader.IdCliente ?? ""),
        regionId: String(apiHeader.Id_ClienteRegion ?? apiHeader.IdClienteRegion ?? ""),
        transportadoraId: apiHeader.Id_Transportadora ?? apiHeader.IdTransportadora ?? null,
        bodegaId: apiHeader.Id_Bodega ?? apiHeader.IdBodega ?? null,
        purchaseOrder: apiHeader.PurchaseOrder ?? apiHeader.Purchase_Order ?? "",
        fechaOrden: apiHeader.FechaOrden ?? apiHeader.Fecha_Orden ?? "",
        fechaSalida: apiHeader.FechaSalida ?? apiHeader.Fecha_Salida ?? "",
        fechaEnroute: apiHeader.FechaEnroute ?? apiHeader.Fecha_Enroute ?? "",
        fechaDelivery: apiHeader.FechaDelivery ?? apiHeader.Fecha_Delivery ?? "",
        fechaIngreso: apiHeader.FechaIngreso ?? apiHeader.Fecha_Ingreso ?? "",
        comentarios: apiHeader.Observaciones ?? apiHeader.Observacion ?? apiHeader.Observaciones ?? "",
        cantidadEstibas: apiHeader.CantidadEstibas ?? apiHeader.Cantidad_Estibas ?? header.cantidadEstibas,
      };

      // 4) Mapear detalle a los campos que usa PedidoDetail
      const mappedItems = (apiDetalle || []).map((d) => {
        // Buscar información completa del producto y embalaje para recalcular
        const productoInfo = datosSelect.productos.find(
          p => String(p.Id_Producto) === String(d.Id_Producto ?? d.IdProducto ?? "")
        );

        const embalajeInfo = datosSelect.embalajes.find(
          e => String(e.Id_Embalaje) === String(d.Id_Embalaje ?? d.IdEmbalaje ?? "")
        );

        const cantidad = d.Cantidad ?? d.cantidad ?? 0;
        const precio = d.Precio ?? d.precio ?? 0;
        const pesoGr = productoInfo?.PesoGr ?? d.PesoGr ?? 0;
        const factorPesoBruto = productoInfo?.FactorPesoBruto ?? d.FactorPesoBruto ?? 0;
        const cantidadEmbalaje = embalajeInfo?.Cantidad ?? 0;

        // Recalcular los campos como lo hace PedidoDetail
        const pesoNeto = ((cantidad * cantidadEmbalaje * pesoGr) / 1000) || 0;
        const pesoBruto = ((cantidad * cantidadEmbalaje * pesoGr * factorPesoBruto) / 1000) || 0;
        const subtotal = pesoNeto * precio;

        return {
          id: d.Id_DetPedido ?? d.IdDetPedido ?? d.id ?? null,
          producto: d.Id_Producto ?? d.IdProducto ?? "",
          descripcion: d.Descripcion ?? d.Descripción ?? d.descripcion ?? "",
          pesoGr: pesoGr,
          factorPesoBruto: factorPesoBruto,
          embalaje: d.Id_Embalaje ?? d.IdEmbalaje ?? "",
          cantidad: cantidad,
          precio: precio,
          pesoNeto: pesoNeto,
          pesoBruto: pesoBruto,
          subtotal: subtotal,
          cantidadEmbalaje: cantidadEmbalaje,
        };
      });

      // 5) Aplicar al estado
      setHeader((p) => ({ ...p, ...mappedHeader }));
      setItems(mappedItems);
      itemRefs.current = [];

      setShowModal(false);
      Swal.fire("Cargado", "Pedido cargado correctamente.", "success");
    } catch (err) {
      console.error("Error en handleSelectPedido:", err);
      Swal.fire("Error", "Error al obtener el pedido", "error");
    }
  }

  // --------------------------------------------------------------
  // Otras acciones
  // --------------------------------------------------------------
  function handleRefresh() {
    if (!header.id) {
      Swal.fire("Aviso", "Primero cargue o guarde un pedido.", "info");
      return;
    }
    handleSelectPedido(header.id);
  }

  // --------------------------------------------------------------
  // Función para imprimir pedido
  // --------------------------------------------------------------
  const handlePrint = async () => {
    if (!header.id) {
      Swal.fire("Aviso", "No hay pedido para imprimir.", "info");
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        title: "Generando PDF...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Detectar sistema operativo
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const esAndroid = /android/i.test(ua);
      const esIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const esWindows = /Win/i.test(ua);
      const esMac = /Mac/i.test(ua);

      let soDetectado = "Desconocido";
      if (esAndroid) soDetectado = "Android";
      else if (esIOS) soDetectado = "iOS (iPhone/iPad)";
      else if (esWindows) soDetectado = "Windows";
      else if (esMac) soDetectado = "MacOS";

      const esMovilOTablet = !esWindows && !esMac;

      let pestañaPreabierta = null;
      if (esMovilOTablet) {
        try {
          pestañaPreabierta = window.open("", "_blank");
        } catch (e) {
          pestañaPreabierta = null;
        }
      }

      // Generar el PDF
      const blob = await imprimirPedido(header.id);
      const fileURL = URL.createObjectURL(blob);

      // Cerrar loading
      Swal.close();

      if (esMovilOTablet) {
        // Para móviles/tablets: abrir en nueva pestaña
        if (pestañaPreabierta) {
          pestañaPreabierta.location.href = fileURL;
        } else {
          const a = document.createElement("a");
          a.href = fileURL;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        // Limpiar URL después de 10 segundos
        setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
      } else {
        // Para escritorio: mostrar en modal
        setUrlPDF(fileURL);
        setMostrarModal(true);
      }

    } catch (error) {
      console.error("Error al imprimir:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el PDF. Verifica que el pedido exista y tenga datos.",
      });
    }
  };

  // Función para cerrar el modal y limpiar la URL
  const handleCloseModal = () => {
    setMostrarModal(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };


  // --------------------------------------------------------------
  // Renderizado
  // --------------------------------------------------------------
  if (loadingDatos)
    return <p className="text-center text-gray-500 py-4">Cargando datos iniciales...</p>;
  if (errorDatos) return <p className="text-red-600 text-center py-4">{errorDatos}</p>;

  return (
    <div className="space-y-6">
      {/* Barra de acciones - NUEVO DISEÑO */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Gestión de Pedidos</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
          >
            Buscar Pedidos
          </button>
          <button
            onClick={handleSave}
            className="bg-orange-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-orange-600 transition font-medium flex-1"
          >
            {header.id && header.id !== 0 ? "Actualizar Pedido" : "Guardar Pedido"}
          </button>
          <button
            onClick={handleNew}
            className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
          >
            Nuevo Pedido
          </button>
          <button
            onClick={handlePrint}
            disabled={!header.id}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              header.id
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Imprimir PDF
          </button>
        </div>
      </div>

      <PedidoHeader
        header={header}
        onChange={handleHeaderChange}
        clientes={datosSelect.clientes}
        transportadoras={datosSelect.transportadoras}
        bodegas={datosSelect.bodegas}
        regiones={regiones}
        inputRefs={headerRefs}
      />

      <PedidoDetail
        items={items}
        onChangeItems={handleItemsChange}
        itemRefsRef={itemRefs}
        productos={datosSelect.productos}
        embalajes={datosSelect.embalajes}
      />

      {/* Modal de pedidos - NUEVO DISEÑO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-700">
                Seleccione un Pedido ({pedidos.length})
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition text-sm"
              >
                Cerrar
              </button>
            </div>

            {/* Tabla - solo visible en pantallas medianas en adelante */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Cliente</th>
                    <th className="p-2 border">Fecha</th>
                    <th className="p-2 border text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <tr key={p.idPedido} className="hover:bg-gray-50">
                      <td className="p-2 border font-medium">{p.idPedido}</td>
                      <td className="p-2 border">{p.Nombre}</td>
                      <td className="p-2 border">{p.FechaOrden}</td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => handleSelectPedido(p.idPedido)}
                          className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition text-sm"
                        >
                          Cargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards - solo visible en pantallas pequeñas */}
            <div className="block md:hidden space-y-3">
              {pedidos.map((p) => (
                <div
                  key={p.idPedido}
                  className="border rounded-lg p-4 shadow-sm bg-white"
                >
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-gray-700">ID:</span>
                      <p className="text-gray-900 font-medium">{p.idPedido}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Cliente:</span>
                      <p className="text-gray-900">{p.Nombre}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Fecha:</span>
                      <p className="text-gray-900">{p.FechaOrden}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => handleSelectPedido(p.idPedido)}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition w-full text-sm font-medium"
                    >
                      Cargar Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pedidos.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                <p>No hay pedidos registrados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal del visor de PDF */}
      {mostrarModal && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}