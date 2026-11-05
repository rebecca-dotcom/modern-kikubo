import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import './Category.css';

export default function SearchResults() {
  const [urlParams] = useSearchParams();
  const q = urlParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    api.get(`/products?search=${encodeURIComponent(q)}`)
      .then(r => setProducts(r.data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>Results for "{q}"</h1>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
          {!loading && `${products.length} item${products.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {loading ? (
        <p className="loading-text">Searching...</p>
      ) : products.length === 0 ? (
        <p className="empty-text">No results found for "{q}". Try a different word.</p>
      ) : (
        <div className="products-grid">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
