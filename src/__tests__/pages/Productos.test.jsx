// src/__tests__/pages/Productos.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Productos from '../../pages/Productos';
import * as productosService from '../../services/productosService';

vi.mock('../../services/productosService');

describe('Productos', () => {
    const mockProductos = [
        { idProducto: 1, descripProducto: 'Mozarella 125g', codigoSiesa: 'MOZ-125', activo: 1 },
        { idProducto: 2, descripProducto: 'Burrata 100g', codigoSiesa: 'BUR-100', activo: 1 },
    ];

    beforeEach(() => {
        productosService.listarProductos.mockResolvedValue(mockProductos);
    });

    it('llama a listarProductos al montar', async () => {
        render(<Productos />);
        await waitFor(() => {
            expect(productosService.listarProductos).toHaveBeenCalledOnce();
        });
    });

    it('renderiza sin errores', async () => {
        render(<Productos />);
        await waitFor(() => {
            expect(productosService.listarProductos).toHaveBeenCalled();
        });
        expect(screen.queryByText(/uncaught error/i)).not.toBeInTheDocument();
    });

    it('muestra botón de guardar', async () => {
        render(<Productos />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
        });
    });

    it('maneja error al cargar productos', async () => {
        productosService.listarProductos.mockRejectedValueOnce(new Error('Fallo de red'));
        render(<Productos />);
        await waitFor(() => {
            expect(productosService.listarProductos).toHaveBeenCalled();
        });
    });

    it('campo de código Siesa está presente', async () => {
        render(<Productos />);
        await waitFor(() => {
            const campo = screen.queryByPlaceholderText(/siesa/i) ||
                screen.queryByLabelText(/siesa/i) ||
                screen.queryByText(/siesa/i);
            expect(campo).toBeTruthy();
        });
    });
});
