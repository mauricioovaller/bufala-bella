// src/components/facturacion/ModalDocumentosDespacho.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getDocumentosChileItems } from '../../services/planillasService';

const ModalDocumentosDespacho = ({
    isOpen,
    onClose,
    facturasSeleccionadas,
    onGuardarConfiguracion,
    conductores: conductoresProp,
    esChile = false,
}) => {
    const [conductores, setConductores] = useState([]);
    const [ayudantes, setAyudantes] = useState([]);
    const [conductorSeleccionado, setConductorSeleccionado] = useState('');
    const [ayudanteSeleccionado, setAyudanteSeleccionado] = useState('');
    const [precintoSeguridad, setPrecintoSeguridad] = useState('');
    const [termografoNo, setTermografoNo] = useState('');
    const [placaVehiculo, setPlacaVehiculo] = useState('VAK076');
    const [descripcionVehiculo, setDescripcionVehiculo] = useState('MITSUBISHI FUSO BLANCA');
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
    const [documentosItems, setDocumentosItems] = useState({ mercancia: [], anexo: [] });
    const [mercanciaSeleccionada, setMercanciaSeleccionada] = useState([]);
    const [anexosSeleccionados, setAnexosSeleccionados] = useState([]);
    const [anexosDefault, setAnexosDefault] = useState([]);

    // Extrae el id numerico de la factura (ej. CHI-FEX-123 -> 123)
    const extraerIdFactura = (numero) => {
        if (!numero) return null;
        const n = String(numero).replace(/^(CHI-FEX-|SMP-FEX-|FEX-)/, '');
        const id = parseInt(n, 10);
        return isNaN(id) ? null : id;
    };

    // Datos mock de conductores (solo como respaldo)
    const conductoresMock = [
        {
            id: 1,
            nombre: "Juan Pérez García",
            documento: "12345678",
            telefono: "3001234567",
            tipoVehiculo: "Camión 3/4",
            placa: "ABC123"
        },
        {
            id: 2,
            nombre: "Carlos Rodríguez",
            documento: "87654321",
            telefono: "3007654321",
            tipoVehiculo: "Camión Turbo",
            placa: "DEF456"
        }
    ];

    // Cargar conductores y ayudantes
    useEffect(() => {
        if (isOpen) {
            cargarDatos();
        }
    }, [isOpen, conductoresProp]);

    const cargarDatos = async () => {
        setCargandoDatos(true);
        try {
            // 🔴 CORREGIDO: Usar las propiedades correctas del backend
            if (conductoresProp && conductoresProp.length > 0) {
                console.log('🚚 Conductores cargados desde props:', conductoresProp);

                // CORRECCIÓN: Usar Id_Conductor y Nombre (con mayúsculas)
                const conductoresConIds = conductoresProp.map((conductor, index) => ({
                    ...conductor,
                    id: conductor.Id_Conductor || (index + 1).toString(), // Usar Id_Conductor
                    // Mantener Nombre original y agregar nombre en minúscula para consistencia
                    nombre: conductor.Nombre || conductor.nombre || `Conductor ${index + 1}`,
                    documento: conductor.documento || `DOC${conductor.Id_Conductor || index + 1}`,
                    telefono: conductor.telefono || 'No disponible',
                    tipoVehiculo: conductor.tipoVehiculo || 'No especificado',
                    placa: conductor.placa || 'No especificado'
                }));

                setConductores(conductoresConIds);
                console.log('👥 Conductores procesados:', conductoresConIds);

                // Crear ayudantes a partir de los conductores
                const ayudantesFromConductores = conductoresConIds.map(conductor => ({
                    id: conductor.Id_Conductor || conductor.id, // IDs con sufijo para evitar conflictos
                    nombre: conductor.nombre,
                    documento: conductor.documento,
                    telefono: conductor.telefono,
                    tipoVehiculo: conductor.tipoVehiculo,
                    placa: conductor.placa
                }));

                // Agregar opción "Sin Ayudante"
                const opcionesAyudantes = [
                    ...ayudantesFromConductores,
                    {
                        id: "0",
                        Id_Conductor: "0",
                        nombre: "Sin Ayudante",
                        documento: "N/A",
                        telefono: "N/A",
                        tipoVehiculo: "N/A",
                        placa: "N/A"
                    }
                ];

                setAyudantes(opcionesAyudantes);
                console.log('👥 Ayudantes cargados:', opcionesAyudantes);

            } else {
                console.log('⚠️ No hay conductores disponibles desde props, usando datos mock');
                // Usar datos mock como respaldo
                setConductores(conductoresMock);

                const ayudantesFromConductores = conductoresMock.map(conductor => ({
                    id: `${conductor.id}A`,
                    nombre: conductor.nombre,
                    documento: conductor.documento,
                    telefono: conductor.telefono,
                    tipoVehiculo: conductor.tipoVehiculo,
                    placa: conductor.placa
                }));

                const opcionesAyudantes = [
                    ...ayudantesFromConductores,
                    {
                        id: "sin-ayudante",
                        nombre: "Sin Ayudante",
                        documento: "N/A",
                        telefono: "N/A",
                        tipoVehiculo: "N/A",
                        placa: "N/A"
                    }
                ];

                setAyudantes(opcionesAyudantes);
            }

            // Cargar items seleccionables para documentos Chile
            try {
                // SPEC 0002: para facturas Chile se pide la preseleccion por cliente
                // (mapeo configurable en BD) usando la primera factura del despacho.
                const idFacturaPreseleccion = esChile && facturasSeleccionadas.length > 0
                    ? extraerIdFactura(facturasSeleccionadas[0].numero)
                    : null;

                const itemsRes = await getDocumentosChileItems(idFacturaPreseleccion);
                if (itemsRes.success && itemsRes.items) {
                    setDocumentosItems(itemsRes.items);
                    // Por defecto seleccionar todos (mercancia) - sin cambios
                    const todasMercancia = itemsRes.items.mercancia?.map(i => i.id) || [];
                    const todosAnexos = itemsRes.items.anexo?.map(i => i.id) || [];
                    setMercanciaSeleccionada(todasMercancia);

                    // Anexos: en Chile la lista YA viene filtrada por el backend
                    // con los anexos del cliente (Spec 0002 v1.2); se preseleccionan
                    // esos y el usuario puede marcar/desmarcar dentro de la lista.
                    const idsAnexosVisibles = esChile
                        ? (itemsRes.items.anexo?.map(i => i.id) || [])
                        : todosAnexos;
                    setAnexosDefault(idsAnexosVisibles);
                    setAnexosSeleccionados(idsAnexosVisibles);
                }
            } catch (err) {
                console.warn('Error cargando items documentos Chile:', err);
            }

            setCargandoDatos(false);
        } catch (error) {
            console.error('Error cargando datos:', error);
            setCargandoDatos(false);
        }
    };

    // 🔴 DEBUG: Verificar estado actual
    useEffect(() => {
        if (isOpen) {
            console.log('🔍 DEBUG - Estado actual:');
            console.log('Conductores:', conductores);
            console.log('Ayudantes:', ayudantes);
            console.log('Conductor seleccionado:', conductorSeleccionado);
            console.log('Ayudante seleccionado:', ayudanteSeleccionado);
        }
    }, [conductores, ayudantes, conductorSeleccionado, ayudanteSeleccionado, isOpen]);

    const handleGuardarConfiguracion = async () => {
        if (!conductorSeleccionado) {
            Swal.fire({
                icon: 'warning',
                title: 'Conductor requerido',
                text: 'Por favor selecciona un conductor',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        // 🔴 NUEVA VALIDACIÓN: Conductor y Ayudante no pueden ser la misma persona
        if (ayudanteSeleccionado && ayudanteSeleccionado !== "0") {
            const conductor = conductores.find(c => c.id === conductorSeleccionado);
            const ayudante = ayudantes.find(a => a.id === ayudanteSeleccionado);

            if (conductor && ayudante && conductor.nombre === ayudante.nombre) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Selección inválida',
                    text: 'El conductor y el ayudante no pueden ser la misma persona',
                    confirmButtonColor: '#3085d6',
                });
                return;
            }
        }

        if (!precintoSeguridad) {
            Swal.fire({
                icon: 'warning',
                title: 'Precinto requerido',
                text: 'Por favor ingresa el número de precinto de seguridad',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        if (!placaVehiculo) {
            Swal.fire({
                icon: 'warning',
                title: 'Placa requerida',
                text: 'Por favor ingresa la placa del vehículo',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        if (mercanciaSeleccionada.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Mercancía requerida',
                text: 'Debes seleccionar al menos un producto (Queso Mozzarella o Yogurt) para las cartas.',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        setGuardandoConfiguracion(true);

        try {
            const conductor = conductores.find(c => c.id === conductorSeleccionado);
            const ayudante = ayudantes.find(a => a.id === ayudanteSeleccionado);

            const configuracion = {
                conductor: conductor,
                ayudante: ayudante && ayudante.id !== "0" ? ayudante : null,
                precintoSeguridad: precintoSeguridad,
                termografoNo: termografoNo,
                placaVehiculo: placaVehiculo,
                descripcionVehiculo: descripcionVehiculo,
                mercanciaSeleccionada: mercanciaSeleccionada,
                anexosSeleccionados: anexosSeleccionados
            };

            console.log('💾 Guardando configuración:', configuracion);

            // Llamar al handler del padre para guardar la configuración
            await onGuardarConfiguracion(configuracion);

            // Limpiar y cerrar
            setConductorSeleccionado('');
            setAyudanteSeleccionado('');
            setPrecintoSeguridad('');
            setTermografoNo('');
            

        } catch (error) {
            console.error('Error guardando configuración:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar la configuración. Por favor intenta nuevamente.',
                confirmButtonColor: '#ef4444',
            });
        } finally {
            setGuardandoConfiguracion(false);
        }
    };

    const toggleMercanciaItem = (id) => {
        setMercanciaSeleccionada(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAnexoItem = (id) => {
        setAnexosSeleccionados(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleLimpiarConfiguracion = () => {
        setConductorSeleccionado('');
        setAyudanteSeleccionado('');
        setPrecintoSeguridad('');
        setTermografoNo('');
        setPlacaVehiculo('VAK076');
        setDescripcionVehiculo('MITSUBISHI FUSO BLANCA');
        const todasMercancia = documentosItems.mercancia?.map(i => i.id) || [];
        const todosAnexos = documentosItems.anexo?.map(i => i.id) || [];
        setMercanciaSeleccionada(todasMercancia);
        // SPEC 0002: al limpiar en Chile se vuelve a la preseleccion del cliente
        setAnexosSeleccionados(esChile ? anexosDefault : todosAnexos);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🚚</span>
                            <div>
                                <h2 className="text-xl font-bold">
                                    Configuración de Despacho
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    Configura la información del conductor, ayudante y vehículo
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* CONTENIDO */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {/* RESUMEN FACTURAS */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-3">Facturas Seleccionadas</h3>
                        <div className="space-y-2">
                            {facturasSeleccionadas.map((factura, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{factura.numero.replace(/^CHI-FEX-/, 'FEX-')}</p>
                                        <p className="text-sm text-gray-600">{factura.cliente}</p>
                                    </div>
                                    <p className="font-semibold text-gray-700">
                                        ${factura.valorTotal?.toLocaleString('es-CO')}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Total: <strong>{facturasSeleccionadas.length}</strong> facturas seleccionadas
                            </p>
                        </div>
                    </div>

                    {/* INFORMACIÓN DEL CONDUCTOR */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Información del Conductor</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Conductor *
                            </label>
                            {cargandoDatos ? (
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                    <span>Cargando conductores...</span>
                                </div>
                            ) : (
                                <select
                                    value={conductorSeleccionado}
                                    onChange={(e) => setConductorSeleccionado(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardandoConfiguracion}
                                >
                                    <option value="">Seleccionar conductor</option>
                                    {conductores.map((conductor) => (
                                        <option key={conductor.id} value={conductor.id}>
                                            {conductor.nombre}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* INFORMACIÓN DEL CONDUCTOR SELECCIONADO */}
                        {conductorSeleccionado && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-800 mb-3">Información del Conductor</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-blue-600">Nombre</p>
                                        <p className="font-medium text-blue-900">
                                            {conductores.find(c => c.id === conductorSeleccionado)?.nombre}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600">Documento</p>
                                        <p className="font-medium text-blue-900">
                                            {conductores.find(c => c.id === conductorSeleccionado)?.documento}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600">Teléfono</p>
                                        <p className="font-medium text-blue-900">
                                            {conductores.find(c => c.id === conductorSeleccionado)?.telefono}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-blue-600">Vehículo</p>
                                        <p className="font-medium text-blue-900">
                                            {conductores.find(c => c.id === conductorSeleccionado)?.tipoVehiculo}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* INFORMACIÓN DEL AYUDANTE */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Información del Ayudante</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ayudante (Opcional)
                            </label>
                            {cargandoDatos ? (
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                    <span>Cargando ayudantes...</span>
                                </div>
                            ) : (
                                <select
                                    value={ayudanteSeleccionado}
                                    onChange={(e) => setAyudanteSeleccionado(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardandoConfiguracion}
                                >
                                    <option value="">Seleccionar ayudante</option>
                                    {ayudantes.map((ayudante) => (
                                        <option key={ayudante.id} value={ayudante.id}>
                                            {ayudante.nombre}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* INFORMACIÓN DEL AYUDANTE SELECCIONADO */}
                        {ayudanteSeleccionado && ayudantes.find(a => a.id === ayudanteSeleccionado)?.nombre !== "0" && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-medium text-green-800 mb-3">Información del Ayudante</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-green-600">Nombre</p>
                                        <p className="font-medium text-green-900">
                                            {ayudantes.find(a => a.id === ayudanteSeleccionado)?.nombre}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-green-600">Documento</p>
                                        <p className="font-medium text-green-900">
                                            {ayudantes.find(a => a.id === ayudanteSeleccionado)?.documento}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-green-600">Teléfono</p>
                                        <p className="font-medium text-green-900">
                                            {ayudantes.find(a => a.id === ayudanteSeleccionado)?.telefono}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🔴 NUEVO: INFORMACIÓN DEL VEHÍCULO */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Información del Vehículo</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Placa del Vehículo *
                                </label>
                                <input
                                    type="text"
                                    value={placaVehiculo}
                                    onChange={(e) => setPlacaVehiculo(e.target.value.toUpperCase())}
                                    placeholder="Ingrese la placa del vehículo"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardandoConfiguracion}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Placa del vehículo de transporte
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descripción del Vehículo *
                                </label>
                                <input
                                    type="text"
                                    value={descripcionVehiculo}
                                    onChange={(e) => setDescripcionVehiculo(e.target.value)}
                                    placeholder="Ingrese la descripción del vehículo"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardandoConfiguracion}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Descripción del vehículo de transporte
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* PRECINTO DE SEGURIDAD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Precinto de Seguridad *
                        </label>
                        <input
                            type="text"
                            value={precintoSeguridad}
                            onChange={(e) => setPrecintoSeguridad(e.target.value)}
                            placeholder="Ingrese el número de precinto"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={guardandoConfiguracion}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Número único del precinto de seguridad del vehículo
                        </p>
                    </div>

                    {/* TERMÓGRAFO No. */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Termógrafo No.
                        </label>
                        <input
                            type="text"
                            value={termografoNo}
                            onChange={(e) => setTermografoNo(e.target.value)}
                            placeholder="Ej: QCHYN025J0"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={guardandoConfiguracion}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Número de serie del dispositivo termógrafo para control de temperatura
                        </p>
                    </div>

                    {/* MERCANCÍA PARA CARTAS */}
                    {documentosItems.mercancia?.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Descripción General de la Mercancía</h3>
                            <p className="text-xs text-gray-500 mb-3">Selecciona los productos que aparecerán en las Cartas (Aerolínea / Policía)</p>
                            <div className="space-y-2">
                                {documentosItems.mercancia.map(item => (
                                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={mercanciaSeleccionada.includes(item.id)}
                                            onChange={() => toggleMercanciaItem(item.id)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={guardandoConfiguracion}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{item.descripcionCorta}</p>
                                            <p className="text-xs text-gray-500">{item.texto}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {mercanciaSeleccionada.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">Selecciona al menos un producto</p>
                            )}
                        </div>
                    )}

                    {/* ANEXOS PARA AUTODECLARACIÓN */}
                    {documentosItems.anexo?.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Anexos - Autodeclaración Chile</h3>
                            <p className="text-xs text-gray-500 mb-3">Selecciona los anexos que aparecerán en la sección "Envase y etiquetado"</p>
                            {esChile && facturasSeleccionadas[0]?.cliente && (
                                <p className="text-xs text-blue-600 font-medium mb-2">
                                    Cliente del despacho: <strong>{facturasSeleccionadas[0].cliente}</strong>
                                </p>
                            )}
                            <div className="space-y-2">
                                {documentosItems.anexo.map(item => (
                                    <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={anexosSeleccionados.includes(item.id)}
                                            onChange={() => toggleAnexoItem(item.id)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={guardandoConfiguracion}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{item.descripcionCorta}</p>
                                            <p className="text-xs text-gray-500">{item.texto}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER - BOTONES */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between space-x-3">
                        <div className="flex space-x-3">
                            <button
                                onClick={handleLimpiarConfiguracion}
                                disabled={guardandoConfiguracion}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                            >
                                🧹 Limpiar
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                disabled={guardandoConfiguracion}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardarConfiguracion}
                                disabled={guardandoConfiguracion || !conductorSeleccionado || !precintoSeguridad || !placaVehiculo}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {guardandoConfiguracion ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💾 Guardar Configuración</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalDocumentosDespacho;