# Plan de pruebas — MiniShop

## 1. Alcance y estrategia

| | |
|---|---|
| **Sistema bajo prueba** | MiniShop: catálogo, carrito, cupones, checkout y API de pedidos |
| **Fuera de alcance** | Pagos reales, autenticación, rendimiento, seguridad, accesibilidad automatizada, persistencia |
| **Estrategia** | Pirámide de pruebas: reglas de negocio con **unitarias** (rápidas y precisas) y flujos de usuario con **E2E** (navegador + frontend + API reales) |
| **Navegador por defecto** | Chromium (Firefox y WebKit opcionales) |
| **Datos** | Catálogo fijo de 3 productos; almacenamiento en memoria reiniciado antes de cada E2E |
| **Determinismo** | Sin reloj, sin azar, sin red externa. Un worker. Número de pedido siempre `MS-1001` en la primera compra. Sin `waitForTimeout` (lo prohíbe ESLint) |

## 2. Matriz de pruebas

| Requisito | Tipo de prueba | Escenario | Evidencia esperada |
|---|---|---|---|
| **RN-01** Importes en centavos enteros | Unitaria | U-01, U-09: subtotales y totales exactos (ej. $140.00, $59.00) | `toBe(14000)`; `toEqual({subtotal 6000, discount 600, shipping 500, total 5900})` |
| **RN-02** SAVE10 = 10 % con redondeo half-up | Unitaria | U-02: 2 Laptop Sleeve → -$6.00 · U-03: 4/5/14/15/99 ¢ → 0/1/1/2/10 ¢ | Descuento exacto en centavos |
| **RN-02** SAVE10 en la interfaz | E2E | E2E 05: 2 Laptop Sleeve + SAVE10 | Descuento `-$6.00`, envío `$5.00`, total `$59.00` visibles |
| **RN-03** FREESHIP elimina el envío | Unitaria · E2E | U-07 · E2E 11 (parte 1) | Envío `0`, descuento `0` · celda de envío `$0.00` |
| **RN-04** Un solo cupón; inexistente = error | Unitaria | U-04: `DESCUENTO50`, `SAVE10 FREESHIP`, `SAVE10,FREESHIP` | Error `INVALID_COUPON` |
| **RN-04** Cupón inválido/combinado en UI | E2E | E2E 06 (inválido) · E2E 11 (segundo cupón) | `role=alert` con el mensaje; importes sin cambios; el cupón actual sigue aplicado |
| **RN-05** Envío de $5.00 | Unitaria · E2E | U-05 · E2E 02 | Envío `500` · celda `$5.00` |
| **RN-06** Envío gratis desde $100.00 (tras descuento) | Unitaria | U-06 (valor límite $99.99 / $100.00) · U-08 (umbral después del descuento) | `500` en $99.99; `0` en $100.00; $110.00 con SAVE10 → `500` |
| **RN-06** Envío gratis en la UI | E2E | E2E 07: 3 → 4 → 3 *Wireless Mouse* (valor límite exacto) | Envío `$5.00` → `$0.00` → `$5.00` |
| **RN-07** Cantidades enteras 1–99 | Unitaria · E2E | U-11 (0, -1, 1.5, NaN, 100 rechazados; 1 y 99 aceptados) · E2E 03 (no baja de 1) | `INVALID_QUANTITY` · botón "Disminuir" deshabilitado |
| **RN-07** Producto inexistente | Unitaria · E2E (API) | U-12 · E2E 12 | `UNKNOWN_PRODUCT` · HTTP 400 |
| **RN-08** Carrito vacío no genera pedido | Unitaria · E2E · E2E (API) | U-10 · U-15 · E2E 04 · E2E 12 | Importes en 0 · `EMPTY_CART` · botón "Confirmar pedido" deshabilitado · HTTP 400 |
| **CAT** Catálogo visible | E2E | E2E 01 | 3 productos con nombre, precio y botón; carrito vacío |
| **CAR** Agregar / cambiar cantidad / eliminar | E2E | E2E 02 · E2E 03 · E2E 04 | Líneas del carrito e importes actualizados |
| **RN-09** Validación del checkout | Unitaria · E2E | U-13 · E2E 08 | Un mensaje por campo inválido, `aria-invalid`, sin pedido en el servidor |
| **CHK** Compra exitosa | E2E · Unitaria | E2E 09 · U-14 | "¡Pedido confirmado!", `MS-1001`, "Total pagado: $59.00"; el servidor guardó 1 pedido con `totalCents: 5900` |
| **RN-10** Sin pedidos duplicados | E2E | E2E 10: respuesta retenida + doble clic + clic forzado | Botón "Procesando…" deshabilitado; 1 petición; 1 pedido en el servidor |
| **RN-11** Validación en el servidor | Unitaria · E2E (API) | U-14, U-15 · E2E 12 | HTTP 400 con código para cada solicitud inválida; HTTP 201 con importes del servidor |
| **RN-11** Pedido inválido no consume numeración | Unitaria (mock) | U-15 con `vi.fn()` | `generateOrderNumber` no fue llamado; `listOrders()` vacío |
| **Aislamiento** Ruta de reinicio solo en test | E2E (fixture) | `tests/e2e/fixtures.ts`: `POST /api/test/reset` antes de cada prueba | Responde `204` con `NODE_ENV=test` (en desarrollo la ruta no existe: 404) |
| **Calidad estática** | Typecheck · Lint | `npm run typecheck` · `npm run lint` | 0 errores de tipos y de lint |
| **Refactor seguro** | Unitaria + E2E (sin modificar) | Mismas 15 + 12 pruebas antes y después del refactor | 27/27 en verde con ambas implementaciones; `git diff -- tests` vacío |
| **Detección de regresiones** | Unitaria + E2E | Cambiar `>=` por `>` en el umbral de envío gratis | Falla U-06 y E2E 07; el resto en verde |

## 3. Ambientes y ejecución

| Dónde | Comando | Alcance |
|---|---|---|
| Local, desarrollo | `npm run test:unit:watch` | Retroalimentación inmediata mientras se programa |
| Local, antes del commit | `npm run test:all` | typecheck + lint + 15 unitarias + 12 E2E |
| Local, depuración | `npm run test:e2e:ui` · `test:e2e:headed` | Ver y recorrer los pasos |
| CI (GitHub Actions) | `.github/workflows/ci.yml` en cada PR y push a `main` | Todo lo anterior en Chromium + artefactos |

## 4. Criterios de entrada y salida

**Entrada:** dependencias instaladas, Chromium instalado, puertos 3101 y 5174 libres.

**Salida (el cambio se puede integrar):**
- `typecheck` y `lint` sin errores.
- 15/15 pruebas unitarias en verde.
- 12/12 pruebas E2E en verde en Chromium.
- Ninguna prueba existente fue modificada **para hacerla pasar** (si el comportamiento cambia a propósito, se actualiza la prueba *y* el criterio de aceptación en el mismo PR).

## 5. Evidencia y reportes

| Evidencia | Dónde |
|---|---|
| Resultados unitarios | Salida de `npm run test:unit` · `coverage/index.html` (con `test:unit:coverage`) |
| Reporte HTML E2E | `playwright-report/` → `npm run test:e2e:report` |
| Screenshot y trace de un fallo | `test-results/<prueba>/` → `npm run test:e2e:trace -- <ruta>/trace.zip` |
| En CI | Artefactos `playwright-report`, `playwright-test-results` y `unit-coverage` (se publican aunque falle una prueba) |

## 6. Riesgos y limitaciones conocidas

- Las pruebas E2E comparten un único servidor en memoria, por eso se ejecutan con **un worker**. Es una decisión consciente a cambio de simplicidad y determinismo.
- Los precios del catálogo son múltiplos de $5.00: **ningún E2E genera fracciones de centavo**. El redondeo solo está cubierto por la prueba unitaria U-03.
- No se cubre concurrencia entre varios clientes ni persistencia (almacenamiento en memoria).
- La prevención de duplicados (RN-10) se verifica en la interfaz; el servidor no implementa idempotencia por clave.
- Solo Chromium se ejecuta por defecto; Firefox y WebKit son opcionales y no corren en CI.
