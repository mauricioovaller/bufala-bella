// components/ModalImpresionMultiple.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { contarPedidosPorFiltro } from '../services/pedidosService'; // 👈 Importar la función real

const ModalImpresionMultiple = ({ isOpen, onClose, onImprimir, bodegas }) => {
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    bodegaId: '',
    tipoDocumento: 'listaempaque'
  });

  const [pedidosEncontrados, setPedidosEncontrados] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date().toISOString().split('T')[0];
      setFiltros({
        fechaDesde: hoy,
        fechaHasta: hoy,
        bodegaId: '',
        tipoDocumento: 'listaempaque'
      });
      setPedidosEncontrados(0);
    }
  }, [isOpen]);

  // 👇 NUEVO: Función real para buscar pedidos
  const buscarPedidos = async () => {
    if (!filtros.fechaDesde || !filtros.fechaHasta) {
      Swal.fire('Error', 'Selecciona un rango de fechas', 'warning');
      return;
    }

    // Validar que fechaDesde no sea mayor que fechaHasta
    if (filtros.fechaDesde > filtros.fechaHasta) {
      Swal.fire('Error', 'La fecha "Desde" no puede ser mayor que la fecha "Hasta"', 'warning');
      return;
    }

    setCargando(true);
    try {
      // 👇 LLAMADA REAL A LA API
      const resultado = await contarPedidosPorFiltro(filtros);
      
      if (resultado.success) {
        setPedidosEncontrados(resultado.total);
        
        if (resultado.total === 0) {
          Swal.fire('Info', 'No se encontraron pedidos con esos filtros', 'info');
        } else {
          Swal.fire('Éxito', `Se encontraron ${resultado.total} pedidos`, 'success');
        }
      } else {
        Swal.fire('Error', resultado.message || 'Error al buscar pedidos', 'error');
        setPedidosEncontrados(0);
      }
    } catch (error) {
      console.error('Error al contar pedidos:', error);
      Swal.fire('Error', 'Error de conexión al buscar pedidos', 'error');
      setPedidosEncontrados(0);
    } finally {
      setCargando(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleGenerar = () => {
    if (pedidosEncontrados === 0) {
      Swal.fire('Error', 'No hay pedidos para generar', 'warning');
      return;
    }

    // Validar nuevamente antes de generar
    if (filtros.fechaDesde > filtros.fechaHasta) {
      Swal.fire('Error', 'La fecha "Desde" no puede ser mayor que la fecha "Hasta"', 'warning');
      return;
    }

    onImprimir({
      ...filtros,
      pedidosEncontrados
    });
    onClose();
  };

  // Calcular fecha máxima (hoy)
  const hoy = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Imprimir Múltiples Pedidos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Genera documentos para varios pedidos a la vez
          </p>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {/* Rango de Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde *
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta *
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bodega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bodega (Opcional)
            </label>
            <select
              value={filtros.bodegaId}
              onChange={(e) => handleFiltroChange('bodegaId', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las bodegas</option>
              {bodegas.map((bodega) => (
                <option key={bodega.Id_Bodega} value={bodega.Id_Bodega}>
                  {bodega.NombreBodega || bodega.Descripcion}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              value={filtros.tipoDocumento}
              onChange={(e) => handleFiltroChange('tipoDocumento', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="listaempaque">Lista de Empaque</option>
              <option value="pedido">Pedido</option>
              <option value="bol">BOL</option>
              <option value="listaempaqueprecios">Lista Empaque Precios</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              * Actualmente disponible: Lista de Empaque
            </p>
          </div>

          {/* Contador de Pedidos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">
                Pedidos encontrados:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {cargando ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  pedidosEncontrados
                )}
              </span>
            </div>
            
            {/* Información del rango */}
            {pedidosEncontrados > 0 && (
              <div className="mt-2 text-xs text-blue-700 bg-blue-100 rounded px-2 py-1">
                <strong>Filtros aplicados:</strong><br/>
                • {filtros.fechaDesde} a {filtros.fechaHasta}<br/>
                • {filtros.bodegaId ? `Bodega: ${bodegas.find(b => b.Id_Bodega == filtros.bodegaId)?.NombreBodega || filtros.bodegaId}` : 'Todas las bodegas'}
              </div>
            )}
            
            <button
              onClick={buscarPedidos}
              disabled={cargando || !filtros.fechaDesde || !filtros.fechaHasta}
              className="w-full mt-2 bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {cargando ? 'Buscando...' : 'Buscar Pedidos'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            disabled={pedidosEncontrados === 0 || cargando}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {cargando ? 'Generando...' : `Generar PDF (${pedidosEncontrados})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalImpresionMultiple;