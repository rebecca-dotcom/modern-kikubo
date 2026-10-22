import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const thumb = product.photos?.[0] || 'https://placehold.co/400x500?text=No+Photo';

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-img-wrap">
        <img src={thumb} alt={product.title} loading="lazy" />
        <span className={`condition-badge ${product.condition.toLowerCase().replace('_', '-')}`}>
          {product.condition.replace('_', ' ')}
        </span>
      </div>
      <div className="product-info">
        <p className="product-title">{product.title}</p>
        <p className="product-meta">{product.vendor?.shopName} · {product.vendor?.location}</p>
        <div className="product-footer">
          <span className="product-price">UGX {product.price.toLocaleString()}</span>
          {product.size && <span className="product-size">Size {product.size}</span>}
        </div>
      </div>
    </Link>
  );
}
