import { formatCents } from '../../shared/money'
import type { Product } from '../../shared/types'

interface Props {
  products: Product[]
  onAdd: (productId: string) => void
}

export function ProductList({ products, onAdd }: Props) {
  return (
    <section aria-labelledby="catalog-heading" className="panel">
      <h2 id="catalog-heading">Catálogo</h2>
      <ul className="products">
        {products.map((product) => (
          <li key={product.id} className="product">
            <h3>{product.name}</h3>
            <p className="price">{formatCents(product.priceCents)}</p>
            <button type="button" aria-label={`Agregar ${product.name} al carrito`} onClick={() => onAdd(product.id)}>
              Agregar al carrito
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
