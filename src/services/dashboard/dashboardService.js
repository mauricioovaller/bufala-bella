//src/services/dashboard/dashboardService.js
const API_BASE =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Dashboard";

/**
 * Parsea una fecha en formato YYYY-MM-DD como fecha local (sin desplazamiento UTC)
 * y la formatea en español para mostrar en tooltips.
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada, ej: "miércoles, 2 de abril de 2026"
 */
export const formatearFechaLocal = (fechaStr) => {
  if (!fechaStr) return "Sin fecha";
  const partes = fechaStr.split("-").map(Number);
  if (partes.length !== 3 || partes.some(isNaN)) return "Fecha inválida";
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  return fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Parsea YYYY-MM-DD como fecha local y la formatea en formato corto para ejes X.
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha corta, ej: "02 abr"
 */
export const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return "";
  const partes = fechaStr.split("-").map(Number);
  if (partes.length !== 3 || partes.some(isNaN)) return "";
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

/**
 * Devuelve una fecha en formato YYYY-MM-DD usando la hora local (no UTC).
 * Evita el desfase que produce toISOString() en zonas horarias negativas.
 * @param {Date} date - Objeto Date (por defecto: hoy)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const fechaLocalStr = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const fetchDashboardData = async (app, fechaInicio, fechaFin) => {
  try {
    const response = await fetch(`${API_BASE}/datos.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app: app,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la respuesta del servidor");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en los datos recibidos");
    }

    return data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

// Para otras apps (las prepararemos después)
export const APPS_CONFIG = {
  allseason: {
    nombre: "All Season Flowers",
    colorCompras: "#10B981", // verde
    colorVentas: "#3B82F6", // azul
  },
  naturalpack: {
    nombre: "NaturalPack",
    colorCompras: "#8B5CF6", // violeta
    colorVentas: "#EC4899", // rosa
  },
  dibufala: {
    nombre: "Dibufala",
    colorCompras: "#F59E0B", // amber
    colorVentas: "#EF4444", // rojo
  },
};

export const fetchVentasRegionCliente = async (
  idCliente,
  fechaInicio,
  fechaFin,
) => {
  const response = await fetch(`${API_BASE}/ApiVentasRegionCliente.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idCliente, fechaInicio, fechaFin }),
  });
  if (!response.ok) throw new Error("Error al obtener ventas por región");
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
};

export const fetchClientesProducto = async (
  idProducto,
  fechaInicio,
  fechaFin,
) => {
  // TEMPORAL: Datos de prueba
  console.log("Usando datos de prueba para clientes por producto...");

  const datosPrueba = {
    success: true,
    producto: {
      id: idProducto,
      nombre: "Producto de Prueba",
    },
    clientes: [
      { cliente: "Supermercado A", cantidad: 450, valor: 3500000 },
      { cliente: "Restaurante B", cantidad: 320, valor: 2800000 },
      { cliente: "Tienda C", cantidad: 280, valor: 2200000 },
      { cliente: "Distribuidor D", cantidad: 190, valor: 1500000 },
    ],
    totalCantidad: 1240,
    totalValor: 10000000,
    mensaje: "Datos de prueba para clientes por producto",
  };

  return datosPrueba;

  // NOTA: Para usar la API real, descomentar:
  /*
  const response = await fetch(`${API_BASE}/ApiClientesProducto.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idProducto, fechaInicio, fechaFin }),
  });
  if (!response.ok) throw new Error("Error al obtener clientes por producto");
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
  */
};

// ============================================================================
// SERVICIOS PARA COSTOS DE TRANSPORTE EN DASHBOARD
// ============================================================================

/**
 * Obtiene datos consolidados de costos de transporte y estibas pagas
 * para gráficos del dashboard
 * @param {string} app - Identificador de la aplicación (ej: 'dibufala')
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Datos para gráficos y KPIs
 */
export const fetchCostosTransporte = async (app, fechaInicio, fechaFin) => {
  try {
    const response = await fetch(
      `${API_BASE}/ApiDashboardCostosTransporte.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: app,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Error en los datos recibidos");
    }

    return data;
  } catch (error) {
    console.error("Error fetching costos de transporte:", error);
    throw error;
  }
};

// Función de respaldo para generar datos de prueba (solo si la API falla)
const generarDatosPrueba = (fechaInicio, fechaFin) => {
  // Parsear como fecha local para evitar desplazamiento por zona horaria UTC
  const [iy, im, id] = fechaInicio.split("-").map(Number);
  const [fy, fm, fd] = fechaFin.split("-").map(Number);
  const inicio = new Date(iy, im - 1, id);
  const fin = new Date(fy, fm - 1, fd);
  const dias = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

  const datosFletes = [];
  const datosEstibas = [];
  const datosComparacion = [];

  for (let i = 0; i < dias; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i);
    // Usar componentes locales para evitar desplazamiento por zona horaria UTC
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const fechaStr = `${yyyy}-${mm}-${dd}`;
    const fechaCorta = `${dd}/${mm}`;

    // Generar datos aleatorios pero realistas
    const tieneDatos = Math.random() > 0.3; // 70% de probabilidad de tener datos
    const costoTransporte = tieneDatos
      ? Math.floor(Math.random() * 500000) + 200000
      : 0;
    const estibasPagas = tieneDatos ? Math.floor(Math.random() * 20) + 1 : 0;
    const valorEstibasPagas = estibasPagas * 80500;

    datosFletes.push({
      fecha: fechaStr,
      fechaCorta: fechaCorta,
      costoTransporte: costoTransporte,
      costoFormateado: costoTransporte.toLocaleString("es-CO"),
      cantidadCamiones: tieneDatos ? Math.floor(Math.random() * 3) + 1 : 0,
      costoPorCamion:
        tieneDatos && costoTransporte > 0
          ? Math.floor(costoTransporte / (Math.floor(Math.random() * 3) + 1))
          : 0,
      observaciones: tieneDatos ? (Math.random() > 0.7 ? "HV" : "") : "",
      sinDatos: !tieneDatos,
    });

    datosEstibas.push({
      fecha: fechaStr,
      fechaCorta: fechaCorta,
      estibasPagas: estibasPagas,
      valorEstibasPagas: valorEstibasPagas,
      valorEstibasFormateado: valorEstibasPagas.toLocaleString("es-CO"),
      sinDatos: !tieneDatos,
    });

    datosComparacion.push({
      fecha: fechaStr,
      fechaCorta: fechaCorta,
      costoTransporte: costoTransporte,
      costoFormateado: costoTransporte.toLocaleString("es-CO"),
      estibasPagas: estibasPagas,
      valorEstibasPagas: valorEstibasPagas,
      valorEstibasFormateado: valorEstibasPagas.toLocaleString("es-CO"),
      sinDatos: !tieneDatos,
    });
  }

  // Calcular totales
  const totalCostoTransporte = datosFletes.reduce(
    (sum, item) => sum + item.costoTransporte,
    0,
  );
  const totalEstibasPagas = datosEstibas.reduce(
    (sum, item) => sum + item.estibasPagas,
    0,
  );
  const totalValorEstibasPagas = datosEstibas.reduce(
    (sum, item) => sum + item.valorEstibasPagas,
    0,
  );
  const totalCamiones = datosFletes.reduce(
    (sum, item) => sum + item.cantidadCamiones,
    0,
  );
  const diasConDatos = datosFletes.filter((item) => !item.sinDatos).length;

  return {
    success: true,
    app: "dibufala",
    periodo: {
      inicio: fechaInicio,
      fin: fechaFin,
    },
    configuracion: {
      valorEstiba: 80500,
      valorEstibaFormateado: "$80.500",
    },
    resumen: {
      diasConDatos: diasConDatos,
      totalCostoTransporte: totalCostoTransporte,
      totalCostoTransporteFormateado:
        "$" + totalCostoTransporte.toLocaleString("es-CO"),
      totalEstibasPagas: totalEstibasPagas,
      totalValorEstibasPagas: totalValorEstibasPagas,
      totalValorEstibasFormateado:
        "$" + totalValorEstibasPagas.toLocaleString("es-CO"),
      totalCamiones: totalCamiones,
    },
    kpis: {
      costoTotal: {
        valor: totalCostoTransporte,
        formateado: "$" + totalCostoTransporte.toLocaleString("es-CO"),
        icono: "💰",
        titulo: "Costo Total Transporte",
        descripcion:
          "Sumatoria de todos los costos de transporte en el período",
        color: "#8B5CF6",
      },
      estibasPagas: {
        valor: totalEstibasPagas,
        formateado: totalEstibasPagas.toLocaleString("es-CO") + " estibas",
        valorMonetario: totalValorEstibasPagas,
        valorMonetarioFormateado:
          "$" + totalValorEstibasPagas.toLocaleString("es-CO"),
        icono: "📦",
        titulo: "Estibas Pagas Totales",
        descripcion: "Total de estibas pagas (80.500 c/u)",
        color: "#10B981",
      },
      costoPromedioDiario: {
        valor: diasConDatos > 0 ? totalCostoTransporte / diasConDatos : 0,
        formateado:
          "$" +
          (diasConDatos > 0
            ? Math.round(totalCostoTransporte / diasConDatos)
            : 0
          ).toLocaleString("es-CO") +
          "/día",
        icono: "📊",
        titulo: "Costo Promedio Diario",
        descripcion: "Promedio de costo de transporte por día",
        color: "#3B82F6",
      },
      camionesTotales: {
        valor: totalCamiones,
        formateado: totalCamiones.toLocaleString("es-CO") + " camiones",
        costoPromedioCamion:
          totalCamiones > 0 ? totalCostoTransporte / totalCamiones : 0,
        costoPromedioCamionFormateado:
          "$" +
          (totalCamiones > 0
            ? Math.round(totalCostoTransporte / totalCamiones)
            : 0
          ).toLocaleString("es-CO"),
        icono: "🚛",
        titulo: "Camiones Totales",
        descripcion: "Total de camiones utilizados en el período",
        color: "#6366F1",
      },
    },
    graficos: {
      fletes: datosFletes,
      estibas: datosEstibas,
      comparacion: datosComparacion,
    },
    mensaje: `Datos de prueba generados para ${dias} días (${diasConDatos} con actividad)`,
  };
};

/**
 * Configuración de colores para la sección de transporte
 */
export const TRANSPORTE_CONFIG = {
  colorPrincipal: "#8B5CF6", // Violeta principal
  colorSecundario: "#A78BFA", // Violeta claro
  colorTerciario: "#C4B5FD", // Violeta muy claro
  colorAcento: "#10B981", // Verde para métricas positivas
  colorFondo: "#F5F3FF", // Fondo violeta claro
  colorBorde: "#DDD6FE", // Borde violeta
};

/**
 * Configuración de dimensiones para gráficos de transporte
 */
export const TRANSPORTE_DIMENSIONS = {
  CHART_HEIGHT: "200px",
  CHART_HEIGHT_MOBILE: "170px",
  CHART_CONTAINER_HEIGHT: "h-[550px]",
  CHART_CONTAINER_HEIGHT_MOBILE: "h-[480px]",
  KPI_CARD_HEIGHT: "120px",
};
