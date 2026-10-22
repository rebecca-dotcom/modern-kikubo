import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import './Category.css';

const LABELS = { WOMEN: 'Women', MEN: 'Men', CHILDREN: 'Children', SPORTS: 'Sports' };

export default function Category() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/products?category=${category}&search=${search}&page=${page}`)
      .then((r) => { setProducts(r.data.products); setTotalPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [category, search, page]);

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>{LABELS[category] || category}</h1>
        <input
          className="filter-search"
          placeholder="Search in this category..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : products.length === 0 ? (
        <p className="empty-text">No listings yet in this category.</p>
      ) : (
        <div className="products-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
