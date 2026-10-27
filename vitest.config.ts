import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Solo la lógica de negocio: las rutas Express y la UI las cubren las pruebas E2E.
      include: ['shared/pricing.ts', 'shared/checkout.ts', 'shared/rules.ts', 'server/orders.ts'],
      reporter: ['text', 'html'],
    },
  },
})
