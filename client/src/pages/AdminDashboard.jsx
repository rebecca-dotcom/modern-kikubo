import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import DashboardLayout from '../components/DashboardLayout';
import './Dashboard.css';

/* ── Simple SVG bar chart ── */
function OrdersBarChart({ orders }) {
  const statuses = ['PENDING', 'PAID', 'PREPARING', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
  const colors   = { PENDING:'#c07000', PAID:'#2F7D5B', PREPARING:'#0055cc', PICKED_UP:'#7b2cbf', DELIVERED:'#1a6b3a', CANCELLED:'#c00' };
  const counts   = statuses.map(s => ({ s, n: orders.filter(o => o.status === s).length }));
  const max      = Math.max(...counts.map(c => c.n), 1);

  const W = 480, H = 180, PAD = { top: 10, right: 10, bottom: 40, left: 30 };
  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom };
  const bw = Math.floor(inner.w / statuses.length);
  const gap = 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, fontFamily: 'inherit' }}>
      {/* Y-axis grid lines */}
      {[0, 0.5, 1].map((f, i) => {
        const y = PAD.top + inner.h * (1 - f);
        return <line key={i} x1={PAD.left} x2={PAD.left + inner.w} y1={y} y2={y} stroke="#eee" strokeWidth="1" />;
      })}
      {/* Bars */}
      {counts.map(({ s, n }, i) => {
        const barH = max === 0 ? 0 : Math.max(2, (n / max) * inner.h);
        const x = PAD.left + i * bw + gap / 2;
        const y = PAD.top + inner.h - barH;
        const w = bw - gap;
        return (
          <g key={s}>
            <rect x={x} y={y} width={w} height={barH} rx="3" fill={colors[s]} opacity="0.9" />
            {n > 0 && <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#444">{n}</text>}
            <text x={x + w / 2} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#777">
              {s.replace('_', ' ')}
            </text>
          </g>
        );
      })}
      {/* Y-axis label */}
      <text x={8} y={PAD.top + inner.h / 2} textAnchor="middle" fontSize="9" fill="#aaa"
        transform={`rotate(-90, 8, ${PAD.top + inner.h / 2})`}>Orders</text>
    </svg>
  );
}

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const [stats, setStats]       = useState(null);
  const [vendors, setVendors]   = useState([]);
  const [orders, setOrders]     = useState([]);
  const [bodas, setBodas]       = useState([]);
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
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="dashboard">

        {/* Stats strip — always visible */}
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

        {/* Overview tab — bar chart */}
        {tab === 'overview' && (
          <div>
            <h2 className="dash-section-title" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Orders by status</h2>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              {orders.length === 0
                ? <p className="dash-empty" style={{ margin: 0 }}>No orders yet.</p>
                : <OrdersBarChart orders={orders} />
              }
            </div>
          </div>
        )}

        {/* Vendors tab */}
        {tab === 'vendors' && (
          <div>
            <h2 className="dash-section-title" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Vendors ({vendors.length})</h2>
            <div className="orders-list">
              {vendors.length === 0
                ? <p className="dash-empty">No vendors yet.</p>
                : vendors.map(v => (
                  <div key={v.id} className="order-card">
                    <div className="order-card-top">
                      <span style={{ fontWeight: 700 }}>{v.shopName}</span>
                      <span className={`status-badge ${v.isActive ? 'active' : 'inactive'}`}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>{v.user?.name} · {v.user?.email}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>📍 {v.location}</p>
                    <button
                      className="btn-dark"
                      style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.9rem', background: v.isActive ? '#c00' : '#2F7D5B' }}
                      disabled={updating === v.id}
                      onClick={() => toggleVendor(v.id, v.isActive)}
                    >
                      {v.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div>
            <h2 className="dash-section-title" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Orders ({orders.length})</h2>
            <div className="orders-list">
              {orders.length === 0
                ? <p className="dash-empty">No orders yet.</p>
                : orders.map(o => (
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
                        <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Assign rider:&nbsp;
                          <select onChange={e => assignBoda(o.id, e.target.value)} defaultValue="">
                            <option value="" disabled>Select rider</option>
                            {bodas.map(b => <option key={b.id} value={b.id}>{b.user?.name} · {b.plateNo}</option>)}
                          </select>
                        </label>
                      </div>
                    )}
                    {o.boda && <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#2F7D5B' }}>🛵 {o.boda.user?.name} · {o.boda.plateNo}</p>}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Riders tab */}
        {tab === 'riders' && (
          <div>
            <h2 className="dash-section-title" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Boda Riders ({bodas.length})</h2>
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
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
