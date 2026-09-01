// src/components/consolidacion/ConsolidacionMain.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  generarExcelConsolidacion,
  generarExcelConsolidacionChile,
  generarExcelConsolidacionConsolidado,
  generarReporteProduccion,
  generarReporteProduccionChile,
  generarReporteProduccionConsolidado,
  generarReporteEmpaque,
  generarReporteEmpaqueChile,
  generarReporteEmpaqueConsolidado,
  generarReporteTransporte,
  generarReporteTransporteChile,
  generarReporteTransporteConsolidado,
  generarExcelTransporte,
  generarExcelTransporteChile,
  generarExcelTransporteConsolidado,
  obtenerEstadisticasConsolidacion,
  actualizarFechaSalidaPedido,
  actualizarDatosEnLote,
  obtenerPedidosPorFecha,
  obtenerCostosTransporte,
  guardarCostoTransporte,
  modificarCostoTransporte,
  eliminarCostoTransporte,
  obtenerCostosAereo,
  guardarCostoAereo,
  modificarCostoAereo,
  eliminarCostoAereo,
  obtenerGuiasMasterPorFecha,
  obtenerEstadisticasChile,
  obtenerPedidosChilePorFecha,
  actualizarFechaSalidaChile,
  actualizarDatosEnLoteChile
} from '../../services/consolidacionService';
import ModalVisorPreliminar from "../ModalVisorPreliminar";
import { getDatosSelect } from '../../services/pedidosService';
import { getPermisosAccionesPorModulo } from '../../services/menuPrincipal/permisosAccionesService';
import Swal from 'sweetalert2';

export default function ConsolidacionMain() {
  const [pestanaActiva, setPestanaActiva] = useState("pedidos");

  const esChile = pestanaActiva === 'chile';
  const esConsolidado = pestanaActiva === 'consolidado';
  const tipoPedidoCostos = esChile ? 'chile' : 'normal';
  const etiquetaOrigen = esChile ? 'Chile' : esConsolidado ? 'Consolidado' : 'Locales';

  const [filtros, setFiltros] = useState({
    tipoFecha: "fechaSalida",
    fechaDesde: "",
    fechaHasta: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalPedidos: 0,
    cajas: 0,
    pesoNeto: 0,
    valorTotal: 0,
    estibas: 0,
    loading: false
  });

  // Nuevos estados para el visor de PDF
  const [urlPDF, setUrlPDF] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [reporteActual, setReporteActual] = useState('');

  // Estados para la gestión de fechas
  const [mostrarGestionFechas, setMostrarGestionFechas] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState(null);
  const [editandoFecha, setEditandoFecha] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);

  // 👇 NUEVOS ESTADOS PARA GESTIÓN EN LOTE
  const [mostrarGestionEnLote, setMostrarGestionEnLote] = useState(false);
  const [datosEnLote, setDatosEnLote] = useState({
    guiaMaster: '',
    guiaHija: '',
    aerolineaId: '107',
    agenciaId: '44'
  });
  const [actualizandoEnLote, setActualizandoEnLote] = useState(false);

  // 👇 NUEVOS ESTADOS PARA COSTOS DE TRANSPORTE
  const [mostrarCostosTransporte, setMostrarCostosTransporte] = useState(false);
  const [costosTransporte, setCostosTransporte] = useState([]);
  const [loadingCostos, setLoadingCostos] = useState(false);
  const [errorCostos, setErrorCostos] = useState(null);
  const [modalCostoAbierto, setModalCostoAbierto] = useState(false);
  const [costoEditando, setCostoEditando] = useState(null);
  const [guardandoCosto, setGuardandoCosto] = useState(false);
  const [formCosto, setFormCosto] = useState({
    Fecha: '',
    TipoPedido: tipoPedidoCostos,
    CantidadCamiones: 1,
    ValorFlete: '',
    Observaciones: '',
    HorasExtras: '',
    ValorHorasExtras: ''
  });

  // 👇 NUEVOS ESTADOS PARA COSTOS DE TRANSPORTE AEREO
  const [mostrarCostosAereo, setMostrarCostosAereo] = useState(false);
  const [costosAereo, setCostosAereo] = useState([]);
  const [loadingCostosAereo, setLoadingCostosAereo] = useState(false);
  const [errorCostosAereo, setErrorCostosAereo] = useState(null);
  const [modalAereoAbierto, setModalAereoAbierto] = useState(false);
  const [aereoEditando, setAereoEditando] = useState(null);
  const [guardandoAereo, setGuardandoAereo] = useState(false);
  const [guiasMasterDisponibles, setGuiasMasterDisponibles] = useState([]);
  const [loadingGuias, setLoadingGuias] = useState(false);
  const [formAereo, setFormAereo] = useState({
    Fecha: '',
    GuiaMaster: '',
    TipoPedido: tipoPedidoCostos,
    ValorFleteUSD: '',
    TRM: '',
    PesoCobrado: '',
    Observaciones: ''
  });

  // Permisos granulares del módulo ([] = acceso completo)
  const [permisosAcciones, setPermisosAcciones] = useState([]);

  // Estados para aerolíneas y agencias
  const [aerolineas, setAerolineas] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  const reportes = [
    {
      id: "excel-proceso",
      titulo: "Excel Proceso Actual",
      descripcion: "Generar archivo Excel con campos específicos para alimentar el proceso actual",
      icono: "📊",
      disponible: true,
      color: "bg-green-500 hover:bg-green-600",
      tipo: "excel"
    },
    {
      id: "produccion",
      titulo: "Reporte Producción",
      descripcion: "Consolidado de referencias y cantidades para el área de producción",
      icono: "🏭",
      disponible: true,
      color: "bg-blue-500 hover:bg-blue-600",
      tipo: "pdf"
    },
    {
      id: "empaque",
      titulo: "Reporte Empaque",
      descripcion: "Información consolidada para empaque y embalaje",
      icono: "📦",
      disponible: true,
      color: "bg-orange-500 hover:bg-orange-600",
      tipo: "pdf"
    },
    {
      id: "transporte",
      titulo: "Reporte Transporte",
      descripcion: "Consolidado por día para logística y transporte",
      icono: "🚚",
      disponible: true,
      color: "bg-purple-500 hover:bg-purple-600",
      tipo: "pdf"
    }
  ];

  // 👇 FUNCIÓN ACTUALIZADA: Cargar aerolíneas y agencias usando getDatosSelect
  const cargarAerolineasYAgencias = async () => {
    setLoadingSelects(true);
    try {
      // Usar el servicio que ya tienes
      const datos = await getDatosSelect();

      if (datos) {
        setAerolineas(datos.aerolineas || []);
        setAgencias(datos.agencias || []);

        console.log('Aerolíneas cargadas:', datos.aerolineas?.length || 0);
        console.log('Agencias cargadas:', datos.agencias?.length || 0);
      }
    } catch (error) {
      console.error('Error cargando aerolíneas y agencias:', error);
      // Establecer arrays vacíos en caso de error
      setAerolineas([]);
      setAgencias([]);
    } finally {
      setLoadingSelects(false);
    }
  };

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      return;
    }

    setEstadisticas(prev => ({ ...prev, loading: true }));

    try {
      let datos;
      if (esConsolidado) {
        const [datosLocal, datosChile] = await Promise.all([
          obtenerEstadisticasConsolidacion(filtros),
          obtenerEstadisticasChile(filtros)
        ]);
        datos = {
          totalPedidos: (datosLocal.totalPedidos || 0) + (datosChile.totalPedidos || 0),
          cajas: (datosLocal.cajas || 0) + (datosChile.cajas || 0),
          pesoNeto: (datosLocal.pesoNeto || 0) + (datosChile.pesoNeto || 0),
          valorTotal: (datosLocal.valorTotal || 0) + (datosChile.valorTotal || 0),
          estibas: (datosLocal.estibas || 0) + (datosChile.estibas || 0)
        };
      } else {
        datos = esChile ? await obtenerEstadisticasChile(filtros) : await obtenerEstadisticasConsolidacion(filtros);
      }

      setEstadisticas({
        totalPedidos: datos.totalPedidos || 0,
        cajas: datos.cajas || 0,
        pesoNeto: datos.pesoNeto || 0,
        valorTotal: datos.valorTotal || 0,
        estibas: datos.estibas || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas(prev => ({ ...prev, loading: false }));
    }
  };

  // Función para cargar pedidos
  const cargarPedidos = async () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      setErrorPedidos("Por favor selecciona ambas fechas");
      return;
    }

    setLoadingPedidos(true);
    setErrorPedidos(null);
    setMensajeExito(null);

    try {
      let pedidosCrudos = [];

      if (esConsolidado) {
        const [locales, chile] = await Promise.all([
          obtenerPedidosPorFecha(filtros),
          obtenerPedidosChilePorFecha(filtros)
        ]);
        pedidosCrudos = [
          ...(locales.pedidos || []).map(pedido => ({ ...pedido, origen: 'local' })),
          ...(chile.pedidos || []).map(pedido => ({ ...pedido, origen: 'chile' }))
        ];
      } else {
        const resultado = esChile ? await obtenerPedidosChilePorFecha(filtros) : await obtenerPedidosPorFecha(filtros);
        pedidosCrudos = (resultado.pedidos || []).map(pedido => ({
          ...pedido,
          origen: esChile ? 'chile' : 'local'
        }));
      }

      if (pedidosCrudos.length > 0) {
        const pedidosFormateados = pedidosCrudos.map(pedido => ({
          id: pedido.id,
          numero: pedido.numero,
          cliente: pedido.cliente,
          region: pedido.region,
          fechaSalida: pedido.fecha,
          fecha: pedido.fecha,
          cajas: pedido.cajas,
          tms: pedido.tms,
          pesoNeto: pedido.pesoNeto,
          valor: pedido.valor,
          ordenCompra: pedido.ordenCompra,
          estibas: pedido.estibas,
          estibasPagas: pedido.estibasPagas,
          facturaNo: pedido.facturaNo || '',
          tipoDato: pedido.tipo || 'PED',
          guiaMaster: pedido.guiaMaster || '',
          guiaHija: pedido.guiaHija || '',
          origen: pedido.origen || 'local'
        }));

        setPedidos(pedidosFormateados);
      } else {
        setPedidos([]);
        setErrorPedidos("No se encontraron pedidos para las fechas seleccionadas");
      }
    } catch (err) {
      setErrorPedidos(err.message);
      setPedidos([]);
    } finally {
      setLoadingPedidos(false);
    }
  };

  // ============================================================================
  // FUNCIONES PARA COSTOS DE TRANSPORTE
  // ============================================================================

  // Función para cargar costos de transporte
  const cargarCostosTransporte = useCallback(async () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      setErrorCostos('Por favor selecciona un rango de fechas válido');
      return;
    }

    setLoadingCostos(true);
    setErrorCostos(null);

    try {
      let resultado;
      if (esConsolidado) {
        const [costosLocales, costosChile] = await Promise.all([
          obtenerCostosTransporte(filtros, 'normal'),
          obtenerCostosTransporte(filtros, 'chile')
        ]);
        resultado = {
          costos: [
            ...(costosLocales.costos || []).map(c => ({ ...c, TipoPedido: 'normal' })),
            ...(costosChile.costos || []).map(c => ({ ...c, TipoPedido: 'chile' }))
          ]
        };
      } else {
        resultado = await obtenerCostosTransporte(filtros, tipoPedidoCostos);
      }

      if (resultado.costos && resultado.costos.length > 0) {
        setCostosTransporte(resultado.costos);
      } else {
        setCostosTransporte([]);
      }
    } catch (err) {
      setErrorCostos(err.message);
      setCostosTransporte([]);
    } finally {
      setLoadingCostos(false);
    }
  }, [filtros, tipoPedidoCostos]);

  // Función para abrir modal de costo (nuevo o edición)
  const abrirModalCosto = (costo = null) => {
    if (costo) {
      // Modo edición
      setCostoEditando(costo.id);
      setFormCosto({
        Fecha: costo.Fecha,
        TipoPedido: costo.TipoPedido || (esConsolidado ? '' : tipoPedidoCostos),
        CantidadCamiones: costo.CantidadCamiones,
        ValorFlete: costo.ValorFlete,
        Observaciones: costo.Observaciones || '',
        HorasExtras: costo.HorasExtras || '',
        ValorHorasExtras: costo.ValorHorasExtras || ''
      });
    } else {
      // Modo nuevo
      setCostoEditando(null);
      setFormCosto({
        Fecha: '',
        TipoPedido: esConsolidado ? '' : tipoPedidoCostos,
        CantidadCamiones: 1,
        ValorFlete: '',
        Observaciones: ''
      });
    }
    setModalCostoAbierto(true);
  };

  // Función para cerrar modal
  const cerrarModalCosto = () => {
    setModalCostoAbierto(false);
    setCostoEditando(null);
    setFormCosto({
      Fecha: '',
      TipoPedido: esConsolidado ? '' : tipoPedidoCostos,
      CantidadCamiones: 1,
      ValorFlete: '',
      Observaciones: '',
      HorasExtras: '',
      ValorHorasExtras: ''
    });
  };

  // Función para guardar costo (crear o actualizar)
  const guardarCosto = async () => {
    // Validaciones
    if (!formCosto.Fecha) {
      setErrorCostos('La fecha es obligatoria');
      return;
    }
    if (esConsolidado && !formCosto.TipoPedido) {
      setErrorCostos('Selecciona el tipo de pedido para el costo');
      return;
    }
    if (!formCosto.CantidadCamiones || formCosto.CantidadCamiones <= 0) {
      setErrorCostos('La cantidad de camiones debe ser mayor a 0');
      return;
    }
    if (!formCosto.ValorFlete || formCosto.ValorFlete <= 0) {
      setErrorCostos('El valor del flete debe ser mayor a 0');
      return;
    }
    const horasExtras = formCosto.HorasExtras !== '' ? parseFloat(formCosto.HorasExtras) : 0;
    if (formCosto.HorasExtras !== '' && (isNaN(horasExtras) || horasExtras <= 0)) {
      setErrorCostos('Las horas extras deben ser un valor mayor a 0');
      return;
    }
    if (horasExtras > 0 && (!formCosto.ValorHorasExtras || parseFloat(formCosto.ValorHorasExtras) <= 0)) {
      setErrorCostos('El valor de horas extras es requerido cuando se registran horas extras');
      return;
    }

    setGuardandoCosto(true);
    setErrorCostos(null);

    try {
      if (costoEditando) {
        // Actualizar
        await modificarCostoTransporte(costoEditando, {
          TipoPedido: formCosto.TipoPedido,
          CantidadCamiones: formCosto.CantidadCamiones,
          ValorFlete: formCosto.ValorFlete,
          Observaciones: formCosto.Observaciones,
          HorasExtras: horasExtras > 0 ? horasExtras : 0,
          ValorHorasExtras: horasExtras > 0 ? parseFloat(formCosto.ValorHorasExtras) : 0
        });
      } else {
        // Crear nuevo
        await guardarCostoTransporte({
          Fecha: formCosto.Fecha,
          TipoPedido: formCosto.TipoPedido,
          CantidadCamiones: formCosto.CantidadCamiones,
          ValorFlete: formCosto.ValorFlete,
          Observaciones: formCosto.Observaciones,
          HorasExtras: horasExtras > 0 ? horasExtras : 0,
          ValorHorasExtras: horasExtras > 0 ? parseFloat(formCosto.ValorHorasExtras) : 0,
          UsuarioRegistro: 'Sistema'
        });
      }

      // Recargar lista
      await cargarCostosTransporte();
      cerrarModalCosto();

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: costoEditando ? '¡Actualizado!' : '¡Guardado!',
        text: costoEditando
          ? 'Costo de transporte actualizado correctamente.'
          : 'Costo de transporte guardado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setErrorCostos(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo guardar el costo.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setGuardandoCosto(false);
    }
  };

  // Función para eliminar costo
  const eliminarCosto = async (costo) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar costo?',
      html: `<div class="text-left">
        <p class="mb-2">¿Estás seguro de eliminar el costo del <strong>${costo.Fecha}</strong>?</p>
        <p class="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    setLoadingCostos(true);
    setErrorCostos(null);

    try {
      await eliminarCostoTransporte(costo.id);
      // Recargar lista
      await cargarCostosTransporte();

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: `Costo del ${costo.Fecha} eliminado correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setErrorCostos(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo eliminar el costo.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoadingCostos(false);
    }
  };



  // Función para formatear número
  const formatearNumero = (valor) => {
    return new Intl.NumberFormat('es-CO').format(valor);
  };

  // Función para verificar si hay pedidos con factura
  const hayPedidosFacturados = () => {
    return pedidosEnRango.some(pedido => pedido.facturaNo && pedido.facturaNo.trim() !== '');
  };

  // Función para verificar si un pedido específico tiene factura
  const tieneFactura = (pedido) => {
    return pedido.facturaNo && pedido.facturaNo.trim() !== '';
  };

  // Función para recargar pedidos después de una actualización
  const recargarPedidos = async () => {
    await cargarPedidos(); // Recargar la lista desde el servidor
    cargarEstadisticas();  // Actualizar estadísticas
  };

  // Cargar estadísticas cuando cambien los filtros o la pestaña
  useEffect(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      cargarEstadisticas();
    }
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.tipoFecha, pestanaActiva]);

  // Cargar pedidos cuando se active la gestión de fechas o cambie de pestaña
  useEffect(() => {
    if (mostrarGestionFechas && filtros.fechaDesde && filtros.fechaHasta) {
      cargarPedidos();
    }
  }, [mostrarGestionFechas, filtros.fechaDesde, filtros.fechaHasta, pestanaActiva]);

  // Cargar costos de transporte cuando se active la sección
  useEffect(() => {
    if (mostrarCostosTransporte && filtros.fechaDesde && filtros.fechaHasta) {
      cargarCostosTransporte();
    }
  }, [mostrarCostosTransporte, filtros.fechaDesde, filtros.fechaHasta, cargarCostosTransporte, pestanaActiva]);

  // ============================================================================
  // FUNCIONES PARA COSTOS DE TRANSPORTE AEREO
  // ============================================================================

  const cargarCostosAereo = useCallback(async () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      setErrorCostosAereo('Por favor selecciona un rango de fechas válido');
      return;
    }

    setLoadingCostosAereo(true);
    setErrorCostosAereo(null);

    try {
      let resultado;
      if (esConsolidado) {
        const [costosLocales, costosChile] = await Promise.all([
          obtenerCostosAereo(filtros, 'normal'),
          obtenerCostosAereo(filtros, 'chile')
        ]);
        resultado = {
          costos: [
            ...(costosLocales.costos || []).map(c => ({ ...c, TipoPedido: 'normal' })),
            ...(costosChile.costos || []).map(c => ({ ...c, TipoPedido: 'chile' }))
          ]
        };
      } else {
        resultado = await obtenerCostosAereo(filtros, tipoPedidoCostos);
      }

      if (resultado.costos && resultado.costos.length > 0) {
        setCostosAereo(resultado.costos);
      } else {
        setCostosAereo([]);
      }
    } catch (err) {
      setErrorCostosAereo(err.message);
      setCostosAereo([]);
    } finally {
      setLoadingCostosAereo(false);
    }
  }, [filtros, tipoPedidoCostos]);

  const cargarGuiasPorFecha = async (fecha, tipo = tipoPedidoCostos) => {
    if (!fecha) {
      setGuiasMasterDisponibles([]);
      return;
    }
    if (esConsolidado && !tipo) {
      setGuiasMasterDisponibles([]);
      return;
    }

    setLoadingGuias(true);
    try {
      const resultado = await obtenerGuiasMasterPorFecha(fecha, tipo);
      setGuiasMasterDisponibles(resultado.guiasMaster || []);
    } catch (err) {
      setGuiasMasterDisponibles([]);
    } finally {
      setLoadingGuias(false);
    }
  };

  const abrirModalAereo = (costo = null) => {
    if (costo) {
      const tipoAereo = costo.TipoPedido || (esConsolidado ? '' : tipoPedidoCostos);
      setAereoEditando(costo.id);
      setFormAereo({
        Fecha: costo.Fecha,
        GuiaMaster: costo.GuiaMaster,
        TipoPedido: tipoAereo,
        ValorFleteUSD: costo.ValorFleteUSD,
        TRM: costo.TRM,
        PesoCobrado: costo.PesoCobrado,
        Observaciones: costo.Observaciones || ''
      });
      cargarGuiasPorFecha(costo.Fecha, tipoAereo);
    } else {
      setAereoEditando(null);
      setFormAereo({
        Fecha: '',
        GuiaMaster: '',
        TipoPedido: esConsolidado ? '' : tipoPedidoCostos,
        ValorFleteUSD: '',
        TRM: '',
        PesoCobrado: '',
        Observaciones: ''
      });
      setGuiasMasterDisponibles([]);
    }
    setModalAereoAbierto(true);
  };

  const cerrarModalAereo = () => {
    setModalAereoAbierto(false);
    setAereoEditando(null);
    setFormAereo({
      Fecha: '',
      GuiaMaster: '',
      TipoPedido: esConsolidado ? '' : tipoPedidoCostos,
      ValorFleteUSD: '',
      TRM: '',
      PesoCobrado: '',
      Observaciones: ''
    });
    setGuiasMasterDisponibles([]);
  };

  const handleFechaAereoChange = (e) => {
    const fecha = e.target.value;
    setFormAereo(prev => ({ ...prev, Fecha: fecha, GuiaMaster: '' }));
    if (fecha) {
      cargarGuiasPorFecha(fecha, formAereo.TipoPedido);
    } else {
      setGuiasMasterDisponibles([]);
    }
  };

  const handleTipoAereoChange = (e) => {
    const tipo = e.target.value;
    setFormAereo(prev => ({ ...prev, TipoPedido: tipo, GuiaMaster: '' }));
    if (formAereo.Fecha && tipo) {
      cargarGuiasPorFecha(formAereo.Fecha, tipo);
    } else {
      setGuiasMasterDisponibles([]);
    }
  };

  const guardarCostoAereoFn = async () => {
    if (!formAereo.Fecha) {
      setErrorCostosAereo('La fecha es obligatoria');
      return;
    }
    if (esConsolidado && !formAereo.TipoPedido) {
      setErrorCostosAereo('Selecciona el tipo de pedido para el costo aÃ©reo');
      return;
    }
    if (!formAereo.GuiaMaster) {
      setErrorCostosAereo('La Guía Master es obligatoria');
      return;
    }
    if (!formAereo.ValorFleteUSD || parseFloat(formAereo.ValorFleteUSD) <= 0) {
      setErrorCostosAereo('El valor del flete USD debe ser mayor a 0');
      return;
    }
    if (!formAereo.TRM || parseFloat(formAereo.TRM) <= 0) {
      setErrorCostosAereo('La TRM debe ser mayor a 0');
      return;
    }
    if (!formAereo.PesoCobrado || parseFloat(formAereo.PesoCobrado) <= 0) {
      setErrorCostosAereo('El peso cobrado debe ser mayor a 0');
      return;
    }

    setGuardandoAereo(true);
    setErrorCostosAereo(null);

    try {
      if (aereoEditando) {
        await modificarCostoAereo(aereoEditando, {
          Fecha: formAereo.Fecha,
          GuiaMaster: formAereo.GuiaMaster,
          TipoPedido: formAereo.TipoPedido,
          ValorFleteUSD: parseFloat(formAereo.ValorFleteUSD),
          TRM: parseFloat(formAereo.TRM),
          PesoCobrado: parseFloat(formAereo.PesoCobrado),
          Observaciones: formAereo.Observaciones
        });
      } else {
        await guardarCostoAereo({
          Fecha: formAereo.Fecha,
          GuiaMaster: formAereo.GuiaMaster,
          TipoPedido: formAereo.TipoPedido,
          ValorFleteUSD: parseFloat(formAereo.ValorFleteUSD),
          TRM: parseFloat(formAereo.TRM),
          PesoCobrado: parseFloat(formAereo.PesoCobrado),
          Observaciones: formAereo.Observaciones,
          UsuarioRegistro: 'Sistema'
        });
      }

      await cargarCostosAereo();
      cerrarModalAereo();

      Swal.fire({
        icon: 'success',
        title: aereoEditando ? '¡Actualizado!' : '¡Guardado!',
        text: aereoEditando
          ? 'Costo aéreo actualizado correctamente.'
          : 'Costo aéreo guardado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setErrorCostosAereo(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo guardar el costo aéreo.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setGuardandoAereo(false);
    }
  };

  const eliminarCostoAereoFn = async (costo) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar costo aéreo?',
      html: `<div class="text-left">
        <p class="mb-2">¿Estás seguro de eliminar el costo del <strong>${costo.Fecha}</strong> - Guía <strong>${costo.GuiaMaster}</strong>?</p>
        <p class="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmacion.isConfirmed) return;

    setLoadingCostosAereo(true);
    setErrorCostosAereo(null);

    try {
      await eliminarCostoAereo(costo.id);
      await cargarCostosAereo();
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: `Costo aéreo del ${costo.Fecha} eliminado correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setErrorCostosAereo(err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo eliminar el costo aéreo.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoadingCostosAereo(false);
    }
  };

  // Cargar costos aéreos cuando se active la sección
  useEffect(() => {
    if (mostrarCostosAereo && filtros.fechaDesde && filtros.fechaHasta) {
      cargarCostosAereo();
    }
  }, [mostrarCostosAereo, filtros.fechaDesde, filtros.fechaHasta, cargarCostosAereo, pestanaActiva]);

  // Cargar aerolíneas y agencias al montar el componente
  useEffect(() => {
    cargarAerolineasYAgencias();
  }, []);

  // Cargar permisos granulares del módulo al montar
  // Si el usuario no tiene registros en PermisosAcciones → [] → acceso completo
  useEffect(() => {
    getPermisosAccionesPorModulo('consolidacion').then(setPermisosAcciones);
  }, []);

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  // Función para validar filtros
  const validarFiltros = () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      setError('Por favor selecciona un rango de fechas válido');
      return false;
    }

    // Validar que fechaDesde no sea mayor que fechaHasta
    if (new Date(filtros.fechaDesde) > new Date(filtros.fechaHasta)) {
      setError('La fecha desde no puede ser mayor que la fecha hasta');
      return false;
    }

    setError(null);
    return true;
  };

  const handleGenerarReporte = async (reporteId) => {
    if (!validarFiltros()) return;

    const reporte = reportes.find(r => r.id === reporteId);
    if (!reporte) return;

    setLoading(true);
    setError(null);

    try {
      if (reporte.tipo === "excel") {
        if (esChile) {
          await generarExcelConsolidacionChile(filtros);
        } else if (esConsolidado) {
          await generarExcelConsolidacionConsolidado(filtros);
        } else {
          await generarExcelConsolidacion(filtros);
        }
      } else if (reporte.tipo === "pdf") {
        let blob;

        if (reporteId === 'produccion') {
          blob = esChile
            ? await generarReporteProduccionChile(filtros)
            : esConsolidado
              ? await generarReporteProduccionConsolidado(filtros)
              : await generarReporteProduccion(filtros);
          setReporteActual('Producción');
        } else if (reporteId === 'empaque') {
          blob = esChile
            ? await generarReporteEmpaqueChile(filtros)
            : esConsolidado
              ? await generarReporteEmpaqueConsolidado(filtros)
              : await generarReporteEmpaque(filtros);
          setReporteActual(esConsolidado ? 'Empaque Consolidado' : 'Empaque');
        } else if (reporteId === 'transporte') {
          blob = esChile
            ? await generarReporteTransporteChile(filtros)
            : esConsolidado
              ? await generarReporteTransporteConsolidado(filtros)
              : await generarReporteTransporte(filtros);
          setReporteActual(esConsolidado ? 'Transporte Consolidado' : 'Transporte');
        }

        if (blob) {
          // Crear URL para el PDF y mostrarlo en el modal
          const fileURL = URL.createObjectURL(blob);
          setUrlPDF(fileURL);
          setMostrarModal(true);
        }
      }
    } catch (err) {
      console.error('Error generando reporte:', err);
      setError(err.message || `Error al generar el reporte de ${reporte.titulo}`);
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para generar Excel de Transporte
  const handleGenerarExcelTransporte = async () => {
    if (!validarFiltros()) return;

    setLoading(true);
    setError(null);

    try {
      if (esChile) {
        await generarExcelTransporteChile(filtros);
      } else if (esConsolidado) {
        await generarExcelTransporteConsolidado(filtros);
      } else {
        await generarExcelTransporte(filtros);
      }
    } catch (err) {
      console.error('Error generando Excel de transporte:', err);
      setError(err.message || 'Error al generar el archivo Excel de transporte');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestión de fechas
  const iniciarEdicionFecha = (pedidoId, fechaActual, pedidoObjeto) => {
    // Verificar si el pedido tiene factura
    if (pedidoObjeto && tieneFactura(pedidoObjeto)) {
      setErrorPedidos(`No se puede modificar el pedido ${pedidoObjeto.numero} porque ya tiene factura: ${pedidoObjeto.facturaNo}`);
      return;
    }

    setEditandoFecha(pedidoId);
    setNuevaFecha(fechaActual);
    setMensajeExito(null);
    setErrorPedidos(null);
  };

  const cancelarEdicion = () => {
    setEditandoFecha(null);
    setNuevaFecha('');
    setMensajeExito(null);
  };

  const guardarFecha = async (pedidoId, origenPedido = null) => {
    if (!nuevaFecha) {
      setErrorPedidos('Por favor selecciona una fecha válida');
      return;
    }

    setGuardando(true);
    setErrorPedidos(null);
    setMensajeExito(null);

    try {
      const esPedidoChile = origenPedido === 'chile' || (esConsolidado ? origenPedido === 'chile' : esChile);
      const resultado = esPedidoChile
        ? await actualizarFechaSalidaChile(pedidoId, nuevaFecha)
        : await actualizarFechaSalidaPedido(pedidoId, nuevaFecha);

      setMensajeExito({
        tipo: 'success',
        mensaje: resultado.message || 'Fecha actualizada correctamente',
        pedidoId: pedidoId,
        numeroPedido: resultado.numeroPedido,
        nuevaFecha: nuevaFecha,
      });

      await recargarPedidos();
      setEditandoFecha(null);
      setNuevaFecha('');

    } catch (err) {
      setErrorPedidos(err.message || 'Error al actualizar la fecha');
    } finally {
      setGuardando(false);
    }
  };

  // 👇 NUEVA FUNCIÓN: Actualizar datos en lote
  const handleActualizarEnLote = async () => {
    // Verificar si hay pedidos facturados
    if (hayPedidosFacturados()) {
      setErrorPedidos('No se pueden actualizar pedidos que ya tienen factura asignada');
      return;
    }
    if (!datosEnLote.aerolineaId || !datosEnLote.agenciaId) {
      setErrorPedidos('Aerolínea y Agencia son campos obligatorios');
      return;
    }

    setActualizandoEnLote(true);
    setErrorPedidos(null);

    try {
      let resultado;
      if (esConsolidado) {
        const [resultadoLocal, resultadoChile] = await Promise.all([
          actualizarDatosEnLote(filtros, datosEnLote),
          actualizarDatosEnLoteChile(filtros, datosEnLote)
        ]);
        resultado = {
          pedidosActualizados: (resultadoLocal.pedidosActualizados || 0) + (resultadoChile.pedidosActualizados || 0)
        };
      } else {
        resultado = esChile ? await actualizarDatosEnLoteChile(filtros, datosEnLote) : await actualizarDatosEnLote(filtros, datosEnLote);
      }

      setMensajeExito({
        tipo: 'success',
        mensaje: `Datos actualizados correctamente para ${resultado.pedidosActualizados} pedidos`,
        pedidosActualizados: resultado.pedidosActualizados
      });

      // Recargar los pedidos para ver los cambios
      await recargarPedidos();

      // Limpiar el formulario
      setDatosEnLote({
        guiaMaster: '',
        guiaHija: '',
        aerolineaId: '',
        agenciaId: ''
      });

      setMostrarGestionEnLote(false);

    } catch (err) {
      setErrorPedidos(err.message || 'Error al actualizar los datos en lote');
    } finally {
      setActualizandoEnLote(false);
    }
  };

  // Función para cerrar el modal y limpiar
  const handleCloseModal = () => {
    setMostrarModal(false);
    if (urlPDF) {
      URL.revokeObjectURL(urlPDF);
      setUrlPDF(null);
    }
  };

  // Función para formatear dinero
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(monto);
  };

  // Calcular pedidos que siguen en el rango después de las actualizaciones
  const pedidosEnRango = pedidos.filter(pedido => {
    if (!pedido.fechaSalida) return false;

    const fechaPedido = new Date(pedido.fechaSalida);
    const fechaDesde = new Date(filtros.fechaDesde);
    const fechaHasta = new Date(filtros.fechaHasta);

    return fechaPedido >= fechaDesde && fechaPedido <= fechaHasta;
  });

  // Permisos derivados para este módulo
  // true solo si tiene gestionar_fechas_readonly PERO NO gestionar_fechas_full
  const soloLecturaFechas =
    permisosAcciones.length > 0 &&
    permisosAcciones.includes('gestionar_fechas_readonly') &&
    !permisosAcciones.includes('gestionar_fechas_full');

  const cambiarPestana = (nuevaPestana) => {
    setPestanaActiva(nuevaPestana);
    setMostrarGestionFechas(false);
    setMostrarCostosTransporte(false);
    setMostrarCostosAereo(false);
    setPedidos([]);
    setCostosTransporte([]);
    setCostosAereo([]);
    setError(null);
    setErrorPedidos(null);
    setErrorCostos(null);
    setErrorCostosAereo(null);
    setMensajeExito(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER PRINCIPAL CON DEGRADADO */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <span className="text-2xl text-white">📈</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Consolidación de Pedidos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Genera reportes consolidados por áreas específicas basados en los pedidos registrados
          </p>
        </div>

        {/* PESTAÑAS */}
        <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border border-gray-200 shadow-md rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="hidden sm:inline text-gray-500 font-medium">Consultando:</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${esChile ? 'bg-teal-100 text-teal-800' : esConsolidado ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}`}>
                {etiquetaOrigen}
              </span>
            </div>

            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1 w-full sm:w-auto">
              <button
                onClick={() => cambiarPestana("pedidos")}
                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${pestanaActiva === "pedidos"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-500/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white"}`}
              >
                Pedidos Locales
              </button>
              <button
                onClick={() => cambiarPestana("chile")}
                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${pestanaActiva === "chile"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md ring-2 ring-teal-500/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white"}`}
              >
                Pedidos Chile
              </button>
              <button
                onClick={() => cambiarPestana("consolidado")}
                className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${pestanaActiva === "consolidado"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md ring-2 ring-violet-500/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white"}`}
              >
                Consolidado
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE FILTROS */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-1 h-8 bg-blue-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold text-gray-800">Filtros de Consolidación</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Tipo de Fecha */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Fecha
              </label>
              <div className="relative">
                <select
                  value={filtros.tipoFecha}
                  onChange={(e) => handleFiltroChange("tipoFecha", e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="fechaSalida">Fecha de Salida</option>
                  <option value="fechaEnroute">Fecha Enroute</option>
                  <option value="fechaDelivery">Fecha Delivery</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange("fechaDesde", e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange("fechaHasta", e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botón Gestión de Fechas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Gestión de Fechas
              </label>
              <button
                onClick={() => setMostrarGestionFechas(!mostrarGestionFechas)}
                disabled={!filtros.fechaDesde || !filtros.fechaHasta}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${!filtros.fechaDesde || !filtros.fechaHasta
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : mostrarGestionFechas
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
              >
                {mostrarGestionFechas ? "❌ Ocultar Gestión" : "📅 Gestionar Fechas"}
              </button>
            </div>

            {/* Botón Costos de Transporte (Terrestre + Aéreo) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Costos de Transporte
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setMostrarCostosTransporte(!mostrarCostosTransporte)}
                  disabled={!filtros.fechaDesde || !filtros.fechaHasta}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${!filtros.fechaDesde || !filtros.fechaHasta
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : mostrarCostosTransporte
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                >
                  {mostrarCostosTransporte ? "❌ Ocultar Costos" : "📦 Terrestre"}
                </button>
                <button
                  onClick={() => setMostrarCostosAereo(!mostrarCostosAereo)}
                  disabled={!filtros.fechaDesde || !filtros.fechaHasta}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${!filtros.fechaDesde || !filtros.fechaHasta
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : mostrarCostosAereo
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-sky-500 hover:bg-sky-600 text-white"
                    }`}
                >
                  {mostrarCostosAereo ? "❌ Ocultar Aéreo" : "✈️ Aéreo"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes de error y loading */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
              <p className="text-blue-700">Generando reporte, por favor espera...</p>
            </div>
          </div>
        )}

        {/* SECCIÓN DE COSTOS DE TRANSPORTE DIARIO */}
        {mostrarCostosTransporte && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-1 h-8 bg-green-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-semibold text-gray-800">Costos de Transporte Diario</h2>
                <span className="ml-3 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{etiquetaOrigen}</span>
                <div className="ml-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {costosTransporte.length} costos en el rango
                </div>
              </div>

              <button
                onClick={() => abrirModalCosto()}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
              >
                + Nuevo Costo
              </button>
            </div>

            {errorCostos && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">⚠️</div>
                  <p className="text-red-700">{errorCostos}</p>
                </div>
              </div>
            )}

            {loadingCostos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando costos de transporte...</p>
              </div>
            ) : costosTransporte.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron costos de transporte para las fechas seleccionadas
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vista de escritorio - Tabla */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                        {esConsolidado && <th className="text-left py-3 px-4 font-medium text-gray-700">Origen</th>}
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Cantidad Camiones</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Valor Flete</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Costo por Kg</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Observaciones</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costosTransporte.map((costo) => (
                        <tr key={costo.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{costo.Fecha}</td>
                          {esConsolidado && (
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${costo.TipoPedido === 'chile' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
                                {costo.TipoPedido === 'chile' ? 'Chile' : 'Locales'}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4">{formatearNumero(costo.CantidadCamiones)}</td>
                          <td className="py-3 px-4">${formatearNumero(costo.ValorFlete)}</td>
                          <td className="py-3 px-4">
                            {costo.CostoPorKg
                              ? `$${parseFloat(costo.CostoPorKg).toFixed(2)}`
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate" title={costo.Observaciones}>
                            {costo.Observaciones || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirModalCosto(costo)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => eliminarCosto(costo)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista móvil - Tarjetas */}
                <div className="lg:hidden space-y-3">
                  {costosTransporte.map((costo) => (
                    <div key={costo.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                      {esConsolidado && (
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium mb-2 ${costo.TipoPedido === 'chile' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
                          {costo.TipoPedido === 'chile' ? 'Chile' : 'Locales'}
                        </span>
                      )}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Fecha</p>
                          <p className="font-medium">{costo.Fecha}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Camiones</p>
                          <p className="font-medium">{formatearNumero(costo.CantidadCamiones)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Valor Flete</p>
                          <p className="font-medium">${formatearNumero(costo.ValorFlete)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Costo/Kg</p>
                          <p className="font-medium">
                            {costo.CostoPorKg
                              ? `$${parseFloat(costo.CostoPorKg).toFixed(2)}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-600">Observaciones</p>
                        <p className="text-sm">{costo.Observaciones || '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModalCosto(costo)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarCosto(costo)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN DE COSTOS DE TRANSPORTE AEREO */}
        {mostrarCostosAereo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-1 h-8 bg-sky-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-semibold text-gray-800">Costos de Transporte Aéreo</h2>
                <span className="ml-3 text-xs font-medium bg-sky-100 text-sky-800 px-2 py-1 rounded-full">{etiquetaOrigen}</span>
                <div className="ml-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {costosAereo.length} costos en el rango
                </div>
              </div>

              <button
                onClick={() => abrirModalAereo()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-all"
              >
                + Nuevo Costo Aéreo
              </button>
            </div>

            {errorCostosAereo && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">⚠️</div>
                  <p className="text-red-700">{errorCostosAereo}</p>
                </div>
              </div>
            )}

            {loadingCostosAereo ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando costos de transporte aéreo...</p>
              </div>
            ) : costosAereo.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron costos de transporte aéreo para las fechas seleccionadas
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vista de escritorio - Tabla */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Guía Master</th>
                        {esConsolidado && <th className="text-left py-3 px-4 font-medium text-gray-700">Origen</th>}
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Valor Flete (USD)</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">TRM</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Costo (COP)</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Peso Cobrado (Kg)</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Costo/Kg</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Observaciones</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costosAereo.map((costo) => (
                        <tr key={costo.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{costo.Fecha}</td>
                          <td className="py-3 px-4 font-mono text-sm">{costo.GuiaMaster}</td>
                          {esConsolidado && (
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${costo.TipoPedido === 'chile' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
                                {costo.TipoPedido === 'chile' ? 'Chile' : 'Locales'}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4">${formatearNumero(costo.ValorFleteUSD)}</td>
                          <td className="py-3 px-4">${formatearNumero(costo.TRM)}</td>
                          <td className="py-3 px-4 font-medium">${formatearNumero(Math.round(costo.CostoCOP))}</td>
                          <td className="py-3 px-4">{formatearNumero(costo.PesoCobrado)}</td>
                          <td className="py-3 px-4">
                            {costo.CostoAereoPorKg
                              ? `$${parseFloat(costo.CostoAereoPorKg).toFixed(2)}`
                              : 'N/A'}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate" title={costo.Observaciones}>
                            {costo.Observaciones || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirModalAereo(costo)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => eliminarCostoAereoFn(costo)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista móvil - Tarjetas */}
                <div className="lg:hidden space-y-3">
                  {costosAereo.map((costo) => (
                    <div key={costo.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                      {esConsolidado && (
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium mb-2 ${costo.TipoPedido === 'chile' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
                          {costo.TipoPedido === 'chile' ? 'Chile' : 'Locales'}
                        </span>
                      )}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Fecha</p>
                          <p className="font-medium">{costo.Fecha}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Guía Master</p>
                          <p className="font-mono text-sm font-medium">{costo.GuiaMaster}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Valor Flete (USD)</p>
                          <p className="font-medium">${formatearNumero(costo.ValorFleteUSD)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">TRM</p>
                          <p className="font-medium">${formatearNumero(costo.TRM)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Costo (COP)</p>
                          <p className="font-medium text-sky-700">${formatearNumero(Math.round(costo.CostoCOP))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Costo/Kg</p>
                          <p className="font-medium">
                            {costo.CostoAereoPorKg
                              ? `$${parseFloat(costo.CostoAereoPorKg).toFixed(2)}`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-600">Observaciones</p>
                        <p className="text-sm">{costo.Observaciones || '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModalAereo(costo)}
                          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarCostoAereoFn(costo)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN DE GESTIÓN DE FECHAS */}
        {mostrarGestionFechas && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-1 h-8 bg-orange-500 rounded-full mr-3"></div>
                <h2 className="text-xl font-semibold text-gray-800">Gestión de Fechas de Salida</h2>
                <div className="ml-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Mostrando {pedidosEnRango.length} de {pedidos.length} pedidos en el rango
                </div>
              </div>

              {/* Botón para gestión en lote: solo si el usuario tiene acceso completo */}
              {!soloLecturaFechas && (
                <button
                  onClick={() => setMostrarGestionEnLote(!mostrarGestionEnLote)}
                  disabled={pedidosEnRango.length === 0 || hayPedidosFacturados()}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${pedidosEnRango.length === 0 || hayPedidosFacturados()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : mostrarGestionEnLote
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  title={hayPedidosFacturados() ? "No disponible para pedidos facturados" : ""}
                >
                  {mostrarGestionEnLote ? "❌ Cancelar Lote" : "📦 Gestión en Lote"}
                </button>
              )}
            </div>

            {/* Sección Gestión en Lote: solo si el usuario tiene acceso completo */}
            {mostrarGestionEnLote && !soloLecturaFechas && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  Actualización en Lote para {pedidosEnRango.length} Pedidos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {/* Guía Master */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-blue-700">Guía Master</label>
                    <input
                      type="text"
                      value={datosEnLote.guiaMaster}
                      onChange={(e) => setDatosEnLote(prev => ({ ...prev, guiaMaster: e.target.value }))}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Número de guía master"
                    />
                  </div>

                  {/* Guía Hija */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-blue-700">Guía Hija</label>
                    <input
                      type="text"
                      value={datosEnLote.guiaHija}
                      onChange={(e) => setDatosEnLote(prev => ({ ...prev, guiaHija: e.target.value }))}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Número de guía hija"
                    />
                  </div>

                  {/* Aerolínea */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-blue-700">Aerolínea</label>
                    <select
                      value={datosEnLote.aerolineaId}
                      onChange={(e) => setDatosEnLote(prev => ({ ...prev, aerolineaId: e.target.value }))}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingSelects}
                    >
                      <option value="">{loadingSelects ? "Cargando aerolíneas..." : "-- Seleccione Aerolínea --"}</option>
                      {aerolineas.map((aerolinea) => (
                        <option key={aerolinea.IdAerolinea} value={aerolinea.IdAerolinea}>
                          {aerolinea.Nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agencia */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-blue-700">Agencia</label>
                    <select
                      value={datosEnLote.agenciaId}
                      onChange={(e) => setDatosEnLote(prev => ({ ...prev, agenciaId: e.target.value }))}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingSelects}
                    >
                      <option value="">{loadingSelects ? "Cargando agencias..." : "-- Seleccione Agencia --"}</option>
                      {agencias.map((agencia) => (
                        <option key={agencia.IdAgencia} value={agencia.IdAgencia}>
                          {agencia.Nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-blue-600">
                    Se aplicará a todos los {pedidosEnRango.length} pedidos del rango seleccionado
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setMostrarGestionEnLote(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleActualizarEnLote}
                      disabled={actualizandoEnLote || !datosEnLote.aerolineaId || !datosEnLote.agenciaId || loadingSelects || hayPedidosFacturados()}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${actualizandoEnLote || !datosEnLote.aerolineaId || !datosEnLote.agenciaId || loadingSelects || hayPedidosFacturados()
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      title={hayPedidosFacturados() ? "No se puede aplicar a pedidos facturados" : ""}
                    >
                      {actualizandoEnLote ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Actualizando...
                        </>
                      ) : (
                        `Aplicar a ${pedidosEnRango.length} Pedidos`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de éxito */}
            {mensajeExito && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-green-500 mr-2">✅</div>
                  <div>
                    <p className="text-green-700 font-medium">{mensajeExito.mensaje}</p>
                    {mensajeExito.numeroPedido && (
                      <p className="text-green-600 text-sm mt-1">
                        Pedido {mensajeExito.numeroPedido} actualizado a {mensajeExito.nuevaFecha}
                      </p>
                    )}
                    {mensajeExito.pedidosActualizados && (
                      <p className="text-green-600 text-sm mt-1">
                        {mensajeExito.pedidosActualizados} pedidos actualizados correctamente
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {errorPedidos && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">⚠️</div>
                  <p className="text-red-700">{errorPedidos}</p>
                </div>
              </div>
            )}

            {loadingPedidos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando pedidos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidosEnRango.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron pedidos para las fechas seleccionadas
                  </div>
                ) : (
                  pedidosEnRango.map((pedido) => (
                    <div
                      key={pedido.id}
                      className={`border-2 rounded-xl p-4 transition-all ${editandoFecha === pedido.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 items-center">
                        {/* Información del Pedido */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{pedido.numero}</p>
                            {esConsolidado && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${pedido.origen === 'chile' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
                                {pedido.origen === 'chile' ? 'Chile' : 'Locales'}
                              </span>
                            )}
                            {tieneFactura(pedido) && (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                Fact: {pedido.facturaNo}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{pedido.cliente} - {pedido.region}</p>
                          <p className="text-xs text-gray-500">P.O: {pedido.ordenCompra}</p>
                          {pedido.guiaMaster && (
                            <p className="text-xs text-sky-600 font-mono">GM: {pedido.guiaMaster}</p>
                          )}
                        </div>

                        {/* Detalles */}
                        <div>
                          <p className="text-sm text-gray-600">Cajas/TM</p>
                          <p className="font-medium text-gray-900">
                            {pedido.cajas} / {pedido.tms}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Peso/Valor</p>
                          <p className="font-medium text-gray-900">
                            {formatearNumero(pedido.pesoNeto)}kg / ${formatearNumero(pedido.valor)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Estibas</p>
                          <p className="font-medium text-gray-900">
                            {formatearNumero(pedido.estibas)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Estibas Pagas</p>
                          <p className="font-medium text-gray-900">
                            {formatearNumero(pedido.estibasPagas)}
                          </p>
                        </div>

                        {/* Fecha de Salida - Editable */}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha Salida</p>
                          {editandoFecha === pedido.id && !soloLecturaFechas ? (
                            <div className="space-y-2">
                              {/* Información de fechas actual vs nueva */}
                              <div className="bg-white rounded-lg p-2 border border-gray-200">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">Actual:</span>
                                  <span className="font-medium">{pedido.fechaSalida}</span>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                  <span className="text-orange-600">Nueva:</span>
                                  <span className="font-medium text-orange-600">{nuevaFecha}</span>
                                </div>
                              </div>

                              {/* Input y botones */}
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={nuevaFecha}
                                  onChange={(e) => setNuevaFecha(e.target.value)}
                                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => guardarFecha(pedido.id, pedido.origen)}
                                    disabled={guardando}
                                    className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-xs disabled:opacity-50 flex items-center"
                                    title="Confirmar cambio"
                                  >
                                    {guardando ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      '✓'
                                    )}
                                  </button>
                                  <button
                                    onClick={cancelarEdicion}
                                    disabled={guardando}
                                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs disabled:opacity-50"
                                    title="Cancelar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {pedido.fechaSalida || 'No asignada'}
                              </span>
                              {!soloLecturaFechas && (
                                <button
                                  onClick={() => {
                                    if (tieneFactura(pedido)) {
                                      setErrorPedidos(`No se puede modificar el pedido ${pedido.numero} porque ya tiene factura: ${pedido.facturaNo}`);
                                    } else {
                                      iniciarEdicionFecha(pedido.id, pedido.fechaSalida, pedido);
                                    }
                                  }}
                                  className={`text-sm transition-colors ${tieneFactura(pedido)
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-orange-500 hover:text-orange-700"
                                    }`}
                                  title={
                                    tieneFactura(pedido)
                                      ? `Facturado: ${pedido.facturaNo} - No editable`
                                      : "Modificar fecha de salida"
                                  }
                                  disabled={tieneFactura(pedido)}
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Estado */}
                        <div className="text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${tieneFactura(pedido)
                            ? 'bg-purple-100 text-purple-800'
                            : editandoFecha === pedido.id
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                            {tieneFactura(pedido)
                              ? `Facturado`
                              : editandoFecha === pedido.id
                                ? 'Editando'
                                : 'Activo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Resumen */}
            {pedidosEnRango.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-sm text-blue-600">Pedidos en Rango</p>
                    <p className="text-xl font-bold text-blue-700">{pedidosEnRango.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total Cajas</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatearNumero(pedidosEnRango.reduce((sum, p) => sum + p.cajas, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Peso Total</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatearNumero(pedidosEnRango.reduce((sum, p) => sum + p.pesoNeto, 0))} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Estibas</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatearNumero(pedidosEnRango.reduce((sum, p) => sum + p.estibas, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Estibas Pagas</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatearNumero(pedidosEnRango.reduce((sum, p) => sum + p.estibasPagas, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Valor Total</p>
                    <p className="text-xl font-bold text-blue-700">
                      ${formatearNumero(pedidosEnRango.reduce((sum, p) => sum + p.valor, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN DE REPORTES: solo visible para usuarios con acceso completo */}
        {!soloLecturaFechas && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-1 h-8 bg-green-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">Reportes por Área</h2>
              <span className="ml-3 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">{etiquetaOrigen}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportes.map((reporte) => (
                <div
                  key={reporte.id}
                  className={`border-2 border-gray-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:border-gray-200 ${!reporte.disponible ? "opacity-60" : ""
                    }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icono */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg ${reporte.color.replace('hover:', '')
                      }`}>
                      {reporte.icono}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {reporte.titulo}
                        </h3>
                        {!reporte.disponible && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                            Próximamente
                          </span>
                        )}
                        {reporte.disponible && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${reporte.id === 'transporte'
                            ? 'bg-gradient-to-r from-red-100 to-green-100 text-gray-800'
                            : reporte.tipo === "pdf"
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                            {reporte.id === 'transporte' ? 'PDF + Excel' : reporte.tipo === "pdf" ? 'PDF' : 'Excel'}
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {reporte.descripcion}
                      </p>

                      {reporte.id === 'transporte' ? (
                        <div className="space-y-3">
                          <button
                            onClick={() => handleGenerarReporte(reporte.id)}
                            disabled={!reporte.disponible || loading}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${reporte.disponible && !loading
                              ? `${reporte.color} text-white shadow-sm hover:shadow-md`
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                          >
                            {loading ? "Generando..." :
                              reporte.disponible ? "📊 Generar Reporte PDF" : "Disponible Próximamente"}
                          </button>
                          <button
                            onClick={handleGenerarExcelTransporte}
                            disabled={!reporte.disponible || loading}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${reporte.disponible && !loading
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                          >
                            {loading ? "Generando..." :
                              reporte.disponible ? "📥 Descargar Excel" : "Disponible Próximamente"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerarReporte(reporte.id)}
                          disabled={!reporte.disponible || loading}
                          className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${reporte.disponible && !loading
                            ? `${reporte.color} text-white shadow-sm hover:shadow-md`
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          {loading ? "Generando..." :
                            reporte.disponible ? (esConsolidado ? "Generar Consolidado" : "Generar Reporte") : "Disponible Próximamente"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN DE RESUMEN ESTADÍSTICO */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-100">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-purple-500 rounded-full mr-3"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Resumen del Período</h2>
            <span className="ml-3 text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{etiquetaOrigen}</span>
            {estadisticas.loading && (
              <div className="ml-3 sm:ml-4 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-purple-500"></div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-600">Cargando...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
            {[
              {
                label: "Pedidos",
                value: formatearNumero(estadisticas.totalPedidos),
                color: "bg-blue-500",
                icon: "📦"
              },
              {
                label: "Cajas",
                value: formatearNumero(estadisticas.cajas),
                color: "bg-green-500",
                icon: "📊"
              },
              {
                label: "Peso Neto",
                value: `${formatearNumero(estadisticas.pesoNeto)} Kg`,
                color: "bg-orange-500",
                icon: "⚖️"
              },
              {
                label: "Valor Total",
                value: formatearDinero(estadisticas.valorTotal),
                color: "bg-purple-500",
                icon: "💰"
              },
              {
                label: "Estibas",
                value: formatearNumero(estadisticas.estibas),
                color: "bg-red-500",
                icon: "🔄"
              }
            ].map((estadistica, index) => (
              <div
                key={index}
                className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* Icono para móviles */}
                <div className="hidden xs:block sm:hidden mb-1">
                  <div className={`w-8 h-8 ${estadistica.color} rounded-full flex items-center justify-center mx-auto text-white text-sm`}>
                    {estadistica.icon}
                  </div>
                </div>

                {/* Punto de color para pantallas más grandes */}
                <div className="xs:hidden sm:block">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 ${estadistica.color} rounded-full mx-auto mb-1 sm:mb-2`}></div>
                </div>

                <div className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 mb-0 sm:mb-1 break-words">
                  {estadisticas.loading ? (
                    <div className="inline-block h-4 sm:h-5 lg:h-6 w-12 sm:w-16 lg:w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  ) : (
                    <span className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-2xl">
                      {estadistica.value}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 break-words">
                  {estadistica.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Selecciona un rango de fechas y elige el reporte específico para cada área operativa
          </p>
        </div>
      </div>

      {/* Modal Visor de PDF */}
      {mostrarModal && urlPDF && (
        <ModalVisorPreliminar
          url={urlPDF}
          onClose={handleCloseModal}
          titulo={`Reporte de ${reporteActual}`}
        />
      )}

      {/* Modal para Costos de Transporte */}
      {modalCostoAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="bg-green-500 text-white p-4 rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {costoEditando ? 'Editar Costo' : 'Nuevo Costo de Transporte'}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formCosto.Fecha || ''}
                    onChange={(e) => setFormCosto(prev => ({ ...prev, Fecha: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La fecha debe existir en facturas (EncabInvoice)
                  </p>
                </div>

                {esConsolidado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Pedido <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCosto.TipoPedido || ''}
                      onChange={(e) => setFormCosto(prev => ({ ...prev, TipoPedido: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccione tipo</option>
                      <option value="normal">Pedidos Locales</option>
                      <option value="chile">Pedidos Chile</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de Camiones <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formCosto.CantidadCamiones || ''}
                    onChange={(e) => setFormCosto(prev => ({ ...prev, CantidadCamiones: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor del Flete ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formCosto.ValorFlete || ''}
                    onChange={(e) => setFormCosto(prev => ({ ...prev, ValorFlete: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Extras
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formCosto.HorasExtras}
                      onChange={(e) => setFormCosto(prev => ({ ...prev, HorasExtras: e.target.value, ValorHorasExtras: e.target.value === '' || parseFloat(e.target.value) <= 0 ? '' : prev.ValorHorasExtras }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Horas Extras ($)
                      {formCosto.HorasExtras !== '' && parseFloat(formCosto.HorasExtras) > 0 && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formCosto.ValorHorasExtras}
                      onChange={(e) => setFormCosto(prev => ({ ...prev, ValorHorasExtras: e.target.value }))}
                      disabled={formCosto.HorasExtras === '' || parseFloat(formCosto.HorasExtras) <= 0}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${formCosto.HorasExtras === '' || parseFloat(formCosto.HorasExtras) <= 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : ''
                        }`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formCosto.Observaciones || ''}
                    onChange={(e) => setFormCosto(prev => ({ ...prev, Observaciones: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="3"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              {errorCostos && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center">
                    <div className="text-red-500 mr-2">⚠️</div>
                    <p className="text-red-700 text-sm">{errorCostos}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={cerrarModalCosto}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCosto}
                disabled={guardandoCosto}
                className={`flex-1 py-2 rounded-lg font-medium transition ${guardandoCosto
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
              >
                {guardandoCosto ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  </>
                ) : (
                  'Guardar Costo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Costos de Transporte Aéreo */}
      {modalAereoAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="bg-sky-500 text-white p-4 rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {aereoEditando ? 'Editar Costo Aéreo' : 'Nuevo Costo de Transporte Aéreo'}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formAereo.Fecha || ''}
                    onChange={handleFechaAereoChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Solo fechas con Guía Master registrada en facturas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guía Master <span className="text-red-500">*</span>
                  </label>
                  {esConsolidado && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Pedido <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formAereo.TipoPedido || ''}
                        onChange={handleTipoAereoChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccione tipo</option>
                        <option value="normal">Pedidos Locales</option>
                        <option value="chile">Pedidos Chile</option>
                      </select>
                    </div>
                  )}

                  {loadingGuias ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></div>
                      Cargando guías...
                    </div>
                  ) : guiasMasterDisponibles.length > 0 ? (
                    <select
                      value={formAereo.GuiaMaster}
                      onChange={(e) => setFormAereo(prev => ({ ...prev, GuiaMaster: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccione una Guía Master</option>
                      {guiasMasterDisponibles.map((gm) => (
                        <option key={gm} value={gm}>{gm}</option>
                      ))}
                    </select>
                  ) : formAereo.Fecha ? (
                    <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
                      No hay guías master disponibles para esta fecha
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-2">
                      Seleccione una fecha primero
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Flete (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formAereo.ValorFleteUSD || ''}
                      onChange={(e) => setFormAereo(prev => ({ ...prev, ValorFleteUSD: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TRM (USD→COP) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formAereo.TRM || ''}
                      onChange={(e) => setFormAereo(prev => ({ ...prev, TRM: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {formAereo.ValorFleteUSD && formAereo.TRM && (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                    <p className="text-sm text-sky-800">
                      <span className="font-medium">Costo en COP:</span>{' '}
                      ${formatearNumero(Math.round(parseFloat(formAereo.ValorFleteUSD || 0) * parseFloat(formAereo.TRM || 0)))}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso Cobrado (Kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formAereo.PesoCobrado || ''}
                    onChange={(e) => setFormAereo(prev => ({ ...prev, PesoCobrado: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formAereo.Observaciones || ''}
                    onChange={(e) => setFormAereo(prev => ({ ...prev, Observaciones: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    rows="3"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              {errorCostosAereo && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center">
                    <div className="text-red-500 mr-2">⚠️</div>
                    <p className="text-red-700 text-sm">{errorCostosAereo}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={cerrarModalAereo}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCostoAereoFn}
                disabled={guardandoAereo}
                className={`flex-1 py-2 rounded-lg font-medium transition ${guardandoAereo
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 text-white'
                  }`}
              >
                {guardandoAereo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  </>
                ) : (
                  'Guardar Costo Aéreo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
