// src/components/facturacion/FacturacionMain.jsx
import React, { useState, useEffect } from "react";
import FiltrosFecha from './FiltrosFecha';
import ListaPedidos from './ListaPedidos';
import ConfiguracionFactura from './ConfiguracionFactura';
import ListaFacturasGeneradas from './ListaFacturasGeneradas';
import ModalDocumentosDespacho from './ModalDocumentosDespacho';
import DashboardDocumentosDespacho from './DashboardDocumentosDespacho';
import { getDatosSelect } from '../../services/pedidosService';
import { crearPlanilla } from '../../services/planillasService';
import Swal from 'sweetalert2';

export default function FacturacionMain() {
    const [pestañaActiva, setPestañaActiva] = useState("crear");
    const [tipoPedido, setTipoPedido] = useState("normal");

    // Estados
    const [datosSelect, setDatosSelect] = useState({
        agencias: [],
        aerolineas: [],
        consignatarios: [],
        conductores: []
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
        observaciones: "",
        tipoPedido: "normal"
    });
    const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);

    // Estados para configuración de documentos - ACTUALIZADOS
    const [modalConfiguracionAbierto, setModalConfiguracionAbierto] = useState(false);
    const [configuracionDocumentos, setConfiguracionDocumentos] = useState({
        conductor: null,
        ayudante: null,
        precintoSeguridad: '',
        placaVehiculo: 'VAK076',
        descripcionVehiculo: 'MITSUBISHI FUSO BLANCA'
    });
    const [pasoDocumentos, setPasoDocumentos] = useState('configuracion'); // 'configuracion' | 'dashboard'
    const [planillaCreada, setPlanillaCreada] = useState(null);

    // Datos para pestaña CONSULTAR
    const [facturasExistentes] = useState([
        {
            id: 1,
            numero: "FACT-2024-001",
            fecha: "2024-01-15",
            cliente: "Cliente A & B",
            valorTotal: 4300000,
            estado: "Generada",
            documentos: ["Carta Aerolínea", "Carta Policía"],
            tipo: "normal"
        },
        {
            id: 2,
            numero: "FACT-2024-002",
            fecha: "2024-01-16",
            cliente: "Cliente C",
            valorTotal: 4200000,
            estado: "Generada",
            documentos: ["Reporte Despacho"],
            tipo: "normal"
        },
        {
            id: 3,
            numero: "SMP-FACT-2024-001",
            fecha: "2024-01-17",
            cliente: "Cliente Sample",
            valorTotal: 1500000,
            estado: "Generada",
            documentos: ["Carta Aerolínea"],
            tipo: "sample"
        }
    ]);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            setLoadingDatos(true);
            try {
                const datos = await getDatosSelect();
                if (datos) {
                    console.log('📦 Datos cargados desde API:', datos);
                    setDatosSelect({
                        agencias: datos.agencias || [],
                        aerolineas: datos.aerolineas || [],
                        consignatarios: datos.consignatarios || [
                            { Id_Consignatario: 1, Nombre: 'Consignatario Principal' }
                        ],
                        conductores: datos.conductores || []
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

    // Sincronizar tipoPedido en configFactura
    useEffect(() => {
        setConfigFactura(prev => ({
            ...prev,
            tipoPedido: tipoPedido
        }));
    }, [tipoPedido]);

    // Limpiar selecciones cuando cambie el tipo de pedido
    useEffect(() => {
        console.log(`🔄 Cambiando a pedidos: ${tipoPedido}`);
        setPedidosSeleccionados([]);
        setMostrarPedidos(false);
        setConfigFactura(prev => ({
            ...prev,
            tipoPedido: tipoPedido,
            agenciaId: "",
            aerolineaId: "",
            guiaMaster: "",
            guiaHija: ""
        }));
        // Limpiar configuración de documentos
        setConfiguracionDocumentos({
            conductor: null,
            ayudante: null,
            precintoSeguridad: '',
            placaVehiculo: 'VAK076',
            descripcionVehiculo: 'MITSUBISHI FUSO BLANCA'
        });
        setPasoDocumentos('configuracion');
        setPlanillaCreada(null);
    }, [tipoPedido]);

    // Handlers
    const handleFacturasChange = (nuevasFacturasSeleccionadas) => {
        setFacturasSeleccionadas(nuevasFacturasSeleccionadas);
        // Si se cambian las facturas, volver al paso de configuración
        if (nuevasFacturasSeleccionadas.length === 0) {
            setPasoDocumentos('configuracion');
        }
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
            observaciones: "",
            tipoPedido: tipoPedido
        });
        setFacturasSeleccionadas([]);
        // Limpiar configuración de documentos
        setConfiguracionDocumentos({
            conductor: null,
            ayudante: null,
            precintoSeguridad: '',
            placaVehiculo: 'VAK076',
            descripcionVehiculo: 'MITSUBISHI FUSO BLANCA'
        });
        setPasoDocumentos('configuracion');
        setPlanillaCreada(null);
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

    // Handler para abrir modal de configuración
    const handleAbrirConfiguracionDocumentos = () => {
        if (facturasSeleccionadas.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Facturas requeridas',
                text: 'Por favor selecciona al menos una factura primero',
                confirmButtonColor: '#3085d6',
            });
            return;
        }
        setModalConfiguracionAbierto(true);
    };

    // Handler para guardar configuración de documentos - ACTUALIZADO
    const handleGuardarConfiguracion = async (configuracion) => {
        try {
            // EXTRAER IDs NUMÉRICOS DE LAS FACTURAS
            const facturasIds = facturasSeleccionadas.map(factura => {
                let numero = factura.numero;

                // Remover prefijos
                if (numero.startsWith('FEX-')) {
                    numero = numero.replace('FEX-', '');
                } else if (numero.startsWith('SMP-FEX-')) {
                    numero = numero.replace('SMP-FEX-', '');
                }

                const id = parseInt(numero);
                return isNaN(id) ? null : id;
            }).filter(id => id !== null);

            if (facturasIds.length === 0) {
                throw new Error("No se pudieron obtener los IDs válidos de las facturas");
            }

            // CREAR PLANILLA EN LA BASE DE DATOS
            const resultado = await crearPlanilla(
                facturasIds,
                configuracion,
                tipoPedido
            );

            if (!resultado.success) {
                throw new Error(resultado.message);
            }

            // 🔴 CORREGIDO: Asegurar que la planilla tenga la estructura correcta
            const planillaConEstructura = {
                ...resultado,
                Id_Planilla: resultado.idPlanilla || resultado.Id_Planilla, // Asegurar ambas propiedades
                idPlanilla: resultado.idPlanilla || resultado.Id_Planilla
            };

            setConfiguracionDocumentos(configuracion);
            setPlanillaCreada(planillaConEstructura); // 🔴 Usar la estructura corregida
            setPasoDocumentos('dashboard');            

            Swal.fire({
                icon: 'success',
                title: '¡Planilla Creada!',
                html: `
                        <div class="text-left">
                            <p><strong>N° Planilla:</strong> #${resultado.idPlanilla}</p>
                            <p><strong>Conductor:</strong> ${configuracion.conductor.nombre}</p>
                            <p><strong>Ayudante:</strong> ${configuracion.ayudante ? configuracion.ayudante.nombre : 'No asignado'}</p>
                            <p><strong>Vehículo:</strong> ${configuracion.placaVehiculo} - ${configuracion.descripcionVehiculo}</p>
                            <p><strong>Precinto:</strong> ${configuracion.precintoSeguridad}</p>
                            <p><strong>Facturas:</strong> ${resultado.facturas}</p>
                            <p><strong>Total Piezas:</strong> ${resultado.totalPiezas}</p>
                        </div>
                        <p class="mt-3 text-sm text-green-600">✅ Planilla #${resultado.idPlanilla} guardada correctamente</p>
                    `,
                confirmButtonColor: '#10b981',
            });

            setModalConfiguracionAbierto(false);

        } catch (error) {
            console.error('Error creando planilla:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo crear la planilla',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    // Handler para generar documento específico - ACTUALIZADO
    const handleGenerarDocumento = async (tipoDocumento, factura = null, configuracion) => {
        console.log('📄 Generando documento:', {
            tipo: tipoDocumento,
            factura: factura,
            configuracion: configuracion,
            planilla: planillaCreada
        });

        try {
            // Simular generación de documento
            await new Promise(resolve => setTimeout(resolve, 2000));

            let tituloDocumento = '';
            let detalles = '';

            switch (tipoDocumento) {
                case 'carta-aerolinea':
                    tituloDocumento = 'Carta para Aerolínea';
                    detalles = 'Incluye todas las facturas del despacho';
                    break;
                case 'carta-policia':
                    tituloDocumento = 'Carta para Policía';
                    detalles = 'Documento para autorización policial';
                    break;
                case 'plan-vallejo':
                    tituloDocumento = 'Plan Vallejo';
                    detalles = `Para factura: ${factura.numero}`;
                    break;
                case 'reporte-despacho':
                    tituloDocumento = 'Reporte de Despacho';
                    detalles = `Para factura: ${factura.numero} - Vehículo: ${configuracion.placaVehiculo}`;
                    break;
            }

            Swal.fire({
                icon: 'success',
                title: '¡Documento Generado!',
                html: `
                    <div class="text-left">
                        <p><strong>Documento:</strong> ${tituloDocumento}</p>
                        <p><strong>Detalles:</strong> ${detalles}</p>
                        <p><strong>Planilla:</strong> #${planillaCreada?.Id_Planilla}</p>
                        ${factura ? `<p><strong>Factura:</strong> ${factura.numero}</p>` : ''}
                    </div>
                    <p class="mt-3 text-sm text-green-600">✅ Documento descargado correctamente</p>
                `,
                confirmButtonColor: '#10b981',
            });

        } catch (error) {
            console.error('❌ Error generando documento:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el documento',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    // 🔴 NUEVO: Handler para reversar documentos
    const handleReversarDocumentos = async () => {
        try {
            // Simular eliminación de planilla (reemplazar con llamada real a la API)
            console.log('🗑️ Eliminando planilla:', planillaCreada?.Id_Planilla);

            // Limpiar estados
            setPlanillaCreada(null);
            setPasoDocumentos('configuracion');
            setConfiguracionDocumentos({
                conductor: null,
                ayudante: null,
                precintoSeguridad: '',
                placaVehiculo: 'VAK076',
                descripcionVehiculo: 'MITSUBISHI FUSO BLANCA'
            });

        } catch (error) {
            console.error('Error reversando documentos:', error);
            throw error;
        }
    };

    // Handler para cerrar modal
    const handleCerrarModalConfiguracion = () => {
        setModalConfiguracionAbierto(false);
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

                            {/* SELECTOR DE TIPO DE PEDIDO */}
                            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                                <div className="flex items-center mb-4">
                                    <div className="w-1 h-6 sm:h-8 bg-indigo-500 rounded-full mr-3"></div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Tipo de Pedido</h2>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setTipoPedido("normal")}
                                        className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm sm:text-base transition-all border-2 ${tipoPedido === "normal"
                                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-xl">📦</span>
                                            <div className="text-left">
                                                <div className="font-bold">Pedidos Normales</div>
                                                <div className="text-xs opacity-75">PED-012769</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTipoPedido("sample")}
                                        className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm sm:text-base transition-all border-2 ${tipoPedido === "sample"
                                            ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-xl">🔬</span>
                                            <div className="text-left">
                                                <div className="font-bold">Pedidos Sample</div>
                                                <div className="text-xs opacity-75">SMP-000010</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 text-center">
                                        Actualmente trabajando con: <strong>{tipoPedido === "normal" ? "Pedidos Normales" : "Pedidos Sample"}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* FILTROS */}
                            <FiltrosFecha
                                filtros={filtros}
                                onFiltroChange={handleFiltroChange}
                                onBuscar={handleBuscarPedidos}
                                tipoPedido={tipoPedido}
                            />

                            {/* LISTA DE PEDIDOS */}
                            {mostrarPedidos && (
                                <ListaPedidos
                                    filtros={filtros}
                                    pedidosSeleccionados={pedidosSeleccionados}
                                    onPedidosChange={handlePedidosChange}
                                    tipoPedido={tipoPedido}
                                    key={`${tipoPedido}-${filtros.fechaDesde}-${filtros.fechaHasta}`}
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
                                    observaciones: "",
                                    tipoPedido: tipoPedido
                                })}
                                onLimpiarPedidosSeleccionados={() => setPedidosSeleccionados([])}
                                onLimpiarTodo={limpiarTodoDespuesDeFactura}
                                tipoPedido={tipoPedido}
                            />

                            {/* FACTURAS GENERADAS */}
                            {mostrarPedidos && (
                                <ListaFacturasGeneradas
                                    filtros={filtros}
                                    facturasSeleccionadas={facturasSeleccionadas}
                                    onFacturasChange={handleFacturasChange}
                                    onSelectAllFacturas={() => { }}
                                    tipoPedido={tipoPedido}
                                    key={`facturas-${tipoPedido}-${filtros.fechaDesde}-${filtros.fechaHasta}`}
                                />
                            )}

                            {/* DOCUMENTOS DE DESPACHO - NUEVO FLUJO */}
                            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-1 h-6 sm:h-8 bg-red-500 rounded-full mr-3"></div>
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Documentos de Despacho</h2>
                                </div>

                                {/* INDICADOR DE PASOS */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-center space-x-4 mb-4">
                                        <div className={`flex items-center ${pasoDocumentos === 'configuracion' ? 'text-blue-600' : 'text-gray-400'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pasoDocumentos === 'configuracion' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                                                }`}>
                                                1
                                            </div>
                                            <span className="ml-2 font-medium">Configuración</span>
                                        </div>
                                        <div className="w-12 h-1 bg-gray-300"></div>
                                        <div className={`flex items-center ${pasoDocumentos === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pasoDocumentos === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                                                }`}>
                                                2
                                            </div>
                                            <span className="ml-2 font-medium">Documentos</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PASO 1: CONFIGURACIÓN */}
                                {pasoDocumentos === 'configuracion' && (
                                    <div className="space-y-6">
                                        {/* BOTÓN DE CONFIGURACIÓN */}
                                        <div className="p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 mb-1">Configuración de Despacho</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Configura conductor, ayudante, vehículo y precinto para generar documentos
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleAbrirConfiguracionDocumentos}
                                                    disabled={facturasSeleccionadas.length === 0}
                                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${facturasSeleccionadas.length > 0
                                                        ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    {facturasSeleccionadas.length === 0
                                                        ? "Selecciona Facturas"
                                                        : "⚙️ Configurar Despacho"
                                                    }
                                                </button>
                                            </div>
                                        </div>

                                        {facturasSeleccionadas.length === 0 && (
                                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <div className="flex items-center">
                                                    <div className="text-yellow-500 mr-2">💡</div>
                                                    <p className="text-yellow-700 text-sm">
                                                        Selecciona al menos una factura para configurar el despacho
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* PASO 2: DASHBOARD DE DOCUMENTOS */}
                                {pasoDocumentos === 'dashboard' && (
                                    <DashboardDocumentosDespacho
                                        planilla={planillaCreada}
                                        facturas={facturasSeleccionadas}
                                        configuracion={configuracionDocumentos}
                                        onClose={() => setPasoDocumentos('configuracion')}
                                        onGenerarDocumento={handleGenerarDocumento}
                                        onReversarDocumentos={handleReversarDocumentos}
                                    />
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

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tipo Factura
                                        </label>
                                        <select className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="">Todos los tipos</option>
                                            <option value="normal">Pedidos Normales</option>
                                            <option value="sample">Pedidos Sample</option>
                                        </select>
                                    </div>

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
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">15</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Facturas Totales</div>
                                </div>
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">10</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Facturas Normales</div>
                                </div>
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">5</div>
                                    <div className="text-xs sm:text-sm text-gray-600">Facturas Sample</div>
                                </div>
                                <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-200">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full mx-auto mb-1 sm:mb-2"></div>
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">$168M</div>
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
                                                <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Tipo</th>
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
                                                            <p className="text-xs text-gray-500 sm:hidden">
                                                                {factura.tipo === 'normal' ? '📦 Normal' : '🔬 Sample'} • {factura.fecha}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden sm:table-cell">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${factura.tipo === 'normal'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'}`}>
                                                            {factura.tipo === 'normal' ? '📦 Normal' : '🔬 Sample'}
                                                        </span>
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
                                        Mostrando {facturasExistentes.length} de 15 facturas
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
                                            tipoFactura: factura.tipo,
                                            estado: 'Generado'
                                        }))
                                    ).slice(0, 4).map((documento) => (
                                        <div key={documento.id} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${documento.tipoFactura === 'normal' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                                        }`}>
                                                        {documento.tipo.includes('Aerolínea') ? '✈️' :
                                                            documento.tipo.includes('Policía') ? '👮' :
                                                                documento.tipo.includes('Despacho') ? '📊' : '📄'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{documento.tipo}</p>
                                                        <p className="text-xs sm:text-sm text-gray-600">
                                                            Factura: {documento.factura} •
                                                            {documento.tipoFactura === 'normal' ? ' 📦 Normal' : ' 🔬 Sample'} •
                                                            {documento.fecha}
                                                        </p>
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
                                Ahora con soporte para Pedidos Normales y Pedidos Sample. Próximamente se completará la funcionalidad.
                            </p>
                        </div>
                    </div>
                </div>

                {/* MODAL DE CONFIGURACIÓN DE DOCUMENTOS */}
                <ModalDocumentosDespacho
                    isOpen={modalConfiguracionAbierto}
                    onClose={handleCerrarModalConfiguracion}
                    facturasSeleccionadas={facturasSeleccionadas}
                    onGuardarConfiguracion={handleGuardarConfiguracion}
                    conductores={datosSelect.conductores}
                />

            </div>
        </div>
    );
}