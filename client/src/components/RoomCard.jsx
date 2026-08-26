import { Link } from 'react-router-dom';
import { HiOutlineUserGroup, HiOutlineHome, HiOutlineMoon } from 'react-icons/hi';
import { formatCurrency } from '../utils/format';
import './RoomCard.css';

export default function RoomCard({ room, searchParams = '' }) {
  const isLow = room.availableRooms > 0 && room.availableRooms <= 3;
  const isSoldOut = room.availableRooms === 0;

  return (
    <article className="room-card">
      <div className="room-card-media">
        <img src={room.images?.[0]} alt={room.name} loading="lazy" />
        <span className={`room-card-badge ${isSoldOut ? 'sold-out' : isLow ? 'low' : ''}`}>
          {isSoldOut
            ? 'Fully booked'
            : room.availableRooms !== undefined
              ? `${room.availableRooms} Room${room.availableRooms === 1 ? '' : 's'} Available`
              : 'Available'}
        </span>
      </div>

      <div className="room-card-body">
        <p className="eyebrow">{room.tagline}</p>
        <h3>{room.name}</h3>
        <p className="room-card-desc">{room.description}</p>

        <div className="room-card-meta">
          <span><HiOutlineUserGroup size={15} /> Up to {room.max_guests}</span>
          <span><HiOutlineHome size={15} /> {room.size_sqft} sq ft</span>
          <span><HiOutlineMoon size={15} /> {room.bed_type}</span>
        </div>

        <ul className="room-card-amenities">
          {room.amenities?.slice(0, 3).map((a) => <li key={a}>{a}</li>)}
        </ul>

        <div className="room-card-footer">
          <div className="room-card-price">
            <strong>{formatCurrency(room.base_price)}</strong>
            <span>/ night</span>
          </div>
          <div className="room-card-actions">
            <Link to={`/rooms/${room.slug}${searchParams}`} className="btn btn-outline">View Details</Link>
            <Link
              to={`/rooms/${room.slug}${searchParams}`}
              className={`btn btn-primary ${isSoldOut ? 'btn-disabled' : ''}`}
              aria-disabled={isSoldOut}
              onClick={(e) => isSoldOut && e.preventDefault()}
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
