/**
 * COMPONENTE: EnviarPedidoCorreoModal
 * PROPÓSITO: Wrapper específico para envío de correos en módulo de Pedidos
 * HEREDA: Toda la funcionalidad de EnviarCorreoModal genérico
 * VENTAJA: Documentos y generadores pre-configurados para Pedidos
 * 
 * USO:
 * <EnviarPedidoCorreoModal
 *   pedido={pedidoData}
 *   isOpen={mostrarModal}
 *   onClose={cerrarModal}
 *   onEnvioExitoso={callback}
 * />
 */

import React, { useCallback } from 'react';
import EnviarCorreoModal from '../correos/EnviarCorreoModal';
import {
    generarGuia,
    generarReportePedido,
    generarFacturaPedido
} from '../../services/pedidosService';

const EnviarPedidoCorreoModal = ({
    pedido,
    isOpen = false,
    onClose = () => { },
    onEnvioExitoso = () => { }
}) => {
    // Documentos disponibles para módulo de Pedidos
    const documentosPedidos = [
        {
            id: 'guia',
            nombre: '🚚 Guía de Transporte',
            descripcion: 'Documento de envío y logística',
            obligatorio: true
        },
        {
            id: 'reporte-pedido',
            nombre: '📋 Reporte del Pedido',
            descripcion: 'Detalles y especificaciones completas del pedido',
            obligatorio: false
        },
        {
            id: 'factura-pedido',
            nombre: '🧾 Factura del Pedido',
            descripcion: 'Comprobante fiscal asociado',
            obligatorio: false
        }
    ];

    // Generador de documentos específico para Pedidos
    const generadorPedidos = useCallback(
        async (tipoDocumento, datosPedido) => {
            try {
                let blob;

                switch (tipoDocumento) {
                    case 'guia':
                        console.log(`📄 Generando guía para pedido ${datosPedido.id}`);
                        blob = await generarGuia(datosPedido.id);
                        break;

                    case 'reporte-pedido':
                        console.log(`📄 Generando reporte para pedido ${datosPedido.id}`);
                        blob = await generarReportePedido(datosPedido.id);
                        break;

                    case 'factura-pedido':
                        console.log(`📄 Generando factura para pedido ${datosPedido.id}`);
                        blob = await generarFacturaPedido(datosPedido.id);
                        break;

                    default:
                        throw new Error(`Documento desconocido: ${tipoDocumento}`);
                }

                if (!blob || blob.size === 0) {
                    throw new Error(`El documento ${tipoDocumento} se generó vacío`);
                }

                return blob;
            } catch (error) {
                console.error(`Error generando ${tipoDocumento}:`, error);
                throw error;
            }
        },
        []
    );

    // Preparar datos de referencia del pedido
    const datosReferencia = {
        id: pedido?.id,
        numero: pedido?.numero || `PED-${pedido?.id}`,
        cliente: pedido?.cliente || pedido?.nombreCliente,
        fecha: pedido?.fecha || new Date().toISOString().split('T')[0],
        fechaEntrega: pedido?.fechaEntrega,
        estado: pedido?.estado,
        direccion: pedido?.direccionEntrega,
        total: pedido?.total || 0,
        // Datos adicionales específicos de pedidos
        ...pedido
    };

    if (!isOpen || !pedido) {
        return null;
    }

    return (
        <EnviarCorreoModal
            isOpen={isOpen}
            onClose={onClose}
            modulo="pedidos"
            referencia={datosReferencia}
            documentosDisponibles={documentosPedidos}
            generadorDocumentos={generadorPedidos}
            onEnvioExitoso={onEnvioExitoso}
        />
    );
};

export default EnviarPedidoCorreoModal;