import type { CartItem } from '../../shared/types'

export const SLEEVE = 'laptop-sleeve' // $30.00
export const MOUSE = 'wireless-mouse' // $25.00
export const KEYBOARD = 'mechanical-keyboard' // $60.00

/** Atajo para escribir una línea del carrito: line(MOUSE, 2). */
export function line(productId: string, quantity: number): CartItem {
  return { productId, quantity }
}

/**
 * Ejecuta `action` y devuelve el `code` del error lanzado (o undefined si no falló).
 * Probamos el CÓDIGO del error y no su mensaje: el texto puede cambiar sin cambiar la regla.
 */
export function errorCodeOf(action: () => unknown): string | undefined {
  try {
    action()
  } catch (error) {
    return (error as { code?: string }).code
  }
  return undefined
}
