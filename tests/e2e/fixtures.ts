import { test as base, expect } from '@playwright/test'

/**
 * `test` extendido: ANTES DE CADA PRUEBA reinicia el estado del servidor
 * (pedidos y numeración) mediante la ruta que solo existe cuando NODE_ENV=test.
 * Así cada prueba es independiente y el primer pedido siempre es MS-1001.
 */
export const test = base.extend<{ resetServerState: void }>({
  resetServerState: [
    async ({ request }, use) => {
      const response = await request.post('/api/test/reset')
      expect(response.status()).toBe(204)
      await use()
    },
    { auto: true },
  ],
})

export { expect }
