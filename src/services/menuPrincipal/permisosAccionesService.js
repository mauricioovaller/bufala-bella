const API_BASE =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api";

/**
 * Obtiene las acciones permitidas de un módulo para el usuario en sesión.
 * Si el usuario no tiene registros en PermisosAcciones → retorna [] (acceso completo).
 *
 * @param {string} modulo  Nombre del módulo, ej: 'consolidacion'
 * @returns {Promise<string[]>}  Array de acciones, ej: ['gestionar_fechas_readonly', 'costos_transporte_full']
 */
export async function getPermisosAccionesPorModulo(modulo) {
  try {
    const response = await fetch(
      `${API_BASE}/MenuPrincipal/ApiGetPermisosAcciones.php`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulo }),
      },
    );

    if (!response.ok) {
      console.warn(
        `[permisosAcciones] HTTP ${response.status} para módulo '${modulo}'`,
      );
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      console.warn(`[permisosAcciones] ${data.message}`);
      return [];
    }

    return data.acciones || [];
  } catch (error) {
    console.error("[permisosAcciones] Error al obtener permisos:", error);
    return []; // ante cualquier error, acceso completo (no bloquea usuarios)
  }
}
