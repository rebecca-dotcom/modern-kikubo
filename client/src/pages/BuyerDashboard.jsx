import { useEffect, useState } from 'react';
import api from '../api';
import './Dashboard.css';

const STATUS_COLOR = { PENDING:'#c07000', PAID:'#2F7D5B', PREPARING:'#1a6b3a', PICKED_UP:'#0055aa', DELIVERED:'#1a6b3a', CANCELLED:'#c00' };

export default function BuyerDashboard() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data)).catch(() => setOrders([]));
  }, []);

  if (!orders) return <p className="dash-loading">Loading your orders...</p>;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>My Orders</h1>
          <p className="dash-sub">Track your deliveries</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>You haven't ordered anything yet.</p>
          <a href="/" style={{ color: '#2F7D5B', fontWeight: 700 }}>Browse listings →</a>
        </div>
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
              <div className="order-items-list">
                {o.items.map(item => (
                  <div key={item.id} className="order-item-row">
                    <span>{item.product?.title || 'Item'}</span>
                    <span>UGX {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="order-card-bottom">
                <span className="order-address">📍 {o.deliveryAddress}</span>
                <span className="order-total">Total: UGX {o.totalAmount.toLocaleString()}</span>
              </div>
              {o.boda && (
                <div className="order-boda">
                  🛵 Rider: <strong>{o.boda.user?.name}</strong> · {o.boda.plateNo}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
