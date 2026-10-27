# MiniShop Lab — Pruebas automatizadas y refactorización segura

Laboratorio universitario (≈ 120 min) sobre **calidad de software**: pruebas unitarias con Vitest, pruebas End-to-End con Playwright y refactorización con una red de seguridad de pruebas.

> **Idea central:** podemos cambiar por completo la implementación interna del software mientras su comportamiento observable permanece igual, y las pruebas nos ayudan a **verificarlo**.

La aplicación (MiniShop) es una tienda mínima: catálogo, carrito con cupones y checkout. Es deliberadamente pequeña para que se pueda entender completa durante la clase.

## Objetivos educativos

Al terminar el laboratorio, el estudiante podrá:

1. Explicar cómo las **pruebas unitarias** verifican reglas de negocio y funciones individuales.
2. Usar **Playwright** para automatizar escenarios reales de usuario en un navegador real.
3. **Refactorizar** código sin miedo, usando las pruebas como red de seguridad.
4. Comprobar que una **regresión** (un error pequeño) es detectada por las pruebas unitarias y E2E.
5. Entregar un cambio en un **Pull Request** con evidencia de que las pruebas siguen pasando.

## Requisitos previos

- [Node.js](https://nodejs.org) 20 o superior (probado con 22) y npm.
- [Git](https://git-scm.com).
- Conocimientos básicos de JavaScript, TypeScript y React.
- ~500 MB libres para el navegador Chromium de Playwright.

Funciona en Windows, macOS y Linux. No requiere Docker, base de datos ni servicios externos.

## Instalación

```bash
npm install
npm run e2e:install     # descarga Chromium para Playwright (una sola vez)
```

## Ejecutar la aplicación

```bash
npm run dev
```

Levanta la API (Express, puerto 3001) y el frontend (Vite, puerto 5173) a la vez. Abre <http://localhost:5173>.

## Pruebas unitarias (Vitest)

```bash
npm run test:unit             # una pasada
npm run test:unit:watch       # se re-ejecutan al guardar (ideal para refactorizar)
npm run test:unit:coverage    # con cobertura -> coverage/index.html
```

## Pruebas E2E (Playwright)

Playwright **levanta solo** la API y el frontend (en los puertos 3101 y 5174, para no chocar con `npm run dev`).

| Comando | Qué hace |
|---|---|
| `npm run test:e2e` | Ejecuta todas las pruebas E2E en Chromium (sin ventana) |
| `npm run test:e2e:headed` | Igual, pero **viendo el navegador** hacer las acciones |
| `npm run test:e2e:ui` | Abre **UI Mode**: línea de tiempo, DOM de cada paso, re-ejecución |
| `npm run test:e2e -- -g "E2E 05"` | Ejecuta **una prueba** (por parte de su nombre) |
| `npm run test:e2e -- tests/e2e/cart.spec.ts` | Ejecuta **un archivo** |
| `npm run test:e2e:report` | Abre el **reporte HTML** de la última ejecución |
| `npm run test:e2e:trace -- <ruta>/trace.zip` | Abre el **trace** de una prueba fallida |
| `npm run test:e2e:firefox` / `test:e2e:webkit` | Opcional: otros navegadores (antes: `npx playwright install firefox webkit`) |
| `npm run test:e2e:all-browsers` | Opcional: los tres navegadores |

Para verlo en cámara lenta: `SLOW_MO=500 npm run test:e2e:headed` (bash/zsh) o `$env:SLOW_MO=500; npm run test:e2e:headed` (PowerShell).

Cuando una prueba falla, Playwright guarda en `test-results/` un **screenshot** y un **trace** (la línea de tiempo paso a paso). El reporte HTML queda en `playwright-report/`.

## Todos los scripts

| Script | Descripción |
|---|---|
| `npm run dev` | API + frontend en modo desarrollo |
| `npm run build` | Verifica tipos y genera el build de producción en `dist/` |
| `npm run typecheck` | TypeScript estricto, sin emitir archivos |
| `npm run lint` | ESLint (incluye métricas de complejidad como *avisos*) |
| `npm run test:unit` · `:watch` · `:coverage` | Pruebas unitarias |
| `npm run test:e2e` · `:headed` · `:ui` · `:report` · `:trace` | Pruebas E2E |
| `npm run test:all` | typecheck + lint + unitarias + E2E |

## Reglas de negocio (resumen)

Los importes se manejan internamente en **centavos enteros**.

| Producto | Precio |
|---|---|
| Laptop Sleeve | $30.00 |
| Wireless Mouse | $25.00 |
| Mechanical Keyboard | $60.00 |

- `SAVE10`: 10 % de descuento sobre el subtotal, **redondeado al centavo más cercano (mitades hacia arriba)**.
- `FREESHIP`: elimina el envío. Los cupones **no se combinan** y no distinguen mayúsculas.
- Envío: $5.00. Gratis si el subtotal **después del descuento** llega a $100.00 (inclusive).
- Cantidades: enteros entre 1 y 99. El carrito vacío no genera pedidos. Impuesto: 0.
- Ejemplo: 2 Laptop Sleeve + `SAVE10` → subtotal $60.00, descuento $6.00, envío $5.00, **total $59.00**.

Detalle completo y criterios de aceptación en [docs/ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md).

## Estructura del repositorio

```
.
├── shared/                # Reglas de negocio y modelos, compartidos por frontend y servidor
│   ├── pricing.ts         #   ★ calculatePricing(): el código que se refactoriza en el laboratorio
│   ├── rules.ts           #   constantes ($5 de envío, umbral de $100, cantidad máxima)
│   ├── catalog.ts         #   los 3 productos
│   ├── checkout.ts        #   validación de nombre / correo / dirección
│   └── ...                #   types, errors, money
├── server/                # API Express con almacenamiento en memoria
│   ├── app.ts             #   rutas (/api/products, /api/orders, /api/test/* solo en NODE_ENV=test)
│   └── orders.ts          #   servicio de pedidos (revalida todo en el servidor)
├── src/                   # Frontend React (Vite)
├── tests/
│   ├── unit/              # 15 pruebas Vitest
│   └── e2e/               # 12 escenarios Playwright
├── docs/                  # Guías del laboratorio
├── playwright.config.ts   # webServer, trace, screenshots, reporte HTML
└── .github/workflows/ci.yml
```

La lógica de precios está **una sola vez** en `shared/`: el frontend la usa para mostrar importes al instante y el servidor la vuelve a aplicar al crear el pedido (nunca confía en el cliente).

## Puntos del historial Git para la demostración

| Referencia | Contenido |
|---|---|
| `before-refactor` (rama `main`) | App completa con la implementación original de `calculatePricing` (larga y anidada). Todas las pruebas pasan. |
| `after-refactor` (rama `solution/after-refactor`) | Solo cambia `shared/pricing.ts`: funciones pequeñas. **Las pruebas no se tocan** y siguen pasando. |

```bash
git diff before-refactor after-refactor --stat      # solo shared/pricing.ts
git diff before-refactor after-refactor             # el refactor completo
```

## Documentación

- [docs/LAB_GUIDE.md](docs/LAB_GUIDE.md) — guía paso a paso para estudiantes (6 actividades)
- [docs/TEACHER_GUIDE.md](docs/TEACHER_GUIDE.md) — guía del docente, guion de demostración y distribución de 120 min
- [docs/ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md) — historia de usuario y criterios Given–When–Then
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — matriz de pruebas
- [docs/PR_TEMPLATE.md](docs/PR_TEMPLATE.md) — plantilla de Pull Request

## Solución de problemas

- **`Error: http://localhost:5174 is already used`** — hay otra ejecución de Playwright abierta. Ciérrala (los servidores de pruebas usan los puertos 3101 y 5174).
- **`Executable doesn't exist ... chromium`** — falta `npm run e2e:install`.
- **El puerto 5173 o 3001 está ocupado** — cierra el otro `npm run dev`.
