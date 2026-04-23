// src/services/dashboard/reporteDashboardService.js

const API_BASE =
  "https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Dashboard";

/**
 * Captura un elemento del DOM como PDF en base64.
 * Usa html2canvas para tomar la captura y jsPDF para generar el PDF.
 *
 * @param {HTMLElement} elemento - El div del dashboard a capturar
 * @param {Function} onProgreso - Callback(0-100) para actualizar barra de progreso
 * @returns {Promise<string>} PDF en base64 (sin prefijo data:...)
 */
export const capturarDashboardComoPDF = async (
  elemento,
  onProgreso = () => {},
) => {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  onProgreso(10);

  const PDF_CAPTURE_WIDTH = 900;

  // ── Paso 1: Forzar layout de columna única en el DOM REAL ──────────────────
  // Razón: los SVGs de la versión mobile tienen dimensiones 0 mientras están
  // ocultos (display:none). Si primero convertimos SVG→canvas y luego cambiamos
  // el layout en onclone, html2canvas recibe SVGs crudos sin canvas equivalente.
  // Solución: cambiar el DOM real PRIMERO → esperar reflow → convertir SVGs
  // (ahora visibles con dimensiones reales) → capturar → restaurar todo.
  const restaurarLayout = [];

  // Ocultar versión desktop (xl:grid = grid de 2 columnas)
  elemento.querySelectorAll('[class*="xl:grid"]').forEach((el) => {
    restaurarLayout.push({ el, display: el.style.display });
    el.style.setProperty("display", "none", "important");
  });

  // Mostrar versión mobile (xl:hidden = columna única, todos los gráficos apilados)
  elemento.querySelectorAll('[class*="xl:hidden"]').forEach((el) => {
    restaurarLayout.push({ el, display: el.style.display });
    el.style.setProperty("display", "block", "important");
  });

  // Fijar ancho del contenedor para que no ocupe todo el desktop
  const anchoOriginal = elemento.style.width;
  const maxAnchoOriginal = elemento.style.maxWidth;
  elemento.style.width = PDF_CAPTURE_WIDTH + "px";
  elemento.style.maxWidth = PDF_CAPTURE_WIDTH + "px";

  // Forzar dimensiones explícitas en los contenedores de gráficas del layout mobile.
  // Recharts usa ResizeObserver/window resize para calcular dimensiones.
  // Si el contenedor estuvo oculto (display:none), el primer render puede tener
  // alto/ancho incorrecto → barras muy pequeñas o mal escaladas.
  const restaurarContenedores = [];
  elemento
    .querySelectorAll('[class*="xl:hidden"] [class*="h-["]')
    .forEach((el) => {
      // Extraer el valor de altura del class de Tailwind: h-[250px] → 250px
      const match = [...el.classList].find((c) => c.match(/^h-\[(\d+)px\]$/));
      if (match) {
        const px = match.match(/\d+/)[0];
        restaurarContenedores.push({
          el,
          height: el.style.height,
          minHeight: el.style.minHeight,
        });
        el.style.setProperty("height", px + "px", "important");
        el.style.setProperty("min-height", px + "px", "important");
      }
    });

  // Disparar resize para que Recharts (ResponsiveContainer) recalcule dimensiones
  window.dispatchEvent(new Event("resize"));

  // Primer tick: reflow del DOM
  await new Promise((resolve) => requestAnimationFrame(resolve));
  // Segundo tick: Recharts procesa el resize event
  await new Promise((resolve) => requestAnimationFrame(resolve));
  // Delay adicional para que Recharts termine de redibujar SVGs con dimensiones correctas
  await new Promise((resolve) => setTimeout(resolve, 600));

  onProgreso(25);

  // ── Paso 2: SVG → Canvas (ahora los SVGs mobile están visibles) ────────────
  // html2canvas no renderiza SVGs, los reemplazamos con <canvas> equivalentes.
  const svgElementos = Array.from(elemento.querySelectorAll("svg"));
  const restauracionesSVG = [];

  for (const svg of svgElementos) {
    try {
      let w =
        svg.width?.baseVal?.value ||
        svg.getBoundingClientRect().width ||
        svg.offsetWidth;
      let h =
        svg.height?.baseVal?.value ||
        svg.getBoundingClientRect().height ||
        svg.offsetHeight;

      // Ignorar íconos y decorativos pequeños
      if (!w || !h || w < 20 || h < 20) continue;

      w = Math.round(w);
      h = Math.round(h);

      const clon = svg.cloneNode(true);
      clon.setAttribute("width", w);
      clon.setAttribute("height", h);
      clon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clon.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

      const svgStr = new XMLSerializer().serializeToString(clon);
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const dpr = window.devicePixelRatio || 1;
          const cvs = document.createElement("canvas");
          cvs.width = w * dpr;
          cvs.height = h * dpr;
          cvs.style.display = "block";
          cvs.style.width = w + "px";
          cvs.style.height = h + "px";
          const ctx = cvs.getContext("2d");
          ctx.scale(dpr, dpr);
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);

          restauracionesSVG.push({
            parent: svg.parentNode,
            cvs,
            svg,
            siguiente: svg.nextSibling,
          });
          svg.parentNode?.replaceChild(cvs, svg);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    } catch {
      // continuar con los demás si uno falla
    }
  }

  onProgreso(55);

  // ── Paso 3: Capturar con html2canvas ──────────────────────────────────────
  const canvas = await html2canvas(elemento, {
    scale: 1.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#f9fafb",
    scrollY: -window.scrollY,
    windowWidth: PDF_CAPTURE_WIDTH,
    windowHeight: elemento.scrollHeight,
  });

  // ── Paso 4: Restaurar SVGs originales ─────────────────────────────────────
  for (const { parent, cvs, svg, siguiente } of restauracionesSVG) {
    try {
      if (siguiente && siguiente.parentNode === parent) {
        parent?.insertBefore(svg, siguiente);
      } else {
        parent?.appendChild(svg);
      }
      cvs.parentNode?.removeChild(cvs);
    } catch {
      // ignorar
    }
  }

  // ── Paso 5: Restaurar layout original ─────────────────────────────────────
  for (const { el, display } of restaurarLayout) {
    el.style.display = display;
  }
  for (const { el, height, minHeight } of restaurarContenedores) {
    el.style.height = height;
    el.style.minHeight = minHeight;
  }
  elemento.style.width = anchoOriginal;
  elemento.style.maxWidth = maxAnchoOriginal;
  window.dispatchEvent(new Event("resize"));

  onProgreso(75);

  const imgData = canvas.toDataURL("image/jpeg", 0.85);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  const esHorizontal = imgWidth > imgHeight;
  const pdf = new jsPDF({
    orientation: esHorizontal ? "landscape" : "portrait",
    unit: "px",
    format: [imgWidth, imgHeight],
  });

  pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

  onProgreso(90);

  return pdf.output("datauristring").split(",")[1];
};

/**
 * Envía el reporte del dashboard por correo electrónico.
 *
 * @param {Object} params
 * @param {string[]} params.destinatarios - Array de emails
 * @param {string} params.asunto - Asunto del correo
 * @param {string} params.pdfBase64 - PDF en base64
 * @param {string} params.fechaInicio - Fecha inicio del período (YYYY-MM-DD)
 * @param {string} params.fechaFin - Fecha fin del período (YYYY-MM-DD)
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const enviarReportePorCorreo = async ({
  destinatarios,
  asunto,
  pdfBase64,
  fechaInicio,
  fechaFin,
}) => {
  const response = await fetch(`${API_BASE}/ApiEnviarReporteDashboard.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destinatarios,
      asunto,
      pdfBase64,
      fechaInicio,
      fechaFin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Error al enviar el reporte");
  }

  return data;
};
