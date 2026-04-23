// src/test/setup.js
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global de fetch para todos los tests
global.fetch = vi.fn();

// Limpiar mocks entre tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock de SweetAlert2 para evitar errores en tests de componentes
vi.mock("sweetalert2", () => ({
  default: {
    fire: vi
      .fn()
      .mockResolvedValue({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false,
      }),
    showLoading: vi.fn(),
    close: vi.fn(),
  },
}));

// Mock de window.URL para tests de descarga de archivos
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Suprimir errores de consola esperados en tests
const consoleError = console.error.bind(console);
const consoleWarn = console.warn.bind(console);
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning: ReactDOM") ||
      args[0].includes("act(") ||
      args[0].includes("Error en "))
  ) {
    return;
  }
  consoleError(...args);
};
console.warn = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("No se pudo")) return;
  consoleWarn(...args);
};
