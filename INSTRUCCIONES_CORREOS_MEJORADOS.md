# 📧 Implementación de Gestión Mejorada de Correos

## Instrucciones de Instalación y Testing

**Fecha**: 14 de abril de 2026  
**Estado**: ✅ Completado  
**Compatibilidad**: 100% con funcionalidad existente

---

## 🚀 PASO 1: Instalar Tablas en la Base de Datos

### Opción A: Manual (Recomendado para mayor control)

1. Accede a **PHPMyAdmin** en el servidor producción
2. Navega a la base de datos `DiBufala` (o la que uses)
3. Abre la pestaña **SQL**
4. Copia el contenido de: `crear_tabla_correos_cuentas.sql`
5. Pega y ejecuta (aparecerán mensajes de confirmación)

**Archi​vo**: `c:\xampp\htdocs\Proyectos_React\bufala-bella\crear_tabla_correos_cuentas.sql`

### Opción B: Script PHP automático

No ejecutar localmente. Solo disponible si tienes acceso directo al servidor.

---

## 📦 PASO 2: Verificar que los archivos estén en su lugar

### API PHP

```
✅ src/Api/Correos/ApiCorreosCuentasConfiguracion.php
   → Gestiona CRUD de cuentas SMTP
```

### Componentes React

```
✅ src/components/facturacion/DestinatariosSelector.jsx
   → Selector profesional de destinatarios

✅ src/components/facturacion/ConfiguracionCorreos.jsx
   → Gestor de cuentas de correo SMTP

✅ src/components/facturacion/EnviarCorreoFacturaModal.jsx
   → Actualizado para usar el nuevo DestinatariosSelector
```

### Servicios JavaScript

```
✅ src/services/correoService.js
   → Agregadas 10 funciones nuevas
   → Todas las funciones antiguas mantienen compatibilidad
```

---

## 🧪 PASO 3: Testing - Verificar Integración

### 3.1 Probar API de Cuentas (PHP)

Usa un cliente como **Postman** o **Thunder Client** para llamar al API:

#### Crear cuenta de prueba

```json
POST: https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos/ApiCorreosCuentasConfiguracion.php

Body (JSON):
{
  "accion": "crear",
  "nombre": "Prueba - Gmail",
  "email_remitente": "tu-email@gmail.com",
  "servidor_smtp": "smtp.gmail.com",
  "puerto": 587,
  "usuario_smtp": "tu-email@gmail.com",
  "contrasena_smtp": "tu-contraseña-app",
  "usar_tls": true,
  "usar_ssl": false,
  "predeterminada": true
}
```

#### Listar cuentas

```json
POST: https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos/ApiCorreosCuentasConfiguracion.php

Body (JSON):
{
  "accion": "listar"
}
```

#### Probar conexión SMTP

```json
POST: https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos/ApiCorreosCuentasConfiguracion.php

Body (JSON):
{
  "accion": "probar_conexion",
  "id": 1,
  "email_prueba": "tu-email-prueba@ejemplo.com"
}
```

### 3.2 Probar Componentes React

En la aplicación React (local o producción):

#### A. Probar DestinatariosSelector

```javascript
// En consola del navegador
// Navega a cualquier página
// Abre DevTools (F12) → Console

// Los componentes se importan automáticamente cuando:
// - Se abre el modal de "Enviar" en facturas existentes
// - Se accede a ConfiguracionCorreos
```

#### B. Acceder a ConfiguracionCorreos

```
1. Agregar nueva ruta en App.jsx o menú principal:
   <route path="/config/correos" element={<ConfiguracionCorreos />} />

2. Navegar a esa ruta
3. Probar:
   ✅ Crear nueva cuenta
   ✅ Editar cuenta
   ✅ Eliminar (desactivar) cuenta
   ✅ Establecer como predeterminada
   ✅ Probar conexión SMTP
```

#### C. Probar EnviarCorreoFacturaModal

```
1. Ir a Módulo Facturación → Consultar Existente
2. Seleccionar una factura
3. Hacer clic en "Enviar"
4. Observar:
   ✅ Nuevo selector de destinatarios aparece
   ✅ Búsqueda funciona en tiempo real
   ✅ Botón "+ Agregar nuevo" presente
   ✅ Editar/eliminar disponibles
   ✅ Seleccionar múltiples destinatarios
   ✅ Resto de funcionalidad (documentos, asunto, cuerpo) intacta
```

---

## 🔒 SEGURIDAD

### Contraseñas SMTP

- ✅ Encriptadas con **openssl_encrypt(AES-128-CTR)**
- ✅ Nunca se retornan en respuestas HTTP
- ✅ Solo desencriptadas en servidor para envío

### Clave de Encriptación

**IMPORTANTE**: En producción, cambiar la clave secreta:

```php
// En ApiCorreosCuentasConfiguracion.php
// Línea ~710: 'bufala_bella_secret_key'

// Cambiar a una variable de entorno:
$encryption_key = hash('sha256', getenv('CORREOS_SECRET_KEY'), true);
```

---

## 📝 Cambios Realizados (Compatibilidad 100%)

### ✅ Asuntos que NO cambian

- Envío de correos existente (mantiene misma lógica)
- tabla `correos_destinatarios` (intacta, sin cambios)
- API existentes (todos sin cambios)
- Estados antiguos en EnviarCorreoFacturaModal (conservados)

### 🆕 Nuevo

| Componente                           | Uso                  | Estado        |
| ------------------------------------ | -------------------- | ------------- |
| `DestinatariosSelector.jsx`          | Modal envío facturas | Reutilizable  |
| `ConfiguracionCorreos.jsx`           | Panel admin          | Independiente |
| `ApiCorreosCuentasConfiguracion.php` | Gestión cuentas SMTP | Full CRUD     |
| 10 funciones en `correoService.js`   | Llamadas HTTP        | Listos        |
| Tablas de BD                         | Almacenamiento       | SQL listo     |

---

## 🎯 Próximos Pasos Recomendados

### 1️⃣ Integrar ConfiguracionCorreos en Panel de Admin

```jsx
// En componente principal o App.jsx
import ConfiguracionCorreos from "./components/facturacion/ConfiguracionCorreos";

// Agregar ruta:
<Route path="/configuracion/correos" element={<ConfiguracionCorreos />} />;
```

### 2️⃣ Agregar selector de cuenta en modal de envío (Opcional)

```jsx
// Para permitir elegir qué cuenta usar en cada envío
<SelectorCuentaCorreo
  selectedAccount={selectedAccount}
  onSelect={setSelectedAccount}
/>
```

### 3️⃣ Documentación para usuarios finales

- Cómo agregar cuentas de correo
- Cómo agregar destinatarios
- Cómo seleccionar destinatarios en envíos

---

## ⚠️ Notas Importantes

### No olvides ejecutar SQL en PRODUCCIÓN

- El archivo `crear_tabla_correos_cuentas.sql` DEBE ejecutarse en el servidor de producción
- NO se ejecutó automáticamente por seguridad

### URLs del API

Todas las llamadas van a:

```
https://portal.datenbankensoluciones.com.co/DatenBankenApp/DiBufala/Api/Correos/
```

### Responsividad

Todos los componentes son **100% responsivos**:

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

---

## 📞 Soporte

Si encuentras algún problema:

1. **Revisa la consola del navegador** (F12 → Console)
   - Busca errores en rojo
   - Copia el error completo

2. **Revisa logs del servidor PHP**
   - La mayoría de errores se loguean en `php_error.log`

3. **Prueba con Postman**
   - Verifica que el API responde correctamente
   - No asumas que es problema del frontend

---

## ✨ Características Incluidas

### DestinatariosSelector

- 🔍 Búsqueda en tiempo real
- ✅ Checkboxes para selección múltiple
- ➕ Agregar nuevo destinatario inline
- ✏️ Editar destinatario existente
- 🗑️ Eliminar destinatario
- 🏷️ Chips/tags para ver seleccionados
- 📱 100% responsivo
- ♿ Accesible (labels, ARIA, etc)

### ConfiguracionCorreos

- 📋 Listar cuentas con estado
- ➕ Crear nueva cuenta con validaciones
- ✏️ Editar cuenta (excepto email de remitente)
- 🗑️ Desactivar cuenta
- ⭐ Establecer como predeterminada
- 🔗 Probar conexión SMTP
- 🔐 Encriptación de contraseñas
- 📱 100% responsivo

---

**Implementación completada con éxito** ✅
Fecha: 14/04/2026 | Versión: 1.0
