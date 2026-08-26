import { NavLink, Outlet } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCalendar, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Account.css';

export default function AccountLayout() {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="account-page">
      <div className="container account-grid">
        <aside className="account-sidebar">
          <div className="account-sidebar-head">
            <div className="account-avatar">{customer?.name?.charAt(0) || '?'}</div>
            <div>
              <strong>{customer?.name}</strong>
              <span>{customer?.email}</span>
            </div>
          </div>
          <nav className="account-nav">
            <NavLink to="/account" end><HiOutlineUser size={17} /> Profile</NavLink>
            <NavLink to="/account/bookings"><HiOutlineCalendar size={17} /> My Bookings</NavLink>
            <button onClick={() => { logout(); navigate('/'); }} className="account-nav-logout">
              <HiOutlineLogout size={17} /> Log Out
            </button>
          </nav>
        </aside>

        <div className="account-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
