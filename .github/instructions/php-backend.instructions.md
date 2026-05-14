---
applyTo: "src/Api/**/*.php"
---

# Reglas obligatorias para archivos PHP del proyecto

Estas reglas se aplican **siempre** al editar o crear cualquier archivo `.php` en `src/Api/`.
La fuente de verdad completa está en `AGENTS.md` sección 18.1.

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

## 2. Siempre Prepared Statements (Seguridad)

```php
// ✅ CORRECTO — previene SQL Injection
$stmt = $conn->prepare("SELECT * FROM Clientes WHERE Email = ?");
$stmt->bind_param("s", $email);

// ❌ NUNCA concatenar variables en queries
$sql = "SELECT * FROM Clientes WHERE Email = '$email'"; // PROHIBIDO
```

---

## 3. Cast correcto para decimales

```php
// ✅ Preserva decimales
round((float)$cajas, 4)

// ❌ Trunca a entero
(int)$cajas  // PROHIBIDO para valores numéricos con decimales
```

---

## 4. Estructura de respuesta JSON estándar

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

## 5. Validación de entrada

```php
// ✅ Validar SIEMPRE en el backend, aunque el frontend también valide
$email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}
```
