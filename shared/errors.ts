export type PricingErrorCode = 'INVALID_QUANTITY' | 'UNKNOWN_PRODUCT' | 'INVALID_COUPON'

/** Error de regla de negocio. `code` es estable (para pruebas); `message` es para personas. */
export class PricingError extends Error {
  readonly code: PricingErrorCode

  constructor(code: PricingErrorCode, message: string) {
    super(message)
    this.name = 'PricingError'
    this.code = code
  }
}
