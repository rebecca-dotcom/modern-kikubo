import { useEffect, useState } from 'react';
import api from '../api';
import './Dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders]   = useState([]);
  const [bodas, setBodas]     = useState([]);
  const [tab, setTab]         = useState('overview');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/vendors').then(r => setVendors(r.data)).catch(() => {});
    api.get('/admin/orders').then(r => setOrders(r.data)).catch(() => {});
    api.get('/admin/bodas').then(r => setBodas(r.data)).catch(() => {});
  }, []);

  async function toggleVendor(vendorId, current) {
    setUpdating(vendorId);
    try {
      await api.patch(`/admin/vendors/${vendorId}/activate`, { isActive: !current });
      const r = await api.get('/admin/vendors');
      setVendors(r.data);
    } finally { setUpdating(null); }
  }

  async function assignBoda(orderId, bodaId) {
    try {
      await api.patch(`/delivery/${orderId}/assign`, { bodaId });
      const r = await api.get('/admin/orders');
      setOrders(r.data);
    } catch(e) { alert(e.response?.data?.error || 'Failed'); }
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h1>Admin Dashboard</h1>
      </div>

      {stats && (
        <div className="dash-stats" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
          {[['Vendors', stats.vendors], ['Buyers', stats.buyers], ['Products', stats.products], ['Orders', stats.orders], ['Subscriptions', stats.subscriptions]].map(([label, val]) => (
            <div className="stat-card" key={label}>
              <p className="stat-num">{val}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="admin-tabs">
        {['overview','vendors','orders','bodas'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'vendors' && (
        <div className="orders-list">
          {vendors.map(v => (
            <div key={v.id} className="order-card">
              <div className="order-card-top">
                <span style={{ fontWeight: 700 }}>{v.shopName}</span>
                <span className={`status-badge ${v.isActive ? 'active' : 'inactive'}`}>
                  {v.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>{v.user?.name} · {v.user?.email}</p>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>📍 {v.location}</p>
              <button className="btn-dark" style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.9rem', background: v.isActive ? '#c00' : '#2F7D5B' }}
                disabled={updating === v.id} onClick={() => toggleVendor(v.id, v.isActive)}>
                {v.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="orders-list">
          {orders.map(o => (
            <div key={o.id} className="order-card">
              <div className="order-card-top">
                <span className="order-id">#{o.id.slice(-6).toUpperCase()}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>{o.status}</span>
              </div>
              <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>📍 {o.deliveryAddress}</p>
              <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Buyer: {o.buyer?.name}</p>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', fontWeight: 700 }}>UGX {o.totalAmount.toLocaleString()}</p>
              {o.status === 'PAID' && !o.bodaId && bodas.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Assign boda rider:&nbsp;
                    <select onChange={e => assignBoda(o.id, e.target.value)} defaultValue="">
                      <option value="" disabled>Select rider</option>
                      {bodas.map(b => <option key={b.id} value={b.id}>{b.user?.name} · {b.plateNo}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {o.boda && <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#2F7D5B' }}>🛵 {o.boda.user?.name} · {o.boda.plateNo}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'bodas' && (
        <div className="orders-list">
          {bodas.length === 0
            ? <p className="dash-empty">No boda riders registered yet.</p>
            : bodas.map(b => (
              <div key={b.id} className="order-card">
                <div className="order-card-top">
                  <span style={{ fontWeight: 700 }}>{b.user?.name}</span>
                  <span className={`status-badge ${b.isActive ? 'active' : 'inactive'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>🏍 Plate: {b.plateNo}</p>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>📞 {b.user?.phone}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
