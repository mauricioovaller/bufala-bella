const API_BASE = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Inicio";

export async function obtenerResumenInicio() {
  try {
    const response = await fetch(`${API_BASE}/ApiResumenInicio.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try { const errorText = await response.text(); errorDetail += ` - ${errorText}`; } catch (e) {}
      throw new Error(errorDetail);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Error en la respuesta del servidor");
    return data;
  } catch (error) {
    console.error("Error en obtenerResumenInicio:", error);
    throw new Error(`No se pudo obtener el resumen de inicio: ${error.message}`);
  }
}
