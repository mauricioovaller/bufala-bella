// src/components/facturacion/EnviarCorreoMultipleFacturasModal.jsx
// Modal para enviar múltiples facturas del mismo día en un solo correo.
// Cada factura lleva su propia copia de factura PDF, plan vallejo y reporte de despacho.
// Las cartas (policía / aerolínea) se adjuntan una sola vez (compartidas).
import React, { useState, useEffect, useRef } from "react";
import {
    obtenerDestinatariosPredeterminados,
} from '../../services/correoService';
import { enviarCorreoGenerico } from '../../services/envioCorreosGenericoService';
import { generarFacturaPDF } from '../../services/facturacionService';
import {
    generarCartaResponsabilidad,
    generarReporteDespacho,
    generarPlanVallejo,
} from '../../services/planillasService';
import DestinatariosSelector from './DestinatariosSelector';
import Swal from 'sweetalert2';

// -------------------------------------------------------------------
// Construye el asunto automático a partir del array de facturas
// -------------------------------------------------------------------
function buildAsunto(facturas) {
    const numeros = facturas.map(f => f.numero).join(', ');
    const fecha = facturas[0]?.fecha || '';
    return `Facturas ${numeros} – ${fecha}`;
}

// -------------------------------------------------------------------
// Construye el cuerpo automático con el listado detallado de facturas
// -------------------------------------------------------------------
function buildCuerpo(facturas) {
    const fecha = facturas[0]?.fecha || '';
    const lineas = facturas
        .map(f => {
            const valor = f.valorTotal
                ? `$${Number(f.valorTotal).toLocaleString('es-CO')}`
                : 'N/A';
            return `  • ${f.numero} | ${f.cliente} | ${f.fecha} | ${valor}`;
        })
        .join('\n');
    const total = facturas.reduce((sum, f) => sum + (Number(f.valorTotal) || 0), 0);
    return (
        `Estimado cliente,\n\n` +
        `Adjuntamos las facturas correspondientes al día ${fecha}:\n\n` +
        `${lineas}\n\n` +
        `Total consolidado: $${total.toLocaleString('es-CO')}\n\n` +
        `Se adjuntan los documentos correspondientes.\n\n` +
        `Atentamente,\nEquipo de Facturación`
    );
}

// -------------------------------------------------------------------
// Construye la lista inicial de documentos a partir del array de facturas
// Grupos:
//   'facturas'        → un PDF por factura (obligatorio)
//   'compartidos'     → cartas policía / aerolínea (una sola copia)
//   'plan-vallejo'    → un documento por factura (opcional, puede no existir)
//   'reporte-despacho'→ un documento por factura (opcional)
// -------------------------------------------------------------------
function buildDocumentosIniciales(facturas) {
    const facturasItems = facturas.map(f => ({
        id: `factura-${f.id}`,
        nombre: `Factura ${f.numero}`,
        seleccionado: true,
        obligatorio: true,
        generando: false,
        noDisponible: false,
        grupo: 'facturas',
        facturaRef: f,
    }));

    const planVallejoItems = facturas.map(f => ({
        id: `plan-vallejo-${f.id}`,
        nombre: `Plan Vallejo – ${f.numero}`,
        seleccionado: false,
        obligatorio: false,
        generando: false,
        noDisponible: false,
        grupo: 'plan-vallejo',
        facturaRef: f,
    }));

    const reporteItems = facturas.map(f => ({
        id: `reporte-despacho-${f.id}`,
        nombre: `Reporte de Despacho – ${f.numero}`,
        seleccionado: false,
        obligatorio: false,
        generando: false,
        noDisponible: false,
        grupo: 'reporte-despacho',
        facturaRef: f,
    }));

    return [
        ...facturasItems,
        {
            id: 'carta-policia',
            nombre: 'Carta para Policía (compartida)',
            seleccionado: false,
            obligatorio: false,
            generando: false,
            noDisponible: false,
            grupo: 'compartidos',
            facturaRef: null,
        },
        {
            id: 'carta-aerolinea',
            nombre: 'Carta para Aerolínea (compartida)',
            seleccionado: false,
            obligatorio: false,
            generando: false,
            noDisponible: false,
            grupo: 'compartidos',
            facturaRef: null,
        },
        ...planVallejoItems,
        ...reporteItems,
    ];
}

// -------------------------------------------------------------------
// Genera un documento y retorna { blob, nombre }
// -------------------------------------------------------------------
async function ejecutarGeneracion(tipoDocumento, facturas) {
    const fecha = new Date().toISOString().split('T')[0];

    // Factura individual
    if (tipoDocumento.startsWith('factura-')) {
        const factId = parseInt(tipoDocumento.replace('factura-', ''), 10);
        const f = facturas.find(x => x.id === factId);
        if (!f) throw new Error('Factura no encontrada');
        const blob = await generarFacturaPDF(f.id, f.tipoPedido || 'normal');
        return { blob, nombre: `factura-${f.numero}.pdf` };
    }

    // Plan Vallejo individual (puede no estar disponible)
    if (tipoDocumento.startsWith('plan-vallejo-')) {
        const factId = parseInt(tipoDocumento.replace('plan-vallejo-', ''), 10);
        const f = facturas.find(x => x.id === factId);
        if (!f) throw new Error('Factura no encontrada para Plan Vallejo');
        const blob = await generarPlanVallejo(f.id);
        if (!(blob instanceof Blob) || blob.size === 0)
            throw new Error(`La factura ${f.numero} no tiene Plan Vallejo disponible`);
        return { blob, nombre: `plan-vallejo-${f.numero}.pdf` };
    }

    // Reporte de Despacho individual
    if (tipoDocumento.startsWith('reporte-despacho-')) {
        const factId = parseInt(tipoDocumento.replace('reporte-despacho-', ''), 10);
        const f = facturas.find(x => x.id === factId);
        if (!f) throw new Error('Factura no encontrada para Reporte de Despacho');
        const blob = await generarReporteDespacho(f.id);
        return { blob, nombre: `reporte-despacho-${f.numero}.pdf` };
    }

    // Documentos compartidos (usan la planilla de la primera factura que la tenga)
    const facturaConPlanilla = facturas.find(f => f.Id_Planilla);

    switch (tipoDocumento) {
        case 'carta-policia':
            if (!facturaConPlanilla?.Id_Planilla)
                throw new Error('Ninguna de las facturas seleccionadas tiene planilla asociada');
            return {
                blob: await generarCartaResponsabilidad('carta-policia', facturaConPlanilla.Id_Planilla, true),
                nombre: `carta-policia-${fecha}.pdf`,
            };
        case 'carta-aerolinea':
            if (!facturaConPlanilla?.Id_Planilla)
                throw new Error('Ninguna de las facturas seleccionadas tiene planilla asociada');
            return {
                blob: await generarCartaResponsabilidad('carta-aerolinea', facturaConPlanilla.Id_Planilla, true),
                nombre: `carta-aerolinea-${fecha}.pdf`,
            };
        default:
            throw new Error('Tipo de documento desconocido');
    }
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------
const EnviarCorreoMultipleFacturasModal = ({
    facturas = [],
    isOpen,
    onClose,
    onEnvioExitoso,
}) => {
    const [loading, setLoading] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const [destinatarios, setDestinatarios] = useState([]);
    const [asunto, setAsunto] = useState('');
    const [cuerpo, setCuerpo] = useState('');

    const [documentosDisponibles, setDocumentosDisponibles] = useState([]);
    const [archivosGenerados, setArchivosGenerados] = useState({});

    // Ref para tener el snapshot de archivos en callbacks asíncronos
    const archivosRef = useRef({});
    useEffect(() => { archivosRef.current = archivosGenerados; }, [archivosGenerados]);

    // ── Inicializar cuando el modal se abre ──────────────────────────
    useEffect(() => {
        if (!isOpen || facturas.length === 0) return;

        const docs = buildDocumentosIniciales(facturas);
        setDocumentosDisponibles(docs);
        setArchivosGenerados({});
        archivosRef.current = {};
        setAsunto(buildAsunto(facturas));
        setCuerpo(buildCuerpo(facturas));

        cargarDestinatariosIniciales();

        // Auto-generar todas las facturas obligatorias al abrir
        docs.filter(d => d.obligatorio).forEach(doc => {
            generarDocumentoSilencioso(doc.id, facturas);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, facturas]);

    // ── Carga de destinatarios predeterminados ───────────────────────
    const cargarDestinatariosIniciales = async () => {
        setLoading(true);
        try {
            const resp = await obtenerDestinatariosPredeterminados();
            if (resp.success) {
                setDestinatarios(resp.destinatarios.map(d => d.email));
            }
        } catch (err) {
            console.error('Error cargando destinatarios:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Generar documento en silencio (sin toast de éxito, para auto-gen) ──
    const generarDocumentoSilencioso = async (tipoDocumento, facturasParam) => {
        setDocumentosDisponibles(prev =>
            prev.map(d => d.id === tipoDocumento ? { ...d, generando: true } : d)
        );
        try {
            const { blob, nombre } = await ejecutarGeneracion(tipoDocumento, facturasParam || facturas);
            setArchivosGenerados(prev => ({
                ...prev,
                [tipoDocumento]: { blob, nombre, tipo: 'application/pdf' },
            }));
        } catch (err) {
            console.error(`Auto-gen fallido para ${tipoDocumento}:`, err);
            // Para opcionales, marcar como no disponible si falla
            setDocumentosDisponibles(prev =>
                prev.map(d =>
                    d.id === tipoDocumento && !d.obligatorio
                        ? { ...d, seleccionado: false, noDisponible: true }
                        : d
                )
            );
        } finally {
            setDocumentosDisponibles(prev =>
                prev.map(d => d.id === tipoDocumento ? { ...d, generando: false } : d)
            );
        }
    };

    // ── Generar documento con feedback visual (botón Generar / Regenerar) ──
    const generarDocumento = async (tipoDocumento) => {
        setDocumentosDisponibles(prev =>
            prev.map(d => d.id === tipoDocumento ? { ...d, generando: true } : d)
        );
        try {
            const { blob, nombre } = await ejecutarGeneracion(tipoDocumento, facturas);
            setArchivosGenerados(prev => ({
                ...prev,
                [tipoDocumento]: { blob, nombre, tipo: 'application/pdf' },
            }));
            // Limpiar noDisponible si ahora funciona
            setDocumentosDisponibles(prev =>
                prev.map(d => d.id === tipoDocumento ? { ...d, noDisponible: false } : d)
            );
        } catch (err) {
            console.error(`Error generando ${tipoDocumento}:`, err);
            setDocumentosDisponibles(prev =>
                prev.map(d =>
                    d.id === tipoDocumento && !d.obligatorio
                        ? { ...d, seleccionado: false, noDisponible: true }
                        : d
                )
            );
            Swal.fire({
                icon: 'error',
                title: 'Error al generar documento',
                html: `<small>${err.message}</small>`,
                confirmButtonColor: '#dc2626',
            });
        } finally {
            setDocumentosDisponibles(prev =>
                prev.map(d => d.id === tipoDocumento ? { ...d, generando: false } : d)
            );
        }
    };

    // ── Alternar selección + auto-generar al marcar ──────────────────
    const handleDocumentoChange = (id) => {
        const doc = documentosDisponibles.find(d => d.id === id);
        if (!doc || doc.obligatorio || doc.noDisponible) return;

        const nuevoSeleccionado = !doc.seleccionado;
        setDocumentosDisponibles(prev =>
            prev.map(d => d.id === id ? { ...d, seleccionado: nuevoSeleccionado } : d)
        );

        // Auto-generar inmediatamente al activar si no está generado aún
        if (nuevoSeleccionado && !archivosRef.current[id]) {
            generarDocumento(id);
        }
    };

    // ── Validar antes de enviar ──────────────────────────────────────
    const validarFormulario = () => {
        if (destinatarios.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Destinatarios requeridos', text: 'Debe seleccionar al menos un destinatario válido', confirmButtonColor: '#f59e0b' });
            return false;
        }
        if (!asunto.trim()) {
            Swal.fire({ icon: 'warning', title: 'Asunto requerido', text: 'El asunto del correo es requerido', confirmButtonColor: '#f59e0b' });
            return false;
        }
        const facturasNoGeneradas = documentosDisponibles.filter(d => d.obligatorio && !archivosGenerados[d.id]);
        if (facturasNoGeneradas.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Facturas sin generar',
                html: `Espere a que se generen todos los PDFs:<br>${facturasNoGeneradas.map(d => `• ${d.nombre}`).join('<br>')}`,
                confirmButtonColor: '#f59e0b',
            });
            return false;
        }
        return true;
    };

    // ── Enviar correo ────────────────────────────────────────────────
    const handleEnviarCorreo = async () => {
        if (!validarFormulario()) return;

        const docsSeleccionados = documentosDisponibles.filter(d => d.seleccionado);
        const confirmacion = await Swal.fire({
            title: '¿Enviar correo múltiple?',
            html: `Se enviará <strong>${facturas.length}</strong> factura(s) a <strong>${destinatarios.length}</strong> destinatario(s)<br>
                   con <strong>${docsSeleccionados.length}</strong> documento(s) adjunto(s)`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
        });
        if (!confirmacion.isConfirmed) return;

        setEnviando(true);
        try {
            const archivosSnapshot = { ...archivosRef.current };

            // Generador: usa el blob pre-generado o lo genera al momento
            const generadorMultiple = async (tipoDocumento, datos) => {
                if (archivosSnapshot[tipoDocumento]) return archivosSnapshot[tipoDocumento].blob;
                const { blob } = await ejecutarGeneracion(tipoDocumento, datos.facturas);
                return blob;
            };

            const numerosFacturas = facturas.map(f => f.numero).join(', ');

            const resultado = await enviarCorreoGenerico({
                modulo: 'facturacion',
                referencia_id: facturas[0].id,
                referencia_numero: numerosFacturas,
                destinatarios,
                documentos_seleccionados: docsSeleccionados.map(d => d.id),
                asunto,
                cuerpo,
                datosReferencia: { facturas, numero: numerosFacturas },
                generador: generadorMultiple,
                usuario: localStorage.getItem('usuario_nombre') || 'Usuario',
                usuario_id: localStorage.getItem('usuario_id'),
                usuario_email: localStorage.getItem('usuario_email'),
            });

            if (resultado.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Correo enviado!',
                    html: `<strong>Correo enviado exitosamente</strong><br><br>
                           <div class="text-left">
                             <p>📄 Facturas: ${facturas.length}</p>
                             <p>📧 Destinatarios: ${resultado.destinatarios_enviados}</p>
                             <p>📎 Adjuntos: ${resultado.adjuntos_enviados}</p>
                           </div>`,
                    confirmButtonColor: '#10b981',
                    timer: 5000,
                    timerProgressBar: true,
                });
                if (onEnvioExitoso) onEnvioExitoso(resultado);
                onClose();
            } else {
                throw new Error(resultado.message || 'Error desconocido');
            }
        } catch (err) {
            console.error('❌ Error enviando correo múltiple:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error al enviar',
                html: `No se pudo enviar el correo<br><br><small>${err.message}</small>`,
                confirmButtonColor: '#dc2626',
            });
        } finally {
            setEnviando(false);
        }
    };

    if (!isOpen || facturas.length === 0) return null;

    // Agrupar documentos para el render
    const grupoFacturas = documentosDisponibles.filter(d => d.grupo === 'facturas');
    const grupoCompartidos = documentosDisponibles.filter(d => d.grupo === 'compartidos');
    const grupoPlanVallejo = documentosDisponibles.filter(d => d.grupo === 'plan-vallejo');
    const grupoReporte = documentosDisponibles.filter(d => d.grupo === 'reporte-despacho');

    const totalSeleccionados = documentosDisponibles.filter(d => d.seleccionado).length;
    const totalGenerados = Object.keys(archivosGenerados).length;
    const hayGenerando = documentosDisponibles.some(d => d.generando);

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">📧 Envío Múltiple de Facturas</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {facturas.length} factura(s):&nbsp;
                            <span className="font-medium text-gray-700">{facturas.map(f => f.numero).join(' · ')}</span>
                            &nbsp;—&nbsp;
                            <span className="text-blue-600">{facturas[0]?.fecha}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors text-3xl leading-none font-light"
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Cargando configuración...</span>
                    </div>
                ) : (
                    <div className="p-6 space-y-5">

                        {/* ── Destinatarios (mismo selector que envío individual) ── */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Destinatarios
                            </label>
                            <DestinatariosSelector
                                destinatariosSeleccionados={destinatarios}
                                onCambio={setDestinatarios}
                                puedeAgregar={true}
                            />
                        </div>

                        {/* ── Asunto ── */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Asunto</label>
                            <input
                                type="text"
                                value={asunto}
                                onChange={e => setAsunto(e.target.value)}
                                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* ── Cuerpo ── */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mensaje</label>
                            <textarea
                                value={cuerpo}
                                onChange={e => setCuerpo(e.target.value)}
                                rows={8}
                                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono"
                            />
                        </div>

                        {/* ── Documentos adjuntos ── */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Documentos adjuntos
                                {hayGenerando && (
                                    <span className="ml-2 text-xs text-orange-500 font-normal">
                                        ⏳ Generando automáticamente...
                                    </span>
                                )}
                            </label>

                            {/* Facturas individuales */}
                            <GrupoDocumentos
                                titulo="📄 Facturas (individuales — obligatorias)"
                                colorTitulo="text-blue-600"
                                docs={grupoFacturas}
                                archivos={archivosGenerados}
                                onToggle={handleDocumentoChange}
                                onGenerar={generarDocumento}
                                colorBtn="blue"
                            />

                            {/* Cartas compartidas */}
                            <GrupoDocumentos
                                titulo="📎 Cartas compartidas (se adjuntan una sola vez)"
                                colorTitulo="text-purple-600"
                                docs={grupoCompartidos}
                                archivos={archivosGenerados}
                                onToggle={handleDocumentoChange}
                                onGenerar={generarDocumento}
                                colorBtn="purple"
                            />

                            {/* Plan Vallejo por factura */}
                            <GrupoDocumentos
                                titulo="📋 Plan Vallejo (por factura)"
                                colorTitulo="text-amber-600"
                                docs={grupoPlanVallejo}
                                archivos={archivosGenerados}
                                onToggle={handleDocumentoChange}
                                onGenerar={generarDocumento}
                                colorBtn="amber"
                            />

                            {/* Reporte de Despacho por factura */}
                            <GrupoDocumentos
                                titulo="📊 Reporte de Despacho (por factura)"
                                colorTitulo="text-teal-600"
                                docs={grupoReporte}
                                archivos={archivosGenerados}
                                onToggle={handleDocumentoChange}
                                onGenerar={generarDocumento}
                                colorBtn="teal"
                            />
                        </div>

                        {/* ── Resumen ── */}
                        <div className="bg-gray-50 rounded-xl p-4 border">
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{facturas.length}</p>
                                    <p className="text-xs text-gray-500">Facturas</p>
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold ${totalGenerados >= totalSeleccionados ? 'text-green-600' : 'text-orange-500'}`}>
                                        {totalGenerados}/{totalSeleccionados}
                                    </p>
                                    <p className="text-xs text-gray-500">Generados</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">{destinatarios.length}</p>
                                    <p className="text-xs text-gray-500">Destinatarios</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-teal-600">
                                        {hayGenerando ? '⏳' : '✓'}
                                    </p>
                                    <p className="text-xs text-gray-500">{hayGenerando ? 'Generando...' : 'Listo'}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Botones ── */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={enviando}
                                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEnviarCorreo}
                                disabled={enviando || hayGenerando}
                                className="flex-[2] bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {enviando ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Enviando...
                                    </>
                                ) : hayGenerando ? (
                                    '⏳ Generando documentos...'
                                ) : (
                                    `📧 Enviar a ${destinatarios.length} destinatario(s)`
                                )}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// Sub-componente: grupo de documentos (sección con lista de filas)
// -------------------------------------------------------------------
const btnClasses = {
    blue: { gen: 'bg-blue-600 text-white hover:bg-blue-700', regen: 'bg-green-100 text-green-700 hover:bg-green-200' },
    purple: { gen: 'bg-purple-600 text-white hover:bg-purple-700', regen: 'bg-green-100 text-green-700 hover:bg-green-200' },
    amber: { gen: 'bg-amber-600 text-white hover:bg-amber-700', regen: 'bg-green-100 text-green-700 hover:bg-green-200' },
    teal: { gen: 'bg-teal-600 text-white hover:bg-teal-700', regen: 'bg-green-100 text-green-700 hover:bg-green-200' },
};

const GrupoDocumentos = ({ titulo, colorTitulo, docs, archivos, onToggle, onGenerar, colorBtn }) => {
    const c = btnClasses[colorBtn] || btnClasses.blue;
    return (
        <div className="mb-4">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colorTitulo}`}>{titulo}</p>
            <div className="space-y-2">
                {docs.map(doc => {
                    const archivo = archivos[doc.id];
                    const noDisp = doc.noDisponible;
                    const rowBg = noDisp
                        ? 'bg-gray-100 border-gray-200 opacity-60'
                        : doc.seleccionado
                            ? (colorBtn === 'blue' ? 'bg-blue-50 border-blue-200'
                                : colorBtn === 'purple' ? 'bg-purple-50 border-purple-200'
                                    : colorBtn === 'amber' ? 'bg-amber-50 border-amber-200'
                                        : 'bg-teal-50 border-teal-200')
                            : 'bg-gray-50 border-gray-200';

                    return (
                        <div key={doc.id} className={`flex items-center justify-between p-3 border rounded-lg transition-all ${rowBg}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <input
                                    type="checkbox"
                                    checked={doc.seleccionado}
                                    onChange={() => onToggle(doc.id)}
                                    disabled={doc.obligatorio || noDisp}
                                    className="w-4 h-4 flex-shrink-0 cursor-pointer disabled:cursor-default"
                                />
                                <span className={`text-sm truncate ${noDisp ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {doc.nombre}
                                </span>
                                {noDisp && (
                                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                        No disponible
                                    </span>
                                )}
                                {archivo && !noDisp && (
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                        ✓ {Math.round(archivo.blob.size / 1024)} KB
                                    </span>
                                )}
                            </div>
                            {/* Botón generar / regenerar */}
                            {doc.seleccionado && !noDisp && (
                                <button
                                    onClick={() => onGenerar(doc.id)}
                                    disabled={doc.generando}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ml-2 disabled:opacity-50 disabled:cursor-not-allowed ${archivo ? c.regen : c.gen}`}
                                >
                                    {doc.generando ? '⏳...' : archivo ? '🔄 Regenerar' : '⬇️ Generar'}
                                </button>
                            )}
                            {doc.generando && !doc.seleccionado && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 ml-2 flex-shrink-0">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EnviarCorreoMultipleFacturasModal;
