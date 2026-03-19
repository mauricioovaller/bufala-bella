// PRIMERO: PedidosSample.jsx con nuevo diseño visual
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import PedidoHeaderSample from "../components/pedidosSample/PedidoHeaderSample";
import PedidoDetail from "../components/pedidos/PedidoDetail";
import ModalSeleccionDocumento from "../components/ModalSeleccionDocumento";
import ModalVisorPreliminar from "../components/ModalVisorPreliminar";
import ModalImpresionMultiple from "../components/ModalImpresionMultiple";
import {
  getDatosSelect,
  getClienteRegion,
  guardarSample,
  getSamples,
  getSampleEspecifico,
  actualizarSample,
  imprimirSample,
  imprimirSamplesMultiples,
  getRangeSamples,
} from "../services/pedidosSampleService";

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

export default function PedidosSample() {
  // --------------------------------------------------------------
  // Estado del encabezado
  // --------------------------------------------------------------
  const [header, setHeader] = useState({
    numero: `SAMP-000000`,
    clienteTexto: "",           // 👈 ÚNICO CAMPO para el texto final
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
    bodegaId: "",
    transportadoraId: "",
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
    aerolineas: [],
    agencias: [],
  });

  // Regiones dependientes del cliente seleccionado
  const [regiones, setRegiones] = useState([]);

  // Estados de carga inicial
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState(null);

  // Estados de carga inicial del modal de selección de documento
  const [mostrarSelectorDocumento, setMostrarSelectorDocumento] = useState(false);

  // Estados para búsqueda y selección de samples - MEJORADOS
  const [samples, setSamples] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cargandoSamples, setCargandoSamples] = useState(false);
  const [filtroSamples, setFiltroSamples] = useState("");

  // Estados para el visor de PDF
  const [urlPDF, setUrlPDF] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Estados para impresión múltiple
  const [mostrarImpresionMultiple, setMostrarImpresionMultiple] = useState(false);

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

        // 👇 SOLO actualizar el cliente y limpiar campos, SIN calcular fechas
        setHeader((p) => ({
          ...p,
          clienteId: value,
          regionId: "",
          bodegaId: "", // 👈 Limpiar bodega al cambiar cliente
          // ❌ QUITAR todos los cálculos automáticos de fechas
        }));
        return;
      }
    }

    // 👇 Cambio de región → cargar bodega automáticamente
    if (field === "regionId") {
      const regionSeleccionada = regiones.find(
        (r) => String(r.idClienteRegion) === String(value)
      );

      if (regionSeleccionada && regionSeleccionada.idBodega) {
        // Cargar automáticamente la bodega asociada a la región
        setHeader((p) => ({
          ...p,
          regionId: value,
          bodegaId: regionSeleccionada.idBodega // 👈 Cargar bodega automáticamente
        }));
      } else {
        setHeader((p) => ({
          ...p,
          regionId: value,
          bodegaId: "" // 👈 Limpiar bodega si no hay asociada
        }));
      }
      return;
    }

    // 👇 NUEVO: Cambio de fechaSalida → recalcular otras fechas
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
        fechaIngreso: value, // 👈 Misma fecha que salida
      }));
      return;
    }

    // 👇 Cambio de fechaOrden → SOLO actualizar ese campo, SIN cálculos
    if (field === "fechaOrden") {
      setHeader((p) => ({ ...p, fechaOrden: value }));
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

    if (!header.clienteTexto || String(header.clienteTexto).trim() === "") {
      Swal.fire("Error", "El cliente/destinatario es obligatorio.", "warning");
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
  // Guardar sample (ahora decide si guardar nuevo o actualizar)
  // --------------------------------------------------------------
  async function handleSave() {
    if (!validateAll()) return;

    try {
      // 👇 AQUÍ EL CAMBIO: Asegurar que items tengan pesos
      const itemsConPesos = items.map(item => ({
        ...item,
        pesoNeto: item.pesoNeto || 0,
        pesoBruto: item.pesoBruto || 0,
        subtotal: item.subtotal || 0
      }));
      // Si el sample ya tiene ID (diferente de 0 o null/undefined), significa que ya existe en BD → ACTUALIZAR
      if (header.id && header.id !== 0) {
        const encabezado = {
          ...header,
          sampleId: header.id,
        };

        const res = await actualizarSample(encabezado, itemsConPesos);
        if (res.success) {
          Swal.fire("¡Actualizado!", "Sample actualizado correctamente.", "success");
          // Opcional: refrescar el sample desde backend
          // handleSelectSample(header.id);
        } else {
          Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
        }
      } else {
        // Si no tiene ID → GUARDAR NUEVO
        const res = await guardarSample(header, itemsConPesos);
        if (res.success) {
          const nuevoNumero = `SAMP-${String(res.idPedido).padStart(6, "0")}`;
          setHeader((p) => ({ ...p, id: res.idPedido, numero: nuevoNumero }));
          Swal.fire("¡Guardado!", "Sample guardado correctamente.", "success");
        } else {
          Swal.fire("Error", res.message || "No se pudo guardar.", "error");
        }
      }
    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al procesar el sample.", "error");
    }
  }

  // --------------------------------------------------------------
  // Actualizar sample
  // --------------------------------------------------------------
  async function handleUpdate() {
    if (!header.id) {
      Swal.fire("Aviso", "No hay sample cargado para actualizar.", "info");
      return;
    }

    if (!validateAll()) return;

    try {
      // 👇 AQUÍ EL CAMBIO: Asegurar que items tengan pesos
      const itemsConPesos = items.map(item => ({
        ...item,
        pesoNeto: item.pesoNeto || 0,
        pesoBruto: item.pesoBruto || 0,
        subtotal: item.subtotal || 0
      }));

      const encabezado = {
        ...header,
        pedidoId: header.id,   // 👈 obligatorio para el backend
      };

      const res = await actualizarSample(encabezado, itemsConPesos);
      if (res.success) {
        Swal.fire("¡Actualizado!", "Sample actualizado correctamente.", "success");
        // refrescar el sample desde backend
        //handleSelectSample(header.id);
      } else {
        Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Ocurrió un error al actualizar.", "error");
    }
  }

  // --------------------------------------------------------------
  // Nuevo sample
  // --------------------------------------------------------------
  function handleNew() {
    setHeader({
      numero: `SAMP-000000`,
      clienteTexto: "",
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
      bodegaId: "", // 👈 Limpiar bodega también
      aerolineaId: "107",
      agenciaId: "44",
      noGuia: "",
      guiaHija: "",
    });
    setItems([]);
    setRegiones([]);
    itemRefs.current = [];
  }

  // --------------------------------------------------------------
  // 👇 FUNCIONES MEJORADAS para búsqueda de samples
  // --------------------------------------------------------------

  // Abrir modal y cargar samples
  async function handleOpenModal() {
    setShowModal(true);
    setCargandoSamples(true);
    setFiltroSamples("");

    try {
      const res = await getSamples();
      if (res.success) {
        setSamples(res.pedidos || []);
      } else {
        Swal.fire("Error", "No se pudieron cargar los samples", "error");
      }
    } catch (err) {
      console.error("Error cargando samples:", err);
      Swal.fire("Error", "Error al obtener samples", "error");
    } finally {
      setCargandoSamples(false);
    }
  }

  // Cerrar modal
  const cerrarModalBuscarSamples = () => {
    setShowModal(false);
    setSamples([]);
    setFiltroSamples("");
  };

  // Filtrar samples
  const samplesFiltrados = samples.filter((s) => {
    if (!filtroSamples) return true;
    const f = filtroSamples.toString().trim().toLowerCase();
    return (
      String(s.idPedido).includes(f) ||
      (s.ClienteTexto && s.ClienteTexto.toLowerCase().includes(f)) ||
      (s.Nombre && s.Nombre.toLowerCase().includes(f)) ||
      (s.FechaOrden && s.FechaOrden.toLowerCase().includes(f))
    );
  });

  // --------------------------------------------------------------
  // Cargar sample seleccionado (compatibilidad con varias formas de respuesta)
  // --------------------------------------------------------------
  async function handleSelectSample(id) {
    try {
      const res = await getSampleEspecifico(id);
      if (!res || !res.success) {
        Swal.fire("Error", res?.message || "No se pudo cargar el sample", "error");
        return;
      }

      // Soportar varios formatos de respuesta:
      // - { success: true, header: {...}, detalle: [...] }
      // - { success: true, sample: { header: {...}, detalle: [...] } }
      const apiHeader = res.header ?? res.sample?.header ?? res.sample ?? null;
      const apiDetalle = res.detalle ?? res.sample?.detalle ?? res.sample?.items ?? [];

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
        console.error("Error cargando regiones al cargar sample:", err);
        setRegiones([]);
      }

      // 3) Mapear el encabezado de la API a la forma que usa la UI
      const mappedHeader = {
        id: apiHeader.Id_EncabPedido ?? apiHeader.IdEncabPedido ?? apiHeader.id ?? null,
        numero:
          apiHeader.Id_EncabPedido
            ? `SAMP-${String(apiHeader.Id_EncabPedido).padStart(6, "0")}`
            : header.numero,
        clienteId: String(apiHeader.Id_Cliente ?? apiHeader.IdCliente ?? ""),
        clienteTexto: apiHeader.Cliente ?? apiHeader.Cliente ?? "",
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
        // 👇 VALORES DEL BACKEND (si existen)
        const pesoNetoBackend = d.PesoNeto;
        const pesoBrutoBackend = d.PesoBruto;
        const valorRegistroBackend = d.ValorRegistro;

        // 👇 VALORES CALCULADOS (como referencia)
        const pesoNetoCalc = ((cantidad * cantidadEmbalaje * pesoGr) / 1000) || 0;
        const pesoBrutoCalc = ((cantidad * cantidadEmbalaje * pesoGr * factorPesoBruto) / 1000) || 0;

        // 👇 DECIDIR QUÉ VALORES USAR: primero los del backend, sino los calculados
        const pesoNetoFinal = (pesoNetoBackend !== undefined && pesoNetoBackend !== null)
          ? pesoNetoBackend
          : pesoNetoCalc;

        const pesoBrutoFinal = (pesoBrutoBackend !== undefined && pesoBrutoBackend !== null)
          ? pesoBrutoBackend
          : pesoBrutoCalc;

        const subtotalFinal = (valorRegistroBackend !== undefined && valorRegistroBackend !== null)
          ? valorRegistroBackend
          : (pesoNetoFinal * precio);

        return {
          id: d.Id_DetSample ?? d.IdDetSample ?? d.id ?? null,
          producto: d.Id_Producto ?? d.IdProducto ?? "",
          descripcion: d.Descripcion ?? d.Descripción ?? d.descripcion ?? "",
          pesoGr: pesoGr,
          factorPesoBruto: factorPesoBruto,
          embalaje: d.Id_Embalaje ?? d.IdEmbalaje ?? "",
          cantidad: cantidad,
          precio: precio,
          pesoNeto: pesoNetoFinal,
          pesoBruto: pesoBrutoFinal,
          subtotal: subtotalFinal,
          cantidadEmbalaje: cantidadEmbalaje,
        };
      });

      // 5) Aplicar al estado
      setHeader((p) => ({ ...p, ...mappedHeader }));
      setItems(mappedItems);
      itemRefs.current = [];

      cerrarModalBuscarSamples();
      Swal.fire("Cargado", "Sample cargado correctamente.", "success");
    } catch (err) {
      console.error("Error en handleSelectSample:", err);
      Swal.fire("Error", "Error al obtener el sample", "error");
    }
  }

  // --------------------------------------------------------------
  // Otras acciones
  // --------------------------------------------------------------
  function handleRefresh() {
    if (!header.id) {
      Swal.fire("Aviso", "Primero cargue o guarde un sample.", "info");
      return;
    }
    handleSelectSample(header.id);
  }

  // --------------------------------------------------------------
  // Función para manejar la impresión con selección de documento
  // --------------------------------------------------------------
  const handlePrint = async (tipoDocumento = null) => {
    if (!header.id) {
      Swal.fire("Aviso", "No hay sample para imprimir.", "info");
      return;
    }

    // Si no se especificó el tipo de documento, mostrar el selector
    if (!tipoDocumento) {
      setMostrarSelectorDocumento(true);
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        title: "Generando PDF...",
        text: `Generando ${getNombreDocumento(tipoDocumento)}`,
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

      // Generar el PDF con el tipo de documento especificado
      const blob = await imprimirSample(header.id, tipoDocumento);
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
        text: `No se pudo generar el ${getNombreDocumento(tipoDocumento)}. Verifica que el sample exista y tenga datos.`,
      });
    }
  };

  // Función auxiliar para obtener nombres de documentos
  const getNombreDocumento = (tipo) => {
    const nombres = {
      sample: "Sample",
      listaempaque: "Lista de Empaque",
    };
    return nombres[tipo] || "Documento";
  };

  // --------------------------------------------------------------
  // Manejar selección de tipo de documento
  // --------------------------------------------------------------
  const handleSeleccionarDocumento = (tipoDocumento) => {
    setMostrarSelectorDocumento(false);
    handlePrint(tipoDocumento);
  };

  // Función para cerrar el modal y limpiar la URL
  const handleCloseModal = () => {
    setMostrarModal(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

  // 👇 NUEVA FUNCIÓN: Abrir modal de impresión múltiple
  const handleAbrirImpresionMultiple = () => {
    setMostrarImpresionMultiple(true);
  };

  // 👇 NUEVA FUNCIÓN: Manejar impresión múltiple
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
          text: `Generando ${filtros.pedidosEncontrados} samples`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const blob = await imprimirSamplesMultiples(filtros);
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
          title: "Buscando samples por fechas...",
          text: `Buscando samples del ${filtros.fechaDesde} al ${filtros.fechaHasta}`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const resultado = await getRangeSamples({
            modo: 'porFechas',
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            bodegaId: filtros.bodegaId || '',
            tipoDocumento: filtros.tipoDocumento
          });

          console.log("Resultado de búsqueda por fechas:", resultado);

          Swal.close();

          if (!resultado.success || resultado.total === 0) {
            Swal.fire('Error', resultado.message || 'No se encontraron samples en el rango de fechas seleccionado', 'error');
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
          console.error("Error obteniendo samples por fechas:", error);
          Swal.close();
          Swal.fire('Error', `Error al buscar samples: ${error.message}`, 'error');
          return;
        }
      }
      else if (esPorNumeros && esModoUnSolo) {
        console.log("MODO: Por Números + Un solo documento");
        Swal.fire({
          title: "Generando PDF único por rango...",
          text: `Generando samples SAMP-${String(filtros.numeroDesde).padStart(6, '0')} a SAMP-${String(filtros.numeroHasta).padStart(6, '0')}`,
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

        const blob = await imprimirSamplesMultiples(datosEnvio);
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
          title: "Buscando samples...",
          text: "Obteniendo información del rango seleccionado",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const resultado = await getRangeSamples({
          modo: 'porNumeros',
          numeroDesde: filtros.numeroDesde,
          numeroHasta: filtros.numeroHasta,
          bodegaId: filtros.bodegaId || '',
          tipoDocumento: filtros.tipoDocumento
        });

        Swal.close();

        if (!resultado.success || resultado.total === 0) {
          Swal.fire('Error', resultado.message || 'No se encontraron samples', 'error');
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
              <p class="text-xs">• SAMP-${String(filtros.numeroDesde).padStart(6, '0')} a SAMP-${String(filtros.numeroHasta).padStart(6, '0')}</p>
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

  // 👇 NUEVA FUNCIÓN: Descargar PDFs individuales con barra de progreso
  const descargarPDFsIndividuales = async (samples, tipoDocumento) => {
    let descargados = 0;
    let errores = [];

    Swal.fire({
      title: "Descargando archivos...",
      html: `
    <div class="space-y-3">
      <div class="flex justify-between">
        <span>Progreso:</span>
        <span class="font-bold">${descargados}/${samples.length}</span>
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

    const descargarUnArchivo = async (sample) => {
      try {
        if (document.getElementById('archivo-actual')) {
          document.getElementById('archivo-actual').textContent =
            `Descargando: SAMP-${String(sample.id).padStart(6, '0')} - ${sample.cliente ? sample.cliente.substring(0, 30) : 'Sin cliente'}`;
        }

        const blob = await imprimirSample(sample.id, tipoDocumento);

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
          'pedido': 'Sample_Buf',
          'bol': 'BOL_BUF',
          'listaempaque': 'ListaEmpaque_Buf',
          'listaempaqueprecios': 'ListaEmpaquePrecios_Buf'
        };

        const prefijo = prefijoMap[tipoDocumento] || 'Documento_Buf';
        const poLimpio = sample.po ? limpiarTexto(sample.po) : 'SinPO';
        const clienteLimpio = sample.cliente ? limpiarTexto(sample.cliente) : 'SinCliente';
        const regionLimpia = sample.region ? limpiarTexto(sample.region) : 'SinRegion';
        const sampleLimpia = sample.id ? sample.id.toString() : 'SinSample';

        const nombreArchivo = `${prefijo}_${poLimpio}_${clienteLimpio}_${regionLimpia}_${sampleLimpia}.pdf`;

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
          const porcentaje = (descargados / samples.length) * 100;
          document.getElementById('progreso-bar').style.width = porcentaje + '%';
        }

        if (document.getElementById('archivo-actual')) {
          document.getElementById('archivo-actual').textContent =
            `Completado: SAMP-${String(sample.id).padStart(6, '0')} ✓`;
        }

      } catch (error) {
        console.error(`Error descargando sample ${sample.id}:`, error);
        errores.push({ sample: sample.id, error: error.message });
        descargados++;

        if (document.getElementById('progreso-bar')) {
          const porcentaje = (descargados / samples.length) * 100;
          document.getElementById('progreso-bar').style.width = porcentaje + '%';
        }
      }
    };

    // Descargar archivos secuencialmente con delays
    for (const sample of samples) {
      await descargarUnArchivo(sample);
      // Delay entre descargas para no saturar el navegador
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    Swal.close();

    if (errores.length === 0) {
      Swal.fire({
        icon: 'success',
        title: `¡Descarga completada!`,
        html: `
        <div class="text-left">
          <p>Se descargaron correctamente <strong>${descargados}</strong> archivos.</p>
          <p class="text-sm text-gray-600 mt-2">
            Los archivos están en tu carpeta de descargas.
          </p>
        </div>
      `,
        confirmButtonColor: '#10b981'
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Descarga parcial',
        html: `
        <div class="text-left">
          <p>Se descargaron <strong>${descargados - errores.length}</strong> de <strong>${samples.length}</strong> archivos.</p>
          <p class="text-sm text-red-600 mt-2 font-semibold">Errores encontrados (${errores.length}):</p>
          <ul class="text-sm text-gray-700 mt-1 ml-4">
            ${errores.map(e => `<li>• Sample ${e.sample}: ${e.error}</li>`).join('')}
          </ul>
        </div>
      `,
        confirmButtonColor: '#ef4444'
      });
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
      {/* Barra de acciones - ACTUALIZADO A SAMPLES */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">Gestión de Samples</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
          >
            Buscar Samples
          </button>
          <button
            onClick={handleSave}
            className="bg-orange-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-orange-600 transition font-medium flex-1"
          >
            {header.id && header.id !== 0 ? "Actualizar Sample" : "Guardar Sample"}
          </button>
          <button
            onClick={handleNew}
            className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
          >
            Nuevo Sample
          </button>
          <button
            onClick={() => handlePrint()} // Sin parámetro para que muestre el selector
            disabled={!header.id}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${header.id
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

      <PedidoHeaderSample
        header={header}
        onChange={handleHeaderChange}
        clientes={datosSelect.clientes}
        transportadoras={datosSelect.transportadoras}
        bodegas={datosSelect.bodegas}
        regiones={regiones}
        aerolineas={datosSelect.aerolineas}
        agencias={datosSelect.agencias}
        inputRefs={headerRefs}
      />

      <PedidoDetail
        items={items}
        onChangeItems={handleItemsChange}
        itemRefsRef={itemRefs}
        productos={datosSelect.productos}
        embalajes={datosSelect.embalajes}
      />

      {/* 👇 MODAL MEJORADO con filtro rápido para Samples */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-20 bg-black/50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h3 className="text-lg font-semibold">Buscar Samples ({samplesFiltrados.length})</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filtrar por ID, cliente/destinatario o fecha..."
                  className="border rounded px-3 py-2 flex-1 min-w-[200px]"
                  value={filtroSamples}
                  onChange={(e) => setFiltroSamples(e.target.value)}
                />
                <button
                  onClick={cerrarModalBuscarSamples}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {cargandoSamples ? (
              <div className="text-center py-8">Cargando samples...</div>
            ) : samplesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-600 border-2 border-dashed rounded-lg bg-gray-50">
                {filtroSamples ? "No se encontraron samples con ese filtro." : "No hay samples registrados."}
              </div>
            ) : (
              <div className="overflow-auto max-h-96">
                {/* Tabla para pantallas grandes */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-left border-b bg-gray-50">
                      <tr>
                        <th className="py-2 px-2 font-semibold">ID</th>
                        <th className="py-2 px-2 font-semibold">Cliente/Destinatario</th>
                        <th className="py-2 px-2 font-semibold">Fecha Orden</th>
                        <th className="py-2 px-2 font-semibold">Purchase Order</th>
                        <th className="py-2 px-2 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samplesFiltrados.map((s) => (
                        <tr key={s.idPedido} className="hover:bg-gray-50 border-b">
                          <td className="py-2 px-2 font-medium">{s.idPedido}</td>
                          <td className="py-2 px-2">{s.ClienteTexto || s.Nombre}</td>
                          <td className="py-2 px-2">{s.FechaOrden}</td>
                          <td className="py-2 px-2">{s.PurchaseOrder || "-"}</td>
                          <td className="py-2 px-2 text-right">
                            <button
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                              onClick={() => handleSelectSample(s.idPedido)}
                            >
                              Cargar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards para pantallas móviles */}
                <div className="block md:hidden space-y-3">
                  {samplesFiltrados.map((s) => (
                    <div
                      key={s.idPedido}
                      className="border rounded-lg p-4 shadow-sm bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-gray-700">ID:</span>
                            <p className="text-gray-900 font-medium">{s.idPedido}</p>
                          </div>
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                            onClick={() => handleSelectSample(s.idPedido)}
                          >
                            Cargar
                          </button>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Cliente/Destinatario:</span>
                          <p className="text-gray-900">{s.ClienteTexto || s.Nombre}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Fecha:</span>
                          <p className="text-gray-900">{s.FechaOrden}</p>
                        </div>
                        {s.PurchaseOrder && (
                          <div>
                            <span className="font-semibold text-gray-700">PO:</span>
                            <p className="text-gray-900">{s.PurchaseOrder}</p>
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

      {/* Modal de selección de tipo de documento */}
      <ModalSeleccionDocumento
        isOpen={mostrarSelectorDocumento}
        onClose={() => setMostrarSelectorDocumento(false)}
        onSeleccionar={handleSeleccionarDocumento}
        sampleId={header.id}
      />

      {/* Modal de impresión múltiple */}
      <ModalImpresionMultiple
        isOpen={mostrarImpresionMultiple}
        onClose={() => setMostrarImpresionMultiple(false)}
        onImprimir={handlePrintMultiple}
        bodegas={datosSelect.bodegas}
        tipoOrden="samples"
      />

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