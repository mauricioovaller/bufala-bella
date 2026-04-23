// src/__tests__/services/menuPrincipalService.test.js
import { describe, it, expect, vi } from "vitest";
import { getPermisos } from "../../services/menuPrincipal/menuPrincipalService";

const mockFetchOk = (data) =>
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => data });
const mockFetchError = (status = 500) =>
  global.fetch.mockResolvedValueOnce({ ok: false, status });

describe("getPermisos", () => {
  it("retorna array de rutas cuando la API responde con éxito", async () => {
    mockFetchOk({
      success: true,
      permisos: [
        { ruta: "/clientes" },
        { ruta: "/pedidos" },
        { ruta: "/facturacion" },
      ],
    });

    const result = await getPermisos();
    expect(result).toEqual(["/clientes", "/pedidos", "/facturacion"]);
  });

  it("retorna array vacío cuando success es false", async () => {
    mockFetchOk({ success: false });
    const result = await getPermisos();
    expect(result).toEqual([]);
  });

  it("retorna array vacío cuando permisos no es un array", async () => {
    mockFetchOk({ success: true, permisos: null });
    const result = await getPermisos();
    expect(result).toEqual([]);
  });

  it("extrae solo la propiedad ruta de cada permiso", async () => {
    mockFetchOk({
      success: true,
      permisos: [
        { ruta: "/productos", label: "Productos", icono: "📦" },
        { ruta: "/conductores", label: "Conductores", icono: "🚗" },
      ],
    });

    const result = await getPermisos();
    expect(result).toEqual(["/productos", "/conductores"]);
  });

  it("lanza error cuando HTTP no es ok", async () => {
    mockFetchError(403);
    await expect(getPermisos()).rejects.toThrow("Error HTTP: 403");
  });

  it("hace POST a ApiGetPermisos.php", async () => {
    mockFetchOk({ success: true, permisos: [] });
    await getPermisos();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("ApiGetPermisos.php"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lanza error en fallo de red", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(getPermisos()).rejects.toThrow("Network error");
  });
});
