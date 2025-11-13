// components/ModalSeleccionDocumento.jsx
import React from "react";

const ModalSeleccionDocumento = ({ isOpen, onClose, onSeleccionar, pedidoId }) => {
  if (!isOpen) return null;

  const opcionesDocumentos = [
    {
      id: "pedido",
      nombre: "Pedido",
      descripcion: "Documento completo del pedido con todos los detalles",
      icono: "📋"
    },
    {
      id: "bol",
      nombre: "BOL (Bill of Lading)",
      descripcion: "Conocimiento de embarque para transporte",
      icono: "🚚"
    },
    {
      id: "listaempaque",
      nombre: "Lista de Empaque",
      descripcion: "Detalle de empaque y contenido por caja",
      icono: "📦"
    },
    {
      id: "listaempaqueprecios",
      nombre: "Lista Empaque Precios",
      descripcion: "Lista de empaque con precios unitarios y totales",
      icono: "💰"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-slate-700 text-white rounded-t-xl p-4">
          <h2 className="text-xl font-semibold">Seleccionar Documento</h2>
          <p className="text-slate-200 text-sm mt-1">
            Elija el tipo de documento a generar
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="space-y-4">
            {opcionesDocumentos.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSeleccionar(doc.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{doc.icono}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-700">
                      {doc.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {doc.descripcion}
                    </p>
                  </div>
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSeleccionDocumento;