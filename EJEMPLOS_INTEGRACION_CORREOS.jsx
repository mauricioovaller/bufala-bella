/**
 * EJEMPLOS DE INTEGRACIÓN
 * Cómo integrar los nuevos componentes en tu aplicación
 */

// ============================================
// EJEMPLO 1: Integrar ConfiguracionCorreos en las rutas
// ============================================

// Archivo: src/App.jsx o src/pages/Principal.jsx

import ConfiguracionCorreos from './components/facturacion/ConfiguracionCorreos';

function App() {
    return (
        <Routes>
            {/* Rutas existentes */}
            <Route path="/facturacion" element={<FacturacionMain />} />

            {/* NUEVA RUTA - Configuración de Correos */}
            <Route path="/configuracion/correos" element={<ConfiguracionCorreos />} />

            {/* Más rutas... */}
        </Routes>
    );
}

// ============================================
// EJEMPLO 2: Agregar enlace en menú de navegación
// ============================================

// En tu componente de navegación/menú:

<nav className="bg-gray-800 text-white p-4">
    <ul className="space-y-2">
        {/* Otros enlaces */}

        {/* NUEVO ENLACE */}
        <li>
            <a href="/configuracion/correos" className="hover:text-blue-300">
                📧 Correos - Configuración
            </a>
        </li>
    </ul>
</nav>

// ============================================
// EJEMPLO 3: Usar DestinatariosSelector en otro componente
// ============================================

import { useState } from 'react';
import DestinatariosSelector from './components/facturacion/DestinatariosSelector';

function MiComponente() {
    const [correosSeleccionados, setCorreosSeleccionados] = useState([]);

    return (
        <div>
            <h2>Enviar a múltiples destinatarios</h2>

            {/* El selector */}
            <DestinatariosSelector
                destinatariosSeleccionados={correosSeleccionados}
                onCambio={setCorreosSeleccionados}
                puedeAgregar={true}
                puedeEditar={true}
                puedeEliminar={true}
            />

            {/* Botón para procesar */}
            {correosSeleccionados.length > 0 && (
                <button
                    onClick={() => {
                        console.log('Enviando a:', correosSeleccionados);
                        // Tu lógica aquí
                    }}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
                >
                    Enviar a {correosSeleccionados.length} correos
                </button>
            )}
        </div>
    );
}

// ============================================
// EJEMPLO 4: Usar datos de cuentas de correo
// ============================================

import { obtenerCuentasCorreoActivas, obtenerCuentaCorreoPredeterminada } from './services/correoService';
import { useState, useEffect } from 'react';

function MiComponenteConCuentas() {
    const [cuentas, setCuentas] = useState([]);
    const [cuentaPredeterminada, setCuentaPredeterminada] = useState(null);

    useEffect(() => {
        // Cargar cuentas activas
        obtenerCuentasCorreoActivas()
            .then(res => {
                if (res.success) {
                    setCuentas(res.cuentas);
                }
            })
            .catch(err => console.error('Error:', err));

        // Cargar cuenta predeterminada
        obtenerCuentaCorreoPredeterminada()
            .then(res => {
                if (res.success) {
                    setCuentaPredeterminada(res.cuenta);
                }
            })
            .catch(err => console.error('Error:', err));
    }, []);

    return (
        <div>
            <h3>Cuenta predeterminada: {cuentaPredeterminada?.nombre}</h3>
            <p>Email: {cuentaPredeterminada?.email_remitente}</p>

            <h4>Todas las cuentas activas:</h4>
            <ul>
                {cuentas.map(cuenta => (
                    <li key={cuenta.id}>
                        {cuenta.nombre} ({cuenta.email_remitente})
                        {cuenta.predeterminada && <span> ⭐</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ============================================
// EJEMPLO 5: Crear dropdown de cuentas
// ============================================

import { useState, useEffect } from 'react';
import { obtenerCuentasCorreoActivas } from './services/correoService';

function SelectorCuentaCorreo({ onSelect }) {
    const [cuentas, setCuentas] = useState([]);
    const [seleccionada, setSeleccionada] = useState('');

    useEffect(() => {
        obtenerCuentasCorreoActivas()
            .then(res => {
                if (res.success) {
                    setCuentas(res.cuentas);
                    // Preseleccionar predeterminada
                    const pred = res.cuentas.find(c => c.predeterminada);
                    if (pred) {
                        setSeleccionada(pred.id);
                        onSelect(pred);
                    }
                }
            });
    }, []);

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                Enviar desde:
            </label>
            <select
                value={seleccionada}
                onChange={(e) => {
                    const cuenta = cuentas.find(c => c.id === parseInt(e.target.value));
                    setSeleccionada(e.target.value);
                    onSelect(cuenta);
                }}
                className="border rounded px-3 py-2 w-full"
            >
                <option value="">-- Seleccionar cuenta --</option>
                {cuentas.map(cuenta => (
                    <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre} ({cuenta.email_remitente})
                        {cuenta.predeterminada ? ' ⭐ Predeterminada' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ============================================
// EJEMPLO 6: Usar en EnviarCorreoFacturaModal
// ============================================

// YA ESTÁ IMPLEMENTADO - Solo como referencia

import DestinatariosSelector from './DestinatariosSelector';

// En el componente EnviarCorreoFacturaModal:
<DestinatariosSelector
    destinatariosSeleccionados={destinatarios}
    onCambio={setDestinatarios}
    puedeAgregar={true}
    puedeEditar={true}
    puedeEliminar={true}
/>

// Los cambios se guardan directamente en el estado `destinatarios`
// que es el mismo usado por la funcionalidad existente de envío

// ============================================
// EJEMPLO 7: Manejar errores de conexión SMTP
// ============================================

import { probarConexionSMTP } from './services/correoService';
import Swal from 'sweetalert2';

async function probarCuenta(cuentaId) {
    try {
        const respuesta = await probarConexionSMTP({
            id: cuentaId,
            email_prueba: 'test@example.com' // Email para recibir test
        });

        if (respuesta.success) {
            Swal.fire({
                icon: 'success',
                title: 'Conexión exitosa',
                text: `${respuesta.detalles.servidor}:${respuesta.detalles.puerto} (${respuesta.detalles.protocolo})`
            });
        } else {
            throw new Error(respuesta.message);
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: error.message,
            html: `<pre style="text-align: left;">${error.message}</pre>`
        });
    }
}

// ============================================
// EJEMPLO 8: Panel completo de configuración
// ============================================

import ConfiguracionCorreos from './components/facturacion/ConfiguracionCorreos';
import DestinatariosSelector from './components/facturacion/DestinatariosSelector';

function PanelConfiguracion() {
    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Sección 1: Configuración de cuentas SMTP */}
                <section>
                    <h1 className="text-3xl font-bold mb-6">Configuración de Sistema</h1>
                    <ConfiguracionCorreos />
                </section>

                {/* Sección 2: Información (solo lectura) */}
                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">ℹ️ Información Importante</h2>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 space-y-2 text-sm">
                        <p><strong>Cuentas SMTP:</strong> Las cuentas configuradas arriba se usarán para enviar correos.</p>
                        <p><strong>Destinatarios:</strong> Usa el botón "+ Agregar" para crear nuevos destinatarios.</p>
                        <p><strong>Seguridad:</strong> Las contraseñas se guardan encriptadas de forma segura.</p>
                        <p><strong>Pruebas:</strong> Usa "Probar" para verificar que la conexión funciona.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default PanelConfiguracion;

// ============================================
// EJEMPLO 9: Usar en componente personalizado
// ============================================

import { crearDestinatario, obtenerDestinatarios } from './services/correoService';

function MiFormularioCorreo() {
    const handleAgregarDestinatario = async (nombre, email) => {
        try {
            const respuesta = await crearDestinatario({
                nombre: nombre,
                email: email,
                tipo: 'cliente'
            });

            if (respuesta.success) {
                console.log('Destinatario creado:', respuesta);
                // Recargar lista
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleAgregarDestinatario(
                formData.get('nombre'),
                formData.get('email')
            );
        }}>
            <input name="nombre" type="text" placeholder="Nombre" required />
            <input name="email" type="email" placeholder="Email" required />
            <button type="submit">Agregar</button>
        </form>
    );
}

// ============================================
// EJEMPLO 10: Testing en consola del navegador
// ============================================

// Abre F12 → Console y ejecuta:

// Obtener todas las cuentas
fetch('https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos/ApiCorreosCuentasConfiguracion.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'listar' })
})
    .then(r => r.json())
    .then(data => console.log('Cuentas:', data));

// Obtener cuenta predeterminada
fetch('https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos/ApiCorreosCuentasConfiguracion.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'obtener_predeterminada' })
})
    .then(r => r.json())
    .then(data => console.log('Predeterminada:', data));

// ============================================
