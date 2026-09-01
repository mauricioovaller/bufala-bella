# Guía: Transacciones y Validación de Datos en BD

**Última actualización:** 19 de mayo de 2026  
**Versión:** 1.0  
**Categoría:** Arquitectura - Base de Datos

---

## 📋 Tabla de Contenidos

1. [El Problema: IDs Faltantes](#el-problema-ids-faltantes)
2. [La Raíz del Problema](#la-raíz-del-problema)
3. [Solución: Validación Previa](#solución-validación-previa)
4. [Patrones por Operación](#patrones-por-operación)
5. [Checklist para Desarrollo](#checklist-para-desarrollo)
6. [Troubleshooting](#troubleshooting)

---

## El Problema: IDs Faltantes

### Síntoma Reportado

El usuario reporta que en la tabla `EncabPedido` faltan IDs consecutivos:

- ID 13642 → Existe ✅
- ID 13643 → **FALTA** ❌
- ID 13644 → **FALTA** ❌
- ID 13645 → **FALTA** ❌
- ID 13646 → Existe ✅

Y esto **sucede reiteradamente**, no es un evento aislado.

### Impacto

- 📊 Auditores ven huecos "sospechosos"
- 📧 Usuarios preguntan por qué no están secuenciales
- 🔍 Difícil de diagnosticar sin logs
- 💾 La BD sigue siendo consistente (solo hay huecos)

---

## La Raíz del Problema

### ¿Por qué ocurre?

En MySQL, el autoincremento funciona así:

```
1. Ejecutas INSERT
2. MySQL asigna ID = 13643 (siguiente disponible)
3. Se inserta la fila
4. Retorna INSERT_ID = 13643 ← **YA SE CONSUMIÓ**
5. Si luego fallas y haces ROLLBACK...
   → La fila se revierte
   → PERO el ID no se devuelve al pool
   → Es como si el ID nunca hubiera existido
```

### Causa en el Código Actual

En `ApiGuardarPedido.php` (versión anterior):

```php
try {
    $enlace->begin_transaction();

    // 1️⃣ Insertar encabezado
    $sqlEnc = "INSERT INTO EncabPedido (...) VALUES (...)";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->execute();  // ← ID 13643 SE CONSUME AQUÍ
    $idEncab = $enlace->insert_id;  // ← idEncab = 13643

    // 2️⃣ Insertar detalles (validando aquí)
    foreach ($detalle as $item) {
        // Validar datos
        if (!$item['cantidad']) {
            throw new Exception("Cantidad es obligatoria");  // ← FALLA AQUÍ
        }
        // INSERT detalle
    }

    $enlace->commit();
} catch (Exception $e) {
    $enlace->rollback();  // ← Revierte TODO, incluyendo el INSERT de encabezado
    // PERO MySQL no devuelve el ID 13643 al pool
    // El siguiente INSERT usará 13646
}
```

### Resultado

```
Intentó: EncabPedido ID 13643 + Detalles
Falló: Detalle inválido
Rollback: Se revirtió EncabPedido, pero ID 13643 no se devuelve
Siguiente INSERT: USA ID 13646 (MySQL salteó 13643, 13644, 13645)
```

---

## Solución: Validación Previa

### Concepto Clave

**Validar TODO antes de `begin_transaction()`**

Si algún dato es inválido, rechaza la operación ANTES de tocar la BD.

### Estructura Correcta

```
┌─────────────────────────────────────────┐
│ 1. VALIDAR encabezado                   │
│    - ¿Cliente existe?                   │
│    - ¿Transportadora válida?            │
│    - ¿Bodega activa?                    │
└─────────────────────────────────────────┘
                   ↓
         ¿Todo válido?
           /         \
        No            Sí
        │              │
    [SALIR]    ┌──────────────────────┐
      error    │ 2. VALIDAR detalles  │
              │    Para cada item:    │
              │    - ¿Producto OK?    │
              │    - ¿Cantidad > 0?   │
              │    - ¿Precio > 0?     │
              └──────────────────────┘
                       ↓
               ¿Todos válidos?
                /           \
              No             Sí
              │               │
          [SALIR]    ┌─────────────────────────┐
          error      │ 3. begin_transaction()  │
                     │    - INSERT encabezado  │
                     │    - INSERT detalles    │
                     │    - COMMIT             │
                     └─────────────────────────┘
```

### Implementación en Código

```php
<?php
header("Content-Type: application/json");

include $_SERVER['DOCUMENT_ROOT'] . "/DatenBankenApp/DiBufala/conexionBaseDatos/conexionbd.php";

// Leer datos
$json = file_get_contents("php://input");
$data = json_decode($json, true);

// Extraer
$encabezado = $data["encabezado"] ?? [];
$detalle = $data["detalle"] ?? [];

// Validadores auxiliares
function validar_entero($v) { return filter_var($v, FILTER_VALIDATE_INT) !== false ? intval($v) : null; }
function validar_flotante($v) { return filter_var($v, FILTER_VALIDATE_FLOAT) !== false ? floatval($v) : null; }
function limpiar($txt) { return trim((string)$txt); }

// Extraer encabezado
$idCliente = validar_entero($encabezado["clienteId"] ?? null);
$idTransportadora = validar_entero($encabezado["transportadoraId"] ?? null);
$idBodega = validar_entero($encabezado["bodegaId"] ?? null);
// ... más campos

// ✅ PASO 1: Validar encabezado ANTES de cualquier transacción
if (!$idCliente || !$idTransportadora || !$idBodega) {
    echo json_encode([
        "success" => false,
        "message" => "Datos obligatorios faltantes: cliente, transportadora y bodega"
    ]);
    exit;  // ← AQUÍ NO SE CONSUMIÓ NINGÚN ID
}

// ✅ PASO 2: Validar TODOS los detalles ANTES de la transacción
foreach ($detalle as $index => $item) {
    $idProducto = validar_entero($item["producto"] ?? null);
    $cantidad = validar_flotante($item["cantidad"] ?? null);
    $precio = validar_flotante($item["precio"] ?? null);

    // Si alguno es inválido, rechaza TODO
    if (!$idProducto) {
        echo json_encode([
            "success" => false,
            "message" => "Detalle #{$index}: producto es obligatorio"
        ]);
        exit;  // ← AQUÍ NO SE CONSUMIÓ NINGÚN ID
    }
    if (!$cantidad || $cantidad <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Detalle #{$index}: cantidad debe ser mayor a 0"
        ]);
        exit;
    }
    if (!$precio || $precio <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Detalle #{$index}: precio debe ser mayor a 0"
        ]);
        exit;
    }
}

// ✅ PASO 3: SOLO si TODO está validado, iniciar transacción
try {
    $enlace->begin_transaction();

    // INSERT encabezado (sabemos que es válido)
    $sqlEnc = "INSERT INTO EncabPedido (...) VALUES (...)";
    $stmtEnc = $enlace->prepare($sqlEnc);
    $stmtEnc->bind_param("iis...", $idCliente, $idTransportadora, ...);
    $stmtEnc->execute();

    if ($stmtEnc->affected_rows <= 0) {
        throw new Exception("No se insertó el encabezado");
    }

    $idEncab = $enlace->insert_id;

    // INSERT detalles (sin validaciones, ya pasaron)
    $sqlDet = "INSERT INTO DetPedido (...) VALUES (...)";
    $stmtDet = $enlace->prepare($sqlDet);

    foreach ($detalle as $item) {
        // Extraer de nuevo (ya validados)
        $idProducto = validar_entero($item["producto"] ?? null);
        $cantidad = validar_flotante($item["cantidad"] ?? null);
        $precio = validar_flotante($item["precio"] ?? null);

        // INSERT sin validación (confiamos en el paso anterior)
        $stmtDet->bind_param("iidd", $idEncab, $idProducto, $cantidad, $precio);
        $stmtDet->execute();

        if ($stmtDet->affected_rows <= 0) {
            throw new Exception("No se insertó un detalle");
        }
    }

    $enlace->commit();

    echo json_encode([
        "success" => true,
        "idPedido" => $idEncab
    ]);

} catch (Exception $e) {
    $enlace->rollback();
    error_log("Error en ApiGuardarPedido.php: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$enlace->close();
?>
```

---

## Patrones por Operación

### Pattern 1: INSERT (Crear Pedido Nuevo)

```php
// Validar TODOS los datos
foreach ($detalles as $idx => $det) {
    if (!$det['producto'] || !$det['cantidad']) {
        exit(json_encode(['success' => false, 'message' => "Detalle $idx incompleto"]));
    }
}

// SOLO ENTONCES:
try {
    $enlace->begin_transaction();
    // INSERT encabezado
    // INSERT detalles
    $enlace->commit();
} catch (Exception $e) {
    $enlace->rollback();
}
```

### Pattern 2: UPDATE (Editar Pedido)

```php
// Validar cambios antes de transacción
foreach ($detalles as $idx => $det) {
    if ($det['accion'] === 'update' && !$det['producto']) {
        exit(json_encode(['success' => false, 'message' => "Detalle $idx: sin producto"]));
    }
    if ($det['accion'] === 'insert' && !$det['cantidad']) {
        exit(json_encode(['success' => false, 'message' => "Detalle $idx: sin cantidad"]));
    }
}

// SOLO ENTONCES:
try {
    $enlace->begin_transaction();
    // UPDATE encabezado
    // UPDATE detalles existentes
    // INSERT detalles nuevos
    // DELETE detalles removidos
    $enlace->commit();
} catch (Exception $e) {
    $enlace->rollback();
}
```

### Pattern 3: DELETE (Eliminar Pedido)

```php
// Validar antes
if (!$idPedido) {
    exit(json_encode(['success' => false, 'message' => 'ID pedido requerido']));
}

// Verificar que el pedido existe y no está bloqueado
$stmt = $enlace->prepare("SELECT Estado FROM EncabPedido WHERE Id_EncabPedido = ?");
$stmt->bind_param("i", $idPedido);
$stmt->execute();
$stmt->bind_result($estado);
if (!$stmt->fetch() || $estado !== 'Activo') {
    exit(json_encode(['success' => false, 'message' => 'Pedido no puede ser eliminado']));
}
$stmt->close();

// SOLO ENTONCES:
try {
    $enlace->begin_transaction();
    // DELETE detalles
    // DELETE encabezado
    $enlace->commit();
} catch (Exception $e) {
    $enlace->rollback();
}
```

---

## Checklist para Desarrollo

Cada vez que crees o edites un archivo PHP con INSERT/UPDATE/DELETE:

- [ ] **Validar encabezado ANTES de begin_transaction()**
  - Cliente/usuario existe
  - Datos obligatorios presentes
  - Valores en rango válido

- [ ] **Validar TODOS los detalles ANTES de begin_transaction()**
  - Producto existe
  - Cantidad > 0
  - Precio > 0
  - Campos obligatorios presentes

- [ ] **Si hay error en validación → exit() ANTES de tocar BD**
  - Retornar JSON con error específico
  - NO iniciar transacción

- [ ] **SOLO iniciar transacción si TODO es válido**
  - begin_transaction()
  - INSERT/UPDATE/DELETE (sin validaciones internas)
  - commit()

- [ ] **Manejar excepciones**
  - catch → rollback()
  - error_log() para debugging
  - Retornar error al cliente

- [ ] **Cerrar conexión**
  - $enlace->close()

---

## Troubleshooting

### Q: "¿Por qué siguen faltando IDs?"

A: Probablemente hay un archivo PHP que aún tiene la validación DENTRO de la transacción. Revisa:

- `src/Api/Pedidos/*` - ApiGuardarPedido.php, ApiActualizar...
- `src/Api/PedidosSample/*` - ApiGuardarSample.php
- `src/Api/PedidosChile/*` - ApiGuardarPedidoChile.php
- Cualquier otro archivo con INSERT masivo

### Q: "¿Pero la transacción es más lenta sin validación dentro?"

A: No. La validación AFUERA es más rápida:

- Evita iniciar transacción si hay error
- BD no bloquea recursos innecesarios
- Red traffic es local (PHP ↔ BD)

### Q: "¿Qué pasa si mientras valido, alguien borra el producto?"

A: Eso es una race condition normal. Soluciones:

1. Validar de nuevo dentro de la transacción (doble check)
2. Usar locks: SELECT ... FOR UPDATE
3. Aceptar que es raro y documentarlo

```php
// Validar fuera
if (!$producto) exit(json_encode(['success' => false]));

// Dentro de transacción, doble check
try {
    $enlace->begin_transaction();

    // Verificar de nuevo que producto existe
    $stmt = $enlace->prepare("SELECT id FROM Productos WHERE id = ? FOR UPDATE");
    $stmt->bind_param("i", $idProducto);
    $stmt->execute();
    if (!$stmt->fetch()) {
        throw new Exception("Producto fue eliminado");
    }

    // Continuar con INSERT
} catch (Exception $e) {
    $enlace->rollback();
}
```

### Q: "¿Dónde debería ir el error_log?"

A: En el catch de la transacción:

```php
} catch (Exception $e) {
    $enlace->rollback();
    error_log("ApiGuardarPedido.php - Error: " . $e->getMessage() . " - User: " . $_SESSION['user_id'] ?? 'unknown');
    echo json_encode(['success' => false, 'message' => 'Error procesando pedido']);
}
```

---

## Referencias

- **Regla en:** `.github/instructions/php-backend.instructions.md` (Sección 6)
- **Implementado en:**
  - `src/Api/Pedidos/ApiGuardarPedido.php`
  - `src/Api/PedidosSample/ApiGuardarSample.php`
  - `src/Api/PedidosChile/ApiGuardarPedidoChile.php`
  - `src/Api/PedidosSample/ApiActualizarSample.php`
- **Fuente de verdad:** `AGENTS.md` sección 18.2

---

**Última revisión:** 19 de mayo de 2026  
**Responsable:** Equipo de Desarrollo
