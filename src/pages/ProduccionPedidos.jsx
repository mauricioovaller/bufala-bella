// src/pages/ProduccionPedidos.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { MessageCircle } from "lucide-react";
import {
  getPedidoProduccion,
  guardarProduccion,
  getResponsables,
  getLotes,
  getPedidosProduccion,
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
  // Estado para cambios locales (normal/sample)
  const [itemsEditados, setItemsEditados] = useState({});
  // Estado para cambios locales (Chile)
  const [chileItemsEditados, setChileItemsEditados] = useState({});
  // Estados de auto-guardado
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
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
    setChileItemsEditados({});
    try {
      const res = await getPedidoProduccion({ idPedido, tipo: tipoPedido });
      if (res.success) {
        setPedido(res.pedido);
        if (tipoPedido === "chile") {
          const inicialChile = {};
          res.pedido.items.forEach((item) => {
            inicialChile[item.idDet] = {
              lote: item.lote?.id || "",
              fechaElaboracion: item.fechaElaboracion || "",
              fechaVencimiento: item.fechaVencimiento || "",
              temperaturaInicial: item.temperaturaInicial || "",
              temperaturaFinal: item.temperaturaFinal || "",
              horaInicialPH: item.horaInicialPH || "",
              horaFinalPH: item.horaFinalPH || "",
            };
          });
          setChileItemsEditados(inicialChile);
        } else {
          const inicial = {};
          res.pedido.items.forEach((item) => {
            inicial[item.idDet] = {
              idResponsable: item.idResponsable || "",
              lotes: [
                item.lotes?.lote1?.id || "",
                item.lotes?.lote2?.id || "",
                item.lotes?.lote3?.id || "",
              ],
              cantidades: item.cantidades || [0, 0, 0],
            };
          });
          setItemsEditados(inicial);
        }
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
      const itemPrev = prev[idDet] || { lotes: ["", "", ""], cantidades: [0, 0, 0] };
      const nuevosLotes = [...(itemPrev.lotes || ["", "", ""])];
      nuevosLotes[posicion] = value;
      return {
        ...prev,
        [idDet]: { ...itemPrev, lotes: nuevosLotes },
      };
    });
  };
  const handleCantidadLoteChange = (idDet, posicion, value) => {
    setItemsEditados((prev) => {
      const itemPrev = prev[idDet] || { lotes: ["", "", ""], cantidades: [0, 0, 0] };
      const nuevosCantidades = [...(itemPrev.cantidades || [0, 0, 0])];
      nuevosCantidades[posicion] = parseInt(value) || 0;
      return {
        ...prev,
        [idDet]: { ...itemPrev, cantidades: nuevosCantidades },
      };
    });
  };
  const getCantidadLoteValue = (item, posicion) => {
    const editado = itemsEditados[item.idDet];
    if (editado && editado.cantidades && editado.cantidades[posicion] !== undefined) {
      return editado.cantidades[posicion];
    }
    return item.cantidades?.[posicion] || 0;
  };
  // ===== Handlers para Chile =====
  const getChileValue = (item, field) => {
    const editado = chileItemsEditados[item.idDet];
    if (editado && editado[field] !== undefined) return editado[field];
    return item[field] || "";
  };
  const handleChileChange = (idDet, field, value) => {
    setChileItemsEditados((prev) => {
      const nuevoEstado = { ...prev };
      if (field === "lote" || field === "fechaElaboracion") {
        // Sincronizar lote y fecha de elaboracion con TODOS los items del pedido
        pedido?.items?.forEach((item) => {
          const current = nuevoEstado[item.idDet] || {};
          nuevoEstado[item.idDet] = { ...current, [field]: value };
          // Recalcular vencimiento si cambió fechaElaboracion
          if (field === "fechaElaboracion" && value) {
            const dias = item.diasVencimiento || 0;
            if (dias > 0) {
              const fecha = new Date(value);
              fecha.setDate(fecha.getDate() + dias);
              nuevoEstado[item.idDet].fechaVencimiento = fecha.toISOString().split("T")[0];
            } else {
              nuevoEstado[item.idDet].fechaVencimiento = "";
            }
          }
        });
      } else {
        // temperaturaInicial, temperaturaFinal, horaInicialPH, horaFinalPH, fechaVencimiento — solo ese item
        const current = nuevoEstado[idDet] || {};
        nuevoEstado[idDet] = { ...current, [field]: value };
      }
      return nuevoEstado;
    });
  };

  const calcularTotalCantidades = (item) => {
  };
  const validarCantidadesLotes = (item) => {
    const total = calcularTotalCantidades(item);
    return total <= item.cantidad;
  };
  const obtenerMensajeValidacion = (item) => {
    const total = calcularTotalCantidades(item);
    const disponible = item.cantidad;
    const esValido = total <= disponible;
    return {
      texto: `Total: ${total} / Disponible: ${disponible}`,
      esValido,
      color: esValido ? "text-green-600" : "text-red-600",
      bgColor: esValido ? "bg-green-50" : "bg-red-50",
    };
  };

  const validarLotesYCantidadesPareados = (item) => {
    const errores = [];
    const editado = itemsEditados[item.idDet] || {};
    const lotes = editado.lotes || ["", "", ""];
    const cantidades = editado.cantidades || [0, 0, 0];
    const responsable = editado.idResponsable;

    // Validar que haya al menos un lote asignado
    const hayAlgunLote = lotes.some((lote) => lote && lote !== "");

    // Contar lotes con cantidad asignada (pareados correctamente)
    let lotesConCantidad = 0;
    for (let i = 0; i < 3; i++) {
      const loteAsignado = lotes[i] && lotes[i] !== "";
      const cantidadAsignada = cantidades[i] && cantidades[i] > 0;
      if (loteAsignado && cantidadAsignada) {
        lotesConCantidad++;
      }
    }

    // Si hay algún lote, DEBE estar seleccionado un responsable
    if (hayAlgunLote && !responsable) {
      errores.push(`Debe seleccionar un Responsable para asignar lotes`);
    }

    // Si hay responsable, DEBE haber al menos un lote con cantidad asignada
    if (responsable && lotesConCantidad === 0) {
      errores.push(`Debe asignar al menos un Lote con su respectiva Cantidad`);
    }

    for (let i = 0; i < 3; i++) {
      const loteAsignado = lotes[i] && lotes[i] !== "";
      const cantidadAsignada = cantidades[i] && cantidades[i] > 0;

      // Si hay lote pero NO cantidad
      if (loteAsignado && !cantidadAsignada) {
        errores.push(`Lote ${i + 1} asignado pero sin cantidad`);
      }

      // Si hay cantidad pero NO lote
      if (!loteAsignado && cantidadAsignada) {
        errores.push(`Cantidad asignada en Lote ${i + 1} pero sin lote seleccionado`);
      }
    }

    return errores;
  };

  const validarTodosPedidos = () => {
    const itemsConError = [];
    pedido.items.forEach((item) => {
      // Validación 1: Lote y Cantidad deben estar pareados
      const erroresLoteCantidad = validarLotesYCantidadesPareados(item);
      if (erroresLoteCantidad.length > 0) {
        itemsConError.push(
          `${item.producto}: ${erroresLoteCantidad.join(", ")}`
        );
      }

      // Validación 2: Total de cantidades no debe exceder disponible
      if (!validarCantidadesLotes(item)) {
        const total = calcularTotalCantidades(item);
        const disponible = item.cantidad;
        itemsConError.push(
          `${item.producto}: ${total} unidades > ${disponible} disponibles`
        );
      }
    });
    return itemsConError;
  };
  const handleGuardar = async () => {
    if (!pedido) {
      Swal.fire("Aviso", "No hay pedido cargado", "info");
      return;
    }
    if (tipoPedido !== "chile") {
      const errores = validarTodosPedidos();
      if (errores.length > 0) {
        Swal.fire("Error de validación", `Las siguientes cantidades exceden lo disponible:\n\n${errores.join("\n")}`, "error");
        return;
      }
    }
    if (tipoPedido === "chile") {
      for (const item of pedido.items) {
        const editado = chileItemsEditados[item.idDet] || {};
        const horaIni = editado.horaInicialPH || item.horaInicialPH || "";
        const horaFin = editado.horaFinalPH || item.horaFinalPH || "";
        if (horaIni && horaFin && horaFin < horaIni) {
          Swal.fire("Error de validación", `La Hora Final PH no puede ser menor que la Hora Inicial PH en el producto ${item.producto || item.idDet}.`, "error");
          return;
        }
      }
    }
    const items = pedido.items.map((item) => {
      if (tipoPedido === "chile") {
        const editado = chileItemsEditados[item.idDet] || {};
        return {
          idDet: item.idDet,
          lote: editado.lote || null,
          fechaElaboracion: editado.fechaElaboracion || "",
          fechaVencimiento: editado.fechaVencimiento || "",
          temperaturaInicial: editado.temperaturaInicial || "",
          temperaturaFinal: editado.temperaturaFinal || "",
          horaInicialPH: editado.horaInicialPH || "",
          horaFinalPH: editado.horaFinalPH || "",
        };
      }
      const editado = itemsEditados[item.idDet] || {};
      return {
        idDet: item.idDet,
        idResponsable: editado.idResponsable || null,
        lotes: editado.lotes || ["", "", ""],
        cantidades: editado.cantidades || [0, 0, 0],
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
        handleCargarPedido(pedido.idPedido);
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

  // Helper: formato de tiempo relativo
  const getTimeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "hace unos segundos";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    const hours = Math.floor(minutes / 60);
    return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  };

  // Auto-guardado silencioso (valida antes de guardar; omite si hay errores)
  const handleAutoSave = async (showNotification = false) => {
    if (!autoSaveEnabled || !pedido) return;

    // Validar antes de autoguardar; si hay errores, omitir silenciosamente
    const errores = validarTodosPedidos();
    if (errores.length > 0) return;

    setIsAutoSaving(true);
    setAutoSaveStatus("");
    try {
      const items = pedido.items.map((item) => {
        if (tipoPedido === "chile") {
          const editado = chileItemsEditados[item.idDet] || {};
          return {
            idDet: item.idDet,
            lote: editado.lote || null,
            fechaElaboracion: editado.fechaElaboracion || "",
            fechaVencimiento: editado.fechaVencimiento || "",
            temperaturaInicial: editado.temperaturaInicial || "",
            temperaturaFinal: editado.temperaturaFinal || "",
            horaInicialPH: editado.horaInicialPH || "",
            horaFinalPH: editado.horaFinalPH || "",
          };
        }
        const editado = itemsEditados[item.idDet] || {};
        return {
          idDet: item.idDet,
          idResponsable: editado.idResponsable || null,
          lotes: editado.lotes || ["", "", ""],
          cantidades: editado.cantidades || [0, 0, 0],
        };
      });

      const res = await guardarProduccion({
        tipo: tipoPedido,
        idPedido: pedido.idPedido,
        items,
      });

      if (res.success) {
        setLastAutoSaveTime(new Date());
        setAutoSaveStatus("guardado");
        if (showNotification) {
          Swal.fire({
            icon: "success",
            title: "Auto-guardado",
            text: "Despacho guardado automáticamente",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        }
        console.log("✓ Auto-guardado: despacho guardado");
      } else {
        setAutoSaveStatus("error");
        console.error("Error en auto-guardado:", res.message);
      }
    } catch (error) {
      setAutoSaveStatus("error");
      console.error("Error de conexión en auto-guardado:", error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-guardado automático cada 30 segundos cuando hay un pedido cargado
  useEffect(() => {
    if (!pedido || !autoSaveEnabled) return;
    const autoSaveInterval = setInterval(() => {
      handleAutoSave(false);
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [pedido, itemsEditados, autoSaveEnabled]);

  // Limpiar estado de guardado después de 3 segundos
  useEffect(() => {
    if (autoSaveStatus === "guardado") {
      const timeout = setTimeout(() => setAutoSaveStatus(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [autoSaveStatus]);

  const mostrarAyuda = () => {
    let html = "";
    if (tipoPedido === "chile") {
      html = `
        <div style="text-align:left;font-size:14px;line-height:1.6;">
          <p><strong>Despachos — Pedidos Chile</strong></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;">
          <p><strong>Cómo asignar Lote y Fechas:</strong></p>
          <ol style="padding-left:20px;margin-bottom:12px;">
            <li>Seleccione tipo <strong>"Chile"</strong> y rango de fechas</li>
            <li>Click <strong>"Buscar pedidos"</strong></li>
            <li>Seleccione un pedido con <strong>"Cargar"</strong></li>
            <li>Para cada producto asigne:
              <ul><li><strong>Lote</strong> — seleccione de la lista</li>
              <li><strong>F. Elaboración</strong> — Fecha de producción</li>
              <li><strong>F. Vencimiento</strong> — Se auto calcula al poner F. Elaboración</li></ul>
            </li>
            <li>Click <strong>"Guardar Despachos"</strong></li>
          </ol>
          <p style="color:#2563eb;font-size:12px;font-weight:500;">🔗 IMPORTANTE: Todos los productos del mismo pedido comparten el mismo Lote y la misma Fecha de Elaboración. Al cambiar estos valores en cualquier producto, se actualizan automáticamente en todos los productos del pedido. La Fecha de Vencimiento se calcula individualmente según los días de cada producto.</p>
          <p style="color:#6b7280;font-size:12px;">💡 Los datos se pueden consultar en el detalle del pedido Chile usando el botón 👁️.</p>
        </div>`;
    } else {
      const esNormal = tipoPedido === "normal";
      html = `
        <div style="text-align:left;font-size:14px;line-height:1.6;">
          <p><strong>Despachos — Pedidos ${esNormal ? "Normales" : "Sample"}</strong></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;">
          <p><strong>📋 ¿Cómo asignar responsable, lotes y cantidades?</strong></p>
          <ol style="padding-left:20px;margin-bottom:12px;">
            <li>Seleccione el tipo (${esNormal ? "Normal" : "Sample"}) y rango de fechas</li>
            <li>Click <strong>"Buscar pedidos"</strong> → se listan los pedidos del período</li>
            <li>Click <strong>"Cargar"</strong> en el pedido deseado</li>
            <li>Para cada producto del detalle:
              <ul style="margin-top:4px;">
                <li><strong>Responsable</strong> — seleccione la persona a cargo</li>
                <li><strong>Lote 1, 2, 3</strong> — seleccione hasta 3 lotes (no repetidos)</li>
                <li><strong>Cantidad</strong> — ingrese las unidades por cada lote</li>
              </ul>
            </li>
            <li>Click <strong>"Guardar Despachos"</strong> o espere al auto-guardado</li>
          </ol>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;">
          <p><strong>✅ Validaciones</strong></p>
          <ul style="padding-left:20px;margin-bottom:12px;">
            <li><span style="color:#059669;">✓ Fondo verde</span> = cantidades válidas</li>
            <li><span style="color:#dc2626;">❌ Fondo rojo</span> = la suma de cantidades excede lo disponible</li>
            <li>No se pueden repetir lotes en un mismo producto</li>
            <li>Si hay lote asignado, debe haber responsable</li>
          </ul>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;">
          <p><strong>🔄 Auto-guardado</strong></p>
          <p style="margin-bottom:8px;">Los cambios se guardan automáticamente cada 30 segundos. Puede desactivarlo con el botón "⊙ Manual". El indicador muestra:</p>
          <ul style="padding-left:20px;">
            <li>🔄 <span style="color:#2563eb;">Auto-guardando...</span> — guardando cambios</li>
            <li>✅ <span style="color:#059669;">Guardado</span> — cambios guardados correctamente</li>
            <li>❌ <span style="color:#dc2626;">Error al guardar</span> — falló la conexión</li>
          </ul>
        </div>`;
    }
    Swal.fire({ title: "Ayuda - Despachos", html, confirmButtonText: "Entendido", confirmButtonColor: "#2563EB", width: 520 });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${tipoPedido === "chile" ? "text-teal-700" : "text-slate-700"}`}>
            Despachos {tipoPedido === "chile" ? "— Pedidos Chile" : tipoPedido === "sample" ? "— Samples" : "— Pedidos"}
          </h2>
          <button onClick={mostrarAyuda} className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-lg text-sm font-medium transition" title="Ayuda">
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Ayuda</span>
          </button>
        </div>
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
              <option value="chile">Chile</option>
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
                onClick={() => setPedido(null)}
                className="mt-2 sm:mt-0 bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
              >
                Volver a lista
              </button>
            </div>
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 mb-4 flex-wrap">
              {/* Indicador de auto-guardado */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  {isAutoSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-blue-700 font-medium">Auto-guardando...</span>
                    </>
                  ) : autoSaveStatus === "guardado" ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700 font-medium">Guardado</span>
                    </>
                  ) : autoSaveStatus === "error" ? (
                    <>
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-700 font-medium">Error al guardar</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700">Monitorando cambios</span>
                    </>
                  )}
                </div>
                {lastAutoSaveTime && (
                  <span className="text-xs text-gray-600 ml-2">
                    {getTimeAgo(lastAutoSaveTime)}
                  </span>
                )}
              </div>
              {/* Botón guardar ahora (silencioso) */}
              <button
                onClick={() => handleAutoSave(true)}
                className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition font-medium whitespace-nowrap disabled:bg-gray-400"
                disabled={isAutoSaving || !pedido}
              >
                {isAutoSaving ? "Guardando..." : "Guardar Ahora"}
              </button>
              {/* Toggle auto-guardado */}
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${autoSaveEnabled
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                title={autoSaveEnabled ? "Auto-guardado activado" : "Auto-guardado desactivado"}
              >
                {autoSaveEnabled ? "✓ Auto-guardado" : "⊙ Manual"}
              </button>
              {/* Botón guardar completo con validación */}
              <button
                onClick={handleGuardar}
                className="bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 transition font-medium"
              >
                Guardar Despachos
              </button>
            </div>
            {/* Vista escritorio/tablet: tabla de ítems */}
            <div className="hidden md:block overflow-x-auto">
              {tipoPedido === "chile" ? (
                <>
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Producto</th>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-right">Cantidad</th>
                        <th className="p-2 text-left">Lote</th>
                        <th className="p-2 text-left">F. Elaboración</th>
                        <th className="p-2 text-left">F. Vencimiento</th>
                        <th className="p-2 text-left">Temp. Inicial</th>
                        <th className="p-2 text-left">Temp. Final</th>
                        <th className="p-2 text-left">H. Inicial pH</th>
                        <th className="p-2 text-left">H. Final pH</th>
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
                              value={getChileValue(item, "lote")}
                              onChange={(e) => handleChileChange(item.idDet, "lote", e.target.value)}
                              className="border rounded p-1 text-xs w-32"
                            >
                              <option value="">-- Lote --</option>
                              {lotes.map((l) => (
                                <option key={l.idLote} value={l.idLote}>
                                  {l.codigoLote} - {l.descripcion}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="date"
                              value={getChileValue(item, "fechaElaboracion")}
                              onChange={(e) => handleChileChange(item.idDet, "fechaElaboracion", e.target.value)}
                              className="border rounded p-1 text-xs w-32" />
                          </td>
                          <td className="p-2">
                            <input type="date"
                              value={getChileValue(item, "fechaVencimiento")}
                              onChange={(e) => handleChileChange(item.idDet, "fechaVencimiento", e.target.value)}
                              className="border rounded p-1 text-xs w-32" />
                          </td>
                          <td className="p-2">
                            <input type="number" step="0.1"
                              value={getChileValue(item, "temperaturaInicial")}
                              onChange={(e) => handleChileChange(item.idDet, "temperaturaInicial", e.target.value)}
                              className="border rounded p-1 text-xs w-20" placeholder="°C" />
                          </td>
                          <td className="p-2">
                            <input type="number" step="0.1"
                              value={getChileValue(item, "temperaturaFinal")}
                              onChange={(e) => handleChileChange(item.idDet, "temperaturaFinal", e.target.value)}
                              className="border rounded p-1 text-xs w-20" placeholder="°C" />
                          </td>
                          <td className="p-2">
                            <input type="time"
                              value={getChileValue(item, "horaInicialPH")}
                              onChange={(e) => handleChileChange(item.idDet, "horaInicialPH", e.target.value)}
                              className="border rounded p-1 text-xs w-24" />
                          </td>
                          <td className="p-2">
                            <input type="time"
                              value={getChileValue(item, "horaFinalPH")}
                              onChange={(e) => handleChileChange(item.idDet, "horaFinalPH", e.target.value)}
                              className="border rounded p-1 text-xs w-24" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-sm text-gray-500">
                    💡 Al ingresar F. Elaboración, F. Vencimiento se calcula automáticamente.
                  </div>
                </>
              ) : (
                <>
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Producto</th>
                        <th className="p-2 text-left">Descripción</th>
                        <th className="p-2 text-right">Cantidad</th>
                        <th className="p-2 text-left">Responsable</th>
                        <th className="p-2 text-left" colSpan="3">Lotes y Cantidades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.items.map((item) => {
                        const validacion = obtenerMensajeValidacion(item);
                        return (
                          <tr key={item.idDet} className={`border-b hover:bg-gray-50 ${validacion.bgColor}`}>
                            <td className="p-2">{item.idProducto}</td>
                            <td className="p-2">{item.producto}</td>
                            <td className="p-2 text-right">{item.cantidad}</td>
                            <td className="p-2">
                              <select value={getResponsableValue(item)} onChange={(e) => handleResponsableChange(item.idDet, e.target.value)} className="border rounded p-1 text-xs w-32">
                                <option value="">-- Sin asignar --</option>
                                {responsables.map((r) => (<option key={r.idResponsable} value={r.idResponsable}>{r.nombre}</option>))}
                              </select>
                            </td>
                            {[0, 1, 2].map((pos) => (
                              <td key={pos} className="p-2">
                                <div className="space-y-1">
                                  <select value={getLoteValue(item, pos)} onChange={(e) => handleLoteChange(item.idDet, pos, e.target.value)} className="border rounded p-1 text-xs w-24">
                                    <option value="">-- Lote {pos + 1} --</option>
                                    {lotes.map((l) => (<option key={l.idLote} value={l.idLote}>{l.codigoLote} - {l.descripcion}</option>))}
                                  </select>
                                  <input type="number" min="0" value={getCantidadLoteValue(item, pos)} onChange={(e) => handleCantidadLoteChange(item.idDet, pos, e.target.value)} className="border rounded p-1 text-xs w-24" placeholder="Cant." />
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Leyenda:</strong> Las filas con fondo verde indican cantidades válidas. Las filas con fondo rojo indican que la suma de cantidades excede lo disponible.
                  </div>
                </>
              )}
            </div>
            {/* Vista móvil: tarjetas de ítems */}
            <div className="md:hidden space-y-3">
              {pedido.items.map((item) => {
                  if (tipoPedido === "chile") {
                    return (
                      <div key={item.idDet} className="border rounded-lg p-4 shadow-sm bg-white">
                        <div className="font-semibold text-gray-800">{item.producto}</div>
                        <div className="text-sm text-gray-600 mb-3">Cantidad: {item.cantidad}</div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Lote</label>
                            <select value={getChileValue(item, "lote")} onChange={(e) => handleChileChange(item.idDet, "lote", e.target.value)} className="border rounded p-2 w-full text-sm">
                              <option value="">-- Lote --</option>
                              {lotes.map((l) => (<option key={l.idLote} value={l.idLote}>{l.codigoLote} - {l.descripcion}</option>))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-700">F. Elaboración</label>
                              <input type="date" value={getChileValue(item, "fechaElaboracion")} onChange={(e) => handleChileChange(item.idDet, "fechaElaboracion", e.target.value)} className="border rounded p-2 w-full text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">F. Vencimiento</label>
                              <input type="date" value={getChileValue(item, "fechaVencimiento")} onChange={(e) => handleChileChange(item.idDet, "fechaVencimiento", e.target.value)} className="border rounded p-2 w-full text-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-700">Temp. Inicial (°C)</label>
                              <input type="number" step="0.1" value={getChileValue(item, "temperaturaInicial")} onChange={(e) => handleChileChange(item.idDet, "temperaturaInicial", e.target.value)} className="border rounded p-2 w-full text-sm" placeholder="°C" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">Temp. Final (°C)</label>
                              <input type="number" step="0.1" value={getChileValue(item, "temperaturaFinal")} onChange={(e) => handleChileChange(item.idDet, "temperaturaFinal", e.target.value)} className="border rounded p-2 w-full text-sm" placeholder="°C" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-700">H. Inicial pH</label>
                              <input type="time" value={getChileValue(item, "horaInicialPH")} onChange={(e) => handleChileChange(item.idDet, "horaInicialPH", e.target.value)} className="border rounded p-2 w-full text-sm" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">H. Final pH</label>
                              <input type="time" value={getChileValue(item, "horaFinalPH")} onChange={(e) => handleChileChange(item.idDet, "horaFinalPH", e.target.value)} className="border rounded p-2 w-full text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                const validacion = obtenerMensajeValidacion(item);
                return (
                  <div key={item.idDet} className={`border rounded-lg p-3 ${validacion.bgColor}`}>
                    <div className="font-semibold">{item.producto}</div>
                    <div className="text-sm text-gray-600 mb-2">Cantidad disponible: {item.cantidad}</div>
                    <div className="mb-2">
                      <label className="text-xs font-medium">Responsable</label>
                      <select value={getResponsableValue(item)} onChange={(e) => handleResponsableChange(item.idDet, e.target.value)} className="border rounded p-1 w-full text-sm">
                        <option value="">-- Sin asignar --</option>
                        {responsables.map((r) => (<option key={r.idResponsable} value={r.idResponsable}>{r.nombre}</option>))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[0, 1, 2].map((pos) => (
                        <div key={pos}>
                          <label className="text-xs font-medium">Lote {pos + 1}</label>
                          <select value={getLoteValue(item, pos)} onChange={(e) => handleLoteChange(item.idDet, pos, e.target.value)} className="border rounded p-1 w-full text-xs">
                            <option value="">--</option>
                            {lotes.map((l) => (<option key={l.idLote} value={l.idLote}>{l.codigoLote}</option>))}
                          </select>
                          <input type="number" min="0" value={getCantidadLoteValue(item, pos)} onChange={(e) => handleCantidadLoteChange(item.idDet, pos, e.target.value)} className="border rounded p-1 w-full text-xs mt-1" placeholder="Cantidad" />
                        </div>
                      ))}
                    </div>
                    <div className={`text-xs font-medium ${validacion.color}`}>{validacion.texto}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}