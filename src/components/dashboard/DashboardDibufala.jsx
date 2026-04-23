import React, { useState, useEffect, useCallback, useRef } from 'react';
import EnviarReporteDashboardModal from './EnviarReporteDashboardModal';
import { fetchDashboardData, fetchVentasRegionCliente, fetchClientesProducto } from '../../services/dashboard/dashboardService';
import KPICards from './KPICards';
import ChartProveedoresClientes from './ChartProveedoresClientes';
import ChartRegionesCliente from './ChartRegionesCliente';
import ChartProductos from './ChartProductos';
import ChartTendencia from './ChartTendencia';
import ChartClientesProducto from './ChartClientesProducto';
import FiltrosFecha from './FiltrosFecha';
import SeccionTransporte from './SeccionTransporte';
import { APPS_CONFIG, fechaLocalStr } from '../../services/dashboard/dashboardService';
import Swal from 'sweetalert2';

/**
 * ==========================================
 * CONSTANTES Y CONFIGURACIÓN
 * ==========================================
 */

/** Configuración de colores para diferenciación de productos */
const PRODUCT_COLORS = {
    ORGANICO: '#3B82F6',      // Azul claro para productos orgánicos
    NO_ORGANICO: '#1E3A8A'    // Azul oscuro para productos no orgánicos
};

/** Configuración de la aplicación */
const DASHBOARD_CONFIG = {
    APP_ID: 'dibufala',
    SHOW_PURCHASES: false,    // Cambiar a true cuando se requiera mostrar sección de compras
    LOADING_TIMEOUT: 30000,   // Timeout en ms para carga de datos
};

/** Configuración de dimensiones y tamaños */
const DIMENSIONS = {
    CHART_HEIGHT: '250px',
    CHART_HEIGHT_EXTENDED: '280px',
    CHART_HEIGHT_LARGE: '320px',
    CHART_CONTAINER_HEIGHT: 'h-[250px]',
};

/** Mensajes de error */
const ERROR_MESSAGES = {
    LOAD_REGIONS: 'No se pudieron cargar las regiones del cliente',
    LOAD_CLIENTS_BY_PRODUCT: 'No se pudieron cargar los clientes del producto',
    ERROR_TITLE: 'Error',
};

/**
 * ==========================================
 * DashboardDibufala Component
 * ==========================================
 * Panel de control principal para Dibufala
 * Muestra KPIs, gráficos de ventas, clientes y productos
 * con filtros por fechas y selecciones interactivas
 */
const DashboardDibufala = () => {
    // ============================================
    // ESTADO: Datos principales del dashboard
    // ============================================
    const dashboardRef = useRef(null);
    const [modalReporteAbierto, setModalReporteAbierto] = useState(false);
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ============================================
    // ESTADO: Filtros de fecha
    // ============================================
    const [fechaInicio, setFechaInicio] = useState(() => {
        const firstDay = new Date();
        firstDay.setDate(1);
        return fechaLocalStr(firstDay);
    });

    const [fechaFin, setFechaFin] = useState(() => {
        return fechaLocalStr();
    });

    // ============================================
    // ESTADO: Selección de cliente y regiones
    // ============================================
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [regionesCliente, setRegionesCliente] = useState([]);
    const [cargandoRegiones, setCargandoRegiones] = useState(false);

    // ============================================
    // ESTADO: Selección de producto y clientes
    // ============================================
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [clientesProducto, setClientesProducto] = useState([]);
    const [cargandoClientesProducto, setCargandoClientesProducto] = useState(false);


    // ============================================
    // EFFECTS: Cargar datos al cambiar fechas
    // ============================================
    /**
     * Carga los datos principales del dashboard
     * Limpia las selecciones anteriores y establece el estado de carga
     */
    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            setError(null);

            // Limpiar selecciones previas al cambiar fechas
            setClienteSeleccionado(null);
            setRegionesCliente([]);
            setProductoSeleccionado(null);
            setClientesProducto([]);

            try {
                const data = await fetchDashboardData(DASHBOARD_CONFIG.APP_ID, fechaInicio, fechaFin);
                setDatos(data);
            } catch (err) {
                setError(err.message);
                console.error('Error cargando datos del dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [fechaInicio, fechaFin]);

    /**
     * Maneja el cambio de fechas desde el filtro
     * @param {string} nuevaInicio - Nueva fecha de inicio (YYYY-MM-DD)
     * @param {string} nuevaFin - Nueva fecha de fin (YYYY-MM-DD)
     */
    const handleFechasCambiadas = (nuevaInicio, nuevaFin) => {
        setFechaInicio(nuevaInicio);
        setFechaFin(nuevaFin);
    };

    /**
     * Alterna la selección de un cliente
     * Si el cliente ya está seleccionado, lo deselecciona
     * De lo contrario, carga sus regiones de venta
     * @param {Object} cliente - Objeto cliente con id y nombre
     */
    const handleClientClick = useCallback(async (cliente) => {
        // Toggle: deseleccionar si ya está seleccionado
        if (clienteSeleccionado && clienteSeleccionado.id === cliente.id) {
            setClienteSeleccionado(null);
            setRegionesCliente([]);
            return;
        }

        setClienteSeleccionado(cliente);
        setCargandoRegiones(true);
        try {
            const data = await fetchVentasRegionCliente(cliente.id, fechaInicio, fechaFin);
            setRegionesCliente(data.regiones);
        } catch (error) {
            console.error('Error al cargar regiones del cliente:', error);
            Swal.fire(ERROR_MESSAGES.ERROR_TITLE, ERROR_MESSAGES.LOAD_REGIONS, 'error');
            setRegionesCliente([]);
        } finally {
            setCargandoRegiones(false);
        }
    }, [clienteSeleccionado, fechaInicio, fechaFin]);

    /**
     * Limpia la selección del cliente
     */
    const limpiarSeleccionCliente = useCallback(() => {
        setClienteSeleccionado(null);
        setRegionesCliente([]);
    }, []);

    /**
     * Alterna la selección de un producto
     * Si el producto ya está seleccionado, lo deselecciona
     * De lo contrario, carga los clientes que lo compraron
     * @param {Object} producto - Objeto producto con id y nombre
     * @param {string} categoria - Categoría del producto (Orgánico/No Orgánico)
     * @param {string} color - Color asociado al producto para visualización
     */
    const handleProductoClick = useCallback(async (producto, categoria, color) => {
        // Toggle: deseleccionar si ya está seleccionado
        if (productoSeleccionado && productoSeleccionado.id === producto.id) {
            setProductoSeleccionado(null);
            setClientesProducto([]);
            return;
        }

        setProductoSeleccionado({ ...producto, categoria, color });
        setCargandoClientesProducto(true);
        try {
            const data = await fetchClientesProducto(producto.id, fechaInicio, fechaFin);
            setClientesProducto(data.clientes);
        } catch (error) {
            console.error('Error al cargar clientes del producto:', error);
            Swal.fire(ERROR_MESSAGES.ERROR_TITLE, ERROR_MESSAGES.LOAD_CLIENTS_BY_PRODUCT, 'error');
            setClientesProducto([]);
        } finally {
            setCargandoClientesProducto(false);
        }
    }, [productoSeleccionado, fechaInicio, fechaFin]);

    /**
     * Limpia la selección del producto
     */
    const limpiarSeleccionProducto = useCallback(() => {
        setProductoSeleccionado(null);
        setClientesProducto([]);
    }, []);

    /**
     * Recarga los datos del dashboard
     */
    const handleRecargar = useCallback(() => {
        // Usar el mismo estado que el useEffect para forzar la recarga
        setFechaInicio(fechaInicio);
        setFechaFin(fechaFin);
    }, [fechaInicio, fechaFin]);

    // ============================================
    // RENDERIZADO CONDICIONAL: Estados de carga y error
    // ============================================

    // Mostrar spinner mientras carga por primera vez
    if (loading && !datos) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Cargando datos del dashboard...</p>
            </div>
        );
    }

    // Mostrar mensaje de error con opción de reintentar
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <h3 className="text-red-800 text-xl font-semibold mb-2">Error al cargar datos</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={handleRecargar}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Obtener configuración de la app
    const configApp = APPS_CONFIG[DASHBOARD_CONFIG.APP_ID];


    // ============================================
    // RENDERIZADO PRINCIPAL
    // ============================================
    return (
        <>
            <div ref={dashboardRef} data-dashboard-capture className="p-3 md:p-6 bg-gray-50 min-h-screen">
                {/* 
        =====================================
        HEADER: Título y botón de actualización
        =====================================
      */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 md:mb-6 pb-4 border-b border-gray-200">
                    <div className="mb-3 lg:mb-0">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
                            {configApp.nombre} - Dashboard
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Período: {fechaInicio} al {fechaFin}
                        </p>
                    </div>

                    {/* Botón de actualización */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <button
                            onClick={handleRecargar}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            title="Recargar datos del dashboard"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Actualizar
                        </button>

                        <button
                            onClick={() => setModalReporteAbierto(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                            title="Enviar reporte del dashboard por correo"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Enviar reporte
                        </button>
                    </div>
                </div>

                {/* 
        =====================================
        FILTROS: Selección de rango de fechas
        =====================================
      */}
                <div className="mb-6">
                    <FiltrosFecha
                        fechaInicio={fechaInicio}
                        fechaFin={fechaFin}
                        onFechasCambiadas={handleFechasCambiadas}
                    />
                </div>

                {/* 
        =====================================
        SECCIÓN VENTAS: Principal y más importante
        =====================================
      */}
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
                    <h2 className="text-xl font-bold mb-6 pb-3 border-b border-gray-100"
                        style={{ color: configApp.colorVentas }}>
                        💰 Ventas
                    </h2>

                    {datos?.ventas && (
                        <>
                            {/* KPIs: Métricas principales de ventas */}
                            <div className="mb-6">
                                <KPICards
                                    kpis={datos.ventas.kpis}
                                    tipo="ventas"
                                    color={configApp.colorVentas}
                                />
                            </div>

                            {/* 
              VERSIÓN DESKTOP (≥1280px): Layout de 2 columnas
              - Izquierda: Clientes y regiones
              - Derecha: Productos orgánicos, no orgánicos y clientes por producto
            */}
                            <div className="hidden xl:grid xl:grid-cols-2 gap-4 md:gap-6 mb-6 items-start">
                                {/* Columna Izquierda: Top 10 Clientes y Regiones */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                        Top 10 Clientes
                                    </h3>
                                    <div className={DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                                        <ChartProveedoresClientes
                                            data={datos.ventas.clientes}
                                            color={configApp.colorVentas}
                                            tipo="clientes"
                                            onBarClick={handleClientClick}
                                            clienteSeleccionadoId={clienteSeleccionado?.id}
                                        />
                                    </div>

                                    {/* Detalle de regiones cuando se selecciona un cliente */}
                                    {clienteSeleccionado && (
                                        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-base font-semibold text-gray-700">
                                                    Ventas por región: {clienteSeleccionado.nombre}
                                                </h4>
                                                <button
                                                    onClick={limpiarSeleccionCliente}
                                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                                    title="Cerrar selección"
                                                    aria-label="Cerrar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {cargandoRegiones ? (
                                                <div className="text-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                    <p className="text-sm text-gray-600">Cargando regiones...</p>
                                                </div>
                                            ) : (
                                                <ChartRegionesCliente
                                                    data={regionesCliente}
                                                    clienteNombre={clienteSeleccionado.nombre}
                                                    color={configApp.colorVentas}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Columna Derecha: Productos y Clientes por Producto */}
                                <div className="flex flex-col gap-4">
                                    {/* Grid de productos: Orgánicos y No Orgánicos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Productos Orgánicos */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                                Productos Orgánicos
                                            </h3>
                                            <div className={DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                                                {datos.ventas.productos?.organicos?.length > 0 ? (
                                                    <ChartProductos
                                                        data={datos.ventas.productos.organicos}
                                                        color={PRODUCT_COLORS.ORGANICO}
                                                        tipo="ventas"
                                                        onBarClick={(producto) => handleProductoClick(producto, 'Orgánico', PRODUCT_COLORS.ORGANICO)}
                                                        productoSeleccionadoId={productoSeleccionado?.id}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-500">
                                                        Sin datos
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Productos Convencionales */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                                Productos Convencionales
                                            </h3>
                                            <div className={DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                                                {datos.ventas.productos?.noOrganicos?.length > 0 ? (
                                                    <ChartProductos
                                                        data={datos.ventas.productos.noOrganicos}
                                                        color={PRODUCT_COLORS.NO_ORGANICO}
                                                        tipo="ventas"
                                                        onBarClick={(producto) => handleProductoClick(producto, 'Convencional', PRODUCT_COLORS.NO_ORGANICO)}
                                                        productoSeleccionadoId={productoSeleccionado?.id}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-500">
                                                        Sin datos
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detalle de clientes cuando se selecciona un producto */}
                                    {productoSeleccionado && (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-base md:text-lg font-semibold text-gray-800">
                                                    Clientes que compraron: {productoSeleccionado.categoria} - {productoSeleccionado.producto}
                                                </h3>
                                                <button
                                                    onClick={limpiarSeleccionProducto}
                                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                                    title="Cerrar selección"
                                                    aria-label="Cerrar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {cargandoClientesProducto ? (
                                                <div className="text-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                    <p className="text-sm text-gray-600">Cargando clientes...</p>
                                                </div>
                                            ) : (
                                                <div className="min-h-[250px] md:min-h-[300px] h-auto overflow-hidden">
                                                    <ChartClientesProducto
                                                        data={clientesProducto}
                                                        productoNombre={`${productoSeleccionado.categoria} - ${productoSeleccionado.producto}`}
                                                        color={productoSeleccionado.color}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 
              VERSIÓN MÓVIL/TABLET (<1280px): Layout en columna única
              Mismos gráficos que desktop pero apilados verticalmente
            */}
                            <div className="block xl:hidden space-y-4 mb-6">
                                {/* Top 10 Clientes */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                        Top 10 Clientes
                                    </h3>
                                    <div className={DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                                        <ChartProveedoresClientes
                                            data={datos.ventas.clientes}
                                            color={configApp.colorVentas}
                                            tipo="clientes"
                                            onBarClick={handleClientClick}
                                            clienteSeleccionadoId={clienteSeleccionado?.id}
                                        />
                                    </div>

                                    {/* Detalle de regiones en móvil */}
                                    {clienteSeleccionado && (
                                        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-base font-semibold text-gray-700">
                                                    Ventas por región: {clienteSeleccionado.nombre}
                                                </h4>
                                                <button
                                                    onClick={limpiarSeleccionCliente}
                                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                                    title="Cerrar selección"
                                                    aria-label="Cerrar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {cargandoRegiones ? (
                                                <div className="text-center py-4">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                    <p className="text-sm text-gray-600">Cargando regiones...</p>
                                                </div>
                                            ) : (
                                                <ChartRegionesCliente
                                                    data={regionesCliente}
                                                    clienteNombre={clienteSeleccionado.nombre}
                                                    color={configApp.colorVentas}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Productos: Orgánicos y No Orgánicos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Productos Orgánicos */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                            Productos Orgánicos
                                        </h3>
                                        <div className={DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                                            {datos.ventas.productos?.organicos?.length > 0 ? (
                                                <ChartProductos
                                                    data={datos.ventas.productos.organicos}
                                                    color={PRODUCT_COLORS.ORGANICO}
                                                    tipo="ventas"
                                                    onBarClick={(producto) => handleProductoClick(producto, 'Orgánico', PRODUCT_COLORS.ORGANICO)}
                                                    productoSeleccionadoId={productoSeleccionado?.id}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500">
                                                    Sin datos
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Productos Convencionales */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                            Productos Convencionales
                                        </h3>
                                        <div className={DIMENSIONS.CHART_CONTAINER_HEIGHT}>
                                            {datos.ventas.productos?.noOrganicos?.length > 0 ? (
                                                <ChartProductos
                                                    data={datos.ventas.productos.noOrganicos}
                                                    color={PRODUCT_COLORS.NO_ORGANICO}
                                                    tipo="ventas"
                                                    onBarClick={(producto) => handleProductoClick(producto, 'Convencional', PRODUCT_COLORS.NO_ORGANICO)}
                                                    productoSeleccionadoId={productoSeleccionado?.id}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-500">
                                                    Sin datos
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detalle de clientes por producto en móvil */}
                                {productoSeleccionado && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-base md:text-lg font-semibold text-gray-800">
                                                Clientes que compraron: {productoSeleccionado.categoria} - {productoSeleccionado.producto}
                                            </h3>
                                            <button
                                                onClick={limpiarSeleccionProducto}
                                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                                title="Cerrar selección"
                                                aria-label="Cerrar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        {cargandoClientesProducto ? (
                                            <div className="text-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                <p className="text-sm text-gray-600">Cargando clientes...</p>
                                            </div>
                                        ) : (
                                            <div className="min-h-[250px] md:min-h-[300px] h-auto overflow-hidden">
                                                <ChartClientesProducto
                                                    data={clientesProducto}
                                                    productoNombre={`${productoSeleccionado.categoria} - ${productoSeleccionado.producto}`}
                                                    color={productoSeleccionado.color}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Gráfico de Tendencia: Se muestra en todos los tamaños de pantalla */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                                    Tendencia de Ventas
                                </h3>
                                <div style={{ height: DIMENSIONS.CHART_HEIGHT }}>
                                    <ChartTendencia
                                        data={datos.ventas.tendencia}
                                        color={configApp.colorVentas}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 
        =====================================
        SECCIÓN TRANSPORTE: Costos de Transporte
        =====================================
        Muestra KPIs, gráficos de tendencia y comparación
        de costos de transporte vs estibas pagas
      */}
                <SeccionTransporte
                    fechaInicio={fechaInicio}
                    fechaFin={fechaFin}
                    configApp={configApp}
                    pesoNetoTotal={datos?.ventas?.kpis?.pesoNetoTotal ?? 0}
                />

                {/* 
        =====================================
        SECCIÓN COMPRAS (Actualmente oculta)
        =====================================
        Se mostrará cuando SHOW_PURCHASES sea true
        Contiene: KPIs, Proveedores, Productos y Tendencia
      */}
                {DASHBOARD_CONFIG.SHOW_PURCHASES && (
                    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                        <h2 className="text-xl font-bold mb-6 pb-3 border-b border-gray-100"
                            style={{ color: configApp.colorCompras }}>
                            📦 Compras
                        </h2>

                        {datos?.compras && (
                            <>
                                {/* KPIs: Métricas principales de compras */}
                                <div className="mb-6">
                                    <KPICards
                                        kpis={datos.compras.kpis}
                                        tipo="compras"
                                        color={configApp.colorCompras}
                                    />
                                </div>

                                {/* Grid: Proveedores y Productos más comprados */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6 items-start">
                                    {/* Top 10 Proveedores */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                            Top 10 Proveedores
                                        </h3>
                                        <div style={{ height: DIMENSIONS.CHART_HEIGHT_EXTENDED }}>
                                            <ChartProveedoresClientes
                                                data={datos.compras.proveedores}
                                                color={configApp.colorCompras}
                                                tipo="proveedores"
                                            />
                                        </div>
                                    </div>

                                    {/* Productos Más Comprados */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                            Productos Más Comprados
                                        </h3>
                                        <div style={{ height: DIMENSIONS.CHART_HEIGHT_EXTENDED }}>
                                            <ChartProductos
                                                data={datos.compras.productos}
                                                color={configApp.colorCompras}
                                                tipo="compras"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tendencia de Compras */}
                                <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
                                        Tendencia de Compras
                                    </h3>
                                    <div style={{ height: DIMENSIONS.CHART_HEIGHT_LARGE }}>
                                        <ChartTendencia
                                            data={datos.compras.tendencia}
                                            color={configApp.colorCompras}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <EnviarReporteDashboardModal
                visible={modalReporteAbierto}
                onCerrar={() => setModalReporteAbierto(false)}
                dashboardRef={dashboardRef}
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
            />
        </>
    );
};

export default DashboardDibufala;