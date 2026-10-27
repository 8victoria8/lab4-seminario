# Criterios de aceptación — Carrito y Checkout

## Historia de usuario

> **Como** cliente de MiniShop,
> **quiero** armar mi carrito, aplicar un cupón y confirmar mi pedido con mis datos,
> **para** recibir mis productos pagando el importe correcto y con una confirmación clara.

### Reglas de negocio de referencia

| ID | Regla |
|---|---|
| RN-01 | Los importes se calculan en **centavos enteros**. |
| RN-02 | `SAVE10` descuenta 10 % del subtotal, **redondeado al centavo más cercano; las mitades suben** (0.5 ¢ → 1 ¢). |
| RN-03 | `FREESHIP` elimina el costo de envío. No otorga descuento. |
| RN-04 | Solo se admite **un cupón** por pedido. Un cupón inexistente es un error. Los cupones no distinguen mayúsculas ni espacios exteriores. |
| RN-05 | El envío cuesta $5.00. |
| RN-06 | Si el subtotal **después del descuento** es ≥ $100.00, el envío es gratis. |
| RN-07 | Las cantidades son **enteros entre 1 y 99**. |
| RN-08 | Un carrito vacío no genera pedido y no tiene importes ni envío. |
| RN-09 | Checkout: nombre, correo (con formato válido) y dirección son obligatorios. |
| RN-10 | Un pedido no puede enviarse dos veces mientras la solicitud está en curso. |
| RN-11 | El **servidor** vuelve a validar todo y calcula los importes; nunca confía en el cliente. |
| RN-12 | Impuestos: $0.00. |

Catálogo: Laptop Sleeve $30.00 · Wireless Mouse $25.00 · Mechanical Keyboard $60.00.

---

## Criterios de aceptación (Given–When–Then)

Convenciones: **U-nn** = prueba unitaria (Vitest, ver tabla al final) · **E2E nn** = prueba Playwright.

### AC-01 · Catálogo visible
- **Given** que abro MiniShop
- **When** carga la página
- **Then** veo los tres productos con su precio y un botón "Agregar al carrito", y el carrito aparece vacío.

*Pruebas:* `E2E 01`

### AC-02 · Agregar un producto
- **Given** un carrito vacío
- **When** agrego un *Wireless Mouse*
- **Then** aparece en el carrito con cantidad 1, subtotal $25.00, envío $5.00 y total $30.00.

*Pruebas:* `E2E 02` · U-01 (subtotal)

### AC-03 · Modificar cantidades
- **Given** un carrito con 1 *Laptop Sleeve*
- **When** aumento la cantidad a 2
- **Then** el subtotal es $60.00 y el total $65.00; al disminuir vuelve a $30.00 / $35.00.
- **And** no puedo disminuir por debajo de 1.

*Pruebas:* `E2E 03` · U-11 (cantidades válidas)

### AC-04 · Eliminar un producto
- **Given** un carrito con *Laptop Sleeve* y *Wireless Mouse*
- **When** elimino *Laptop Sleeve*
- **Then** desaparece del carrito, el subtotal pasa a $25.00 y el otro producto permanece.
- **And** al eliminar el último producto el carrito queda vacío, el total es $0.00 y el botón "Confirmar pedido" se deshabilita.

*Pruebas:* `E2E 04` · U-10 (carrito vacío)

### AC-05 · Cupón SAVE10
- **Given** un carrito con 2 *Laptop Sleeve* (subtotal $60.00)
- **When** aplico el cupón `SAVE10`
- **Then** el descuento es $6.00, el envío $5.00 y el total **$59.00**.

*Pruebas:* `E2E 05` · U-02 · U-09

### AC-06 · Cupón inválido
- **Given** un carrito con 1 *Laptop Sleeve*
- **When** aplico el cupón `NOEXISTE`
- **Then** veo un mensaje de error
- **And** los importes no cambian (subtotal $30.00, descuento $0.00, envío $5.00, total $35.00).

*Pruebas:* `E2E 06` · U-04

### AC-07 · Cupón FREESHIP
- **Given** un carrito con 1 *Laptop Sleeve* ($30.00)
- **When** aplico `FREESHIP`
- **Then** el envío es $0.00, no hay descuento y el total es $30.00.

*Pruebas:* `E2E 11` (primera parte) · U-07

### AC-08 · No combinar cupones
- **Given** que ya apliqué `FREESHIP`
- **When** intento aplicar `SAVE10`
- **Then** veo un error ("Solo se puede usar un cupón por pedido") y los importes siguen igual
- **And** si quito el primero, puedo aplicar el segundo.

*Pruebas:* `E2E 11` · U-04 (códigos combinados en un solo texto son inválidos)

### AC-09 · Envío gratis por monto mínimo (valor límite)
- **Given** un carrito con 3 *Wireless Mouse* ($75.00) con envío de $5.00
- **When** aumento a 4 unidades (exactamente $100.00)
- **Then** el envío es $0.00 y el total $100.00
- **And** si vuelvo a 3 unidades el envío vuelve a cobrarse.

*Pruebas:* `E2E 07` · U-05 · U-06 (valor límite $99.99 / $100.00)

### AC-10 · El umbral se evalúa después del descuento
- **Given** un carrito de $110.00 (2 *Laptop Sleeve* + 2 *Wireless Mouse*)
- **When** no hay cupón
- **Then** el envío es gratis
- **But when** aplico `SAVE10` (queda en $99.00)
- **Then** se cobra el envío de $5.00 y el total es $104.00.

*Pruebas:* U-08 (la regla es de cálculo puro; no tiene escenario E2E propio)

### AC-11 · Redondeo del descuento
- **Given** cualquier subtotal que genere fracciones de centavo al calcular 10 %
- **When** se aplica `SAVE10`
- **Then** el descuento se redondea al centavo más cercano, con las mitades hacia arriba (4 ¢ → 0 ¢ · 5 ¢ → 1 ¢ · 15 ¢ → 2 ¢ · 99 ¢ → 10 ¢).

*Pruebas:* U-03

### AC-12 · Cantidades y productos inválidos
- **Given** una solicitud con cantidad 0, negativa, decimal, `NaN` o mayor que 99, o con un producto inexistente
- **When** se calcula el precio o se crea el pedido
- **Then** se rechaza con un error de negocio (`INVALID_QUANTITY` / `UNKNOWN_PRODUCT`).

*Pruebas:* U-11 · U-12 · U-15 · `E2E 12`

### AC-13 · Validación del checkout
- **Given** un carrito con productos
- **When** presiono "Confirmar pedido" con los campos vacíos
- **Then** veo un error por cada campo ("El nombre es obligatorio.", "El correo electrónico es obligatorio.", "La dirección es obligatoria.") y no se crea ningún pedido
- **And when** escribo un correo con formato inválido (`ana@`)
- **Then** veo "Ingresa un correo electrónico válido." solo en ese campo.

*Pruebas:* `E2E 08` · U-13

### AC-14 · Compra exitosa
- **Given** 2 *Laptop Sleeve* con `SAVE10` aplicado y mis datos completos
- **When** confirmo el pedido
- **Then** veo "¡Pedido confirmado!", el número de pedido (`MS-1001`) y "Total pagado: $59.00"
- **And** el carrito queda vacío
- **And** el servidor guardó exactamente un pedido con esos importes.

*Pruebas:* `E2E 09` · U-14

### AC-15 · Prevención de pedidos duplicados
- **Given** un servidor que responde lentamente
- **When** hago doble clic (o clic insistente) en "Confirmar pedido"
- **Then** el botón y los campos se deshabilitan mientras se procesa
- **And** se envía **una sola** solicitud y el servidor guarda **un solo** pedido.

*Pruebas:* `E2E 10`

### AC-16 · El servidor valida por su cuenta
- **Given** un cliente que llama a la API saltándose la interfaz
- **When** envía un pedido con carrito vacío, cantidad negativa, cupón inexistente, correo inválido o producto desconocido
- **Then** el servidor responde `400` con el código de error correspondiente y no guarda nada
- **And** un pedido válido recibe `201` con los importes calculados por el servidor.

*Pruebas:* `E2E 12` · U-14 · U-15

### AC-17 · Un pedido inválido no consume número de pedido
- **Given** el servicio de pedidos
- **When** recibe una solicitud inválida
- **Then** no genera número de pedido y no guarda nada.

*Pruebas:* U-15 (usa un mock `vi.fn()` para verificarlo)

---

## Trazabilidad: nombres exactos de las pruebas

### Pruebas unitarias (Vitest)

| ID | Archivo | Nombre de la prueba |
|---|---|---|
| U-01 | `pricing.test.ts` | subtotal › suma precio × cantidad de varios productos distintos |
| U-02 | `pricing.test.ts` | descuento con cupón SAVE10 › descuenta el 10% del subtotal (2 Laptop Sleeve = $60.00 → -$6.00), sin importar mayúsculas ni espacios |
| U-03 | `pricing.test.ts` | descuento con cupón SAVE10 › redondea el descuento al centavo más cercano, con las mitades hacia arriba |
| U-04 | `pricing.test.ts` | descuento con cupón SAVE10 › rechaza cupones inexistentes y no permite combinar cupones en un solo código |
| U-05 | `pricing.test.ts` | envío › cobra $5.00 cuando el subtotal es menor a $100.00 y no hay cupón |
| U-06 | `pricing.test.ts` | envío › es gratis exactamente desde $100.00 y se cobra en $99.99 (valor límite) |
| U-07 | `pricing.test.ts` | envío › FREESHIP elimina el envío sin otorgar descuento |
| U-08 | `pricing.test.ts` | envío › evalúa el umbral de envío gratis DESPUÉS de aplicar el descuento |
| U-09 | `pricing.test.ts` | total › total = subtotal − descuento + envío (ejemplo del enunciado: $59.00) |
| U-10 | `pricing.test.ts` | carrito vacío › no tiene importes ni cobra envío, con o sin cupón |
| U-11 | `pricing.test.ts` | validación de entradas › solo acepta cantidades enteras entre 1 y 99 |
| U-12 | `pricing.test.ts` | validación de entradas › rechaza productos que no existen en el catálogo |
| U-13 | `checkout.test.ts` | validateCustomer › exige nombre, correo y dirección, y que el correo tenga formato válido |
| U-14 | `orders.test.ts` | createOrderService › crea el pedido con importes calculados por el servidor y el número que entrega el generador |
| U-15 | `orders.test.ts` | createOrderService › rechaza pedidos inválidos sin guardarlos ni consumir un número de pedido |

### Pruebas E2E (Playwright)

| ID | Archivo | Título |
|---|---|---|
| E2E 01 | `cart.spec.ts` | el catálogo muestra los productos con su nombre y precio |
| E2E 02 | `cart.spec.ts` | al agregar un producto aparece en el carrito con sus importes |
| E2E 03 | `cart.spec.ts` | al cambiar la cantidad se actualizan el subtotal y el total |
| E2E 04 | `cart.spec.ts` | al eliminar un producto desaparece del carrito y se recalculan los importes |
| E2E 05 | `cart.spec.ts` | el cupón SAVE10 aplica 10% de descuento (2 Laptop Sleeve → total $59.00) |
| E2E 06 | `cart.spec.ts` | un cupón inválido muestra un error y no modifica los importes |
| E2E 07 | `cart.spec.ts` | el envío es gratis desde $100.00 (valor límite exacto) y vuelve a cobrarse por debajo |
| E2E 08 | `checkout.spec.ts` | el checkout no deja confirmar con campos vacíos o con un correo inválido |
| E2E 09 | `checkout.spec.ts` | compra exitosa: muestra la confirmación con el número de pedido y vacía el carrito |
| E2E 10 | `checkout.spec.ts` | con un servidor lento, la interfaz impide enviar el mismo pedido dos veces |
| E2E 11 | `cart.spec.ts` | no se pueden combinar cupones: hay que quitar el actual para usar otro |
| E2E 12 | `api.spec.ts` | el servidor valida las reglas de negocio aunque el cliente las omita (API real) |
