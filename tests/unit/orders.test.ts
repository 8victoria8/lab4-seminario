import { describe, expect, it, vi } from 'vitest'
import { createOrderService } from '../../server/orders'
import { SLEEVE, errorCodeOf } from './helpers'

const customer = { name: 'Ana Pérez', email: 'ana@correo.com', address: 'Av. Siempre Viva 742' }

describe('createOrderService', () => {
  // vi.fn() crea un MOCK: una función falsa que recuerda cómo la llamaron.
  // Así probamos el servicio sin depender de la numeración real y podemos
  // comprobar CUÁNDO se pide un número de pedido.

  it('crea el pedido con importes calculados por el servidor y el número que entrega el generador', () => {
    const generateOrderNumber = vi.fn(() => 'MS-TEST')
    const service = createOrderService(generateOrderNumber)

    const order = service.createOrder({
      items: [{ productId: SLEEVE, quantity: 2 }],
      couponCode: 'SAVE10',
      customer,
    })

    expect(order.orderNumber).toBe('MS-TEST')
    expect(order.pricing.totalCents).toBe(5900)
    expect(generateOrderNumber).toHaveBeenCalledTimes(1)
    expect(service.listOrders()).toEqual([order])
  })

  it('rechaza pedidos inválidos sin guardarlos ni consumir un número de pedido', () => {
    const generateOrderNumber = vi.fn(() => 'MS-TEST')
    const service = createOrderService(generateOrderNumber)
    const validItems = [{ productId: SLEEVE, quantity: 1 }]

    const invalidRequests = [
      { body: { items: [], couponCode: null, customer }, code: 'EMPTY_CART' },
      { body: { items: validItems, couponCode: null, customer: { ...customer, email: 'sin-formato' } }, code: 'INVALID_CUSTOMER' },
      { body: { items: [{ productId: SLEEVE, quantity: -1 }], couponCode: null, customer }, code: 'INVALID_QUANTITY' },
      { body: { items: validItems, couponCode: 'NOEXISTE', customer }, code: 'INVALID_COUPON' },
      { body: 'no soy un objeto', code: 'INVALID_REQUEST' },
    ]

    for (const { body, code } of invalidRequests) {
      expect(errorCodeOf(() => service.createOrder(body))).toBe(code)
    }
    expect(generateOrderNumber).not.toHaveBeenCalled()
    expect(service.listOrders()).toEqual([])
  })
})
