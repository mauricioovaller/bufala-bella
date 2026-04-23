// src/__tests__/services/produccionService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  getLotes,
  guardarLote,
  eliminarLote,
  getResponsables,
  guardarResponsable,
  eliminarResponsable,
} from "../../services/produccion/produccionService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });

describe("getLotes", () => {
  it("retorna lotes activos por defecto", async () => {
    const mockData = { success: true, lotes: [{ id: 1, nombre: "L-001" }] };
    mockFetchOk(mockData);

    const result = await getLotes();
    expect(result).toEqual(mockData);
  });

  it("envía soloActivos=true por defecto", async () => {
    mockFetchOk({ success: true, lotes: [] });
    await getLotes();

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.soloActivos).toBe(true);
  });

  it("envía soloActivos=false cuando se pide todos los lotes", async () => {
    mockFetchOk({ success: true, lotes: [] });
    await getLotes(false);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.soloActivos).toBe(false);
  });

  it("hace POST a ApiGetLotes.php", async () => {
    mockFetchOk({});
    await getLotes();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetLotes.php"),
      expect.any(Object),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(getLotes()).rejects.toThrow("Network error");
  });
});

describe("guardarLote", () => {
  it("guarda el lote y retorna la respuesta", async () => {
    const mockResp = { success: true, idLote: 5 };
    mockFetchOk(mockResp);

    const result = await guardarLote({
      nombre: "Lote Nuevo",
      fecha: "2026-04-21",
    });
    expect(result).toEqual(mockResp);
  });

  it("envía los datos del lote en el body", async () => {
    mockFetchOk({ success: true });
    const loteData = { nombre: "Test Lote", cantidad: 100 };
    await guardarLote(loteData);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.nombre).toBe("Test Lote");
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("timeout"));
    await expect(guardarLote({ nombre: "X" })).rejects.toThrow("timeout");
  });
});

describe("eliminarLote", () => {
  it("elimina el lote y retorna confirmación", async () => {
    const mockResp = { success: true, message: "Lote eliminado" };
    mockFetchOk(mockResp);

    const result = await eliminarLote(3);
    expect(result).toEqual(mockResp);
  });

  it("envía idLote en el body", async () => {
    mockFetchOk({ success: true });
    await eliminarLote(7);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idLote).toBe(7);
  });
});

describe("getResponsables", () => {
  it("retorna responsables activos por defecto", async () => {
    const mockData = {
      success: true,
      responsables: [{ id: 1, nombre: "Ana López" }],
    };
    mockFetchOk(mockData);

    const result = await getResponsables();
    expect(result).toEqual(mockData);
  });

  it("envía soloActivos=true por defecto", async () => {
    mockFetchOk({ success: true, responsables: [] });
    await getResponsables();

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.soloActivos).toBe(true);
  });

  it("hace POST a ApiGetResponsables.php", async () => {
    mockFetchOk({});
    await getResponsables();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetResponsables.php"),
      expect.any(Object),
    );
  });
});

describe("guardarResponsable", () => {
  it("guarda el responsable y retorna la respuesta", async () => {
    const mockResp = { success: true, idResponsable: 8 };
    mockFetchOk(mockResp);

    const result = await guardarResponsable({ nombre: "Carlos Ruiz" });
    expect(result).toEqual(mockResp);
  });

  it("envía los datos del responsable en el body", async () => {
    mockFetchOk({ success: true });
    await guardarResponsable({ nombre: "Responsable Test", cargo: "Operario" });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.nombre).toBe("Responsable Test");
  });
});

describe("eliminarResponsable", () => {
  it("elimina el responsable y retorna confirmación", async () => {
    const mockResp = { success: true, message: "Responsable eliminado" };
    mockFetchOk(mockResp);

    const result = await eliminarResponsable(4);
    expect(result).toEqual(mockResp);
  });

  it("envía idResponsable en el body", async () => {
    mockFetchOk({ success: true });
    await eliminarResponsable(12);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idResponsable).toBe(12);
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("timeout"));
    await expect(eliminarResponsable(1)).rejects.toThrow("timeout");
  });
});
