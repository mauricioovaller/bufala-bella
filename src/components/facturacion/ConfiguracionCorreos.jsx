/**
 * Componente: ConfiguracionCorreos
 * Descripción: Interfaz para administrar cuentas de correo SMTP
 * Características:
 *   - Listar cuentas configuradas
 *   - Crear nueva cuenta con validación
 *   - Editar cuenta existente
 *   - Eliminar (desactivar) cuenta
 *   - Probar conexión SMTP
 *   - Establecer cuenta predeterminada
 *   - Responsive y profesional
 */

import React, { useState, useEffect } from 'react';
import {
    obtenerCuentasCorreo,
    crearCuentaCorreo,
    actualizarCuentaCorreo,
    eliminarCuentaCorreo,
    establecerCuentaPredeterminada,
    probarConexionSMTP
} from '../../services/correoService';
import Swal from 'sweetalert2';

const ConfiguracionCorreos = () => {
    // Estados principales
    const [cuentas, setCuentas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [cuentaEditando, setCuentaEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [probando, setProbando] = useState(null);

    // Datos del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        email_remitente: '',
        servidor_smtp: '',
        puerto: 587,
        usuario_smtp: '',
        contrasena_smtp: '',
        usar_tls: true,
        usar_ssl: false,
        predeterminada: false,
        activa: true,
        email_prueba: ''
    });

    // Cargar cuentas al montar
    useEffect(() => {
        cargarCuentas();
    }, []);

    // Cargar cuentas desde API
    const cargarCuentas = async () => {
        setCargando(true);
        try {
            const respuesta = await obtenerCuentasCorreo();
            if (respuesta.success) {
                setCuentas(respuesta.cuentas || []);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Aviso',
                    text: 'Aún no hay cuentas configuradas',
                    confirmButtonColor: '#3b82f6'
                });
            }
        } catch (error) {
            console.error('Error cargando cuentas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las cuentas: ' + error.message,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setCargando(false);
        }
    };

    // Abrir formulario para agregar
    const handleAgregarNuevo = () => {
        setCuentaEditando(null);
        setFormData({
            nombre: '',
            email_remitente: '',
            servidor_smtp: '',
            puerto: 587,
            usuario_smtp: '',
            contrasena_smtp: '',
            usar_tls: true,
            usar_ssl: false,
            predeterminada: false,
            activa: true,
            email_prueba: ''
        });
        setMostrarFormulario(true);
    };

    // Editar cuenta
    const handleEditar = (cuenta) => {
        setCuentaEditando(cuenta.id);
        setFormData({
            nombre: cuenta.nombre,
            email_remitente: cuenta.email_remitente,
            servidor_smtp: cuenta.servidor_smtp,
            puerto: cuenta.puerto,
            usuario_smtp: cuenta.usuario_smtp,
            contrasena_smtp: '',
            usar_tls: Boolean(cuenta.usar_tls),
            usar_ssl: Boolean(cuenta.usar_ssl),
            predeterminada: Boolean(cuenta.predeterminada),
            activa: Boolean(cuenta.activa),
            email_prueba: ''
        });
        setMostrarFormulario(true);
    };

    // Manejar cambios en el formulario
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Guardar cuenta (crear o actualizar)
    const handleGuardar = async () => {
        // Validaciones
        const validaciones = [
            { campo: 'nombre', mensaje: 'El nombre es requerido' },
            { campo: 'email_remitente', mensaje: 'El email de remitente es requerido' },
            { campo: 'servidor_smtp', mensaje: 'El servidor SMTP es requerido' },
            { campo: 'puerto', mensaje: 'El puerto es requerido' },
            { campo: 'usuario_smtp', mensaje: 'El usuario SMTP es requerido' },
            { campo: 'contrasena_smtp', mensaje: 'La contraseña es requerida (dejarla vacía para mantener la actual)', mostrarSiEditando: true }
        ];

        for (const val of validaciones) {
            // Si es contraseña y estamos editando, permitir dejar vacío
            if (val.campo === 'contrasena_smtp' && cuentaEditando && !formData[val.campo]) {
                continue;
            }

            if (!formData[val.campo]) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campo requerido',
                    text: val.mensaje,
                    confirmButtonColor: '#f59e0b'
                });
                return;
            }
        }

        // Validar email
        if (!validarEmail(formData.email_remitente)) {
            Swal.fire({
                icon: 'warning',
                title: 'Email inválido',
                text: 'Ingrese un email válido',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        // Validar puerto
        const puerto = parseInt(formData.puerto);
        if (puerto < 1 || puerto > 65535) {
            Swal.fire({
                icon: 'warning',
                title: 'Puerto inválido',
                text: 'El puerto debe estar entre 1 y 65535',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        // No permitir SSL y TLS al mismo tiempo
        if (formData.usar_tls && formData.usar_ssl) {
            Swal.fire({
                icon: 'warning',
                title: 'Configuración inválida',
                text: 'No seleccione SSL y TLS al mismo tiempo. Generalmente se usa TLS en puerto 587 o SSL en puerto 465',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        setGuardando(true);
        try {
            let respuesta;
            const datosEnvio = { ...formData };

            if (cuentaEditando) {
                // Si no escribió nueva contraseña, no incluirla
                if (!datosEnvio.contrasena_smtp) {
                    delete datosEnvio.contrasena_smtp;
                }
                datosEnvio.id = cuentaEditando;
                respuesta = await actualizarCuentaCorreo(datosEnvio);
            } else {
                respuesta = await crearCuentaCorreo(datosEnvio);
            }

            if (respuesta.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Listo!',
                    text: cuentaEditando ? 'Cuenta actualizada' : 'Cuenta creada',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });

                await cargarCuentas();
                setMostrarFormulario(false);
            } else {
                throw new Error(respuesta.message);
            }
        } catch (error) {
            console.error('Error guardando:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al guardar la cuenta',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setGuardando(false);
        }
    };

    // Cambiar estado de activa/inactiva
    const handleCambiarEstado = async (cuenta) => {
        setGuardando(true);
        try {
            const nuevoEstado = cuenta.activa ? 0 : 1;
            const respuesta = await actualizarCuentaCorreo({
                id: cuenta.id,
                activa: nuevoEstado
            });

            if (respuesta.success) {
                Swal.fire({
                    icon: 'success',
                    title: cuenta.activa ? 'Desactivada' : 'Activada',
                    text: `Cuenta ${cuenta.activa ? 'desactivada' : 'activada'} correctamente`,
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
                await cargarCuentas();
            } else {
                throw new Error(respuesta.message);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setGuardando(false);
        }
    };

    // Eliminar cuenta
    const handleEliminar = async (cuenta) => {
        const confirmacion = await Swal.fire({
            title: '¿Desactivar cuenta?',
            html: `<strong>${cuenta.nombre}</strong><br><small>${cuenta.email_remitente}</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const respuesta = await eliminarCuentaCorreo({ id: cuenta.id });

            if (respuesta.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Desactivada',
                    text: 'La cuenta ha sido desactivada',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
                await cargarCuentas();
            } else {
                throw new Error(respuesta.message);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#dc2626'
            });
        }
    };

    // Establecer como predeterminada
    const handleEstablecerPredeterminada = async (cuenta) => {
        if (cuenta.predeterminada) return;

        try {
            const respuesta = await establecerCuentaPredeterminada({ id: cuenta.id });

            if (respuesta.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Establecida',
                    text: 'Esta es ahora su cuenta predeterminada',
                    confirmButtonColor: '#10b981',
                    timer: 2000,
                    showConfirmButton: false
                });
                await cargarCuentas();
            } else {
                throw new Error(respuesta.message);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                confirmButtonColor: '#dc2626'
            });
        }
    };

    // Probar conexión SMTP
    const handleProbarConexion = async (cuenta) => {
        const email = await Swal.fire({
            title: 'Probar conexión',
            input: 'email',
            inputLabel: 'Email de prueba',
            inputPlaceholder: 'Ingrese un email para recibir el test',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Probar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Ingrese un email válido';
                }
                if (!validarEmail(value)) {
                    return 'Email inválido';
                }
            }
        });

        if (!email.value) return;

        setProbando(cuenta.id);
        try {
            const respuesta = await probarConexionSMTP({
                id: cuenta.id,
                email_prueba: email.value
            });

            if (respuesta.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Conexión exitosa',
                    html: `<div class="text-left">
                   <p><strong>Servidor:</strong> ${respuesta.detalles.servidor}</p>
                   <p><strong>Puerto:</strong> ${respuesta.detalles.puerto}</p>
                   <p><strong>Protocolo:</strong> ${respuesta.detalles.protocolo}</p>
                 </div>`,
                    confirmButtonColor: '#10b981'
                });
                await cargarCuentas();
            } else {
                throw new Error(respuesta.message);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: error.message,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setProbando(null);
        }
    };

    // Validar email
    const validarEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">📧 Configuración de Correos</h2>
                        <p className="text-gray-600 text-sm mt-1">Administra tus cuentas SMTP para el envío de emails</p>
                    </div>
                    {!mostrarFormulario && (
                        <button
                            onClick={handleAgregarNuevo}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            ➕ Nueva Cuenta
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Formulario */}
                {mostrarFormulario && (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-4">
                            {cuentaEditando ? '✏️ Editar Cuenta' : '➕ Nueva Cuenta de Correo'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre descriptivo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleFormChange}
                                    placeholder="Ej: Facturación, Soporte"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardando}
                                />
                            </div>

                            {/* Email remitente */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email remitente <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email_remitente"
                                    value={formData.email_remitente}
                                    onChange={handleFormChange}
                                    placeholder="Ej: facturacion@empresa.com"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardando || cuentaEditando}
                                />
                                <p className="text-xs text-gray-500 mt-1">Desde esta dirección se enviarán los emails</p>
                            </div>

                            {/* Servidor SMTP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Servidor SMTP <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="servidor_smtp"
                                    value={formData.servidor_smtp}
                                    onChange={handleFormChange}
                                    placeholder="Ej: smtp.gmail.com, smtp.office365.com"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardando}
                                />
                                <p className="text-xs text-gray-500 mt-1">Gmail: smtp.gmail.com | Outlook: smtp-mail.outlook.com</p>
                            </div>

                            {/* Puerto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Puerto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="puerto"
                                    value={formData.puerto}
                                    onChange={handleFormChange}
                                    placeholder="587"
                                    min="1"
                                    max="65535"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardando}
                                />
                                <p className="text-xs text-gray-500 mt-1">TLS: 587 | SSL: 465 | Otros: según proveedor</p>
                            </div>

                            {/* Usuario SMTP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuario SMTP <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="usuario_smtp"
                                    value={formData.usuario_smtp}
                                    onChange={handleFormChange}
                                    placeholder="Generalmente es el mismo email"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardando}
                                />
                            </div>

                            {/* Contraseña */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña {cuentaEditando && '(deeje vacío para mantener)'}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="contrasena_smtp"
                                    value={formData.contrasena_smtp}
                                    onChange={handleFormChange}
                                    placeholder={cuentaEditando ? "Dejar vacío para mantener la actual" : "Contraseña de la cuenta"}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={guardando}
                                />
                                <p className="text-xs text-gray-500 mt-1">Se guardará encriptada y segura</p>
                            </div>
                        </div>

                        {/* Opciones de protocolo */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="usar_tls"
                                    checked={formData.usar_tls}
                                    onChange={handleFormChange}
                                    disabled={guardando || formData.usar_ssl}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Usar TLS</span>
                                <span className="text-xs text-gray-500">(Puerto 587)</span>
                            </label>

                            <label className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="usar_ssl"
                                    checked={formData.usar_ssl}
                                    onChange={handleFormChange}
                                    disabled={guardando || formData.usar_tls}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Usar SSL</span>
                                <span className="text-xs text-gray-500">(Puerto 465)</span>
                            </label>
                        </div>

                        {/* Estado y Configuración */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="predeterminada"
                                    checked={formData.predeterminada}
                                    onChange={handleFormChange}
                                    disabled={guardando}
                                    className="w-4 h-4 text-green-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">⭐ Predeterminada</span>
                                <span className="text-xs text-gray-500">Para envíos</span>
                            </label>

                            <label className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="activa"
                                    checked={formData.activa}
                                    onChange={handleFormChange}
                                    disabled={guardando}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">✓ Activa</span>
                                <span className="text-xs text-gray-500">Disponible</span>
                            </label>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-blue-200">
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setCuentaEditando(null);
                                }}
                                disabled={guardando}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={guardando}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                            >
                                {guardando ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    '💾 Guardar'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de cuentas */}
                {!mostrarFormulario && (
                    <>
                        {cargando ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                                <span className="text-gray-600">Cargando cuentas...</span>
                            </div>
                        ) : cuentas.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600 mb-4">📭 No hay cuentas configuradas aún</p>
                                <button
                                    onClick={handleAgregarNuevo}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Crear primera cuenta
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {cuentas.map((cuenta) => (
                                    <div
                                        key={cuenta.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Información de la cuenta */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="text-lg font-bold text-gray-800">{cuenta.nombre}</h4>
                                                    {cuenta.predeterminada && (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                                                            ⭐ Predeterminada
                                                        </span>
                                                    )}
                                                    {cuenta.activa ? (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                                            ✓ Activa
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                                                            ✗ Inactiva
                                                        </span>
                                                    )}
                                                    {cuenta.probada && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                                            🔗 Probada
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                                    <div><strong>Email:</strong> {cuenta.email_remitente}</div>
                                                    <div><strong>Servidor:</strong> {cuenta.servidor_smtp}:{cuenta.puerto}</div>
                                                    <div><strong>Usuario:</strong> {cuenta.usuario_smtp}</div>
                                                    <div>
                                                        <strong>Protocolo:</strong>{' '}
                                                        {cuenta.usar_ssl ? 'SSL' : cuenta.usar_tls ? 'TLS' : 'PLAIN'}
                                                    </div>
                                                </div>

                                                {cuenta.ultima_prueba && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Última prueba: {new Date(cuenta.ultima_prueba).toLocaleString('es-CO')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="flex flex-col gap-2 min-w-fit">
                                                {!cuenta.predeterminada && (
                                                    <button
                                                        onClick={() => handleEstablecerPredeterminada(cuenta)}
                                                        className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded transition-colors font-medium"
                                                        title="Establecer como predeterminada"
                                                    >
                                                        ⭐ Predeterminada
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleProbarConexion(cuenta)}
                                                    disabled={probando === cuenta.id}
                                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors disabled:opacity-50 font-medium"
                                                    title="Probar conexión SMTP"
                                                >
                                                    {probando === cuenta.id ? '⏳ Probando...' : '🔗 Probar'}
                                                </button>

                                                <button
                                                    onClick={() => handleCambiarEstado(cuenta)}
                                                    disabled={guardando}
                                                    className={`px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 font-medium ${cuenta.activa
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                    title={cuenta.activa ? 'Desactivar cuenta' : 'Activar cuenta'}
                                                >
                                                    {cuenta.activa ? '🔴 Desactivar' : '🟢 Activar'}
                                                </button>

                                                <button
                                                    onClick={() => handleEditar(cuenta)}
                                                    className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded transition-colors font-medium"
                                                    title="Editar cuenta"
                                                >
                                                    ✏️ Editar
                                                </button>

                                                <button
                                                    onClick={() => handleEliminar(cuenta)}
                                                    className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors font-medium"
                                                    title="Eliminar cuenta permanentemente"
                                                >
                                                    🗑️ Borrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfiguracionCorreos;
