import type { Order } from '../../shared/types'
import { expect, test } from './fixtures'
import {
  PRODUCT_NAMES,
  addToCart,
  applyCoupon,
  cart,
  confirmButton,
  fillCheckoutForm,
  validCustomer,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('E2E 08 · el checkout no deja confirmar con campos vacíos o con un correo inválido', async ({ page, request }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve)

  // 1) Todo vacío → un error por campo
  await confirmButton(page).click()
  await expect(page.getByText('El nombre es obligatorio.')).toBeVisible()
  await expect(page.getByText('El correo electrónico es obligatorio.')).toBeVisible()
  await expect(page.getByText('La dirección es obligatoria.')).toBeVisible()
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toHaveCount(0)

  // 2) Correo con formato inválido → solo falla ese campo
  await fillCheckoutForm(page, { ...validCustomer, email: 'ana@' })
  await confirmButton(page).click()
  await expect(page.getByText('Ingresa un correo electrónico válido.')).toBeVisible()
  await expect(page.getByText('El nombre es obligatorio.')).toHaveCount(0)
  await expect(page.getByText('La dirección es obligatoria.')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toHaveCount(0)

  // El servidor no recibió ningún pedido
  const orders = await (await request.get('/api/test/orders')).json()
  expect(orders).toHaveLength(0)
})

test('E2E 09 · compra exitosa: muestra la confirmación con el número de pedido y vacía el carrito', async ({ page, request }) => {
  await addToCart(page, PRODUCT_NAMES.sleeve, 2)
  await applyCoupon(page, 'SAVE10')
  await fillCheckoutForm(page)

  await confirmButton(page).click()

  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible()
  await expect(page.getByText('MS-1001')).toBeVisible()
  await expect(page.getByText('Total pagado: $59.00')).toBeVisible()
  await expect(cart(page)).toContainText('Tu carrito está vacío.')

  // Comprobamos también lo que realmente guardó el servidor (calculado por él, no por React)
  const orders: Order[] = await (await request.get('/api/test/orders')).json()
  expect(orders).toHaveLength(1)
  expect(orders[0]).toMatchObject({
    orderNumber: 'MS-1001',
    couponCode: 'SAVE10',
    customer: validCustomer,
    pricing: { subtotalCents: 6000, discountCents: 600, shippingCents: 500, totalCents: 5900 },
  })
})

test('E2E 10 · con un servidor lento, la interfaz impide enviar el mismo pedido dos veces', async ({ page, request }) => {
  // MOCK DE RED (único uso de page.route en la suite): retenemos la respuesta de
  // POST /api/orders para simular un servidor lento. La petición, cuando la liberamos,
  // sigue yendo a la API real (route.continue), solo controlamos CUÁNDO.
  // Usamos una "compuerta" (promesa) en vez de un sleep: así la prueba es determinista.
  let ordersRequested = 0
  let openGate!: () => void
  const gate = new Promise<void>((resolve) => {
    openGate = resolve
  })
  await page.route('**/api/orders', async (route) => {
    ordersRequested++
    await gate
    await route.continue()
  })

  await addToCart(page, PRODUCT_NAMES.keyboard)
  await fillCheckoutForm(page)

  // Doble clic rápido sobre "Confirmar pedido"
  await confirmButton(page).dblclick()

  // Mientras espera la respuesta, el botón queda deshabilitado y los campos también
  const processing = page.getByRole('button', { name: 'Procesando…' })
  await expect(processing).toBeDisabled()
  await expect(page.getByLabel('Nombre')).toBeDisabled()

  // El usuario insiste con un clic forzado: tampoco debe generar otra petición
  await processing.click({ force: true })

  // Liberamos la respuesta lenta y esperamos la confirmación
  openGate()
  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible()

  // Se hizo UNA sola petición y el servidor guardó UN solo pedido
  expect(ordersRequested).toBe(1)
  const orders = await (await request.get('/api/test/orders')).json()
  expect(orders).toHaveLength(1)
})
