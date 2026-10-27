import { calculatePricing } from '../shared/pricing'
import { validateCustomer, type CustomerErrors } from '../shared/checkout'
import type { CartItem, Customer, Order } from '../shared/types'

export type OrderErrorCode = 'INVALID_REQUEST' | 'EMPTY_CART' | 'INVALID_CUSTOMER'

export class OrderError extends Error {
  readonly code: OrderErrorCode
  readonly fields?: CustomerErrors

  constructor(code: OrderErrorCode, message: string, fields?: CustomerErrors) {
    super(message)
    this.name = 'OrderError'
    this.code = code
    this.fields = fields
  }
}

export interface OrderService {
  createOrder(body: unknown): Order
  listOrders(): Order[]
}

/** MS-1001, MS-1002, ... (determinista: reiniciar el servicio reinicia la secuencia). */
export function createOrderNumberSequence(start = 1001): () => string {
  let next = start
  return () => `MS-${next++}`
}

/**
 * Servicio de pedidos con almacenamiento en memoria.
 * `generateOrderNumber` se inyecta para poder reemplazarlo por un mock en las pruebas.
 */
export function createOrderService(
  generateOrderNumber: () => string = createOrderNumberSequence(),
): OrderService {
  const orders: Order[] = []

  return {
    createOrder(body) {
      const request = parseRequest(body)

      if (request.items.length === 0) {
        throw new OrderError('EMPTY_CART', 'El carrito está vacío: no se puede crear un pedido.')
      }

      const customerErrors = validateCustomer(request.customer)
      if (Object.keys(customerErrors).length > 0) {
        throw new OrderError('INVALID_CUSTOMER', 'Los datos del cliente no son válidos.', customerErrors)
      }

      // Los importes SIEMPRE los calcula el servidor; nunca se confía en el cliente.
      const pricing = calculatePricing(request.items, request.couponCode)

      const order: Order = {
        orderNumber: generateOrderNumber(),
        items: request.items,
        couponCode: request.couponCode,
        customer: {
          name: request.customer.name.trim(),
          email: request.customer.email.trim(),
          address: request.customer.address.trim(),
        },
        pricing,
      }
      orders.push(order)
      return order
    },

    listOrders() {
      return [...orders]
    },
  }
}

// ---- Validación de la forma del JSON recibido (es `unknown`: viene de la red) ----

interface ParsedRequest {
  items: CartItem[]
  couponCode: string | null
  customer: Customer
}

function invalid(message: string): OrderError {
  return new OrderError('INVALID_REQUEST', message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRequest(body: unknown): ParsedRequest {
  if (!isRecord(body)) throw invalid('El cuerpo de la solicitud debe ser un objeto JSON.')
  if (!Array.isArray(body.items)) throw invalid('"items" debe ser una lista.')
  if (!isRecord(body.customer)) throw invalid('"customer" es obligatorio.')

  return {
    items: body.items.map(parseItem),
    couponCode: parseCouponCode(body.couponCode),
    customer: parseCustomer(body.customer),
  }
}

function parseCouponCode(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw invalid('"couponCode" debe ser un texto o null.')
  return value
}

function parseCustomer(customer: Record<string, unknown>): Customer {
  const text = (value: unknown) => (typeof value === 'string' ? value : '')
  return { name: text(customer.name), email: text(customer.email), address: text(customer.address) }
}

function parseItem(item: unknown): CartItem {
  if (!isRecord(item) || typeof item.productId !== 'string' || typeof item.quantity !== 'number') {
    throw invalid('Cada item debe tener "productId" (texto) y "quantity" (número).')
  }
  return { productId: item.productId, quantity: item.quantity }
}
