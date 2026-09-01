import React from "react";

const ModalVisorProduccionChile = ({ isOpen, onClose, item, productionData }) => {
  if (!isOpen || !item) return null;

  const lote = productionData?.lote || null;
  const fechaElaboracion = productionData?.fechaElaboracion || "";
  const fechaVencimiento = productionData?.fechaVencimiento || "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Producción Chile
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-xl leading-none p-1">
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</span>
            <p className="text-sm sm:text-base font-medium text-gray-800 mt-1">
              {item?.descripcion || item?.producto || "Sin información"}
            </p>
          </div>

          <div className="pb-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</span>
            <p className="text-sm sm:text-base font-medium text-gray-800 mt-1">
              {lote?.codigo || "—"}
            </p>
          </div>

          <div className="pb-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Elaboración</span>
            <p className="text-sm sm:text-base font-medium text-gray-800 mt-1">
              {fechaElaboracion || "—"}
            </p>
          </div>

          <div className="pb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Vencimiento</span>
            <p className="text-sm sm:text-base font-medium text-gray-800 mt-1">
              {fechaVencimiento || "—"}
            </p>
          </div>
        </div>

        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalVisorProduccionChile;