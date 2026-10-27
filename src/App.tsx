import { useEffect, useMemo, useReducer, useState } from 'react'
import { calculatePricing } from '../shared/pricing'
import type { Customer, Order, Product } from '../shared/types'
import { createOrder, fetchProducts } from './api'
import { cartReducer } from './cart'
import { Cart } from './components/Cart'
import { Checkout } from './components/Checkout'
import { OrderConfirmation } from './components/OrderConfirmation'
import { ProductList } from './components/ProductList'

export function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [items, dispatch] = useReducer(cartReducer, [])
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((error: Error) => setLoadError(error.message))
  }, [])

  // Las reglas de precio viven en shared/: el servidor las vuelve a aplicar al crear el pedido.
  const pricing = useMemo(() => calculatePricing(items, couponCode, products), [items, couponCode, products])

  async function placeOrder(customer: Customer) {
    const order = await createOrder({ items, couponCode, customer })
    setConfirmedOrder(order)
    dispatch({ type: 'clear' })
    setCouponCode(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>MiniShop</h1>
        <p className="muted">Laboratorio de calidad de software</p>
      </header>

      {loadError && (
        <p role="alert" className="error">
          {loadError}
        </p>
      )}

      <main className="layout">
        <ProductList products={products} onAdd={(productId) => dispatch({ type: 'add', productId })} />

        <div className="sidebar">
          <Cart
            items={items}
            products={products}
            pricing={pricing}
            appliedCoupon={couponCode}
            dispatch={dispatch}
            validateCoupon={(code) => calculatePricing(items, code, products)}
            onApplyCoupon={setCouponCode}
            onRemoveCoupon={() => setCouponCode(null)}
          />
          {confirmedOrder ? (
            <OrderConfirmation order={confirmedOrder} onContinue={() => setConfirmedOrder(null)} />
          ) : (
            <Checkout cartIsEmpty={items.length === 0} onSubmit={placeOrder} />
          )}
        </div>
      </main>
    </div>
  )
}
