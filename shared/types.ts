// Modelos compartidos entre el frontend (src/) y el servidor (server/).
// Todos los importes se expresan en CENTAVOS ENTEROS (ej.: $30.00 = 3000).

export interface Product {
  id: string
  name: string
  priceCents: number
}

export interface CartItem {
  productId: string
  quantity: number
}

export interface PriceBreakdown {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
}

export interface Customer {
  name: string
  email: string
  address: string
}

export interface OrderRequest {
  items: CartItem[]
  couponCode: string | null
  customer: Customer
}

export interface Order {
  orderNumber: string
  items: CartItem[]
  couponCode: string | null
  customer: Customer
  pricing: PriceBreakdown
}
