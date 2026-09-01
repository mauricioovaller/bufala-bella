// src/components/dashboard/KPIOTIFCards.jsx
import React from "react";

const KPIOTIFCards = ({ indicadores, detalle, onInFullClick, onOnTimeClick }) => {
  if (!indicadores) return null;

  const items = [
    {
      tipo: "inFull",
      titulo: "IN FULL",
      valor: indicadores.inFullPct,
      desc: "Unidades despachadas vs pedidas",
      umbrales: { green: 95, amber: 85 },
      onClick: onInFullClick,
    },
    {
      tipo: "onTime",
      titulo: "ON TIME",
      valor: indicadores.onTimePct,
      desc: "Entregas en fecha original",
      umbrales: { green: 90, amber: 75 },
      onClick: onOnTimeClick,
    },
    {
      tipo: "otif",
      titulo: "OTIF",
      valor: indicadores.otifPct,
      desc: "IN FULL × ON TIME",
      umbrales: { green: 85, amber: 65 },
    },
  ];

  const getColor = (valor, umbrales) => {
    if (valor >= umbrales.green) return { hex: "#16A34A", bg: "#DCFCE7" };
    if (valor >= umbrales.amber) return { hex: "#D97706", bg: "#FEF3C7" };
    return { hex: "#DC2626", bg: "#FEE2E2" };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Indicadores OTIF</h3>
        <span className="text-xs text-gray-400">Pedidos</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item, i) => {
          const color = getColor(item.valor, item.umbrales);
          const esClickeable = item.valor < 100 && item.onClick;
          return (
            <div
              key={i}
              className={`text-center ${esClickeable ? "cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition" : ""}`}
              onClick={esClickeable ? item.onClick : undefined}
              title={esClickeable ? "Ver detalle de pedidos que afectan este indicador" : ""}
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={color.hex}
                    strokeWidth="3"
                    strokeDasharray={`${item.valor * 0.97} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg md:text-xl font-bold" style={{ color: color.hex }}>
                  {item.valor}%
                </span>
              </div>
              <div className="text-xs font-semibold text-gray-600 mb-0.5">{item.titulo}</div>
              <div className="text-[10px] text-gray-400">
                {item.desc}
                {esClickeable && <span className="block text-blue-500 font-medium mt-0.5">▼ Ver detalle</span>}
              </div>
            </div>
          );
        })}
      </div>
      {detalle && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-center text-[10px] md:text-xs text-gray-400">
          {detalle.totalPedidos} pedidos · {detalle.periodo}
        </div>
      )}
    </div>
  );
};

export default KPIOTIFCards;
