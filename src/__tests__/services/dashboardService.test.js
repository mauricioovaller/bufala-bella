// src/__tests__/services/dashboardService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  fetchDashboardData,
  fetchVentasRegionCliente,
  fetchClientesProducto,
  APPS_CONFIG,
} from "../../services/dashboard/dashboardService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
const mockFetchError = () =>
  global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

describe("APPS_CONFIG", () => {
  it("contiene la configuración de dibufala", () => {
    expect(APPS_CONFIG).toHaveProperty("dibufala");
    expect(APPS_CONFIG.dibufala).toHaveProperty("nombre");
  });

  it("contiene allseason y naturalpack", () => {
    expect(APPS_CONFIG).toHaveProperty("allseason");
    expect(APPS_CONFIG).toHaveProperty("naturalpack");
  });

  it("cada app tiene colores definidos", () => {
    Object.values(APPS_CONFIG).forEach((app) => {
      expect(app).toHaveProperty("colorCompras");
      expect(app).toHaveProperty("colorVentas");
    });
  });
});

describe("fetchDashboardData", () => {
  it("retorna datos del dashboard cuando la API responde con éxito", async () => {
    const mockData = {
      success: true,
      ventas: [{ mes: "Enero", valor: 1000000 }],
      kpis: { totalPedidos: 100 },
    };
    mockFetchOk(mockData);

    const result = await fetchDashboardData(
      "dibufala",
      "2026-01-01",
      "2026-04-30",
    );
    expect(result).toEqual(mockData);
    expect(result.success).toBe(true);
  });

  it("envía app, fechaInicio y fechaFin en el body", async () => {
    mockFetchOk({ success: true });
    await fetchDashboardData("dibufala", "2026-01-01", "2026-03-31");

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.app).toBe("dibufala");
    expect(body.fechaInicio).toBe("2026-01-01");
    expect(body.fechaFin).toBe("2026-03-31");
  });

  it("lanza error cuando la respuesta HTTP no es ok", async () => {
    mockFetchError();
    await expect(
      fetchDashboardData("dibufala", "2026-01-01", "2026-01-31"),
    ).rejects.toThrow("Error en la respuesta del servidor");
  });

  it("lanza error cuando success es false", async () => {
    mockFetchOk({ success: false, message: "Sin datos para el período" });
    await expect(
      fetchDashboardData("dibufala", "2026-01-01", "2026-01-31"),
    ).rejects.toThrow("Sin datos para el período");
  });

  it("lanza error genérico cuando success es false sin message", async () => {
    mockFetchOk({ success: false });
    await expect(
      fetchDashboardData("dibufala", "2026-01-01", "2026-01-31"),
    ).rejects.toThrow("Error en los datos recibidos");
  });
});

describe("fetchVentasRegionCliente", () => {
  it("retorna ventas por región para un cliente", async () => {
    const mockData = {
      success: true,
      regiones: [{ region: "Costa", total: 500000 }],
    };
    mockFetchOk(mockData);

    const result = await fetchVentasRegionCliente(
      5,
      "2026-01-01",
      "2026-04-30",
    );
    expect(result).toEqual(mockData);
  });

  it("envía idCliente, fechaInicio y fechaFin", async () => {
    mockFetchOk({ success: true });
    await fetchVentasRegionCliente(12, "2026-02-01", "2026-02-28");

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idCliente).toBe(12);
    expect(body.fechaInicio).toBe("2026-02-01");
    expect(body.fechaFin).toBe("2026-02-28");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError();
    await expect(
      fetchVentasRegionCliente(1, "2026-01-01", "2026-01-31"),
    ).rejects.toThrow("Error al obtener ventas por región");
  });
});

describe("fetchClientesProducto", () => {
  it("retorna datos de clientes para un producto", async () => {
    mockFetchOk({
      success: true,
      idProducto: 1,
      nombreProducto: "Mozzarella Orgánica",
      clientes: [
        {
          id: 1,
          nombre: "Supermercado A",
          cantidad: 5,
          valor: 3500000,
          pesoNeto: 120,
        },
        {
          id: 2,
          nombre: "Restaurante B",
          cantidad: 3,
          valor: 2800000,
          pesoNeto: 90,
        },
      ],
    });
    const result = await fetchClientesProducto(1, "2026-01-01", "2026-04-30");
    expect(result.success).toBe(true);
    expect(result.clientes).toBeInstanceOf(Array);
    expect(result.clientes.length).toBeGreaterThan(0);
  });

  it("cada cliente tiene id, nombre, cantidad, valor y pesoNeto", async () => {
    mockFetchOk({
      success: true,
      clientes: [
        {
          id: 2,
          nombre: "Restaurante B",
          cantidad: 3,
          valor: 2800000,
          pesoNeto: 90,
        },
      ],
    });
    const result = await fetchClientesProducto(2, "2026-01-01", "2026-04-30");
    result.clientes.forEach((cliente) => {
      expect(cliente).toHaveProperty("id");
      expect(cliente).toHaveProperty("nombre");
      expect(cliente).toHaveProperty("cantidad");
      expect(cliente).toHaveProperty("valor");
      expect(cliente).toHaveProperty("pesoNeto");
    });
  });

  it("lanza error cuando la API responde con success false", async () => {
    mockFetchOk({ success: false, message: "Producto no encontrado" });
    await expect(
      fetchClientesProducto(99, "2026-01-01", "2026-04-30"),
    ).rejects.toThrow("Producto no encontrado");
  });
});
