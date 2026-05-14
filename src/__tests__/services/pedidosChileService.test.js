// src/__tests__/services/pedidosChileService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  getDatosSelectChile,
  guardarPedidoChile,
  getPedidosChile,
  getPedidoChileEspecifico,
  actualizarPedidoChile,
  imprimirPedidoChile,
} from "../../services/pedidosChileService";

// Helper: mock de fetch que retorna JSON
const mockFetchJson = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });

// Helper: mock de fetch que retorna blob
const mockFetchBlob = (content = "PDF") =>
  global.fetch.mockResolvedValueOnce({
    ok: true,
    blob: async () => new Blob([content]),
  });

// ─────────────────────────────────────────────────────────────────────────────
describe("getDatosSelectChile", () => {
  it("retorna datos de selects iniciales", async () => {
    const mockData = {
      success: true,
      clientesChile: [{ Id_ClienteChile: 1, Nombre: "Globe Italia" }],
      productosChile: [
        { Id_ProductoChile: 1, DescripProducto: "Ciliegine 125g" },
      ],
      agencias: [],
      aerolineas: [],
    };
    mockFetchJson(mockData);

    const result = await getDatosSelectChile();
    expect(result.success).toBe(true);
    expect(result.clientesChile).toHaveLength(1);
    expect(result.productosChile[0].DescripProducto).toBe("Ciliegine 125g");
  });

  it("hace POST a ApiGetDatosSelect.php", async () => {
    mockFetchJson({ success: true });
    await getDatosSelectChile();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetDatosSelect.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(getDatosSelectChile()).rejects.toThrow("Network error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("guardarPedidoChile", () => {
  it("guarda el pedido y retorna idPedido y numero", async () => {
    const mockResp = { success: true, idPedido: 1, numero: "CHI-000001" };
    mockFetchJson(mockResp);

    const enc = { clienteId: 1, fechaRecepcionOrden: "2026-05-06" };
    const det = [{ productoId: 1, cantidadCajas: 10 }];
    const result = await guardarPedidoChile(enc, det);

    expect(result.success).toBe(true);
    expect(result.idPedido).toBe(1);
    expect(result.numero).toBe("CHI-000001");
  });

  it("envía encabezado y detalle en el body", async () => {
    mockFetchJson({ success: true, idPedido: 5 });

    const enc = { clienteId: 2, fechaRecepcionOrden: "2026-05-06" };
    const det = [{ productoId: 3, cantidadCajas: 5 }];
    await guardarPedidoChile(enc, det);

    const call = global.fetch.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.encabezado).toEqual(enc);
    expect(body.detalle).toEqual(det);
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("timeout"));
    await expect(guardarPedidoChile({}, [])).rejects.toThrow("timeout");
  });

  it("envía Content-Type application/json", async () => {
    mockFetchJson({ success: true, idPedido: 1 });
    await guardarPedidoChile({}, []);
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPedidosChile", () => {
  it("retorna la lista de pedidos Chile", async () => {
    const mockData = {
      success: true,
      pedidos: [
        {
          Id_EncabPedidoChile: 1,
          NombreCliente: "Globe Italia",
          NumeroOrden: "488",
        },
        {
          Id_EncabPedidoChile: 2,
          NombreCliente: "Globe Italia",
          NumeroOrden: "489",
        },
      ],
    };
    mockFetchJson(mockData);

    const result = await getPedidosChile();
    expect(result.success).toBe(true);
    expect(result.pedidos).toHaveLength(2);
    expect(result.pedidos[0].Id_EncabPedidoChile).toBe(1);
  });

  it("hace POST a ApiGetPedidosChile.php", async () => {
    mockFetchJson({ success: true, pedidos: [] });
    await getPedidosChile();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetPedidosChile.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(getPedidosChile()).rejects.toThrow("Network error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPedidoChileEspecifico", () => {
  const mockPedido = {
    success: true,
    encabezado: {
      Id_EncabPedidoChile: 1,
      Id_ClienteChile: 1,
      NumeroOrden: "488",
      FechaRecepcionOrden: "2026-05-01",
    },
    detalle: [
      {
        Id_ProductoChile: 1,
        Descripcion: "Ciliegine 125g",
        CantidadCajas: 10,
        EnvaseInternoxCaja: 8,
      },
    ],
  };

  it("retorna encabezado y detalle del pedido", async () => {
    mockFetchJson(mockPedido);
    const result = await getPedidoChileEspecifico(1);
    expect(result.success).toBe(true);
    expect(result.encabezado.Id_EncabPedidoChile).toBe(1);
    expect(result.detalle).toHaveLength(1);
  });

  it("envía idPedido en el body", async () => {
    mockFetchJson(mockPedido);
    await getPedidoChileEspecifico(42);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idPedido).toBe(42);
  });

  it("hace POST a ApiGetPedidoChile.php", async () => {
    mockFetchJson({ success: true, encabezado: {}, detalle: [] });
    await getPedidoChileEspecifico(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetPedidoChile.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("server error"));
    await expect(getPedidoChileEspecifico(1)).rejects.toThrow("server error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("actualizarPedidoChile", () => {
  it("actualiza el pedido y retorna success", async () => {
    mockFetchJson({ success: true, idPedido: 1 });
    const enc = { idPedido: 1, clienteId: 1 };
    const det = [{ productoId: 1, cantidadCajas: 5 }];
    const result = await actualizarPedidoChile(enc, det);
    expect(result.success).toBe(true);
  });

  it("envía encabezado y detalle en el body", async () => {
    mockFetchJson({ success: true });
    const enc = { idPedido: 3, clienteId: 1 };
    const det = [{ productoId: 2, cantidadCajas: 7 }];
    await actualizarPedidoChile(enc, det);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.encabezado.idPedido).toBe(3);
    expect(body.detalle[0].cantidadCajas).toBe(7);
  });

  it("hace POST a ApiActualizarPedidoChile.php", async () => {
    mockFetchJson({ success: true });
    await actualizarPedidoChile({}, []);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiActualizarPedidoChile.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("timeout"));
    await expect(actualizarPedidoChile({}, [])).rejects.toThrow("timeout");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("imprimirPedidoChile", () => {
  it("retorna un Blob cuando el servidor responde OK", async () => {
    mockFetchBlob("%PDF-1.4 ...");
    const result = await imprimirPedidoChile(1);
    expect(result).toBeInstanceOf(Blob);
  });

  it("hace POST a ApiImprimirListaEmpaqueChile.php con idPedido", async () => {
    mockFetchBlob();
    await imprimirPedidoChile(7);
    const call = global.fetch.mock.calls[0];
    expect(call[0]).toContain("ApiImprimirListaEmpaqueChile.php");
    const body = JSON.parse(call[1].body);
    expect(body.idPedido).toBe(7);
  });

  it("lanza error cuando la respuesta no es ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(imprimirPedidoChile(1)).rejects.toThrow(
      "Error al generar el PDF",
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(imprimirPedidoChile(1)).rejects.toThrow("Network error");
  });
});
