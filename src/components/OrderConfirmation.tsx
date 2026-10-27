import { formatCents } from '../../shared/money'
import type { Order } from '../../shared/types'

interface Props {
  order: Order
  onContinue: () => void
}

export function OrderConfirmation({ order, onContinue }: Props) {
  return (
    <section aria-labelledby="confirmation-heading" className="panel confirmation">
      <h2 id="confirmation-heading">¡Pedido confirmado!</h2>
      <p>
        Número de pedido: <strong>{order.orderNumber}</strong>
      </p>
      <p>Total pagado: {formatCents(order.pricing.totalCents)}</p>
      <p className="muted">Enviaremos la confirmación a {order.customer.email}.</p>
      <button type="button" className="primary" onClick={onContinue}>
        Seguir comprando
      </button>
    </section>
  )
}
