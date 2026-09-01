const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Comentarios";

export async function listarComentarios(idCliente) {
  try {
    const response = await fetch(`${BASE_URL}/ApiGetComentarios.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCliente: idCliente || 0 }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error al obtener comentarios");
    return data;
  } catch (error) {
    console.error("Error en listarComentarios:", error);
    throw error;
  }
}

export async function obtenerComentario(idComentario) {
  try {
    const response = await fetch(`${BASE_URL}/ApiGetComentario.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idComentario }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error al obtener comentario");
    return data;
  } catch (error) {
    console.error("Error en obtenerComentario:", error);
    throw error;
  }
}

export async function guardarComentario(comentario) {
  try {
    const response = await fetch(`${BASE_URL}/ApiGuardarComentario.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comentario),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en guardarComentario:", error);
    throw error;
  }
}

export async function modificarComentario(comentario) {
  try {
    const response = await fetch(`${BASE_URL}/ApiModificarComentario.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comentario),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en modificarComentario:", error);
    throw error;
  }
}

export async function getDatosSelect() {
  try {
    const response = await fetch(`${BASE_URL}/ApiGetDatosSelect.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Error al cargar datos del formulario");
    return data;
  } catch (error) {
    console.error("Error en getDatosSelect:", error);
    throw error;
  }
}