// src/__tests__/services/consolidacionService.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generarExcelConsolidacion,
  generarReporteProduccion,
  generarReporteEmpaque,
} from "../../services/consolidacionService";

// Mock de las APIs del navegador para descarga de archivos
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateElement = vi.fn(() => ({
  href: "",
  setAttribute: vi.fn(),
  click: mockClick,
}));

beforeEach(() => {
  document.body.appendChild = mockAppendChild;
  document.body.removeChild = mockRemoveChild;
  document.createElement = mockCreateElement;
});

const mockFetchBlob = () => {
  const mockBlob = new Blob(["contenido excel"], {
    type: "application/vnd.ms-excel",
  });
  global.fetch.mockResolvedValueOnce({
    ok: true,
    blob: async () => mockBlob,
    headers: {
      get: vi.fn((header) =>
        header === "Content-Disposition"
          ? 'attachment; filename="Consolidacion.xlsx"'
          : null,
      ),
    },
  });
};

const mockFetchBlobNoHeader = () => {
  const mockBlob = new Blob(["datos"]);
  global.fetch.mockResolvedValueOnce({
    ok: true,
    blob: async () => mockBlob,
    headers: { get: vi.fn(() => null) },
  });
};

describe("generarExcelConsolidacion", () => {
  it("retorna success true al generar el Excel correctamente", async () => {
    mockFetchBlob();
    const result = await generarExcelConsolidacion({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
      tipoFecha: "salida",
    });
    expect(result.success).toBe(true);
  });

  it("envía fechaDesde, fechaHasta y tipoFecha en el body", async () => {
    mockFetchBlob();
    await generarExcelConsolidacion({
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-01-31",
      tipoFecha: "ingreso",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.fechaDesde).toBe("2026-01-01");
    expect(body.fechaHasta).toBe("2026-01-31");
    expect(body.tipoFecha).toBe("ingreso");
  });

  it("usa nombre de archivo del header Content-Disposition", async () => {
    mockFetchBlob();
    const result = await generarExcelConsolidacion({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
      tipoFecha: "salida",
    });
    expect(result.success).toBe(true);
  });

  it("usa nombre por defecto si no hay Content-Disposition", async () => {
    mockFetchBlobNoHeader();
    const result = await generarExcelConsolidacion({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
      tipoFecha: "salida",
    });
    expect(result.success).toBe(true);
  });

  it("lanza error en HTTP no ok", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Error interno" }),
    });

    await expect(
      generarExcelConsolidacion({
        fechaDesde: "2026-01-01",
        fechaHasta: "2026-01-31",
        tipoFecha: "salida",
      }),
    ).rejects.toThrow();
  });
});

describe("generarReporteProduccion", () => {
  it("retorna un Blob cuando la API responde ok", async () => {
    const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    });

    const result = await generarReporteProduccion({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
      tipoFecha: "salida",
    });
    expect(result).toBeInstanceOf(Blob);
  });

  it("lanza error en HTTP no ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(
      generarReporteProduccion({
        fechaDesde: "2026-01-01",
        fechaHasta: "2026-01-31",
        tipoFecha: "salida",
      }),
    ).rejects.toThrow("Error al generar el reporte de producción");
  });

  it("envía los filtros correctos", async () => {
    const mockBlob = new Blob(["datos"]);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    });

    await generarReporteProduccion({
      fechaDesde: "2026-02-01",
      fechaHasta: "2026-02-28",
      tipoFecha: "ingreso",
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipoFecha).toBe("ingreso");
  });
});

describe("generarReporteEmpaque", () => {
  it("retorna un Blob cuando la API responde ok", async () => {
    const mockBlob = new Blob(["empaque content"]);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    });

    const result = await generarReporteEmpaque({
      fechaDesde: "2026-04-01",
      fechaHasta: "2026-04-30",
      tipoFecha: "salida",
    });
    expect(result).toBeInstanceOf(Blob);
  });

  it("lanza error en HTTP no ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(
      generarReporteEmpaque({
        fechaDesde: "2026-01-01",
        fechaHasta: "2026-01-31",
        tipoFecha: "salida",
      }),
    ).rejects.toThrow();
  });
});
