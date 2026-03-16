// src/pages/ComplementoFacturas.jsx
import React, { useState } from "react";
import Swal from "sweetalert2";
import {
  getFacturasConDetalle,
  actualizarComplementoFactura,
  exportarComplementoExcel,
} from "../services/planVallejo/planVallejoService";

function todayISODate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function ComplementoFacturas() {
  const [fechaDesde, setFechaDesde] = useState(todayISODate());
  const [fechaHasta, setFechaHasta] = useState(todayISODate());
  const [numeroFactura, setNumeroFactura] = useState("");
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [itemsEditados, setItemsEditados] = useState({});

  const handleBuscar = async () => {
    if (!fechaDesde || !fechaHasta) {
      Swal.fire("Aviso", "Debe seleccionar un rango de fechas", "warning");
      return;
    }

    setCargando(true);
    try {
      const filtros = { fechaDesde, fechaHasta };
      if (numeroFactura.trim() !== "") {
        filtros.numeroFactura = parseInt(numeroFactura, 10);
      }

      const res = await getFacturasConDetalle(filtros);
      if (res.success) {
        setFacturas(res.facturas || []);
        setItemsEditados({});
        if (res.facturas.length === 0) {
          Swal.fire("Info", "No se encontraron facturas en el rango seleccionado", "info");
        }
      } else {
        Swal.fire("Error", res.message || "Error al cargar facturas", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error de conexión al servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  const handleItemChange = (idDetInvoice, campo, valor) => {
    setItemsEditados((prev) => ({
      ...prev,
      [idDetInvoice]: {
        ...(prev[idDetInvoice] || {}),
        [campo]: valor,
      },
    }));
  };

  const handleGuardar = async () => {
    // Recorremos todas las facturas y sus ítems que aplican a Plan Vallejo
    const items = [];
    facturas.forEach((factura) => {
      factura.items.forEach((item) => {
        if (item.planVallejo === -1) {
          items.push({
            idDetInvoice: item.idDetInvoice,
            dex: getItemValue(item, "dex"),
            dia: getItemValue(item, "dia") || null,
            mes: getItemValue(item, "mes") || null,
            anio: getItemValue(item, "anio") || null,
            ad: getItemValue(item, "ad") || "03",        // 👈 Campo AD incluido
            pais: getItemValue(item, "pais") || "269",
            cip: getItemValue(item, "cip") || item.codigoCIP || "",
            unidad: getItemValue(item, "unidad") || "Kilogramo",
            fob: getItemValue(item, "fob") || null,
            van: getItemValue(item, "van") || null,
            porcentaje: getItemValue(item, "porcentaje") || null,
            reposicion: getItemValue(item, "reposicion") || "En Proceso",
          });
        }
      });
    });

    if (items.length === 0) {
      Swal.fire("Aviso", "No hay ítems de Plan Vallejo para guardar", "info");
      return;
    }

    try {
      const res = await actualizarComplementoFactura(items);
      if (res.success) {
        Swal.fire("Éxito", `Se actualizaron ${res.actualizados} ítems`, "success");
        handleBuscar();
      } else {
        Swal.fire("Error", res.message || "Error al guardar", "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error de conexión al servidor", "error");
    }
  };

  const handleExportar = async () => {
    if (!fechaDesde || !fechaHasta) {
      Swal.fire("Aviso", "Debe seleccionar un rango de fechas", "warning");
      return;
    }

    try {
      Swal.fire({
        title: "Generando Excel...",
        text: "Por favor espere",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const blob = await exportarComplementoExcel({ fechaDesde, fechaHasta });
      Swal.close();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Complemento_${fechaDesde}_a_${fechaHasta}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error al generar el archivo", "error");
    }
  };

  const getItemValue = (item, campo) => {
    if (itemsEditados[item.idDetInvoice] && itemsEditados[item.idDetInvoice][campo] !== undefined) {
      return itemsEditados[item.idDetInvoice][campo];
    }
    return item[campo] || "";
  };

  const getFechaParts = (fechaISO) => {
    if (!fechaISO) return { dia: "", mes: "", anio: "" };
    const [anio, mes, dia] = fechaISO.split("-");
    return { dia, mes, anio };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">
          Complemento de Facturas (Plan Vallejo)
        </h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">N° Factura (opcional)</label>
            <input
              type="number"
              value={numeroFactura}
              onChange={(e) => setNumeroFactura(e.target.value)}
              placeholder="Ej: 12345"
              className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleBuscar}
              disabled={cargando}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium flex-1 disabled:bg-blue-300"
            >
              {cargando ? "Buscando..." : "Buscar"}
            </button>
            <button
              onClick={handleExportar}
              className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition font-medium"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Resultados */}
        {facturas.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Facturas encontradas: {facturas.length}
              </h3>
              <button
                onClick={handleGuardar}
                className="bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 transition font-medium"
              >
                Guardar cambios
              </button>
            </div>

            <div className="space-y-3">
              {facturas.map((factura) => {
                const fechaParts = getFechaParts(factura.fecha);
                return (
                  <div key={factura.idFactura} className="border rounded-lg overflow-hidden">
                    {/* Encabezado */}
                    <div className="bg-gray-100 p-3 flex flex-wrap justify-between items-center">
                      <div>
                        <span className="font-bold text-blue-800">{factura.numeroFactura}</span>
                        <span className="ml-4 text-sm text-gray-600">{factura.fecha}</span>
                        <span className="ml-4 text-sm text-gray-800">{factura.consignatario}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Ítems: {factura.items.length}
                      </div>
                    </div>

                    {/* Detalle */}
                    <div className="p-3 bg-white">
                      {/* Vista escritorio */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full text-xs whitespace-nowrap">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 text-left">DEX</th>
                              <th className="p-2 text-center">D</th>
                              <th className="p-2 text-center">M</th>
                              <th className="p-2 text-center">A</th>
                              <th className="p-2 text-center">AD</th>
                              <th className="p-2 text-center">País</th>
                              <th className="p-2 text-left">Descripción</th>
                              <th className="p-2 text-center">CIP</th>
                              <th className="p-2 text-center">Unidad</th>
                              <th className="p-2 text-right">Kg</th>
                              <th className="p-2 text-right">FOB</th>
                              <th className="p-2 text-right">VAN</th>
                              <th className="p-2 text-right">%</th>
                              <th className="p-2 text-left">Reposición</th>
                              <th className="p-2 text-center">Unidades</th>
                            </tr>
                          </thead>
                          <tbody>
                            {factura.items.map((item) => {
                              if (item.planVallejo !== -1) {
                                return (
                                  <tr key={item.idDetInvoice} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{item.codigoSiesa}</td>
                                    <td className="p-2 max-w-xs truncate">{item.descripFactura}</td>
                                    <td className="p-2 text-right">{item.kilogramos}</td>
                                    <td colSpan="12" className="p-2 text-center text-gray-500">
                                      No aplica Plan Vallejo
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={item.idDetInvoice} className="border-b hover:bg-gray-50">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={getItemValue(item, "dex")}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "dex", e.target.value)}
                                      className="border rounded p-1 w-20 text-xs"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={getItemValue(item, "dia") || fechaParts.dia}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "dia", e.target.value)}
                                      className="border rounded p-1 w-12 text-xs text-center"
                                      min="1" max="31"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={getItemValue(item, "mes") || fechaParts.mes}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "mes", e.target.value)}
                                      className="border rounded p-1 w-12 text-xs text-center"
                                      min="1" max="12"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={getItemValue(item, "anio") || fechaParts.anio}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "anio", e.target.value)}
                                      className="border rounded p-1 w-16 text-xs text-center"
                                      min="2000" max="2100"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={getItemValue(item, "ad") || "03"}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "ad", e.target.value)}
                                      className="border rounded p-1 w-12 text-xs text-center"
                                      maxLength="3"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={getItemValue(item, "pais") || "269"}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "pais", e.target.value)}
                                      className="border rounded p-1 w-12 text-xs text-center"
                                      maxLength="3"
                                    />
                                  </td>
                                  <td className="p-2 max-w-xs truncate">{item.descripFactura}</td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={getItemValue(item, "cip") || item.codigoCIP || ""}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "cip", e.target.value)}
                                      className="border rounded p-1 w-12 text-xs text-center"
                                      maxLength="2"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={getItemValue(item, "unidad") || "Kilogramo"}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "unidad", e.target.value)}
                                      className="border rounded p-1 w-20 text-xs"
                                    />
                                  </td>
                                  <td className="p-2 text-right">{item.kilogramos}</td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={getItemValue(item, "fob")}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "fob", e.target.value)}
                                      className="border rounded p-1 w-20 text-xs text-right"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={getItemValue(item, "van")}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "van", e.target.value)}
                                      className="border rounded p-1 w-20 text-xs text-right"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={getItemValue(item, "porcentaje")}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "porcentaje", e.target.value)}
                                      className="border rounded p-1 w-16 text-xs text-right"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={getItemValue(item, "reposicion")}
                                      onChange={(e) => handleItemChange(item.idDetInvoice, "reposicion", e.target.value)}
                                      className="border rounded p-1 w-24 text-xs"
                                    />
                                  </td>
                                  <td className="p-2 text-right">{item.cantidadEmbalaje}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Vista móvil */}
                      <div className="md:hidden space-y-4">
                        {factura.items.map((item) => {
                          if (item.planVallejo !== -1) {
                            return (
                              <div key={item.idDetInvoice} className="border rounded p-3 bg-gray-50">
                                <div className="font-bold text-sm">{item.codigoSiesa} - {item.descripFactura}</div>
                                <div className="text-xs">Kg: {item.kilogramos}</div>
                                <div className="text-xs text-gray-500 mt-1">No aplica Plan Vallejo</div>
                              </div>
                            );
                          }

                          return (
                            <div key={item.idDetInvoice} className="border rounded p-3 bg-gray-50">
                              {/* Fila 1: DEX, D, M, A, AD, País */}
                              <div className="grid grid-cols-6 gap-1 mb-2">
                                <div>
                                  <label className="text-xs font-medium">DEX</label>
                                  <input
                                    type="text"
                                    value={getItemValue(item, "dex")}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "dex", e.target.value)}
                                    className="border rounded p-1 w-full text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">D</label>
                                  <input
                                    type="number"
                                    value={getItemValue(item, "dia") || fechaParts.dia}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "dia", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">M</label>
                                  <input
                                    type="number"
                                    value={getItemValue(item, "mes") || fechaParts.mes}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "mes", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">A</label>
                                  <input
                                    type="number"
                                    value={getItemValue(item, "anio") || fechaParts.anio}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "anio", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">AD</label>
                                  <input
                                    type="text"
                                    value={getItemValue(item, "ad") || "03"}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "ad", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-center"
                                    maxLength="3"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">País</label>
                                  <input
                                    type="text"
                                    value={getItemValue(item, "pais") || "269"}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "pais", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-center"
                                  />
                                </div>
                              </div>

                              {/* Descripción */}
                              <div className="mb-2">
                                <label className="text-xs font-medium">Descripción</label>
                                <div className="text-xs bg-gray-100 p-2 rounded">
                                  {item.descripFactura}
                                </div>
                              </div>

                              {/* Fila 2: CIP, Unidad, Kg */}
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                <div>
                                  <label className="text-xs font-medium">CIP</label>
                                  <input
                                    type="text"
                                    value={getItemValue(item, "cip") || item.codigoCIP || ""}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "cip", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-center"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Unidad</label>
                                  <input
                                    type="text"
                                    value={getItemValue(item, "unidad") || "Kilogramo"}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "unidad", e.target.value)}
                                    className="border rounded p-1 w-full text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Kg</label>
                                  <div className="text-xs bg-gray-100 p-1 rounded text-right">
                                    {item.kilogramos}
                                  </div>
                                </div>
                              </div>

                              {/* Fila 3: FOB, VAN, % */}
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                <div>
                                  <label className="text-xs font-medium">FOB</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={getItemValue(item, "fob")}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "fob", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-right"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">VAN</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={getItemValue(item, "van")}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "van", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-right"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">%</label>
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={getItemValue(item, "porcentaje")}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "porcentaje", e.target.value)}
                                    className="border rounded p-1 w-full text-xs text-right"
                                  />
                                </div>
                              </div>

                              {/* Fila 4: Reposición y Unidades */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs font-medium">Reposición</label>
                                  <input
                                    type="text"
                                    value={getItemValue(item, "reposicion")}
                                    onChange={(e) => handleItemChange(item.idDetInvoice, "reposicion", e.target.value)}
                                    className="border rounded p-1 w-full text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium">Unidades</label>
                                  <div className="text-xs bg-gray-100 p-1 rounded text-right">
                                    {item.cantidadEmbalaje}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}