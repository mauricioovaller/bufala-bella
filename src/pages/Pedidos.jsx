// PRIMERO: Pedidos.jsx con nuevo diseño visual
import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import PedidoHeader from "../components/pedidos/PedidoHeader";
import PedidoDetail from "../components/pedidos/PedidoDetail";
import ModalSeleccionDocumento from "../components/ModalSeleccionDocumento";
import ModalVisorPreliminar from "../components/ModalVisorPreliminar";
import ModalImpresionMultiple from "../components/ModalImpresionMultiple"; // 👈 NUEVO
import {
  getDatosSelect,
  getClienteRegion,
  guardarPedido,
  getPedidos,
  getPedidoEspecifico,
  actualizarPedido,
  imprimirPedido,
  imprimirPedidosMultiples, // 👈 NUEVO - agregar en services
} from "../services/pedidosService";


const comentariosPorCliente = {
  "11": "Indicaciones Especiales: CON CODIGO DE BARRAS", // Cliente ID 11  
  // AgregaR aquí los clientes que necesiten comentarios por defecto
};

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
    aerolineaId: "107",
    agenciaId: "44",
    noGuia: "",
    guiaHija: "",
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
  // 👇 NUEVO: Estados para comentarios seleccionados
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

  // Regiones dependientes del cliente seleccionado
  const [regiones, setRegiones] = useState([]);

  // Estados de carga inicial
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState(null);

  // Estados de carga inicial del modal de selección de documento
  const [mostrarSelectorDocumento, setMostrarSelectorDocumento] = useState(false);
  
  // 👇 NUEVO: Estado para modal de impresión múltiple
  const [mostrarImpresionMultiple, setMostrarImpresionMultiple] = useState(false);

  // --------------------------------------------------------------
  // Estados para búsqueda y selección de pedidos - MEJORADOS
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

        // Lógica para comentarios automáticos
        let nuevoComentario = header.comentarios || "";

        // Aplicar comentario por defecto si existe para este cliente
        const comentarioPorDefecto = comentariosPorCliente[String(value)];
        if (comentarioPorDefecto) {
          // Verificar si el comentario automático ya está presente
          const comentarioYaExiste = nuevoComentario.includes(comentarioPorDefecto);

          if (!comentarioYaExiste) {
            // Si ya hay comentarios, agregamos el nuevo con un separador
            if (nuevoComentario) {
              nuevoComentario += "\n\n---\n\n" + comentarioPorDefecto;
            } else {
              nuevoComentario = comentarioPorDefecto;
            }
          }
        }

        // 👇 SOLO actualizar el cliente y limpiar campos, SIN calcular fechas
        setHeader((p) => ({
          ...p,
          clienteId: value,
          regionId: "",
          bodegaId: "", // 👈 Limpiar bodega al cambiar cliente
          comentarios: nuevoComentario, // 👈 Aquí aplicamos el comentario automático
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
  // 👇 NUEVO: Manejo de cambios en comentarios seleccionados
  // --------------------------------------------------------------
  function handleComentariosChange(field, value) {
    setComentariosSeleccionados(prev => ({
      ...prev,
      [field]: value
    }));
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
      // 👇 MODIFICADO: Incluir comentarios seleccionados en el encabezado
      const encabezado = {
        ...header,
        comentariosSeleccionados: comentariosSeleccionados // 👈 Agregar esto
      };

      // Si el pedido ya tiene ID (diferente de 0 o null/undefined), significa que ya existe en BD → ACTUALIZAR
      if (header.id && header.id !== 0) {
        const encabezadoConId = {
          ...encabezado,
          pedidoId: header.id,
        };

        const res = await actualizarPedido(encabezadoConId, items);
        if (res.success) {
          Swal.fire("¡Actualizado!", "Pedido actualizado correctamente.", "success");
          // Opcional: refrescar el pedido desde backend
          // handleSelectPedido(header.id);
        } else {
          Swal.fire("Error", res.message || "No se pudo actualizar.", "error");
        }
      } else {
        // Si no tiene ID → GUARDAR NUEVO
        const res = await guardarPedido(encabezado, items);
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
      // 👇 MODIFICADO: Incluir comentarios seleccionados
      const encabezado = {
        ...header,
        pedidoId: header.id,   // 👈 obligatorio para el backend
        comentariosSeleccionados: comentariosSeleccionados // 👈 Agregar esto
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
      bodegaId: "", // 👈 Limpiar bodega también
      aerolineaId: "107",
      agenciaId: "44",
      noGuia: "",
      guiaHija: "",
    });
    setItems([]);
    setRegiones([]);
    // 👇 NUEVO: Limpiar comentarios seleccionados
    setComentariosSeleccionados({
      incluirPrimario: true,
      incluirSecundario: true
    });
    itemRefs.current = [];
  }

  // --------------------------------------------------------------
  // 👇 FUNCIONES MEJORADAS para búsqueda de pedidos
  // --------------------------------------------------------------

  // Abrir modal y cargar pedidos
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

  // Cerrar modal
  const cerrarModalBuscarPedidos = () => {
    setShowModal(false);
    setPedidos([]);
    setFiltroPedidos("");
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter((p) => {
    if (!filtroPedidos) return true;
    const f = filtroPedidos.toString().trim().toLowerCase();
    return (
      String(p.idPedido).includes(f) ||
      (p.Nombre && p.Nombre.toLowerCase().includes(f)) ||
      (p.FechaOrden && p.FechaOrden.toLowerCase().includes(f))
    );
  });

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
        aerolineaId: apiHeader.Id_Aerolinea ?? apiHeader.IdAerolinea ?? "",
        agenciaId: apiHeader.Id_Agencia ?? apiHeader.IdAgencia ?? "",
        noGuia: apiHeader.Guia_Master ?? apiHeader.GuiaMaster ?? "",
        guiaHija: apiHeader.Guia_Hija ?? apiHeader.GuiaHija ?? "",
      };

      // 👇 NUEVO: Cargar comentarios seleccionados desde la API
      const comentariosCargados = {
        incluirPrimario: apiHeader.ComentarioPrimario === 1,
        incluirSecundario: apiHeader.ComentarioSecundario === 1
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
      // 👇 NUEVO: Cargar comentarios seleccionados
      setComentariosSeleccionados(comentariosCargados);
      itemRefs.current = [];

      cerrarModalBuscarPedidos();
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
  // Función para manejar la impresión con selección de documento (INDIVIDUAL)
  // --------------------------------------------------------------
  const handlePrint = async (tipoDocumento = null) => {
    if (!header.id) {
      Swal.fire("Aviso", "No hay pedido para imprimir.", "info");
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
      const blob = await imprimirPedido(header.id, tipoDocumento);
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
        text: `No se pudo generar el ${getNombreDocumento(tipoDocumento)}. Verifica que el pedido exista y tenga datos.`,
      });
    }
  };

  // --------------------------------------------------------------
  // 👇 NUEVO: Función para impresión múltiple
  // --------------------------------------------------------------
  const handlePrintMultiple = async (filtros) => {
    try {
      // Mostrar loading
      Swal.fire({
        title: "Generando PDF Múltiple...",
        text: `Generando ${filtros.pedidosEncontrados} pedidos`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Detectar sistema operativo (misma lógica que handlePrint)
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const esAndroid = /android/i.test(ua);
      const esIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const esWindows = /Win/i.test(ua);
      const esMac = /Mac/i.test(ua);

      const esMovilOTablet = !esWindows && !esMac;

      let pestañaPreabierta = null;
      if (esMovilOTablet) {
        try {
          pestañaPreabierta = window.open("", "_blank");
        } catch (e) {
          pestañaPreabierta = null;
        }
      }

      // Generar el PDF múltiple
      const blob = await imprimirPedidosMultiples(filtros);
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
      console.error("Error al imprimir múltiple:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo generar el PDF múltiple. Verifica los filtros.`,
      });
    }
  };

  // Función auxiliar para obtener nombres de documentos
  const getNombreDocumento = (tipo) => {
    const nombres = {
      pedido: "Pedido",
      bol: "BOL",
      listaempaque: "Lista de Empaque",
      listaempaqueprecios: "Lista Empaque Precios",
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

  // 👇 NUEVO: Abrir modal de impresión múltiple
  const handleAbrirImpresionMultiple = () => {
    setMostrarImpresionMultiple(true);
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
      {/* Barra de acciones - NUEVO DISEÑO CON BOTÓN MÚLTIPLE */}
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
            onClick={() => handlePrint()} // Sin parámetro para que muestre el selector
            disabled={!header.id}
            className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${header.id
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            Imprimir PDF
          </button>
          {/* 👇 NUEVO BOTÓN IMPRIMIR MÚLTIPLE */}
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
        // 👇 NUEVO: Pasar los comentarios seleccionados
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

      {/* 👇 MODAL MEJORADO con filtro rápido */}
      {showModal && (
        <div className="fixed inset-0 z-60 flex items-start justify-center p-4 pt-20 bg-black/50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
              <h3 className="text-lg font-semibold">Buscar Pedidos ({pedidosFiltrados.length})</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filtrar por ID, cliente o fecha..."
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
                {/* Tabla para pantallas grandes */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-left border-b bg-gray-50">
                      <tr>
                        <th className="py-2 px-2 font-semibold">ID</th>
                        <th className="py-2 px-2 font-semibold">Cliente</th>
                        <th className="py-2 px-2 font-semibold">Fecha Orden</th>
                        <th className="py-2 px-2 font-semibold">Purchase Order</th>
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

                {/* Cards para pantallas móviles */}
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
                            <p className="text-gray-900 font-medium">{p.idPedido}</p>
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
                          <div>
                            <span className="font-semibold text-gray-700">PO:</span>
                            <p className="text-gray-900">{p.PurchaseOrder}</p>
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

      {/* Modal de selección de tipo de documento (INDIVIDUAL) */}
      <ModalSeleccionDocumento
        isOpen={mostrarSelectorDocumento}
        onClose={() => setMostrarSelectorDocumento(false)}
        onSeleccionar={handleSeleccionarDocumento}
        pedidoId={header.id}
      />

      {/* 👇 NUEVO: Modal de impresión múltiple */}
      <ModalImpresionMultiple
        isOpen={mostrarImpresionMultiple}
        onClose={() => setMostrarImpresionMultiple(false)}
        onImprimir={handlePrintMultiple}
        bodegas={datosSelect.bodegas}
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