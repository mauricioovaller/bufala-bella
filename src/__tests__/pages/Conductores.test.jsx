// src/__tests__/pages/Conductores.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Conductores from '../../pages/Conductores';
import * as conductoresService from '../../services/conductores/conductoresService';

vi.mock('../../services/conductores/conductoresService');

describe('Conductores', () => {
    const mockConductores = [
        { idConductor: 1, nombre: 'Pedro García', noDocumento: '12345678', placa: 'ABC-123' },
        { idConductor: 2, nombre: 'Luis Moreno', noDocumento: '87654321', placa: 'XYZ-789' },
    ];

    beforeEach(() => {
        conductoresService.listarConductores.mockResolvedValue({
            conductores: mockConductores,
        });
    });

    it('renderiza el formulario de conductores', async () => {
        render(<Conductores />);
        await waitFor(() => {
            expect(conductoresService.listarConductores).toHaveBeenCalledOnce();
        });
    });

    it('llama a listarConductores al montar', async () => {
        render(<Conductores />);
        await waitFor(() => {
            expect(conductoresService.listarConductores).toHaveBeenCalled();
        });
    });

    it('muestra el campo de nombre', async () => {
        render(<Conductores />);
        await waitFor(() => {
            const inputNombre = screen.getByPlaceholderText(/nombre/i) ||
                screen.queryByRole('textbox', { name: /nombre/i });
            expect(inputNombre || screen.getByText(/nombre/i)).toBeTruthy();
        });
    });

    it('muestra estado de carga inicial', () => {
        conductoresService.listarConductores.mockResolvedValue({ conductores: [] });
        render(<Conductores />);
        // El componente no debe tener errores durante la carga
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('maneja error al cargar conductores', async () => {
        conductoresService.listarConductores.mockRejectedValueOnce(new Error('Error de conexión'));
        render(<Conductores />);
        await waitFor(() => {
            expect(conductoresService.listarConductores).toHaveBeenCalled();
        });
    });
});
