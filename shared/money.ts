const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** 3000 -> "$30.00". Solo para mostrar: los cálculos siempre usan centavos enteros. */
export function formatCents(cents: number): string {
  return usd.format(cents / 100)
}
