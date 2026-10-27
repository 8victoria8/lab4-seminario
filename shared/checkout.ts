import type { Customer } from './types'

export type CustomerErrors = Partial<Record<keyof Customer, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Devuelve un mensaje por campo inválido. Un objeto vacío significa "todo correcto". */
export function validateCustomer(customer: Customer): CustomerErrors {
  const errors: CustomerErrors = {}

  if (customer.name.trim() === '') {
    errors.name = 'El nombre es obligatorio.'
  }

  if (customer.email.trim() === '') {
    errors.email = 'El correo electrónico es obligatorio.'
  } else if (!EMAIL_PATTERN.test(customer.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.'
  }

  if (customer.address.trim() === '') {
    errors.address = 'La dirección es obligatoria.'
  }

  return errors
}
