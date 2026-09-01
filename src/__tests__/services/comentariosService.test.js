import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listarComentarios, obtenerComentario, guardarComentario,
  modificarComentario, getDatosSelect
} from "../../services/comentariosService";

const API_BASE = "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Comentarios";

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("listarComentarios", () => {
  it("retorna comentarios cuando la API responde con éxito", async () => {
    const mockRespuesta = { success: true, comentarios: [{ Id_Comentario: 1 }], total: 1 };
    global.fetch.mockResolvedValue({ ok: true, json: async () => mockRespuesta });

    const resultado = await listarComentarios(0);
    expect(resultado.comentarios).toHaveLength(1);
    expect(resultado.comentarios[0].Id_Comentario).toBe(1);
  });

  it("envía idCliente en el body cuando se especifica", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, comentarios: [] }) });

    await listarComentarios(5);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.idCliente).toBe(5);
  });

  it("lanza error cuando la respuesta HTTP no es ok", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(listarComentarios(0)).rejects.toThrow();
  });

  it("lanza error cuando success es false", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: false, message: "Error de BD" }) });
    await expect(listarComentarios(0)).rejects.toThrow("Error de BD");
  });
});

describe("obtenerComentario", () => {
  it("retorna el comentario cuando existe", async () => {
    const mock = { success: true, comentario: { Id_Comentario: 1, ComentarioPrimario: "Test" } };
    global.fetch.mockResolvedValue({ ok: true, json: async () => mock });

    const res = await obtenerComentario(1);
    expect(res.comentario.ComentarioPrimario).toBe("Test");
  });
});

describe("guardarComentario", () => {
  it("guarda y retorna resultado exitoso", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, message: "Guardado", idComentario: 1 }) });

    const res = await guardarComentario({ idCliente: 1, idClienteRegion: 2, comentarioPrimario: "Test" });
    expect(res.success).toBe(true);
    expect(res.idComentario).toBe(1);
  });
});

describe("modificarComentario", () => {
  it("modifica y retorna resultado exitoso", async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, message: "Actualizado" }) });

    const res = await modificarComentario({ idComentario: 1, idCliente: 1, idClienteRegion: 2, comentarioPrimario: "Test" });
    expect(res.success).toBe(true);
  });
});

describe("getDatosSelect", () => {
  it("retorna clientes y regiones", async () => {
    const mock = { success: true, clientes: [{ Id_Cliente: 1, Nombre: "Cliente A" }], regiones: [{ Id_ClienteRegion: 1, Region: "OHIO" }] };
    global.fetch.mockResolvedValue({ ok: true, json: async () => mock });

    const res = await getDatosSelect();
    expect(res.clientes).toHaveLength(1);
    expect(res.regiones).toHaveLength(1);
  });
});