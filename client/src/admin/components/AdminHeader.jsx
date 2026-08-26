import { useLocation } from 'react-router-dom';

export default function AdminHeader() {
  const location = useLocation();

  const admin = JSON.parse(
    localStorage.getItem('adminUser') || '{}'
  );

  const titles = {
    '/admin': 'Dashboard',
    '/admin/bookings': 'Bookings',
    '/admin/rooms': 'Rooms',
    '/admin/customers': 'Customers',
    '/admin/reviews': 'Reviews',
    '/admin/offers': 'Offers',
    '/admin/gallery': 'Gallery',
    '/admin/settings': 'Hotel Settings',
  };

  const title = titles[location.pathname] || 'Admin Panel';

  return (
    <header className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>Manage your Aranya Palace resort</p>
      </div>

      <div className="admin-user">
        <div className="admin-avatar">
          {(admin.name || 'A').charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{admin.name || 'Administrator'}</strong>
          <span>{admin.role || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}