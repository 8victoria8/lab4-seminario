import { PRODUCTS } from './catalog'
import { PricingError } from './errors'
import { FREE_SHIPPING_THRESHOLD_CENTS, MAX_QUANTITY, SHIPPING_COST_CENTS, normalizeCouponCode } from './rules'
import type { CartItem, PriceBreakdown, Product } from './types'

// VERSIÓN A (antes del refactor): funciona correctamente, pero es difícil de leer y mantener.
export function calculatePricing(
  items: CartItem[],
  couponCode?: string | null,
  catalog: readonly Product[] = PRODUCTS,
): PriceBreakdown {
  let subtotal = 0
  let discount = 0
  let shipping: number
  let freeShippingCoupon = false

  if (items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= MAX_QUANTITY) {
        let price = -1
        for (let j = 0; j < catalog.length; j++) {
          if (catalog[j].id === item.productId) {
            price = catalog[j].priceCents
          }
        }
        if (price >= 0) {
          subtotal = subtotal + price * item.quantity
        } else {
          throw new PricingError('UNKNOWN_PRODUCT', 'El producto "' + item.productId + '" no existe.')
        }
      } else {
        throw new PricingError('INVALID_QUANTITY', 'La cantidad debe ser un entero entre 1 y ' + MAX_QUANTITY + '.')
      }
    }
  }

  if (couponCode !== undefined && couponCode !== null && normalizeCouponCode(couponCode) !== '') {
    if (normalizeCouponCode(couponCode) === 'SAVE10') {
      if (subtotal > 0) {
        // 10% del subtotal, redondeado al centavo más cercano (mitades hacia arriba).
        discount = Math.floor((subtotal * 10 + 50) / 100)
      }
    } else {
      if (normalizeCouponCode(couponCode) === 'FREESHIP') {
        freeShippingCoupon = true
      } else {
        throw new PricingError('INVALID_COUPON', 'El cupón "' + couponCode.trim() + '" no es válido.')
      }
    }
  }

  if (subtotal === 0) {
    shipping = 0
  } else {
    if (freeShippingCoupon) {
      shipping = 0
    } else {
      if (subtotal - discount >= FREE_SHIPPING_THRESHOLD_CENTS) {
        shipping = 0
      } else {
        shipping = SHIPPING_COST_CENTS
      }
    }
  }

  const total = subtotal - discount + shipping

  return {
    subtotalCents: subtotal,
    discountCents: discount,
    shippingCents: shipping,
    totalCents: total,
  }
}
