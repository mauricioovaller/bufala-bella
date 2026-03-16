// src/pages/Pedidos.jsx
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import PedidoHeader from "../components/pedidos/PedidoHeader";
import PedidoDetail from "../components/pedidos/PedidoDetail";
import ModalSeleccionDocumento from "../components/ModalSeleccionDocumento";
import ModalVisorPreliminar from "../components/ModalVisorPreliminar";
import ModalImpresionMultiple from "../components/ModalImpresionMultiple";
import {
  getDatosSelect,
  getClienteRegion,
  validarPurchaseOrder,
  guardarPedido,
  getPedidos,
  getPedidoEspecifico,
  actualizarPedido,
  imprimirPedido,
  imprimirPedidosMultiples,
  getRangoPedidos,
} from "../services/pedidosService";

const comentariosPorCliente = {
  "11": "Indicaciones Especiales: CON CODIGO DE BARRAS",
};

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function sumarDias(fechaISO, dias) {
  if (!fechaISO) return "";
  const [year, month, day] = fechaISO.split("-").map(Number);
  const fecha = new Date(year, month - 1, day);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
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
    aerolineaId: "107",
    agenciaId: "44",
    noGuia: "",
    guiaHija: "",
  });

  // --------------------------------------------------------------
  // Días asociados al cliente
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
  // Estados para comentarios seleccionados
  // --------------------------------------------------------------
  const [comentariosSeleccionados, setComentariosSeleccionados] = useState({
    incluirPrimario: true,
    incluirSecundario: true
  });

  // --------------------------------------------------------------
  // Datos de selects globales
  // --------------------------------------------------------------
  const [datosSelect, setDatosSelect] = useState({
    clientes: [],
    productos: [],
    bodegas: [],
    embalajes: [],
    transportadoras: [],
    aerolineas: [],
    agencias: [],
  });

  const [regiones, setRegiones] = useState([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState(null);

  const [mostrarSelectorDocumento, setMostrarSelectorDocumento] = useState(false);
  const [mostrarImpresionMultiple, setMostrarImpresionMultiple] = useState(false);

  // --------------------------------------------------------------
  // Estados para búsqueda y selección de pedidos
  // --------------------------------------------------------------
  const [pedidos, setPedidos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [filtroPedidos, setFiltroPedidos] = useState("");

  // --------------------------------------------------------------
  // Estados para el visor de PDF
  // --------------------------------------------------------------
  const [urlPDF, setUrlPDF] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // --------------------------------------------------------------
  // 👇 NUEVO: Estado para controlar el guardado (evita doble clic)
  // --------------------------------------------------------------
  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------------------------------------
  // Refs para validaciones
  // --------------------------------------------------------------
  const headerRefs = {
    fechaOrden: useRef(null),
    clienteId: useRef(null),
    regionId: useRef(null),
    aerolineaId: useRef(null),
    agenciaId: useRef(null),
    noGuia: useRef(null),
    purchaseOrder: useRef(null),
  };
  const itemRefs = useRef([]);

  // --------------------------------------------------------------
  // Cargar datos iniciales
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
          aerolineas: res.aerolineas || [],
          agencias: res.agencias || [],
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

        let nuevoComentario = header.comentarios || "";
        const comentarioPorDefecto = comentariosPorCliente[String(value)];
        if (comentarioPorDefecto) {
          const comentarioYaExiste = nuevoComentario.includes(comentarioPorDefecto);
          if (!comentarioYaExiste) {
            if (nuevoComentario) {
              nuevoComentario += "\n\n---\n\n" + comentarioPorDefecto;
            } else {
              nuevoComentario = comentarioPorDefecto;
            }
          }
        }

        setHeader((p) => ({
          ...p,
          clienteId: value,
          regionId: "",
          bodegaId: "",
          comentarios: nuevoComentario,
        }));
        return;
      }
    }

    if (field === "regionId") {
      const regionSeleccionada = regiones.find(
        (r) => String(r.idClienteRegion) === String(value)
      );
      if (regionSeleccionada && regionSeleccionada.idBodega) {
        setHeader((p) => ({
          ...p,
          regionId: value,
          bodegaId: regionSeleccionada.idBodega
        }));
      } else {
        setHeader((p) => ({
          ...p,
          regionId: value,
          bodegaId: ""
        }));
      }
      return;
    }

    if (field === "fechaSalida") {
      setHeader((p) => ({
        ...p,
        fechaSalida: value,
        fechaEnroute: diasCliente.enroute
          ? sumarDias(value, diasCliente.enroute)
          : "",
        fechaDelivery: diasCliente.delivery
          ? sumarDias(value, diasCliente.delivery)
          : "",
        fechaIngreso: value,
      }));
      return;
    }

    if (field === "fechaOrden") {
      setHeader((p) => ({ ...p, fechaOrden: value }));
      return;
    }

    if (field === "purchaseOrder") {
      setHeader((p) => ({ ...p, purchaseOrder: value }));
      if (value && value.trim() !== "") {
        validarPurchaseOrderEnTiempoReal(value);
      }
      return;
    }

    setHeader((p) => ({ ...p, [field]: value }));
  }

  function handleComentariosChange(field, value) {
    setComentariosSeleccionados(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function handleItemsChange(newItems) {
    console.log("Datos recibidos del detalle:", newItems);
    setItems(newItems);
  }

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
      if (!it.producto || String(it.producto).trim() === "") {
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Producto es obligatorio.`,
          "warning"
        );
        return false;
      }
      if (!it.descripcion || String(it.descripcion).trim() === "") {
        itemRefs.current[i]?.focus();
        Swal.fire(
          "Error",
          `Fila ${i + 1}: Descripción es obligatoria.`,
          "warning"
        );
        return false;
      }
      if (!it.embalaje || String(it.embalaje).trim() === "") {
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

  const validarPurchaseOrderUnica = async (purchaseOrder) => {
    if (!purchaseOrder || purchaseOrder.trim() === "") {
      return true;
    }

    try {
      const res = await validarPurchaseOrder(purchaseOrder, header.id || 0);

      if (res.success && res.existe) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Purchase Order Duplicada',
          html: `
          <div class="text-left">
            <p class="mb-2">${res.mensaje}</p>
            <p class="text-sm text-gray-600 mt-2">
              ¿Desea continuar con el guardado de todas formas?
            </p>
          </div>
        `,
          showCancelButton: true,
          confirmButtonText: 'Sí, Continuar',
          cancelButtonText: 'No, Corregir',
          confirmButtonColor: '#f97316',
          cancelButtonColor: '#6b7280'
        });
        if (result.isConfirmed) {
          return true;
        } else {
          headerRefs.purchaseOrder.current?.focus();
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Error validando Purchase Order:", error);
      return true;
    }
  };

  const validarPurchaseOrderEnTiempoReal = async (purchaseOrder) => {
    if (!purchaseOrder || purchaseOrder.trim() === "") {
      return;
    }

    setTimeout(async () => {
      try {
        const res = await validarPurchaseOrder(purchaseOrder, header.id || 0);
        if (res.success && res.existe) {
          Swal.fire({
            icon: 'warning',
            title: 'Purchase Order Duplicada',
            html: `
            <div class="text-left">
              <p class="mb-2">${res.mensaje}</p>
              <p class="text-sm text-gray-600 mt-2">
                Verifique si es correcto antes de guardar.
              </p>
            </div>
          `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#f97316',
          });
        }
      } catch (error) {
        console.error("Error validando Purchase Order:", error);
      }
    }, 1000);
  };

  // --------------------------------------------------------------
  // Guardar pedido (ahora con protección contra doble clic)
  // --------------------------------------------------------------
  async function handleSave() {
    if (isSaving) return; // 👈 Evita ejecución múltiple
    setIsSaving(true);

    try {
      const poValido = await validarPurchaseOrderUnica(header.purchaseOrder);
      if (!poValido) return;

      if (!validateAll()) return;

      const itemsConPesos = items.map(item => ({
        ...item,
        pesoNeto: item.pesoNeto || 0,
        pesoBruto: item.pesoBruto || 0,
        subtotal: item.subtotal || 0
      }));

      const encabezado = {
        ...header,
        comentariosSeleccionados: comentariosSeleccionados
      };

      if (header.id && header.id !== 0) {
        const encabezadoConId = {
          ...encabezado,
          pedidoId: header.id,
        };

        const res = await actualizarPedido(encabezadoConId, itemsConPesos);
        if (res.success) {
          Swal.fire("¡Actualizado!", "Pedido actualizado correctamente.", "success");
        } else {
          Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
        }
      } else {
        const res = await guardarPedido(encabezado, itemsConPesos);
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
    } finally {
      setIsSaving(false); // 👈 Siempre restablece el estado
    }
  }

  // --------------------------------------------------------------
  // Actualizar pedido (también con protección)
  // --------------------------------------------------------------
  async function handleUpdate() {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const poValido = await validarPurchaseOrderUnica(header.purchaseOrder);
      if (!poValido) return;

      if (!header.id) {
        Swal.fire("Aviso", "No hay pedido cargado para actualizar.", "info");
        return;
      }

      if (!validateAll()) return;

      const itemsConPesos = items.map(item => ({
        ...item,
        pesoNeto: item.pesoNeto || 0,
        pesoBruto: item.pesoBruto || 0,
        subtotal: item.subtotal || 0
      }));

      const encabezado = {
        ...header,
        pedidoId: header.id,
        comentariosSeleccionados: comentariosSeleccionados
      };

      const res = await actualizarPedido(encabezado, itemsConPesos);
      if (res.success) {
        Swal.fire("¡Actualizado!", "Pedido actualizado correctamente.", "success");
      } else {
        Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al actualizar.", "error");
    } finally {
      setIsSaving(false);
    }
  }

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
      bodegaId: "",
      aerolineaId: "107",
      agenciaId: "44",
      noGuia: "",
      guiaHija: "",
    });
    setItems([]);
    setRegiones([]);
    setComentariosSeleccionados({
      incluirPrimario: true,
      incluirSecundario: true
    });
    itemRefs.current = [];
  }

  async function handleOpenModal() {
    setShowModal(true);
    setCargandoPedidos(true);
    setFiltroPedidos("");

    try {
      const res = await getPedidos();
      if (res.success) {
        setPedidos(res.pedidos || []);
      } else {
        Swal.fire("Error", "No se pudieron cargar los pedidos", "error");
      }
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      Swal.fire("Error", "Error al obtener pedidos", "error");
    } finally {
      setCargandoPedidos(false);
    }
  }

  const cerrarModalBuscarPedidos = () => {
    setShowModal(false);
    setPedidos([]);
    setFiltroPedidos("");
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    if (!filtroPedidos) return true;
    const f = filtroPedidos.toString().trim().toLowerCase();
    return (
      String(p.idPedido).includes(f) ||
      (p.Nombre && p.Nombre.toLowerCase().includes(f)) ||
      (p.FechaOrden && p.FechaOrden.toLowerCase().includes(f)) ||
      (p.PurchaseOrder && p.PurchaseOrder.toLowerCase().includes(f))
    );
  });

  async function handleSelectPedido(id) {
    try {
      const res = await getPedidoEspecifico(id);
      if (!res || !res.success) {
        Swal.fire("Error", res?.message || "No se pudo cargar el pedido", "error");
        return;
      }

      const apiHeader = res.header ?? res.pedido?.header ?? res.pedido ?? null;
      const apiDetalle = res.detalle ?? res.pedido?.detalle ?? res.pedido?.items ?? [];

      if (!apiHeader) {
        Swal.fire("Error", "Respuesta del servidor no contiene encabezado.", "error");
        return;
      }

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

      try {
        const regionesRes = await getClienteRegion(apiHeader.Id_Cliente);
        setRegiones(regionesRes.success ? regionesRes.regiones || [] : []);
      } catch (err) {
        console.error("Error cargando regiones al cargar pedido:", err);
        setRegiones([]);
      }

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
        aerolineaId: apiHeader.Id_Aerolinea ?? apiHeader.IdAerolinea ?? "",
        agenciaId: apiHeader.Id_Agencia ?? apiHeader.IdAgencia ?? "",
        noGuia: apiHeader.Guia_Master ?? apiHeader.GuiaMaster ?? "",
        guiaHija: apiHeader.Guia_Hija ?? apiHeader.GuiaHija ?? "",
      };

      const comentariosCargados = {
        incluirPrimario: apiHeader.ComentarioPrimario === 1,
        incluirSecundario: apiHeader.ComentarioSecundario === 1
      };

      const mappedItems = (apiDetalle || []).map((d) => {
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
        const pesoNetoCalculado = ((cantidad * cantidadEmbalaje * pesoGr) / 1000) || 0;
        const pesoBrutoCalculado = ((cantidad * cantidadEmbalaje * pesoGr * factorPesoBruto) / 1000) || 0;
        const pesoNeto = d.PesoNeto ?? pesoNetoCalculado;
        const pesoBruto = d.PesoBruto ?? pesoBrutoCalculado;
        const subtotal = d.ValorRegistro ?? (pesoNeto * precio) ?? 0;

        return {
          id: d.Id_DetPedido ?? d.IdDetPedido ?? d.id ?? null,
          producto: d.Id_Producto ?? d.IdProducto ?? "",
          descripcion: d.Descripcion ?? d.Descripción ?? d.descripcion ?? "",
          pesoGr: pesoGr,
          factorPesoBruto: factorPesoBruto,
          embalaje: d.Id_Embalaje ?? d.IdEmbalaje ?? "",
          cantidad: cantidad,
          precio: precio,
          pesoNeto: d.PesoNeto ?? pesoNeto,
          pesoBruto: d.PesoBruto ?? pesoBruto,
          subtotal: d.ValorRegistro ?? subtotal,
          cantidadEmbalaje: cantidadEmbalaje,
        };
      });

      setHeader((p) => ({ ...p, ...mappedHeader }));
      setItems(mappedItems);
      setComentariosSeleccionados(comentariosCargados);
      itemRefs.current = [];

      cerrarModalBuscarPedidos();
      Swal.fire("Cargado", "Pedido cargado correctamente.", "success");
    } catch (err) {
      console.error("Error en handleSelectPedido:", err);
      Swal.fire("Error", "Error al obtener el pedido", "error");
    }
  }

  function handleRefresh() {
    if (!header.id) {
      Swal.fire("Aviso", "Primero cargue o guarde un pedido.", "info");
      return;
    }
    handleSelectPedido(header.id);
  }

  const handlePrint = async (tipoDocumento = null) => {
    if (!header.id) {
      Swal.fire("Aviso", "No hay pedido para imprimir.", "info");
      return;
    }

    if (!tipoDocumento) {
      setMostrarSelectorDocumento(true);
      return;
    }

    try {
      Swal.fire({
        title: "Generando PDF...",
        text: `Generando ${getNombreDocumento(tipoDocumento)}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

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

      const blob = await imprimirPedido(header.id, tipoDocumento);
      const fileURL = URL.createObjectURL(blob);

      Swal.close();

      if (esMovilOTablet) {
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
        setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
      } else {
        setUrlPDF(fileURL);
        setMostrarModal(true);
      }

    } catch (error) {
      console.error("Error al imprimir:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo generar el ${getNombreDocumento(tipoDocumento)}. Verifica que el pedido exista y tenga datos.`,
      });
    }
  };

  const handlePrintMultiple = async (filtros) => {
    try {
      console.log("Filtros recibidos:", filtros);

      const esModoUnSolo = filtros.formato === 'unSolo';
      const esModoIndividuales = filtros.formato === 'individuales';
      const esPorFechas = filtros.modo === 'porFechas';
      const esPorNumeros = filtros.modo === 'porNumeros';

      if (esPorFechas && esModoUnSolo) {
        console.log("MODO: Por Fechas + Un solo documento");
        Swal.fire({
          title: "Generando PDF múltiple...",
          text: `Generando ${filtros.pedidosEncontrados} pedidos`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const blob = await imprimirPedidosMultiples(filtros);
        const fileURL = URL.createObjectURL(blob);

        Swal.close();

        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const esAndroid = /android/i.test(ua);
        const esIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const esWindows = /Win/i.test(ua);
        const esMac = /Mac/i.test(ua);
        const esMovilOTablet = !esWindows && !esMac;

        if (esMovilOTablet) {
          const a = document.createElement("a");
          a.href = fileURL;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
        } else {
          setUrlPDF(fileURL);
          setMostrarModal(true);
        }
      }
      else if (esPorFechas && esModoIndividuales) {
        console.log("MODO: Por Fechas + Documentos individuales");
        Swal.fire({
          title: "Buscando pedidos por fechas...",
          text: `Buscando pedidos del ${filtros.fechaDesde} al ${filtros.fechaHasta}`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const resultado = await getRangoPedidos({
            modo: 'porFechas',
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            bodegaId: filtros.bodegaId || '',
            tipoDocumento: filtros.tipoDocumento
          });

          console.log("Resultado de búsqueda por fechas:", resultado);

          Swal.close();

          if (!resultado.success || resultado.total === 0) {
            Swal.fire('Error', resultado.message || 'No se encontraron pedidos en el rango de fechas seleccionado', 'error');
            return;
          }

          const confirmacion = await Swal.fire({
            title: `¿Descargar ${resultado.total} archivos?`,
            html: `
            <div class="text-left">
              <p>Se descargarán <strong>${resultado.total} archivos PDF</strong>.</p>
              <p class="text-sm text-gray-600 mt-2">
                El navegador pedirá confirmación para cada descarga.<br>
                <strong>Recomendación:</strong> Permite todas las descargas.
              </p>
              <div class="mt-3 border-t pt-2">
                <p class="text-xs font-semibold">Filtros aplicados:</p>
                <p class="text-xs">• ${filtros.fechaDesde} a ${filtros.fechaHasta}</p>
                ${filtros.bodegaId ? `<p class="text-xs">• Bodega: ${filtros.bodegaId}</p>` : ''}
                <p class="text-xs">• Tipo: ${filtros.tipoDocumento}</p>
                <p class="text-xs">• Formato: Documentos individuales</p>
              </div>
            </div>
          `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Descargar ${resultado.total} archivos`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981',
            width: '450px'
          });

          if (!confirmacion.isConfirmed) return;

          await descargarPDFsIndividuales(resultado.pedidos, filtros.tipoDocumento);

        } catch (error) {
          console.error("Error obteniendo pedidos por fechas:", error);
          Swal.close();
          Swal.fire('Error', `Error al buscar pedidos: ${error.message}`, 'error');
          return;
        }
      }
      else if (esPorNumeros && esModoUnSolo) {
        console.log("MODO: Por Números + Un solo documento");
        Swal.fire({
          title: "Generando PDF único por rango...",
          text: `Generando pedidos PED-${filtros.numeroDesde} a PED-${filtros.numeroHasta}`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const datosEnvio = {
          ...filtros,
          modo: 'porNumeros',
          formato: 'unSolo'
        };

        const blob = await imprimirPedidosMultiples(datosEnvio);
        const fileURL = URL.createObjectURL(blob);

        Swal.close();

        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const esAndroid = /android/i.test(ua);
        const esIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const esWindows = /Win/i.test(ua);
        const esMac = /Mac/i.test(ua);
        const esMovilOTablet = !esWindows && !esMac;

        if (esMovilOTablet) {
          const a = document.createElement("a");
          a.href = fileURL;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
        } else {
          setUrlPDF(fileURL);
          setMostrarModal(true);
        }
      }
      else if (esPorNumeros && esModoIndividuales) {
        console.log("MODO: Por Números + Documentos individuales");
        Swal.fire({
          title: "Buscando pedidos...",
          text: "Obteniendo información del rango seleccionado",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const resultado = await getRangoPedidos({
          modo: 'porNumeros',
          numeroDesde: filtros.numeroDesde,
          numeroHasta: filtros.numeroHasta,
          bodegaId: filtros.bodegaId || '',
          tipoDocumento: filtros.tipoDocumento
        });

        Swal.close();

        if (!resultado.success || resultado.total === 0) {
          Swal.fire('Error', resultado.message || 'No se encontraron pedidos', 'error');
          return;
        }

        const confirmacion = await Swal.fire({
          title: `¿Descargar ${resultado.total} archivos?`,
          html: `
          <div class="text-left">
            <p>Se descargarán <strong>${resultado.total} archivos PDF</strong>.</p>
            <p class="text-sm text-gray-600 mt-2">
              El navegador pedirá confirmación para cada descarga.<br>
              <strong>Recomendación:</strong> Permite todas las descargas.
            </p>
            <div class="mt-3 border-t pt-2">
              <p class="text-xs font-semibold">Filtros aplicados:</p>
              <p class="text-xs">• PED-${filtros.numeroDesde} a PED-${filtros.numeroHasta}</p>
              ${filtros.bodegaId ? `<p class="text-xs">• Bodega: ${filtros.bodegaId}</p>` : ''}
              <p class="text-xs">• Tipo: ${filtros.tipoDocumento}</p>
              <p class="text-xs">• Formato: Documentos individuales</p>
            </div>
          </div>
        `,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: `Descargar ${resultado.total} archivos`,
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#10b981',
          width: '450px'
        });

        if (!confirmacion.isConfirmed) return;

        await descargarPDFsIndividuales(resultado.pedidos, filtros.tipoDocumento);
      }

    } catch (error) {
      console.error("Error en handlePrintMultiple:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Error al procesar la solicitud",
      });
    }
  };

  const descargarPDFsIndividuales = async (pedidos, tipoDocumento) => {
    let descargados = 0;
    let errores = [];

    Swal.fire({
      title: "Descargando archivos...",
      html: `
    <div class="space-y-3">
      <div class="flex justify-between">
        <span>Progreso:</span>
        <span class="font-bold">${descargados}/${pedidos.length}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div id="progreso-bar" class="bg-green-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
      <div id="archivo-actual" class="text-sm text-gray-700">
        Preparando...
      </div>
      <div class="text-xs text-gray-500">
        Formato: Cliente_Bodega_Fecha_Tipo.pdf
      </div>
    </div>
  `,
      showConfirmButton: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    const descargarUnArchivo = async (pedido) => {
      try {
        if (document.getElementById('archivo-actual')) {
          document.getElementById('archivo-actual').textContent =
            `Descargando: PED-${pedido.id} - ${pedido.cliente ? pedido.cliente.substring(0, 30) : 'Sin cliente'}`;
        }

        const blob = await imprimirPedido(pedido.id, tipoDocumento);

        const limpiarTexto = (texto) => {
          if (!texto) return 'SinDato';
          return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .trim();
        };

        const prefijoMap = {
          'pedido': 'Pedido_Buf',
          'bol': 'BOL_BUF',
          'listaempaque': 'ListaEmpaque_Buf',
          'listaempaqueprecios': 'ListaEmpaquePrecios_Buf'
        };

        const prefijo = prefijoMap[tipoDocumento] || 'Documento_Buf';
        const poLimpio = pedido.po ? limpiarTexto(pedido.po) : 'SinPO';
        const clienteLimpio = pedido.cliente ? limpiarTexto(pedido.cliente) : 'SinCliente';
        const regionLimpia = pedido.region ? limpiarTexto(pedido.region) : 'SinRegion';
        const listaLimpia = pedido.id ? pedido.id.toString() : 'SinLista';

        const nombreArchivo = `${prefijo}_${poLimpio}_${clienteLimpio}_${regionLimpia}_${listaLimpia}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        descargados++;

        if (document.getElementById('progreso-bar')) {
          const porcentaje = (descargados / pedidos.length) * 100;
          document.getElementById('progreso-bar').style.width = `${porcentaje}%`;
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error descargando PED-${pedido.id}:`, error);
        errores.push(`PED-${pedido.id}: ${error.message.substring(0, 50)}`);
      }
    };

    for (const pedido of pedidos) {
      await descargarUnArchivo(pedido);
    }

    Swal.close();

    if (errores.length === 0) {
      Swal.fire({
        title: '✅ Descarga completada',
        html: `
      <div class="space-y-2">
        <p>Se descargaron <strong>${descargados} archivos</strong> correctamente.</p>
        <p class="text-sm text-gray-600">
          Revisa tu carpeta de descargas.
        </p>
      </div>
    `,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } else {
      Swal.fire({
        title: '⚠️ Descarga parcial',
        html: `
      <div class="space-y-2">
        <p>Se descargaron <strong>${descargados} de ${pedidos.length}</strong> archivos.</p>
        <p class="text-sm text-red-600">
          Errores: ${errores.length}
        </p>
        <div class="text-xs max-h-20 overflow-y-auto">
          ${errores.slice(0, 3).map(e => `<div>• ${e}</div>`).join('')}
          ${errores.length > 3 ? `<div>• ... y ${errores.length - 3} más</div>` : ''}
        </div>
      </div>
    `,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const getNombreDocumento = (tipo) => {
    const nombres = {
      pedido: "Pedido",
      bol: "BOL",
      listaempaque: "Lista de Empaque",
      listaempaqueprecios: "Lista Empaque Precios",
    };
    return nombres[tipo] || "Documento";
  };

  const handleSeleccionarDocumento = (tipoDocumento) => {
    setMostrarSelectorDocumento(false);
    handlePrint(tipoDocumento);
  };

  const handleAbrirImpresionMultiple = () => {
    setMostrarImpresionMultiple(true);
  };

  const handleCloseModal = () => {
    setMostrarModal(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

  if (loadingDatos)
    return <p className="text-center text-gray-500 py-4">Cargando datos iniciales...</p>;
  if (errorDatos) return <p className="text-red-600 text-center py-4">{errorDatos}</p>;

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
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
            disabled={isSaving} // 👈 Deshabilitado mientras se guarda
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              isSaving
                ? "bg-gray-400 text-white cursor-not-allowed"
                : header.id && header.id !== 0
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isSaving
              ? (header.id && header.id !== 0 ? "Actualizando..." : "Guardando...")
              : (header.id && header.id !== 0 ? "Actualizar Pedido" : "Guardar Pedido")
            }
          </button>
          <button
            onClick={handleNew}
            className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
          >
            Nuevo Pedido
          </button>
          <button
            onClick={() => handlePrint()}
            disabled={!header.id}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${
              header.id
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Imprimir PDF
          </button>
          <button
            onClick={handleAbrirImpresionMultiple}
            className="bg-green-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-green-700 transition font-medium flex-1"
          >
            Imprimir Múltiple
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
        aerolineas={datosSelect.aerolineas}
        agencias={datosSelect.agencias}
        inputRefs={headerRefs}
        comentariosSeleccionados={comentariosSeleccionados}
        onComentariosChange={handleComentariosChange}
      />

      <PedidoDetail
        items={items}
        onChangeItems={handleItemsChange}
        itemRefsRef={itemRefs}
        productos={datosSelect.productos}
        embalajes={datosSelect.embalajes}
      />

      {/* Modal de búsqueda */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-20 bg-black/50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h3 className="text-lg font-semibold">Buscar Pedidos ({pedidosFiltrados.length})</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filtrar por ID, cliente, fecha o P.O. ..."
                  className="border rounded px-3 py-2 flex-1 min-w-[200px]"
                  value={filtroPedidos}
                  onChange={(e) => setFiltroPedidos(e.target.value)}
                />
                <button
                  onClick={cerrarModalBuscarPedidos}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {cargandoPedidos ? (
              <div className="text-center py-8">Cargando pedidos...</div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-600 border-2 border-dashed rounded-lg bg-gray-50">
                {filtroPedidos ? "No se encontraron pedidos con ese filtro." : "No hay pedidos registrados."}
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                {/* Tabla para escritorio */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-left border-b bg-gray-50">
                      <tr>
                        <th className="py-2 px-2 font-semibold">ID</th>
                        <th className="py-2 px-2 font-semibold">Cliente</th>
                        <th className="py-2 px-2 font-semibold">Fecha Orden</th>
                        <th className="py-2 px-2 font-semibold">P.O.</th>
                        <th className="py-2 px-2 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosFiltrados.map((p) => (
                        <tr key={p.idPedido} className="hover:bg-gray-50 border-b">
                          <td className="py-2 px-2 font-medium">{p.idPedido}</td>
                          <td className="py-2 px-2">{p.Nombre}</td>
                          <td className="py-2 px-2">{p.FechaOrden}</td>
                          <td className="py-2 px-2">{p.PurchaseOrder || "-"}</td>
                          <td className="py-2 px-2 text-right">
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                              onClick={() => handleSelectPedido(p.idPedido)}
                            >
                              Cargar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards para móviles */}
                <div className="block md:hidden space-y-3">
                  {pedidosFiltrados.map((p) => (
                    <div
                      key={p.idPedido}
                      className="border rounded-lg p-4 shadow-sm bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-gray-700">ID:</span>
                            <p className="text-gray-900 font-medium">PED-{String(p.idPedido).padStart(6, "0")}</p>
                          </div>
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                            onClick={() => handleSelectPedido(p.idPedido)}
                          >
                            Cargar
                          </button>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Cliente:</span>
                          <p className="text-gray-900">{p.Nombre}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Fecha:</span>
                          <p className="text-gray-900">{p.FechaOrden}</p>
                        </div>
                        {p.PurchaseOrder && (
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <span className="font-semibold text-blue-700">Purchase Order:</span>
                            <p className="text-blue-900 font-medium">{p.PurchaseOrder}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de selección de documento individual */}
      <ModalSeleccionDocumento
        isOpen={mostrarSelectorDocumento}
        onClose={() => setMostrarSelectorDocumento(false)}
        onSeleccionar={handleSeleccionarDocumento}
        pedidoId={header.id}
      />

      {/* Modal de impresión múltiple */}
      <ModalImpresionMultiple
        isOpen={mostrarImpresionMultiple}
        onClose={() => setMostrarImpresionMultiple(false)}
        onImprimir={handlePrintMultiple}
        bodegas={datosSelect.bodegas}
      />

      {/* Modal visor PDF */}
      {mostrarModal && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}