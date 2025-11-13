// src/components/consolidacion/ConsolidacionMain.jsx
import React, { useState, useEffect } from "react";
import {
  generarExcelConsolidacion,
  generarReporteProduccion,
  generarReporteEmpaque,
  generarReporteTransporte,
  obtenerEstadisticasConsolidacion,
  actualizarFechaSalidaPedido,
  actualizarDatosEnLote
} from '../../services/consolidacionService';
import { obtenerPedidosPorFecha } from '../../services/facturacionService';
import ModalVisorPreliminar from "../ModalVisorPreliminar";
import { getDatosSelect } from '../../services/pedidosService';

export default function ConsolidacionMain() {
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
      const datos = await obtenerEstadisticasConsolidacion(filtros);

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
      const resultado = await obtenerPedidosPorFecha(filtros);

      if (resultado.pedidos && resultado.pedidos.length > 0) {
        // Mapear los datos reales al formato que espera el componente
        const pedidosFormateados = resultado.pedidos.map(pedido => ({
          id: pedido.id,
          numero: pedido.numero,
          cliente: pedido.cliente,
          fechaSalida: pedido.fecha, // ← Usar pedido.fecha que viene del backend
          fecha: pedido.fecha,
          cajas: pedido.cajas,
          tms: pedido.tms,
          pesoNeto: pedido.pesoNeto,
          valor: pedido.valor,
          ordenCompra: pedido.ordenCompra
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

  // Función para recargar pedidos después de una actualización
  const recargarPedidos = async () => {
    await cargarPedidos(); // Recargar la lista desde el servidor
    cargarEstadisticas();  // Actualizar estadísticas
  };

  // Cargar estadísticas cuando cambien los filtros
  useEffect(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      cargarEstadisticas();
    }
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.tipoFecha]);

  // Cargar pedidos cuando se active la gestión de fechas
  useEffect(() => {
    if (mostrarGestionFechas && filtros.fechaDesde && filtros.fechaHasta) {
      cargarPedidos();
    }
  }, [mostrarGestionFechas, filtros.fechaDesde, filtros.fechaHasta]);

  // Cargar aerolíneas y agencias al montar el componente
  useEffect(() => {
    cargarAerolineasYAgencias();
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
        await generarExcelConsolidacion(filtros);
      } else if (reporte.tipo === "pdf") {
        let blob;

        if (reporteId === 'produccion') {
          blob = await generarReporteProduccion(filtros);
          setReporteActual('Producción');
        } else if (reporteId === 'empaque') {
          blob = await generarReporteEmpaque(filtros);
          setReporteActual('Empaque');
        } else if (reporteId === 'transporte') {
          blob = await generarReporteTransporte(filtros);
          setReporteActual('Transporte');
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

  // Funciones para gestión de fechas
  const iniciarEdicionFecha = (pedidoId, fechaActual) => {
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

  const guardarFecha = async (pedidoId, tipoPedido = null) => {
    if (!nuevaFecha) {
      setErrorPedidos('Por favor selecciona una fecha válida');
      return;
    }

    setGuardando(true);
    setErrorPedidos(null);
    setMensajeExito(null);

    try {
      // Determinar automáticamente el tipo de pedido si no se especifica
      let tipo = tipoPedido;
      if (!tipo) {
        // Buscar el pedido en la lista para determinar si es normal o sample
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (pedido && pedido.tipoDato) {
          tipo = pedido.tipoDato.toLowerCase(); // 'normal' o 'sample'
        }
      }

      const resultado = await actualizarFechaSalidaPedido(pedidoId, nuevaFecha, tipo);

      // Mostrar mensaje de éxito
      setMensajeExito({
        tipo: 'success',
        mensaje: resultado.message || 'Fecha actualizada correctamente',
        pedidoId: pedidoId,
        numeroPedido: resultado.numeroPedido,
        nuevaFecha: nuevaFecha,
        tipoPedido: resultado.tipoPedido || tipo
      });

      // Recargar TODOS los pedidos desde el servidor para reflejar el filtro actual
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
    if (!datosEnLote.aerolineaId || !datosEnLote.agenciaId) {
      setErrorPedidos('Aerolínea y Agencia son campos obligatorios');
      return;
    }

    setActualizandoEnLote(true);
    setErrorPedidos(null);

    try {
      const resultado = await actualizarDatosEnLote(filtros, datosEnLote);
      
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

  // Función para formatear números
  const formatearNumero = (numero) => {
    return new Intl.NumberFormat('es-CO').format(numero);
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

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER PRINCIPAL CON DEGRADADO */}
        <div className="text-center mb-8">
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

        {/* SECCIÓN DE FILTROS */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-1 h-8 bg-blue-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold text-gray-800">Filtros de Consolidación</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              
              {/* 👇 NUEVO: Botón para gestión en lote */}
              <button
                onClick={() => setMostrarGestionEnLote(!mostrarGestionEnLote)}
                disabled={pedidosEnRango.length === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  pedidosEnRango.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : mostrarGestionEnLote
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {mostrarGestionEnLote ? "❌ Cancelar Lote" : "📦 Gestión en Lote"}
              </button>
            </div>

            {/* 👇 NUEVA SECCIÓN: Gestión en Lote */}
            {mostrarGestionEnLote && (
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
                      disabled={actualizandoEnLote || !datosEnLote.aerolineaId || !datosEnLote.agenciaId || loadingSelects}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        actualizandoEnLote || !datosEnLote.aerolineaId || !datosEnLote.agenciaId || loadingSelects
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
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
                      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                        {/* Información del Pedido */}
                        <div className="lg:col-span-2">
                          <p className="font-semibold text-gray-900">{pedido.numero}</p>
                          <p className="text-sm text-gray-600">{pedido.cliente}</p>
                          <p className="text-xs text-gray-500">P.O: {pedido.ordenCompra}</p>
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

                        {/* Fecha de Salida - Editable */}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Fecha Salida</p>
                          {editandoFecha === pedido.id ? (
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
                                    onClick={() => guardarFecha(pedido.id, pedido.tipoDato)}
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
                              <button
                                onClick={() => iniciarEdicionFecha(pedido.id, pedido.fechaSalida)}
                                className="text-orange-500 hover:text-orange-700 text-sm transition-colors"
                                title="Modificar fecha de salida"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Estado */}
                        <div className="text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${editandoFecha === pedido.id
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {editandoFecha === pedido.id ? 'Editando' : 'Activo'}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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

        {/* SECCIÓN DE REPORTES */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="w-1 h-8 bg-green-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-semibold text-gray-800">Reportes por Área</h2>
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
                      {reporte.tipo === "pdf" && reporte.disponible && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                          PDF
                        </span>
                      )}
                      {reporte.tipo === "excel" && reporte.disponible && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          Excel
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      {reporte.descripcion}
                    </p>

                    <button
                      onClick={() => handleGenerarReporte(reporte.id)}
                      disabled={!reporte.disponible || loading}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${reporte.disponible && !loading
                        ? `${reporte.color} text-white shadow-sm hover:shadow-md`
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      {loading ? "Generando..." :
                        reporte.disponible ? "Generar Reporte" : "Disponible Próximamente"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN DE RESUMEN ESTADÍSTICO */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-100">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-1 h-6 sm:h-8 bg-purple-500 rounded-full mr-3"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Resumen del Período</h2>
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
    </div>
  );
}