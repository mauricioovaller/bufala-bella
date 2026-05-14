// src/pages/PedidosChile.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import PedidoChileHeader from "../components/pedidosChile/PedidoChileHeader";
import PedidoChileDetail from "../components/pedidosChile/PedidoChileDetail";
import ModalVisorPreliminar from "../components/ModalVisorPreliminar";
import {
    getDatosSelectChile,
    guardarPedidoChile,
    getPedidosChile,
    getPedidoChileEspecifico,
    actualizarPedidoChile,
    imprimirPedidoChile,
} from "../services/pedidosChileService";

function todayISODate() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function emptyHeader() {
    return {
        idPedido: null,
        numero: "CHI-000000",
        clienteId: "",
        numeroOrden: "",
        guiaAerea: "",
        guiaHija: "",
        idAgencia: "",
        idAerolinea: "",
        fechaRecepcionOrden: todayISODate(),
        fechaSalida: "",
        fechaEnroute: "",
        fechaDelivery: "",
        fechaSolicitudEntrega: "",
        fechaFinalEntrega: "",
        cantidadEstibas: 1,
        descuentoComercial: 0,
        observaciones: "",
        facturaNo: "",
    };
}

export default function PedidosChile() {
    const [header, setHeader] = useState(emptyHeader());
    const [items, setItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [comentariosSeleccionados, setComentariosSeleccionados] = useState({
        incluirPrimario: true,
        incluirSecundario: true,
    });
    const [datosSelect, setDatosSelect] = useState({ clientesChile: [], productosChile: [], agencias: [], aerolineas: [] });
    const [loadingDatos, setLoadingDatos] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [loadingPedidos, setLoadingPedidos] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [urlPDF, setUrlPDF] = useState(null);
    const [mostrarPDF, setMostrarPDF] = useState(false);

    const inputRefs = {
        clienteId: useRef(null),
        fechaRecepcionOrden: useRef(null),
    };

    useEffect(() => {
        async function cargarDatos() {
            try {
                setLoadingDatos(true);
                const res = await getDatosSelectChile();
                if (res?.success) {
                    setDatosSelect({
                        clientesChile: res.clientesChile || [],
                        productosChile: res.productosChile || [],
                        agencias: res.agencias || [],
                        aerolineas: res.aerolineas || [],
                    });
                }
            } catch {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los datos iniciales." });
            } finally {
                setLoadingDatos(false);
            }
        }
        cargarDatos();
    }, []);

    const handleHeaderChange = useCallback((field, value) => {
        setHeader((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleComentariosChange = useCallback((campo, valor) => {
        setComentariosSeleccionados((prev) => ({ ...prev, [campo]: valor }));
    }, []);

    const handleItemsChange = useCallback((newItems) => {
        setItems(newItems);
    }, []);

    function validateAll() {
        if (!header.clienteId) {
            inputRefs.clienteId.current?.focus();
            Swal.fire("Error", "El cliente Chile es obligatorio.", "warning");
            return false;
        }
        if (!header.fechaRecepcionOrden) {
            inputRefs.fechaRecepcionOrden.current?.focus();
            Swal.fire("Error", "La fecha de recepcion de la orden es obligatoria.", "warning");
            return false;
        }
        if (!items || items.length === 0) {
            Swal.fire("Error", "Agrega al menos una linea al detalle.", "warning");
            return false;
        }
        for (let i = 0; i < items.length; i++) {
            if (!items[i].productoId) {
                Swal.fire("Error", `Fila ${i + 1}: Debe seleccionar un producto.`, "warning");
                return false;
            }
            if (!items[i].cantidadCajas || Number(items[i].cantidadCajas) <= 0) {
                Swal.fire("Error", `Fila ${i + 1}: La cantidad de cajas debe ser mayor que cero.`, "warning");
                return false;
            }
        }
        return true;
    }

    async function handleSave() {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (!validateAll()) return;
            const res = await guardarPedidoChile(header, items);
            if (res?.success) {
                const nuevoNumero = res.numero || `CHI-${String(res.idPedido).padStart(6, "0")}`;
                setHeader((prev) => ({ ...prev, idPedido: res.idPedido, numero: nuevoNumero }));
                Swal.fire("Guardado!", `Pedido ${nuevoNumero} guardado correctamente.`, "success");
            } else {
                Swal.fire("Error", res?.message || "No se pudo guardar.", "error");
            }
        } catch {
            Swal.fire("Error", "Ocurrio un error al guardar el pedido.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleUpdate() {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (!header.idPedido) {
                Swal.fire("Aviso", "No hay pedido cargado para actualizar.", "info");
                return;
            }
            if (!validateAll()) return;
            const res = await actualizarPedidoChile({ ...header }, items);
            if (res?.success) {
                Swal.fire("Actualizado!", `Pedido ${header.numero} actualizado correctamente.`, "success");
            } else {
                Swal.fire("Error", res?.message || "No se pudo actualizar.", "error");
            }
        } catch {
            Swal.fire("Error", "Ocurrio un error al actualizar el pedido.", "error");
        } finally {
            setIsSaving(false);
        }
    }

    function handleNew() {
        setHeader(emptyHeader());
        setItems([]);
    }

    function handleRefresh() {
        if (!header.idPedido) {
            Swal.fire("Aviso", "Primero cargue o guarde un pedido.", "info");
            return;
        }
        handleSelectPedido(header.idPedido);
    }

    async function handleOpenModal() {
        setShowModal(true);
        setLoadingPedidos(true);
        setBusqueda("");
        try {
            const res = await getPedidosChile();
            if (res?.success) {
                setPedidos(res.pedidos || []);
            } else {
                Swal.fire("Error", "No se pudieron cargar los pedidos Chile.", "error");
            }
        } catch {
            Swal.fire("Error", "Error al obtener los pedidos Chile.", "error");
        } finally {
            setLoadingPedidos(false);
        }
    }

    function cerrarModal() {
        setShowModal(false);
        setPedidos([]);
        setBusqueda("");
    }

    async function handleSelectPedido(idPedido) {
        try {
            const res = await getPedidoChileEspecifico(idPedido);
            if (!res?.success) {
                Swal.fire("Error", res?.message || "No se pudo cargar el pedido.", "error");
                return;
            }
            const enc = res.encabezado;
            setHeader({
                idPedido: enc.Id_EncabPedidoChile,
                numero: `CHI-${String(enc.Id_EncabPedidoChile).padStart(6, "0")}`,
                clienteId: String(enc.Id_ClienteChile || ""),
                numeroOrden: enc.NumeroOrden || "",
                guiaAerea: enc.GuiaAerea || "",
                guiaHija: enc.GuiaHija || "",
                idAgencia: String(enc.IdAgencia || ""),
                idAerolinea: String(enc.IdAerolinea || ""),
                fechaRecepcionOrden: enc.FechaRecepcionOrden || "",
                fechaSalida: enc.FechaSalida || "",
                fechaEnroute: enc.FechaEnroute || "",
                fechaDelivery: enc.FechaDelivery || "",
                fechaSolicitudEntrega: enc.FechaSolicitudEntrega || "",
                fechaFinalEntrega: enc.FechaFinalEntrega || "",
                cantidadEstibas: enc.CantidadEstibas || 1,
                descuentoComercial: enc.DescuentoComercial || 0,
                observaciones: enc.Observaciones || "",
                facturaNo: enc.FacturaNo || "",
            });
            const detItems = (res.detalle || []).map((d) => {
                const cajas = parseFloat(d.CantidadCajas) || 0;
                const envase = parseInt(d.EnvaseInternoxCaja) || 0;
                const pesoNetoGr = parseFloat(d.PesoNetoGr) || 0;
                const pesoEscurridoKg = parseFloat(d.PesoEscurridoKg) || 0;
                const factorPB = parseFloat(d.FactorPesoBruto) || 0;
                const valorKilo = parseFloat(d.ValorXKilo) || 0;
                const unidades = cajas * envase;
                const pesoEscCaja = pesoEscurridoKg * envase;
                const pesoEscTotal = pesoEscCaja * cajas;
                const pesoNetoTotal = (pesoNetoGr / 1000) * unidades;
                const pesoBrutoTotal = pesoNetoTotal * factorPB;
                const valorTotal = pesoEscTotal * valorKilo;
                return {
                    id: Date.now() + Math.random(),
                    productoId: String(d.Id_ProductoChile || ""),
                    descripcion: d.Descripcion || "",
                    codigoCliente: d.CodigoCliente || "",
                    codigoSiesa: d.CodigoSiesa || "",
                    lote: d.Lote || "",
                    fechaElaboracion: d.FechaElaboracion || "",
                    fechaVencimiento: d.FechaVencimiento || "",
                    pesoNetoGr,
                    cantidadCajas: cajas,
                    envaseInternoxCaja: envase,
                    pesoEscurridoKg,
                    factorPesoBruto: factorPB,
                    valorxKilo: valorKilo,
                    unidadesSolicitadas: unidades,
                    pesoEscurridoxCaja: pesoEscCaja,
                    pesoEscurridoTotal: pesoEscTotal,
                    pesoNetoTotal,
                    pesoBrutoTotal,
                    valorTotal,
                };
            });
            setItems(detItems);
            cerrarModal();
            Swal.fire("Cargado", "Pedido Chile cargado correctamente.", "success");
        } catch {
            Swal.fire("Error", "Error al obtener el pedido Chile.", "error");
        }
    }

    async function handlePrint() {
        if (!header.idPedido) {
            Swal.fire("Aviso", "No hay pedido para imprimir. Guarde primero.", "info");
            return;
        }
        Swal.fire({ title: "Generando PDF...", text: "Lista de Empaque Chile", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            const ua = navigator.userAgent || navigator.vendor || window.opera;
            const esMovilOTablet = !/Win|Mac/i.test(ua);
            let tabPreabierta = null;
            if (esMovilOTablet) {
                try { tabPreabierta = window.open("", "_blank"); } catch { /* noop */ }
            }
            const blob = await imprimirPedidoChile(header.idPedido);
            const fileURL = URL.createObjectURL(blob);
            Swal.close();
            if (esMovilOTablet) {
                if (tabPreabierta) {
                    tabPreabierta.location.href = fileURL;
                } else {
                    const a = document.createElement("a");
                    a.href = fileURL;
                    a.target = "_blank";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                }
                setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
            } else {
                setUrlPDF(fileURL);
                setMostrarPDF(true);
            }
        } catch {
            Swal.close();
            Swal.fire({ icon: "error", title: "Error", text: "No se pudo generar la Lista de Empaque Chile." });
        }
    }

    const subTotal = items.reduce((acc, it) => acc + (parseFloat(it.valorTotal) || 0), 0);
    const descuento = parseFloat(header.descuentoComercial) || 0;
    const totalFinal = subTotal - descuento;

    const pedidosFiltrados = pedidos.filter((p) => {
        if (!busqueda.trim()) return true;
        const f = busqueda.toLowerCase();
        return (
            String(p.Id_EncabPedidoChile).includes(busqueda) ||
            (p.NombreCliente || "").toLowerCase().includes(f) ||
            (p.NumeroOrden || "").toLowerCase().includes(f)
        );
    });

    return (
        <div className="p-4 md:p-6 space-y-4 min-h-screen bg-gray-100">
            {/* Barra de acciones */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-700">Gestión de Pedidos Chile</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-blue-700 transition font-medium flex-1"
                    >
                        Buscar Pedidos
                    </button>
                    <button
                        onClick={header.idPedido ? handleUpdate : handleSave}
                        disabled={isSaving}
                        className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${isSaving
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                            }`}
                    >
                        {isSaving
                            ? (header.idPedido ? "Actualizando..." : "Guardando...")
                            : (header.idPedido ? "Actualizar Pedido" : "Guardar Pedido")
                        }
                    </button>
                    <button
                        onClick={handleNew}
                        className="bg-gray-500 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-600 transition font-medium flex-1"
                    >
                        Nuevo Pedido
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!header.idPedido}
                        className={`rounded-lg px-4 py-3 sm:py-2 transition font-medium flex-1 ${header.idPedido
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        Imprimir PDF
                    </button>
                    <button
                        className="bg-green-600 text-white rounded-lg px-4 py-3 sm:py-2 hover:bg-green-700 transition font-medium flex-1"
                        onClick={() => Swal.fire("Info", "Funcionalidad de impresión múltiple próximamente disponible.", "info")}
                    >
                        Imprimir Múltiple
                    </button>
                </div>
            </div>

            {loadingDatos ? (
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    <PedidoChileHeader
                        header={header}
                        onChange={handleHeaderChange}
                        clientesChile={datosSelect.clientesChile}
                        agencias={datosSelect.agencias}
                        aerolineas={datosSelect.aerolineas}
                        inputRefs={inputRefs}
                        comentariosSeleccionados={comentariosSeleccionados}
                        onComentariosChange={handleComentariosChange}
                    />
                    <PedidoChileDetail
                        items={items}
                        productosChile={datosSelect.productosChile}
                        onChangeItems={handleItemsChange}
                    />
                    <section className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                        <div className="flex flex-col items-end gap-2 text-sm sm:text-base">
                            <div className="flex justify-between w-full max-w-xs">
                                <span className="text-gray-600">Sub Total (USD):</span>
                                <span className="font-medium">$ {subTotal.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-xs">
                                <span className="text-gray-600">Descuento Comercial (USD):</span>
                                <span className="font-medium text-red-600">- $ {descuento.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-xs border-t pt-2">
                                <span className="text-gray-800 font-semibold">Total (USD):</span>
                                <span className="font-bold text-blue-700 text-lg">$ {totalFinal.toFixed(4)}</span>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">Seleccionar Pedido Chile</h2>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-4 border-b">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por numero, cliente u orden..."
                                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {loadingPedidos ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : pedidosFiltrados.length === 0 ? (
                                <p className="text-center text-gray-400 italic py-10">
                                    {busqueda ? "Sin resultados." : "No hay pedidos Chile registrados."}
                                </p>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Numero</th>
                                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Cliente</th>
                                            <th className="px-4 py-2 text-left text-gray-600 font-medium">N Orden</th>
                                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Fecha Recepcion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidosFiltrados.map((p, idx) => (
                                            <tr
                                                key={p.Id_EncabPedidoChile}
                                                onClick={() => handleSelectPedido(p.Id_EncabPedidoChile)}
                                                className={`cursor-pointer hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                            >
                                                <td className="px-4 py-2 font-medium text-blue-700">
                                                    CHI-{String(p.Id_EncabPedidoChile).padStart(6, "0")}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">{p.NombreCliente}</td>
                                                <td className="px-4 py-2 text-gray-500">{p.NumeroOrden || "-"}</td>
                                                <td className="px-4 py-2 text-gray-500">{p.FechaRecepcionOrden || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button onClick={cerrarModal} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarPDF && urlPDF && (
                <ModalVisorPreliminar
                    url={urlPDF}
                    onClose={() => {
                        setMostrarPDF(false);
                        URL.revokeObjectURL(urlPDF);
                        setUrlPDF(null);
                    }}
                />
            )}
        </div>
    );
}