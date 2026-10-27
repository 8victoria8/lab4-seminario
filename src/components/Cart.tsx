import type { Dispatch } from 'react'
import { formatCents } from '../../shared/money'
import { MAX_QUANTITY } from '../../shared/rules'
import type { CartItem, PriceBreakdown, Product } from '../../shared/types'
import type { CartAction } from '../cart'
import { CouponForm } from './CouponForm'

interface Props {
  items: CartItem[]
  products: Product[]
  pricing: PriceBreakdown
  appliedCoupon: string | null
  dispatch: Dispatch<CartAction>
  validateCoupon: (code: string) => void
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
}

export function Cart({
  items,
  products,
  pricing,
  appliedCoupon,
  dispatch,
  validateCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: Props) {
  return (
    <section aria-labelledby="cart-heading" className="panel">
      <h2 id="cart-heading">Carrito</h2>

      {items.length === 0 ? (
        <p className="muted">Tu carrito está vacío.</p>
      ) : (
        <ul className="cart-lines">
          {items.map((item) => {
            const product = products.find((candidate) => candidate.id === item.productId)
            if (!product) return null
            return (
              <li key={item.productId} className="cart-line">
                <div>
                  <strong>{product.name}</strong>
                  <div className="muted">{formatCents(product.priceCents)} c/u</div>
                </div>
                <div className="quantity">
                  <button
                    type="button"
                    aria-label={`Disminuir cantidad de ${product.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() => dispatch({ type: 'decrement', productId: item.productId })}
                  >
                    −
                  </button>
                  <span role="status" aria-label={`Cantidad de ${product.name}`}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Aumentar cantidad de ${product.name}`}
                    disabled={item.quantity >= MAX_QUANTITY}
                    onClick={() => dispatch({ type: 'increment', productId: item.productId })}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="link danger"
                  aria-label={`Eliminar ${product.name} del carrito`}
                  onClick={() => dispatch({ type: 'remove', productId: item.productId })}
                >
                  Eliminar
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <CouponForm
        appliedCoupon={appliedCoupon}
        validateCoupon={validateCoupon}
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
      />

      <table className="summary" aria-label="Resumen de importes">
        <tbody>
          <tr>
            <th scope="row">Subtotal</th>
            <td>{formatCents(pricing.subtotalCents)}</td>
          </tr>
          <tr>
            <th scope="row">Descuento</th>
            <td>{pricing.discountCents > 0 ? `-${formatCents(pricing.discountCents)}` : formatCents(0)}</td>
          </tr>
          <tr>
            <th scope="row">Envío</th>
            <td>{formatCents(pricing.shippingCents)}</td>
          </tr>
          <tr className="total">
            <th scope="row">Total</th>
            <td>{formatCents(pricing.totalCents)}</td>
          </tr>
        </tbody>
      </table>
      <p className="muted small">Envío $5.00. Gratis si el subtotal con descuento llega a $100.00.</p>
    </section>
  )
}
