---
applyTo: "src/**/*.jsx"
---

# Reglas obligatorias para componentes React (.jsx)

Estas reglas se aplican **siempre** al editar o crear cualquier archivo `.jsx` del proyecto.
Son no negociables. La fuente de verdad completa está en `AGENTS.md` secciones 5, 18.2 y 18.3.

---

## 1. Responsividad — Mobile First (OBLIGATORIO)

Todo componente debe verse igual de funcional en móvil (375px) que en desktop.

```jsx
// ✅ SIEMPRE usar breakpoints Tailwind — primero mobile, luego escalando
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Texto adaptable
<h1 className="text-lg md:text-2xl font-bold">

// ✅ Botones táctiles — mínimo 44px de alto en móvil
<button className="py-3 px-4 md:py-2 md:px-3">

// ✅ Tablas: siempre con scroll horizontal en móvil
<div className="overflow-x-auto">
  <table className="min-w-full">

// ✅ Formularios: inputs side-by-side en móvil cuando sean pares
<div className="grid grid-cols-2 md:flex md:flex-row gap-3">

// ❌ NUNCA anchos fijos que rompan el layout en móvil
<div style={{ width: '800px' }}>  // PROHIBIDO
```

**Checklist antes de cada commit con archivos `.jsx`:**

- [ ] Probado mentalmente en 375px (móvil)
- [ ] Sin scroll horizontal no deseado
- [ ] Texto legible sin zoom
- [ ] Botones/inputs táctiles con altura adecuada

---

## 2. Uniformidad Visual (OBLIGATORIO)

No inventar estilos nuevos. Reusar la paleta y estructura establecida.

**Paleta Tailwind del proyecto:**

- Primario: `blue-600` / `blue-700`
- Éxito: `green-600` / `green-500`
- Peligro: `red-600` / `red-500`
- Advertencia: `yellow-500` / `yellow-600`
- Fondo cards: `white` + `shadow-sm` o `shadow-md`

**Estructura estándar de página:**

```jsx
<div className="p-4 md:p-6">
  {/* Encabezado */}
  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Título</h1>
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
      Acción Principal
    </button>
  </div>
  {/* Filtros/Búsqueda */}
  <div className="bg-white rounded-lg shadow-sm p-4 mb-4">{/* ... */}</div>
  {/* Contenido */}
  <div className="bg-white rounded-lg shadow-sm">
    {/* tabla, lista, cards */}
  </div>
</div>
```

---

## 3. Notificaciones — Solo SweetAlert2 (OBLIGATORIO)

```javascript
// ✅ CORRECTO
Swal.fire({ icon: "success", title: "Guardado", text: "Registro guardado." });

// ❌ PROHIBIDO
alert("Guardado");
```

---

## 4. Estado de carga — Siempre feedback visual

```jsx
// ✅ Spinner uniforme del proyecto
{
  loading && (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

---

## 5. Manejo de estado async

```javascript
const [datos, setDatos] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Siempre los tres estados: loading, data, error
```
