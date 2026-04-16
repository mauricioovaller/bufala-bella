/**
 * Componente: DestinatariosSelector
 * Descripción: Selector profesional y práctico de destinatarios de correo
 * Características:
 *   - Búsqueda en tiempo real
 *   - Selección múltiple con checkboxes
 *   - Botón para agregar nuevo destinatario
 *   - Edición y eliminación desde el selector
 *   - Validación de emails en tiempo real
 *   - Responsive y accesible
 *
 * Uso:
 *   <DestinatariosSelector
 *     destinatariosSeleccionados={emails}
 *     onCambio={(nuevosEmails) => setDestinatarios(nuevosEmails)}
 *     onAgregarNuevo={(nuevo) => {}}
 *     puedeAgregar={true}
 *   />
 */

import React, { useState, useEffect, useRef } from 'react';
import { obtenerDestinatarios, crearDestinatario, actualizarDestinatario, eliminarDestinatario } from '../../services/correoService';
import Swal from 'sweetalert2';

const DestinatariosSelector = ({
    destinatariosSeleccionados = [],
    onCambio = () => { },
    onAgregarNuevo = () => { },
    puedeAgregar = true,
    puedeEditar = true,
    puedeEliminar = true,
    mostrarSoloActivos = true,
    className = ''
}) => {
    // Estados
    const [destinatarios, setDestinatarios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [destinatarioEditando, setDestinatarioEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const inputBusquedaRef = useRef(null);

    // Datos del formulario para agregar/editar
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        tipo: 'cliente'
    });

    // Cargar destinatarios al montar
    useEffect(() => {
        cargarDestinatarios();
    }, []);

    // Cargar destinatarios desde API
    const cargarDestinatarios = async () => {
        setCargando(true);
        try {
            const respuesta = await obtenerDestinatarios('todos');
            if (respuesta.success) {
                setDestinatarios(respuesta.destinatarios || []);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar los destinatarios',
                    confirmButtonColor: '#dc2626'
                });
            }
        } catch (error) {
            console.error('Error cargando destinatarios:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al conectar con el servidor: ' + error.message,
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setCargando(false);
        }
    };

    // Filtrar destinatarios por búsqueda
    const destinatariosFiltrados = destinatarios.filter(dest => {
        const coincidencia = dest.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            dest.email.toLowerCase().includes(busqueda.toLowerCase());
        const cumpleActivos = !mostrarSoloActivos || (dest.activo === 1 || dest.activo === true);
        return coincidencia && cumpleActivos;
    });

    // Manejar cambio de selección
    const handleSeleccionar = (email) => {
        const nuevos = destinatariosSeleccionados.includes(email)
            ? destinatariosSeleccionados.filter(e => e !== email)
            : [...destinatariosSeleccionados, email];
        onCambio(nuevos);
    };

    // Agregar nuevo destinatario
    const handleAgregarNuevo = () => {
        setFormData({ nombre: '', email: '', tipo: 'cliente' });
        setDestinatarioEditando(null);
        setMostrarFormulario(true);
    };

    // Editar destinatario
    const handleEditar = (destinatario) => {
        setFormData({
            nombre: destinatario.nombre,
            email: destinatario.email,
            tipo: destinatario.tipo || 'cliente'
        });
        setDestinatarioEditando(destinatario.id);
        setMostrarFormulario(true);
        setBusqueda('');
    };

    // Guardar destinatario (crear o actualizar)
    const handleGuardar = async () => {
        // Validaciones
        if (!formData.nombre.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'El nombre es obligatorio',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        if (!formData.email.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'El email es obligatorio',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        if (!validarEmail(formData.email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Email inválido',
                text: 'Ingrese un email válido',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        setGuardando(true);
        try {
            let respuesta;

            if (destinatarioEditando) {
                // Actualizar
                respuesta = await actualizarDestinatario({
                    id: destinatarioEditando,
                    nombre: formData.nombre.trim(),
                    email: formData.email.trim(),
                    tipo: formData.tipo
                });
            } else {
                // Crear
                respuesta = await crearDestinatario({
                    nombre: formData.nombre.trim(),
                    email: formData.email.trim(),
                    tipo: formData.tipo
                });
            }

            if (respuesta.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Listo!',
                    text: destinatarioEditando ? 'Destinatario actualizado' : 'Destinatario creado',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Recargar lista y cerrar formulario
                await cargarDestinatarios();
                setMostrarFormulario(false);

                // Si es nuevo, agregarlo a la selección
                if (!destinatarioEditando) {
                    onCambio([...destinatariosSeleccionados, formData.email.trim()]);
                    onAgregarNuevo({
                        nombre: formData.nombre,
                        email: formData.email.trim(),
                        tipo: formData.tipo
                    });
                }
            } else {
                throw new Error(respuesta.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error guardando destinatario:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo guardar el destinatario',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setGuardando(false);
        }
    };

    // Eliminar destinatario
    const handleEliminar = async (destinatario) => {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar destinatario?',
            html: `<strong>${destinatario.nombre}</strong><br><small>${destinatario.email}</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmacion.isConfirmed) return;

        try {
            const respuesta = await eliminarDestinatario({ id: destinatario.id });

            if (respuesta.success) {
                // Recargar
                await cargarDestinatarios();

                // Si estaba seleccionado, deseleccionar
                if (destinatariosSeleccionados.includes(destinatario.email)) {
                    onCambio(destinatariosSeleccionados.filter(e => e !== destinatario.email));
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Destinatario eliminado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                throw new Error(respuesta.message);
            }
        } catch (error) {
            console.error('Error eliminando:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo eliminar el destinatario',
                confirmButtonColor: '#dc2626'
            });
        }
    };

    // Validar email simple
    const validarEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Manejar cambios en el formulario
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800 flex items-center">
                    <span className="mr-2">👥</span> Destinatarios
                </h4>
                {puedeAgregar && !mostrarFormulario && (
                    <button
                        onClick={handleAgregarNuevo}
                        className="text-sm bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded transition-colors font-medium"
                    >
                        + Agregar nuevo
                    </button>
                )}
            </div>

            {/* Formulario para agregar/editar */}
            {mostrarFormulario && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-3">
                        {destinatarioEditando ? '✏️ Editar destinatario' : '➕ Nuevo destinatario'}
                    </h5>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleFormChange}
                                placeholder="Ej: Juan García"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={guardando}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleFormChange}
                                placeholder="Ej: juan@correo.com"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={guardando || destinatarioEditando}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleFormChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={guardando}
                            >
                                <option value="cliente">Cliente</option>
                                <option value="interno">Interno (empresa)</option>
                                <option value="proveedor">Proveedor</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setDestinatarioEditando(null);
                                }}
                                disabled={guardando}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={guardando}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
                </div>
            )}

            {/* Búsqueda */}
            <div className="relative">
                <input
                    ref={inputBusquedaRef}
                    type="text"
                    placeholder="🔍 Buscar por nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={cargando}
                />
            </div>

            {/* Indicador de carga */}
            {cargando && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Cargando...</span>
                </div>
            )}

            {/* Lista de destinatarios */}
            {!cargando && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
                    {destinatariosFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            {busqueda ? '❌ No se encontraron resultados' : '📭 No hay destinatarios configurados'}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {destinatariosFiltrados.map((dest) => (
                                <div
                                    key={`${dest.id}-${dest.email}`}
                                    className="p-3 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        {/* Checkbox y datos */}
                                        <div className="flex items-start gap-2 flex-1">
                                            <input
                                                type="checkbox"
                                                id={`dest-${dest.id}`}
                                                checked={destinatariosSeleccionados.includes(dest.email)}
                                                onChange={() => handleSeleccionar(dest.email)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                                            />
                                            <label
                                                htmlFor={`dest-${dest.id}`}
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="font-medium text-gray-800 text-sm">
                                                    {dest.nombre}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {dest.email}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {dest.tipo === 'cliente' && '👤 Cliente'}
                                                    {dest.tipo === 'interno' && '🏢 Interno'}
                                                    {dest.tipo === 'proveedor' && '🤝 Proveedor'}
                                                    {dest.tipo === 'otro' && '📌 Otro'}
                                                    {dest.predeterminado && ' • ⭐ Predeterminado'}
                                                </div>
                                            </label>
                                        </div>

                                        {/* Botones de acción */}
                                        {(puedeEditar || puedeEliminar) && (
                                            <div className="flex gap-1">
                                                {puedeEditar && (
                                                    <button
                                                        onClick={() => handleEditar(dest)}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                                {puedeEliminar && (
                                                    <button
                                                        onClick={() => handleEliminar(dest)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Resumen de seleccionados */}
            {destinatariosSeleccionados.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-sm text-green-800">
                        <strong>{destinatariosSeleccionados.length}</strong> destinatario(s) seleccionado(s):
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {destinatariosSeleccionados.map((email) => (
                            <div
                                key={email}
                                className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                            >
                                {email}
                                <button
                                    onClick={() => handleSeleccionar(email)}
                                    className="hover:text-green-900"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mensaje de validación */}
            {destinatariosSeleccionados.length === 0 && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                        ⚠️ Selecciona al menos un destinatario para continuar
                    </p>
                </div>
            )}
        </div>
    );
};

export default DestinatariosSelector;
