import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { contarPedidosPorFiltro } from '../services/pedidosService';

const ModalImpresionMultiple = ({ isOpen, onClose, onImprimir, bodegas }) => {
  // Estado para seleccionar modo
  const [modoGeneracion, setModoGeneracion] = useState('porFechas'); // 'porFechas' o 'porNumeros'
  
  // 👇 NUEVO: Estado para el formato de salida
  const [formatoSalida, setFormatoSalida] = useState(''); // 'unSolo' o 'individuales'

  // Filtros para ambos modos
  const [filtros, setFiltros] = useState({
    // Modo por fechas
    fechaDesde: '',
    fechaHasta: '',
    // Modo por números
    numeroDesde: '',
    numeroHasta: '',
    // Filtros comunes
    bodegaId: '',
    tipoDocumento: 'listaempaque'
  });

  const [pedidosEncontrados, setPedidosEncontrados] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      const hoy = new Date().toISOString().split('T')[0];
      setModoGeneracion('porFechas');
      // 👇 NUEVO: Resetear formato de salida (sin valor por defecto)
      setFormatoSalida('');
      setFiltros({
        fechaDesde: hoy,
        fechaHasta: hoy,
        numeroDesde: '',
        numeroHasta: '',
        bodegaId: '',
        tipoDocumento: 'listaempaque'
      });
      setPedidosEncontrados(0);
    }
  }, [isOpen]);

  // 👇 NUEVO: Función para validar que se haya seleccionado formato
  const validarFormatoSeleccionado = () => {
    if (!formatoSalida) {
      Swal.fire('Error', 'Debe seleccionar un formato de salida (Un solo documento o Documentos individuales)', 'warning');
      return false;
    }
    return true;
  };

  // 👇 NUEVO: Función para validar y convertir números de pedido
  const validarNumerosPedido = () => {
    if (modoGeneracion !== 'porNumeros') return true;

    const { numeroDesde, numeroHasta } = filtros;

    // Validar que ambos campos estén completos
    if (!numeroDesde || !numeroHasta) {
      Swal.fire('Error', 'Debe ingresar ambos números de pedido', 'warning');
      return false;
    }

    // Validar formato (solo números)
    const regex = /^\d+$/;
    if (!regex.test(numeroDesde) || !regex.test(numeroHasta)) {
      Swal.fire('Error', 'Solo se permiten números en el rango de pedidos', 'warning');
      return false;
    }

    // Convertir a números
    const desdeNum = parseInt(numeroDesde);
    const hastaNum = parseInt(numeroHasta);

    // Validar que sean números válidos
    if (isNaN(desdeNum) || isNaN(hastaNum)) {
      Swal.fire('Error', 'Números de pedido inválidos', 'warning');
      return false;
    }

    // Validar que desde sea menor o igual que hasta
    if (desdeNum > hastaNum) {
      Swal.fire('Error', 'El número "Desde" no puede ser mayor que "Hasta"', 'warning');
      return false;
    }

    // Validar límite de 50 pedidos
    const cantidadPedidos = hastaNum - desdeNum + 1;
    if (cantidadPedidos > 50) {
      Swal.fire('Error', `El límite máximo es de 50 pedidos. Seleccionó ${cantidadPedidos} pedidos.`, 'warning');
      return false;
    }

    return true;
  };

  // 👇 MODIFICADA: Función para buscar pedidos según el modo
  const buscarPedidos = async () => {
    // Validar formato seleccionado primero
    if (!validarFormatoSeleccionado()) return;

    // Validaciones según el modo
    if (modoGeneracion === 'porFechas') {
      if (!filtros.fechaDesde || !filtros.fechaHasta) {
        Swal.fire('Error', 'Selecciona un rango de fechas', 'warning');
        return;
      }

      if (filtros.fechaDesde > filtros.fechaHasta) {
        Swal.fire('Error', 'La fecha "Desde" no puede ser mayor que la fecha "Hasta"', 'warning');
        return;
      }
    } else {
      // Modo por números
      if (!validarNumerosPedido()) return;
    }

    setCargando(true);
    try {
      // Preparar parámetros según el modo
      const parametrosBusqueda = {
        modo: modoGeneracion,
        formato: formatoSalida, // 👈 NUEVO: Incluir formato de salida
        bodegaId: filtros.bodegaId || '',
        tipoDocumento: filtros.tipoDocumento,
        ...(modoGeneracion === 'porFechas' ? {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta
        } : {
          numeroDesde: parseInt(filtros.numeroDesde),
          numeroHasta: parseInt(filtros.numeroHasta)
        })
      };

      // 👇 LLAMADA REAL A LA API - MODIFICARÉ ESTA FUNCIÓN MÁS ADELANTE
      const resultado = await contarPedidosPorFiltro(parametrosBusqueda);

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
    // Validar formato seleccionado primero
    if (!validarFormatoSeleccionado()) return;
    
    if (pedidosEncontrados === 0) {
      Swal.fire('Error', 'No hay pedidos para generar', 'warning');
      return;
    }

    // Validar según el modo
    if (modoGeneracion === 'porFechas') {
      if (filtros.fechaDesde > filtros.fechaHasta) {
        Swal.fire('Error', 'La fecha "Desde" no puede ser mayor que la fecha "Hasta"', 'warning');
        return;
      }
    } else {
      if (!validarNumerosPedido()) return;
    }

    // Preparar datos para enviar
    const datosEnvio = {
      modo: modoGeneracion,
      formato: formatoSalida, // 👈 NUEVO: Agregar formato de salida
      ...filtros,
      pedidosEncontrados
    };

    // Si es modo por números, convertir a números
    if (modoGeneracion === 'porNumeros') {
      datosEnvio.numeroDesde = parseInt(filtros.numeroDesde);
      datosEnvio.numeroHasta = parseInt(filtros.numeroHasta);
    }

    onImprimir(datosEnvio);
    onClose();
  };

  // Calcular fecha máxima (hoy)
  const hoy = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[85vh] flex flex-col">
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
        <div className="p-4 space-y-4 overflow-y-auto flex-grow">
          {/* Selección de Modo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccione el modo de generación:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${modoGeneracion === 'porFechas' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="modoGeneracion"
                  value="porFechas"
                  checked={modoGeneracion === 'porFechas'}
                  onChange={(e) => setModoGeneracion(e.target.value)}
                  className="mr-2 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-800">Por Fechas</div>
                  <div className="text-xs text-gray-600">Filtra por rango de fechas</div>
                </div>
              </label>

              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${modoGeneracion === 'porNumeros' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                <input
                  type="radio"
                  name="modoGeneracion"
                  value="porNumeros"
                  checked={modoGeneracion === 'porNumeros'}
                  onChange={(e) => setModoGeneracion(e.target.value)}
                  className="mr-2 text-green-600"
                />
                <div>
                  <div className="font-medium text-gray-800">Por Números</div>
                  <div className="text-xs text-gray-600">Filtra por rango de números</div>
                </div>
              </label>
            </div>
          </div>

          {/* 👇 NUEVO: Selección de Formato de Salida */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de salida *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                  formatoSalida === 'unSolo' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="formatoSalida"
                  value="unSolo"
                  checked={formatoSalida === 'unSolo'}
                  onChange={(e) => setFormatoSalida(e.target.value)}
                  className="mr-2 text-purple-600"
                />
                <div>
                  <div className="font-medium text-gray-800">Un solo documento</div>
                  <div className="text-xs text-gray-600">
                    {modoGeneracion === 'porFechas' 
                      ? 'Todos los pedidos en un PDF' 
                      : 'Todo el rango en un PDF'}
                  </div>
                </div>
              </label>

              <label 
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                  formatoSalida === 'individuales' 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="formatoSalida"
                  value="individuales"
                  checked={formatoSalida === 'individuales'}
                  onChange={(e) => setFormatoSalida(e.target.value)}
                  className="mr-2 text-teal-600"
                />
                <div>
                  <div className="font-medium text-gray-800">Documentos individuales</div>
                  <div className="text-xs text-gray-600">
                    {modoGeneracion === 'porFechas' 
                      ? 'Un PDF por cada pedido (ZIP)' 
                      : 'Un PDF por cada número (ZIP)'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Campos según el modo seleccionado */}
          {modoGeneracion === 'porFechas' ? (
            // MODO POR FECHAS
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
                  max={hoy}
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
                  max={hoy}
                />
              </div>
            </div>
          ) : (
            // MODO POR NÚMEROS
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Desde (PED-)*
                  </label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 rounded-l-lg px-3 py-2 text-gray-600">PED-</span>
                    <input
                      type="text"
                      value={filtros.numeroDesde}
                      onChange={(e) => handleFiltroChange('numeroDesde', e.target.value.replace(/\D/g, ''))}
                      placeholder="000123"
                      className="flex-1 border rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Hasta (PED-)*
                  </label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 rounded-l-lg px-3 py-2 text-gray-600">PED-</span>
                    <input
                      type="text"
                      value={filtros.numeroHasta}
                      onChange={(e) => handleFiltroChange('numeroHasta', e.target.value.replace(/\D/g, ''))}
                      placeholder="000456"
                      className="flex-1 border rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Formato según selección superior.
                    <div className="mt-1 text-xs">
                      • Límite máximo: 50 pedidos por operación<br />
                      • {formatoSalida === 'unSolo' 
                          ? 'Se generará un solo PDF con todos los pedidos' 
                          : 'Se generará un archivo ZIP con PDFs individuales'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bodega (común para ambos modos) */}
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
              <option value="pedido">Pedido</option>
              <option value="bol">BOL</option>
              <option value="listaempaque">Lista de Empaque</option>
              <option value="listaempaqueprecios">Lista Empaque Precios</option>
            </select>
          </div>

          {/* Contador de Pedidos */}
          <div className={`border rounded-lg p-3 ${
            formatoSalida === 'unSolo' 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-teal-50 border-teal-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${
                formatoSalida === 'unSolo' 
                  ? 'text-purple-800' 
                  : 'text-teal-800'
              }`}>
                Pedidos encontrados:
              </span>
              <span className={`text-lg font-bold ${
                formatoSalida === 'unSolo' 
                  ? 'text-purple-600' 
                  : 'text-teal-600'
              }`}>
                {cargando ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                ) : (
                  pedidosEncontrados
                )}
              </span>
            </div>

            {/* Información del rango */}
            {pedidosEncontrados > 0 && (
              <div className={`mt-2 text-xs rounded px-2 py-1 ${
                formatoSalida === 'unSolo' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-teal-100 text-teal-700'
              }`}>
                <strong>Filtros aplicados:</strong><br />
                {modoGeneracion === 'porFechas' ? (
                  <>
                    • {filtros.fechaDesde} a {filtros.fechaHasta}<br />
                  </>
                ) : (
                  <>
                    • PED-{filtros.numeroDesde || '000'} a PED-{filtros.numeroHasta || '000'}<br />
                  </>
                )}
                • {filtros.bodegaId ? `Bodega: ${bodegas.find(b => b.Id_Bodega == filtros.bodegaId)?.NombreBodega || filtros.bodegaId}` : 'Todas las bodegas'}<br />
                • Documento: {filtros.tipoDocumento}<br />
                • Formato: {formatoSalida === 'unSolo' ? 'Un solo PDF' : 'PDFs individuales'}
              </div>
            )}

            <button
              onClick={buscarPedidos}
              disabled={cargando || formatoSalida === ''}
              className={`w-full mt-2 text-white rounded-lg px-3 py-2 hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition ${
                formatoSalida === 'unSolo' 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
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
            disabled={pedidosEncontrados === 0 || cargando || !formatoSalida}
            className={`flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition ${
              formatoSalida === 'unSolo' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {cargando ? 'Generando...' : `Generar ${
              formatoSalida === 'unSolo' ? 'PDF único' : 'PDFs individuales'
            } (${pedidosEncontrados})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalImpresionMultiple;