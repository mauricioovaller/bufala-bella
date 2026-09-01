//src/services/productosChileService.js
const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/ProductosChile";

// Listar todos los productos Chile
export async function listarProductosChile() {
  const res = await fetch(`${BASE_URL}/ApiGetProductosChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Error HTTP al listar productos Chile");
  }

  const data = await res.json();
  return data;
}

// Obtener producto Chile específico por ID
export async function obtenerProductoChile(idProducto) {
  const response = await fetch(`${BASE_URL}/ApiGetProductoChileEspecifico.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProducto }),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
}

// Guardar nuevo producto Chile
export const guardarProductoChile = async (producto) => {
  const response = await fetch(`${BASE_URL}/ApiGuardarProductoChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};

// Actualizar producto Chile existente
export const actualizarProductoChile = async (producto) => {
  const response = await fetch(`${BASE_URL}/ApiModificarProductoChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};

// Validar producto Chile (evitar duplicados)
export const validarProductoChile = async (tipo, idProducto, codigoSiesa) => {
  const response = await fetch(`${BASE_URL}/ApiValidarProductoChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, idProducto, codigoSiesa }),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};
