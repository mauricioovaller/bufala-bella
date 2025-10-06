const BASE_URL = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Clientes";

// Listar todos los clientes
export async function listarClientes() {
  const res = await fetch(`${BASE_URL}/ApiGetClientes.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Error HTTP al listar clientes");
  }

  const data = await res.json();
  return data;
}

// Obtener cliente específico por ID
export async function obtenerCliente(idCliente) {
  const response = await fetch(`${BASE_URL}/ApiGetClienteEspecifico.php`, {
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

// Guardar nuevo cliente
export const guardarCliente = async (cliente) => {
  const response = await fetch(`${BASE_URL}/ApiGuardarCliente.php`, {
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

// Actualizar cliente existente
export const actualizarCliente = async (cliente) => {
  const response = await fetch(`${BASE_URL}/ApiModificarCliente.php`, {
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

// Validar cliente (evitar duplicados)
export const validarCliente = async (tipo, idCliente, nombre) => {
  const response = await fetch(`${BASE_URL}/ApiValidarCliente.php`, {
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