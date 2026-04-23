// src/__tests__/services/facturacionService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  obtenerPedidosPorFecha,
  obtenerSamplesPorFecha,
  guardarFactura,
} from "../../services/facturacionService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
const mockFetchError = (status = 500) =>
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Error",
    text: async () => "",
  });

describe("obtenerPedidosPorFecha", () => {
  it("retorna pedidos cuando la API responde con éxito", async () => {
    const mockData = {
      success: true,
      pedidos: [
        { id: 1, numero: "PED-001", tipo: "normal" },
        { id: 2, numero: "PED-002", tipo: "normal" },
      ],
    };
    mockFetchOk(mockData);

    const result = await obtenerPedidosPorFecha({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
    });
    expect(result.pedidos).toHaveLength(2);
    expect(result.success).toBe(true);
  });

  it("envía fechaDesde y fechaHasta en el body", async () => {
    mockFetchOk({ success: true, pedidos: [] });
    await obtenerPedidosPorFecha({
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-01-31",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.fechaDesde).toBe("2026-01-01");
    expect(body.fechaHasta).toBe("2026-01-31");
  });

  it("lanza error cuando success es false", async () => {
    mockFetchOk({ success: false, message: "Sin resultados" });
    await expect(
      obtenerPedidosPorFecha({
        fechaDesde: "2026-01-01",
        fechaHasta: "2026-01-31",
      }),
    ).rejects.toThrow();
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(503);
    await expect(
      obtenerPedidosPorFecha({
        fechaDesde: "2026-01-01",
        fechaHasta: "2026-01-31",
      }),
    ).rejects.toThrow();
  });
});

describe("obtenerSamplesPorFecha", () => {
  it("filtra pedidos con prefijo SMP- del resultado", async () => {
    const mockData = {
      success: true,
      pedidos: [
        { id: 1, numero: "SMP-001", tipo: "SMP" },
        { id: 2, numero: "PED-002", tipo: "normal" },
        { id: 3, numero: "SMP-003", tipo: "SMP" },
      ],
    };
    mockFetchOk(mockData);

    const result = await obtenerSamplesPorFecha({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
    });
    expect(result.pedidos).toHaveLength(2);
    expect(result.pedidos.every((p) => p.numero.startsWith("SMP-"))).toBe(true);
  });

  it("retorna pedidos vacíos si no hay samples", async () => {
    const mockData = {
      success: true,
      pedidos: [{ id: 1, numero: "PED-001", tipo: "normal" }],
    };
    mockFetchOk(mockData);

    const result = await obtenerSamplesPorFecha({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
    });
    expect(result.pedidos).toHaveLength(0);
  });

  it("actualiza el total con la cantidad filtrada", async () => {
    const mockData = {
      success: true,
      pedidos: [
        { id: 1, numero: "SMP-001", tipo: "SMP" },
        { id: 2, numero: "PED-002", tipo: "normal" },
      ],
      total: 2,
    };
    mockFetchOk(mockData);

    const result = await obtenerSamplesPorFecha({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
    });
    expect(result.total).toBe(1);
  });
});

describe("guardarFactura", () => {
  it("guarda la factura y retorna la respuesta del servidor", async () => {
    const mockResp = { success: true, idFactura: 55, numeroFactura: "FAC-055" };
    mockFetchOk(mockResp);

    const result = await guardarFactura(
      { cliente: "Empresa", fecha: "2026-04-21" },
      [1, 2, 3],
    );
    expect(result).toEqual(mockResp);
  });

  it('envía tipoPedido "normal" por defecto', async () => {
    mockFetchOk({ success: true });
    await guardarFactura({ cliente: "Test" }, [1]);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipoPedido).toBe("normal");
    expect(body.encabezado.tipoPedido).toBe("normal");
  });

  it("acepta tipoPedido personalizado", async () => {
    mockFetchOk({ success: true });
    await guardarFactura({ cliente: "Test" }, [5], "SMP");

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipoPedido).toBe("SMP");
  });

  it("envía los IDs de pedidos correctamente", async () => {
    mockFetchOk({ success: true });
    const ids = [10, 20, 30];
    await guardarFactura({ cliente: "X" }, ids);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.pedidosIds).toEqual(ids);
  });
});
