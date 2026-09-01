import React from "react";

const ModalDetalleOTIF = ({ isOpen, onClose, tipo, data }) => {
  if (!isOpen || !data) return null;

  const esInFull = tipo === "inFull";

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-16 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {esInFull ? "Detalle IN FULL" : "Detalle ON TIME"}
            </h3>
            <p className="text-sm text-gray-500">
              {esInFull
                ? "Pedidos con bajo despacho o con Notas Crédito activas"
                : "Pedidos con fecha de salida diferente a la planificada"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1">
          {data.pedidos && data.pedidos.length > 0 ? (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-600">
                      <th className="p-2 font-semibold border-b">Pedido</th>
                      <th className="p-2 font-semibold border-b">P.O.</th>
                      <th className="p-2 font-semibold border-b">Cliente</th>
                      <th className="p-2 font-semibold border-b">Región</th>
                      {esInFull ? (
                        <>
                          <th className="p-2 font-semibold border-b">Producto</th>
                          <th className="p-2 font-semibold border-b text-right">Pedido</th>
                          <th className="p-2 font-semibold border-b text-right">Despachado</th>
                          <th className="p-2 font-semibold border-b text-right text-red-600">Faltante</th>
                          <th className="p-2 font-semibold border-b text-right text-purple-600">NC Cred.</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 font-semibold border-b">Factura</th>
                          <th className="p-2 font-semibold border-b">F.Salida Orig.</th>
                          <th className="p-2 font-semibold border-b">F.Salida Real</th>
                          <th className="p-2 font-semibold border-b text-right">Días Diff.</th>
                          <th className="p-2 font-semibold border-b text-right">Cajas</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.pedidos.map((ped) =>
                      esInFull ? (
                        ped.productos && ped.productos.map((prod, idx) => (
                          <tr key={`${ped.idPedido}_${prod.idDetPedido}`} className="border-b hover:bg-gray-50">
                            {idx === 0 && (
                              <td className="p-2 font-medium align-top" rowSpan={ped.productos.length}>
                                <div className="flex items-center gap-1">
                                  PED-{String(ped.idPedido).padStart(6, "0")}
                                  {ped.totalCreditosNC > 0 && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                                      NC {ped.totalCreditosNC}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                            {idx === 0 && (
                              <td className="p-2 text-blue-700 align-top" rowSpan={ped.productos.length}>
                                {ped.PurchaseOrder || "-"}
                              </td>
                            )}
                            {idx === 0 && (
                              <td className="p-2 align-top" rowSpan={ped.productos.length}>
                                <span className="text-xs">{ped.Cliente}</span>
                              </td>
                            )}
                            {idx === 0 && (
                              <td className="p-2 text-gray-600 align-top" rowSpan={ped.productos.length}>
                                {ped.Region || "-"}
                              </td>
                            )}
                            <td className="p-2">{prod.producto}</td>
                            <td className="p-2 text-right font-medium">{prod.cantidadPedida}</td>
                            <td className="p-2 text-right">{prod.cantidadDespachada}</td>
                            <td className="p-2 text-right text-red-600 font-bold">{prod.diferencia}</td>
                            <td className="p-2 text-right">
                              {prod.cantidadCreditadaNC > 0 ? (
                                <span className="text-purple-700 font-bold">{prod.cantidadCreditadaNC}</span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key={ped.idPedido} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">PED-{String(ped.idPedido).padStart(6, "0")}</td>
                          <td className="p-2 text-blue-700">{ped.PurchaseOrder || "-"}</td>
                          <td className="p-2 text-xs">{ped.Cliente}</td>
                          <td className="p-2 text-gray-600">{ped.Region || "-"}</td>
                          <td className="p-2">{ped.FacturaNo || "-"}</td>
                          <td className="p-2 text-amber-700 font-medium">{ped.FechaSalidaOriginal}</td>
                          <td className="p-2 text-gray-700">{ped.FechaSalidaReal}</td>
                          <td className="p-2 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              ped.diasDiferencia > 0
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {ped.diasDiferencia > 0 ? `+${ped.diasDiferencia}` : ped.diasDiferencia} días
                            </span>
                          </td>
                          <td className="p-2 text-right">{ped.totalCajas}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-3">
                {data.pedidos.map((ped) =>
                  esInFull ? (
                    <div key={ped.idPedido} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">PED-{String(ped.idPedido).padStart(6, "0")}</p>
                        <div className="flex gap-1">
                          {ped.totalCreditosNC > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                              NC: {ped.totalCreditosNC}
                            </span>
                          )}
                          <span className="text-xs text-red-600 font-bold">
                            {ped.productos.reduce((s, p) => s + p.diferencia, 0)} falt.
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700">PO: {ped.PurchaseOrder || "-"}</p>
                      <p className="text-xs text-gray-600">{ped.Cliente} - {ped.Region || "-"}</p>
                      <div className="mt-2 space-y-1">
                        {ped.productos.map((prod, idx) => (
                          <div key={idx} className={`flex justify-between text-xs p-2 rounded ${
                            prod.cantidadCreditadaNC > 0 ? "bg-purple-50" : "bg-red-50"
                          }`}>
                            <span className="flex-1">{prod.producto}</span>
                            <span className="text-gray-500 mx-2">{prod.cantidadDespachada}/{prod.cantidadPedida}</span>
                            <span className="text-red-600 font-bold">{prod.diferencia}</span>
                            {prod.cantidadCreditadaNC > 0 && (
                              <span className="text-purple-700 font-bold ml-1">NC:{prod.cantidadCreditadaNC}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={ped.idPedido} className="border rounded-lg p-4 shadow-sm bg-white">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold">PED-{String(ped.idPedido).padStart(6, "0")}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          ped.diasDiferencia > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}>
                          {ped.diasDiferencia > 0 ? `+${ped.diasDiferencia}` : ped.diasDiferencia} días
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">PO: {ped.PurchaseOrder || "-"}</p>
                      <p className="text-xs text-gray-600">{ped.Cliente} - {ped.Region || "-"}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-amber-50 p-2 rounded">
                          <span className="text-gray-500">F.Original:</span>
                          <span className="font-medium ml-1">{ped.FechaSalidaOriginal}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="text-gray-500">F.Real:</span>
                          <span className="font-medium ml-1">{ped.FechaSalidaReal}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Factura: {ped.FacturaNo || "-"} · Cajas: {ped.totalCajas}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No se encontraron pedidos que afecten este indicador</p>
              <p className="text-sm mt-1">
                {esInFull
                  ? "Todos los pedidos se despacharon completos en el período seleccionado."
                  : "Todos los pedidos se despacharon en la fecha planificada."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <span className="text-sm text-gray-500">
            {data.total || 0} pedido(s) encontrado(s)
          </span>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleOTIF;