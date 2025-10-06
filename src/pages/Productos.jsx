import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  listarProductos,
  obtenerProducto,
  guardarProducto,
  actualizarProducto,
  validarProducto,
} from "../services/productosService";

export default function Productos() {
  const [form, setForm] = useState({
    idProducto: 0,
    descripProducto: "",
    descripFactura: "",
    codigoSiesa: "",
    codigoFDA: "",
    pesoGr: 0,
    factorPesoBruto: 0,
    activo: 1,
  });

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);

  // Cargar productos al iniciar
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await listarProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
      Swal.fire("Error", "No se pudieron cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleLista = () => {
    setMostrarLista(!mostrarLista);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const limpiarFormulario = () => {
    setForm({
      idProducto: 0,
      descripProducto: "",
      descripFactura: "",
      codigoSiesa: "",
      codigoFDA: "",
      pesoGr: 0,
      factorPesoBruto: 0,
      activo: 1,
    });
    setEditMode(false);
  };

  const validarDatos = async () => {
    const tipo = editMode ? "editar" : "nuevo";
    const res = await validarProducto(tipo, form.idProducto, form.codigoSiesa);
    return res.success;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!form.descripProducto.trim() || !form.descripFactura.trim() || !form.codigoSiesa.trim()) {
      Swal.fire("Error", "Todos los campos son obligatorios", "warning");
      return;
    }

    try {
      // Validar que no exista otro producto con el mismo código Siesa
      const esValido = await validarDatos();
      if (!esValido) {
        Swal.fire("Error", "Ya existe un producto con ese código Siesa", "warning");
        return;
      }

      let resultado;
      if (editMode) {
        resultado = await actualizarProducto(form);
      } else {
        resultado = await guardarProducto(form);
      }

      if (resultado.success) {
        Swal.fire("Éxito", resultado.message, "success");
        limpiarFormulario();
        cargarProductos();
      } else {
        Swal.fire("Error", resultado.message, "error");
      }
    } catch (error) {
      console.error("Error guardando producto:", error);
      Swal.fire("Error", "Ocurrió un error al guardar el producto", "error");
    }
  };

  const handleEdit = async (idProducto) => {
    try {
      setLoading(true);
      const data = await obtenerProducto(idProducto);
      
      if (data.error) {
        Swal.fire("Error", data.error, "error");
        return;
      }

      setForm({
        idProducto: data.Id_Producto,
        descripProducto: data.DescripProducto,
        descripFactura: data.DescripFactura,
        codigoSiesa: data.Codigo_Siesa,
        codigoFDA: data.Codigo_FDA,
        pesoGr: data.PesoGr,
        factorPesoBruto: data.FactorPesoBruto,
        activo: data.Activo,
      });

      setEditMode(true);
      setMostrarLista(false);
    } catch (error) {
      console.error("Error cargando producto:", error);
      Swal.fire("Error", "No se pudo cargar el producto", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">
          {editMode ? "Editar Producto" : "Registrar Producto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos del producto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descripción del Producto */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Descripción del Producto *
              </label>
              <input
                type="text"
                name="descripProducto"
                placeholder="Ingrese la descripción del producto"
                value={form.descripProducto}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Descripción para Factura */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Descripción para Factura *
              </label>
              <input
                type="text"
                name="descripFactura"
                placeholder="Ingrese la descripción para factura"
                value={form.descripFactura}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Código Siesa */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Código Siesa *
              </label>
              <input
                type="text"
                name="codigoSiesa"
                placeholder="Ingrese el código Siesa"
                value={form.codigoSiesa}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Código FDA */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Código FDA *
              </label>
              <input
                type="text"
                name="codigoFDA"
                placeholder="Ingrese el código FDA"
                value={form.codigoFDA}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Peso en Gramos */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Peso en Gramos *
              </label>
              <input
                type="number"
                step="0.01"
                name="pesoGr"
                placeholder="0.00"
                value={form.pesoGr}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Factor Peso Bruto */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Factor Peso Bruto *
              </label>
              <input
                type="number"
                step="0.01"
                name="factorPesoBruto"
                placeholder="0.00"
                value={form.factorPesoBruto}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Estado Activo */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Estado *
              </label>
              <select
                name="activo"
                value={form.activo}
                onChange={handleChange}
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
            >
              {editMode ? "Actualizar Producto" : "Guardar Producto"}
            </button>
            
            {/* Botón para mostrar/ocultar lista */}
            <button
              type="button"
              onClick={toggleLista}
              className="bg-purple-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-purple-700 transition font-medium flex-1"
            >
              {mostrarLista ? "Ocultar Lista" : "Ver Productos"}
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

      {/* Lista de productos - SOLO VISIBLE CUANDO mostrarLista ES true */}
      {mostrarLista && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">
              Lista de Productos ({productos.length})
            </h2>
            <button
              onClick={toggleLista}
              className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition text-sm"
            >
              Cerrar
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-4">Cargando productos...</p>
          ) : (
            <>
              {/* Tabla (solo en pantallas grandes) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border">Descripción</th>
                      <th className="p-2 border">Código Siesa</th>
                      <th className="p-2 border">Código FDA</th>
                      <th className="p-2 border">Peso (Gr)</th>
                      <th className="p-2 border">Factor</th>
                      <th className="p-2 border">Estado</th>
                      <th className="p-2 border text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length > 0 ? (
                      productos.map((producto) => (
                        <tr key={producto.Id_Producto} className="hover:bg-gray-50">
                          <td className="p-2 border font-medium" title={producto.DescripProducto}>
                            <div className="max-w-xs truncate">{producto.DescripProducto}</div>
                            <div className="text-xs text-gray-500 truncate">{producto.DescripFactura}</div>
                          </td>
                          <td className="p-2 border">{producto.Codigo_Siesa}</td>
                          <td className="p-2 border">{producto.Codigo_FDA}</td>
                          <td className="p-2 border text-right">{producto.PesoGr}</td>
                          <td className="p-2 border text-right">{producto.FactorPesoBruto}</td>
                          <td className="p-2 border text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              producto.Activo === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {producto.Activo === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="p-2 border text-center">
                            <button
                              onClick={() => handleEdit(producto.Id_Producto)}
                              className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition text-sm font-medium"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-gray-500">
                          No hay productos registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas (solo en móvil) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {productos.length > 0 ? (
                  productos.map((producto) => (
                    <div
                      key={producto.Id_Producto}
                      className="border rounded-lg p-4 shadow-sm bg-white"
                    >
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-gray-700">Descripción:</span>
                          <p className="text-gray-900 font-medium mt-1">{producto.DescripProducto}</p>
                          <p className="text-sm text-gray-600 mt-1">{producto.DescripFactura}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Código Siesa:</span>
                            <p className="font-medium">{producto.Codigo_Siesa}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Código FDA:</span>
                            <p className="font-medium">{producto.Codigo_FDA}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Peso (Gr):</span>
                            <p className="font-medium">{producto.PesoGr}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Factor:</span>
                            <p className="font-medium">{producto.FactorPesoBruto}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            producto.Activo === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {producto.Activo === 1 ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <button
                          onClick={() => handleEdit(producto.Id_Producto)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition w-full text-sm font-medium"
                        >
                          Editar Producto
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                    <p>No hay productos registrados</p>
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