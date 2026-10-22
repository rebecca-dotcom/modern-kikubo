import { useEffect, useState } from 'react';
import api from '../api';
import './Dashboard.css';

const EMPTY_PRODUCT = { title: '', description: '', price: '', category: 'WOMEN', size: '', condition: 'GOOD' };

export default function VendorDashboard() {
  const [data, setData]           = useState(null);
  const [noShop, setNoShop]       = useState(false);
  const [shopForm, setShopForm]   = useState({ shopName: '', location: '', description: '' });
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const [showAdd, setShowAdd]     = useState(false);
  const [product, setProduct]     = useState(EMPTY_PRODUCT);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [addErr, setAddErr]       = useState('');
  const [addSaving, setAddSaving] = useState(false);

  function load() {
    api.get('/vendors/me')
      .then((r) => setData(r.data))
      .catch(() => setNoShop(true));
  }

  useEffect(() => { load(); }, []);

  async function createShop(e) {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      await api.post('/vendors/register', shopForm);
      load(); setNoShop(false);
    } catch (e) {
      setErr(e.response?.data?.error || 'Something went wrong');
    } finally { setSaving(false); }
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function addListing(e) {
    e.preventDefault();
    setAddSaving(true); setAddErr('');
    try {
      const formData = new FormData();
      Object.entries(product).forEach(([k, v]) => formData.append(k, v));
      if (photoFile) formData.append('photo', photoFile);
      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProduct(EMPTY_PRODUCT);
      setPhotoFile(null);
      setPhotoPreview('');
      setShowAdd(false);
      load();
    } catch (e) {
      setAddErr(e.response?.data?.message || 'Could not save listing');
    } finally { setAddSaving(false); }
  }

  if (!data && !noShop) return <p className="dash-loading">Loading your shop...</p>;

  if (noShop) return (
    <div className="dashboard">
      <h1 style={{ marginBottom: '0.25rem' }}>Set up your shop</h1>
      <p className="dash-sub" style={{ marginBottom: '2rem' }}>Tell buyers about your store</p>
      <form onSubmit={createShop} className="shop-setup-form">
        {err && <p className="form-error">{err}</p>}
        <label>Shop name
          <input required value={shopForm.shopName} onChange={e => setShopForm({...shopForm, shopName: e.target.value})} placeholder="e.g. Apio's Boutique" />
        </label>
        <label>Location
          <input required value={shopForm.location} onChange={e => setShopForm({...shopForm, location: e.target.value})} placeholder="e.g. Owino Market, Kampala" />
        </label>
        <label>Description (optional)
          <textarea rows={3} value={shopForm.description} onChange={e => setShopForm({...shopForm, description: e.target.value})} placeholder="What do you sell?" />
        </label>
        <button type="submit" disabled={saving} className="btn-dark">
          {saving ? 'Creating...' : 'Open my shop →'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>{data.shopName}</h1>
          <p className="dash-sub">{data.location}</p>
        </div>
        <span className={`status-badge ${data.isActive ? 'active' : 'inactive'}`}>
          {data.isActive ? 'Active' : 'Subscription needed'}
        </span>
      </div>

      <div className="dash-stats">
        <div className="stat-card">
          <p className="stat-num">{data.products.length}</p>
          <p className="stat-label">Listings</p>
        </div>
        <div className="stat-card">
          <p className="stat-num">{data.orders.length}</p>
          <p className="stat-label">Orders</p>
        </div>
        <div className="stat-card">
          <p className="stat-num">{data.subscriptions[0]?.status === 'ACTIVE' ? '✓' : '✗'}</p>
          <p className="stat-label">Subscription</p>
        </div>
      </div>

      {/* Add listing section */}
      <div className="dash-section-header">
        <h2 className="dash-section-title" style={{ margin: 0 }}>My listings</h2>
        <button className="btn-dark" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add listing'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addListing} className="shop-setup-form" style={{ marginBottom: '2rem' }}>
          {addErr && <p className="form-error">{addErr}</p>}
          <label>Item title
            <input required placeholder="e.g. Blue Ankara Dress" value={product.title} onChange={e => setProduct({...product, title: e.target.value})} />
          </label>
          <label>Description
            <textarea rows={2} placeholder="Describe the item — size, brand, any flaws" value={product.description} onChange={e => setProduct({...product, description: e.target.value})} />
          </label>
          <div className="form-row">
            <label>Price (UGX)
              <input required type="number" min="1000" placeholder="e.g. 25000" value={product.price} onChange={e => setProduct({...product, price: e.target.value})} />
            </label>
            <label>Size
              <input required placeholder="e.g. M, L, 32, 10" value={product.size} onChange={e => setProduct({...product, size: e.target.value})} />
            </label>
          </div>
          <div className="form-row">
            <label>Category
              <select value={product.category} onChange={e => setProduct({...product, category: e.target.value})}>
                <option value="WOMEN">Women</option>
                <option value="MEN">Men</option>
                <option value="CHILDREN">Children</option>
                <option value="SPORTS">Sports</option>
              </select>
            </label>
            <label>Condition
              <select value={product.condition} onChange={e => setProduct({...product, condition: e.target.value})}>
                <option value="NEW">New</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
              </select>
            </label>
          </div>
          <label>Photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          {photoPreview && <img src={photoPreview} alt="preview" style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />}
          <button type="submit" disabled={addSaving} className="btn-dark">
            {addSaving ? 'Saving...' : 'Save listing →'}
          </button>
        </form>
      )}

      {data.products.length === 0 ? (
        <p className="dash-empty">No listings yet. Click "+ Add listing" to add your first item.</p>
      ) : (
        <div className="listings-grid">
          {data.products.map(p => (
            <div key={p.id} className="listing-card">
              {p.photos[0] && <img src={p.photos[0]} alt={p.title} className="listing-img" />}
              <div className="listing-info">
                <p className="listing-title">{p.title}</p>
                <p className="listing-meta">{p.category} · {p.size} · {p.condition}</p>
                <p className="listing-price">UGX {p.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="dash-section-title" style={{ marginTop: '2.5rem' }}>Recent orders</h2>
      {data.orders.length === 0 ? (
        <p className="dash-empty">No orders yet.</p>
      ) : (
        <div className="orders-list">
          {data.orders.slice(0, 10).map((o) => (
            <div key={o.id} className="order-row">
              <span className="order-id">#{o.id.slice(-6)}</span>
              <span>UGX {o.totalAmount.toLocaleString()}</span>
              <span className={`order-status ${o.status.toLowerCase()}`}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
