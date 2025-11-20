// src/components/facturacion/ModalDocumentosDespacho.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ModalDocumentosDespacho = ({
    isOpen,
    onClose,
    facturasSeleccionadas,
    onGuardarConfiguracion,
    conductores: conductoresProp,
}) => {
    const [conductores, setConductores] = useState([]);
    const [ayudantes, setAyudantes] = useState([]);
    const [conductorSeleccionado, setConductorSeleccionado] = useState('');
    const [ayudanteSeleccionado, setAyudanteSeleccionado] = useState('');
    const [precintoSeguridad, setPrecintoSeguridad] = useState('');
    const [placaVehiculo, setPlacaVehiculo] = useState('VAK076'); // 🔴 NUEVO: Valor por defecto
    const [descripcionVehiculo, setDescripcionVehiculo] = useState('MITSUBISHI FUSO BLANCA'); // 🔴 NUEVO: Valor por defecto
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);

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
                    id: `${conductor.id}A`, // IDs con sufijo para evitar conflictos
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
                        id: "sin-ayudante",
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

        setGuardandoConfiguracion(true);

        try {
            const conductor = conductores.find(c => c.id === conductorSeleccionado);
            const ayudante = ayudantes.find(a => a.id === ayudanteSeleccionado);

            const configuracion = {
                conductor: conductor,
                ayudante: ayudante && ayudante.id !== "sin-ayudante" ? ayudante : null,
                precintoSeguridad: precintoSeguridad,
                placaVehiculo: placaVehiculo, // 🔴 NUEVO
                descripcionVehiculo: descripcionVehiculo // 🔴 NUEVO
            };

            console.log('💾 Guardando configuración:', configuracion);

            // Llamar al handler del padre para guardar la configuración
            await onGuardarConfiguracion(configuracion);

            // Éxito
            Swal.fire({
                icon: 'success',
                title: '¡Configuración Guardada!',
                html: `
                    <div class="text-left">
                        <p><strong>Conductor:</strong> ${conductor.nombre}</p>
                        <p><strong>Ayudante:</strong> ${ayudante && ayudante.id !== "sin-ayudante" ? ayudante.nombre : 'No asignado'}</p>
                        <p><strong>Precinto:</strong> ${precintoSeguridad}</p>
                        <p><strong>Placa:</strong> ${placaVehiculo}</p>
                        <p><strong>Vehículo:</strong> ${descripcionVehiculo}</p>
                        <p><strong>Facturas:</strong> ${facturasSeleccionadas.length}</p>
                    </div>
                    <p class="mt-3 text-sm text-green-600">✅ Ahora puedes generar cualquier documento</p>
                `,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Aceptar'
            });

            // Limpiar y cerrar
            setConductorSeleccionado('');
            setAyudanteSeleccionado('');
            setPrecintoSeguridad('');
            onClose();

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

    // 🔴 NUEVO: Función para limpiar configuración
    const handleLimpiarConfiguracion = () => {
        setConductorSeleccionado('');
        setAyudanteSeleccionado('');
        setPrecintoSeguridad('');
        setPlacaVehiculo('VAK076'); // Restaurar valor por defecto
        setDescripcionVehiculo('MITSUBISHI FUSO BLANCA'); // Restaurar valor por defecto
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
                                        <p className="font-medium text-gray-900">{factura.numero}</p>
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
                                            {conductor.nombre} - {conductor.documento} - {conductor.placa}
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
                                            {ayudante.nombre} - {ayudante.documento}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* INFORMACIÓN DEL AYUDANTE SELECCIONADO */}
                        {ayudanteSeleccionado && ayudantes.find(a => a.id === ayudanteSeleccionado)?.nombre !== "Sin Ayudante" && (
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