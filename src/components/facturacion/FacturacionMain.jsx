// src/components/facturacion/FacturacionMain.jsx
import React, { useState, useEffect } from "react";
import FiltrosFecha from './FiltrosFecha';
import ListaPedidos from './ListaPedidos';
import ConfiguracionFactura from './ConfiguracionFactura';
import ListaFacturasGeneradas from './ListaFacturasGeneradas';
import { getDatosSelect } from '../../services/pedidosService';

export default function FacturacionMain() {
    const [pestañaActiva, setPestañaActiva] = useState("crear");

    // Estados
    const [datosSelect, setDatosSelect] = useState({
        agencias: [],
        aerolineas: [],
        consignatarios: []
    });
    const [loadingDatos, setLoadingDatos] = useState(false);
    const [filtros, setFiltros] = useState({
        fechaDesde: "",
        fechaHasta: ""
    });
    const [mostrarPedidos, setMostrarPedidos] = useState(false);
    const [pedidosSeleccionados, setPedidosSeleccionados] = useState([]);
    const [configFactura, setConfigFactura] = useState({
        numeroFactura: "",
        fechaFactura: new Date().toISOString().split('T')[0],
        consignatarioId: "",
        agenciaId: "",
        aerolineaId: "",
        guiaMaster: "",
        guiaHija: "",
        observaciones: ""
    });
    const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);

    // Datos para pestaña CONSULTAR
    const [facturasExistentes] = useState([
        {
            id: 1,
            numero: "FACT-2024-001",
            fecha: "2024-01-15",
            cliente: "Cliente A & B",
            valorTotal: 4300000,
            estado: "Generada",
            documentos: ["Carta Aerolínea", "Carta Policía"]
        },
        {
            id: 2,
            numero: "FACT-2024-002",
            fecha: "2024-01-16",
            cliente: "Cliente C",
            valorTotal: 4200000,
            estado: "Generada",
            documentos: ["Reporte Despacho"]
        },
        {
            id: 3,
            numero: "FACT-2023-125",
            fecha: "2023-12-28",
            cliente: "Cliente D",
            valorTotal: 3100000,
            estado: "Cerrada",
            documentos: ["Todos los documentos"]
        }
    ]);

    const documentos = [
        {
            id: "carta-aerolinea",
            titulo: "Carta para Aerolínea",
            descripcion: "Documento requerido para el despacho aéreo",
            icono: "✈️",
            color: "bg-blue-500 hover:bg-blue-600",
            disponible: true
        },
        {
            id: "carta-policia",
            titulo: "Carta para Policía",
            descripcion: "Documento para autorización de la policía",
            icono: "👮",
            color: "bg-green-500 hover:bg-green-600",
            disponible: true
        },
        {
            id: "reporte-despacho",
            titulo: "Reporte de Despacho",
            descripcion: "Consolidado completo del despacho",
            icono: "📊",
            color: "bg-orange-500 hover:bg-orange-600",
            disponible: true
        },
        {
            id: "documentos-adicionales",
            titulo: "Documentos Adicionales",
            descripcion: "Otros formatos y documentos requeridos",
            icono: "📄",
            color: "bg-purple-500 hover:bg-purple-600",
            disponible: true
        }
    ];

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            setLoadingDatos(true);
            try {
                const datos = await getDatosSelect();
                if (datos) {
                    setDatosSelect({
                        agencias: datos.agencias || [],
                        aerolineas: datos.aerolineas || [],
                        consignatarios: datos.consignatarios || [
                            { Id_Consignatario: 1, Nombre: 'Consignatario Principal' }
                        ]
                    });
                }
            } catch (error) {
                console.error('Error cargando datos select:', error);
            } finally {
                setLoadingDatos(false);
            }
        };

        cargarDatosIniciales();
    }, []);

    // Handlers
    const handleFacturasChange = (nuevasFacturasSeleccionadas) => {
        setFacturasSeleccionadas(nuevasFacturasSeleccionadas);
    };

    const limpiarTodoDespuesDeFactura = () => {
        console.log('🧹 Limpiando todo después de generar factura...');
        setPedidosSeleccionados([]);
        setMostrarPedidos(false);
        setConfigFactura({
            numeroFactura: "",
            fechaFactura: new Date().toISOString().split('T')[0],
            consignatarioId: "",
            agenciaId: "",
            aerolineaId: "",
            guiaMaster: "",
            guiaHija: "",
            observaciones: ""
        });
        setFacturasSeleccionadas([]);
    };

    const handlePedidosChange = (nuevosPedidosSeleccionados) => {
        setPedidosSeleccionados(nuevosPedidosSeleccionados);
    };

    const handleBuscarPedidos = () => {
        if (filtros.fechaDesde && filtros.fechaHasta) {
            setMostrarPedidos(true);
        } else {
            console.log('⚠️ Fechas no seleccionadas');
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

                {/* HEADER PRINCIPAL */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl text-white">🧾</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Facturación y Documentos
                    </h1>
                    <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                        Genera y consulta facturas y documentos de despacho
                    </p>
                </div>

                {/* PESTAÑAS PRINCIPALES */}
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
                    <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setPestañaActiva("crear")}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all ${pestañaActiva === "crear"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            🧾 Crear Facturas
                        </button>
                        <button
                            onClick={() => setPestañaActiva("consultar")}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all ${pestañaActiva === "consultar"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            📋 Consultar Existente
                        </button>
                    </div>

                    {/* CONTENIDO PESTAÑA CREAR */}
                    {pestañaActiva === "crear" && (
                        <div className="space-y-6 sm:space-y-8">
                            {/* FILTROS */}
                            <FiltrosFecha
                                filtros={filtros}
                                onFiltroChange={handleFiltroChange}
                                onBuscar={handleBuscarPedidos}
                            />

                            {/* LISTA DE PEDIDOS */}
                            {mostrarPedidos && (
                                <ListaPedidos
                                    filtros={filtros}
                                    pedidosSeleccionados={pedidosSeleccionados}
                                    onPedidosChange={handlePedidosChange}
                                    key={filtros.fechaDesde + filtros.fechaHasta}
                                />
                            )}

                            {/* CONFIGURACIÓN DE FACTURA */}
                            <ConfiguracionFactura
                                configFactura={configFactura}
                                onConfigChange={setConfigFactura}
                                pedidosSeleccionados={pedidosSeleccionados}
                                onGenerarFactura={() => { }}
                                datosSelect={datosSelect}
                                loadingDatos={loadingDatos}
                                onLimpiarConfiguracion={() => setConfigFactura({
                                    numeroFactura: "",
                                    fechaFactura: new Date().toISOString().split('T')[0],
                                    consignatarioId: "",
                                    agenciaId: "",
                                    aerolineaId: "",
                                    guiaMaster: "",
                                    guiaHija: "",
                                    observaciones: ""
                                })}
                                onLimpiarPedidosSeleccionados={() => setPedidosSeleccionados([])}
                                onLimpiarTodo={limpiarTodoDespuesDeFactura}
                            />

                            {/* FACTURAS GENERADAS - CON KEY PARA FORZAR REMOUNT */}
                            {mostrarPedidos && (
                                <ListaFacturasGeneradas
                                    filtros={filtros}
                                    facturasSeleccionadas={facturasSeleccionadas}
                                    onFacturasChange={handleFacturasChange}
                                    onSelectAllFacturas={() => { }}
                                    key={`facturas-${filtros.fechaDesde}-${filtros.fechaHasta}`}
                                />
                            )}

                            {/* DOCUMENTOS DE DESPACHO */}
                            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-1 h-6 sm:h-8 bg-red-500 rounded-full mr-3"></div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Documentos de Despacho</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {documentos.map((documento) => (
                                        <div
                                            key={documento.id}
                                            className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-md hover:border-gray-300"
                                        >
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-sm sm:text-lg ${documento.color}`}>
                                                    {documento.icono}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                                                            {documento.titulo}
                                                        </h3>
                                                        {!documento.disponible && (
                                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                                                Próximamente
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
                                                        {documento.descripcion}
                                                    </p>

                                                    <button
                                                        disabled={!documento.disponible || facturasSeleccionadas.length === 0}
                                                        className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all ${documento.disponible && facturasSeleccionadas.length > 0
                                                            ? `${documento.color} text-white shadow-sm hover:shadow-md`
                                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            }`}
                                                    >
                                                        {facturasSeleccionadas.length === 0 ? "Selecciona Facturas" : "Generar Documento"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {facturasSeleccionadas.length === 0 && (
                                    <div className="mt-4 p-3 sm:p-4 bg-yellow-50 rounded-lg sm:rounded-xl border border-yellow-200">
                                        <div className="flex items-center">
                                            <div className="text-yellow-500 mr-2 text-sm">💡</div>
                                            <p className="text-yellow-700 text-xs sm:text-sm">
                                                Selecciona al menos una factura para generar documentos de despacho
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CONTENIDO PESTAÑA CONSULTAR */}
                    {pestañaActiva === "consultar" && (
                        <div className="space-y-6 sm:space-y-8">
                            {/* FILTROS DE CONSULTA */}
                            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center mb-4">
                                    <div className="w-1 h-6 sm:h-8 bg-blue-500 rounded-full mr-3"></div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Filtros de Búsqueda</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Fecha Desde
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Fecha Hasta
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            N° Factura
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: FACT-2024-001"
                                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 opacity-0 sm:opacity-100">
                                            Buscar
                                        </label>
                                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl transition-all shadow-sm hover:shadow-md text-sm sm:text-base">
                                            🔍 Buscar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RESUMEN ESTADÍSTICO */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">12</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Facturas Totales</div>
                                </div>
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">8</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Facturas Activas</div>
                                </div>
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">45</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Documentos Gen.</div>
                                </div>
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">$156M</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Valor Total</div>
                                </div>
                            </div>

                            {/* LISTA DE FACTURAS EXISTENTES */}
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-1 h-6 sm:h-8 bg-green-500 rounded-full mr-3"></div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Facturas Existentes</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Factura</th>
                                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Fecha</th>
                                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Cliente</th>
                                                <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell">Valor</th>
                                                <th className="text-center py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {facturasExistentes.map((factura) => (
                                                <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{factura.numero}</p>
                                                            <p className="text-xs text-gray-500 sm:hidden">{factura.fecha}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden sm:table-cell">
                                                        {factura.fecha}
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <p className="text-sm text-gray-900">{factura.cliente}</p>
                                                        <p className="text-xs text-gray-500">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${factura.estado === 'Generada' ? 'bg-green-100 text-green-800' :
                                                                factura.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {factura.estado}
                                                            </span>
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-900 text-right hidden md:table-cell">
                                                        ${factura.valorTotal.toLocaleString('es-CO')}
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <div className="flex justify-center space-x-1 sm:space-x-2">
                                                            <button className="text-blue-600 hover:text-blue-800 p-1 sm:p-2 rounded-lg hover:bg-blue-50 transition-all text-xs sm:text-sm">
                                                                👁️ Ver
                                                            </button>
                                                            <button className="text-green-600 hover:text-green-800 p-1 sm:p-2 rounded-lg hover:bg-green-50 transition-all text-xs sm:text-sm">
                                                                📄 Docs
                                                            </button>
                                                            <button className="text-purple-600 hover:text-purple-800 p-1 sm:p-2 rounded-lg hover:bg-purple-50 transition-all text-xs sm:text-sm hidden sm:inline-block">
                                                                🔄 Regenerar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* PAGINACIÓN */}
                                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 sm:pt-6 border-t border-gray-200 gap-3 sm:gap-0">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Mostrando 3 de 12 facturas
                                    </p>
                                    <div className="flex space-x-1">
                                        <button className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                                            Anterior
                                        </button>
                                        <button className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-500 text-white rounded-lg shadow-sm">
                                            1
                                        </button>
                                        <button className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                                            2
                                        </button>
                                        <button className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DOCUMENTOS GENERADOS */}
                            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-1 h-6 sm:h-8 bg-purple-500 rounded-full mr-3"></div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Documentos Generados</h2>
                                </div>

                                <div className="space-y-3">
                                    {facturasExistentes.flatMap(factura =>
                                        factura.documentos.map((doc, index) => ({
                                            id: `${factura.id}-${index}`,
                                            factura: factura.numero,
                                            tipo: doc,
                                            fecha: factura.fecha,
                                            estado: 'Generado'
                                        }))
                                    ).slice(0, 4).map((documento) => (
                                        <div key={documento.id} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600">
                                                        {documento.tipo.includes('Aerolínea') ? '✈️' :
                                                            documento.tipo.includes('Policía') ? '👮' :
                                                                documento.tipo.includes('Despacho') ? '📊' : '📄'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{documento.tipo}</p>
                                                        <p className="text-xs sm:text-sm text-gray-600">Factura: {documento.factura} • {documento.fecha}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    <button className="text-blue-600 hover:text-blue-800 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                                                        👁️ Ver
                                                    </button>
                                                    <button className="text-green-600 hover:text-green-800 px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-50 hover:bg-green-100 rounded-lg transition-all">
                                                        ⬇️ Descargar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-center pt-4">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                                        📋 Ver todos los documentos →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MENSAJE INFORMATIVO */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center">
                        <div className="text-blue-500 mr-3 text-xl">💡</div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-1">Módulo en Desarrollo</h3>
                            <p className="text-blue-700 text-sm sm:text-base">
                                El diseño con pestañas está implementado. Próximamente se completará la funcionalidad.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}