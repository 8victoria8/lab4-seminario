import { describe, expect, it } from 'vitest'
import { validateCustomer } from '../../shared/checkout'

describe('validateCustomer', () => {
  it('exige nombre, correo y dirección, y que el correo tenga formato válido', () => {
    const empty = validateCustomer({ name: '', email: '', address: '' })
    expect(Object.keys(empty).sort()).toEqual(['address', 'email', 'name'])

    // Solo espacios cuenta como vacío
    expect(validateCustomer({ name: '   ', email: 'ana@correo.com', address: 'Calle 1' }).name).toBeDefined()

    // Correo mal formado: es el único campo con error
    const badEmail = validateCustomer({ name: 'Ana', email: 'ana@', address: 'Calle 1' })
    expect(Object.keys(badEmail)).toEqual(['email'])

    expect(validateCustomer({ name: 'Ana', email: 'ana@correo.com', address: 'Calle 1' })).toEqual({})
  })
})
