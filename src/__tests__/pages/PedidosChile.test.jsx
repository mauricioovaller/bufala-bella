// src/__tests__/pages/PedidosChile.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PedidosChile from "../../pages/PedidosChile";
import * as pedidosChileService from "../../services/pedidosChileService";

vi.mock("../../services/pedidosChileService");

// ── Datos de prueba ───────────────────────────────────────────────────────────
const mockDatosSelect = {
    success: true,
    clientesChile: [
        { Id_ClienteChile: 1, Nombre: "Globe Italia SPA" },
        { Id_ClienteChile: 2, Nombre: "Otro Cliente" },
    ],
    productosChile: [
        {
            Id_ProductoChile: 1,
            DescripProducto: "Ciliegine 125g",
            CodigoCliente: "DBF005",
            CodigoSiesa: "BUF-CIL125",
            PesoNetoGr: 248,
            PesoEscurridoKg: 0.125,
            EnvaseInternoxCaja: 8,
            FactorPesoBruto: 1.174,
            PrecioXKilo: 18.2305,
        },
    ],
    agencias: [{ IdAgencia: 44, Nombre: "Agencia Test" }],
    aerolineas: [{ IdAerolinea: 107, Nombre: "Aerolínea Test" }],
};

const mockPedidos = {
    success: true,
    pedidos: [
        {
            Id_EncabPedidoChile: 1,
            NombreCliente: "Globe Italia SPA",
            NumeroOrden: "488",
            FechaRecepcionOrden: "2026-05-01",
        },
        {
            Id_EncabPedidoChile: 2,
            NombreCliente: "Globe Italia SPA",
            NumeroOrden: "489",
            FechaRecepcionOrden: "2026-05-06",
        },
    ],
};

const mockPedidoEspecifico = {
    success: true,
    encabezado: {
        Id_EncabPedidoChile: 1,
        Id_ClienteChile: 1,
        NumeroOrden: "488",
        GuiaAerea: "FEX-12345",
        IdAgencia: 44,
        IdAerolinea: 107,
        FechaRecepcionOrden: "2026-05-01",
        FechaSolicitudEntrega: "2026-05-08",
        FechaFinalEntrega: "2026-05-10",
        CantidadEstibas: 1,
        DescuentoComercial: 0,
        Observaciones: "",
        FacturaNo: "FEX-001",
    },
    detalle: [
        {
            Id_ProductoChile: 1,
            Descripcion: "Ciliegine 125g",
            CodigoCliente: "DBF005",
            CodigoSiesa: "BUF-CIL125",
            Lote: "L001",
            FechaElaboracion: "2026-04-20",
            FechaVencimiento: "2026-06-20",
            PesoNetoGr: 248,
            CantidadCajas: 10,
            EnvaseInternoxCaja: 8,
            PesoEscurridoKg: 0.125,
            FactorPesoBruto: 1.174,
            ValorXKilo: 18.2305,
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
describe("PedidosChile", () => {
    beforeEach(() => {
        pedidosChileService.getDatosSelectChile.mockResolvedValue(mockDatosSelect);
        pedidosChileService.getPedidosChile.mockResolvedValue(mockPedidos);
        pedidosChileService.getPedidoChileEspecifico.mockResolvedValue(mockPedidoEspecifico);
        pedidosChileService.guardarPedidoChile.mockResolvedValue({ success: true, idPedido: 1, numero: "CHI-000001" });
        pedidosChileService.actualizarPedidoChile.mockResolvedValue({ success: true });
        pedidosChileService.imprimirPedidoChile.mockResolvedValue(new Blob(["PDF"]));
    });

    // ── Renderizado básico ────────────────────────────────────────────────────
    it("renderiza el título de la página", async () => {
        render(<PedidosChile />);
        expect(await screen.findByText(/pedidos chile/i)).toBeInTheDocument();
    });

    it("llama a getDatosSelectChile al montar el componente", async () => {
        render(<PedidosChile />);
        await waitFor(() => {
            expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalledOnce();
        });
    });

    it("muestra el spinner mientras carga los datos", () => {
        pedidosChileService.getDatosSelectChile.mockReturnValue(new Promise(() => { })); // nunca resuelve
        render(<PedidosChile />);
        // El spinner es un div con animate-spin
        expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    // ── Botones de la barra de herramientas ───────────────────────────────────
    it("muestra todos los botones de la barra", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        expect(screen.getByRole("button", { name: /buscar pedidos/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /guardar pedido/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /nuevo pedido/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /imprimir pdf/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /imprimir múltiple/i })).toBeInTheDocument();
    });

    it("el botón Guardar está habilitado para pedidos nuevos", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());
        // Para pedido nuevo (sin idPedido): botón dice "Guardar Pedido" y está habilitado
        expect(screen.getByRole("button", { name: /guardar pedido/i })).not.toBeDisabled();
        // Imprimir PDF deshabilitado sin pedido guardado
        expect(screen.getByRole("button", { name: /imprimir pdf/i })).toBeDisabled();
    });

    // ── Modal de búsqueda ─────────────────────────────────────────────────────
    it("abre el modal de búsqueda al hacer clic en Buscar Pedido", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedido/i }));

        await waitFor(() => {
            expect(pedidosChileService.getPedidosChile).toHaveBeenCalledOnce();
        });
        expect(screen.getByText(/seleccionar pedido chile/i)).toBeInTheDocument();
    });

    it("muestra los pedidos en el modal de búsqueda", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedido/i }));

        await waitFor(() => {
            // Se muestran ambos pedidos (CHI-000001, CHI-000002)
            expect(screen.getByText("CHI-000001")).toBeInTheDocument();
            expect(screen.getByText("CHI-000002")).toBeInTheDocument();
        });
    });

    it("filtra pedidos en el modal por número de orden", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedido/i }));
        await waitFor(() => expect(screen.getByText("CHI-000001")).toBeInTheDocument());

        const inputBusqueda = screen.getByPlaceholderText(/buscar por num/i);
        fireEvent.change(inputBusqueda, { target: { value: "489" } });

        // Solo debe mostrar el pedido con orden 489
        await waitFor(() => {
            expect(screen.getByText("CHI-000002")).toBeInTheDocument();
            expect(screen.queryByText("CHI-000001")).not.toBeInTheDocument();
        });
    });

    it("cierra el modal al hacer clic en Cancelar", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedido/i }));
        await waitFor(() => expect(screen.getByText(/seleccionar pedido chile/i)).toBeInTheDocument());

        fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
        await waitFor(() => {
            expect(screen.queryByText(/seleccionar pedido chile/i)).not.toBeInTheDocument();
        });
    });

    // ── Carga de pedido ───────────────────────────────────────────────────────
    it("carga el pedido seleccionado desde el modal", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedido/i }));
        await waitFor(() => expect(screen.getByText("CHI-000001")).toBeInTheDocument());

        fireEvent.click(screen.getByText("CHI-000001"));

        await waitFor(() => {
            expect(pedidosChileService.getPedidoChileEspecifico).toHaveBeenCalledWith(1);
        });
    });

    it("después de cargar el pedido: Actualizar habilitado, Guardar deshabilitado", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedidos/i }));
        await waitFor(() => expect(screen.getByText("CHI-000001")).toBeInTheDocument());
        fireEvent.click(screen.getByText("CHI-000001"));

        await waitFor(() => {
            expect(pedidosChileService.getPedidoChileEspecifico).toHaveBeenCalled();
        });
        // Con pedido cargado: botón cambia a "Actualizar Pedido" y Imprimir PDF se habilita
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /actualizar pedido/i })).not.toBeDisabled();
            expect(screen.getByRole("button", { name: /imprimir pdf/i })).not.toBeDisabled();
        });
    });

    // ── Nuevo pedido ──────────────────────────────────────────────────────────
    it("el botón Nuevo restablece el formulario", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        // Cargar un pedido primero
        fireEvent.click(screen.getByRole("button", { name: /buscar pedidos/i }));
        await waitFor(() => expect(screen.getByText("CHI-000001")).toBeInTheDocument());
        fireEvent.click(screen.getByText("CHI-000001"));
        await waitFor(() => expect(pedidosChileService.getPedidoChileEspecifico).toHaveBeenCalled());

        // Con pedido cargado el botón dice "Actualizar Pedido"
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /actualizar pedido/i })).not.toBeDisabled();
        });

        // Hacer clic en Nuevo Pedido
        fireEvent.click(screen.getByRole("button", { name: /nuevo pedido/i }));

        await waitFor(() => {
            // Vuelve a mostrar "Guardar Pedido" habilitado e Imprimir PDF deshabilitado
            expect(screen.getByRole("button", { name: /guardar pedido/i })).not.toBeDisabled();
            expect(screen.getByRole("button", { name: /imprimir pdf/i })).toBeDisabled();
        });
    });

    // ── Error en carga de datos ───────────────────────────────────────────────
    it("maneja el error cuando getDatosSelectChile falla", async () => {
        pedidosChileService.getDatosSelectChile.mockRejectedValueOnce(new Error("Error de red"));
        render(<PedidosChile />);
        await waitFor(() => {
            expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled();
        });
        // No se lanza excepción no controlada — el componente no se rompe
    });

    it("maneja el error cuando getPedidosChile falla al abrir modal", async () => {
        pedidosChileService.getPedidosChile.mockRejectedValueOnce(new Error("Error de red"));
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        fireEvent.click(screen.getByRole("button", { name: /buscar pedido/i }));
        await waitFor(() => {
            expect(pedidosChileService.getPedidosChile).toHaveBeenCalled();
        });
    });

    // ── Sección de totales ────────────────────────────────────────────────────
    it("muestra la sección de totales en USD", async () => {
        render(<PedidosChile />);
        await waitFor(() => expect(pedidosChileService.getDatosSelectChile).toHaveBeenCalled());

        // Aparecen los labels de totales (desktop + mobile duplicados por responsividad)
        const subTotalEls = screen.getAllByText(/sub total \(usd\)/i);
        expect(subTotalEls.length).toBeGreaterThanOrEqual(1);
    });
});
