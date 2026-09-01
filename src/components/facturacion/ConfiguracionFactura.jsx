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
    onLimpiarTodo,
    tipoPedido,
    guardarFacturaFn // Opcional: funcion personalizada para guardar (ej: Chile)
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
                // Agencia: siempre se toma del primer pedido seleccionado
                if (primerPedido.idAgencia) {
                    nuevosConfig.agenciaId = primerPedido.idAgencia.toString();
                    hayCambios = true;
                    console.log('✅ Autocompletado agencia:', primerPedido.idAgencia);
                }
                
                // Solo autocompletar los demás campos si están vacíos
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

    // 🔴 AUTO-CALCULAR FECHA VENCIMIENTO (35 días después de la fecha factura)
    useEffect(() => {
        if (configFactura.fechaFactura && tipoPedido === 'chile') {
            const fecha = new Date(configFactura.fechaFactura);
            fecha.setDate(fecha.getDate() + 35);
            const fechaVenc = fecha.toISOString().split('T')[0];
            if (configFactura.fechaVencimiento !== fechaVenc) {
                onConfigChange(prev => ({...prev, fechaVencimiento: fechaVenc}));
            }
        }
    }, [configFactura.fechaFactura, tipoPedido]);

    // 🔴 FUNCIÓN COMPLETAMENTE ACTUALIZADA CON SOPORTE PARA SAMPLES
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

        const requiereConsignatario = tipoPedido !== 'chile';
        if (!configFactura.numeroFactura || !configFactura.fechaFactura || (requiereConsignatario && !configFactura.consignatarioId)) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obligatorios',
                text: 'Por favor completa todos los campos obligatorios (*)',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        // 🔴 VALIDAR QUE NO SE MEZCLEN TIPOS DE PEDIDOS
        const tiposMezclados = new Set(pedidosSeleccionados.map(pedido => 
            pedido.numero.startsWith('SMP-') ? 'sample' : 'normal'
        ));
        
        if (tiposMezclados.size > 1) {
            Swal.fire({
                icon: 'error',
                title: 'Tipos de pedido mezclados',
                html: `No puedes mezclar pedidos normales y samples en la misma factura.<br><br>
                       <strong>Seleccionados:</strong><br>
                       - ${pedidosSeleccionados.filter(p => p.numero.startsWith('PED-')).length} Pedidos Normales<br>
                       - ${pedidosSeleccionados.filter(p => p.numero.startsWith('SMP-')).length} Samples`,
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        const labelTipo = tipoPedido === 'normal' ? 'Normal' : tipoPedido === 'chile' ? 'Chile' : 'Sample';
        const confirmacion = await Swal.fire({
            title: `¿Generar Factura ${labelTipo}?`,
            html: `
                <div class="text-left">
                    <p><strong>Número:</strong> ${configFactura.numeroFactura}</p>
                    <p><strong>Tipo:</strong> ${tipoPedido === 'normal' ? '📦 Pedidos Normales' : tipoPedido === 'chile' ? '🌎 Pedidos Chile' : '🔬 Samples'}</p>
                    <p><strong>Cantidad:</strong> ${pedidosSeleccionados.length} ${tipoPedido === 'normal' ? 'pedidos' : tipoPedido === 'chile' ? 'pedidos Chile' : 'samples'}</p>
                    <p><strong>Valor Total:</strong> $${pedidosSeleccionados.reduce((sum, p) => sum + p.valor, 0).toLocaleString('es-CO')}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: tipoPedido === 'normal' ? '#10b981' : '#059669',
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Sí, generar factura ${tipoPedido === 'chile' ? 'chile' : tipoPedido === 'normal' ? 'normal' : 'sample'}`,
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
                    observaciones: configFactura.observaciones || '',
                    tipoPedido: tipoPedido,
                    ...(tipoPedido === 'chile' ? {
                        fechaVencimiento: configFactura.fechaVencimiento,
                        terminosPago: configFactura.terminosPago,
                        fleteInternacional: configFactura.fleteInternacional,
                        incoterm: configFactura.incoterm,
                        partidaArancelaria: configFactura.partidaArancelaria,
                        temperatura: configFactura.temperatura
                    } : {})
                },
                pedidosIds: pedidosSeleccionados.map(pedido => pedido.id),
                tipoPedido: tipoPedido
            };

            console.log('📤 Enviando datos al backend:', datosFactura);

            const fnGuardar = guardarFacturaFn || guardarFactura;
            const resultado = await fnGuardar(
                datosFactura.encabezado,
                datosFactura.pedidosIds,
                tipoPedido
            );

            if (resultado.success) {
                const labelTipo = tipoPedido === 'normal' ? 'Normal' : tipoPedido === 'chile' ? 'Chile' : 'Sample';
                await Swal.fire({
                    icon: 'success',
                    title: `¡Factura ${labelTipo} Generada!`,
                    html: `
                        <div class="text-left">
                            <p><strong>Número:</strong> ${resultado.numeroFactura}</p>
                            <p><strong>Tipo:</strong> ${tipoPedido === 'normal' ? '📦 Pedidos Normales' : tipoPedido === 'chile' ? '🌎 Pedidos Chile' : '🔬 Samples'}</p>
                            <p><strong>Procesados:</strong> ${resultado.pedidosActualizados || pedidosSeleccionados.length}</p>
                            ${resultado.cantidadItems ? `<p><strong>Items:</strong> ${resultado.cantidadItems}</p>` : ''}
                            ${resultado.cantidadEstibas ? `<p><strong>Estibas:</strong> ${resultado.cantidadEstibas}</p>` : ''}
                        </div>
                    `,
                    confirmButtonColor: tipoPedido === 'normal' ? '#10b981' : '#059669',
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
                    title: `Error al generar factura ${tipoPedido === 'chile' ? 'chile' : tipoPedido === 'normal' ? 'normal' : 'sample'}`,
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

    // 🔴 NUEVO: Calcular estadísticas según el tipo
    const calcularEstadisticas = () => {
        const totalValor = pedidosSeleccionados.reduce((sum, pedido) => sum + pedido.valor, 0);
        const totalCajas = pedidosSeleccionados.reduce((sum, pedido) => sum + pedido.cajas, 0);
        
        if (tipoPedido === 'normal') {
            const totalTms = pedidosSeleccionados.reduce((sum, pedido) => sum + pedido.tms, 0);
            const totalPesoNeto = pedidosSeleccionados.reduce((sum, pedido) => sum + pedido.pesoNeto, 0);
            return { totalValor, totalCajas, totalTms, totalPesoNeto };
        } else {
            const totalEstibas = pedidosSeleccionados.reduce((sum, pedido) => sum + (pedido.estibas || 0), 0);
            return { totalValor, totalCajas, totalEstibas };
        }
    };

    const estadisticas = calcularEstadisticas();

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
                <div className={`w-1 h-6 sm:h-8 rounded-full mr-3 ${
                    tipoPedido === 'normal' ? 'bg-purple-500' : tipoPedido === 'chile' ? 'bg-amber-500' : 'bg-green-600'
                }`}></div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Configuración de Factura {tipoPedido === 'chile' ? 'Chile' : tipoPedido === 'normal' ? 'Normal' : 'Sample'}
                </h2>
            </div>

            <div className={`mb-6 p-4 rounded-lg border ${
                tipoPedido === 'normal'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : tipoPedido === 'chile'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-green-50 border-green-200 text-green-800'
            }`}>
                <div className="flex items-center">
                    <span className="mr-2 text-lg">
                        {tipoPedido === 'normal' ? '📦' : tipoPedido === 'chile' ? '🌎' : '🔬'}
                    </span>
                    <div>
                        <p className="font-medium">
                            Trabajando con {tipoPedido === 'chile' ? 'Pedidos Chile' : tipoPedido === 'normal' ? 'Pedidos Normales' : 'Samples'}
                        </p>
                        <p className="text-sm mt-1">
                            {pedidosSeleccionados.length} {tipoPedido === 'chile' ? 'pedidos Chile' : tipoPedido === 'normal' ? 'pedidos' : 'samples'} seleccionados •
                            Valor total: ${estadisticas.totalValor.toLocaleString('es-CO')}
                        </p>
                    </div>
                </div>
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
                            Los campos se han autocompletado con los datos de los {tipoPedido === 'normal' ? 'pedidos' : 'samples'} seleccionados
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
                            Guardando factura {tipoPedido === 'normal' ? 'normal' : 'sample'}, por favor espere...
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
                            placeholder={tipoPedido === 'normal' ? "Ej: FACT-2024-001" : "Ej: SMP-FACT-2024-001"}
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

                {/* COLUMNA 2 - CONSIGNATARIO (normal/sample) / DATOS CHILE */}
                {tipoPedido === 'chile' ? (
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                        Configuración de Factura Chile
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Vencimiento</label>
                        <input type="date" value={configFactura.fechaVencimiento || ''}
                            onChange={(e) => onConfigChange(prev => ({...prev, fechaVencimiento: e.target.value}))}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={guardando} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Terminos de Pago</label>
                        <input type="text" value={configFactura.terminosPago || 'Pago 35 dias'}
                            onChange={(e) => onConfigChange(prev => ({...prev, terminosPago: e.target.value}))}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={guardando} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Flete Internacional (USD)</label>
                        <input type="number" step="0.01" value={configFactura.fleteInternacional || ''}
                            onChange={(e) => onConfigChange(prev => ({...prev, fleteInternacional: e.target.value}))}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={guardando} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Incoterm</label>
                        <select value={configFactura.incoterm || 'CPT'}
                            onChange={(e) => onConfigChange(prev => ({...prev, incoterm: e.target.value}))}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={guardando}>
                            <option value="CPT">CPT - Costo y Flete</option>
                            <option value="CIF">CIF - Costo Seguro y Flete</option>
                            <option value="FOB">FOB - Free on Board</option>
                            <option value="EXW">EXW - Ex Works</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Partida Arancelaria</label>
                        <input type="text" value={configFactura.partidaArancelaria || '0406100000'}
                            onChange={(e) => onConfigChange(prev => ({...prev, partidaArancelaria: e.target.value}))}
                            className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={guardando} />
                    </div>
                </div>
                ) : (
                <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
                        Consignatario
                    </h3>
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
                )}

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
                                {tipoPedido === 'chile' ? '✅ Valor tomado de los pedidos Chile' : `✅ Valor tomado de los ${tipoPedido === 'normal' ? 'pedidos' : 'samples'}`}
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
                                {tipoPedido === 'chile' ? '✅ Valor tomado de los pedidos Chile' : `✅ Valor tomado de los ${tipoPedido === 'normal' ? 'pedidos' : 'samples'}`}
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
                                {tipoPedido === 'chile' ? '✅ Valor tomado de los pedidos Chile' : `✅ Valor tomado de los ${tipoPedido === 'normal' ? 'pedidos' : 'samples'}`}
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
                                {tipoPedido === 'chile' ? '✅ Valor tomado de los pedidos Chile' : `✅ Valor tomado de los ${tipoPedido === 'normal' ? 'pedidos' : 'samples'}`}
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
                            <span className="font-semibold">{pedidosSeleccionados.length}</span> {tipoPedido === 'chile' ? 'pedidos Chile' : tipoPedido === 'normal' ? 'pedidos' : 'samples'} seleccionados
                        </p>
                        <p className="text-xs">
                            {tipoPedido === 'chile' ? (
                                `🌎 ${estadisticas.totalEstibas} estibas • ${estadisticas.totalCajas} cajas`
                            ) : tipoPedido === 'normal' ? (
                                `📦 ${estadisticas.totalCajas} cajas • ${estadisticas.totalTms} TM • ${estadisticas.totalPesoNeto.toLocaleString('es-CO')} kg`
                            ) : (
                                `🔬 ${estadisticas.totalCajas} cajas • ${estadisticas.totalEstibas} estibas`
                            )} • ${estadisticas.totalValor.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs mt-1">
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
                        disabled={guardando || pedidosSeleccionados.length === 0 || !configFactura.numeroFactura || !configFactura.fechaFactura || (tipoPedido !== 'chile' && !configFactura.consignatarioId)}
                        className={`w-full sm:w-auto py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-lg transition-all ${!guardando && pedidosSeleccionados.length > 0 &&
                            configFactura.numeroFactura &&
                            configFactura.fechaFactura &&
                            (tipoPedido === 'chile' || configFactura.consignatarioId)
                            ? tipoPedido === 'normal' || tipoPedido === 'chile'
                                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {guardando ? (
                            <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </span>
                        ) : (
                            `🧾 Generar Factura ${tipoPedido === 'normal' ? 'Normal' : tipoPedido === 'chile' ? 'Chile' : 'Sample'}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionFactura;
