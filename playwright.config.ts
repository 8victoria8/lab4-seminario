import { defineConfig, devices } from '@playwright/test'

// Puertos propios para las pruebas: no chocan con `npm run dev` (5173 / 3001).
const API_PORT = 3101
const WEB_PORT = 5174
const baseURL = `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: './tests/e2e',

  // El servidor guarda los pedidos en memoria y es UNO SOLO para todas las pruebas.
  // Con un único worker, cada prueba reinicia ese estado sin pisar a otra (ver fixtures.ts).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0, // una prueba E2E que necesita reintentos esconde un problema real

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'retain-on-failure', // npm run test:e2e:trace -- <ruta al trace.zip>
    screenshot: 'only-on-failure',
    // Video desactivado a propósito: en Windows, cerrar el contexto grabando video añadía ~5 s
    // a ~3 % de las pruebas. El trace ya muestra cada paso; si quieres video: 'retain-on-failure'.
    video: 'off',
    // Para verlo en cámara lenta: SLOW_MO=500 npm run test:e2e:headed
    launchOptions: { slowMo: Number(process.env.SLOW_MO ?? 0) },
  },

  // `npm run test:e2e` usa solo Chromium. Firefox y WebKit son opcionales
  // (npm run test:e2e:firefox / test:e2e:webkit / test:e2e:all-browsers).
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Playwright levanta la API REAL (con las rutas de test habilitadas) y el frontend.
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { PORT: String(API_PORT), NODE_ENV: 'test' },
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: baseURL,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
    },
  ],
})
