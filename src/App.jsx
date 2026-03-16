// En App.jsx 
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import Inicio from "./pages/Inicio";
import Clientes from "./pages/Clientes";
import Conductores from "./pages/Conductores";
import Pedidos from "./pages/Pedidos";
import PedidosSample from "./pages/PedidosSample";
import Productos from "./pages/Productos";
import ComplementoFacturas from "./pages/ComplementoFacturas";
import ProduccionPedidos from "./pages/ProduccionPedidos";
import ConsolidacionMain from "./components/consolidacion/ConsolidacionMain";
import FacturacionMain from "./components/facturacion/FacturacionMain";
import DashboardDibufala from "./components/dashboard/DashboardDibufala";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="conductores" element={<Conductores />} />
        <Route path="productos" element={<Productos />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="samples" element={<PedidosSample />} />
        <Route path="produccion" element={<ProduccionPedidos />} />        
        <Route path="consolidacion" element={<ConsolidacionMain />}/>
        <Route path="facturacion" element={<FacturacionMain />} />
        <Route path="complemento-facturas" element={<ComplementoFacturas />} />
        <Route path="dashboard" element={<DashboardDibufala />} />
      </Route>

      {/* 👉 Redirigir index.html a la ruta raíz */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
    </Routes>
  );
}