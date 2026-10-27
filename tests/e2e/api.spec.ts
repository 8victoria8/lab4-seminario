import type { Order, Product } from '../../shared/types'
import { expect, test } from './fixtures'
import { validCustomer } from './helpers'

// Esta prueba NO usa el navegador: llama a la API real como lo haría un cliente
// malicioso o con un bug, saltándose React. Demuestra que el servidor vuelve a
// validar las reglas de negocio y que nunca confía en lo que hizo el frontend.

test('E2E 12 · el servidor valida las reglas de negocio aunque el cliente las omita (API real)', async ({ request }) => {
  const postOrder = (data: unknown) => request.post('/api/orders', { data })
  const sleeve = { productId: 'laptop-sleeve', quantity: 1 }

  const products: Product[] = await (await request.get('/api/products')).json()
  expect(products.map((product) => product.name)).toEqual(['Laptop Sleeve', 'Wireless Mouse', 'Mechanical Keyboard'])

  const rejected = [
    { name: 'carrito vacío', data: { items: [], couponCode: null, customer: validCustomer }, code: 'EMPTY_CART' },
    { name: 'cantidad negativa', data: { items: [{ ...sleeve, quantity: -1 }], couponCode: null, customer: validCustomer }, code: 'INVALID_QUANTITY' },
    { name: 'cupón inexistente', data: { items: [sleeve], couponCode: 'GRATIS', customer: validCustomer }, code: 'INVALID_COUPON' },
    { name: 'correo inválido', data: { items: [sleeve], couponCode: null, customer: { ...validCustomer, email: 'x' } }, code: 'INVALID_CUSTOMER' },
    { name: 'producto desconocido', data: { items: [{ productId: 'hackeado', quantity: 1 }], couponCode: null, customer: validCustomer }, code: 'UNKNOWN_PRODUCT' },
  ]
  for (const { name, data, code } of rejected) {
    const response = await postOrder(data)
    expect(response.status(), name).toBe(400)
    expect((await response.json()).error.code, name).toBe(code)
  }

  // Ninguna solicitud rechazada dejó rastro
  expect(await (await request.get('/api/test/orders')).json()).toHaveLength(0)

  // Un pedido válido: el servidor calcula los importes por su cuenta
  const created = await postOrder({ items: [{ ...sleeve, quantity: 2 }], couponCode: 'save10', customer: validCustomer })
  expect(created.status()).toBe(201)
  const order: Order = await created.json()
  expect(order.orderNumber).toBe('MS-1001')
  expect(order.pricing).toEqual({ subtotalCents: 6000, discountCents: 600, shippingCents: 500, totalCents: 5900 })
})
