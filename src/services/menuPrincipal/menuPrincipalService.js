// src/services/menuPrincipal/menuPrincipalService.js

export async function getPermisos() {
  try {
    const res = await fetch(
      "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/MenuPrincipal/ApiGetPermisos.php",
      {
        method: "POST",
        credentials: "include", // 👈 Necesario para enviar la cookie de sesión
      }
    );

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();

    // Aquí asumimos que la respuesta tiene la misma estructura que en la otra app:
    // { success: true, permisos: [{ ruta: "/clientes" }, ...] }
    // O quizás directamente un array de rutas. Adapta según tu caso.
    // Si es un array de objetos con propiedad 'ruta', extraemos solo las rutas.
    if (data.success && Array.isArray(data.permisos)) {
      return data.permisos.map(p => p.ruta); // devolvemos un array de strings con las rutas
    } else {
      return []; // Si no hay permisos o la estructura es diferente, devolvemos array vacío
    }
  } catch (err) {
    console.error("Error al cargar permisos:", err);
    throw err; // Re-lanzamos para manejarlo en el componente
  }
}