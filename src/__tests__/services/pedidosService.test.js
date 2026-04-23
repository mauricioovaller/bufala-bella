// src/__tests__/services/pedidosService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  getDatosSelect,
  getClienteRegion,
  validarPurchaseOrder,
  guardarPedido,
  getPedidos,
  getPedidoEspecifico,
  actualizarPedido,
} from "../../services/pedidosService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });

describe("getDatosSelect", () => {
  it("retorna datos de selects iniciales", async () => {
    const mockData = { clientes: [], productos: [], bodegas: [] };
    mockFetchOk(mockData);

    const result = await getDatosSelect();
    expect(result).toEqual(mockData);
  });

  it("hace POST a ApiGetDatosSelect.php", async () => {
    mockFetchOk({});
    await getDatosSelect();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetDatosSelect.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(getDatosSelect()).rejects.toThrow("Network error");
  });
});

describe("getClienteRegion", () => {
  it("retorna la región del cliente", async () => {
    const mockData = { success: true, region: "Costa", diasSalida: 5 };
    mockFetchOk(mockData);

    const result = await getClienteRegion(10);
    expect(result).toEqual(mockData);
  });

  it("envía clienteId en el body", async () => {
    mockFetchOk({});
    await getClienteRegion(25);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.clienteId).toBe(25);
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("timeout"));
    await expect(getClienteRegion(1)).rejects.toThrow("timeout");
  });
});

describe("validarPurchaseOrder", () => {
  it("retorna resultado de validación cuando PO no existe", async () => {
    const mockData = { existe: false };
    mockFetchOk(mockData);

    const result = await validarPurchaseOrder("PO-12345");
    expect(result.existe).toBe(false);
  });

  it("envía purchaseOrder y pedidoIdActual en el body", async () => {
    mockFetchOk({ existe: false });
    await validarPurchaseOrder("PO-99999", 42);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.purchaseOrder).toBe("PO-99999");
    expect(body.pedidoIdActual).toBe(42);
  });

  it("envía pedidoIdActual null por defecto", async () => {
    mockFetchOk({ existe: false });
    await validarPurchaseOrder("PO-001");

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.pedidoIdActual).toBeNull();
  });
});

describe("guardarPedido", () => {
  it("guarda el pedido y retorna la respuesta", async () => {
    const mockResp = { success: true, idPedido: 150 };
    mockFetchOk(mockResp);

    const encabezado = {
      cliente: 1,
      fecha: "2026-04-21",
      purchaseOrder: "PO-001",
    };
    const detalle = [{ producto: 1, cantidad: 10 }];
    const result = await guardarPedido(encabezado, detalle);
    expect(result).toEqual(mockResp);
  });

  it("envía encabezado y detalle en el body", async () => {
    mockFetchOk({ success: true });
    const enc = { cliente: 2, purchaseOrder: "PO-002" };
    const det = [{ producto: 3, cantidad: 5 }];
    await guardarPedido(enc, det);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.encabezado).toEqual(enc);
    expect(body.detalle).toEqual(det);
  });
});

describe("getPedidos", () => {
  it("retorna la lista de pedidos", async () => {
    const mockData = { success: true, pedidos: [{ id: 1 }, { id: 2 }] };
    mockFetchOk(mockData);

    const result = await getPedidos();
    expect(result).toEqual(mockData);
  });

  it("hace POST a ApiGetPedidos.php", async () => {
    mockFetchOk({});
    await getPedidos();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetPedidos.php"),
      expect.any(Object),
    );
  });
});

describe("getPedidoEspecifico", () => {
  it("retorna el pedido con su detalle", async () => {
    const mockData = {
      success: true,
      encabezado: { id: 55, cliente: "Empresa" },
      detalle: [{ producto: 1 }],
    };
    mockFetchOk(mockData);

    const result = await getPedidoEspecifico(55);
    expect(result).toEqual(mockData);
  });

  it("envía idPedido en el body", async () => {
    mockFetchOk({ success: true });
    await getPedidoEspecifico(77);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idPedido).toBe(77);
  });
});

describe("actualizarPedido", () => {
  it("actualiza el pedido y retorna la respuesta", async () => {
    const mockResp = { success: true, message: "Pedido actualizado" };
    mockFetchOk(mockResp);

    const result = await actualizarPedido({ id: 10 }, [{ producto: 1 }]);
    expect(result).toEqual(mockResp);
  });

  it("hace POST a ApiActualizarPedido.php", async () => {
    mockFetchOk({});
    await actualizarPedido({}, []);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiActualizarPedido.php"),
      expect.any(Object),
    );
  });
});
