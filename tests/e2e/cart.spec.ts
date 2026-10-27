import { expect, test } from './fixtures'
import { PRODUCT_NAMES, addToCart, applyCoupon, cart, cartLine, quantityOf, summary } from './helpers'

// Cada prueba recorre el navegador real -> Vite -> API Express real (sin respuestas simuladas).
// Las esperas son automáticas: `expect(...)` reintenta hasta que se cumple o vence el timeout.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('E2E 01 · el catálogo muestra los productos con su nombre y precio', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'MiniShop' })).toBeVisible()

  const products = page.getByRole('region', { name: 'Catálogo' }).getByRole('listitem')
  await expect(products).toHaveCount(3)

  const expected = [
    { name: 'Laptop Sleeve', price: '$30.00' },
    { name: 'Wireless Mouse', price: '$25.00' },
    { name: 'Mechanical Keyboard', price: '$60.00' },
  ]
  for (const { name, price } of expected) {
    const product = products.filter({ hasText: name })
    await expect(product).toContainText(price)
    await expect(product.getByRole('button', { name: `Agregar ${name} al carrito` })).toBeEnabled()
  }

  await expect(cart(page)).toContainText('Tu carrito está vacío.')
})

test('E2E 02 · al agregar un producto aparece en el carrito con sus importes', async ({ page }) => {
  await addToCart(page, PRODUCT_NAMES.mouse)

  await expect(cartLine(page, PRODUCT_NAMES.mouse)).toBeVisible()
  await expect(quantityOf(page, PRODUCT_NAMES.mouse)).toHaveText('1')

  const totals = summary(page)
  await expect(totals.subtotal).toHaveText('$25.00')
  await expect(totals.shipping).toHaveText('$5.00')
  await expect(totals.total).toHaveText('$30.00')
})

test('E2E 03 · al cambiar la cantidad se actualizan el subtotal y el total', async ({ page }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve)
  const totals = summary(page)
  const decrease = page.getByRole('button', { name: 'Disminuir cantidad de Laptop Sleeve' })

  // Con cantidad 1 no se puede disminuir (las cantidades son enteros positivos).
  await expect(decrease).toBeDisabled()

  await page.getByRole('button', { name: 'Aumentar cantidad de Laptop Sleeve' }).click()
  await expect(quantityOf(page, PRODUCT_NAMES.sleeve)).toHaveText('2')
  await expect(totals.subtotal).toHaveText('$60.00')
  await expect(totals.total).toHaveText('$65.00')

  await decrease.click()
  await expect(quantityOf(page, PRODUCT_NAMES.sleeve)).toHaveText('1')
  await expect(totals.subtotal).toHaveText('$30.00')
  await expect(totals.total).toHaveText('$35.00')
})

test('E2E 04 · al eliminar un producto desaparece del carrito y se recalculan los importes', async ({ page }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve)
  await addToCart(page, PRODUCT_NAMES.mouse)
  await expect(cart(page).getByRole('listitem')).toHaveCount(2)

  await page.getByRole('button', { name: 'Eliminar Laptop Sleeve del carrito' }).click()
  await expect(cartLine(page, PRODUCT_NAMES.sleeve)).toHaveCount(0)
  await expect(cartLine(page, PRODUCT_NAMES.mouse)).toBeVisible()
  await expect(summary(page).subtotal).toHaveText('$25.00')

  // Al quitar el último producto el carrito queda vacío y no se puede confirmar.
  await page.getByRole('button', { name: 'Eliminar Wireless Mouse del carrito' }).click()
  await expect(cart(page)).toContainText('Tu carrito está vacío.')
  await expect(summary(page).total).toHaveText('$0.00')
  await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled()
})

test('E2E 05 · el cupón SAVE10 aplica 10% de descuento (2 Laptop Sleeve → total $59.00)', async ({ page }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve, 2)

  await applyCoupon(page, 'SAVE10')

  await expect(page.getByRole('status').filter({ hasText: 'Cupón aplicado: SAVE10' })).toBeVisible()
  const totals = summary(page)
  await expect(totals.subtotal).toHaveText('$60.00')
  await expect(totals.discount).toHaveText('-$6.00')
  await expect(totals.shipping).toHaveText('$5.00')
  await expect(totals.total).toHaveText('$59.00')
})

test('E2E 06 · un cupón inválido muestra un error y no modifica los importes', async ({ page }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve)

  await applyCoupon(page, 'NOEXISTE')

  await expect(page.getByRole('alert')).toContainText('no es válido')
  await expect(page.getByText('Cupón aplicado')).toHaveCount(0)
  const totals = summary(page)
  await expect(totals.subtotal).toHaveText('$30.00')
  await expect(totals.discount).toHaveText('$0.00')
  await expect(totals.shipping).toHaveText('$5.00')
  await expect(totals.total).toHaveText('$35.00')
})

test('E2E 07 · el envío es gratis desde $100.00 (valor límite exacto) y vuelve a cobrarse por debajo', async ({ page }) => {
  const totals = summary(page)

  // 3 × $25.00 = $75.00 → todavía se cobra el envío
  await addToCart(page, PRODUCT_NAMES.mouse, 3)
  await expect(totals.subtotal).toHaveText('$75.00')
  await expect(totals.shipping).toHaveText('$5.00')

  // 4 × $25.00 = $100.00 exactos → envío gratis
  await page.getByRole('button', { name: 'Aumentar cantidad de Wireless Mouse' }).click()
  await expect(totals.subtotal).toHaveText('$100.00')
  await expect(totals.shipping).toHaveText('$0.00')
  await expect(totals.total).toHaveText('$100.00')

  // Si baja de $100.00 el envío vuelve a cobrarse
  await page.getByRole('button', { name: 'Disminuir cantidad de Wireless Mouse' }).click()
  await expect(totals.shipping).toHaveText('$5.00')
})

test('E2E 11 · no se pueden combinar cupones: hay que quitar el actual para usar otro', async ({ page }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve)
  const totals = summary(page)

  await applyCoupon(page, 'FREESHIP')
  await expect(totals.shipping).toHaveText('$0.00')
  await expect(totals.total).toHaveText('$30.00')

  // Segundo cupón: se rechaza y los importes siguen igual
  await applyCoupon(page, 'SAVE10')
  await expect(page.getByRole('alert')).toContainText('Solo se puede usar un cupón por pedido')
  await expect(page.getByRole('status').filter({ hasText: 'Cupón aplicado: FREESHIP' })).toBeVisible()
  await expect(totals.discount).toHaveText('$0.00')
  await expect(totals.total).toHaveText('$30.00')

  // Quitando el primero ya se puede usar el segundo: 30.00 − 3.00 + 5.00
  await page.getByRole('button', { name: 'Quitar cupón' }).click()
  await applyCoupon(page, 'SAVE10')
  await expect(totals.discount).toHaveText('-$3.00')
  await expect(totals.total).toHaveText('$32.00')
})
