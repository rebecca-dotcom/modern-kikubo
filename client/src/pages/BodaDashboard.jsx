import { useEffect, useState } from 'react';
import api from '../api';
import './Dashboard.css';

const STATUS_COLOR = { PENDING:'#c07000', PAID:'#2F7D5B', PREPARING:'#555', PICKED_UP:'#0055aa', DELIVERED:'#1a6b3a', CANCELLED:'#c00' };

export default function BodaDashboard() {
  const [orders, setOrders] = useState(null);
  const [updating, setUpdating] = useState(null);

  function load() {
    api.get('/delivery/my').then(r => setOrders(r.data)).catch(() => setOrders([]));
  }

  useEffect(() => { load(); }, []);

  async function markPickedUp(orderId) {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'PICKED_UP' });
      load();
    } finally { setUpdating(null); }
  }

  async function markDelivered(orderId) {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'DELIVERED' });
      load();
    } finally { setUpdating(null); }
  }

  if (!orders) return <p className="dash-loading">Loading deliveries...</p>;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>My Deliveries</h1>
          <p className="dash-sub">Orders assigned to you</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="dash-empty">No deliveries assigned yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map(o => (
            <div key={o.id} className="order-card">
              <div className="order-card-top">
                <span className="order-id">Order #{o.id.slice(-6).toUpperCase()}</span>
                <span className="order-status-pill" style={{ background: STATUS_COLOR[o.status] + '20', color: STATUS_COLOR[o.status] }}>
                  {o.status.replace('_', ' ')}
                </span>
              </div>
              <div className="order-card-bottom">
                <span className="order-address">📍 Deliver to: {o.deliveryAddress}</span>
                <span className="order-total">UGX {o.totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                {o.status === 'PREPARING' && (
                  <button className="btn-dark" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    disabled={updating === o.id} onClick={() => markPickedUp(o.id)}>
                    Mark Picked Up
                  </button>
                )}
                {o.status === 'PICKED_UP' && (
                  <button className="btn-dark" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', background: '#2F7D5B' }}
                    disabled={updating === o.id} onClick={() => markDelivered(o.id)}>
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
