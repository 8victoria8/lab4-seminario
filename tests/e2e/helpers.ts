import type { Page } from '@playwright/test'

/** Datos esperados escritos "a mano": las pruebas no deben importar las reglas que verifican. */
export const PRODUCT_NAMES = {
  sleeve: 'Laptop Sleeve',
  mouse: 'Wireless Mouse',
  keyboard: 'Mechanical Keyboard',
} as const

export const validCustomer = {
  name: 'Ana Pérez',
  email: 'ana@correo.com',
  address: 'Av. Siempre Viva 742',
}

export async function addToCart(page: Page, productName: string, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.getByRole('button', { name: `Agregar ${productName} al carrito` }).click()
  }
}

export function cart(page: Page) {
  return page.getByRole('region', { name: 'Carrito' })
}

/** La fila del carrito de un producto, localizada por su nombre visible. */
export function cartLine(page: Page, productName: string) {
  return cart(page)
    .getByRole('listitem')
    .filter({ has: page.getByText(productName, { exact: true }) })
}

export function quantityOf(page: Page, productName: string) {
  return cartLine(page, productName).getByRole('status', { name: `Cantidad de ${productName}` })
}

/** Celdas del resumen de importes: se leen con toHaveText('$59.00'). */
export function summary(page: Page) {
  const valueOf = (label: string) =>
    page
      .getByRole('row')
      .filter({ has: page.getByRole('rowheader', { name: label, exact: true }) })
      .getByRole('cell')

  return {
    subtotal: valueOf('Subtotal'),
    discount: valueOf('Descuento'),
    shipping: valueOf('Envío'),
    total: valueOf('Total'),
  }
}

export async function applyCoupon(page: Page, code: string) {
  await page.getByLabel('Código de cupón').fill(code)
  await page.getByRole('button', { name: 'Aplicar cupón' }).click()
}

export async function fillCheckoutForm(page: Page, customer = validCustomer) {
  await page.getByLabel('Nombre').fill(customer.name)
  await page.getByLabel('Correo electrónico').fill(customer.email)
  await page.getByLabel('Dirección').fill(customer.address)
}

export function confirmButton(page: Page) {
  return page.getByRole('button', { name: 'Confirmar pedido' })
}
