import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  listarComentarios, obtenerComentario, guardarComentario,
  modificarComentario, getDatosSelect
} from "../services/comentariosService";

const FORM_VACIO = {
  idComentario: 0, idCliente: "", idClienteRegion: "",
  comentarioPrimario: "", comentarioSecundario: ""
};

const Comentarios = () => {
  const [comentarios, setComentarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [regionesFiltradas, setRegionesFiltradas] = useState([]);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [mostrandoLista, setMostrandoLista] = useState(false);

  const cargarComentarios = useCallback(async (idClienteFiltro) => {
    setLoading(true);
    try {
      const data = await listarComentarios(idClienteFiltro);
      if (data.success) {
        setComentarios(data.comentarios || []);
      }
    } catch {
      Swal.fire("Error", "No se pudieron cargar los comentarios.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarDatosIniciales = useCallback(async () => {
    setCargandoInicial(true);
    try {
      const [dataSelect] = await Promise.all([
        getDatosSelect(),
        listarComentarios(0)
      ]);
      if (dataSelect.success) {
        setClientes(dataSelect.clientes || []);
        setRegiones(dataSelect.regiones || []);
      }
    } catch {
      Swal.fire("Error", "No se pudieron cargar los datos iniciales.", "error");
    } finally {
      setCargandoInicial(false);
    }
  }, []);

  useEffect(() => { cargarDatosIniciales(); }, [cargarDatosIniciales]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "idCliente") {
      const filtradas = regiones.filter(r => String(r.Id_Cliente) === value);
      setRegionesFiltradas(filtradas);
      setForm(prev => ({ ...prev, idClienteRegion: "" }));
    }
  }, [regiones]);

  const handleFiltroChange = useCallback((e) => {
    const value = e.target.value;
    setFiltroCliente(value);
    cargarComentarios(value ? parseInt(value) : 0);
  }, [cargarComentarios]);

  const limpiarFormulario = useCallback(() => {
    setForm({ ...FORM_VACIO });
    setEditMode(false);
    setRegionesFiltradas([]);
  }, []);

  const handleEdit = useCallback(async (item) => {
    setLoading(true);
    try {
      let comentario = item;
      if (!item.ComentarioPrimario && !item.comentarioPrimario) {
        const data = await obtenerComentario(item.Id_Comentario || item.idComentario);
        if (data.success) comentario = data.comentario;
      }
      const filtradas = regiones.filter(r => String(r.Id_Cliente) === String(comentario.Id_Cliente));
      setRegionesFiltradas(filtradas);
      setForm({
        idComentario: comentario.Id_Comentario,
        idCliente: String(comentario.Id_Cliente),
        idClienteRegion: String(comentario.Id_ClienteRegion),
        comentarioPrimario: comentario.ComentarioPrimario || "",
        comentarioSecundario: comentario.ComentarioSecundario || ""
      });
      setEditMode(true);
      setMostrandoLista(false);
    } catch {
      Swal.fire("Error", "No se pudo cargar el comentario.", "error");
    } finally {
      setLoading(false);
    }
  }, [regiones]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.idCliente) {
      Swal.fire("Error", "Seleccione un cliente.", "warning");
      return;
    }
    if (!form.idClienteRegion) {
      Swal.fire("Error", "Seleccione una región.", "warning");
      return;
    }
    if (!form.comentarioPrimario.trim() && !form.comentarioSecundario.trim()) {
      Swal.fire("Error", "Debe escribir al menos un comentario.", "warning");
      return;
    }

    const data = {
      idCliente: parseInt(form.idCliente),
      idClienteRegion: parseInt(form.idClienteRegion),
      comentarioPrimario: form.comentarioPrimario.trim(),
      comentarioSecundario: form.comentarioSecundario.trim()
    };

    setLoading(true);
    try {
      let resultado;
      if (editMode) {
        data.idComentario = form.idComentario;
        resultado = await modificarComentario(data);
      } else {
        resultado = await guardarComentario(data);
      }
      if (resultado.success) {
        Swal.fire("Éxito", resultado.message, "success");
        limpiarFormulario();
        await cargarComentarios(filtroCliente ? parseInt(filtroCliente) : 0);
      } else {
        Swal.fire("Error", resultado.message, "warning");
      }
    } catch {
      Swal.fire("Error", "Ocurrió un error al procesar la solicitud.", "error");
    } finally {
      setLoading(false);
    }
  }, [form, editMode, cargarComentarios, filtroCliente, limpiarFormulario]);

  const clienteNombre = (id) => {
    const c = clientes.find(c => String(c.Id_Cliente) === String(id));
    return c ? c.Nombre : "-";
  };

  const regionNombre = (id) => {
    const r = regiones.find(r => String(r.Id_ClienteRegion) === String(id));
    return r ? r.Region : "-";
  };

  const mostrarAyuda = useCallback(() => {
    let synth = window.speechSynthesis;
    let utterando = false;

    const obtenerTexto = () => {
      const partes = [
        "¿Para qué sirve este módulo? Permite registrar comentarios personalizados para cada cliente y región. Estos comentarios aparecen automáticamente en los documentos de despacho cuando se imprime un pedido de ese cliente y región.",
        "Cómo crear un comentario: Primero, seleccione el cliente, se cargarán sus regiones automáticamente. Segundo, seleccione la región. Tercero, escriba el comentario primario, opcional, máximo 900 caracteres. Cuarto, escriba el comentario secundario, opcional, máximo 900 caracteres. Quinto, haga clic en Guardar.",
        "Cómo modificar un comentario: Primero, vaya a Ver Listado. Segundo, use el filtro por cliente si hay muchos registros. Tercero, haga clic en Editar sobre el comentario deseado. Cuarto, modifique los campos necesarios. Quinto, haga clic en Actualizar.",
        "Reglas importantes: Solo puede existir un comentario por cliente y región. Si ya existe un comentario para ese cliente y región, el sistema le informará y deberá usar Editar en el listado. No se pueden eliminar comentarios, solo crearlos o modificarlos. Los textos están limitados a 900 caracteres cada uno.",
        "¿Dónde se usan estos comentarios? Cuando se genera un BOL o documento de despacho para un pedido, el sistema busca automáticamente el comentario correspondiente al cliente y región del pedido y lo incluye en el PDF."
      ];
      return partes.join(". ");
    };

    const hablar = () => {
      if (utterando) {
        synth.cancel();
        utterando = false;
        const btn = document.getElementById("btn-audio-ayuda");
        if (btn) btn.textContent = "🔊 Escuchar";
        return;
      }
      if (!synth) return;
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(obtenerTexto());
      utt.lang = "es-ES";
      utt.rate = 0.9;
      const btn = document.getElementById("btn-audio-ayuda");
      utt.onstart = () => {
        utterando = true;
        if (btn) btn.textContent = "⏹ Detener";
      };
      utt.onend = () => {
        utterando = false;
        if (btn) btn.textContent = "🔊 Escuchar";
      };
      utt.onerror = () => {
        utterando = false;
        if (btn) btn.textContent = "🔊 Escuchar";
      };
      synth.speak(utt);
    };

    Swal.fire({
      title: "Gestión de Comentarios",
      html: `
        <div id="audio-controls" style="text-align:center;margin-bottom:12px;">
          <button id="btn-audio-ayuda" type="button"
            style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:8px 20px;font-size:14px;cursor:pointer;color:#374151;transition:all .2s;"
            onmouseover="this.style.background='#e5e7eb'"
            onmouseout="this.style.background='#f3f4f6'">
            🔊 Escuchar
          </button>
        </div>
        <div style="text-align: left; font-size: 14px; line-height: 1.6;">
          <p style="margin-bottom: 12px;">
            <strong>¿Para qué sirve este módulo?</strong><br>
            Permite registrar comentarios personalizados para cada <strong>Cliente + Región</strong>.
            Estos comentarios aparecen automáticamente en los <strong>documentos de despacho (BOL)</strong>
            cuando se imprime un pedido de ese cliente y región.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">

          <p style="margin-bottom: 8px;"><strong>📝 Cómo crear un comentario</strong></p>
          <ol style="padding-left: 20px; margin-bottom: 12px;">
            <li>Seleccione el <strong>Cliente</strong> (se cargarán sus regiones automáticamente)</li>
            <li>Seleccione la <strong>Región</strong></li>
            <li>Escriba el <strong>Comentario Primario</strong> (opcional, máx. 900 caracteres)</li>
            <li>Escriba el <strong>Comentario Secundario</strong> (opcional, máx. 900 caracteres)</li>
            <li>Haga clic en <strong>"Guardar"</strong></li>
          </ol>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">

          <p style="margin-bottom: 8px;"><strong>✏️ Cómo modificar un comentario</strong></p>
          <ol style="padding-left: 20px; margin-bottom: 12px;">
            <li>Vaya a <strong>"Ver Listado"</strong></li>
            <li>Use el filtro por cliente si hay muchos registros</li>
            <li>Haga clic en <strong>"Editar"</strong> sobre el comentario deseado</li>
            <li>Modifique los campos necesarios</li>
            <li>Haga clic en <strong>"Actualizar"</strong></li>
          </ol>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">

          <p style="margin-bottom: 8px;"><strong>⚠️ Reglas importantes</strong></p>
          <ul style="padding-left: 20px; margin-bottom: 12px;">
            <li>Solo puede existir <strong>un comentario por Cliente + Región</strong></li>
            <li>Si ya existe un comentario para ese cliente y región,
              el sistema le informará y deberá usar <strong>"Editar"</strong> en el listado</li>
            <li>No se pueden eliminar comentarios, solo crearlos o modificarlos</li>
            <li>Los textos están limitados a <strong>900 caracteres</strong> cada uno</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">

          <p style="margin-bottom: 8px;"><strong>🔗 ¿Dónde se usan estos comentarios?</strong></p>
          <p>
            Cuando se genera un <strong>BOL (Bill of Lading)</strong> o documento de despacho
            para un pedido, el sistema busca automáticamente el comentario correspondiente
            al cliente y región del pedido y lo incluye en el PDF si los checkboxes
            "Incluir Primario" / "Incluir Secundario" están activados en el pedido.
          </p>
        </div>
      `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2563EB",
      width: 600,
      didOpen: () => {
        const btn = document.getElementById("btn-audio-ayuda");
        if (btn) {
          if (!window.speechSynthesis) {
            btn.style.display = "none";
          } else {
            btn.addEventListener("click", hablar);
          }
        }
      },
      willClose: () => {
        if (synth) synth.cancel();
      },
    });
  }, []);

  if (cargandoInicial) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Comentarios por Cliente</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={mostrarAyuda}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-lg text-sm font-medium transition"
            title="Ayuda del módulo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17h.01" />
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
            </svg>
            <span className="hidden sm:inline">Ayuda</span>
          </button>
          {!mostrandoLista && (
            <button
              onClick={() => setMostrandoLista(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Ver Listado
            </button>
          )}
          {mostrandoLista && (
            <button
              onClick={() => setMostrandoLista(false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              Nuevo Comentario
            </button>
          )}
        </div>
      </div>

      {/* Formulario */}
      {!mostrandoLista && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {editMode ? "Editar Comentario" : "Registrar Comentario"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                <select
                  name="idCliente"
                  value={form.idCliente}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">-- Seleccione Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.Id_Cliente} value={c.Id_Cliente}>{c.Nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Región *</label>
                <select
                  name="idClienteRegion"
                  value={form.idClienteRegion}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">-- Seleccione Región --</option>
                  {regionesFiltradas.map(r => (
                    <option key={r.Id_ClienteRegion} value={r.Id_ClienteRegion}>{r.Region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Comentario Primario</label>
              <textarea
                name="comentarioPrimario"
                value={form.comentarioPrimario}
                onChange={handleChange}
                rows="4"
                maxLength="900"
                className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder="Escriba el comentario principal..."
              />
              <p className="text-xs text-gray-400 text-right">{form.comentarioPrimario.length}/900</p>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Comentario Secundario</label>
              <textarea
                name="comentarioSecundario"
                value={form.comentarioSecundario}
                onChange={handleChange}
                rows="4"
                maxLength="900"
                className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder="Escriba el comentario secundario..."
              />
              <p className="text-xs text-gray-400 text-right">{form.comentarioSecundario.length}/900</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {editMode ? "Actualizar" : "Guardar"}
              </button>
              {editMode && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Listado */}
      {mostrandoLista && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Comentarios Registrados</h2>
            <div className="sm:ml-auto">
              <select
                value={filtroCliente}
                onChange={handleFiltroChange}
                className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los clientes</option>
                {clientes.map(c => (
                  <option key={c.Id_Cliente} value={c.Id_Cliente}>{c.Nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && comentarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No hay comentarios registrados</p>
              <p className="text-sm mt-1">Use el botón "Nuevo Comentario" para agregar uno.</p>
            </div>
          )}

          {!loading && comentarios.length > 0 && (
            <>
              {/* Desktop: tabla */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-gray-600">
                      <th className="p-2 border-b font-semibold">Cliente</th>
                      <th className="p-2 border-b font-semibold">Región</th>
                      <th className="p-2 border-b font-semibold">Comentario Primario</th>
                      <th className="p-2 border-b font-semibold">Comentario Secundario</th>
                      <th className="p-2 border-b font-semibold text-center w-20">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comentarios.map(item => (
                      <tr key={item.Id_Comentario} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.NombreCliente}</td>
                        <td className="p-2 text-gray-600">{item.NombreRegion}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={item.ComentarioPrimario}>
                          {item.ComentarioPrimario || "-"}
                        </td>
                        <td className="p-2 text-xs max-w-xs truncate" title={item.ComentarioSecundario}>
                          {item.ComentarioSecundario || "-"}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {comentarios.map(item => (
                  <div key={item.Id_Comentario} className="border rounded-lg p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{item.NombreCliente}</p>
                        <p className="text-xs text-gray-500">{item.NombreRegion || "-"}</p>
                      </div>
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                    {item.ComentarioPrimario && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                        <span className="font-medium text-blue-700">Primario:</span>
                        <p className="mt-0.5">{item.ComentarioPrimario}</p>
                      </div>
                    )}
                    {item.ComentarioSecundario && (
                      <div className="mt-1 p-2 bg-purple-50 rounded text-xs text-gray-700">
                        <span className="font-medium text-purple-700">Secundario:</span>
                        <p className="mt-0.5">{item.ComentarioSecundario}</p>
                      </div>
                    )}
                    {!item.ComentarioPrimario && !item.ComentarioSecundario && (
                      <p className="text-xs text-gray-400 italic mt-2">Sin comentarios</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Comentarios;