// src/__tests__/services/productosService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  listarProductos,
  obtenerProducto,
  guardarProducto,
  actualizarProducto,
  validarProducto,
} from "../../services/productosService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
const mockFetchError = (status = 500) =>
  global.fetch.mockResolvedValueOnce({ ok: false, status });

describe("listarProductos", () => {
  it("retorna la lista de productos cuando la API responde ok", async () => {
    const mockData = {
      productos: [{ idProducto: 1, codigoSiesa: "P001", nombre: "Mozarella" }],
    };
    mockFetchOk(mockData);

    const result = await listarProductos();
    expect(result).toEqual(mockData);
  });

  it("hace POST a ApiGetProductos.php", async () => {
    mockFetchOk({});
    await listarProductos();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetProductos.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(503);
    await expect(listarProductos()).rejects.toThrow(
      "Error HTTP al listar productos",
    );
  });
});

describe("obtenerProducto", () => {
  it("retorna el producto específico", async () => {
    const mockData = {
      success: true,
      producto: { idProducto: 3, nombre: "Ricotta" },
    };
    mockFetchOk(mockData);

    const result = await obtenerProducto(3);
    expect(result).toEqual(mockData);
  });

  it("envía idProducto en el body", async () => {
    mockFetchOk({ success: true });
    await obtenerProducto(7);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idProducto).toBe(7);
  });

  it("lanza error de conexión en HTTP no ok", async () => {
    mockFetchError(404);
    await expect(obtenerProducto(1)).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("guardarProducto", () => {
  it("guarda el producto y retorna la respuesta", async () => {
    const mockResp = { success: true, idProducto: 20 };
    mockFetchOk(mockResp);

    const producto = { codigoSiesa: "P010", nombre: "Burrata" };
    const result = await guardarProducto(producto);
    expect(result).toEqual(mockResp);
  });

  it("envía los datos del producto en el body", async () => {
    mockFetchOk({ success: true });
    const producto = { codigoSiesa: "P011", nombre: "Queso Fresco" };
    await guardarProducto(producto);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.nombre).toBe("Queso Fresco");
    expect(body.codigoSiesa).toBe("P011");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(400);
    await expect(guardarProducto({ nombre: "X" })).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("actualizarProducto", () => {
  it("actualiza el producto y retorna la respuesta", async () => {
    const mockResp = { success: true, message: "Producto actualizado" };
    mockFetchOk(mockResp);

    const result = await actualizarProducto({
      idProducto: 1,
      nombre: "Nuevo Nombre",
    });
    expect(result).toEqual(mockResp);
  });

  it("hace POST a ApiModificarProducto.php", async () => {
    mockFetchOk({});
    await actualizarProducto({ idProducto: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiModificarProducto.php"),
      expect.any(Object),
    );
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(500);
    await expect(actualizarProducto({ idProducto: 1 })).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});

describe("validarProducto", () => {
  it("retorna resultado de validación para nuevo producto", async () => {
    const mockResp = { existe: false };
    mockFetchOk(mockResp);

    const result = await validarProducto("nuevo", null, "COD-001");
    expect(result).toEqual(mockResp);
  });

  it("envía tipo, idProducto y codigoSiesa en el body", async () => {
    mockFetchOk({ existe: true });
    await validarProducto("editar", 5, "COD-002");

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipo).toBe("editar");
    expect(body.idProducto).toBe(5);
    expect(body.codigoSiesa).toBe("COD-002");
  });

  it("lanza error en HTTP no ok", async () => {
    mockFetchError(500);
    await expect(validarProducto("nuevo", null, "X")).rejects.toThrow(
      "Error en la conexión con el servidor",
    );
  });
});
