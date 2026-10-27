# Guía del estudiante — Laboratorio MiniShop

**Duración:** ≈ 120 minutos · **Modalidad:** individual o en parejas

> **Idea central:** podemos cambiar por completo la implementación interna del software mientras su comportamiento observable permanece igual, y las pruebas nos ayudan a **verificarlo**.

Trabajarás sobre MiniShop, una tienda mínima con catálogo, carrito, cupones y checkout. Al final habrás visto con tus propios ojos que un buen conjunto de pruebas te permite **refactorizar sin miedo** y **detectar errores** en segundos.

> **¿Qué se entrega?** Esta guía te explica cada paso. Lo que se **califica** está en [LAB_ASSIGNMENT.md](LAB_ASSIGNMENT.md) (8 actividades, 100 puntos): allí respondes preguntas, escribes tu prueba y entregas el Pull Request.
>
> | Esta guía | Se responde en LAB_ASSIGNMENT |
> |---|---|
> | Actividad 1 — Exploración | Actividad 1 |
> | Actividad 2 — Pruebas unitarias | Actividades 2 y 3 |
> | Actividad 3 — Pruebas E2E | Actividad 4 |
> | Actividad 4 — Refactorización | Actividad 5 |
> | Actividad 5 — Regresión | Actividad 6 |
> | Actividad 6 — Pull Request | Actividad 7 (más la reflexión final, Actividad 8) |

## Preparación (antes de empezar)

Repositorio base: <https://github.com/Ditmar/lab4-seminario>

1. Haz un **Fork** del repositorio en tu cuenta de GitHub.
2. Clona **tu fork** e instala:

```bash
git clone https://github.com/TU-USUARIO/lab4-seminario.git
cd lab4-seminario
npm install
npm run e2e:install        # solo la primera vez: descarga Chromium
npm run test:all           # comprobación inicial: todo debe estar en verde
```

Se requiere **Node.js 20 o superior** (`node --version`).

> Debes ver typecheck sin errores, **5 avisos de lint** (todos en `shared/pricing.ts`), 15 pruebas unitarias y 12 E2E en verde. Si no es así, avisa al docente antes de continuar.

3. En tu fork, abre la pestaña **Actions** y habilita los workflows (los forks los traen desactivados). Los necesitarás en la Actividad 6.

4. Crea tu rama de trabajo (no trabajes directamente sobre `main`):

```bash
git switch -c lab/<tu-nombre>
```

---

## Actividad 1 — Exploración de la aplicación (≈ 10 min)

**Objetivo:** comprender qué hace MiniShop y cuáles son sus reglas de negocio *antes* de probarlas.

1. Ejecuta `npm run dev` y abre <http://localhost:5173>.
2. Recorre la aplicación como un usuario: agrega productos, cambia cantidades, elimina, aplica cupones y confirma un pedido.
3. Completa esta tabla **con la aplicación, no leyendo el código**:

| # | Prueba manual | Resultado que observas |
|---|---|---|
| 1 | Agrega 2 *Laptop Sleeve* y aplica `SAVE10` | Subtotal: ___ Descuento: ___ Envío: ___ Total: ___ |
| 2 | Agrega 1 *Wireless Mouse* y aplica `FREESHIP` | Envío: ___ |
| 3 | Agrega 3 *Wireless Mouse*, luego súbelos a 4 | ¿Cuándo cambia el envío? ___ |
| 4 | Aplica `SAVE10` y luego intenta aplicar `FREESHIP` | ¿Qué ocurre? ___ |
| 5 | Aplica un cupón llamado `HOLA` | ¿Cambian los importes? ___ |
| 6 | Intenta confirmar con el formulario vacío | ¿Qué mensajes aparecen? ___ |
| 7 | Con 2 *Laptop Sleeve* + 2 *Wireless Mouse* ($110.00): ¿cuánto es el envío? ¿Y con `SAVE10`? | Sin cupón: ___ · Con `SAVE10`: ___ |

4. Anota las **reglas de negocio** que deduces (compáralas con la tabla del [README](../README.md#reglas-de-negocio-resumen)).

**Preguntas**

- ¿Por qué el caso 7 es interesante? ¿Sobre qué importe se evalúa el umbral de envío gratis?
- Los importes se guardan en **centavos enteros** (`3000` y no `30.00`). ¿Qué problema evita? *(Pista: en JavaScript `0.1 + 0.2` no es `0.3`.)*
- La lógica de precios está en `shared/`, no en `src/`. ¿Por qué conviene que el frontend **y** el servidor usen el mismo código?

---

## Actividad 2 — Pruebas unitarias con Vitest (≈ 20 min)

**Objetivo:** leer, ejecutar y ampliar pruebas que verifican reglas de negocio.

### 2.1 Ejecuta las pruebas

```bash
npm run test:unit
```

Deberías ver `15 passed`. Ahora déjalas corriendo en modo *watch* en una terminal aparte (la usarás luego):

```bash
npm run test:unit:watch
```

### 2.2 Lee las pruebas

Abre `tests/unit/pricing.test.ts` y responde:

1. ¿Qué función se está probando? ¿Las pruebas saben **cómo** está escrita por dentro?
2. Encuentra la prueba del *valor límite* del envío gratis. ¿Qué dos importes compara y por qué justo esos?
3. Encuentra la prueba de **redondeo**. ¿Por qué usa un producto de 1 centavo?
4. En `tests/unit/orders.test.ts` aparece `vi.fn()`. ¿Qué es ese **mock** y qué nos permite comprobar que no podríamos sin él? *(Pista: `not.toHaveBeenCalled()`.)*
5. ¿Por qué las pruebas comparan el `code` de un error y no su mensaje de texto?

### 2.3 Rompe una expectativa a propósito (30 segundos)

Cambia en alguna prueba un `toBe(600)` por `toBe(601)` y mira el mensaje de error del modo *watch*: ¿te dice qué esperaba y qué recibió? **Revierte el cambio.**

### 2.4 Escribe tu propia prueba

Agrega dentro del `describe('envío', ...)` de `tests/unit/pricing.test.ts` una prueba nueva. Ejemplo resuelto para guiarte:

```ts
it('con 3 Mechanical Keyboard y SAVE10 el envío es gratis y el total es $162.00', () => {
  // subtotal $180.00 → descuento $18.00 → $162.00 (≥ $100.00) → envío gratis
  expect(calculatePricing([line(KEYBOARD, 3)], 'SAVE10')).toEqual({
    subtotalCents: 18000,
    discountCents: 1800,
    shippingCents: 0,
    totalCents: 16200,
  })
})
```

**Tu turno:** escribe **una** prueba propia (no copies el ejemplo) para una de estas reglas. Calcula primero el resultado esperado **a mano**, después escribe el `expect`:

- `FREESHIP` combinado con un subtotal ya mayor a $100.00.
- Un carrito con las 3 mercancías (1 de cada una) y `SAVE10`.
- Una cantidad de 99 de un mismo producto con `SAVE10`.

**Entregable:** tu prueba pasa en verde. Escribe en una línea qué regla protege.

> Una buena prueba tiene nombre descriptivo, un único motivo para fallar y verifica **resultados** (importes), no detalles internos.

---

## Actividad 3 — Pruebas E2E con Playwright (≈ 25 min)

**Objetivo:** ver un navegador real ejecutando escenarios de usuario contra el frontend **y** la API reales.

### 3.1 Ejecuta en modo visual

```bash
npm run test:e2e:headed
```

Observa el navegador. Si va demasiado rápido, repítelo en cámara lenta:

```bash
SLOW_MO=500 npm run test:e2e:headed              # bash / zsh
$env:SLOW_MO=500; npm run test:e2e:headed         # PowerShell
```

### 3.2 Explora con UI Mode

```bash
npm run test:e2e:ui
```

Haz clic en **E2E 05** y pulsa ▶. Pasa el cursor por cada paso de la izquierda: verás el **DOM tal como estaba** en ese instante, las aserciones y la red. Es una máquina del tiempo para depurar.

### 3.3 Lee una prueba

Abre `tests/e2e/cart.spec.ts` y analiza **E2E 05** línea por línea:

| Línea | Pregunta |
|---|---|
| `page.getByRole('button', { name: ... })` | ¿Por qué buscar por *rol y nombre accesible* y no por una clase CSS? ¿Qué pasaría si un diseñador cambia los estilos? |
| `await expect(totals.total).toHaveText('$59.00')` | ¿Hay algún `sleep` o `waitForTimeout`? ¿Cómo sabe Playwright **cuánto** esperar? *(Auto-waiting.)* |
| `test.beforeEach(... page.goto('/'))` y `tests/e2e/fixtures.ts` | ¿Cómo se garantiza que una prueba no ensucia a la siguiente? |

### 3.4 Ejecuta pruebas específicas

```bash
npm run test:e2e -- -g "E2E 07"                        # por nombre
npm run test:e2e:headed -- -g "E2E 10"                 # una prueba, visible
npm run test:e2e -- tests/e2e/checkout.spec.ts         # un archivo
```

### 3.5 El caso especial: E2E 10 (servidor lento)

Abre **E2E 10** en `tests/e2e/checkout.spec.ts`. Es la única prueba que usa `page.route(...)`, es decir, **intercepta la red**.

- ¿Qué se simula exactamente y por qué es necesario? *(Pista: ¿cómo harías si no, que el servidor tardara lo suficiente para hacer doble clic?)*
- La petición, una vez liberada, ¿va a una respuesta falsa o a la API real?
- ¿Qué dos cosas se verifican al final? (Peticiones realizadas **y** pedidos guardados por el servidor.)

### 3.6 Reporte HTML

```bash
npm run test:e2e:report
```

Recorre el reporte: ¿cuánto tardó cada escenario? Más adelante, cuando una prueba falle, aquí encontrarás su screenshot y su trace.

### 3.7 Clasifica

Rellena: ¿qué escenarios E2E **no** podrían probarse bien con pruebas unitarias, y por qué? ¿Y qué reglas se prueban mejor con unitarias que con E2E? *(Pista: ¿por qué ningún E2E detectaría un error de redondeo del descuento? Mira los precios del catálogo.)*

**Entregable:** captura del reporte HTML (o de UI Mode) con las 12 pruebas en verde.

---

## Actividad 4 — Refactorización segura (≈ 20 min)

**Objetivo:** mejorar la estructura de `calculatePricing()` **sin cambiar su comportamiento**, usando las pruebas como red de seguridad.

### 4.1 Punto de partida

Tienes `npm run test:unit:watch` corriendo. Anota las métricas actuales:

```bash
npm run lint
```

Deberías ver **5 avisos** (*warnings*) sobre `shared/pricing.ts`: complejidad 19, 63 líneas, anidamiento hasta 5. Esas son las métricas de la función que vas a mejorar.

### 4.2 Detecta los problemas

Abre `shared/pricing.ts`. Marca al menos **cinco** señales de mal diseño. Ejemplos de lo que debes buscar: función muy larga, `if` anidados, bucles manuales con índices, responsabilidades mezcladas (validar, sumar, descontar, calcular envío), expresiones repetidas (`normalizeCouponCode(couponCode)` tres veces), variables mutables.

### 4.3 Refactoriza **en pasos pequeños**

Regla de oro: **un paso, correr pruebas, otro paso.** Si algo se pone rojo, deshaz el último paso (`git restore shared/pricing.ts` si no has hecho commit) y vuelve a intentar.

Propuesta de orden:

1. Extrae `calculateSubtotal(items, catalog)`: validación de cada línea + suma.
2. Extrae la interpretación del cupón (`parseCoupon`): normalizar, aceptar `SAVE10`/`FREESHIP`, rechazar el resto.
3. Extrae `calculateDiscount(subtotalCents, coupon)`.
4. Extrae `calculateShipping(subtotalCents, discountCents, coupon)`.
5. Extrae `calculateTotal(subtotalCents, discountCents, shippingCents)`.
6. Deja `calculatePricing()` como un guion corto que **llama** a las anteriores.
7. Simplifica condicionales con retornos tempranos (*early return*).

### 4.4 Reglas del juego

- ✅ Puedes cambiar **todo** dentro de `shared/pricing.ts`.
- ❌ **No modifiques ninguna prueba** (`tests/`). Si una prueba se pone roja, el problema es tu refactor, no la prueba.
- ❌ No cambies las reglas ni los mensajes. Es una refactorización: el comportamiento observable es idéntico.
- ❌ No agregues patrones de diseño ni abstracciones que no necesites.

### 4.5 Verifica

```bash
npm run test:all            # typecheck + lint + 15 unitarias + 12 E2E
npm run lint                # ahora: 0 avisos
git diff --stat             # debe aparecer SOLO shared/pricing.ts
git diff --stat -- tests    # debe estar vacío: las pruebas no se tocaron
git commit -am "refactor: dividir calculatePricing en funciones pequeñas"
```

**Preguntas**

- ¿Cuántas veces se puso roja una prueba durante tu refactor? ¿Qué te dijo el mensaje?
- ¿Cambió el comportamiento observable? ¿Cómo lo sabes **con certeza**?
- Sin pruebas, ¿cómo habrías verificado que no rompiste nada? ¿Cuánto habría tardado?

**Entregable:** tu commit con el refactor y la salida de `npm run test:all` en verde.

---

## Actividad 5 — Introducir una regresión (≈ 15 min)

**Objetivo:** comprobar que las pruebas **detectan** un error pequeño y sutil.

> ⚠️ Haz primero el commit de tu refactor (paso 4.5). Así podrás deshacer el experimento con seguridad.

### 5.1 Estado inicial: todo en verde

```bash
npm run test:unit
npm run test:e2e
```

### 5.2 Introduce el error

En `shared/pricing.ts`, busca la **única** línea que contiene `>= FREE_SHIPPING_THRESHOLD_CENTS` y cambia `>=` por `>`.

```diff
-  if (subtotal - discount >= FREE_SHIPPING_THRESHOLD_CENTS) {     // versión original (antes del refactor)
+  if (subtotal - discount >  FREE_SHIPPING_THRESHOLD_CENTS) {

-  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_COST_CENTS   // versión refactorizada
+  return subtotalAfterDiscount >  FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_COST_CENTS
```

Es un cambio de **un carácter** que parece inocente: una compra de exactamente $100.00 ya no recibe envío gratis y paga $5.00.

### 5.3 Observa qué pruebas lo detectan

```bash
npm run test:unit
npm run test:e2e
```

Completa:

| Nivel | Prueba que falló | Mensaje (esperado / recibido) |
|---|---|---|
| Unitaria | ___ | ___ |
| E2E | ___ | ___ |

Resultado esperado: **1 unitaria** (`es gratis exactamente desde $100.00 y se cobra en $99.99 (valor límite)`) y **1 E2E** (`E2E 07`) fallan; el resto sigue en verde.

Abre el material de diagnóstico del E2E:

```bash
npm run test:e2e:report                      # reporte HTML con screenshot y trace
npm run test:e2e:trace -- test-results/<carpeta-de-la-prueba>/trace.zip
```

### 5.4 Revierte y confirma

```bash
git restore shared/pricing.ts
npm run test:unit && npm run test:e2e        # vuelve el verde
```

### 5.5 Reflexión

- ¿Por qué ni `E2E 05` ni `E2E 09` detectaron el error? ¿Qué tuvo de especial **E2E 07**? *(Valor límite exacto: 4 × $25.00 = $100.00.)*
- ¿Qué habría pasado si el límite no estuviera probado? ¿Cuándo se habría descubierto el error?
- Un detalle importante: se detectó **tanto** en la prueba unitaria (rápida, precisa, dice dónde) **como** en E2E (lenta, pero confirma que el usuario lo vería). ¿Qué ventaja da cada una?

### 5.6 (Opcional) Más mutaciones

Prueba cada cambio (revirtiendo con `git restore shared/pricing.ts` entre uno y otro) y anota qué pruebas fallan:

| Cambio | Dónde | Predicción | Resultado real |
|---|---|---|---|
| `SHIPPING_COST_CENTS = 500` → `550` | `shared/rules.ts` | ___ | ___ |
| Quitar el `+ 50` del cálculo del descuento (el redondeo pasa a ser hacia abajo) | `shared/pricing.ts` | ___ | ___ |

> Pista para la segunda: ¿alguno de los escenarios E2E tiene un subtotal que genere fracciones de centavo al calcular el 10 %?

---

## Actividad 6 — Pull Request (≈ 15 min)

**Objetivo:** entregar tu refactor como lo haría un equipo profesional, con evidencia.

1. Asegúrate de que tu rama tiene **solo** el commit del refactor (la regresión de la Actividad 5 revertida) y de que tu prueba nueva de la Actividad 2 está incluida si quieres entregarla (sepárala en otro commit).
2. Sube la rama a **tu fork** y abre el PR hacia el repositorio base:

   ```bash
   git push -u origin lab/<tu-nombre>
   gh pr create --repo Ditmar/lab4-seminario --base main --title "refactor: dividir calculatePricing en funciones pequeñas"
   # o abre el PR desde la web de GitHub (botón "Compare & pull request" en tu fork)
   ```
3. Usa la plantilla [docs/PR_TEMPLATE.md](PR_TEMPLATE.md) como descripción. Completa **todas** las secciones.
4. Espera a que **GitHub Actions** termine (workflow *CI*). Debe verse en verde: tipos, lint, unitarias y E2E.
5. Agrega evidencia:
   - Captura de `npm run test:all` en verde en tu máquina.
   - Enlace a la ejecución de Actions y al artefacto **playwright-report**.
   - La prueba de que no tocaste las pruebas: `git diff --stat origin/main -- tests` (o muestra qué archivos cambiaron en la pestaña *Files changed*).
6. En *Riesgos conocidos* menciona qué podría salir mal y cómo las pruebas lo mitigan (y qué **no** cubren).

**¿Qué se evalúa en el PR?** (30 de los 100 puntos de [LAB_ASSIGNMENT.md](LAB_ASSIGNMENT.md))

| Criterio | Puntos |
|---|---:|
| Las pruebas existentes no fueron modificadas | 7 |
| `calculatePricing()` descompuesta en funciones pequeñas con responsabilidades claras | 7 |
| Código simplificado (menos anidamiento, sin repeticiones) y `npm run lint` sin avisos | 6 |
| Comportamiento preservado (misma firma, reglas, errores y umbral de envío) | 5 |
| Descripción del PR completa y con evidencia verificable | 5 |

El análisis de la regresión (Actividad 5) y la prueba unitaria propia (Actividad 2) se califican aparte, en las Actividades 6 y 3 del laboratorio evaluable.

---

## Glosario rápido

- **Prueba unitaria:** verifica una pieza pequeña de lógica, sin navegador ni red. Milisegundos.
- **Prueba E2E:** recorre la aplicación como un usuario, con navegador, frontend y API reales. Segundos.
- **Mock:** objeto o función falsa que reemplaza una dependencia y registra cómo se usó (`vi.fn()`).
- **Refactorización:** cambiar la estructura interna **sin** cambiar el comportamiento observable.
- **Regresión:** algo que funcionaba y deja de funcionar tras un cambio.
- **Valor límite:** entrada justo en el borde de una regla ($99.99 vs $100.00).
- **Auto-waiting:** Playwright espera solo a que el elemento esté listo; no se usan pausas fijas.
- **Trace:** grabación paso a paso (DOM, red, consola) de una prueba para depurarla.
