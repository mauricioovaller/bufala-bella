# 📧 Guía: Sistema Genérico de Envío de Correos

## 🎯 Resumen Rápido

Tu aplicación ahora tiene un **sistema centralizado y reutilizable de envío de correos** que funciona en:

- ✅ Facturación (LISTO - funciona igual que antes)
- 🔄 Pedidos (Preparado para integración)
- 🔄 Consolidación (Preparado para integración)

## 📦 Nuevos Archivos Creados

```
src/
├── services/
│   └── envioCorreosGenericoService.js       ← Servicio genérico (NUEVO)
└── components/
    └── correos/                             ← Carpeta nueva
        ├── EnviarCorreoModal.jsx            ← Modal genérico reutilizable
        └── SelectorDocumentos.jsx           ← Selector flexible de documentos
```

## 🔄 Cómo Funciona Internamente

### Flujo en Facturación (Actual - sin cambios visibles)

```javascript
Usuario selecciona "Enviar" en ListaFacturasGeneradas
           ↓
EnviarCorreoFacturaModal (REFACTORIZADO internamente)
           ↓
envioCorreosGenericoService.enviarCorreoGenerico()
           ↓
✅ Historial guardado automáticamente en BD
✅ Correo enviado con documentos adjuntos
```

## 📚 Integración en PEDIDOS

Para agregar envío de correos a Pedidos:

### 1. En PedidoDetail.jsx (o donde quieras agregar el botón)

```jsx
import EnviarCorreoModal from "../correos/EnviarCorreoModal";
import {
  generarReportePedido,
  generarGuia,
} from "../../services/pedidosService";

export default function PedidoDetail({ pedido }) {
  const [mostrarEnvioCorreo, setMostrarEnvioCorreo] = useState(false);

  // Documentos disponibles para pedidos
  const documentosPedidos = [
    {
      id: "guia",
      nombre: "Guía de Transporte",
      descripcion: "Documento de envío",
      obligatorio: true,
    },
    {
      id: "reporte-pedido",
      nombre: "Reporte del Pedido",
      descripcion: "Detalles completos",
      obligatorio: false,
    },
    {
      id: "factura-pedido",
      nombre: "Factura Relacionada",
      descripcion: "Comprobante fiscal",
      obligatorio: false,
    },
  ];

  // Generador de documentos específico para pedidos
  const generadorPedidos = async (tipoDocumento, datosPedido) => {
    switch (tipoDocumento) {
      case "guia":
        return await generarGuia(datosPedido.id);
      case "reporte-pedido":
        return await generarReportePedido(datosPedido.id);
      case "factura-pedido":
        return await generarFacturaPedido(datosPedido.id);
      default:
        throw new Error("Documento desconocido");
    }
  };

  return (
    <>
      {/* Tu UI normal */}
      <button onClick={() => setMostrarEnvioCorreo(true)}>
        📧 Enviar por Correo
      </button>

      {/* Modal genérico - reutilizable */}
      <EnviarCorreoModal
        isOpen={mostrarEnvioCorreo}
        onClose={() => setMostrarEnvioCorreo(false)}
        modulo="pedidos"
        referencia={{
          id: pedido.id,
          numero: pedido.numero,
          cliente: pedido.cliente,
          fecha: pedido.fecha,
          // ... otros datos que necesite
        }}
        documentosDisponibles={documentosPedidos}
        generadorDocumentos={generadorPedidos}
        onEnvioExitoso={(resultado) => {
          console.log("Pedido enviado:", resultado);
          // Actualizar UI si es necesario
        }}
      />
    </>
  );
}
```

## 📚 Integración en CONSOLIDACIÓN

Similar a Pedidos:

```jsx
import EnviarCorreoModal from "../correos/EnviarCorreoModal";

const documentosConsolidacion = [
  {
    id: "acta-consolidacion",
    nombre: "Acta de Consolidación",
    obligatorio: true,
  },
  { id: "lista-detalle", nombre: "Lista Detallada", obligatorio: false },
  {
    id: "certificado-despacho",
    nombre: "Certificado de Despacho",
    obligatorio: false,
  },
];

const generadorConsolidacion = async (tipoDocumento, datosConsolidacion) => {
  // Tu lógica específica
};

// Usar el modal igual
<EnviarCorreoModal
  modulo="consolidacion"
  referencia={consolidacion}
  documentosDisponibles={documentosConsolidacion}
  generadorDocumentos={generadorConsolidacion}
  // ... resto de props
/>;
```

## 🎨 Props de EnviarCorreoModal

```javascript
{
  isOpen: boolean,                         // Modal abierto/cerrado
  onClose: () => {},                       // Callback para cerrar
  modulo: 'facturacion'|'pedidos'|'consolidacion', // Tu módulo
  referencia: {                            // Datos del objeto a enviar
    id: number,
    numero: string,
    cliente: string,
    fecha: string,
    // ... datos específicos de tu módulo
  },
  documentosDisponibles: [                 // Array de documentos
    {
      id: 'doc-id',
      nombre: 'Nombre Visible',
      descripcion: 'Descripción (opcional)',
      obligatorio: false
    }
  ],
  generadorDocumentos: async (tipoDoc, datos) => blob, // Tu función generadora
  onEnvioExitoso: (resultado) => {}        // Callback cuando se envía
}
```

## 💾 Base de Datos - Ejecutar Script

El script SQL está en: `crear_tabla_historial_correos.sql`

Contiene:

- ✅ `correos_enviados` - Historial centralizado
- ✅ `plantillas_correos_modulos` - Plantillas reutilizables
- ✅ `documentos_adjuntables` - Catálogo de documentos
- ✅ Vistas útiles para reportes

## 🔍 Revisar Historial de Correos

```javascript
import {
  obtenerHistorialCorreos,
  obtenerEstadisticasCorreos,
} from "../../services/envioCorreosGenericoService";

// Obtener todos los correos
const correos = await obtenerHistorialCorreos({
  modulo: "facturacion",
});

// Obtener estadísticas
const stats = await obtenerEstadisticasCorreos("facturacion");
// Resultado: { total: 10, exitosos: 9, fallidos: 1 }
```

## ⚙️ Registrar Generadores Dinámicamente

Si necesitas registrar nuevos documentos en tiempo de ejecución:

```javascript
import { registrarGeneradoresModulo } from "../../services/envioCorreosGenericoService";

registrarGeneradoresModulo("pedidos", {
  "nuevo-documento": {
    funcion: "generarNuevoDoc",
    servicio: "pedidosService",
    obligatorio: false,
  },
});
```

## ✨ Características Incluidas

- ✅ Generación automática de PDFs
- ✅ Adjunte múltiple de documentos
- ✅ Selección flexible de destinatarios (lista o manual)
- ✅ Plantillas de correo reutilizables
- ✅ Historial centralizado en BD
- ✅ Auditoría completa (usuario, fecha, estado)
- ✅ Responsive en mobile y desktop
- ✅ Diseño visual atractivo
- ✅ Sin romper funcionalidad existente

## 🚀 Próximos Pasos

1. **Ejecutar Script SQL** para crear tablas de historial
2. **Integrar en Pedidos** usando el ejemplo arriba
3. **Integrar en Consolidación** usando el patrón similar
4. **Crear reportes** usando las vistas de BD

## 📞 Soporte

Cualquier pregunta o problema:

- Revisa la consola del navegador (F12)
- Los logs muestran exactamente qué pasó en cada paso
- Archivo de base de datos: historial completo de envíos

---

**Última actualización:** 16 de abril de 2026
**Estado:** ✅ Producción - Facturación funcionando
**Próximos:** Pedidos y Consolidación
