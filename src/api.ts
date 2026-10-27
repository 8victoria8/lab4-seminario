import type { Order, OrderRequest, Product } from '../shared/types'

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products')
  if (!response.ok) throw new Error('No se pudo cargar el catálogo.')
  return (await response.json()) as Product[]
}

export async function createOrder(request: OrderRequest): Promise<Order> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(errorMessage(body) ?? 'No se pudo crear el pedido.')
  }
  return body as Order
}

function errorMessage(body: unknown): string | null {
  const message = (body as { error?: { message?: unknown } } | null)?.error?.message
  return typeof message === 'string' ? message : null
}
