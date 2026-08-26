import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiOutlineUser } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/rooms', label: 'Rooms & Suites' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/#offers', label: 'Offers' },
  { to: '/#contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { customer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const solid = scrolled || !isHome || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header className={`navbar ${solid ? 'navbar-solid' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-mark">A</span>
          <span className="navbar-brand-text">
            Aranya Palace
            <em>Resort &amp; Spa</em>
          </span>
        </Link>

        <nav className="navbar-links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} className="navbar-link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          <button
            className="navbar-account-btn"
            onClick={() => navigate(customer ? '/account' : '/login')}
          >
            <HiOutlineUser size={18} />
            {customer ? customer.name.split(' ')[0] : 'Sign in'}
          </button>
          <Link to="/rooms" className="btn btn-brass navbar-cta">Book Your Stay</Link>
          <button className="navbar-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <HiX size={22} /> : <HiMenu size={22} />}
          </button>
        </div>
      </div>

      <div className={`navbar-drawer ${open ? 'open' : ''}`}>
        {LINKS.map((link) => (
          <NavLink key={link.label} to={link.to} className="navbar-drawer-link" onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
        <Link to={customer ? '/account' : '/login'} className="navbar-drawer-link">
          {customer ? 'My account' : 'Sign in'}
        </Link>
        <Link to="/rooms" className="btn btn-brass btn-block">Book Your Stay</Link>
      </div>
    </header>
  );
}
