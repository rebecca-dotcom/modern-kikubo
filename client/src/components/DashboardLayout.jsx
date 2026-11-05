import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './DashboardLayout.css';

const NAV = {
  VENDOR: [
    { to: '/vendor',        label: 'Dashboard',   icon: '⊞' },
    { to: '/vendor?tab=listings', label: 'My Listings', icon: '🛍️' },
    { to: '/vendor?tab=orders',   label: 'Orders',      icon: '📦', notif: true },
  ],
  BUYER: [
    { to: '/orders',            label: 'My Orders', icon: '📦', notif: true },
    { to: '/category/WOMEN',    label: 'Women',     icon: '👗' },
    { to: '/category/MEN',      label: 'Men',       icon: '👔' },
    { to: '/category/CHILDREN', label: 'Children',  icon: '🧒' },
    { to: '/category/SPORTS',   label: 'Sports',    icon: '⚽' },
  ],
  BODA: [
    { to: '/boda', label: 'Deliveries', icon: '🛵', notif: true },
  ],
  ADMIN: [
    { to: '/admin',                 label: 'Dashboard', icon: '⊞' },
    { to: '/admin?tab=vendors',     label: 'Vendors',   icon: '👥' },
    { to: '/admin?tab=orders',      label: 'Orders',    icon: '📦', notif: true },
    { to: '/admin?tab=riders',      label: 'Riders',    icon: '🛵' },
  ],
};

function getHour() { return new Date().getHours(); }
function greeting(name) {
  const h = getHour();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name?.split(' ')[0]} 👋`;
}

export default function DashboardLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQ, setSearchQ] = useState('');

  const links = NAV[user?.role] || [];
  const currentTab = searchParams.get('tab');

  useEffect(() => {
    if (user?.role === 'VENDOR') {
      api.get('/vendors/me').then(r => {
        const pending = (r.data.orders || []).filter(o => o.status === 'PENDING').length;
        setPendingCount(pending);
      }).catch(() => {});
    } else if (user?.role === 'ADMIN') {
      api.get('/admin/stats').then(r => {
        setPendingCount(r.data.orders || 0);
      }).catch(() => {});
    }
  }, [user]);

  function handleLogout() { logout(); navigate('/'); }

  function handleSearch(e) {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/category/WOMEN?search=${encodeURIComponent(searchQ.trim())}`);
  }

  function isActive(link) {
    const [path, query] = link.to.split('?');
    if (query) {
      const tab = new URLSearchParams(query).get('tab');
      return location.pathname === path && currentTab === tab;
    }
    return location.pathname === path && !currentTab;
  }

  return (
    <div className="dl-root">
      {/* Sidebar */}
      <aside className="dl-sidebar">
        <Link to="/" className="dl-logo">
          <span className="dl-logo-dot" />
          <span className="dl-logo-text">Modern Kikubo</span>
        </Link>

        <nav className="dl-nav">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`dl-nav-item ${isActive(link) ? 'active' : ''}`}
            >
              <span className="dl-nav-icon">{link.icon}</span>
              <span className="dl-nav-label">{link.label}</span>
              {link.notif && pendingCount > 0 && (
                <span className="dl-badge">{pendingCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="dl-sidebar-footer">
          <div className="dl-user-info">
            <span className="dl-user-avatar">{user?.name?.[0]?.toUpperCase()}</span>
            <div>
              <p className="dl-user-name">{user?.name}</p>
              <p className="dl-user-role">{user?.role}</p>
            </div>
          </div>
          <button className="dl-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {/* Main area */}
      <div className="dl-main">
        {/* Header bar */}
        <header className="dl-header">
          <div className="dl-header-left">
            <h1 className="dl-page-title">{title}</h1>
          </div>
          <form className="dl-search" onSubmit={handleSearch}>
            <input
              className="dl-search-input"
              placeholder="Search products..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <button type="submit" className="dl-search-btn">Search</button>
          </form>
        </header>

        {/* Welcome strip */}
        <div className="dl-welcome">
          <span>{greeting(user?.name)}</span>
          <Link to="/" className="dl-browse-link">← Browse shop</Link>
        </div>

        {/* Content */}
        <main className="dl-content">
          {children}
        </main>
      </div>
    </div>
  );
}
