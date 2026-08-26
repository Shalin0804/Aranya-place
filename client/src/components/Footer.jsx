import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import LeafDivider from './LeafDivider';
import './Footer.css';

export default function Footer({ settings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-brand-text">Aranya Palace</span>
            <p>
              {settings?.description ||
                'A restored 1920s haveli set among fifteen acres of mango orchard on the edge of Ahmedabad.'}
            </p>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/rooms">Rooms &amp; Suites</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/#offers">Offers</Link>
            <Link to="/#reviews">Guest Reviews</Link>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/account/bookings">My bookings</Link>
          </div>

          <div className="footer-col">
            <h4>Reach us</h4>
            <p className="footer-contact-line">
              <HiOutlineLocationMarker size={16} />
              {settings?.address || 'Village Bavla Road, near Sanand, Ahmedabad, Gujarat'}
            </p>
            <p className="footer-contact-line">
              <HiOutlinePhone size={16} />
              {settings?.phone || '+91 79 4811 2200'}
            </p>
            <p className="footer-contact-line">
              <HiOutlineMail size={16} />
              {settings?.email || 'stay@aranyapalace.in'}
            </p>
          </div>
        </div>

        <LeafDivider className="footer-divider" />

        <div className="footer-bottom">
          <p>&copy; {year} Aranya Palace Resort &amp; Spa. All rights reserved.</p>
          <p>Check-in {settings?.check_in_time || '2:00 PM'} &middot; Check-out {settings?.check_out_time || '11:00 AM'}</p>
        </div>
      </div>
    </footer>
  );
}
