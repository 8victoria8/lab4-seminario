import express, { type ErrorRequestHandler } from 'express'
import { PRODUCTS } from '../shared/catalog'
import { PricingError } from '../shared/errors'
import { OrderError, createOrderService, type OrderService } from './orders'

export interface AppOptions {
  /** Habilita /api/test/*. Solo debe estar activo en el ambiente de pruebas. */
  enableTestRoutes?: boolean
}

export function createApp({ enableTestRoutes = process.env.NODE_ENV === 'test' }: AppOptions = {}) {
  const app = express()
  let orderService: OrderService = createOrderService()

  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/api/products', (_req, res) => {
    res.json(PRODUCTS)
  })

  app.post('/api/orders', (req, res) => {
    const order = orderService.createOrder(req.body)
    res.status(201).json(order)
  })

  if (enableTestRoutes) {
    // Reinicia el estado en memoria para que cada prueba E2E parta de cero.
    app.post('/api/test/reset', (_req, res) => {
      orderService = createOrderService()
      res.status(204).end()
    })

    // Permite a las pruebas comprobar qué guardó realmente el servidor.
    app.get('/api/test/orders', (_req, res) => {
      res.json(orderService.listOrders())
    })
  }

  const handleErrors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof OrderError) {
      res.status(400).json({ error: { code: error.code, message: error.message, fields: error.fields } })
    } else if (error instanceof PricingError) {
      res.status(400).json({ error: { code: error.code, message: error.message } })
    } else if (error instanceof SyntaxError) {
      res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'El JSON enviado no es válido.' } })
    } else {
      console.error(error)
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' } })
    }
  }
  app.use(handleErrors)

  return app
}
