# Guía del docente — Laboratorio MiniShop

Guía para dirigir una sesión de ≈ 120 minutos. Complementa la [guía del estudiante](LAB_GUIDE.md).

**Mensaje que deben llevarse los estudiantes:**

> Podemos cambiar completamente la implementación interna del software mientras su comportamiento observable permanece igual — y las pruebas nos ayudan a verificarlo.

## 1. Preparar el ambiente (el día anterior)

Haz esto **en la máquina con la que vas a proyectar** y pide a los estudiantes que lo hagan antes de la clase (la descarga de Chromium pesa ~150 MB):

```bash
git clone <url-del-repositorio> && cd <carpeta>
npm install
npm run e2e:install
npm run test:all                 # debe terminar en verde
git tag                          # debe mostrar: after-refactor, before-refactor
```

Lista de verificación:

- [ ] `npm run test:all` en verde (15 unitarias + 12 E2E). Los E2E tardan ≈ 15 s.
- [ ] Los puertos **5173, 3001, 5174 y 3101** están libres.
- [ ] El repositorio está en GitHub y **Actions habilitado** (para la Actividad 6). Haz un push de prueba y verifica que el workflow *CI* se ejecuta.
- [ ] Proyector con terminal y navegador visibles a la vez; fuente de la terminal grande.
- [ ] Windows: usa Git Bash o PowerShell; las variables de entorno se escriben distinto (ver README).
- [ ] Plan B por si falla la red del aula: los estudiantes pueden trabajar con todo instalado; solo la Actividad 6 requiere GitHub.

Pide que cada estudiante tenga abierto: editor, 2 terminales y el navegador.

## 2. Distribución sugerida de los 120 minutos

| Min | Bloque | Qué ocurre |
|---|---|---|
| 0–10 | **Introducción** | El problema: "¿cómo sé que no rompí nada?". Pirámide de pruebas. Presenta el objetivo del día. |
| 10–20 | **Actividad 1** | Explorar MiniShop y descubrir las reglas de negocio. |
| 20–40 | **Actividad 2** | Vitest: leer pruebas, mock con `vi.fn()`, escribir una propia. |
| 40–65 | **Actividad 3** | Playwright: modo visual, UI Mode, reporte, E2E 10. |
| 65–85 | **Actividad 4** | **Refactor seguro** (momento central). |
| 85–100 | **Actividad 5** | **Regresión**: el error de un carácter. |
| 100–115 | **Actividad 6** | Pull Request con evidencia + CI. |
| 115–120 | **Cierre** | Conclusiones, preguntas, qué no cubren las pruebas. |

> Si vas retrasado, recorta primero la Actividad 1 (haz una demo guiada de 5 min) y los pasos 3.6–3.7. **No recortes las Actividades 4 y 5**: son el corazón del laboratorio.

## 3. Conceptos que debes explicar (y cuándo)

1. **Pirámide de pruebas** (intro). Muchas unitarias (rápidas, baratas, precisas) · pocas E2E (lentas, caras, pero prueban lo que el usuario vive). Tenemos 15 unitarias en ≈ 0.4 s y 12 E2E en ≈ 15 s: pídeles que lo comprueben ellos mismos.
2. **Comportamiento observable vs. implementación** (Act. 2 y 4). Las pruebas llaman a `calculatePricing(items, coupon)` y comparan resultados. No saben si por dentro hay un `for` o un `reduce`. Por eso sobreviven al refactor.
3. **Importes en centavos enteros** (Act. 1). `0.1 + 0.2 !== 0.3`. Regla de redondeo: SAVE10 = `round-half-up(subtotal × 10 %)` al centavo, calculado con enteros.
4. **Valores límite** (Act. 2 y 5). Los errores viven en los bordes: $99.99 / $100.00, 0 / 1 / 99 / 100 unidades.
5. **Mock** (Act. 2). `vi.fn()` en `tests/unit/orders.test.ts`: una función falsa que registra cómo la usaron; permite probar "un pedido inválido **no** consume número de pedido".
6. **Locators accesibles y auto-waiting** (Act. 3). `getByRole` / `getByLabel` en vez de CSS. Ningún `waitForTimeout`: `expect` reintenta hasta cumplirse. ESLint incluso lo prohíbe (`no-restricted-properties`).
7. **Aislamiento y determinismo** (Act. 3). Cada prueba reinicia el servidor con `POST /api/test/reset`, que **solo existe con `NODE_ENV=test`**. El primer pedido de cada prueba es siempre `MS-1001`.
8. **Cuándo sí se justifica un mock de red** (Act. 3, E2E 10). Es el único `page.route`: sirve para controlar **cuándo** responde el servidor y así provocar el doble clic. La petición liberada sigue yendo a la API real.
9. **Validar también en el servidor** (Act. 3, E2E 12). El frontend se puede saltar; el servidor jamás debe confiar en él. Mismo código (`shared/`), dos lugares de aplicación.
10. **Las pruebas no son magia**: solo detectan lo que verifican (ver "Cierre").

## 4. Guion de demostración: refactor seguro

Hazla tú primero, en vivo, como modelo; luego los estudiantes lo repiten en la Actividad 4.

### 4.1 Estado "antes"

```bash
git switch --detach before-refactor
npm run test:all                       # todo en verde
npm run lint                           # 5 avisos, todos en shared/pricing.ts
```

Proyecta `shared/pricing.ts` y pregunta: **"¿se atreverían a modificar esto un viernes a las 6 pm?"** Señala: una sola función de 63 líneas, anidamiento de 5 niveles, bucles con índices, la misma expresión repetida, validar + sumar + descontar + enviar mezclados.

### 4.2 Estado "después"

```bash
git switch --detach after-refactor
npm run test:all                       # ¡sigue todo en verde con las MISMAS pruebas!
npm run lint                           # 0 avisos
```

### 4.3 Comparación objetiva

```bash
git diff before-refactor after-refactor --stat          # 1 archivo: shared/pricing.ts
git diff before-refactor after-refactor -- tests        # (vacío) las pruebas NO cambiaron
git diff before-refactor after-refactor                 # el refactor completo
```

Resultados que deben observar:

| Métrica | Antes (A) | Después (B) |
|---|---|---|
| Archivos modificados | — | 1 (`shared/pricing.ts`) |
| Archivos de prueba modificados | — | **0** |
| Funciones | 1 | 7 (más `calculatePricing` como guion) |
| Función más larga | 63 líneas | 16 líneas (el resto ≤ 10) |
| Complejidad ciclomática máxima | **19** | 6 |
| Anidamiento máximo | **5** niveles | 1 nivel |
| Avisos de `npm run lint` | **5** | **0** |
| Pruebas unitarias | 15 ✅ | 15 ✅ |
| Pruebas E2E | 12 ✅ | 12 ✅ |

Vuelve a `main` al terminar: `git switch main`.

> **Pregunta clave para la clase:** "Cambiamos 60+ líneas de lógica de dinero. ¿Cómo sabemos que no rompimos nada?" → *Porque 27 pruebas lo verifican en menos de 20 segundos, y no las tocamos.*

### 4.4 Demostración en vivo del refactor (opcional, 5 min)

En `main`, con `npm run test:unit:watch` proyectado, extrae `calculateShipping()` frente a ellos. Muestra el ciclo: cambio pequeño → verde → cambio pequeño → verde. Luego introduce un error *a propósito* en tu extracción para que vean cómo se pone rojo al instante.

## 5. Guion de demostración: regresión

Parte de un estado verde (por ejemplo, `after-refactor` o el refactor de un estudiante, con commit hecho).

| Paso | Comando / acción | Qué deben ver |
|---|---|---|
| 1 | `npm run test:unit && npm run test:e2e` | 15 ✅ y 12 ✅ |
| 2 | En `shared/pricing.ts` busca `>= FREE_SHIPPING_THRESHOLD_CENTS` y cambia `>=` por `>` | Un cambio de un carácter |
| 3 | `npm run test:unit` | **1 falla**: `es gratis exactamente desde $100.00 y se cobra en $99.99 (valor límite)` → `expected 500 to be +0` |
| 4 | `npm run test:e2e` | **1 falla**: `E2E 07` → `Expected: "$0.00"` · `Received: "$5.00"` |
| 5 | `npm run test:e2e:report` y abre el trace de E2E 07 | Screenshot y trace (línea de tiempo) con el momento exacto del error |
| 6 | `git restore shared/pricing.ts` | Archivo revertido |
| 7 | `npm run test:unit && npm run test:e2e` | De nuevo 15 ✅ y 12 ✅ |

Dónde está el cambio en cada versión:

- **`before-refactor`:** `if (subtotal - discount >= FREE_SHIPPING_THRESHOLD_CENTS) {`
- **`after-refactor`:** `return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_COST_CENTS`

### Mutaciones opcionales (Actividad 5.6): resultados verificados

| Cambio | Unitarias que fallan | E2E que fallan |
|---|---|---|
| `SHIPPING_COST_CENTS` 500 → 550 (`shared/rules.ts`) | 5 de 15 (envío, total, umbral, pedido…) | 8 de 12 (ver nota) |
| Quitar el `+ 50` del descuento (`shared/pricing.ts`, versión original) | **1** (`redondea el descuento al centavo más cercano…`) | **0** — los 12 pasan |

*Nota:* en la primera fila fallan E2E 02, 03, 05, 06, 07, 09, 11 y 12 (todas las que miran el envío o el total); pasan 01, 04, 08 y 10. La segunda fila es la lección: **el redondeo solo lo protege una prueba unitaria**, porque los precios del catálogo nunca generan fracciones de centavo.

Puntos para discutir:

- Solo fallan **2 de 27** pruebas, justo las que prueban el borde. Las demás (que usan importes cómodos como $60) no lo notan: *una suite verde no demuestra ausencia de errores*.
- La prueba unitaria **localiza** el error en milisegundos; la E2E **confirma** que el usuario lo sufriría.
- Variante interesante (5.6 de la guía): quitar el `+ 50` del redondeo **solo** lo detecta una unitaria: los precios del catálogo nunca generan fracciones de centavo, así que ningún E2E lo vería. Moraleja: las pruebas se complementan.

## 6. Preguntas para formular

**Introducción**
- ¿Cómo comprueban hoy que su programa sigue funcionando después de un cambio?
- ¿Alguna vez arreglaron algo y rompieron otra cosa?

**Actividad 2**
- ¿Esta prueba fallaría si cambio el `for` por un `reduce`? ¿Debería?
- ¿Por qué probar el `code` del error y no su texto?
- Si el mock `generateOrderNumber` no se hubiera llamado, ¿qué habría que concluir?

**Actividad 3**
- ¿Qué ventaja tiene `getByRole('button', { name })` sobre `.btn-primary`? (Accesibilidad + resistencia a cambios de estilo.)
- ¿Cómo sabe Playwright cuánto esperar sin `sleep`? (Reintentos de `expect` hasta el timeout.)
- ¿Por qué solo E2E 10 usa un mock de red? ¿Qué se perdería si mockearan todo?
- ¿Qué verifica E2E 12 que el navegador no puede verificar?

**Actividad 4**
- ¿Qué cambió: el comportamiento o la estructura? ¿Cómo lo prueban?
- ¿En qué momento se atrevieron a hacer un cambio grande porque sabían que había pruebas?
- Si tuvieran que modificar una prueba para que pase tras refactorizar, ¿qué significaría?

**Actividad 5**
- ¿Por qué solo falló una prueba de cada tipo? ¿Eso es buena o mala noticia?
- ¿Qué pasaría si borráramos la prueba de valor límite?

**Cierre**
- ¿Qué NO cubren estas pruebas? (Rendimiento, seguridad, otros navegadores, usabilidad, pagos reales, concurrencia…)
- ¿Cuándo es mejor una prueba unitaria y cuándo una E2E?

## 7. Qué deben observar (resumen de resultados esperados)

| Momento | Comando | Resultado esperado |
|---|---|---|
| Estado inicial | `npm run test:unit` | 3 archivos, **15 passed** |
| Estado inicial | `npm run test:e2e` | **12 passed** (≈ 15 s) |
| Estado inicial | `npm run lint` | 5 avisos de mantenibilidad, 0 errores |
| Tras el refactor | `npm run test:all` | todo verde, **0 avisos** |
| Tras la regresión | `npm run test:unit` | 1 failed · 14 passed |
| Tras la regresión | `npm run test:e2e` | 1 failed (E2E 07) · 11 passed |
| Tras revertir | `npm run test:all` | todo verde |

## 8. Problemas frecuentes en el aula

| Síntoma | Causa y solución |
|---|---|
| `Executable doesn't exist ... chromium` | Falta `npm run e2e:install`. |
| `... is already used` al lanzar E2E | Otra ejecución de Playwright (o UI Mode) sigue abierta; ciérrala. |
| `npm run dev` falla por puerto ocupado | Otro `npm run dev` abierto: usa 5173 y 3001. |
| El estudiante "arregla" una prueba para que pase tras su refactor | Es la señal de que cambió el comportamiento. Pídele que revierta la prueba y corrija el código. |
| `git restore` borró el refactor del estudiante | No hizo commit antes de la Actividad 5. Insiste en el paso 4.5. |
| Windows: `SLOW_MO=500 npm run ...` no funciona | En PowerShell: `$env:SLOW_MO=500; npm run test:e2e:headed`. |
| CI falla en `playwright install` | Revisa que el runner sea `ubuntu-latest` y que se use `--with-deps`. |

## 9. Rúbrica rápida de la sesión

La rúbrica del PR está al final de la Actividad 6 de la [guía del estudiante](LAB_GUIDE.md). Como verificación de aprendizaje, pide en una frase por estudiante: *"Mi refactor fue seguro porque ______"* (esperado: "las pruebas originales, que no modifiqué, siguen en verde y verifican el comportamiento observable").
