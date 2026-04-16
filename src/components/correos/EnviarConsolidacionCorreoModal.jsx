/**
 * COMPONENTE: EnviarConsolidacionCorreoModal
 * PROPÓSITO: Wrapper específico para envío de correos en módulo de Consolidación
 * HEREDA: Toda la funcionalidad de EnviarCorreoModal genérico
 * VENTAJA: Documentos y generadores pre-configurados para Consolidación
 * 
 * USO:
 * <EnviarConsolidacionCorreoModal
 *   consolidacion={consolidacionData}
 *   isOpen={mostrarModal}
 *   onClose={cerrarModal}
 *   onEnvioExitoso={callback}
 * />
 */

import React, { useCallback } from 'react';
import EnviarCorreoModal from '../correos/EnviarCorreoModal';

// TODO: Importar funciones generadoras cuando estén disponibles en consolidacionService
// import {
//   generarActaConsolidacion,
//   generarListaDetallada,
//   generarCertificadoDespacho
// } from '../../services/consolidacionService';

const EnviarConsolidacionCorreoModal = ({
  consolidacion,
  isOpen = false,
  onClose = () => {},
  onEnvioExitoso = () => {}
}) => {
  // Documentos disponibles para módulo de Consolidación
  const documentosConsolidacion = [
    {
      id: 'acta-consolidacion',
      nombre: '📋 Acta de Consolidación',
      descripcion: 'Documento oficial de consolidación',
      obligatorio: true
    },
    {
      id: 'lista-detalle',
      nombre: '📑 Lista Detallada',
      descripcion: 'Relación completa de items consolidados',
      obligatorio: false
    },
    {
      id: 'certificado-despacho',
      nombre: '✅ Certificado de Despacho',
      descripcion: 'Autorización de salida del consolidado',
      obligatorio: false
    },
    {
      id: 'manifesto-transporte',
      nombre: '🚚 Manifiesto de Transporte',
      descripcion: 'Documento de transporte y seguimiento',
      obligatorio: false
    }
  ];

  // Generador de documentos específico para Consolidación
  const generadorConsolidacion = useCallback(
    async (tipoDocumento, datosConsolidacion) => {
      try {
        let blob;

        switch (tipoDocumento) {
          case 'acta-consolidacion':
            console.log(`📄 Generando acta para consolidación ${datosConsolidacion.id}`);
            // blob = await generarActaConsolidacion(datosConsolidacion.id);
            // Por ahora, crear un placeholder
            throw new Error('Función generarActaConsolidacion no implementada aún');
            break;

          case 'lista-detalle':
            console.log(`📄 Generando lista detallada para consolidación ${datosConsolidacion.id}`);
            // blob = await generarListaDetallada(datosConsolidacion.id);
            throw new Error('Función generarListaDetallada no implementada aún');
            break;

          case 'certificado-despacho':
            console.log(`📄 Generando certificado para consolidación ${datosConsolidacion.id}`);
            // blob = await generarCertificadoDespacho(datosConsolidacion.id);
            throw new Error('Función generarCertificadoDespacho no implementada aún');
            break;

          case 'manifesto-transporte':
            console.log(`📄 Generando manifiesto para consolidación ${datosConsolidacion.id}`);
            // blob = await generarManifestoTransporte(datosConsolidacion.id);
            throw new Error('Función generarManifestoTransporte no implementada aún');
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

  // Preparar datos de referencia de la consolidación
  const datosReferencia = {
    id: consolidacion?.id,
    numero: consolidacion?.numero || `CONS-${consolidacion?.id}`,
    cliente: consolidacion?.cliente || consolidacion?.nombreConsolidador,
    fecha: consolidacion?.fecha || new Date().toISOString().split('T')[0],
    fechaProgramada: consolidacion?.fechaProgramada,
    destino: consolidacion?.destino,
    transporte: consolidacion?.transporte,
    cantidadPaquetes: consolidacion?.cantidadPaquetes,
    pesoTotal: consolidacion?.pesoTotal,
    volumenTotal: consolidacion?.volumenTotal,
    estado: consolidacion?.estado,
    // Datos adicionales específicos de consolidación
    ...consolidacion
  };

  if (!isOpen || !consolidacion) {
    return null;
  }

  return (
    <EnviarCorreoModal
      isOpen={isOpen}
      onClose={onClose}
      modulo="consolidacion"
      referencia={datosReferencia}
      documentosDisponibles={documentosConsolidacion}
      generadorDocumentos={generadorConsolidacion}
      onEnvioExitoso={onEnvioExitoso}
    />
  );
};

export default EnviarConsolidacionCorreoModal;