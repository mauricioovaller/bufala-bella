# CAMBIOS IMPLEMENTADOS

---

## [2026-09-02] Anexos Autodeclaración Chile por cliente — Spec 0002

### Descripción

Preselección de anexos por cliente (Globe Italia / Cencosud, configurable desde BD), selección
editable y guardado exacto por planilla para que la Autodeclaración Chile muestre/envíe
exactamente los anexos marcados (consultar existente y correo individual/múltiple).

### Cambios

- **BD (scripts a ejecutar):** `database/scripts/crear_tablas_anexos_autodeclaracion_chile.sql`
  (tablas `clientes_chile_anexos_default` y `planillas_chile_documentos`) y
  `database/scripts/seed_anexos_defaults_clientes_chile.sql` (mapeo Globe/Cencosud, Paso 0 de datos).
- **Backend:** `ApiGuardarPlanilla.php` (guarda filas por anexo), `ApiGetDocumentosChileItems.php`
  (devuelve `anexosDefault` del cliente), `ApiGetPlanillaConfiguracion.php` y
  `ApiAutodeclaracionChile.php` (resolución: ids → filas planilla → JSON → default cliente → vacío).
- **Frontend:** `ModalDocumentosDespacho.jsx` (preselección por cliente + info del cliente),
  `FacturacionMain.jsx` (validación de un solo cliente por despacho Chile),
  `services/planillasService.js` (envío de `id_factura`).

### Validación

- `php -l` OK (módulo Planillas) y `php scripts/check_encoding.php src/Api/Planillas` → exit 0.
- Spec 0002 en estado `Cerrada` (el usuario probó en su entorno el 2026-09-02 y confirmó que funciona).

---

## [2026-09-02] SDD + corrección de codificación (tildes/ñ) en Reportes por Área — Spec 0001

### Descripción

1. **Metodología Spec-Driven Development (SDD):** se creó `docs/specs/` con índice
   (`README.md`), plantilla (`_template.md`) y la **Spec 0001** (piloto). A partir de ahora toda
   solicitud inicia con una spec en borrador, se aprueba con el usuario y luego se implementa.
2. **Corrección de codificación:** 12 generadores PDF/Excel de "Reportes por Área" tenían los
   textos fijos con doble/triple codificación (mojibake) que mostraba símbolos raros
   (ej. `MÃ©todo`, `PerÃodo`, `DÃA`). Se normalizaron a UTF-8 correcto: ahora salen bien las
   tildes y la `ñ` tanto en PDF (Latin-1 vía `utf8_decode`) como en Excel (UTF-8 puro).

### Archivos

- `docs/specs/README.md`, `docs/specs/_template.md`, `docs/specs/consolidacion/0001-correccion-codificacion-reportes-por-area.md`
- `scripts/check_encoding.php` — gate automático de codificación (BOM / UTF-8 inválido / mojibake).
- 12 endpoints normalizados: Producción/Empaque (Chile, Consolidado), Transporte PDF (3
  pestañas), Excel Transporte (3 pestañas), Excel Proceso Actual (Chile, Consolidado).
- `CLAUDE.md` y `AGENTS.md` — sección SDD y regla/gate de codificación actualizados.

### Validación

- `php -l` → OK en los 25 PHP del módulo.
- `php scripts/check_encoding.php src/Api/Consolidacion` → exit 0 (sin mojibake/BOM).
- Generadores Excel con 0 usos de `utf8_decode` (UTF-8 puro).
- Spec 0001 en estado `Verificada` (el usuario confirmó el 2026-09-02 que los textos con tildes/ñ salen correctos).

---

## [2026-08-25] Regla de oro para codificación de texto

### Descripción

Se incorporó a la documentación del proyecto la regla para preservar tildes, `ñ` y caracteres especiales en PDFs, conexiones a BD, respuestas JSON y frontend React.

### Archivos

- `AGENTS.md` — regla universal y especificación técnica.
- `.github/copilot-instructions.md` — resumen para GitHub Copilot.
- `CLAUDE.md` — resumen para Claude Code.

### Criterios

- FPDF: `utf8_decode((string)$valor)` antes de `Cell()` o `MultiCell()`.
- MySQL: conexión configurada con `utf8mb4`.
- JSON: `JSON_UNESCAPED_UNICODE`.
- React: conservar los textos en UTF-8 sin conversiones.

---

## [2026-08-24] Skill de estandarización para backend PHP

### Descripción

Se incorporó la skill `php-backend-estandarizacion`, basada en la referencia de `all-season-flowers` y adaptada a Bufala Bella. La skill puede invocarse al crear, revisar o migrar endpoints PHP y sus recursos mantienen las reglas automáticas para cualquier archivo nuevo en `src/Api/**/*.php`.

### Archivos

- `.github/skills/php-backend-estandarizacion/SKILL.md` — flujo, restricciones y criterios de validación para PHP 7.4.
- `.github/skills/php-backend-estandarizacion/references/` — convenciones de endpoints, SQL/MCP, PDFs y migraciones.
- `.github/skills/php-backend-estandarizacion/assets/` — plantillas JSON, transaccional y PDF compatibles con PHP 7.4.
- `.github/instructions/php-backend.instructions.md` — referencia explícita a la skill complementaria.

### Validación

- `php -l` correcto en las tres plantillas PHP.

---

## [2026-08-21] Clientes Chile: textos se guardan tal cual (sin &amp;)

### Descripcion

Las APIs de Clientes Chile tenian el mismo problema de `htmlspecialchars` al guardar, por lo que un texto como "NA&NE" en Nombre/Direccion (u otros campos) quedaba almacenado como "NA&amp;NE". Ahora se guarda tal cual y se corrige la data existente con un script SQL.

### Backend PHP

- `src/Api/ClientesChile/ApiGuardarClienteChile.php` — `limpiar_texto()` ya no usa `htmlspecialchars`; solo recorta espacios.
- `src/Api/ClientesChile/ApiModificarClienteChile.php` — mismo cambio.

### Base de datos

- `database/scripts/corregir_entidades_html_clientes_chile.sql` (NUEVO) — decodifica entidades en `ClientesChile` (Nombre, Direccion, Ciudad, Pais, Contacto, Email, Estado, Rut, Telefono). Ejecutar UNA vez en produccion.

### Tests

- `php -l` OK en los archivos modificados.

---

## [2026-08-21] Clientes: regiones/direcciones guardan "&" tal cual (sin &amp;)

### Descripcion

Las APIs de Clientes guardaban con `htmlspecialchars`, por lo que un texto como "NA&NE" quedaba almacenado como "NA&amp;NE" y al consultarlo se mostraba codificado. Ahora el texto se guarda tal cual se registra (los prepared statements ya protegen contra inyeccion SQL) y se corrige la data existente con un script SQL.

### Backend PHP

- `src/Api/Clientes/ApiGuardarCliente.php` — `limpiar_texto()` ya no usa `htmlspecialchars`; solo recorta espacios.
- `src/Api/Clientes/ApiModificarCliente.php` — mismo cambio (cubre actualizacion de regiones).

### Base de datos

- `database/scripts/corregir_entidades_html_clientes_region.sql` (NUEVO) — decodifica entidades (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#039;`) en `ClientesRegion` (Region, Direccion, Frecuencia) y `Clientes` (Nombre). Ejecutar UNA vez en produccion.

### Tests

- `php -l` OK en los archivos modificados.

---

## [2026-08-20] Productos: se permiten decimales con punto o coma en campos numericos

### Descripcion

En el modulo de Productos (Normales y Chile), los campos con decimales (Peso Gr, Factor Peso Bruto, Peso Neto Und Gr, Precio de Venta, FOB Valor y VAN Valor) ya permiten escribir el separador decimal (punto o coma) tanto al crear como al modificar. Antes se convertia a numero en cada tecla y el separador desaparecia al instante. Ahora el campo conserva el texto mientras se edita y al guardar se normaliza a numero con punto.

### Frontend

- `src/pages/Productos.jsx` — nuevos helpers `sanearDecimalEscritura()` (conserva digitos + un separador) y `decimalANumero()` (convierte coma a punto al enviar); `handleChange` de ambos formularios (Normales y Chile) usa el saneo de texto y `handleSubmit` envia los valores convertidos a numero.

### Tests

- 237/237 tests pasando (18 archivos) con `--pool=forks`.
- `npx vite build` exitoso.

---

## [2026-08-20] Factura PDF Chile: cliente Cencosud sin flete internacional

### Descripcion

En `ApiGenerarFacturaPDFChile.php`, cuando el cliente contiene "Cencosud" (sin distinguir mayusculas/minusculas), la factura PDF usa `Valor_Kilo` y `Valor_Total` (sin el ajuste de flete de 4.3105), el SubTotal muestra la suma sin ajustar, no se imprime la linea "Flete Internacional" y el total final queda directo. Para los demas clientes el comportamiento no cambia.

### Backend PHP

- `src/Api/Facturacion/ApiGenerarFacturaPDFChile.php` — bandera `$esCencosud = stripos(trim((string)$cliente), 'cencosud') !== false`; detalle, SubTotal y bloque de totales condicionales.

### Tests

- `php -l` OK en el archivo modificado.
- No se modifico frontend.

---

## [2026-08-20] Facturacion: agencia por defecto FREIGHTWISE (73)

### Descripcion

En el modulo de Facturacion la agencia del encabezado de factura queda preseleccionada con FREIGHTWISE (IdAgencia = 73) al iniciar, al cambiar de tipo de pedido y al crear una factura nueva. Cuando se seleccionan pedidos, la agencia se toma SIEMPRE del primer pedido seleccionado (autocompletado con prioridad sobre el valor por defecto), tal como solicito el usuario.

### Frontend

- `src/components/facturacion/FacturacionMain.jsx` — `agenciaId` por defecto `"73"` en el estado inicial, al cambiar de tipo de pedido y en el reset de nueva factura.
- `src/components/facturacion/ConfiguracionFactura.jsx` — el autocompletado de agencia ya no exige que el campo este vacio: toma la agencia del primer pedido seleccionado.

### Tests

- 237/237 tests pasando (18 archivos) con `--pool=forks`.
- `npx vite build` exitoso.

---

## [2026-08-20] Pedidos Normales, Samples y Chile: agencia por defecto FREIGHTWISE (73)

### Descripcion

En los formularios de creacion de pedidos (estado inicial y al hacer "nuevo pedido") la agencia queda preseleccionada con FREIGHTWISE (IdAgencia = 73) en Pedidos Normales, Samples y Pedidos Chile. Al editar un pedido existente se conserva la agencia guardada en el pedido.

### Frontend

- `src/pages/Pedidos.jsx` — `agenciaId` por defecto `"73"` (estado inicial y reset de nuevo pedido).
- `src/pages/PedidosSample.jsx` — `agenciaId` por defecto `"73"`.
- `src/pages/PedidosChile.jsx` — `agenciaId` por defecto `"73"` (antes vacio).

### Tests

- 237/237 tests pasando (18 archivos) con `--pool=forks`.
- `npx vite build` exitoso.

---

## [2026-08-19] Pedidos Chile: columna de totales en Lista de Empaque + acentos en fechas

### Descripcion

En los PDFs de Lista de Empaque y Lista de Empaque con Precios (individual y multiple) de Pedidos Chile se agrego una columna de totales alineada a la derecha, ubicada despues del formato (tabla + observaciones) y antes de la firma "RECIBIDO Y APROBADO POR", con:

- Total Peso Escurrido (kg) = suma de la columna "Kg Escurr."
- Total Peso Bruto (kg) = suma de la columna "Kg Brutos"
- Total Estibas = valor "Cant. Estibas" del encabezado

Tambien se corrigio la codificacion de las fechas con palabras en espanol (dia/mes con tilde o n) en el encabezado, para que se muestren correctamente ("miercoles, 19 de agosto de 2026") y no con caracteres raros.

### Backend PHP

- `src/Api/PedidosChile/ApiImprimirListaEmpaqueChile.php` — columna de totales (ancho 236mm) y helper `u8()` robusto (detecta UTF-8 vs ISO-8859-1); `FechaOrden` ahora pasa por `u8()`.
- `src/Api/PedidosChile/ApiImprimirListaEmpaquePreciosChile.php` — mismo cambio (ancho 247mm).
- `src/Api/PedidosChile/ApiImprimirMultiplesListaEmpaqueChile.php` — columna de totales por pedido (ancho 262mm); fechas `FechaOrden`, `FechaSalida` y `FechaEntregaCliente` con `u8()` en lugar de `utf8_decode`/crudas.
- `src/Api/PedidosChile/ApiImprimirMultiplesListaEmpaquePreciosChile.php` — mismo cambio.

### Tests

- `php -l` OK en los 4 archivos modificados (y en todo `src/Api/PedidosChile`).
- No se modifico frontend; sin impacto en tests de Vitest.

---

## [2026-08-19] Envio Chile: numero normalizado a FEX- (sin prefijo CHI-FEX-)

### Descripcion

En todo el flujo de envio de facturas y documentos Chile (adjuntos, asunto, cuerpo, variables de plantilla e historial) el numero de factura se normaliza a `FEX-...`, eliminando el prefijo `CHI-FEX-` cuando viene de la base de datos.

### Frontend

- `src/services/correoService.js` — nueva funcion `normalizarNumeroFactura()`; aplicada en `generarNombreFactura()` y `generarVariablesFactura()` (variable `{numero}`).
- `src/components/facturacion/EnviarCorreoFacturaModal.jsx` — encabezado, nombres de adjuntos y `referencia_numero` normalizados.
- `src/components/facturacion/EnviarCorreoMultipleFacturasModal.jsx` — asunto, cuerpo, etiquetas de documentos, nombres de adjuntos y numeros del encabezado normalizados.
- `src/services/envioCorreosGenericoService.js` — `generarNombreDocumento()` normaliza el numero (individual y por factura en envio multiple).

### Tests

- `src/__tests__/services/correoService.test.js` — tests de `normalizarNumeroFactura`, nombre de archivo y variable `{numero}`.
- `src/__tests__/services/envioCorreosGenericoService.test.js` — nombres de adjuntos sin `CHI-FEX-` en envio multiple.
- 237/237 tests pasando (18 archivos). `npx vite build` exitoso.

---

## [2026-08-19] Facturacion Consultar: documentos Chile completos en Enviar + adjuntos descargables

### Descripcion

En la pestana Consultar del modulo Facturacion, el envio de facturas Chile ahora ofrece los 10 documentos anexos solicitados (Carta para Aerolinea, Carta para Policia, Reporte Despacho, Plan Vallejo, Autodeclaracion Chile, Planilla Aerolinea, Carta Dataloger, Solicitud ICA, Certificado Tratamiento Termico y Tabla HC Lacteos) ademas de la factura PDF. Se corrige el adjunto de la factura Chile: antes se generaba con el endpoint de Colombia (`ApiGenerarFacturaPDF.php`), que no encuentra la factura en `EncabInvoiceChile` y producia un archivo invalido que el destinatario no podia descargar. Ahora se usa `generarFacturaPDFChile` (endpoint `ApiGenerarFacturaPDFChile.php`).

### Frontend

- `src/components/facturacion/EnviarCorreoFacturaModal.jsx` — lista de documentos dinamica segun `tipoPedido`; para Chile usa `generarFacturaPDFChile`, `generarCartaResponsabilidadChile`, `generarReporteDespachoChile`, `generarPlanVallejoChile`, `generarAutodeclaracionChile`, `generarPlanillaDespachoChile`, `generarCartaDatalogerChile`, `generarSolicitudICAChile`, `generarCertificadoTratamientoChile` y `generarTablaHCLacteosChile`. Validacion de `{success:false}` de los generadores de planillas.
- `src/components/facturacion/EnviarCorreoMultipleFacturasModal.jsx` — mismo soporte para envio multiple: factura PDF Chile correcta, cartas/plan vallejo/reporte con variante Chile y grupos de documentos Chile por factura.
- `src/services/envioCorreosGenericoService.js` — catalogo `GENERADORES_DOCUMENTOS` con los 6 anexos Chile y nombres de archivo automaticos (incluido patron por factura para envio multiple).

### Tests

- `src/__tests__/services/envioCorreosGenericoService.test.js` (NUEVO) — catalogo de documentos Chile, generacion de factura + 10 anexos, nombres para envio multiple y propagacion de errores.
- 231/231 tests pasando (18 archivos).
- `npx vite build` exitoso.

---

## [2026-08-14] Consolidacion unificada: Locales | Chile | Consolidado

### Descripcion

El modulo de Consolidacion ahora tiene tres pestanas: Pedidos Locales (normales + samples), Pedidos Chile y Consolidado. El selector afecta Gestion de Fechas, Reportes por Area, Resumen del Periodo y Costos de Transporte. El modo Consolidado genera un solo documento con secciones separadas (Locales y Chile) y suma el Resumen del Periodo.

### Base de datos

- `database/scripts/consolidacion_origen_tipo.sql` — agrega `TipoPedido` a `CostosTransporteAereo` (default 'normal'), indice unico `(Fecha, TipoPedido)` en `CostosTransporteDiario` e indice unico `(Fecha, GuiaMaster, TipoPedido)` en aereo. Ejecutar en produccion antes de usar costos Chile/Consolidado.

### Backend PHP

- `src/Api/CostosTransporte/*` — CRUD acepta `TipoPedido` (default 'normal'), filtra por tipo, valida duplicados `(Fecha, TipoPedido)` y valida facturas contra `EncabInvoice` o `EncabInvoiceChile`.
- `src/Api/CostosTransporteAereo/*` — CRUD acepta `TipoPedido`, valida guias contra `EncabInvoice` o `EncabInvoiceChile`, duplicados `(Fecha, GuiaMaster, TipoPedido)`.
- `src/Api/Consolidacion/consolidacion_reportes_helper.php` — helper reutilizable con consultas Locales y Chile para Produccion, Empaque, Transporte y Excel de proceso.
- Nuevos endpoints: `ApiConsolidadoProduccionChile`, `ApiConsolidadoProduccionTotal`, `ApiConsolidadoEmpaqueChile`, `ApiConsolidadoEmpaqueTotal`, `ApiConsolidadoTransporteChile`, `ApiConsolidadoTransporteTotal`, `ApiGenerarExcelConsolidacionChile`, `ApiGenerarExcelConsolidacionTotal`, `ApiGenerarExcelTransporteChile`, `ApiGenerarExcelTransporteTotal`.
- `ApiEstadisticasConsolidacion.php` — corregida consulta malformada (`.$tipoFecha`) y bind de parametros para el Resumen local/consolidado.

### Frontend

- `src/services/consolidacionService.js` — wrappers Chile/Consolidado y parametro `tipoPedido` en costos.
- `src/components/consolidacion/ConsolidacionMain.jsx` — tercera pestana Consolidado, limpieza y recarga al cambiar de pestana, badges de origen, reportes y costos por origen, resumen sumado, formularios con selector de tipo en modo Consolidado y barra de pestanas fija (sticky) con pestana activa resaltada.
- `src/__tests__/services/consolidacionService.test.js` — tests para servicios Chile/Consolidado y `tipoPedido`.

### Tests

- 227/227 tests pasando (17 archivos).
- `npx vite build` exitoso.
- `php -l` OK en todos los PHP nuevos/modificados.

---

## [2026-08-08] Dashboard Chile: Ventas + OTIF + Transporte + NotaCredito + Skill reutilizable

### Descripción

Implementación del Dashboard para pedidos Chile con la misma estructura y funcionalidad que el dashboard de pedidos normales y samples, usando pestañas Colombia | Chile dentro del mismo módulo. Incluye infraestructura BD (tablas NotaCredito Chile + columna TipoPedido en transporte) y una skill reutilizable de opencode.

### Fase 0: Infraestructura BD

- `ALTER TABLE CostosTransporteDiario ADD COLUMN TipoPedido VARCHAR(15) NOT NULL DEFAULT 'normal'` — separa costos Chile vs Colombia. Registros existentes quedaron como 'normal' (backward compatible)
- Creadas tablas `EncabNotaCreditoChile` y `DetNotaCreditoChile` (estructura idéntica a Colombia) para que el dashboard Chile reste Notas Crédito
- Script: `database/scripts/dashboard_chile_infraestructura.sql`

### Fase 1: Endpoints PHP nuevos

- `src/Api/Dashboard/datos_chile.php` — KPIs + Top 10 Clientes + Productos (clasificación PlanVallejo 0/1 en vez de Org/NoOrg) + Tendencia. Resta NotaCreditoChile
- `src/Api/Dashboard/ApiIndicadoresOTIF_chile.php` — InFull/OnTime/OTIF con tablas Chile
- `src/Api/Dashboard/ApiDetalleIndicadoresOTIF_chile.php` — Detalle de pedidos que afectan OTIF Chile
- `src/Api/Dashboard/ApiClientesProducto_chile.php` — Drill-down clientes por producto Chile

### Fase 1b: Endpoint modificado (backward compatible)

- `src/Api/Dashboard/ApiDashboardCostosTransporte.php` — Nuevo parámetro `tipoPedido` (opcional). `'chile'` filtra `CostosTransporteDiario.TipoPedido='chile'` y usa `EncabPedidoChile`/`DetPedidoChile` para estibas. Sin parámetro = comportamiento actual (Colombia)

### Fase 2: Servicio JS

- `src/services/dashboard/dashboardService.js` — `APPS_CONFIG.chile` (nombre "Dibufala Chile", colores), `fetchDashboardDataChile()`, `fetchIndicadoresOTIFChile()`, `fetchDetalleIndicadorOTIFChile()`, `fetchClientesProductoChile()`, `fetchCostosTransporte()` acepta 4º parámetro `tipoPedido`

### Fase 3: Componentes React

- `src/components/dashboard/DashboardChile.jsx` (NUEVO) — Reutiliza KPICards, KPIOTIFCards, ChartProveedoresClientes, ChartProductos, ChartTendencia, ChartClientesProducto, ModalDetalleOTIF, SeccionTransporte. Ventas Chile (KPIs + OTIF + Clientes + Productos Plan Vallejo/No Plan Vallejo + Tendencia) + Transporte con tipoPedido="chile". Sin drill-down de regiones (ClientesChile no tiene regiones)
- `src/components/dashboard/DashboardDibufala.jsx` — Pestañas 🇨🇴 Colombia | 🇨🇱 Chile (mismo patrón que Clientes/Productos). Tab Colombia = contenido actual intacto, Tab Chile = DashboardChile
- `src/components/dashboard/SeccionTransporte.jsx` — Nuevo prop `tipoPedido` (default "") pasado a fetchCostosTransporte

### Fase 4: Skill reutilizable

- `.opencode/skills/bufala-modulo-chile/SKILL.md` — Skill de opencode que documenta los patrones del proyecto (pestañas Normal|Chile, CRUD 5 endpoints PHP, servicio 5 funciones, búsqueda server-side, formularios con decimales coma/punto, réplica de dashboards) para acelerar futuros desarrollos

### Archivos creados

- `database/scripts/dashboard_chile_infraestructura.sql`
- `src/Api/Dashboard/datos_chile.php`
- `src/Api/Dashboard/ApiIndicadoresOTIF_chile.php`
- `src/Api/Dashboard/ApiDetalleIndicadoresOTIF_chile.php`
- `src/Api/Dashboard/ApiClientesProducto_chile.php`
- `src/components/dashboard/DashboardChile.jsx`
- `.opencode/skills/bufala-modulo-chile/SKILL.md`

### Archivos modificados

- `src/Api/Dashboard/ApiDashboardCostosTransporte.php` — parámetro tipoPedido opcional
- `src/services/dashboard/dashboardService.js` — APPS_CONFIG.chile + funciones Chile
- `src/components/dashboard/DashboardDibufala.jsx` — pestañas Colombia | Chile
- `src/components/dashboard/SeccionTransporte.jsx` — prop tipoPedido

### Tests

- 221/221 tests pasando (17 archivos, 0 fallos)
- `npm run build` exitoso
- `php -l` OK en todos los PHP nuevos/modificados
- SQL validado contra BD real (3 pedidos Chile, 11 items, 2 clientes)

---

## [2026-07-29] 7 Mejoras: Documentos Chile seleccionables, Temp/pH independiente, Guia Master, Anular seguro

### Descripción

Implementación de 7 mejoras solicitadas por el usuario tras revisar la funcionalidad de facturación Chile:

### Punto 1-2: Mercancía y Anexos seleccionables desde BD

- Nueva tabla `documentos_chile_items` con campo `Tipo` ('mercancia'/'anexo') para almacenar items dinámicos
- Scripts SQL: `crear_tabla_documentos_chile_items.sql` + `alter_planillas_chile_add_items.sql`
- Nuevo endpoint `ApiGetDocumentosChileItems.php` para obtener items activos
- ModalDocumentosDespacho: checkboxes para seleccionar mercancía (mín 1) y anexos (todos seleccionados por defecto)
- Se almacena selección en PlanillasChile (MercanciaSeleccionada, AnexosSeleccionados)
- ApiGenerarPlanillasPDFChile.php: filtra mercancía según selección
- ApiAutodeclaracionChile.php: filtra anexos según selección

### Punto 3: Termógrafo + Encoding en Reporte Despacho

- ApiReporteDespachoChile.php: Agregado `pl.TermografoNo` al SELECT y display en lugar de 'N/A'
- Todos los `utf8_decode()` reemplazados por `iconv('UTF-8', 'ISO-8859-1//TRANSLIT', ...)`

### Punto 4: Escolta en Planilla Aerolínea desde Conductores

- ApiPlanillaDespachoChile.php: JOIN cambiado de `Ayudantes` a `Conductores` para Escolta y CC (porque Id_Ayudante en PlanillasChile almacena Id_Conductor)

### Punto 5: Temp/pH independiente por registro + validación

- ProduccionPedidos.jsx: Separada lógica de sincronización. Solo `lote` y `fechaElaboracion` se sincronizan entre items. `temperaturaInicial`, `temperaturaFinal`, `horaInicialPH`, `horaFinalPH` son independientes por registro
- Validación: `horaFinalPH >= horaInicialPH` al guardar
- Texto de ayuda actualizado

### Punto 6: Guía Master visible en Consolidación

- ConsolidacionMain.jsx: `guiaMaster` y `guiaHija` incluidos en el mapeo y visibles en cada tarjeta de pedido

### Punto 7: Botón Anular movido a zona separada

- Pedidos.jsx, PedidosSample.jsx, PedidosChile.jsx: Botón Anular movido fuera del toolbar principal a una sección separada por `border-t`, más pequeño (text-sm, outline), al extremo derecho. Se requiere intención deliberada para clickear.

### Archivos creados

- `database/scripts/crear_tabla_documentos_chile_items.sql`
- `database/scripts/alter_planillas_chile_add_items.sql`
- `src/Api/Planillas/ApiGetDocumentosChileItems.php`

### Archivos modificados

- `src/Api/Planillas/ApiGuardarPlanilla.php` — Nuevos campos MercanciaSeleccionada/AnexosSeleccionados
- `src/Api/Planillas/ApiGenerarPlanillasPDFChile.php` — Filtro dinámico de mercancía
- `src/Api/Planillas/ApiAutodeclaracionChile.php` — Filtro dinámico de anexos
- `src/Api/Planillas/ApiReporteDespachoChile.php` — TermografoNo + encoding fix
- `src/Api/Planillas/ApiPlanillaDespachoChile.php` — JOIN Conductores para Escolta
- `src/services/planillasService.js` — +getDocumentosChileItems, params mercancia/anexos
- `src/components/facturacion/ModalDocumentosDespacho.jsx` — Checkboxes mercancia + anexos
- `src/components/facturacion/FacturacionMain.jsx` — Estado extendido
- `src/components/facturacion/DashboardDocumentosDespacho.jsx` — Pasar selecciones a PDFs
- `src/pages/ProduccionPedidos.jsx` — Temp/pH independiente, validación hora PH
- `src/components/consolidacion/ConsolidacionMain.jsx` — Guia Master en tarjetas
- `src/pages/Pedidos.jsx` — Anular en zona separada
- `src/pages/PedidosSample.jsx` — Anular en zona separada
- `src/pages/PedidosChile.jsx` — Anular en zona separada

### Tests

- 221/221 tests pasando

---

## [2026-07-21] Consulta de Facturas Chile en "Consultar Existente"

### Descripción

Se agregó la capacidad de consultar facturas de Pedidos Chile desde la pestaña "Consultar Existente" del módulo de Facturación. Ahora el usuario puede:

- Filtrar facturas Chile por rango de fechas y número de factura
- Ver el PDF de la factura Chile
- Acceder a los documentos de la factura: Cartas de Responsabilidad (Aerolínea/Policía), Reporte de Despacho, Plan Vallejo y Autodeclaración Chile
- Enviar correos individuales o múltiples desde el listado
- Ver estadísticas segmentadas (Totales, Normales, Sample, Chile, Valor Total)

### Archivos modificados

- `src/Api/Facturacion/ApiObtenerFacturasChile.php`: Agregado `Id_Planilla` al SELECT y respuesta para soporte de documentos con planilla asociada
- `src/services/facturacionService.js`: Nueva función `obtenerFacturasChileConFiltros(filtros)` que acepta el mismo formato de filtros que `obtenerFacturasConFiltros`
- `src/components/facturacion/FacturacionMain.jsx`:
  - Importado `obtenerFacturasChileConFiltros`
  - Agregada opción "Pedidos Chile" al select de Tipo Factura en la pestaña Consultar
  - Agregada 5ta card de estadísticas (Chile) con color ámbar
  - Props condicionales `fetchFacturasFn` y `generarPDFFn` para redirigir a endpoints Chile
  - Función `actualizarEstadisticas` actualizada para detectar prefijo `CHI-`
  - Actualizado mensaje informativo del módulo
- `src/components/facturacion/DocumentosFacturaModal.jsx`:
  - Detecta `factura.tipoPedido === 'chile'` para usar funciones específicas de Chile
  - Cartas de Responsabilidad: usa `generarCartaResponsabilidadChile`
  - Reporte Despacho: usa `generarReporteDespachoChile`
  - Plan Vallejo: usa `generarPlanVallejoChile`
  - Nuevo botón "Autodeclaración Chile" (visible solo para facturas Chile)

### Notas técnicas

- El endpoint `ApiObtenerFacturasChile.php` ya soportaba filtro por `numero_factura`, solo se agregó `Id_Planilla`
- La pestaña "Crear Facturas" de Chile no fue modificada - funciona exactamente igual
- Cuando se selecciona "Todos los tipos", solo se muestran facturas normales/sample (comportamiento anterior)
- La responsividad se mantiene con grid de 3 columnas en móvil y 5 en desktop para las estadísticas

---

## [2026-07-16] Anulación de Pedidos (Pedidos, PedidosChile, PedidosSample)

### Descripción

Se agregó la funcionalidad de **Anular Pedido** en los módulos Pedidos, PedidosChile y PedidosSample. Incluye:

- Botón "Anular Pedido" en la barra de Gestión (rojo, con confirmación SweetAlert2)
- Badge de Estado (Anulado/Activo) en la barra de título y en el modal de búsqueda
- Los pedidos anulados se muestran con fondo rojo translúcido en el listado
- El botón se deshabilita si el pedido ya está anulado
- APIs GET ahora incluyen el campo `Estado` en la respuesta
- Protección contra doble anulación (validación backend)

### Archivos creados

- `src/Api/Pedidos/ApiAnularPedido.php`
- `src/Api/PedidosChile/ApiAnularPedidoChile.php`
- `src/Api/PedidosSample/ApiAnularSample.php`

### Archivos modificados

- `src/Api/Pedidos/ApiGetPedidos.php`: Agregado Estado al SELECT, eliminado filtro WHERE
- `src/Api/Pedidos/ApiGetPedido.php`: Agregado Estado al SELECT y bind_result
- `src/Api/PedidosChile/ApiGetPedidosChile.php`: Agregado Estado al SELECT y bind_result
- `src/Api/PedidosChile/ApiGetPedidoChile.php`: Agregado Estado al SELECT y bind_result
- `src/Api/PedidosSample/ApiGetSamples.php`: Agregado Estado al SELECT
- `src/Api/PedidosSample/ApiGetSample.php`: Agregado Estado al SELECT y bind_result
- `src/services/pedidosService.js`: Nueva función `anularPedido()`
- `src/services/pedidosChileService.js`: Nueva función `anularPedido()`
- `src/services/pedidosSampleService.js`: Nueva función `anularSample()`
- `src/pages/Pedidos.jsx`: Botón Anular + badge Estado + columna Estado en listado
- `src/pages/PedidosChile.jsx`: Botón Anular + badge Estado + columna Estado en listado
- `src/pages/PedidosSample.jsx`: Botón Anular + badge Estado + columna Estado en listado

### Tests

- 221/221 tests pasando

---

## [2026-07-07] Auto-fill NumeroOrden + Autodeclaración Chile

### Descripción

- Al generar factura Chile, `EncabInvoiceChile.NumeroOrden` se llena automáticamente con los `PurchaseOrder` de los pedidos seleccionados (concatenados).
- Nuevo documento PDF: "Autodeclaración para Exportación de Leche y Productos Lácteos con Destino a Chile" — específico para Chile, disponible como botón en DashboardDocumentosDespacho.

### Archivos creados

- `Api/Planillas/ApiAutodeclaracionChile.php`: PDF autodeclaración, 2 columnas, 13 puntos, datos dinámicos (factura, cliente, productos, lotes)

### Archivos modificados

- `Api/Planillas/ApiGuardarFacturaChile.php`: Auto-fill `NumeroOrden` desde `EncabPedidoChile.PurchaseOrder`
- `services/planillasService.js`: Función `generarAutodeclaracionChile()`
- `components/facturacion/DashboardDocumentosDespacho.jsx`: Botón "Autodeclaración Chile" solo visible cuando `tipoPedido === 'chile'`

### Tests

- 221/221 tests pasando

---

## [2026-07-07] Integración Pedidos Chile en Consolidación y Facturación

### Descripción

Se integró el módulo Pedidos Chile en los módulos de Consolidación y Facturación con pestañas/tabs independientes y tablas propias para facturación Chile.

### Consolidación Chile

- **Pestaña "Pedidos Chile"** en ConsolidacionMain.jsx junto a "Pedidos Locales"
- 4 nuevos endpoints PHP en `Api/Consolidacion/`:
  - `ApiEstadisticasChile.php` - estadísticas desde EncabPedidoChile/DetPedidoChile/ProductosChile
  - `ApiObtenerPedidosChile.php` - grilla de gestión de fechas con JOIN a ClientesChile/ProductosChile
  - `ApiActualizarFechaSalidaChile.php` - edición de fecha individual con tracking
  - `ApiActualizarEnLoteChile.php` - batch update de Guía Master/Hija, Aerolínea, Agencia
- Nuevas funciones en `consolidacionService.js`: `obtenerEstadisticasChile`, `obtenerPedidosChilePorFecha`, `actualizarFechaSalidaChile`, `actualizarDatosEnLoteChile`

### Facturación Chile

- **Botón "Pedidos Chile"** en el selector de tipo de FacturacionMain junto a Normales y Samples
- **Tablas independientes** creadas en BD:
  - `EncabInvoiceChile` - encabezado de factura Chile
  - `DetInvoiceChile` - detalle con columna adicional Codigo_CUST para ProductosChile
- 5 nuevos endpoints PHP en `Api/Facturacion/`:
  - `ApiObtenerPedidosChile.php` - lista pedidos Chile sin facturar
  - `ApiGuardarFacturaChile.php` - INSERT en EncabInvoiceChile/DetInvoiceChile, marca FacturaNo en EncabPedidoChile
  - `ApiObtenerFacturasChile.php` - consulta facturas Chile generadas
  - `ApiGenerarFacturaPDFChile.php` - PDF con detalle incluyendo Codigo_CUST
  - `ApiEliminarFacturaChile.php` - DELETE de EncabInvoiceChile/DetInvoiceChile + libera pedidos
- Nuevas funciones en `facturacionService.js`: `obtenerPedidosChilePorFecha`, `guardarFacturaChile`, `obtenerFacturasChile`, `generarFacturaPDFChile`, `eliminarFacturaChile`
- Componentes actualizados (`ListaPedidos`, `ConfiguracionFactura`, `ListaFacturasGeneradas`) aceptan props `fetchPedidosFn`, `guardarFacturaFn`, `fetchFacturasFn`, `generarPDFFn`, `eliminarFacturaFn` para inyectar funciones Chile

### Tests

- 221/221 tests pasando sin fallos

---

## [2026-06-23] Extensión: Despachos soporta Chile + Lote/Fechas en Pedidos Chile

### Descripción

Se extendió el módulo Despachos para soportar pedidos tipo "Chile". Ahora desde Despachos se pueden asignar **Lote, Fecha de Elaboración y Fecha de Vencimiento** a cada producto de un pedido Chile. La Fecha de Vencimiento se auto-calcula sumando `DiasVencimiento` del producto a la Fecha de Elaboración, pero es editable manualmente. Se agregó un visor separado (`ModalVisorProduccionChile`) en el detalle del pedido Chile para consultar esta información.

### Archivos creados

**Base de datos:**

- `database/scripts/alter_detpedido_chile_fechas.sql` — Agrega `FechaElaboracion DATE` y `FechaVencimiento DATE` a `DetPedidoChile`

**Frontend:**

- `src/components/pedidosChile/ModalVisorProduccionChile.jsx` — Nuevo modal de solo lectura que muestra: Producto, Lote, F. Elaboración, F. Vencimiento

### Archivos modificados

**Backend PHP — Producción (3):**

- `src/Api/Produccion/ApiGetPedidosProduccion.php` — Soporte `tipo === "chile"`: usa `EncabPedidoChile` + `ClientesChile`
- `src/Api/Produccion/ApiGetPedidoProduccion.php` — Soporte `tipo === "chile"`: usa `EncabPedidoChile` + `DetPedidoChile` + `ProductosChile`, retorna `lote`, `fechaElaboracion`, `fechaVencimiento`, `diasVencimiento`
- `src/Api/Produccion/ApiGuardarProduccion.php` — Soporte `tipo === "chile"`: UPDATE `DetPedidoChile` con `Lote1`, `FechaElaboracion`, `FechaVencimiento`

**Frontend (4):**

- `src/pages/ProduccionPedidos.jsx` — Agregado tipo "Chile" al selector. Cuando tipo="chile" muestra formulario diferencial (Lote + Fechas en vez de 3 lotes + responsable + cantidades). Estado `chileItemsEditados` separado. Auto-cálculo de vencimiento al ingresar elaboración. Botón de ayuda.
- `src/components/pedidosChile/PedidoChileDetail.jsx` — Usa `ModalVisorProduccionChile` en lugar del modal normal
- `src/pages/PedidosChile.jsx` — Mapeo de `detId` en items. Botón de ayuda en el encabezado.

### Diseño responsive

- Desktop: tabla con columnas Lote (select), F. Elaboración (date), F. Vencimiento (date)
- Mobile: cards apiladas con los mismos 3 campos
- Diferenciación visual: título "Despachos — Pedidos Chile" en color teal
- Botones de ayuda con icono ? en ambos módulos

### Auto-cálculo de vencimiento

Al seleccionar Fecha de Elaboración, el sistema suma `DiasVencimiento` del producto (desde `ProductosChile`) y auto-completa Fecha de Vencimiento. El usuario puede modificarla manualmente después.

### Script BD requerido

- `database/scripts/alter_detpedido_chile_fechas.sql` — Ejecutar en phpMyAdmin **antes de usar** la nueva funcionalidad

### Tests

- 221 tests, 0 fallos ✅

---

## [2026-06-19] Nuevo Módulo: Comentarios por Cliente

### Descripción

Nuevo módulo "Comentarios" en el menú principal para gestionar comentarios asociados a cada cliente y región desde la tabla `Comentarios`. Solo puede existir un registro por combinación (Cliente, Región).

### Archivos creados

**Backend PHP (`src/Api/Comentarios/`):**

- `ApiGetDatosSelect.php` — Retorna listado de clientes activos + regiones para selects del formulario
- `ApiGetComentarios.php` — Lista comentarios con JOIN a Clientes y ClientesRegion. Filtro opcional por Id_Cliente
- `ApiGetComentario.php` — Obtiene un comentario por ID
- `ApiGuardarComentario.php` — INSERT con validación de duplicado (Cliente + Región) antes de la transacción. Si existe, retorna error instructivo
- `ApiModificarComentario.php` — UPDATE con verificación de existencia previa

**Frontend React:**

- `src/services/comentariosService.js` — 5 funciones: `getDatosSelect`, `listarComentarios`, `obtenerComentario`, `guardarComentario`, `modificarComentario`
- `src/pages/Comentarios.jsx` — Página completa con formulario arriba y listado filtrable abajo. Vista desktop (tabla) + mobile (cards)
- `src/__tests__/services/comentariosService.test.js` — 8 tests del servicio

### Archivos modificados

- `src/App.jsx` — Import y ruta `/comentarios`
- `src/components/layout.jsx` — Ítem "Comentarios" con ícono `MessageCircle` en el menú

### Validaciones

- Frontend: Cliente y Región obligatorios, al menos un comentario no vacío, textareas con límite 900 caracteres
- Backend (Guardar): `SELECT Id_Comentario FROM Comentarios WHERE Id_Cliente = ? AND Id_ClienteRegion = ?` ANTES del INSERT. Si existe → mensaje: "Ya existe un comentario para este cliente y región. Búsquelo en la lista y use Editar para modificarlo."
- Backend (Modificar): Verifica que el `Id_Comentario` exista antes del UPDATE

### Diseño

- Formulario en contenedor blanco con sombra, selects en grid 2 columnas (desktop) / 1 columna (mobile)
- Listado con filtro por cliente (select "Todos los clientes")
- Desktop: tabla con columnas Cliente, Región, Comentario Primario, Comentario Secundario, Acción
- Mobile: cards con fondo azul para primario, morado para secundario
- Textareas con contador de caracteres (X/900)
- Spinner uniforme del proyecto

### Notas

- No modifica ni elimina registros existentes en la tabla `Comentarios` (solo INSERT y UPDATE)
- Las subconsultas SELECT en los PDFs (BOL) no se ven afectadas
- No tiene opción de eliminar (solo crear y modificar)
- Integridad referencial se mantiene por convención en PHP (no hay FK formales en BD)

### Script BD requerido

- `database/scripts/agregar_permiso_comentarios.sql` — Ejecutar en phpMyAdmin para agregar el permiso `/comentarios` en la tabla `Permisos` para cada usuario que deba ver la opción en el menú

### Tests

- 221 tests, 0 fallos ✅ (213 originales + 8 nuevos)

---

## [2026-05-29] Multi-cambio: NC con PO/Región, Dashboard Aéreo, OTIF+NC, OTIF drill-down

### Solicitud 1: Notas Crédito — PurchaseOrder y Región

**Descripción:** Se agregó PurchaseOrder y Región del cliente en el listado, formulario y PDF de notas crédito.

**Backend PHP modificados:**

- `src/Api/NotasCredito/ApiGetDetallePedidosSeleccionados.php` — JOIN a `EncabPedido.PurchaseOrder` y `ClientesRegion.Region`
- `src/Api/NotasCredito/ApiGetNotaCredito.php` — JOIN para retornar `purchaseOrder` y `region` en detalle
- `src/Api/NotasCredito/ApiGetNotasCredito.php` — GROUP_CONCAT de PurchaseOrders y Regiones para el listado
- `src/Api/NotasCredito/ApiImprimirNotaCredito.php` — Nuevas columnas P.O. y Región en tabla del PDF, columnas redistribuidas

**Frontend React modificados:**

- `src/components/notasCredito/NotaCreditoDetail.jsx` — Columnas P.O. y Región en tabla desktop y cards mobile
- `src/pages/NotasCredito.jsx` — Mapeo de `purchaseOrder` y `region` en items; nuevas columnas en modal búsqueda

### Solicitud 2: Dashboard — Costos Aéreos primero, tarjetas mejoradas, USD destacado

**Descripción:** Se reordenó la sección de Transporte en el Dashboard mostrando primero Costos de Transporte Aéreo y luego Transporte Terrestre. Las tarjetas KPI aéreas ahora tienen estilo "Métricas Clave" (gradiente, hover, iconos, barra de progreso). USD aparece primero y destacado (verde/emerald), COP secundario.

**Modificados:**

- `src/components/dashboard/SeccionTransporte.jsx` — Reestructuración completa: sección Aéreo primero con tarjetas profesionales (gradiente, hover, iconos SVG, barra progreso), tooltip de gráfico con USD destacado en verde emerald

### Solicitud 3: OTIF — Notas Crédito afectan IN FULL

**Descripción:** Las notas crédito ahora afectan el indicador IN FULL. Se restan las cantidades creditadas (`DetNotaCredito.CantidadCredito`) de las unidades despachadas efectivas para el cálculo.

**Modificado:**

- `src/Api/Dashboard/ApiIndicadoresOTIF.php` — LEFT JOIN a subconsulta de `DetNotaCredito` + `EncabNotaCredito` (Estado='Activo') para restar `unidadesCreditadas` de `unidadesDespachadas`. Nuevos campos en respuesta: `unidadesCreditadas`, `unidadesEfectivas`.

### Solicitud 4: OTIF Drill-down — Modal con detalle de pedidos

**Descripción:** Los indicadores IN FULL y ON TIME ahora son clickeables cuando son < 100%. Al hacer clic se abre un modal que lista los pedidos que afectan cada indicador.

**Archivos creados:**

- `src/Api/Dashboard/ApiDetalleIndicadoresOTIF.php` — Nuevo endpoint. Tipo `inFull`: pedidos donde Cantidad < Cantidad_Orig con detalle de productos. Tipo `onTime`: pedidos donde FechaSalida_Orig ≠ FechaSalida con días de diferencia.
- `src/components/dashboard/ModalDetalleOTIF.jsx` — Modal responsive con tabla desktop y cards mobile. Para IN FULL: muestra producto, pedido vs despachado, faltante. Para ON TIME: muestra fecha original vs real y diferencia en días.

**Archivos modificados:**

- `src/services/dashboard/dashboardService.js` — Nueva función `fetchDetalleIndicadorOTIF()`
- `src/components/dashboard/KPIOTIFCards.jsx` — Props `onInFullClick`/`onOnTimeClick`, indicadores clickeables cuando valor < 100% con indicador "▼ Ver detalle"
- `src/components/dashboard/DashboardDibufala.jsx` — Estados de modal OTIF, handlers de click, integración con KPIOTIFCards y ModalDetalleOTIF

### Tests

- 213 tests, 0 fallos ✅

---

## [2026-05-28] Feature: Indicadores OTIF para Dashboard

### Descripción

Nuevos indicadores de desempeño logístico en el módulo Dashboard (no en Inicio).
Se integran en la sección Ventas dentro de `DashboardDibufala.jsx`.

### Indicadores implementados

- **IN FULL**: `SUM(Cantidad) / SUM(Cantidad_Orig > 0 ? Cantidad_Orig : Cantidad)` — unidades despachadas vs pedidas
- **ON TIME**: `SUM(Cantidad ON TIME) / SUM(Cantidad)` — pedidos con `FechaSalida_Orig IS NULL o == FechaSalida`
- **OTIF**: `IN FULL × ON TIME` — indicador compuesto

### Filtros

- Rango: `FechaSalida`, hereda las fechas seleccionadas en los filtros del Dashboard
- Solo pedidos con `Estado = 'Activo'`

### Archivos creados / modificados

- `src/Api/Dashboard/ApiIndicadoresOTIF.php` — Nuevo endpoint PHP
- `src/services/dashboard/dashboardService.js` — Nueva función `fetchIndicadoresOTIF()`
- `src/components/dashboard/KPIOTIFCards.jsx` — Componente con 3 tarjetas (anillo SVG + semáforo)
- `src/components/dashboard/DashboardDibufala.jsx` — Integración en sección Ventas

### UI

- 3 cards con gráfico de anillo SVG y semáforo de colores (verde/amarillo/rojo)
- Se carga en paralelo con los demás datos del dashboard (`Promise.all`)

---

## [2026-05-27] Fix: Columnas SQL incorrectas en módulo PedidosChile

### Descripción

Las columnas `Id_EncabPedido` e `Id_DetPedido` usadas en las consultas SQL no existen en las tablas `EncabPedidoChile` ni `DetPedidoChile`. Los nombres reales tienen el sufijo "Chile": `Id_EncabPedidoChile` e `Id_DetPedidoChile`.

### Causa

El código PHP copió los nombres de columna del módulo Pedidos regular (`Id_EncabPedido`), pero la tabla Chile fue creada con el sufijo "Chile" en sus columnas (`Id_EncabPedidoChile`, `Id_DetPedidoChile`).

### Archivos corregidos

**PHP (Backend):**

- `src/Api/PedidosChile/ApiValidarNumeroOrdenChile.php` — SQL corregido
- `src/Api/PedidosChile/ApiGuardarPedidoChile.php` — SQL corregido
- `src/Api/PedidosChile/ApiActualizarPedidoChile.php` — SQL corregido
- `src/Api/PedidosChile/ApiGetPedidoChile.php` — SQL + JSON keys corregido
- `src/Api/PedidosChile/ApiGetRangoPedidosChile.php` — SQL corregido

**React (Frontend):**

- `src/pages/PedidosChile.jsx` — claves `Id_EncabPedidoChile` / `Id_DetPedidoChile` añadidas como primarias en el mapeo con fallback a las claves viejas

### SQL (ejecutar en phpMyAdmin)

- `database/scripts/alter_pedidos_chile_tracking_cambios.sql` — Agrega columnas `_Orig` de tracking a `EncabPedidoChile` y `DetPedidoChile`

### Tests

- 213 tests, 0 fallos ✅

---

## [2026-05-06] Módulo Pedidos Chile — Implementación Completa

### Descripción

Nuevo módulo para gestionar pedidos de exportación a Chile con lista de empaque en PDF.
Sigue el mismo patrón de Pedidos Colombia (crear, modificar, buscar, imprimir).

### Archivos creados / modificados

**Base de datos:**

- `database/scripts/crear_tablas_pedidos_chile.sql` — 4 tablas: `ClientesChile`, `ProductosChile`, `EncabPedidoChile`, `DetPedidoChile`. Script ejecutado en producción.

**PHP (Backend):**

- `src/Api/PedidosChile/ApiGetDatosSelect.php` — Clientes, productos, agencias, aerolíneas activos
- `src/Api/PedidosChile/ApiGetPedidosChile.php` — Lista para modal de búsqueda
- `src/Api/PedidosChile/ApiGetPedidoChile.php` — Carga pedido específico (encabezado + detalle)
- `src/Api/PedidosChile/ApiGuardarPedidoChile.php` — INSERT con transacción, retorna CHI-000001
- `src/Api/PedidosChile/ApiActualizarPedidoChile.php` — UPDATE encabezado + DELETE/INSERT detalle
- `src/Api/PedidosChile/ApiImprimirListaEmpaqueChile.php` — PDF FPDF A4 horizontal, 17 columnas con totales

**React (Frontend):**

- `src/services/pedidosChileService.js` — 6 funciones: getDatosSelectChile, guardarPedidoChile, getPedidosChile, getPedidoChileEspecifico, actualizarPedidoChile, imprimirPedidoChile
- `src/components/pedidosChile/PedidoChileHeader.jsx` — 12 campos en 3 filas + observaciones
- `src/components/pedidosChile/PedidoChileDetail.jsx` — Tabla 17 columnas, auto-fill por producto, cálculos automáticos
- `src/pages/PedidosChile.jsx` — Página principal: toolbar (Buscar/Refrescar/Nuevo/Guardar/Actualizar/Imprimir), modal búsqueda, ModalVisorPreliminar, totales
- `src/App.jsx` — Ruta `/pedidos-chile` agregada
- `src/components/layout.jsx` — Ítem de menú "Pedidos Chile" con ícono Globe

**Tests:**

- `src/__tests__/services/pedidosChileService.test.js` — 23 tests
- `src/__tests__/pages/PedidosChile.test.jsx` — 15 tests
- **Total del proyecto: 228 tests ✅ (era 191 antes de este módulo)**

### Notas técnicas

- PHP: usa `bind_result()` en lugar de `get_result()` (regla de producción)
- FPDF: codificación ISO-8859-1 con `iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str)`
- Impresión: móvil → nueva pestaña, escritorio → ModalVisorPreliminar
- Numeración automática: CHI-NNNNNN (6 dígitos, calculado en el frontend)

---

## [2026-05-06] Módulo Producción — Registro de Cantidades por Lote

## RESUMEN

Se ha implementado la funcionalidad de registrar cantidad por lote en el módulo de Producción. Ahora, al asignar responsable y lotes a un pedido, se pueden registrar cantidades específicas para cada lote con validación automática.

## ARCHIVOS MODIFICADOS

### 1. Frontend: `src/pages/ProduccionPedidos.jsx`

**Cambios principales:**

- ✅ Extendido estado `itemsEditados` para incluir array `cantidades: [0, 0, 0]`
- ✅ Nuevo handler `handleCantidadLoteChange()` para capturar cambios en cantidades
- ✅ Nueva función `getCantidadLoteValue()` para obtener cantidad actual de cada lote
- ✅ Nueva función `calcularTotalCantidades()` para sumar cantidades de los 3 lotes
- ✅ Nueva función `validarCantidadesLotes()` para validar que suma ≤ cantidad disponible
- ✅ Nueva función `obtenerMensajeValidacion()` para mostrar suma en tiempo real con colores
- ✅ Nueva función `validarTodosPedidos()` que ejecuta validación antes de guardar
- ✅ UI mejorada con inputs numéricos bajo cada selector de lote
- ✅ Validación visual: texto verde si es válido, rojo si hay exceso
- ✅ Mensaje detallado de error al intentar guardar con validación fallida

**Validación en tiempo real:**

- Suma de cantidades se muestra en cada fila: "Total: X / Disponible: Y"
- Color verde ✓ si suma ≤ cantidad disponible
- Color rojo ❌ si suma > cantidad disponible (muestra exceso)
- Al hacer clic en "Guardar", se validan todos los ítems antes de enviar

### 2. Backend GET: `src/Api/Produccion/ApiGetPedidoProduccion.php`

**Cambios principales:**

- ✅ Agregados campos `CantidadLote1`, `CantidadLote2`, `CantidadLote3` al SELECT
- ✅ Estos campos se retornan en la respuesta JSON como:
  ```json
  {
    "cantidadLote1": 50,
    "cantidadLote2": 40,
    "cantidadLote3": 10
  }
  ```
- ✅ Los valores se cargan en el estado del componente al abrir un pedido

### 3. Backend SAVE: `src/Api/Produccion/ApiGuardarProduccion.php`

**Cambios principales:**

- ✅ Ahora recibe estructura de datos: `{ idDet, idResponsable, lotes: [], cantidades: [] }`
- ✅ Validación en backend:
  - Suma de cantidades ≤ Cantidad del detalle
  - Si falla: lanza excepción con mensaje detallado
  - Si pasa: procede a actualizar
- ✅ SQL UPDATE ahora incluye:
  - `CantidadLote1 = ?`
  - `CantidadLote2 = ?`
  - `CantidadLote3 = ?`
- ✅ Transacción completa: si hay error en cualquier ítem, se revierte todo
- ✅ Auditoria: registra usuario y fecha de modificación

## FUNCIONALIDADES PRESERVADAS ✓

- Selección de Responsable
- Selección de Lotes (1, 2, 3)
- Búsqueda de pedidos por rango de fechas
- Carga de detalle de pedido
- Guardado y recarga de datos
- Responsividad (Desktop y Móvil)
- Estados de carga
- Mensajes de error/éxito con SweetAlert2

## FLUJO DE FUNCIONAMIENTO

### Paso 1: Buscar Pedidos

```
Usuario selecciona Tipo, Fecha Desde, Fecha Hasta → Click "Buscar pedidos"
```

### Paso 2: Cargar Pedido

```
Click en botón "Cargar" de un pedido
→ API: GET /ApiGetPedidoProduccion.php
→ Devuelve ítems CON campos: cantidadLote1, cantidadLote2, cantidadLote3
→ Se cargan en estado: itemsEditados
```

### Paso 3: Asignar Responsable, Lotes y Cantidades

```
Para cada ítem:
- Seleccionar Responsable (dropdown)
- Seleccionar Lote 1 (dropdown) + Ingresar Cantidad 1 (input numérico)
- Seleccionar Lote 2 (dropdown) + Ingresar Cantidad 2 (input numérico)
- Seleccionar Lote 3 (dropdown) + Ingresar Cantidad 3 (input numérico)

Al escribir cantidades:
- Se calcula suma en tiempo real
- Muestra: "Total: X / Disponible: Y"
- Color verde si suma ≤ disponible
- Color rojo ❌ si suma > disponible (con exceso)
```

### Paso 4: Guardar (CON VALIDACIÓN)

```
Click "Guardar Producción"
→ Frontend valida ANTES de enviar:
   - Para CADA ítem: suma(cant1, cant2, cant3) ≤ cantidad_disponible
   - Si FALLA: Muestra alerta con detalle de errores y CANCELA envío
   - Si PASA: Envía al backend
→ API: POST /ApiGuardarProduccion.php
   - Backend valida nuevamente (defensa de capas)
   - Suma de cantidades ≤ cantidad disponible
   - Si FALLA: Retorna error
   - Si PASA: UPDATE en BD y retorna éxito
→ Si éxito: Muestra mensaje "Producción guardada correctamente"
→ Recarga el pedido con datos guardados
```

## ESTRUCTURA DE DATOS

### Request al Guardar (Frontend → Backend)

```json
{
  "tipo": "normal",
  "idPedido": 123,
  "items": [
    {
      "idDet": 456,
      "idResponsable": 1,
      "lotes": [10, 20, 30],
      "cantidades": [50, 40, 10]
    },
    {
      "idDet": 457,
      "idResponsable": 2,
      "lotes": [40, null, null],
      "cantidades": [100, 0, 0]
    }
  ]
}
```

### Response al Cargar (Backend → Frontend)

```json
{
  "success": true,
  "pedido": {
    "items": [
      {
        "idDet": 456,
        "cantidad": 100,
        "cantidadLote1": 50,
        "cantidadLote2": 40,
        "cantidadLote3": 10,
        "lotes": { ... }
      }
    ]
  }
}
```

## VALIDACIONES

### Frontend (Tiempo Real)

1. ✓ Cantidades solo aceptan números ≥ 0
2. ✓ Suma de cantidades se muestra en vivo
3. ✓ Validación visual con colores

### Frontend (Al Guardar)

1. ✓ Para cada ítem: suma(cant1, cant2, cant3) ≤ cantidad_disponible
2. ✓ Si hay error: muestra alerta con lista detallada de productos con problema
3. ✓ Usuario debe corregir antes de guardar

### Backend (Al Guardar)

1. ✓ Valida que suma de cantidades ≤ cantidad disponible
2. ✓ Valida que no se repitan lotes en mismo ítem
3. ✓ Transacción: si hay error, revierte todos los cambios

## CAMPOS EN BASE DE DATOS

La tabla `DetPedido` (y `DetPedidoSample`) debe tener estos campos (ya existen con valor 0 por defecto):

```sql
- CantidadLote1 INT DEFAULT 0
- CantidadLote2 INT DEFAULT 0
- CantidadLote3 INT DEFAULT 0
```

## EJEMPLO DE USO

**Escenario:** Pedido con 100 unidades de Producto XYZ

1. Usuario abre Producción → Busca pedidos → Carga pedido
2. Ve fila con:
   - Producto: XYZ
   - Cantidad: 100
   - Responsable: [--Sin asignar--]
   - Lote 1: [--] + Input: 0
   - Lote 2: [--] + Input: 0
   - Lote 3: [--] + Input: 0
   - Mensaje: "Total: 0 / Disponible: 100" (verde ✓)

3. Usuario selecciona:
   - Responsable: Juan García
   - Lote 1: LOTE-001 → Ingresa 50
   - Lote 2: LOTE-002 → Ingresa 40
   - Lote 3: LOTE-003 → Ingresa 10

4. Se actualiza mensaje: "Total: 100 / Disponible: 100" (verde ✓)

5. Click "Guardar Producción"
   - Validación OK
   - Se envía al backend
   - Backend guarda en BD:
     - Id_Responsable = 1
     - Lote1 = 10, Lote2 = 20, Lote3 = 30
     - CantidadLote1 = 50, CantidadLote2 = 40, CantidadLote3 = 10
   - Retorna éxito

**CASO ERROR:** Si usuario intenta asignar 120 unidades (50+40+30):

1. Mensaje en rojo: "Total: 120 / Disponible: 100" ❌ Exceso: 20
2. Click "Guardar"
3. Alerta: "Error en validación de cantidades:
   - Producto: XYZ
   - Cantidad disponible: 100
   - Total asignado: 120
   - Exceso: 20 unidades"
4. Usuario debe corregir

## TESTING

### Casos a Probar

1. ✓ Cargar pedido → Verificar que trae cantidades guardadas
2. ✓ Asignar responsable + lotes + cantidades válidas → Guardar OK
3. ✓ Ingresar cantidades que suman más que disponible → Validación error
4. ✓ Dejar cantidades en 0 → Guardar OK (sin asignar cantidad)
5. ✓ Cambiar cantidades → Se recalcula suma automáticamente
6. ✓ Recargar página → Mantiene datos guardados

---

## [2026-05-22] Costos de Transporte Aéreo — Implementación Completa

### Descripción

Nuevo módulo de Costos de Transporte Aéreo dentro de Consolidación. Permite registrar costos aéreos por Fecha + Guía Master con flete en USD, TRM y peso cobrado. Incluye indicador "Costo Aéreo por Kg" en el Dashboard usando el peso neto total despachado.

### Archivos creados

**Base de datos:**

- `database/scripts/create_costos_transporte_aereo.sql` — Tabla `CostosTransporteAereo` con índice único (Fecha, GuiaMaster). **Ejecutar en producción antes de usar.**

**PHP (Backend) — `src/Api/CostosTransporteAereo/`:**

- `ApiObtenerGuiasMaster.php` — Endpoint auxiliar: retorna GuiaMaster disponibles de EncabInvoice para una fecha
- `ApiGetCostosAereo.php` — Lista costos aéreos por rango de fechas (calcula CostoCOP y CostoAereoPorKg)
- `ApiGetCostoAereo.php` — Obtiene un costo aéreo por ID
- `ApiGuardarCostoAereo.php` — INSERT (valida Fecha+GuiaMaster en EncabInvoice, no duplicado)
- `ApiModificarCostoAereo.php` — UPDATE dinámico
- `ApiEliminarCostoAereo.php` — DELETE por ID

**PHP (Dashboard):**

- `src/Api/Dashboard/ApiDashboardCostosTransporte.php` — **Extendido**: agrega sección `aereo` con datos consolidados y KPIs. No modifica datos existentes.

**React (Frontend):**

- `src/services/consolidacionService.js` — **Extendido**: 6 nuevas funciones (obtenerGuiasMasterPorFecha, obtenerCostosAereo, obtenerCostoAereo, guardarCostoAereo, modificarCostoAereo, eliminarCostoAereo)
- `src/services/dashboard/dashboardService.js` — **Extendido**: nueva función `fetchCostosAereo()`
- `src/components/consolidacion/ConsolidacionMain.jsx` — **Extendido**: nuevo botón "✈️ Costos de Transporte Aéreo" al mismo nivel que los existentes, sección desplegable con tabla/cards responsive, modal con formulario completo (Fecha→carga GuiaMaster dinámicamente, USD, TRM, Peso, Observaciones, preview COP)
- `src/components/dashboard/SeccionTransporte.jsx` — **Extendido**: carga paralela de datos aéreos, sección con tabla/cards responsive y KPI "Costo Aéreo / Kg" usando pesoNetoTotal del Dashboard Ventas

### Diseño

- Paleta **sky/cyan** (#0EA5E9) para diferenciar visualmente del terrestre (verde)
- Tabla desktop + tarjetas mobile (mismo patrón que Costos de Transporte)
- Select dinámico de Guía Master: al elegir fecha, se cargan las guías disponibles
- Preview de conversión USD→COP en tiempo real

### Notas

- La tabla `CostosTransporteAereo` debe crearse antes de usar la funcionalidad
- El Dashboard carga datos aéreos en paralelo con los terrestres (Promise.all)
- Si no hay datos aéreos, la sección no se muestra en el Dashboard

---

## [2026-05-23] Página Inicio Rediseñada + Pedidos Chile Funcionalidad Completa

### Parte A: Rediseño de la Página Inicio

La página de entrada (`/`) pasó de datos estáticos hardcodeados a un dashboard real con métricas vivas de la BD.

**Nuevos archivos:**

- `src/Api/Inicio/ApiResumenInicio.php` — Endpoint que retorna métricas consolidadas: totales (clientes, productos, pedidos activos), resumen del mes actual (facturas, kg, valor, costos flete), últimas facturas/pedidos, tendencia kg 7 días, saldo por facturar
- `src/services/inicioService.js` — Fetch a ApiResumenInicio.php

**Modificados:**

- `src/pages/Inicio.jsx` — Rediseño completo: Hero section con gradiente y bienvenida dinámica, 4 KPIs con datos reales, gráfico de barras de kg despachados (Recharts), últimas facturas y pedidos reales, acciones rápidas funcionales con `useNavigate()`, resumen operativo con valores reales, loading/error states
- `src/__tests__/pages/Inicio.test.jsx` — Actualizado para nuevo componente (MemoryRouter, mock de inicioService, nuevas aserciones)

### Parte B: Pedidos Chile — Funcionalidad Completa

**GAP #1 — Validación de Número de Orden duplicada:**

- `src/Api/PedidosChile/ApiValidarNumeroOrdenChile.php` — **Nuevo**: Verifica si un NumeroOrden ya existe en EncabPedidoChile
- `src/services/pedidosChileService.js` — **Extendido**: +función `validarNumeroOrdenChile()`
- `src/pages/PedidosChile.jsx` — **Modificado**: `validateAll()` ahora verifica duplicados antes de guardar/actualizar

**GAP #2 — Impresión múltiple:**

- `src/Api/PedidosChile/ApiContarPedidosChile.php` — **Nuevo**: Cuenta pedidos por filtro (fechas o números)
- `src/Api/PedidosChile/ApiGetRangoPedidosChile.php` — **Nuevo**: Obtiene pedidos en rango con JOIN a ClientesChile
- `src/Api/PedidosChile/ApiImprimirMultiplesListaEmpaqueChile.php` — **Nuevo**: PDF múltiple con formato Chile (máx 50 pedidos, por fechas o números)
- `src/services/pedidosChileService.js` — **Extendido**: +3 funciones
- `src/pages/PedidosChile.jsx` — **Modificado**: Botón "Imprimir Múltiple" ahora funcional (modal con selector de modo fechas/números)

**GAP #8 — Modal búsqueda mobile cards:**

- `src/pages/PedidosChile.jsx` — **Modificado**: Modal de búsqueda ahora tiene vista desktop (`hidden sm:table`) + cards mobile (`sm:hidden`)

**GAP #10 — Validación de detalle mejorada:**

- `src/pages/PedidosChile.jsx` — **Modificado**: `validateAll()` ahora valida también descripción y lote obligatorios por cada ítem

### Documentación

- `AGENTS.md` — Agregadas **Reglas Universales** (Mobile First, tabla+cards, no romper, documentar, paleta uniforme) en las REGLAS RÁPIDAS para que ningún agente las pase por alto
- `docs/changelog/CAMBIOS_PRODUCCION.md` — Esta entrada

### Tests

- 228 tests, 0 fallos

---

## NOTAS IMPORTANTES

1. **Validación en Capas**: El frontend valida para UX, el backend valida para seguridad
2. **Transacciones**: Si hay error al guardar un ítem, se revierte TODO
3. **Auditoría**: Se registra usuario y fecha de cada cambio
4. **Compatibilidad**: Los cambios son compatibles con la estructura existente
5. **Performance**: Las validaciones son rápidas (no hay queries adicionales innecesarias)

## PRÓXIMOS PASOS OPCIONALES

- [ ] Agregar reportes por cantidad asignada a lotes
- [ ] Permitir editar cantidades después de guardar
- [ ] Historial de cambios de cantidades
- [ ] Exportar detalle de asignación a Excel
