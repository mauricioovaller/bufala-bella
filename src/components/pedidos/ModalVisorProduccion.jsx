//src/components/pedidos/ModalVisorProduccion.jsx
import React from "react";

export default function ModalVisorProduccion({
  isOpen,
  onClose,
  item,
  productionData,
}) {
  if (!isOpen || !item) return null;

  const responsable = productionData?.responsable || "No asignado";
  const lotes = productionData?.lotes || {
    lote1: { id: null, codigo: null },
    lote2: { id: null, codigo: null },
    lote3: { id: null, codigo: null },
  };
  const cantidades = productionData?.cantidades || [0, 0, 0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-700">
            Información de Producción
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Producto */}
          <div className="pb-3 border-b">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Producto
            </label>
            <p className="text-sm sm:text-base font-medium text-gray-800 mt-1">
              {item?.descripcion || item?.producto || "Sin información"}
            </p>
          </div>

          {/* Responsable */}
          <div className="pb-3 border-b">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Responsable
            </label>
            <p className="text-sm sm:text-base font-medium text-gray-800 mt-1">
              {responsable}
            </p>
          </div>

          {/* Lotes y Cantidades */}
          <div className="pb-3">
            <label className="text-xs font-medium text-gray-500 uppercase block mb-3">
              Lotes y Cantidades Asignadas
            </label>

            <div className="space-y-2">
              {/* Lote 1 */}
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-xs text-gray-600">Lote 1:</span>
                  <p className="text-sm font-medium text-gray-800">
                    {lotes.lote1?.codigo || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-600">Cantidad:</span>
                  <p className="text-sm font-medium text-gray-800">
                    {cantidades[0] || 0}
                  </p>
                </div>
              </div>

              {/* Lote 2 */}
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-xs text-gray-600">Lote 2:</span>
                  <p className="text-sm font-medium text-gray-800">
                    {lotes.lote2?.codigo || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-600">Cantidad:</span>
                  <p className="text-sm font-medium text-gray-800">
                    {cantidades[1] || 0}
                  </p>
                </div>
              </div>

              {/* Lote 3 */}
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-xs text-gray-600">Lote 3:</span>
                  <p className="text-sm font-medium text-gray-800">
                    {lotes.lote3?.codigo || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-600">Cantidad:</span>
                  <p className="text-sm font-medium text-gray-800">
                    {cantidades[2] || 0}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200 mt-2">
                <div>
                  <span className="text-xs text-blue-600 font-medium">
                    TOTAL CANTIDAD:
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">
                    {(cantidades[0] || 0) +
                      (cantidades[1] || 0) +
                      (cantidades[2] || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 sm:p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
