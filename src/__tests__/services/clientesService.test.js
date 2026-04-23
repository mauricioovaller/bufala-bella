// src/__tests__/services/clientesService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  listarClientes,
  listarBodegas,
  obtenerCliente,
  guardarCliente,
  actualizarCliente,
  validarCliente,
} from "../../services/clientesService";

// Helper para crear una respuesta fetch exitosa
const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });

const mockFetchError = (status = 500) =>
  global.fetch.mockResolvedValueOnce({ ok: false, status });

// ─────────────────────────────────────────────
describe("listarClientes", () => {
  it("retorna datos de clientes cuando la API responde ok", async () => {
    const mockData = {
      clientes: [{ idCliente: 1, nombre: "Empresa A" }],
      bodegas: [],
    };
    mockFetchOk(mockData);

    const result = await listarClientes();
    expect(result).toEqual(mockData);
  });

  it("hace POST a la URL correcta", async () => {
    mockFetchOk({});
    await listarClientes();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetClientes.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error cuando HTTP no es ok", async () => {
    mockFetchError(404);
    await expect(listarClientes()).rejects.toThrow(
      "Error HTTP al listar clientes",
    );
  });
});

describe("listarBodegas", () => {
  it("retorna bodegas cuando la API responde ok", async () => {
    const mockData = { bodegas: [{ id: 1, nombre: "Bodega Central" }] };
    mockFetchOk(mockData);

    const result = await listarBodegas();
    expect(result).toEqual(mockData);
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(500);
    await expect(listarBodegas()).rejects.toThrow(
      "Error HTTP al listar clientes",
    );
  });
});

describe("obtenerCliente", () => {
  it("retorna datos del cliente específico", async () => {
    const mockData = {
      success: true,
      cliente: { idCliente: 5, nombre: "Cliente Específico" },
    };
    mockFetchOk(mockData);

    const result = await obtenerCliente(5);
    expect(result).toEqual(mockData);
  });

  it("envía el idCliente en el body", async () => {
    mockFetchOk({ success: true });
    await obtenerCliente(42);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idCliente).toBe(42);
  });

  it("lanza error de conexión en HTTP no ok", async () => {
    mockFetchError(503);
    await expect(obtenerCliente(1)).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("guardarCliente", () => {
  it("guarda el cliente y retorna la respuesta", async () => {
    const mockResp = { success: true, idCliente: 99 };
    mockFetchOk(mockResp);

    const cliente = { nombre: "Nuevo Cliente", diasFechaSalida: 3 };
    const result = await guardarCliente(cliente);
    expect(result).toEqual(mockResp);
  });

  it("envía los datos del cliente en el body", async () => {
    mockFetchOk({ success: true });
    const cliente = { nombre: "Test", diasFechaSalida: 1 };
    await guardarCliente(cliente);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.nombre).toBe("Test");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(500);
    await expect(guardarCliente({ nombre: "X" })).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("actualizarCliente", () => {
  it("actualiza el cliente y retorna la respuesta", async () => {
    const mockResp = { success: true, message: "Cliente actualizado" };
    mockFetchOk(mockResp);

    const result = await actualizarCliente({
      idCliente: 1,
      nombre: "Nombre Nuevo",
    });
    expect(result).toEqual(mockResp);
  });

  it("hace POST a la URL de modificar", async () => {
    mockFetchOk({});
    await actualizarCliente({ idCliente: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiModificarCliente.php"),
      expect.any(Object),
    );
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(400);
    await expect(actualizarCliente({ idCliente: 1 })).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("validarCliente", () => {
  it("retorna resultado de validación", async () => {
    const mockResp = { existe: false };
    mockFetchOk(mockResp);

    const result = await validarCliente("nuevo", null, "Empresa Única");
    expect(result).toEqual(mockResp);
  });

  it("envía tipo, idCliente y nombre en el body", async () => {
    mockFetchOk({ existe: false });
    await validarCliente("editar", 5, "Empresa");

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipo).toBe("editar");
    expect(body.idCliente).toBe(5);
    expect(body.nombre).toBe("Empresa");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(500);
    await expect(validarCliente("nuevo", null, "X")).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});
