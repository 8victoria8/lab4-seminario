---
id: seminario-testing-refactor-04
title: Laboratorio 4 - Pruebas automatizadas y refactorización segura
subject: Seminario de Sistemas
version: 1
duration: 120
points: 100
status: draft
---

{{repository
  id="base-repository"
  provider="github"
  url="https://github.com/Ditmar/lab4-seminario"
  branch="main"
}}

# Laboratorio 4 — Pruebas automatizadas y refactorización segura

## Objetivo

Comprender cómo un conjunto confiable de **pruebas unitarias** y **pruebas End-to-End (Playwright)** permite modificar la estructura interna de un sistema sin cambiar su comportamiento observable.

El proyecto es **MiniShop**, una tienda mínima (React + Express + TypeScript) con catálogo, carrito, cupones y checkout. La aplicación funciona y todas sus pruebas pasan. Sin embargo, la función `calculatePricing()` de `shared/pricing.ts` está escrita de forma difícil de mantener: una sola función larga, con condicionales anidados y responsabilidades mezcladas.

La idea central del laboratorio es:

> Podemos cambiar completamente la implementación interna del software mientras su comportamiento observable permanece igual, y las pruebas nos ayudan a **verificarlo**.

Al finalizar el laboratorio deberás poder:

- explicar y verificar las reglas de negocio de la aplicación;
- leer y escribir pruebas unitarias con Vitest;
- explicar cómo Playwright automatiza escenarios reales de usuario;
- refactorizar `calculatePricing()` **sin modificar las pruebas existentes**;
- demostrar que las pruebas detectan una regresión;
- entregar el cambio mediante un Pull Request con evidencia.

---

## Preparación

Repositorio base:

https://github.com/Ditmar/lab4-seminario

Realiza un **Fork** del repositorio y luego clona tu fork:

```bash
git clone https://github.com/TU-USUARIO/lab4-seminario.git
cd lab4-seminario
npm install
npm run e2e:install
```

Se requiere **Node.js 20 o superior**. Comprueba tu versión:

```bash
node --version
npm --version
```

Verifica que todo funciona antes de tocar el código:

```bash
npm run test:all
```

Debes ver el typecheck sin errores, **5 avisos de lint** (todos en `shared/pricing.ts`), **15 pruebas unitarias** y **12 pruebas E2E** en verde. Si esto no ocurre, no continúes: pide ayuda.

Ejecuta la aplicación y ábrela en el navegador:

```bash
npm run dev
```

```text
http://localhost:5173
```

Crea una rama de trabajo:

```bash
git checkout -b lab/refactor-pricing
```

> **Importante:** debes producir tu propia solución a partir de `main`. No copies código de otros repositorios ni de otros estudiantes.

---

## Reglas de negocio de referencia

Los importes se manejan internamente en **centavos enteros**.

| Producto | Precio |
|---|---:|
| Laptop Sleeve | $30.00 |
| Wireless Mouse | $25.00 |
| Mechanical Keyboard | $60.00 |

- `SAVE10`: 10 % de descuento sobre el subtotal, redondeado al centavo más cercano (las mitades suben).
- `FREESHIP`: elimina el envío.
- Solo se admite un cupón por pedido. Un cupón inexistente es un error.
- El envío cuesta $5.00. Es gratis si el subtotal **después del descuento** llega a $100.00.
- Las cantidades son enteros entre 1 y 99. Un carrito vacío no genera pedido.

---

## Actividad 1 — Explorar la aplicación y sus reglas

Con la aplicación abierta en el navegador, **sin leer el código**, prueba los escenarios siguientes y registra los importes que muestra la interfaz:

| # | Escenario | Subtotal | Descuento | Envío | Total |
|---|---|---|---|---|---|
| 1 | 2 Laptop Sleeve + cupón `SAVE10` | | | | |
| 2 | 2 Laptop Sleeve + 2 Wireless Mouse, sin cupón | | | | |
| 3 | 2 Laptop Sleeve + 2 Wireless Mouse + cupón `SAVE10` | | | | |
| 4 | 1 Wireless Mouse + cupón `FREESHIP` | | | | |

Después responde:

- ¿Qué ocurre si aplicas `SAVE10` y luego intentas aplicar `FREESHIP`?
- ¿Qué ocurre si aplicas un cupón llamado `HOLA`?
- ¿Por qué los escenarios 2 y 3 tienen un envío distinto aunque tengan los mismos productos?
- ¿Por qué el sistema guarda los importes en centavos enteros y no en decimales?

{{answer
  id="explore-rules"
  type="textarea"
  points="8"
  evaluator="ai"
  placeholder="Pega tu tabla completada y responde las preguntas..."
}}

---

## Actividad 2 — Leer las pruebas unitarias

Ejecuta las pruebas unitarias y déjalas en modo observación:

```bash
npm run test:unit
npm run test:unit:watch
```

Lee `tests/unit/pricing.test.ts` y `tests/unit/orders.test.ts` y responde:

1. ¿Qué función se prueba y qué sabe la prueba sobre cómo está escrita por dentro?
2. Encuentra la prueba del valor límite del envío gratis. ¿Qué dos importes compara y por qué justo esos?
3. Encuentra la prueba de redondeo. ¿Por qué usa un producto de 1 centavo?
4. En `orders.test.ts` aparece `vi.fn()`. ¿Qué es ese mock y qué permite comprobar?
5. Las pruebas comparan el `code` del error y no su mensaje de texto. ¿Por qué?

{{answer
  id="read-unit-tests"
  type="textarea"
  points="10"
  evaluator="ai"
  placeholder="Responde las cinco preguntas con tus propias palabras..."
}}

---

## Actividad 3 — Escribir tu propia prueba unitaria

Agrega una prueba nueva a `tests/unit/pricing.test.ts` dentro del `describe` que corresponda. Elige **uno** de estos escenarios y **calcula el resultado esperado a mano antes de escribir el `expect`**:

- **A.** 2 Mechanical Keyboard con el cupón `FREESHIP`.
- **B.** 1 de cada producto (Laptop Sleeve, Wireless Mouse, Mechanical Keyboard) con el cupón `SAVE10`.
- **C.** 99 Wireless Mouse con el cupón `SAVE10`.

Tu prueba debe:

- tener un nombre descriptivo que explique la regla;
- verificar los cuatro importes del resultado (`subtotalCents`, `discountCents`, `shippingCents`, `totalCents`);
- pasar con `npm run test:unit`.

Pega aquí **solo el bloque `it(...)`** que escribiste.

{{answer
  id="own-unit-test"
  type="code"
  language="typescript"
  points="10"
  evaluator="ai"
}}

---

## Actividad 4 — Pruebas E2E con Playwright

Ejecuta las pruebas E2E viendo el navegador y luego explora UI Mode:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

Ejecuta una prueba específica:

```bash
npm run test:e2e -- -g "E2E 05"
```

Lee `tests/e2e/cart.spec.ts` (E2E 05) y `tests/e2e/checkout.spec.ts` (E2E 10) y responde:

1. ¿Por qué las pruebas usan `getByRole` y `getByLabel` en lugar de selectores CSS?
2. No hay ningún `sleep` ni `waitForTimeout`. ¿Cómo sabe Playwright cuánto esperar?
3. ¿Cómo se garantiza que una prueba E2E no afecte a la siguiente? (Revisa `tests/e2e/fixtures.ts`.)
4. E2E 10 es la única prueba que intercepta la red con `page.route`. ¿Qué simula, por qué es necesario y qué dos cosas se verifican al final?
5. Menciona un tipo de error que una prueba E2E detecta mejor que una unitaria y otro que una unitaria detecta mejor que una E2E.

{{answer
  id="e2e-understanding"
  type="textarea"
  points="10"
  evaluator="ai"
  placeholder="Responde las cinco preguntas citando las pruebas que revisaste..."
}}

---

## Actividad 5 — Refactorizar `calculatePricing()` de forma segura

Abre `shared/pricing.ts`. Esa función funciona correctamente, pero es difícil de mantener.

**Primera parte — diagnóstico.** Ejecuta `npm run lint` y revisa los avisos. Identifica al menos **cinco** problemas de diseño de la función.

**Segunda parte — refactor.** Divide la función en piezas pequeñas con responsabilidades claras. Una descomposición razonable es:

- `calculateSubtotal()`
- `calculateDiscount()`
- `calculateShipping()`
- `calculateTotal()`

Puedes mejorar nombres, extraer funciones y simplificar condicionales. No necesitas patrones de diseño ni abstracciones complejas.

**Reglas del refactor:**

- ✅ Puedes cambiar todo dentro de `shared/pricing.ts`.
- ❌ **No modifiques ninguna prueba existente.** Si una prueba se pone roja, el problema es tu refactor.
- ❌ No cambies las reglas de negocio, los códigos de error ni los mensajes.
- Trabaja en pasos pequeños: un cambio, ejecutar `npm run test:unit:watch`, otro cambio.

Al terminar, verifica y haz commit:

```bash
npm run test:all
git diff --stat
git commit -am "refactor: dividir calculatePricing en funciones pequeñas"
```

Describe aquí: (1) los problemas que encontraste, (2) las funciones que creaste y qué responsabilidad tiene cada una, (3) cuántas veces se puso roja una prueba durante el proceso y qué aprendiste de ello.

{{answer
  id="refactor-plan"
  type="textarea"
  points="10"
  evaluator="ai"
  placeholder="Problemas detectados, funciones creadas y qué te dijeron las pruebas durante el refactor..."
}}

---

## Actividad 6 — Introducir una regresión

> Haz esta actividad **después** de haber hecho commit de tu refactor.

Comprueba que todo está en verde:

```bash
npm run test:unit
npm run test:e2e
```

En `shared/pricing.ts` busca la **única** línea que contiene `>= FREE_SHIPPING_THRESHOLD_CENTS` y cambia `>=` por `>`.

Ejecuta de nuevo:

```bash
npm run test:unit
npm run test:e2e
```

Registra qué pruebas fallan y qué mensaje muestran. Abre el reporte (`npm run test:e2e:report`) o el trace de la prueba E2E fallida para observar el error.

Después **revierte el cambio**:

```bash
git restore shared/pricing.ts
npm run test:unit && npm run test:e2e
```

Responde:

1. ¿Qué prueba unitaria y qué prueba E2E detectaron el error? ¿Qué mensaje mostró cada una?
2. ¿Por qué no fallaron las demás pruebas, incluidas E2E 05 y E2E 09?
3. ¿Qué habría pasado si no existiera una prueba de valor límite?
4. ¿Qué ventaja da cada tipo de prueba (unitaria y E2E) al detectar este error?

{{answer
  id="regression-analysis"
  type="textarea"
  points="12"
  evaluator="ai"
  placeholder="Indica qué pruebas fallaron, con sus mensajes, y explica por qué..."
}}

---

## Actividad 7 — Entrega mediante Pull Request

Verifica que tu rama contiene el refactor y que la regresión de la Actividad 6 está **revertida**:

```bash
git status
npm run test:all
git diff --stat origin/main
git diff --stat origin/main -- tests
```

Sube tu rama y abre un Pull Request desde tu fork hacia el repositorio base:

```bash
git push -u origin lab/refactor-pricing
```

Usa como descripción la plantilla `docs/PR_TEMPLATE.md` y completa **todas** las secciones: descripción del cambio, criterios de aceptación, pruebas ejecutadas, resultados antes y después, evidencia E2E (captura del reporte HTML o enlace al artefacto de CI) y riesgos conocidos.

Espera a que el workflow de GitHub Actions (*CI*) termine. Debe quedar en verde.

> Si tu fork no ejecuta Actions, habilítalo en la pestaña **Actions** del fork.

Pega aquí la URL de tu Pull Request:

{{answer
  id="refactor-pr"
  type="github-pr"
  source="base-repository"
  points="30"
  evaluator="ai"
  required="true"
}}

---

## Actividad 8 — Reflexión final

Completa la frase y justifica con evidencia de tu propio laboratorio:

> "Mi refactor fue seguro porque ______."

Después responde:

1. ¿Qué cambió en tu refactor y qué NO cambió? ¿Cómo lo sabes con certeza?
2. Si tuvieras que modificar una prueba existente para que pase después de refactorizar, ¿qué significaría?
3. Menciona al menos **dos** cosas que estas pruebas **no** garantizan.

{{answer
  id="final-reflection"
  type="textarea"
  points="10"
  evaluator="ai"
  placeholder="Completa la frase y responde las tres preguntas..."
}}

---

## Evaluación

| Actividad | Puntos |
|---|---:|
| 1. Explorar la aplicación y sus reglas | 8 |
| 2. Leer las pruebas unitarias | 10 |
| 3. Escribir tu propia prueba unitaria | 10 |
| 4. Pruebas E2E con Playwright | 10 |
| 5. Refactorizar `calculatePricing()` | 10 |
| 6. Introducir una regresión | 12 |
| 7. Entrega mediante Pull Request | 30 |
| 8. Reflexión final | 10 |
| **TOTAL** | **100** |

---

## Idea principal

Un refactor no consiste en reescribir código "para que se vea mejor". Consiste en cambiar la **estructura** sin cambiar el **comportamiento**, y la única forma responsable de saberlo es contar con pruebas que describan ese comportamiento.

Antes:

```text
calculatePricing()
  └── una función de 63 líneas, complejidad 19, anidamiento de 5 niveles
```

Después:

```text
calculatePricing()
  ├── calculateSubtotal()
  ├── parseCoupon()
  ├── calculateDiscount()
  ├── calculateShipping()
  └── calculateTotal()
```

Y en ambos casos las mismas pruebas, sin modificar, dicen lo mismo:

```text
15 pruebas unitarias ✅
12 pruebas E2E       ✅
```

Las pruebas no se escriben para el código actual: se escriben para el comportamiento que queremos proteger, y por eso sobreviven al cambio de la implementación.
