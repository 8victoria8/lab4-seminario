import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Puertos configurables para que Playwright pueda levantar su propia copia
// de la app sin chocar con `npm run dev`.
const apiPort = process.env.API_PORT ?? '3001'
const proxy = { '/api': `http://localhost:${apiPort}` }

export default defineConfig({
  plugins: [react()],
  // Pre-empaqueta React al arrancar: evita recargas de página a mitad de una prueba en la primera ejecución.
  optimizeDeps: { include: ['react', 'react-dom/client'] },
  server: { port: 5173, proxy },
  preview: { proxy },
})
