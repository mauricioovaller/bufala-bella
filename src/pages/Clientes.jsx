import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  listarClientes,
  obtenerCliente,
  guardarCliente,
  actualizarCliente,
  validarCliente,
} from "../services/clientesService";

export default function Clientes() {
  const [form, setForm] = useState({
    idCliente: 0,
    nombre: "",
    diasFechaSalida: 0,
    diasFechaEnroute: 0,
    diasFechaDelivery: 0,
    diasFechaIngreso: 0,
  });

  const [regiones, setRegiones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false); // 👈 Nuevo estado

  // Cargar clientes al iniciar
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await listarClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      Swal.fire("Error", "No se pudieron cargar los clientes", "error");
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

  const handleRegionChange = (index, field, value) => {
    const nuevasRegiones = [...regiones];
    nuevasRegiones[index] = {
      ...nuevasRegiones[index],
      [field]: value,
    };
    setRegiones(nuevasRegiones);
  };

  const agregarRegion = () => {
    setRegiones([
      ...regiones,
      { region: "", direccion: "", frecuencia: "" },
    ]);
  };

  const limpiarFormulario = () => {
    setForm({
      idCliente: 0,
      nombre: "",
      diasFechaSalida: 0,
      diasFechaEnroute: 0,
      diasFechaDelivery: 0,
      diasFechaIngreso: 0,
    });
    setRegiones([]);
    setEditMode(false);
  };

  const validarDatos = async () => {
    const tipo = editMode ? "editar" : "nuevo";
    const res = await validarCliente(tipo, form.idCliente, form.nombre);
    return res.success;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      Swal.fire("Error", "El nombre del cliente es obligatorio", "warning");
      return;
    }

    try {
      // Validar que no exista otro cliente con el mismo nombre
      const esValido = await validarDatos();
      if (!esValido) {
        Swal.fire("Error", "Ya existe un cliente con ese nombre", "warning");
        return;
      }

      const clienteData = {
        ...form,
        regiones: regiones.filter(region => region.region.trim() !== ""),
      };

      let resultado;
      if (editMode) {
        resultado = await actualizarCliente(clienteData);
      } else {
        resultado = await guardarCliente(clienteData);
      }

      if (resultado.success) {
        Swal.fire("Éxito", resultado.message, "success");
        limpiarFormulario();
        cargarClientes();
        // Opcional: Mostrar automáticamente la lista después de guardar
        // setMostrarLista(true);
      } else {
        Swal.fire("Error", resultado.message, "error");
      }
    } catch (error) {
      console.error("Error guardando cliente:", error);
      Swal.fire("Error", "Ocurrió un error al guardar el cliente", "error");
    }
  };

  const handleEdit = async (idCliente) => {
    try {
      setLoading(true);
      const data = await obtenerCliente(idCliente);
      
      if (data.error) {
        Swal.fire("Error", data.error, "error");
        return;
      }

      setForm({
        idCliente: data.cliente.Id_Cliente,
        nombre: data.cliente.Nombre,
        diasFechaSalida: data.cliente.DiasFechaSalida,
        diasFechaEnroute: data.cliente.DiasFechaEnroute,
        diasFechaDelivery: data.cliente.DiasFechaDelivery,
        diasFechaIngreso: data.cliente.DiasFechaIngreso,
      });

      // CORRECCIÓN: Mapear correctamente los nombres de campos de regiones
      const regionesMapeadas = (data.regiones || []).map(region => ({
        region: region.Region || "", // De Region (BD) a region (estado)
        direccion: region.Direccion || "", // De Direccion (BD) a direccion (estado)
        frecuencia: region.Frecuencia || "", // De Frecuencia (BD) a frecuencia (estado)
        idClienteRegion: region.Id_ClienteRegion // Mantener el ID si existe
      }));

      setRegiones(regionesMapeadas);
      setEditMode(true);
      setMostrarLista(false); // 👈 Ocultar lista cuando se edita
    } catch (error) {
      console.error("Error cargando cliente:", error);
      Swal.fire("Error", "No se pudo cargar el cliente", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">
          {editMode ? "Editar Cliente" : "Registrar Cliente"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datos básicos del cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del Cliente */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                name="nombre"
                placeholder="Ingrese el nombre del cliente"
                value={form.nombre}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Días para Fecha Salida */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Días para Fecha de Salida
              </label>
              <input
                type="number"
                name="diasFechaSalida"
                placeholder="0"
                value={form.diasFechaSalida}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            {/* Días para Fecha Enroute */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Días para Fecha Enroute
              </label>
              <input
                type="number"
                name="diasFechaEnroute"
                placeholder="0"
                value={form.diasFechaEnroute}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            {/* Días para Fecha Delivery */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Días para Fecha de Delivery
              </label>
              <input
                type="number"
                name="diasFechaDelivery"
                placeholder="0"
                value={form.diasFechaDelivery}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            {/* Días para Fecha Ingreso */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Días para Fecha de Ingreso
              </label>
              <input
                type="number"
                name="diasFechaIngreso"
                placeholder="0"
                value={form.diasFechaIngreso}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Regiones - MEJORADO PARA MÓVILES */}
          <div className="border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
              <h3 className="text-lg font-medium text-slate-700">Regiones del Cliente</h3>
              <button
                type="button"
                onClick={agregarRegion}
                className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition text-sm sm:text-base"
              >
                + Agregar Región
              </button>
            </div>

            {regiones.map((region, index) => (
              <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                {/* Número de región */}
                <div className="flex items-center mb-2">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Región {index + 1}
                  </span>
                </div>
                
                {/* Campos de región - MEJOR DISPOSICIÓN PARA MÓVILES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Nombre de la Región */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Región *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre de la región"
                      value={region.region}
                      onChange={(e) => handleRegionChange(index, "region", e.target.value)}
                      className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                  </div>

                  {/* Dirección */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Dirección de la región"
                      value={region.direccion}
                      onChange={(e) => handleRegionChange(index, "direccion", e.target.value)}
                      className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Frecuencia */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Frecuencia
                    </label>
                    <input
                      type="text"
                      placeholder="Frecuencia de entrega"
                      value={region.frecuencia}
                      onChange={(e) => handleRegionChange(index, "frecuencia", e.target.value)}
                      className="border rounded p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            {regiones.length === 0 && (
              <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sm">No hay regiones agregadas</p>
                <p className="text-xs mt-1">Haga clic en "Agregar Región" para comenzar</p>
              </div>
            )}
          </div>

          {/* Botones - MEJORADO PARA MÓVILES */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
            >
              {editMode ? "Actualizar Cliente" : "Guardar Cliente"}
            </button>
            
            {/* Botón para mostrar/ocultar lista */}
            <button
              type="button"
              onClick={toggleLista}
              className="bg-purple-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-purple-700 transition font-medium flex-1"
            >
              {mostrarLista ? "Ocultar Lista" : "Ver Clientes"}
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

      {/* Lista de clientes - SOLO VISIBLE CUANDO mostrarLista ES true */}
      {mostrarLista && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">
              Lista de Clientes ({clientes.length})
            </h2>
            <button
              onClick={toggleLista}
              className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition text-sm"
            >
              Cerrar
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-4">Cargando clientes...</p>
          ) : (
            <>
              {/* Tabla (solo en pantallas grandes) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border">Nombre</th>
                      <th className="p-2 border">Días Salida</th>
                      <th className="p-2 border">Días Enroute</th>
                      <th className="p-2 border">Días Delivery</th>
                      <th className="p-2 border">Días Ingreso</th>
                      <th className="p-2 border">Regiones</th>
                      <th className="p-2 border text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.length > 0 ? (
                      clientes.map((cliente) => (
                        <tr key={cliente.Id_Cliente} className="hover:bg-gray-50">
                          <td className="p-2 border font-medium">{cliente.Nombre}</td>
                          <td className="p-2 border text-center">{cliente.DiasFechaSalida}</td>
                          <td className="p-2 border text-center">{cliente.DiasFechaEnroute}</td>
                          <td className="p-2 border text-center">{cliente.DiasFechaDelivery}</td>
                          <td className="p-2 border text-center">{cliente.DiasFechaIngreso}</td>
                          <td className="p-2 border text-sm max-w-xs truncate" title={cliente.Regiones || "Sin regiones"}>
                            {cliente.Regiones || "Sin regiones"}
                          </td>
                          <td className="p-2 border text-center">
                            <button
                              onClick={() => handleEdit(cliente.Id_Cliente)}
                              className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition text-sm"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-gray-500">
                          No hay clientes registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas (solo en móvil) - MEJORADO */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <div
                      key={cliente.Id_Cliente}
                      className="border rounded-lg p-4 shadow-sm bg-white"
                    >
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-gray-700">Nombre:</span>
                          <p className="text-gray-900 font-medium mt-1">{cliente.Nombre}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Días Salida:</span>
                            <p className="font-medium">{cliente.DiasFechaSalida}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Días Enroute:</span>
                            <p className="font-medium">{cliente.DiasFechaEnroute}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Días Delivery:</span>
                            <p className="font-medium">{cliente.DiasFechaDelivery}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Días Ingreso:</span>
                            <p className="font-medium">{cliente.DiasFechaIngreso}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">Regiones:</span>
                          <p className="text-sm mt-1 text-gray-700">{cliente.Regiones || "Sin regiones"}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleEdit(cliente.Id_Cliente)}
                        className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition w-full text-sm font-medium"
                      >
                        Editar Cliente
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                    <p>No hay clientes registrados</p>
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