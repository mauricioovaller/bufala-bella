// src/__tests__/services/correoService.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validarEmail,
  parsearListaEmails,
  formatearListaEmails,
  generarNombreFactura,
  generarVariablesFactura,
  obtenerDestinatarios,
  crearDestinatario,
  obtenerPlantillas,
} from "../../services/correoService";

// ─────────────────────────────────────────────
// FUNCIONES PURAS (sin red)
// ─────────────────────────────────────────────
describe("validarEmail", () => {
  it("acepta un email válido simple", () => {
    expect(validarEmail("usuario@dominio.com")).toBe(true);
  });

  it("acepta email con subdominios", () => {
    expect(validarEmail("user@mail.empresa.co")).toBe(true);
  });

  it("rechaza email sin @", () => {
    expect(validarEmail("usuariosinArroba.com")).toBe(false);
  });

  it("rechaza email sin dominio", () => {
    expect(validarEmail("usuario@")).toBe(false);
  });

  it("rechaza email vacío", () => {
    expect(validarEmail("")).toBe(false);
  });

  it("rechaza email con espacios", () => {
    expect(validarEmail("us er@dominio.com")).toBe(false);
  });

  it("rechaza null/undefined", () => {
    expect(validarEmail(null)).toBe(false);
    expect(validarEmail(undefined)).toBe(false);
  });
});

describe("parsearListaEmails", () => {
  it("parsea lista separada por comas", () => {
    const resultado = parsearListaEmails("a@a.com, b@b.com, c@c.com");
    expect(resultado).toEqual(["a@a.com", "b@b.com", "c@c.com"]);
  });

  it("parsea lista separada por punto y coma", () => {
    const resultado = parsearListaEmails("a@a.com;b@b.com");
    expect(resultado).toEqual(["a@a.com", "b@b.com"]);
  });

  it("parsea lista separada por saltos de línea", () => {
    const resultado = parsearListaEmails("a@a.com\nb@b.com");
    expect(resultado).toEqual(["a@a.com", "b@b.com"]);
  });

  it("filtra emails inválidos de la lista", () => {
    const resultado = parsearListaEmails(
      "valido@correo.com, invalido, otro@ok.net",
    );
    expect(resultado).toEqual(["valido@correo.com", "otro@ok.net"]);
  });

  it("retorna array vacío para texto vacío", () => {
    expect(parsearListaEmails("")).toEqual([]);
  });

  it("retorna array vacío para null", () => {
    expect(parsearListaEmails(null)).toEqual([]);
  });

  it("elimina espacios en blanco de cada email", () => {
    const resultado = parsearListaEmails("  a@a.com  ,  b@b.com  ");
    expect(resultado).toEqual(["a@a.com", "b@b.com"]);
  });
});

describe("formatearListaEmails", () => {
  it("une emails con coma y espacio", () => {
    expect(formatearListaEmails(["a@a.com", "b@b.com"])).toBe(
      "a@a.com, b@b.com",
    );
  });

  it("retorna string vacío para array vacío", () => {
    expect(formatearListaEmails([])).toBe("");
  });

  it("retorna email único sin separador", () => {
    expect(formatearListaEmails(["solo@correo.com"])).toBe("solo@correo.com");
  });
});

describe("generarNombreFactura", () => {
  it("genera nombre con número y cliente", () => {
    const nombre = generarNombreFactura({
      numero: "FAC-001",
      cliente: "Empresa SA",
    });
    // La función preserva el case del número pero lowercasea el cliente
    expect(nombre).toContain("FAC-001");
    expect(nombre).toContain("empresa-sa");
    expect(nombre).toMatch(/\.pdf$/);
  });

  it('usa "sin-numero" cuando no hay número', () => {
    const nombre = generarNombreFactura({ cliente: "Cliente X" });
    expect(nombre).toContain("sin-numero");
  });

  it('usa "cliente" cuando no hay cliente', () => {
    const nombre = generarNombreFactura({ numero: "FAC-002" });
    expect(nombre).toContain("cliente");
  });

  it('retorna "factura.pdf" para factura nula', () => {
    expect(generarNombreFactura(null)).toBe("factura.pdf");
  });

  it("incluye la fecha actual en el nombre", () => {
    const hoy = new Date().toISOString().split("T")[0];
    const nombre = generarNombreFactura({ numero: "FAC-003", cliente: "ABC" });
    expect(nombre).toContain(hoy);
  });
});

describe("generarVariablesFactura", () => {
  it("genera variables completas para una factura", () => {
    const factura = {
      numero: "FAC-100",
      cliente: "Empresa Test",
      fecha: "2026-04-21",
      valorTotal: 1500000,
    };
    const vars = generarVariablesFactura(factura);
    expect(vars.numero).toBe("FAC-100");
    expect(vars.cliente).toBe("Empresa Test");
    expect(vars.fecha).toBe("2026-04-21");
    expect(vars.valor).toContain("1.500.000");
  });

  it("incluye nombres de documentos seleccionados", () => {
    const factura = { numero: "FAC-101", valorTotal: 0 };
    const docs = [{ nombre: "Factura.pdf" }, { nombre: "BOL.pdf" }];
    const vars = generarVariablesFactura(factura, docs);
    expect(vars.adjuntos).toEqual(["Factura.pdf", "BOL.pdf"]);
  });

  it("maneja valor total como string numérico", () => {
    const factura = { numero: "FAC-102", valorTotal: "2000000" };
    const vars = generarVariablesFactura(factura);
    expect(vars.valor).toContain("2.000.000");
  });

  it('usa "$0" cuando valorTotal no es un número válido', () => {
    const factura = { numero: "FAC-103", valorTotal: "no-numero" };
    const vars = generarVariablesFactura(factura);
    expect(vars.valor).toBe("$0");
  });
});

// ─────────────────────────────────────────────
// FUNCIONES CON RED (fetch mock)
// ─────────────────────────────────────────────
describe("obtenerDestinatarios", () => {
  it("retorna datos cuando la API responde con éxito", async () => {
    const mockData = {
      success: true,
      destinatarios: [{ id: 1, email: "test@test.com" }],
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await obtenerDestinatarios();
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it("lanza error cuando success es false", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: "Error BD" }),
    });

    await expect(obtenerDestinatarios()).rejects.toThrow("Error BD");
  });

  it("lanza error cuando HTTP no es ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(obtenerDestinatarios()).rejects.toThrow("Error HTTP: 500");
  });

  it("pasa el tipo correcto en el body", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, destinatarios: [] }),
    });

    await obtenerDestinatarios("clientes");
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.tipo).toBe("clientes");
    expect(body.accion).toBe("listar");
  });
});

describe("crearDestinatario", () => {
  it("crea destinatario y retorna respuesta", async () => {
    const mockResp = { success: true, id: 10 };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResp,
    });

    const result = await crearDestinatario({
      email: "nuevo@test.com",
      nombre: "Nuevo",
    });
    expect(result).toEqual(mockResp);
  });

  it("lanza error en fallo HTTP", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(crearDestinatario({ email: "x@x.com" })).rejects.toThrow(
      "Error HTTP: 503",
    );
  });
});
