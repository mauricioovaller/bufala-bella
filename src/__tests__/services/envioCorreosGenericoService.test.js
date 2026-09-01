// src/__tests__/services/envioCorreosGenericoService.test.js
import { describe, it, expect, vi } from "vitest";
import {
  generarDocumentosModulo,
  obtenerDocumentosDisponibles,
} from "../../services/envioCorreosGenericoService";

describe("obtenerDocumentosDisponibles - facturación", () => {
  it("registra los documentos base y los anexos Chile", () => {
    const docs = obtenerDocumentosDisponibles("facturacion");

    expect(docs.factura).toBeDefined();
    expect(docs["carta-policia"]).toBeDefined();
    expect(docs["carta-aerolinea"]).toBeDefined();
    expect(docs["plan-vallejo"]).toBeDefined();
    expect(docs["reporte-despacho"]).toBeDefined();
    expect(docs["autodeclaracion-chile"]).toBeDefined();
    expect(docs["planilla-aerolinea"]).toBeDefined();
    expect(docs["carta-dataloger"]).toBeDefined();
    expect(docs["solicitud-ica"]).toBeDefined();
    expect(docs["certificado-tratamiento"]).toBeDefined();
    expect(docs["tabla-hc-lacteos"]).toBeDefined();
  });
});

describe("generarDocumentosModulo - facturación Chile", () => {
  const facturaChile = {
    id: 100,
    numero: "FEX-100",
    tipoPedido: "chile",
    Id_Planilla: 7,
  };

  const idsChile = [
    "factura",
    "carta-aerolinea",
    "carta-policia",
    "reporte-despacho",
    "plan-vallejo",
    "autodeclaracion-chile",
    "planilla-aerolinea",
    "carta-dataloger",
    "solicitud-ica",
    "certificado-tratamiento",
    "tabla-hc-lacteos",
  ];

  it("genera la factura y los 10 anexos Chile con nombres PDF", async () => {
    const generador = vi.fn(async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }));

    const archivos = await generarDocumentosModulo(
      "facturacion",
      idsChile,
      facturaChile,
      generador,
    );

    expect(archivos).toHaveLength(idsChile.length);
    expect(generador).toHaveBeenCalledTimes(idsChile.length);
    expect(archivos.map((a) => a.id)).toEqual(idsChile);
    expect(archivos.every((a) => a.nombre.endsWith(".pdf"))).toBe(true);
    expect(archivos.every((a) => a.tipo === "application/pdf")).toBe(true);
  });

  it("usa nombres legibles para envío múltiple (factura-{id} y anexos-{id})", async () => {
    const generador = vi.fn(async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }));
    const datosMultiples = {
      facturas: [
        { id: 1, numero: "FEX-1", tipoPedido: "chile" },
        { id: 2, numero: "FEX-2", tipoPedido: "chile" },
      ],
      numero: "FEX-1, FEX-2",
    };

    const archivos = await generarDocumentosModulo(
      "facturacion",
      ["factura-1", "autodeclaracion-chile-2"],
      datosMultiples,
      generador,
    );

    expect(archivos[0].nombre).toMatch(/^factura-FEX-1-/);
    expect(archivos[1].nombre).toMatch(/^autodeclaracion-chile-FEX-2-/);
  });

  it("normaliza el prefijo CHI-FEX- a FEX- en los nombres de adjuntos", async () => {
    const generador = vi.fn(async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }));
    const datosMultiples = {
      facturas: [
        { id: 1, numero: "CHI-FEX-1", tipoPedido: "chile" },
        { id: 2, numero: "CHI-FEX-2", tipoPedido: "chile" },
      ],
      numero: "CHI-FEX-1, CHI-FEX-2",
    };

    const archivos = await generarDocumentosModulo(
      "facturacion",
      ["factura-1", "plan-vallejo-2"],
      datosMultiples,
      generador,
    );

    expect(archivos[0].nombre).toMatch(/^factura-FEX-1-/);
    expect(archivos[0].nombre).not.toContain("CHI-FEX");
    expect(archivos[1].nombre).toMatch(/^plan-vallejo-FEX-2-/);
    expect(archivos[1].nombre).not.toContain("CHI-FEX");
  });

  it("propaga el error si un documento falla", async () => {
    const generador = vi.fn(async () => {
      throw new Error("Error generando anexo");
    });

    await expect(
      generarDocumentosModulo("facturacion", ["factura"], facturaChile, generador),
    ).rejects.toThrow("No se pudo generar factura");
  });
});
