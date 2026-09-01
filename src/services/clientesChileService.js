//src/services/clientesChileService.js
const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/ClientesChile";

// Listar todos los clientes Chile
export async function listarClientesChile() {
  const res = await fetch(`${BASE_URL}/ApiGetClientesChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Error HTTP al listar clientes Chile");
  }

  const data = await res.json();
  return data;
}

// Obtener cliente Chile específico por ID
export async function obtenerClienteChile(idCliente) {
  const response = await fetch(`${BASE_URL}/ApiGetClienteChileEspecifico.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idCliente }),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
}

// Guardar nuevo cliente Chile
export const guardarClienteChile = async (cliente) => {
  const response = await fetch(`${BASE_URL}/ApiGuardarClienteChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};

// Actualizar cliente Chile existente
export const actualizarClienteChile = async (cliente) => {
  const response = await fetch(`${BASE_URL}/ApiModificarClienteChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};

// Validar cliente Chile (evitar duplicados)
export const validarClienteChile = async (tipo, idCliente, nombre) => {
  const response = await fetch(`${BASE_URL}/ApiValidarClienteChile.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, idCliente, nombre }),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};
