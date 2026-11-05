import { useEffect, useState } from 'react';
import api from '../api';
import DashboardLayout from '../components/DashboardLayout';
import './Dashboard.css';

const EMPTY_PRODUCT = { title: '', description: '', price: '', category: 'WOMEN', size: '', condition: 'GOOD' };

const PLANS = [
  { key: 'MONTHLY',   label: 'Monthly',   price: 'UGX 50,000',  days: '30 days'  },
  { key: 'QUARTERLY', label: 'Quarterly', price: 'UGX 120,000', days: '90 days'  },
  { key: 'YEARLY',    label: 'Yearly',    price: 'UGX 400,000', days: '365 days' },
];

function SubscribeModal({ onClose, onSuccess }) {
  const [plan, setPlan]       = useState('MONTHLY');
  const [provider, setProvider] = useState('MTN');
  const [phone, setPhone]     = useState('');
  const [step, setStep]       = useState('form'); // form | processing | success
  const [err, setErr]         = useState('');

  async function handlePay(e) {
    e.preventDefault();
    setErr('');
    setStep('processing');
    await new Promise(r => setTimeout(r, 2200));
    try {
      await api.post('/subscriptions/pay', { plan, phone, provider });
      setStep('success');
    } catch (e) {
      setErr(e.response?.data?.error || 'Payment failed');
      setStep('form');
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:'12px', padding:'2rem', width:'100%', maxWidth:'420px', position:'relative' }}>
        {step === 'success' ? (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>✅</div>
            <h2 style={{ margin:'0 0 0.5rem' }}>Shop Activated!</h2>
            <p style={{ color:'#555', marginBottom:'1.5rem' }}>Your subscription is now active. You can start selling.</p>
            <button className="btn-dark" onClick={onSuccess}>Go to my shop →</button>
          </div>
        ) : step === 'processing' ? (
          <div style={{ textAlign:'center', padding:'2rem 0' }}>
            <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>⏳</div>
            <p style={{ fontWeight:600 }}>Processing payment...</p>
            <p style={{ color:'#666', fontSize:'0.85rem' }}>Check your phone for the {provider} MoMo prompt</p>
          </div>
        ) : (
          <>
            <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1rem', background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
            <h2 style={{ margin:'0 0 1.5rem' }}>Activate your shop</h2>
            {err && <p style={{ color:'#c00', fontSize:'0.85rem', marginBottom:'1rem' }}>{err}</p>}

            <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>Choose a plan</p>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem' }}>
              {PLANS.map(p => (
                <button key={p.key} onClick={() => setPlan(p.key)}
                  style={{ flex:1, padding:'0.6rem 0.4rem', borderRadius:'8px', border:`2px solid ${plan===p.key?'#2F7D5B':'#ddd'}`, background: plan===p.key?'#f0faf5':'#fff', cursor:'pointer', fontSize:'0.78rem', textAlign:'center' }}>
                  <strong>{p.label}</strong><br/>{p.price}<br/><span style={{ color:'#888' }}>{p.days}</span>
                </button>
              ))}
            </div>

            <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>Pay with</p>
            <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem' }}>
              {['MTN','AIRTEL'].map(pr => (
                <button key={pr} onClick={() => setProvider(pr)}
                  style={{ flex:1, padding:'0.6rem', borderRadius:'8px', border:`2px solid ${provider===pr?'#2F7D5B':'#ddd'}`, background: provider===pr?'#f0faf5':'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>
                  {pr === 'MTN' ? '🟡 MTN MoMo' : '🔴 Airtel Money'}
                </button>
              ))}
            </div>

            <form onSubmit={handlePay}>
              <label style={{ display:'block', fontWeight:600, marginBottom:'0.4rem' }}>Mobile number</label>
              <input required placeholder="e.g. 0771234567" value={phone} onChange={e => setPhone(e.target.value)}
                style={{ width:'100%', padding:'0.6rem 0.75rem', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.95rem', marginBottom:'1.25rem', boxSizing:'border-box' }} />
              <button type="submit" className="btn-dark" style={{ width:'100%' }}>Pay & Activate →</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [deletingId, setDeletingId] = useState(null);
  const [showSubscribe, setShowSubscribe] = useState(false);

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

  async function deleteListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      load();
    } catch (e) {
      alert('Could not delete listing');
    } finally { setDeletingId(null); }
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

  if (!data && !noShop) return <DashboardLayout title="Vendor Dashboard"><p className="dash-loading">Loading your shop...</p></DashboardLayout>;

  if (noShop) return (
    <DashboardLayout title="Set up your shop">
    <div className="dashboard">
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
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={data.shopName}>
    {showSubscribe && (
      <SubscribeModal
        onClose={() => setShowSubscribe(false)}
        onSuccess={() => { setShowSubscribe(false); load(); }}
      />
    )}
    <div className="dashboard">
      <div className="dash-header">
        <p className="dash-sub">{data.location}</p>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span className={`status-badge ${data.isActive ? 'active' : 'inactive'}`}>
            {data.isActive ? 'Active' : 'Subscription needed'}
          </span>
          {!data.isActive && (
            <button className="btn-dark" style={{ fontSize:'0.82rem', padding:'0.4rem 0.9rem', background:'#2F7D5B' }}
              onClick={() => setShowSubscribe(true)}>
              Subscribe →
            </button>
          )}
        </div>
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
              {p.photos[0]
                ? <img src={p.photos[0]} alt={p.title} className="listing-img" />
                : <div className="listing-img listing-no-photo">No photo</div>}
              <div className="listing-info">
                <p className="listing-title">{p.title}</p>
                <p className="listing-meta">{p.category} · {p.size} · {p.condition}</p>
                <p className="listing-price">UGX {p.price.toLocaleString()}</p>
                <button
                  className="btn-delete"
                  onClick={() => deleteListing(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? 'Deleting...' : 'Delete'}
                </button>
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
    </DashboardLayout>
  );
}
