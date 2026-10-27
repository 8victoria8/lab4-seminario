import { useState, type FormEvent } from 'react'
import { PricingError } from '../../shared/errors'
import { normalizeCouponCode } from '../../shared/rules'

interface Props {
  appliedCoupon: string | null
  /** Debe lanzar PricingError si el cupón no es válido. */
  validateCoupon: (code: string) => void
  onApply: (code: string) => void
  onRemove: () => void
}

export function CouponForm({ appliedCoupon, validateCoupon, onApply, onRemove }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (appliedCoupon) {
      setError(`Solo se puede usar un cupón por pedido. Quita "${appliedCoupon}" para aplicar otro.`)
      return
    }
    if (input.trim() === '') {
      setError('Escribe un código de cupón.')
      return
    }

    try {
      validateCoupon(input)
    } catch (caught) {
      if (!(caught instanceof PricingError)) throw caught
      setError(caught.message)
      return
    }

    onApply(normalizeCouponCode(input))
    setInput('')
    setError(null)
  }

  function handleRemove() {
    setError(null)
    onRemove()
  }

  return (
    <form onSubmit={handleSubmit} className="coupon" noValidate>
      <label htmlFor="coupon-code">Código de cupón</label>
      <div className="row">
        <input
          id="coupon-code"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          autoComplete="off"
          aria-invalid={error !== null}
          aria-describedby={error ? 'coupon-error' : undefined}
        />
        <button type="submit">Aplicar cupón</button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="error">
          {error}
        </p>
      )}
      {appliedCoupon && (
        <p role="status" className="success">
          Cupón aplicado: <strong>{appliedCoupon}</strong>{' '}
          <button type="button" className="link" onClick={handleRemove}>
            Quitar cupón
          </button>
        </p>
      )}
    </form>
  )
}
