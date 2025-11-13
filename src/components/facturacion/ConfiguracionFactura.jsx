// src/components/facturacion/ConfiguracionFactura.jsx
import React, { useState, useEffect } from 'react';
import { guardarFactura } from '../../services/facturacionService';
import Swal from 'sweetalert2';

const ConfiguracionFactura = ({
    configFactura,
    onConfigChange,
    pedidosSeleccionados,
    onGenerarFactura,
    datosSelect,
    loadingDatos,
    onLimpiarConfiguracion,
    onLimpiarPedidosSeleccionados,
    onLimpiarTodo // 🔴 NUEVA PROP PARA LIMPIAR TODO
}) => {
    const [alertas, setAlertas] = useState([]);
    const [guardando, setGuardando] = useState(false);

    // ✅ Función para autocompletar campos desde pedidos
    useEffect(() => {
        if (pedidosSeleccionados.length > 0) {
            console.log('🔄 Autocompletando desde pedidos seleccionados:', pedidosSeleccionados);
            
            const nuevosConfig = { ...configFactura };
            let hayCambios = false;
            const nuevasAlertas = [];

            // Recopilar todos los valores diferentes
            const agencias = new Set();
            const aerolineas = new Set();
            const guiasMaster = new Set();
            const guiasHija = new Set();

            pedidosSeleccionados.forEach(pedido => {
                if (pedido.idAgencia) agencias.add(pedido.idAgencia);
                if (pedido.idAerolinea) aerolineas.add(pedido.idAerolinea);
                if (pedido.guiaMaster) guiasMaster.add(pedido.guiaMaster);
                if (pedido.guiaHija) guiasHija.add(pedido.guiaHija);
            });

            // Verificar si hay diferencias
            if (agencias.size > 1) {
                nuevasAlertas.push({
                    tipo: 'warning',
                    mensaje: `Se encontraron ${agencias.size} agencias diferentes. Se usará la primera.`
                });
            }

            if (aerolineas.size > 1) {
                nuevasAlertas.push({
                    tipo: 'warning', 
                    mensaje: `Se encontraron ${aerolineas.size} aerolíneas diferentes. Se usará la primera.`
                });
            }

            if (guiasMaster.size > 1) {
                nuevasAlertas.push({
                    tipo: 'warning',
                    mensaje: `Se encontraron ${guiasMaster.size} guías master diferentes. Se usará la primera.`
                });
            }

            if (guiasHija.size > 1) {
                nuevasAlertas.push({
                    tipo: 'warning',
                    mensaje: `Se encontraron ${guiasHija.size} guías hija diferentes. Se usará la primera.`
                });
            }

            setAlertas(nuevasAlertas);

            // Tomar el primer pedido con datos para autocompletar
            const primerPedido = pedidosSeleccionados[0];

            if (primerPedido) {
                // Solo autocompletar si los campos están vacíos
                if (!configFactura.agenciaId && primerPedido.idAgencia) {
                    nuevosConfig.agenciaId = primerPedido.idAgencia.toString();
                    hayCambios = true;
                    console.log('✅ Autocompletado agencia:', primerPedido.idAgencia);
                }
                
                if (!configFactura.aerolineaId && primerPedido.idAerolinea) {
                    nuevosConfig.aerolineaId = primerPedido.idAerolinea.toString();
                    hayCambios = true;
                    console.log('✅ Autocompletado aerolinea:', primerPedido.idAerolinea);
                }
                
                if (!configFactura.guiaMaster && primerPedido.guiaMaster) {
                    nuevosConfig.guiaMaster = primerPedido.guiaMaster;
                    hayCambios = true;
                    console.log('✅ Autocompletado guiaMaster:', primerPedido.guiaMaster);
                }
                
                if (!configFactura.guiaHija && primerPedido.guiaHija) {
                    nuevosConfig.guiaHija = primerPedido.guiaHija;
                    hayCambios = true;
                    console.log('✅ Autocompletado guiaHija:', primerPedido.guiaHija);
                }

                if (hayCambios) {
                    console.log('🎯 Configuración actualizada:', nuevosConfig);
                    onConfigChange(nuevosConfig);
                }
            }
        }
    }, [pedidosSeleccionados]);

    // 🔴 FUNCIÓN COMPLETAMENTE ACTUALIZADA CON LIMPIEZA TOTAL
    const handleGenerarFactura = async () => {
        if (guardando) return; // Evitar múltiples clics
        
        // Validaciones básicas
        if (pedidosSeleccionados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Pedidos requeridos',
                text: 'Por favor selecciona al menos un pedido',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        if (!configFactura.numeroFactura || !configFactura.fechaFactura || !configFactura.consignatarioId) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obligatorios',
                text: 'Por favor completa todos los campos obligatorios (*)',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        // 🔴 CONFIRMACIÓN CON SWEETALERT2
        const confirmacion = await Swal.fire({
            title: '¿Generar Factura?',
            html: `
                <p>Vas a generar la factura <strong>${configFactura.numeroFactura}</strong></p>
                <p><strong>${pedidosSeleccionados.length}</strong> pedidos seleccionados</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, generar factura',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        setGuardando(true);

        try {
            // Preparar datos para enviar al backend
            const datosFactura = {
                encabezado: {
                    numeroFactura: configFactura.numeroFactura,
                    fechaFactura: configFactura.fechaFactura,
                    consignatarioId: configFactura.consignatarioId,
                    agenciaId: configFactura.agenciaId,
                    aerolineaId: configFactura.aerolineaId,
                    guiaMaster: configFactura.guiaMaster,
                    guiaHija: configFactura.guiaHija,
                    observaciones: configFactura.observaciones || ''
                },
                pedidosIds: pedidosSeleccionados.map(pedido => pedido.id)
            };

            console.log('📤 Enviando datos al backend:', datosFactura);

            // Llamar al servicio
            const resultado = await guardarFactura(datosFactura.encabezado, datosFactura.pedidosIds);

            if (resultado.success) {
                // 🔴 ÉXITO CON SWEETALERT2 Y LIMPIEZA COMPLETA
                await Swal.fire({
                    icon: 'success',
                    title: '¡Factura Generada!',
                    html: `
                        <div class="text-left">
                            <p><strong>Número:</strong> ${resultado.numeroFactura}</p>
                            <p><strong>Items:</strong> ${resultado.cantidadItems}</p>
                            <p><strong>Estibas:</strong> ${resultado.cantidadEstibas}</p>
                            <p><strong>Pedidos actualizados:</strong> ${resultado.pedidosActualizados}</p>
                        </div>
                    `,
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'Aceptar'
                });

                console.log('Factura generada:', resultado);

                // 🔴 LIMPIEZA COMPLETA DESPUÉS DE GENERAR FACTURA
                if (onLimpiarTodo) {
                    onLimpiarTodo();
                } else {
                    // Fallback si onLimpiarTodo no está disponible
                    if (onLimpiarConfiguracion) onLimpiarConfiguracion();
                    if (onLimpiarPedidosSeleccionados) onLimpiarPedidosSeleccionados();
                }

                console.log('✅ Formulario, selecciones y pedidos limpiados automáticamente');
                
            } else {
                // 🔴 ERROR CON SWEETALERT2
                Swal.fire({
                    icon: 'error',
                    title: 'Error al generar factura',
                    text: resultado.message || 'Ocurrió un error inesperado',
                    confirmButtonColor: '#ef4444',
                });
            }

        } catch (error) {
            console.error('Error al guardar factura:', error);
            
            // 🔴 ERROR DE CONEXIÓN CON SWEETALERT2
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Por favor intenta nuevamente.',
                confirmButtonColor: '#ef4444',
            });
        } finally {
            setGuardando(false);
        }
    };

    // Mantener tu función handleInputChange existente
    const handleInputChange = (campo, valor) => {
        onConfigChange({
            ...configFactura,
            [campo]: valor
        });
    };

    if (loadingDatos) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-1 h-6 sm:h-8 bg-purple-500 rounded-full mr-3"></div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Configuración de Factura
                </h2>
            </div>

            {/* ✅ Alertas de validación */}
            {alertas.length > 0 && (
                <div className="mb-6 space-y-3">
                    {alertas.map((alerta, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                                alerta.tipo === 'warning' 
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                        >
                            <div className="flex items-start">
                                <span className="mr-2 text-lg">
                                    {alerta.tipo === 'warning' ? '⚠️' : '💡'}
                                </span>
                                <div>
                                    <p className="font-medium">
                                        {alerta.tipo === 'warning' ? 'Validación Requerida' : 'Información'}
                                    </p>
                                    <p className="text-sm mt-1">{alerta.mensaje}</p>
                                    <p className="text-xs mt-2 font-medium">
                                        Por favor verifique que estos datos correspondan al despacho.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ Mensaje de autocompletado exitoso */}
            {pedidosSeleccionados.length > 0 && alertas.length === 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                        <span className="text-green-500 mr-2">✅</span>
                        <p className="text-green-700 text-sm">
                            Los campos se han autocompletado con los datos de los pedidos seleccionados
                        </p>
                    </div>
                </div>
            )}

            {/* 🔴 NUEVO: Estado de guardado */}
            {guardando && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <p className="text-blue-700 text-sm">
                            Guardando factura, por favor espere...
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                
                {/* COLUMNA 1 - INFORMACIÓN BÁSICA */}
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                        Información Básica
                    </h3>

                    {/* Número de Factura */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Factura *
                        </label>
                        <input
                            type="text"
                            value={configFactura.numeroFactura || ''}
                            onChange={(e) => handleInputChange('numeroFactura', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ej: FACT-2024-001"
                            required
                            disabled={guardando}
                        />
                    </div>

                    {/* Fecha de Factura */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Factura *
                        </label>
                        <input
                            type="date"
                            value={configFactura.fechaFactura || ''}
                            onChange={(e) => handleInputChange('fechaFactura', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                            disabled={guardando}
                        />
                    </div>
                </div>

                {/* COLUMNA 2 - CONSIGNATARIO */}
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                        Consignatario
                    </h3>

                    {/* Consignatario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Consignatario *
                        </label>
                        <select
                            value={configFactura.consignatarioId || ''}
                            onChange={(e) => handleInputChange('consignatarioId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                            disabled={guardando}
                        >
                            <option value="">Seleccionar consignatario</option>
                            {datosSelect.consignatarios.map((consignatario) => (
                                <option key={consignatario.Id_Consignatario} value={consignatario.Id_Consignatario}>
                                    {consignatario.Nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* COLUMNA 3 - AGENCIA Y AEROLÍNEA */}
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                        Transporte
                    </h3>

                    {/* Agencia */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Agencia
                        </label>
                        <select
                            value={configFactura.agenciaId || ''}
                            onChange={(e) => handleInputChange('agenciaId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={guardando}
                        >
                            <option value="">Seleccionar agencia</option>
                            {datosSelect.agencias.map((agencia) => (
                                <option key={agencia.IdAgencia} value={agencia.IdAgencia}>
                                    {agencia.Nombre}
                                </option>
                            ))}
                        </select>
                        {configFactura.agenciaId && (
                            <p className="text-xs text-green-600 mt-1">
                                ✅ Valor tomado de los pedidos
                            </p>
                        )}
                    </div>

                    {/* Aerolínea */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aerolínea
                        </label>
                        <select
                            value={configFactura.aerolineaId || ''}
                            onChange={(e) => handleInputChange('aerolineaId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={guardando}
                        >
                            <option value="">Seleccionar aerolínea</option>
                            {datosSelect.aerolineas.map((aerolinea) => (
                                <option key={aerolinea.IdAerolinea} value={aerolinea.IdAerolinea}>
                                    {aerolinea.Nombre}
                                </option>
                            ))}
                        </select>
                        {configFactura.aerolineaId && (
                            <p className="text-xs text-green-600 mt-1">
                                ✅ Valor tomado de los pedidos
                            </p>
                        )}
                    </div>
                </div>

                {/* COLUMNA 4 - GUÍAS */}
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                        Guías de Despacho
                    </h3>

                    {/* Número Guía Master */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            No. Guía (Master)
                        </label>
                        <input
                            type="text"
                            value={configFactura.guiaMaster || ''}
                            onChange={(e) => handleInputChange('guiaMaster', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Número de guía master"
                            disabled={guardando}
                        />
                        {configFactura.guiaMaster && (
                            <p className="text-xs text-green-600 mt-1">
                                ✅ Valor tomado de los pedidos
                            </p>
                        )}
                    </div>

                    {/* Guía Hija */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guía Hija
                        </label>
                        <input
                            type="text"
                            value={configFactura.guiaHija || ''}
                            onChange={(e) => handleInputChange('guiaHija', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Número de guía hija"
                            disabled={guardando}
                        />
                        {configFactura.guiaHija && (
                            <p className="text-xs text-green-600 mt-1">
                                ✅ Valor tomado de los pedidos
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTÓN GENERAR FACTURA */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        <p>
                            <span className="font-semibold">{pedidosSeleccionados.length}</span> pedidos seleccionados
                        </p>
                        <p className="text-xs">
                            {alertas.length > 0 ? (
                                <span className="text-yellow-600">
                                    ⚠️ Verifique las alertas antes de generar la factura
                                </span>
                            ) : (
                                'Complete todos los campos obligatorios (*) para generar la factura'
                            )}
                        </p>
                    </div>

                    <button
                        onClick={handleGenerarFactura}
                        disabled={guardando || pedidosSeleccionados.length === 0 || !configFactura.numeroFactura || !configFactura.fechaFactura || !configFactura.consignatarioId}
                        className={`w-full sm:w-auto py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-lg transition-all ${!guardando && pedidosSeleccionados.length > 0 &&
                            configFactura.numeroFactura &&
                            configFactura.fechaFactura &&
                            configFactura.consignatarioId
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {guardando ? (
                            <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </span>
                        ) : (
                            '🧾 Generar Factura'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionFactura;