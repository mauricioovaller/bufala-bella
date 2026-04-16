/**
 * ÍNDICE: Componentes y Servicios de Correos
 * PROPÓSITO: Centralizar todas las exportaciones del módulo de correos
 * USO: import { EnviarCorreoModal } from '../../components/correos';
 */

// Componentes genéricos
export { default as EnviarCorreoModal } from "./EnviarCorreoModal";
export { default as SelectorDocumentos } from "./SelectorDocumentos";

// Wrappers específicos por módulo
export { default as EnviarPedidoCorreoModal } from "./EnviarPedidoCorreoModal";
export { default as EnviarConsolidacionCorreoModal } from "./EnviarConsolidacionCorreoModal";

// Para importar el servicio genérico:
// import { enviarCorreoGenerico } from '../../services/envioCorreosGenericoService';
