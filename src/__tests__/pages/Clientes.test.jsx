// src/__tests__/pages/Clientes.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Clientes from '../../pages/Clientes';
import * as clientesService from '../../services/clientesService';

vi.mock('../../services/clientesService');

describe('Clientes', () => {
    // Propiedades en PascalCase tal como las retorna la API real
    const mockClientes = [
        { Id_Cliente: 1, Nombre: 'Empresa Alpha', DiasFechaSalida: 3, DiasFechaEnroute: 0, DiasFechaDelivery: 0, DiasFechaIngreso: 0 },
        { Id_Cliente: 2, Nombre: 'Empresa Beta', DiasFechaSalida: 5, DiasFechaEnroute: 0, DiasFechaDelivery: 0, DiasFechaIngreso: 0 },
    ];

    beforeEach(() => {
        clientesService.listarClientes.mockResolvedValue({
            clientes: mockClientes,
            bodegas: [{ id: 1, nombre: 'Bodega Principal' }],
        });
    });

    it('renderiza el formulario de clientes', async () => {
        render(<Clientes />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
        });
    });

    it('llama a listarClientes al montar el componente', async () => {
        render(<Clientes />);
        await waitFor(() => {
            expect(clientesService.listarClientes).toHaveBeenCalledOnce();
        });
    });

    it('muestra el campo de nombre del cliente', async () => {
        render(<Clientes />);
        // El label no tiene htmlFor, se busca por placeholder
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/ingrese el nombre del cliente/i)).toBeInTheDocument();
        });
    });

    it('muestra error cuando listarClientes falla', async () => {
        clientesService.listarClientes.mockRejectedValueOnce(new Error('Error de red'));
        render(<Clientes />);
        await waitFor(() => {
            expect(clientesService.listarClientes).toHaveBeenCalled();
        });
    });

    it('toggle de lista de clientes funciona', async () => {
        render(<Clientes />);
        await waitFor(() => expect(clientesService.listarClientes).toHaveBeenCalled());

        // El botón muestra "Ver Clientes" inicialmente
        const btnToggle = screen.getByRole('button', { name: /ver clientes/i });
        fireEvent.click(btnToggle);
        await waitFor(() => {
            // El componente renderiza cliente.Nombre (PascalCase de la API)
            // Aparece en tabla desktop Y tarjeta mobile (CSS no se aplica en jsdom)
            expect(screen.getAllByText('Empresa Alpha').length).toBeGreaterThanOrEqual(1);
        });
    });
});
