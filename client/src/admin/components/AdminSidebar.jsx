import { NavLink, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();

  const links = [
    { path: '/admin', icon: '📊', label: 'Dashboard' },
    { path: '/admin/bookings', icon: '📅', label: 'Bookings' },
    { path: '/admin/rooms', icon: '🛏️', label: 'Rooms' },
    { path: '/admin/customers', icon: '👥', label: 'Customers' },
    { path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
    { path: '/admin/offers', icon: '🏷️', label: 'Offers' },
    { path: '/admin/gallery', icon: '🖼️', label: 'Gallery' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-icon">A</div>
        <div>
          <strong>Aranya Palace</strong>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <nav className="admin-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/admin'}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="admin-nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-bottom">
        <button onClick={() => navigate('/')} className="sidebar-secondary">
          🌐 View Website
        </button>

        <button onClick={logout} className="sidebar-logout">
          ↪ Logout
        </button>
      </div>
    </aside>
  );
}