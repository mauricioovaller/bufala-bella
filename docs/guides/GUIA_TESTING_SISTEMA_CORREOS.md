# 🧪 GUÍA PRÁCTICA: CÓMO REVISAR SI TODO FUNCIONA

## 📋 CHECKLIST RÁPIDO

```
1. ¿Ejecutaste el script SQL? ___
2. ¿La app compila sin errores? ___
3. ¿Probaste el envío en Facturación? ___
4. ¿Ves el historial en BD? ___
```

---

## 🔧 PASO 1: VERIFICAR BASE DE DATOS

### A. Ejecutar Script SQL (SI NO LO HICISTE)

```bash
# En phpMyAdmin:
1. Abre: http://localhost/phpmyadmin
2. Ve a tu base de datos (ej: DiBufala)
3. Haz clic en "Importar"
4. Selecciona archivo: crear_tabla_historial_correos.sql
5. Clic en "Continuar"
6. Espera mensaje de éxito ✅
```

### B. Verificar Que las Tablas se Crearon

```sql
-- En phpMyAdmin, pestaña SQL, corre esto:

-- Ver si la tabla existe
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'tu_base_datos'
AND TABLE_NAME = 'correos_enviados';

-- Ver estructura
DESCRIBE correos_enviados;

-- Ver datos (debe estar vacía)
SELECT * FROM correos_enviados LIMIT 5;
```

✅ **Si ves la tabla vacía, está bien. Si no existe, el script falló.**

---

## 🌐 PASO 2: VERIFICAR QUE LA APP COMPILA

```bash
# En terminal:
cd c:\xampp\htdocs\Proyectos_React\bufala-bella
npm run build
```

**Deberías ver:**

```
✓ 2376 módulos transformados.
dist/assets/index-XXXXXX.css ...
dist/assets/index-XXXXXX.js ...
✓ built in XX.XXs
```

❌ **Si hay error, revisa el mensaje de error y avísame**

---

## 📱 PASO 3: PROBAR EN FACTURACIÓN (LO MÁS IMPORTANTE)

### A. Abre la Aplicación

```
1. Abre navegador
2. Ve a: http://localhost:5173 (o donde esté tu app)
3. Navega a: Facturación > Consultar Existente
```

### B. Busca una Factura Existente

```
1. Selecciona rango de fechas
2. Haz clic en "Buscar"
3. Deberías ver lista de facturas
4. Selecciona una factura > Clic en "📧 Enviar"
```

✅ **Si se abre el modal de correo, está funcionando**

---

## 🧪 PASO 4: HACER PRUEBA COMPLETA DE ENVÍO

### En el Modal:

```
1. Destinatarios:
   └─ Escribe tu email de prueba (ej: tumail@gmail.com)

2. Asunto:
   └─ Ya debe estar completado automáticamente

3. Mensaje:
   └─ Ya debe estar completado automáticamente

4. Documentos:
   └─ Marca al menos "Factura PDF" (obligatorio)
   └─ Click en botón "Generar"
   └─ Espera a que diga "✅ Generado"

5. Clic en "✅ Enviar Correo"
   └─ Aparece confirmación
   └─ Clic en "Sí, enviar"

6. Espera mensaje:
   └─ Debe decir "✅ Correo enviado"
   └─ Muestra número de destinatarios
   └─ Muestra número de adjuntos
   └─ Muestra ID de historial (ej: #12345)
```

✅ **Si ves todo esto, ¡el envío funcionó!**

---

## 🔍 PASO 5: REVISAR CONSOLA DEL NAVEGADOR

### Abre F12 (Herramientas de Desarrollador)

**Pestaña: Console**

Deberías ver logs como estos:

```
📧 Iniciando envío genérico: { modulo: 'facturacion', referencia: 'FEX-001234' }
📄 Generando documentos: ['factura']
📄 Generando: factura del módulo facturacion
✅ factura generado: 256 KB
📦 Total adjuntos: 1
📧 Iniciando envío...
✅ Correo enviado y registrado: { historialId: 123, destinatarios: 1 }
```

**Si ves estos logs:**

- ✅ La lógica funciona
- ✅ Los documentos se generan
- ✅ Se conecta a la API

**Si ves ERRORES en rojo:**

- ❌ Algo falló
- Lee el mensaje de error
- Avísame el error exacto

---

## 💾 PASO 6: REVISAR HISTORIAL EN BASE DE DATOS

### Ver si se guardó el correo:

```sql
-- En phpMyAdmin > SQL

-- Ver últimos correos (debe estar tu envío)
SELECT id, modulo, referencia_numero, asunto, estado, fecha_envio
FROM correos_enviados
ORDER BY id DESC
LIMIT 5;
```

**Deberías ver algo así:**

```
id | modulo      | referencia_numero | asunto          | estado  | fecha_envio
1  | facturacion | FEX-001234        | Factura FEX-... | enviado | 2026-04-16 14:30:45
```

✅ **Si aparece tu correo, se guardó correctamente en BD**

---

## 🎯 DIAGNÓSTICO RÁPIDO

### Pregunta: ¿Qué viste en cada paso?

| Paso                 | Resultado | Status  |
| -------------------- | --------- | ------- |
| ¿Se abrió el modal?  | Sí / No   | ✅ / ❌ |
| ¿Generó documentos?  | Sí / No   | ✅ / ❌ |
| ¿Dijo "Enviado"?     | Sí / No   | ✅ / ❌ |
| ¿Tiene ID historial? | Sí / No   | ✅ / ❌ |
| ¿Aparece en BD?      | Sí / No   | ✅ / ❌ |

**Si todos están ✅ = TODO FUNCIONA**

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ "No se abrió el modal"

**Posibles causas:**

1. No compiló bien

   ```bash
   npm run build
   ```

2. No refrescaste la página

   ```
   F5 para refrescar el navegador
   ```

3. Props incorrectos
   ```
   Abre F12 > Console
   Mira si hay error de props
   ```

---

### ❌ "El botón Generar no funciona"

**Posibles causas:**

1. La factura no está completamente cargada

   ```
   Espera unos segundos y vuelve a intentar
   ```

2. Error en generador

   ```
   F12 > Console > Busca error rojo
   Cópialo y comparte conmigo
   ```

3. API no responde
   ```
   Verifica que ApiEnviarCorreoSimple.php existe en servidor
   ```

---

### ❌ "Dice 'Enviado' pero no recibí email"

**Posibles causas:**

1. Email fue a spam

   ```
   Revisa carpeta de SPAM
   ```

2. API de correos está caída

   ```
   Verifica en: portal.datenbankensoluciones.com.co
   ```

3. Cuenta de correo mal configurada
   ```
   Va a Correos > Configuración de Cuentas
   Verifica cuenta predeterminada
   ```

---

### ❌ "Se dice enviado pero NO aparece en BD"

**Posibles causas:**

1. Tabla no existe (no ejecutaste SQL)

   ```
   Ejecuta: crear_tabla_historial_correos.sql
   ```

2. API de historial no existe

   ```
   Verifica que ApiHistorialCorreos.php existe en servidor
   ```

3. Error de permisos BD
   ```
   Verifica permisos del usuario de BD en tabla correos_enviados
   ```

---

### ❌ "Error de validación de email"

**Debes usar emails válidos:**

```
✅ Correcto:  tu@gmail.com, admin@empresa.com
❌ Incorrecto: tumail (sin @), tu@.com, @gmail.com
```

**Solución:**

```
Asegúrate de escribir email válido en destinatarios
```

---

### ❌ "Error: 'generarFacturaPDF is not defined'"

**Causa:** El import no está correcto en EnviarCorreoFacturaModal

**Solución:**

```javascript
// Verifica que en EnviarCorreoFacturaModal.jsx tengas:
import { generarFacturaPDF } from "../../services/facturacionService";
```

---

## 📊 VER ESTADÍSTICAS

```sql
-- En phpMyAdmin > SQL

-- Ver cuántos correos se enviaron
SELECT estado, COUNT(*) as total
FROM correos_enviados
GROUP BY estado;

-- Resultado esperado:
-- estado | total
-- enviado | 1 (o más si hiciste varios envíos)
-- fallido | 0

-- Ver detalles de un correo
SELECT * FROM correos_enviados WHERE id = 1\G
```

---

## 🔗 REVISAR RESPUESTA DE API

**En Console (F12):**

```javascript
// Si ves logs que digan:
📨 Resultado del envío: { success: true, message: 'Correo enviado' }

// Significa que la API respondió bien ✅

// Si ves:
❌ Error: API returned false

// Significa que la API respondió con error ❌
```

---

## 📸 CAPTURAS QUE BUSCAR

### ✅ CORRECTO - Modal abierto:

```
┌─────────────────────────┐
│ 📧 Enviar Correo        │
│                         │
│ 👥 Destinatarios [____] │
│ 📝 Asunto [_________]   │
│ ✍️ Mensaje [_________]  │
│ 📎 Documentos           │
│   ☑ Factura PDF ✅      │
│   ☑ Carta Policía       │
│                         │
│ [Cancelar] [Enviar]     │
└─────────────────────────┘
```

### ✅ CORRECTO - Generado:

```
Factura PDF
✅ Generado (256 KB)
```

### ✅ CORRECTO - Confirmación:

```
✅ ¡Correo enviado!

📧 Destinatarios: 1
📎 Adjuntos: 1
🆔 ID: #123456
```

---

## 🧠 LÓGICA DE PRUEBA RECOMENDADA

**Prueba 1: Envío Simple**

```
1. Selecciona factura
2. Abre modal
3. Deja destinatarios y contenido por defecto
4. Solo marca Factura PDF
5. Haz clic Generar
6. Haz clic Enviar
→ Debe funcionar
```

**Prueba 2: Múltiples Documentos**

```
1. Marca: Factura, Carta Policía, Plan Vallejo
2. Genera todos
3. Envía
→ Debe adjuntar 3 documentos
```

**Prueba 3: Múltiples Destinatarios**

```
1. Agrega 2-3 emails separados por comas
2. Genera documento
3. Envía
→ Debe mostrar "Destinatarios: 3"
```

---

## ✅ CHECKLIST FINAL

Después de las pruebas, completa esto:

- [ ] ¿Abrió el modal correctamente?
- [ ] ¿Generó documentos sin errores?
- [ ] ¿Mostró "Correo enviado"?
- [ ] ¿Muestra ID de historial?
- [ ] ¿Aparece en base de datos?
- [ ] ¿Console sin errores rojos?
- [ ] ¿Respuesta de API es success: true?

**Si todos están marcados = ✅ TODO FUNCIONA PERFECTO**

---

## 📞 SI TIENES PROBLEMAS

**Avísame:**

1. ¿En qué paso falla? (modal, generar, enviar, BD)
2. ¿Qué error exacto ves?
3. ¿Qué dice la consola (F12)?
4. ¿Ejecutaste el script SQL?

**Con esa info puedo ayudarte rápido.**

---

## 🚀 PRÓXIMOS PASOS (CUANDO TODO FUNCIONE)

1. Hacer pruebas en más facturas
2. Revisar historial acumulado en BD
3. Integrar en Pedidos
4. Integrar en Consolidación
5. Crear dashboard de historial

¡Buena suerte! 🎯
