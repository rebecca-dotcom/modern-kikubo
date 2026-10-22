import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './ProductDetail.css';

// step: 'idle' | 'address' | 'payment' | 'processing' | 'success'

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('idle');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePay(e) {
    e.preventDefault();
    setErr('');
    setStep('processing');
    try {
      await api.post('/orders', {
        vendorId: product.vendorId,
        deliveryAddress: address,
        items: [{ productId: product.id, quantity: 1 }],
      });
      // simulate network round-trip (real Flutterwave would redirect here)
      await new Promise(r => setTimeout(r, 2200));
      setStep('success');
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not place order. Are you signed in?');
      setStep('payment');
    }
  }

  if (loading) return <p className="detail-loading">Loading...</p>;
  if (!product) return null;

  const conditionLabel = { NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair' };
  const conditionClass = ['NEW', 'LIKE_NEW'].includes(product.condition) ? 'badge-green' : 'badge-gold';
  const total = product.price + 5000;

  return (
    <div className="detail-page">
      <div className="detail-grid">
        {/* Image */}
        <div className="detail-img-wrap">
          {product.photos[0]
            ? <img src={product.photos[0]} alt={product.title} className="detail-img" />
            : <div className="detail-img-placeholder">No photo</div>}
          <span className={`detail-badge ${conditionClass}`}>{conditionLabel[product.condition]}</span>
        </div>

        {/* Info */}
        <div className="detail-info">
          <p className="detail-category">{product.category}</p>
          <h1 className="detail-title">{product.title}</h1>
          <p className="detail-price">UGX {product.price.toLocaleString()}</p>

          <div className="detail-meta">
            <span className="meta-tag">Size: {product.size}</span>
            <span className="meta-tag">Condition: {conditionLabel[product.condition]}</span>
          </div>

          <p className="detail-desc">{product.description}</p>

          <div className="detail-vendor">
            <p className="vendor-name">🏪 {product.vendor?.shopName}</p>
            <p className="vendor-loc">📍 {product.vendor?.location}</p>
            {product.vendor?.user?.phone && (
              <p className="vendor-phone">📞 {product.vendor.user.phone}</p>
            )}
          </div>

          <div className="detail-delivery">
            <span>🛵</span>
            <span>Delivered by Safe Boda — <strong>UGX 5,000</strong> delivery fee</span>
          </div>

          {step === 'idle' && (
            <button className="btn-buy" onClick={() => setStep('address')}>
              Buy now — UGX {product.price.toLocaleString()}
            </button>
          )}

          {step === 'address' && (
            <form className="order-form" onSubmit={e => { e.preventDefault(); setStep('payment'); }}>
              <label>Delivery address
                <input required value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Ntinda, opposite Total, Kampala" />
              </label>
              <p className="order-total">Total: UGX {total.toLocaleString()} (item + delivery)</p>
              <div className="order-form-btns">
                <button type="submit" className="btn-buy">Continue to payment →</button>
                <button type="button" className="btn-cancel" onClick={() => setStep('idle')}>Cancel</button>
              </div>
            </form>
          )}

          {(step === 'payment' || step === 'processing') && (
            <PaymentModal
              total={total}
              network={network} setNetwork={setNetwork}
              phone={phone} setPhone={setPhone}
              processing={step === 'processing'}
              err={err}
              onPay={handlePay}
              onBack={() => setStep('address')}
            />
          )}

          {step === 'success' && (
            <div className="order-success">
              <div className="success-icon">✓</div>
              <strong>Payment confirmed!</strong>
              <p>UGX {total.toLocaleString()} charged to {network} {phone}</p>
              <p>Your order has been placed. A Safe Boda rider will deliver to:<br /><em>{address}</em></p>
              <button className="btn-buy" style={{ marginTop: '1rem' }} onClick={() => navigate('/orders')}>
                Track my order →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ total, network, setNetwork, phone, setPhone, processing, err, onPay, onBack }) {
  return (
    <div className="pay-modal">
      <div className="pay-modal-header">
        <div className="pay-modal-logo">
          <span className="pay-fw-badge">Powered by Flutterwave</span>
        </div>
        <p className="pay-amount">UGX {total.toLocaleString()}</p>
      </div>

      <div className="pay-tabs">
        {['MTN', 'Airtel'].map(n => (
          <button
            key={n}
            type="button"
            className={`pay-tab ${network === n ? 'active' : ''}`}
            onClick={() => setNetwork(n)}
            disabled={processing}
          >
            <span className={`pay-net-icon ${n.toLowerCase()}`} />
            {n} MoMo
          </button>
        ))}
      </div>

      <form onSubmit={onPay} className="pay-form">
        {err && <p className="form-error">{err}</p>}
        <label className="pay-label">
          {network} Mobile Money number
          <input
            required
            type="tel"
            placeholder={network === 'MTN' ? '077XXXXXXX' : '075XXXXXXX'}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            pattern="0[67][0-9]{8}"
            title="Enter a valid Ugandan number e.g. 0771234567"
            disabled={processing}
          />
        </label>
        <p className="pay-hint">
          You will receive a prompt on your {network} line to authorise the payment of UGX {total.toLocaleString()}.
        </p>

        {processing ? (
          <div className="pay-processing">
            <div className="pay-spinner" />
            <span>Waiting for {network} authorisation…</span>
          </div>
        ) : (
          <div className="order-form-btns">
            <button type="submit" className="btn-buy">Pay UGX {total.toLocaleString()} →</button>
            <button type="button" className="btn-cancel" onClick={onBack}>Back</button>
          </div>
        )}
      </form>

      <p className="pay-test-note">
        ⚠ Demo mode — no real charge. Flutterwave live key pending.
      </p>
    </div>
  );
}
