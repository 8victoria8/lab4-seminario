import { useRef, useState, type FormEvent } from 'react'
import { validateCustomer, type CustomerErrors } from '../../shared/checkout'
import type { Customer } from '../../shared/types'

interface Props {
  cartIsEmpty: boolean
  /** Envía el pedido. Debe lanzar Error con un mensaje legible si falla. */
  onSubmit: (customer: Customer) => Promise<void>
}

export function Checkout({ cartIsEmpty, onSubmit }: Props) {
  const [customer, setCustomer] = useState<Customer>({ name: '', email: '', address: '' })
  const [errors, setErrors] = useState<CustomerErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Candado síncrono: bloquea un segundo envío aunque React aún no haya re-renderizado.
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return

    const validationErrors = validateCustomer(customer)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(customer)
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'No se pudo crear el pedido.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function field(name: keyof Customer, label: string, type = 'text') {
    const errorId = `${name}-error`
    return (
      <div className="field">
        <label htmlFor={`customer-${name}`}>{label}</label>
        <input
          id={`customer-${name}`}
          type={type}
          value={customer[name]}
          onChange={(event) => setCustomer({ ...customer, [name]: event.target.value })}
          aria-invalid={errors[name] !== undefined}
          aria-describedby={errors[name] ? errorId : undefined}
          disabled={submitting}
        />
        {errors[name] && (
          <p id={errorId} className="error">
            {errors[name]}
          </p>
        )}
      </div>
    )
  }

  return (
    <section aria-labelledby="checkout-heading" className="panel">
      <h2 id="checkout-heading">Checkout</h2>
      <form onSubmit={handleSubmit} noValidate>
        {field('name', 'Nombre')}
        {field('email', 'Correo electrónico', 'email')}
        {field('address', 'Dirección')}

        {submitError && (
          <p role="alert" className="error">
            {submitError}
          </p>
        )}

        <button type="submit" className="primary" disabled={cartIsEmpty || submitting}>
          {submitting ? 'Procesando…' : 'Confirmar pedido'}
        </button>
        {cartIsEmpty && <p className="muted small">Agrega productos al carrito para poder confirmar.</p>}
      </form>
    </section>
  )
}
