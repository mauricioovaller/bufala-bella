import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Inicio from '../../pages/Inicio';

vi.mock('../../services/inicioService', () => ({
  obtenerResumenInicio: vi.fn()
}));

import { obtenerResumenInicio } from '../../services/inicioService';

const mockDatos = {
  success: true,
  totales: { clientes: 25, productos: 51, pedidosActivos: 1014, tmsPedidosActivos: 50.7, facturasHistorico: 143 },
  mesActual: { facturas: 30, kgDespachados: 34281, valorTotal: 150000000, costosFlete: 6, totalFleteCOP: 2704512 },
  ultimasFacturas: [{ fecha: '2026-05-23', guiaMaster: 'GM123', kg: 2262, items: 19 }],
  ultimosPedidos: [{ id: 100, fecha: '2026-05-23', cliente: 'Cliente Test' }],
  tendenciaKg: [{ fecha: '2026-05-23', kg: 2262 }],
  saldo: { pedidosActivos: 1014, facturasTotales: 143, pendientesFacturar: 871 }
};

describe('Inicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerResumenInicio.mockResolvedValue(mockDatos);
  });

  const renderInicio = () => render(
    <MemoryRouter>
      <Inicio />
    </MemoryRouter>
  );

  it('muestra el spinner mientras carga datos', () => {
    obtenerResumenInicio.mockReturnValue(new Promise(() => {}));
    renderInicio();
    expect(screen.getByText(/cargando panel/i)).toBeInTheDocument();
  }, 15000);

  it('renderiza el saludo después de cargar', async () => {
    renderInicio();
    await waitFor(() => {
      expect(screen.getByText(/buenos días|buenas tardes|buenas noches/i)).toBeInTheDocument();
    });
  }, 15000);

  it('muestra las 4 tarjetas KPIs con datos reales', async () => {
    renderInicio();
    await waitFor(() => {
      expect(screen.getByText('Pedidos Activos')).toBeInTheDocument();
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Facturas Mes')).toBeInTheDocument();
    });
  }, 15000);

  it('muestra acciones rápidas con navegación', async () => {
    renderInicio();
    await waitFor(() => {
      expect(screen.getByText('Crear Pedido')).toBeInTheDocument();
      expect(screen.getByText('Facturación')).toBeInTheDocument();
      expect(screen.getByText('Consolidación')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  }, 15000);

  it('muestra la fecha actual', async () => {
    renderInicio();
    await waitFor(() => {
      const año = new Date().getFullYear().toString();
      const elementos = screen.getAllByText(new RegExp(año));
      expect(elementos.length).toBeGreaterThanOrEqual(1);
    });
  }, 15000);

  it('muestra los valores reales de las métricas', async () => {
    renderInicio();
    await waitFor(() => {
      expect(screen.getByText('1.014')).toBeInTheDocument();
    });
  }, 15000);

  it('muestra la sección de últimas facturas', async () => {
    renderInicio();
    await waitFor(() => {
      expect(screen.getByText('Últimas Facturas')).toBeInTheDocument();
      expect(screen.getByText('Últimos Pedidos')).toBeInTheDocument();
    });
  }, 15000);
});
