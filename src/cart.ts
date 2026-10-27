import { MAX_QUANTITY } from '../shared/rules'
import type { CartItem } from '../shared/types'

export type CartAction =
  | { type: 'add'; productId: string }
  | { type: 'increment'; productId: string }
  | { type: 'decrement'; productId: string }
  | { type: 'remove'; productId: string }
  | { type: 'clear' }

/** Reducer puro del carrito: la cantidad siempre queda entre 1 y MAX_QUANTITY. */
export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add':
      return items.some((item) => item.productId === action.productId)
        ? changeQuantity(items, action.productId, +1)
        : [...items, { productId: action.productId, quantity: 1 }]
    case 'increment':
      return changeQuantity(items, action.productId, +1)
    case 'decrement':
      return changeQuantity(items, action.productId, -1)
    case 'remove':
      return items.filter((item) => item.productId !== action.productId)
    case 'clear':
      return []
  }
}

function changeQuantity(items: CartItem[], productId: string, delta: number): CartItem[] {
  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, item.quantity + delta)) }
      : item,
  )
}
