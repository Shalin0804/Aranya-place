import { NavLink, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();

  const links = [
    { path: '/admin', icon: '📊', label: 'Dashboard', perm: 'dashboard.view' },
    { path: '/admin/bookings', icon: '📅', label: 'Bookings', perm: 'bookings.view' },
    { path: '/admin/rooms', icon: '🛏️', label: 'Rooms', perm: 'rooms.view' },
    { path: '/admin/customers', icon: '👥', label: 'Customers', perm: 'customers.view' },
    { path: '/admin/reviews', icon: '⭐', label: 'Reviews', perm: 'content.manage' },
    { path: '/admin/offers', icon: '🏷️', label: 'Offers', perm: 'content.manage' },
    { path: '/admin/gallery', icon: '🖼️', label: 'Gallery', perm: 'content.manage' },
    { path: '/admin/settings', icon: '⚙️', label: 'Settings', perm: 'settings.manage' },
  ];

  // Sessions saved before permissions existed have none listed; show all
  // links then (the server still enforces every permission).
  const { permissions } = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const visibleLinks = permissions
    ? links.filter((link) => permissions.includes(link.perm))
    : links;

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
        {visibleLinks.map((link) => (
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