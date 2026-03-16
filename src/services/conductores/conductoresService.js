// src/services/conductores/conductoresService.js
const BASE_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Conductores";

// Listar todos los conductores
export async function listarConductores() {
  const res = await fetch(`${BASE_URL}/ApiGetConductores.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Error HTTP al listar conductores");
  }

  const data = await res.json();
  return data;
}

// Obtener conductor específico por ID
export async function obtenerConductor(idConductor) {
  const response = await fetch(`${BASE_URL}/ApiGetConductorEspecifico.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idConductor }),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
}

// Guardar nuevo conductor
export const guardarConductor = async (conductor) => {
  const response = await fetch(`${BASE_URL}/ApiGuardarConductor.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(conductor),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};

// Actualizar conductor existente
export const actualizarConductor = async (conductor) => {
  const response = await fetch(`${BASE_URL}/ApiModificarConductor.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(conductor),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};

// Validar conductor (evitar duplicados por documento o placa)
export const validarConductor = async (tipo, idConductor, datos) => {
  // datos: { documento, nombre }
  const response = await fetch(`${BASE_URL}/ApiValidarConductor.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo,
      idConductor,
      documento: datos.documento,
      nombre: datos.nombre,
    }),
  });

  if (!response.ok) {
    throw new Error("Error en la conexión con el servidor");
  }

  const data = await response.json();
  return data;
};
