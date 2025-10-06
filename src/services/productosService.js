const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Productos";

// Listar todos los productos
export async function listarProductos() {
  const res = await fetch(`${BASE_URL}/ApiGetProductos.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Error HTTP al listar productos");
  }

  const data = await res.json();
  return data;
}

// Obtener producto específico por ID
export async function obtenerProducto(idProducto) {
  const response = await fetch(`${BASE_URL}/ApiGetProductoEspecifico.php`, {
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

// Guardar nuevo producto
export const guardarProducto = async (producto) => {
  const response = await fetch(`${BASE_URL}/ApiGuardarProducto.php`, {
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

// Actualizar producto existente
export const actualizarProducto = async (producto) => {
  const response = await fetch(`${BASE_URL}/ApiModificarProducto.php`, {
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

// Validar producto (evitar duplicados)
export const validarProducto = async (tipo, idProducto, codigoSiesa) => {
  const response = await fetch(`${BASE_URL}/ApiValidarProducto.php`, {
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