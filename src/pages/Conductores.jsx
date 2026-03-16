// src/pages/Conductores.jsx
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    listarConductores,
    obtenerConductor,
    guardarConductor,
    actualizarConductor,
    validarConductor,
} from "../services/conductores/conductoresService";

export default function Conductores() {
    const [form, setForm] = useState({
        idConductor: 0,
        nombre: "",
        noDocumento: "",
        telefono: "",
        tipoVehiculo: "",
        placa: "",
    });

    const [conductores, setConductores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [mostrarLista, setMostrarLista] = useState(false);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            const data = await listarConductores();
            if (data && Array.isArray(data.conductores)) {
                setConductores(data.conductores);
            } else if (Array.isArray(data)) {
                setConductores(data);
            } else {
                setConductores([]);
            }
        } catch (error) {
            console.error("Error cargando conductores:", error);
            Swal.fire("Error", "No se pudieron cargar los conductores", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleLista = () => {
        setMostrarLista(!mostrarLista);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const limpiarFormulario = () => {
        setForm({
            idConductor: 0,
            nombre: "",
            noDocumento: "",
            telefono: "",
            tipoVehiculo: "",
            placa: "",
        });
        setEditMode(false);
    };

    const validarDatos = async () => {
        const tipo = editMode ? "editar" : "nuevo";
        const res = await validarConductor(
            tipo,
            form.idConductor,
            form.noDocumento,
            form.placa
        );
        return res.success;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar campos obligatorios
        if (!form.nombre.trim()) {
            Swal.fire("Error", "El nombre del conductor es obligatorio", "warning");
            return;
        }
        if (!form.noDocumento.trim()) {
            Swal.fire("Error", "El número de documento es obligatorio", "warning");
            return;
        }
        if (!form.telefono.trim()) {
            Swal.fire("Error", "El teléfono es obligatorio", "warning");
            return;
        }
        if (!form.tipoVehiculo.trim()) {
            Swal.fire("Error", "El tipo de vehículo es obligatorio", "warning");
            return;
        }
        if (!form.placa.trim()) {
            Swal.fire("Error", "La placa es obligatoria", "warning");
            return;
        }

        try {
            // Validar duplicados (documento y nombre)
            const tipoValidacion = editMode ? "editar" : "nuevo";
            const validacion = await validarConductor(tipoValidacion, form.idConductor, {
                documento: form.noDocumento,
                nombre: form.nombre,
            });

            if (!validacion.success) {
                Swal.fire("Error", validacion.message, "warning");
                return;
            }

            // Si pasa la validación, proceder a guardar/actualizar
            setLoading(true);
            let resultado;
            if (editMode) {
                resultado = await actualizarConductor(form);
            } else {
                resultado = await guardarConductor(form);
            }

            if (resultado.success) {
                Swal.fire("Éxito", resultado.message, "success");
                limpiarFormulario();
                cargarDatosIniciales(); // Recargar lista
            } else {
                Swal.fire("Error", resultado.message, "error");
            }
        } catch (error) {
            console.error("Error guardando conductor:", error);
            Swal.fire("Error", "Ocurrió un error al guardar el conductor", "error");
        } finally {
            setLoading(false);
        }
    };
    const handleEdit = async (idConductor) => {
        try {
            setLoading(true);
            const data = await obtenerConductor(idConductor);

            if (data.error) {
                Swal.fire("Error", data.error, "error");
                return;
            }

            setForm({
                idConductor: data.conductor.Id_Conductor,
                nombre: data.conductor.Nombre,
                noDocumento: data.conductor.NoDocumento,
                telefono: data.conductor.Telefono,
                tipoVehiculo: data.conductor.TipoVehiculo,
                placa: data.conductor.Placa,
            });

            setEditMode(true);
            setMostrarLista(false);
        } catch (error) {
            console.error("Error cargando conductor:", error);
            Swal.fire("Error", "No se pudo cargar el conductor", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Formulario */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-700">
                    {editMode ? "Editar Conductor" : "Registrar Conductor"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Nombre del Conductor *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Ingrese el nombre completo"
                                value={form.nombre}
                                onChange={handleChange}
                                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Número de Documento */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Número de Documento *
                            </label>
                            <input
                                type="text"
                                name="noDocumento"
                                placeholder="Cédula, pasaporte, etc."
                                value={form.noDocumento}
                                onChange={handleChange}
                                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Teléfono
                            </label>
                            <input
                                type="text"
                                name="telefono"
                                placeholder="Número de contacto"
                                value={form.telefono}
                                onChange={handleChange}
                                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Tipo de Vehículo */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Tipo de Vehículo
                            </label>
                            <input
                                type="text"
                                name="tipoVehiculo"
                                placeholder="Ej: Camión, Furgón, etc."
                                value={form.tipoVehiculo}
                                onChange={handleChange}
                                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Placa */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Placa
                            </label>
                            <input
                                type="text"
                                name="placa"
                                placeholder="Placa del vehículo"
                                value={form.placa}
                                onChange={handleChange}
                                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
                        >
                            {editMode ? "Actualizar Conductor" : "Guardar Conductor"}
                        </button>

                        <button
                            type="button"
                            onClick={toggleLista}
                            className="bg-purple-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-purple-700 transition font-medium flex-1"
                        >
                            {mostrarLista ? "Ocultar Lista" : "Ver Conductores"}
                        </button>

                        {editMode && (
                            <button
                                type="button"
                                onClick={limpiarFormulario}
                                className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Lista de conductores */}
            {mostrarLista && (
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-slate-700">
                            Lista de Conductores ({conductores.length})
                        </h2>
                        <button
                            onClick={toggleLista}
                            className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition text-sm"
                        >
                            Cerrar
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-center text-gray-500 py-4">Cargando conductores...</p>
                    ) : (
                        <>
                            {/* Tabla para escritorio */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-left">
                                            <th className="p-2 border">Nombre</th>
                                            <th className="p-2 border">Documento</th>
                                            <th className="p-2 border">Teléfono</th>
                                            <th className="p-2 border">Tipo Vehículo</th>
                                            <th className="p-2 border">Placa</th>
                                            <th className="p-2 border text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conductores.length > 0 ? (
                                            conductores.map((conductor) => (
                                                <tr key={conductor.Id_Conductor} className="hover:bg-gray-50">
                                                    <td className="p-2 border font-medium">{conductor.Nombre}</td>
                                                    <td className="p-2 border">{conductor.NoDocumento}</td>
                                                    <td className="p-2 border">{conductor.Telefono}</td>
                                                    <td className="p-2 border">{conductor.TipoVehiculo}</td>
                                                    <td className="p-2 border">{conductor.Placa}</td>
                                                    <td className="p-2 border text-center">
                                                        <button
                                                            onClick={() => handleEdit(conductor.Id_Conductor)}
                                                            className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition text-sm"
                                                        >
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="p-4 text-center text-gray-500">
                                                    No hay conductores registrados
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tarjetas para móvil */}
                            <div className="grid grid-cols-1 gap-3 md:hidden">
                                {conductores.length > 0 ? (
                                    conductores.map((conductor) => (
                                        <div
                                            key={conductor.Id_Conductor}
                                            className="border rounded-lg p-4 shadow-sm bg-white"
                                        >
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="font-semibold text-gray-700">Nombre:</span>
                                                    <p className="text-gray-900 font-medium mt-1">{conductor.Nombre}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Documento:</span>
                                                        <p className="font-medium">{conductor.NoDocumento}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Teléfono:</span>
                                                        <p className="font-medium">{conductor.Telefono}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Tipo Vehículo:</span>
                                                        <p className="font-medium">{conductor.TipoVehiculo}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Placa:</span>
                                                        <p className="font-medium">{conductor.Placa}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleEdit(conductor.Id_Conductor)}
                                                className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition w-full text-sm font-medium"
                                            >
                                                Editar Conductor
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                                        <p>No hay conductores registrados</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}