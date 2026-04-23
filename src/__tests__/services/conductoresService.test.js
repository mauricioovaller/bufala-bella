// src/__tests__/services/conductoresService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  listarConductores,
  obtenerConductor,
  guardarConductor,
  actualizarConductor,
  validarConductor,
} from "../../services/conductores/conductoresService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
const mockFetchError = (status = 500) =>
  global.fetch.mockResolvedValueOnce({ ok: false, status });

describe("listarConductores", () => {
  it("retorna la lista de conductores cuando la API responde ok", async () => {
    const mockData = {
      conductores: [
        { idConductor: 1, nombre: "Pedro García", documento: "12345678" },
      ],
    };
    mockFetchOk(mockData);

    const result = await listarConductores();
    expect(result).toEqual(mockData);
  });

  it("hace POST a ApiGetConductores.php", async () => {
    mockFetchOk({});
    await listarConductores();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetConductores.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(503);
    await expect(listarConductores()).rejects.toThrow(
      "Error HTTP al listar conductores",
    );
  });
});

describe("obtenerConductor", () => {
  it("retorna el conductor específico", async () => {
    const mockData = {
      success: true,
      conductor: { idConductor: 3, nombre: "Luis Mora" },
    };
    mockFetchOk(mockData);

    const result = await obtenerConductor(3);
    expect(result).toEqual(mockData);
  });

  it("envía idConductor en el body", async () => {
    mockFetchOk({ success: true });
    await obtenerConductor(9);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idConductor).toBe(9);
  });

  it("lanza error de conexión en HTTP no ok", async () => {
    mockFetchError(404);
    await expect(obtenerConductor(1)).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("guardarConductor", () => {
  it("guarda el conductor y retorna la respuesta", async () => {
    const mockResp = { success: true, idConductor: 50 };
    mockFetchOk(mockResp);

    const conductor = {
      nombre: "Nuevo Conductor",
      documento: "99887766",
      placa: "ABC123",
    };
    const result = await guardarConductor(conductor);
    expect(result).toEqual(mockResp);
  });

  it("envía los datos del conductor en el body", async () => {
    mockFetchOk({ success: true });
    const conductor = { nombre: "Test", documento: "11223344" };
    await guardarConductor(conductor);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.nombre).toBe("Test");
    expect(body.documento).toBe("11223344");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(400);
    await expect(guardarConductor({ nombre: "X" })).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("actualizarConductor", () => {
  it("actualiza el conductor y retorna la respuesta", async () => {
    const mockResp = { success: true, message: "Conductor actualizado" };
    mockFetchOk(mockResp);

    const result = await actualizarConductor({
      idConductor: 1,
      nombre: "Nombre Nuevo",
    });
    expect(result).toEqual(mockResp);
  });

  it("hace POST a ApiModificarConductor.php", async () => {
    mockFetchOk({});
    await actualizarConductor({ idConductor: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiModificarConductor.php"),
      expect.any(Object),
    );
  });
});

describe("validarConductor", () => {
  it("retorna resultado de validación para nuevo conductor", async () => {
    const mockResp = { existe: false };
    mockFetchOk(mockResp);

    const result = await validarConductor("nuevo", null, {
      documento: "12345",
      nombre: "Carlos",
    });
    expect(result).toEqual(mockResp);
  });

  it("envía tipo, idConductor, documento y nombre en el body", async () => {
    mockFetchOk({ existe: false });
    await validarConductor("editar", 5, { documento: "98765", nombre: "Ana" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipo).toBe("editar");
    expect(body.idConductor).toBe(5);
    expect(body.documento).toBe("98765");
    expect(body.nombre).toBe("Ana");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(500);
    await expect(
      validarConductor("nuevo", null, { documento: "X", nombre: "Y" }),
    ).rejects.toThrow("Error en la conexión con el servidor");
  });
});
