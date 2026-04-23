// src/__tests__/App.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock de todos los módulos con componentes pesados o que hacen fetch al montar
// IMPORTANTE: Layout usa <Outlet> de React Router para renderizar rutas anidadas, no {children}
vi.mock('../components/layout', async () => {
    const { Outlet } = await vi.importActual('react-router-dom');
    return {
        default: () => <div data-testid="layout"><Outlet /></div>,
    };
});

vi.mock('../pages/Inicio', () => ({
    default: () => <div>Página Inicio</div>,
}));

vi.mock('../pages/Clientes', () => ({
    default: () => <div>Página Clientes</div>,
}));

vi.mock('../pages/Conductores', () => ({
    default: () => <div>Página Conductores</div>,
}));

vi.mock('../pages/Productos', () => ({
    default: () => <div>Página Productos</div>,
}));

vi.mock('../pages/Pedidos', () => ({
    default: () => <div>Página Pedidos</div>,
}));

vi.mock('../pages/PedidosSample', () => ({
    default: () => <div>Página Samples</div>,
}));

vi.mock('../pages/ProduccionPedidos', () => ({
    default: () => <div>Página Producción</div>,
}));

vi.mock('../pages/ComplementoFacturas', () => ({
    default: () => <div>Página Complemento Facturas</div>,
}));

vi.mock('../components/consolidacion/ConsolidacionMain', () => ({
    default: () => <div>Página Consolidación</div>,
}));

vi.mock('../components/facturacion/FacturacionMain', () => ({
    default: () => <div>Página Facturación</div>,
}));

vi.mock('../components/dashboard/DashboardDibufala', () => ({
    default: () => <div>Página Dashboard</div>,
}));

vi.mock('../components/facturacion/ConfiguracionCorreos', () => ({
    default: () => <div>Página Configuración Correos</div>,
}));

describe('App - Enrutamiento', () => {
    const renderWithRoute = (path) =>
        render(
            <MemoryRouter initialEntries={[path]}>
                <App />
            </MemoryRouter>,
        );

    it('renderiza el layout en la ruta raíz', () => {
        renderWithRoute('/');
        expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    it('muestra la página de Inicio en /', () => {
        renderWithRoute('/');
        expect(screen.getByText('Página Inicio')).toBeInTheDocument();
    });

    it('muestra la página de Clientes en /clientes', () => {
        renderWithRoute('/clientes');
        expect(screen.getByText('Página Clientes')).toBeInTheDocument();
    });

    it('muestra la página de Conductores en /conductores', () => {
        renderWithRoute('/conductores');
        expect(screen.getByText('Página Conductores')).toBeInTheDocument();
    });

    it('muestra la página de Productos en /productos', () => {
        renderWithRoute('/productos');
        expect(screen.getByText('Página Productos')).toBeInTheDocument();
    });

    it('muestra la página de Pedidos en /pedidos', () => {
        renderWithRoute('/pedidos');
        expect(screen.getByText('Página Pedidos')).toBeInTheDocument();
    });

    it('muestra la página de Samples en /samples', () => {
        renderWithRoute('/samples');
        expect(screen.getByText('Página Samples')).toBeInTheDocument();
    });

    it('muestra la página de Producción en /produccion', () => {
        renderWithRoute('/produccion');
        expect(screen.getByText('Página Producción')).toBeInTheDocument();
    });

    it('muestra la página de Consolidación en /consolidacion', () => {
        renderWithRoute('/consolidacion');
        expect(screen.getByText('Página Consolidación')).toBeInTheDocument();
    });

    it('muestra la página de Facturación en /facturacion', () => {
        renderWithRoute('/facturacion');
        expect(screen.getByText('Página Facturación')).toBeInTheDocument();
    });

    it('muestra la página de Dashboard en /dashboard', () => {
        renderWithRoute('/dashboard');
        expect(screen.getByText('Página Dashboard')).toBeInTheDocument();
    });

    it('muestra la página de Complemento Facturas en /complemento-facturas', () => {
        renderWithRoute('/complemento-facturas');
        expect(screen.getByText('Página Complemento Facturas')).toBeInTheDocument();
    });

    it('muestra Configuración de Correos en /configuracion-correos', () => {
        renderWithRoute('/configuracion-correos');
        expect(screen.getByText('Página Configuración Correos')).toBeInTheDocument();
    });

    it('redirige /index.html a /', () => {
        renderWithRoute('/index.html');
        expect(screen.getByText('Página Inicio')).toBeInTheDocument();
    });
});
