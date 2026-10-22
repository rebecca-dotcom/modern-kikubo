import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CATEGORIES = [
  { key: 'WOMEN',    label: 'Women',    emoji: '👗', desc: 'Dresses, tops, skirts & more' },
  { key: 'MEN',      label: 'Men',      emoji: '👔', desc: 'Shirts, trousers, suits & shoes' },
  { key: 'CHILDREN', label: 'Children', emoji: '🧒', desc: 'Boys, girls & baby clothing' },
  { key: 'SPORTS',   label: 'Sports',   emoji: '⚽', desc: 'Jerseys, trainers & tracksuits' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products?limit=8').then((r) => setFeatured(r.data.products)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <p className="hero-tag">
            <span className="tag-dot" /> KAMPALA'S VIRTUAL MARKET · V1.0
          </p>
          <h1 className="hero-heading">
            Style,<br />
            <em className="hero-em">from</em>{' '}
            <span className="hero-gold">the streets.</span>
          </h1>
          <p className="hero-sub">
            Second-hand clothes from Kampala's best street vendors —<br />
            delivered safely to your door by a trusted boda.
          </p>
          <div className="hero-cta">
            <Link to="/category/WOMEN" className="cta-primary">Browse listings</Link>
            <Link to="/register?role=VENDOR" className="cta-secondary">Open your shop →</Link>
          </div>
        </div>
      </section>

      {/* ── Search ── */}
      <section className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search dresses, jerseys, shoes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </section>

      {/* ── Categories ── */}
      <section className="categories-section">
        <h2 className="section-title">Shop by category</h2>
        <div className="categories-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.key} to={`/category/${c.key}`} className="category-card">
              <span className="cat-emoji">{c.emoji}</span>
              <h3 className="cat-label">{c.label}</h3>
              <p className="cat-desc">{c.desc}</p>
              <span className="cat-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured listings ── */}
      {featured.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title">New arrivals</h2>
            <Link to="/category/WOMEN" className="see-all">See all →</Link>
          </div>
          <div className="products-grid">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="how-section">
        <h2 className="section-title">How it works</h2>
        <p className="how-sub">03 STEPS</p>
        <div className="how-grid">
          <div className="how-step">
            <span className="step-num">01</span>
            <h3>Browse & select</h3>
            <p>Find clothes by category, size or price. View photos and seller details.</p>
          </div>
          <div className="how-step">
            <span className="step-num">02</span>
            <h3>Pay securely</h3>
            <p>Checkout with MTN or Airtel Mobile Money. Your payment is held until delivery.</p>
          </div>
          <div className="how-step">
            <span className="step-num">03</span>
            <h3>Safe delivery</h3>
            <p>A verified boda picks up from the vendor and delivers straight to you.</p>
          </div>
        </div>
      </section>

      {/* ── Vendor CTA ── */}
      <section className="vendor-cta">
        <div className="vendor-cta-inner">
          <h2>Sell on Modern Kikubo</h2>
          <p>Open your virtual shop for UGX 15,000/month. Reach buyers across Kampala without the eviction risk.</p>
          <Link to="/register?role=VENDOR" className="cta-primary">Start selling →</Link>
        </div>
      </section>
    </div>
  );
}
