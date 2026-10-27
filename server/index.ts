import { createApp } from './app'

const port = Number(process.env.PORT ?? 3001)

createApp().listen(port, () => {
  const mode = process.env.NODE_ENV === 'test' ? ' (rutas de test habilitadas)' : ''
  console.log(`MiniShop API escuchando en http://localhost:${port}${mode}`)
})
