const BASE_URL =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api";

/**
 * Obtiene los datos del reporte de kilos (cajas) despachados por semana.
 * @param {string} fechaDesde - Fecha inicio en formato YYYY-MM-DD
 * @param {string} fechaHasta - Fecha fin en formato YYYY-MM-DD
 * @returns {Promise<Object>} - { datos, semanas, fechaDesde, fechaHasta }
 */
export async function getReporteKilosSemanales(fechaDesde, fechaHasta) {
  const response = await fetch(
    `${BASE_URL}/Reportes/ApiReporteKilosSemanales.php`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaDesde, fechaHasta }),
    },
  );

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || "Error al obtener el reporte");
  }

  // Pivotar ambos datasets usando las mismas semanas del rango
  return pivotarDatos(
    json.datos,
    json.datosSamples || [],
    fechaDesde,
    fechaHasta,
  );
}

/**
 * Calcula la fecha del lunes de una semana ISO (lunes a domingo).
 * @param {number} year
 * @param {number} week  - número de semana ISO (1-53)
 * @returns {Date} - lunes de esa semana en UTC
 */
function getISOWeekMonday(year, week) {
  // El 4 de enero siempre cae en la semana ISO 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7; // lunes=1 … domingo=7
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - dow + 1);
  const monday = new Date(mondayW1);
  monday.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
  return monday;
}

/**
 * Devuelve el año y número de semana ISO de una fecha UTC.
 * @param {Date} date
 * @returns {{ year: number, week: number }}
 */
function getISOWeekInfo(date) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNum = d.getUTCDay() || 7; // lunes=1 … domingo=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // jueves más cercano
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

/**
 * Formatea un objeto Date UTC a DD/MM/AAAA
 */
function formatDateDMY(date) {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Transforma el array plano de la API en la estructura de tabla pivotada.
 * Cada fila = { cliente, region, descripcion, [semClave]: cajas, total }
 * Las semanas se generan a partir del RANGO solicitado (no solo de los datos),
 * de modo que la semana inicial y final aparecen aunque sean parciales.
 */
function pivotarDatos(datos, datosSamples, fechaDesde, fechaHasta) {
  // Parsear límites del rango como fechas UTC
  const [dY, dM, dD] = fechaDesde.split("-").map(Number);
  const [hY, hM, hD] = fechaHasta.split("-").map(Number);
  const dateDesde = new Date(Date.UTC(dY, dM - 1, dD));
  const dateHasta = new Date(Date.UTC(hY, hM - 1, hD));

  // Generar TODAS las semanas que intersectan con el rango (incluye parciales)
  const { year: startYear, week: startWeek } = getISOWeekInfo(dateDesde);
  const semanas = [];
  let mondayOfWeek = getISOWeekMonday(startYear, startWeek);

  while (mondayOfWeek <= dateHasta) {
    const sunday = new Date(mondayOfWeek);
    sunday.setUTCDate(mondayOfWeek.getUTCDate() + 6);

    const { year: wYear, week: wWeek } = getISOWeekInfo(mondayOfWeek);

    // Recortar el rango visible al periodo solicitado (semanas parciales)
    const rangeStart =
      mondayOfWeek < dateDesde ? new Date(dateDesde) : new Date(mondayOfWeek);
    const rangeEnd =
      sunday > dateHasta ? new Date(dateHasta) : new Date(sunday);

    const clave = `${wYear}-W${String(wWeek).padStart(2, "0")}`;
    semanas.push({
      clave,
      anio: wYear,
      semana: wWeek,
      lunes: mondayOfWeek,
      domingo: sunday,
      labelSem: `Sem ${String(wWeek).padStart(2, "0")}`,
      labelRango: `${formatDateDMY(rangeStart)} – ${formatDateDMY(rangeEnd)}`,
    });

    // Avanzar al lunes siguiente
    const nextMonday = new Date(mondayOfWeek);
    nextMonday.setUTCDate(mondayOfWeek.getUTCDate() + 7);
    mondayOfWeek = nextMonday;
  }

  if (!datos || datos.length === 0) {
    return { filas: [], semanas, filasSample: [] };
  }

  // Construir mapa de filas agrupadas por cliente+region+producto
  const filasMap = new Map();

  datos.forEach(
    ({ cliente, region, descripcion, unidades, anio, semana, cajas }) => {
      const clave = `${cliente}|||${region}|||${descripcion}|||${unidades}`;
      const semClave = `${anio}-W${String(semana).padStart(2, "0")}`;

      if (!filasMap.has(clave)) {
        filasMap.set(clave, { cliente, region, descripcion, unidades });
      }

      const fila = filasMap.get(clave);
      fila[semClave] = (fila[semClave] || 0) + cajas;
    },
  );

  // Calcular totales por fila
  const filas = Array.from(filasMap.values()).map((fila) => {
    let total = 0;
    semanas.forEach(({ clave }) => {
      total += fila[clave] || 0;
    });
    return { ...fila, total };
  });

  // Pivotar muestras usando las mismas semanas
  const filasMapSample = new Map();
  (datosSamples || []).forEach(
    ({ cliente, region, descripcion, unidades, anio, semana, cajas }) => {
      const clave = `${cliente}|||${region}|||${descripcion}|||${unidades}`;
      const semClave = `${anio}-W${String(semana).padStart(2, "0")}`;
      if (!filasMapSample.has(clave)) {
        filasMapSample.set(clave, { cliente, region, descripcion, unidades });
      }
      const fila = filasMapSample.get(clave);
      fila[semClave] = (fila[semClave] || 0) + cajas;
    },
  );

  const filasSample = Array.from(filasMapSample.values()).map((fila) => {
    let total = 0;
    semanas.forEach(({ clave }) => {
      total += fila[clave] || 0;
    });
    return { ...fila, total };
  });

  return { filas, semanas, filasSample };
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM
 */
function formatarFechaCorta(fecha) {
  if (!fecha) return "";
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}
