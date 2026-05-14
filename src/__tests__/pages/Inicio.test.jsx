// src/__tests__/pages/Inicio.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Inicio from '../../pages/Inicio';

describe('Inicio', () => {
    it('renderiza el mensaje de bienvenida', async () => {
        render(<Inicio />);
        expect(await screen.findByText(/bienvenido/i)).toBeInTheDocument();
    }, 15000);

    it('muestra las 4 tarjetas de métricas', () => {
        render(<Inicio />);
        expect(screen.getByText('Pedidos del Mes')).toBeInTheDocument();
        expect(screen.getByText('Clientes Activos')).toBeInTheDocument();
        expect(screen.getByText('Productos Stock')).toBeInTheDocument();
        expect(screen.getByText('Facturación Mensual')).toBeInTheDocument();
    });

    it('muestra la sección de actividad reciente', () => {
        render(<Inicio />);
        // El texto aparece dos veces (párrafo intro + encabezado h2), usamos getAllByText
        const elementos = screen.getAllByText(/actividad reciente/i);
        expect(elementos.length).toBeGreaterThanOrEqual(1);
    });

    it('muestra actividades recientes con usuarios', () => {
        render(<Inicio />);
        // El usuario aparece en el texto "por {usuario}" dentro de un párrafo
        expect(screen.getByText(/por Juan Pérez/i)).toBeInTheDocument();
        expect(screen.getByText(/por María García/i)).toBeInTheDocument();
    });

    it('muestra acciones rápidas', () => {
        render(<Inicio />);
        expect(screen.getByText('Crear Pedido')).toBeInTheDocument();
        expect(screen.getByText('Gestionar Clientes')).toBeInTheDocument();
    });

    it('muestra la fecha actual', () => {
        render(<Inicio />);
        const año = new Date().getFullYear().toString();
        expect(screen.getByText(new RegExp(año))).toBeInTheDocument();
    });

    it('muestra los valores de las métricas', () => {
        render(<Inicio />);
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByText('$45.2M')).toBeInTheDocument();
    });
});
