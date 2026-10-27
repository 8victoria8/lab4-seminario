// Constantes de las reglas de negocio de MiniShop (importes en centavos).

/** Costo de envío estándar: $5.00 */
export const SHIPPING_COST_CENTS = 500

/** Si el subtotal DESPUÉS del descuento alcanza $100.00, el envío es gratis. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 10_000

/** Cantidad máxima por línea del carrito (evita desbordes y abusos). */
export const MAX_QUANTITY = 99

/** Los cupones no distinguen mayúsculas/minúsculas ni espacios alrededor. */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}
