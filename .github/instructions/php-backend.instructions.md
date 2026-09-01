---
applyTo: "src/Api/**/*.php"
---

# Reglas obligatorias para archivos PHP del proyecto

Estas reglas se aplican **siempre** al editar o crear cualquier archivo `.php` en `src/Api/`.
La fuente de verdad completa está en `AGENTS.md` sección 18.1.
Para flujos completos de creación, revisión o migración, complementar con la skill
`.github/skills/php-backend-estandarizacion/SKILL.md`.

---

## 1. PROHIBICIÓN ABSOLUTA: get_result() (CRÍTICO)

```php
// ❌ NUNCA — el servidor de producción NO tiene mysqlnd
$stmt->get_result();  // PROHIBIDO

// ✅ SIEMPRE usar bind_result() + fetch()
$stmt = $conn->prepare("SELECT id, nombre FROM Clientes WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$stmt->bind_result($id, $nombre);

// Registro único:
$stmt->fetch();

// Múltiples filas:
$resultados = [];
while ($stmt->fetch()) {
    $resultados[] = ['id' => $id, 'nombre' => $nombre];
}
$stmt->close();
```

**Motivo:** El driver `mysqlnd` no está habilitado en producción. `get_result()` causa error fatal silencioso — funciona en local pero rompe en producción sin mensaje de error claro.

---

## 2. Codificación de texto (tildes, ñ y caracteres especiales)

- En PDFs FPDF, las fuentes internas (`Helvetica`, `Times`, `Courier`) usan Latin-1. Convertir con `utf8_decode((string)$valor)` todo texto enviado a `Cell()` o `MultiCell()`.
- Después de conectar a la BD, configurar `$enlace->set_charset('utf8mb4')`.
- En APIs JSON, usar `json_encode($payload, JSON_UNESCAPED_UNICODE)`.
- No convertir textos en React: el navegador renderiza UTF-8 nativamente.

La especificación completa está en `AGENTS.md`, sección 18.0.

---

## 3. Siempre Prepared Statements (Seguridad)

```php
// ✅ CORRECTO — previene SQL Injection
$stmt = $conn->prepare("SELECT * FROM Clientes WHERE Email = ?");
$stmt->bind_param("s", $email);

// ❌ NUNCA concatenar variables en queries
$sql = "SELECT * FROM Clientes WHERE Email = '$email'"; // PROHIBIDO
```

---

## 4. Cast correcto para decimales

```php
// ✅ Preserva decimales
round((float)$cajas, 4)

// ❌ Trunca a entero
(int)$cajas  // PROHIBIDO para valores numéricos con decimales
```

---

## 5. Estructura de respuesta JSON estándar

```php
// ✅ Siempre responder con esta estructura
echo json_encode([
    'success' => true,
    'message' => 'Descripción',
    'datos'   => $resultados   // o el nombre del campo correspondiente
]);

// En caso de error:
echo json_encode([
    'success' => false,
    'message' => 'Descripción del error'
]);
```

---

## 6. Validación de entrada

```php
// ✅ Validar SIEMPRE en el backend, aunque el frontend también valide
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}
```

---

## 7. VALIDACIÓN PREVIA en INSERT/UPDATE/DELETE (CRÍTICO - No consume IDs innecesarios)

**Regla de Oro:** Validar **TODOS** los datos ANTES de `begin_transaction()`

```php
// ❌ INCORRECTO — Consume ID autoincremento incluso si falla
try {
    $enlace->begin_transaction();

    $stmt = $enlace->prepare("INSERT INTO EncabPedido (...) VALUES (...)");
    $stmt->execute();  // ← Consume ID
    $idEncab = $enlace->insert_id;

    // Validar detalles aquí (demasiado tarde)
    foreach ($detalles as $det) {
        if (!$det['cantidad'] || !$det['precio']) {
            throw new Exception("Datos inválidos");  // ← ROLLBACK, pero ID ya se consumió
        }
    }

    $enlace->commit();
} catch (Exception $e) {
    $enlace->rollback();  // Demasiado tarde, el ID ya se perdió
}
```

```php
// ✅ CORRECTO — Validar TODO antes de tocar la BD
// PASO 1: Validar encabezado
if (!$cliente || !$transportadora || !$bodega) {
    echo json_encode(['success' => false, 'message' => 'Encabezado incompleto']);
    exit;  // Sin consumir IDs
}

// PASO 2: Validar TODOS los detalles
foreach ($detalles as $index => $det) {
    if (!$det['cantidad'] || !$det['precio'] || !$det['producto']) {
        echo json_encode([
            'success' => false,
            'message' => "Detalle #{$index} incompleto"
        ]);
        exit;  // Sin consumir IDs
    }
}

// PASO 3: SOLO AHORA iniciar transacción (todo ya fue validado)
try {
    $enlace->begin_transaction();

    $stmt = $enlace->prepare("INSERT INTO EncabPedido (...) VALUES (...)");
    $stmt->execute();  // ← Seguro, sabemos que es válido

    foreach ($detalles as $det) {
        // INSERT detalles (sin validaciones, ya pasaron)
    }

    $enlace->commit();
    echo json_encode(['success' => true, 'idPedido' => $idEncab]);

} catch (Exception $e) {
    $enlace->rollback();
    error_log("INSERT Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
```

**Por qué:** MySQL consume el autoincremento cuando `INSERT` se ejecuta, aunque luego haga `ROLLBACK`. Si la validación de detalles falla dentro de la transacción, ese ID se pierde para siempre.

**Referencias:** Ver `docs/guides/GUIA_TRANSACCIONES_BD.md` para más detalles y ejemplos.
