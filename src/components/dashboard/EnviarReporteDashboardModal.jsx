// src/components/dashboard/EnviarReporteDashboardModal.jsx
import React, { useState, useEffect } from 'react';
import { capturarDashboardComoPDF, enviarReportePorCorreo } from '../../services/dashboard/reporteDashboardService';
import DestinatariosSelector from '../facturacion/DestinatariosSelector';
import Swal from 'sweetalert2';

/**
 * Modal para generar y enviar el reporte del dashboard por correo.
 *
 * Props:
 *  - visible        {boolean}     — controla si el modal está abierto
 *  - onCerrar       {Function}    — callback al cerrar
 *  - dashboardRef   {React.ref}   — ref del div principal del dashboard
 *  - fechaInicio    {string}      — YYYY-MM-DD
 *  - fechaFin       {string}      — YYYY-MM-DD
 */
const EnviarReporteDashboardModal = ({
    visible,
    onCerrar,
    dashboardRef,
    fechaInicio,
    fechaFin,
}) => {
    const [seleccionados, setSeleccionados] = useState([]);
    const [asunto, setAsunto] = useState('');
    const [progreso, setProgreso] = useState(0);
    const [fase, setFase] = useState('idle'); // idle | capturando | enviando | ok | error
    const [mensajeError, setMensajeError] = useState('');

    // Inicializar asunto al abrir
    useEffect(() => {
        if (!visible) return;

        setAsunto(`Reporte Dashboard Dibufala – ${fechaInicio} al ${fechaFin}`);
        setProgreso(0);
        setFase('idle');
        setMensajeError('');
        setSeleccionados([]);
    }, [visible, fechaInicio, fechaFin]);

    const handleEnviar = async () => {
        if (seleccionados.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin destinatarios',
                text: 'Seleccione al menos un destinatario antes de enviar.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }
        if (!asunto.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Asunto vacío',
                text: 'Por favor escriba un asunto para el correo.',
                confirmButtonColor: '#1e3a8a',
            });
            return;
        }

        try {
            // ── Paso 1: Capturar PDF ──────────────────────────────────────
            setFase('capturando');
            setProgreso(5);

            const pdfBase64 = await capturarDashboardComoPDF(
                dashboardRef.current,
                (p) => setProgreso(p)
            );

            // ── Paso 2: Enviar correo ─────────────────────────────────────
            setFase('enviando');
            setProgreso(95);

            await enviarReportePorCorreo({
                destinatarios: seleccionados,
                asunto: asunto.trim(),
                pdfBase64,
                fechaInicio,
                fechaFin,
            });

            setProgreso(100);
            setFase('ok');

        } catch (err) {
            setFase('error');
            setMensajeError(err.message ?? 'Error desconocido');
        }
    };

    const handleCerrar = () => {
        if (fase === 'capturando' || fase === 'enviando') return; // No cerrar mientras procesa
        setFase('idle');
        setProgreso(0);
        onCerrar();
    };

    if (!visible) return null;

    const enProceso = fase === 'capturando' || fase === 'enviando';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

                {/* ── Encabezado ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-800">Enviar reporte por correo</h2>
                            <p className="text-xs text-gray-500">{fechaInicio} al {fechaFin}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCerrar}
                        disabled={enProceso}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── Contenido ──────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                    {/* Estado: OK */}
                    {fase === 'ok' && (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-700 font-semibold text-base">¡Reporte enviado correctamente!</p>
                            <p className="text-gray-500 text-sm text-center">
                                El PDF del dashboard fue enviado a {seleccionados.length} destinatario(s).
                            </p>
                            <button
                                onClick={handleCerrar}
                                className="mt-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}

                    {/* Estado: Error */}
                    {fase === 'error' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-3">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-red-700 font-semibold">Error al enviar el reporte</p>
                            <p className="text-gray-500 text-sm text-center">{mensajeError}</p>
                            <button
                                onClick={() => setFase('idle')}
                                className="mt-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}

                    {/* Estado: Procesando */}
                    {enProceso && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="text-gray-700 font-medium">
                                {fase === 'capturando' ? 'Generando PDF del dashboard...' : 'Enviando correo...'}
                            </p>
                            {/* Barra de progreso */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progreso}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400">{progreso}%</p>
                            <p className="text-xs text-gray-400 text-center">
                                {fase === 'capturando'
                                    ? 'Esto puede tomar algunos segundos según el tamaño del dashboard.'
                                    : 'Enviando el correo, por favor espere...'}
                            </p>
                        </div>
                    )}

                    {/* Formulario normal (idle) */}
                    {fase === 'idle' && (
                        <>
                            {/* Asunto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                                <input
                                    type="text"
                                    value={asunto}
                                    onChange={(e) => setAsunto(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Asunto del correo"
                                />
                            </div>

                            {/* Destinatarios con DestinatariosSelector */}
                            <DestinatariosSelector
                                destinatariosSeleccionados={seleccionados}
                                onCambio={setSeleccionados}
                                puedeAgregar={true}
                                puedeEditar={true}
                                puedeEliminar={true}
                            />

                            {/* Info del adjunto */}
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <p className="text-xs text-amber-700">
                                    Se adjuntará un PDF con la captura completa del dashboard
                                    (KPIs, gráficas de ventas y costos de transporte).
                                    La generación puede tomar unos segundos.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Pie con botones (solo en idle) ─────────────────────── */}
                {fase === 'idle' && (
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={handleCerrar}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleEnviar}
                            disabled={seleccionados.length === 0}
                            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Generar PDF y enviar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnviarReporteDashboardModal;
