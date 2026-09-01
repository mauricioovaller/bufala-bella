// src/services/notasCreditoService.js
const API_BASE = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/NotasCredito";

export async function getDatosSelect() {
  try {
    const res = await fetch(`${API_BASE}/ApiGetDatosSelect.php`, { method: "POST" });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar datos iniciales:", err);
    throw err;
  }
}

export async function getPedidosPorCliente(idCliente, fechaDesde = "", fechaHasta = "") {
  try {
    const res = await fetch(`${API_BASE}/ApiGetPedidosPorCliente.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCliente, fechaDesde, fechaHasta }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar pedidos del cliente:", err);
    throw err;
  }
}

export async function getDetallePedidosSeleccionados(idsPedidos) {
  try {
    const res = await fetch(`${API_BASE}/ApiGetDetallePedidosSeleccionados.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idsPedidos }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar detalle de pedidos:", err);
    throw err;
  }
}

export async function guardarNotaCredito(encabezado, detalle) {
  try {
    const res = await fetch(`${API_BASE}/ApiGuardarNotaCredito.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encabezado, detalle }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al guardar nota cr�dito:", err);
    throw err;
  }
}

export async function getNotasCredito(filtros = {}) {
  try {
    const res = await fetch(`${API_BASE}/ApiGetNotasCredito.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filtros),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar notas cr�dito:", err);
    throw err;
  }
}

export async function getNotaCreditoEspecifica(idNotaCredito) {
  try {
    const res = await fetch(`${API_BASE}/ApiGetNotaCredito.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idNotaCredito }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al cargar nota cr�dito:", err);
    throw err;
  }
}

export async function actualizarNotaCredito(encabezado, detalle) {
  try {
    const res = await fetch(`${API_BASE}/ApiActualizarNotaCredito.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encabezado, detalle }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al actualizar nota cr�dito:", err);
    throw err;
  }
}

export async function anularNotaCredito(idNotaCredito) {
  try {
    const res = await fetch(`${API_BASE}/ApiAnularNotaCredito.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idNotaCredito }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error al anular nota cr�dito:", err);
    throw err;
  }
}

export async function imprimirNotaCredito(idNotaCredito) {
  try {
    const res = await fetch(`${API_BASE}/ApiImprimirNotaCredito.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idNotaCredito }),
    });
    return await res.blob();
  } catch (err) {
    console.error("Error al generar PDF:", err);
    throw err;
  }
}
