import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const dashboardLink = () => {
    if (user?.role === 'VENDOR') return '/vendor';
    if (user?.role === 'ADMIN')  return '/admin';
    if (user?.role === 'BODA')   return '/boda';
    return '/orders';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="logo-dot" />
        Modern Kikubo
      </Link>

      <div className="navbar-links">
        <Link to="/category/WOMEN">Women</Link>
        <Link to="/category/MEN">Men</Link>
        <Link to="/category/CHILDREN">Children</Link>
        <Link to="/category/SPORTS">Sports</Link>
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <Link to={dashboardLink()} className="btn-outline">Dashboard</Link>
            <button className="btn-dark" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-outline">Sign in</Link>
            <Link to="/register" className="btn-dark">Start selling →</Link>
          </>
        )}
      </div>
    </nav>
  );
}
