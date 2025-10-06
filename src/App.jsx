// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Inicio from "./pages/Inicio";
import Clientes from "./pages/Clientes";
import Pedidos from "./pages/Pedidos";
import Productos from "./pages/Productos";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="productos" element={<Productos />} />
      </Route>

      {/* 👉 Redirigir index.html a la ruta raíz */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
