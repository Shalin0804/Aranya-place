import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  HiOutlineUserGroup, HiOutlineHome, HiOutlineMoon, HiCheck, HiStar,
  HiChevronLeft, HiChevronRight, HiX, HiOutlineCalendar,
} from 'react-icons/hi';
import { roomTypesApi } from '../services/api';
import { formatCurrency, todayISO, addDaysISO, nightsBetween } from '../utils/format';
import './RoomDetails.css';

export default function RoomDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const minCheckIn = todayISO();
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || addDaysISO(minCheckIn, 7));
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || addDaysISO(minCheckIn, 9));
  const [numRooms, setNumRooms] = useState(1);
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);

  useEffect(() => {
    setLoading(true);
    setError('');
    roomTypesApi.bySlug(slug, { checkIn, checkOut })
      .then(setRoom)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!room) return;
    roomTypesApi.bySlug(slug, { checkIn, checkOut }).then(setRoom).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut]);

  const nights = nightsBetween(checkIn, checkOut);

  if (loading) {
    return <div className="room-details-loading"><div className="skeleton" style={{ height: 480 }} /></div>;
  }

  if (error || !room) {
    return (
      <div className="container room-not-found">
        <h2>We couldn't find that room</h2>
        <p>{error || 'It may have been renamed or removed.'}</p>
        <Link to="/rooms" className="btn btn-primary">Browse all rooms</Link>
      </div>
    );
  }

  const subtotal = room.base_price * nights * numRooms;
  const tax = subtotal * 0.12;
  const total = subtotal + tax;
  const maxRoomsSelectable = Math.max(1, Math.min(room.availableRooms || 1, 5));
  const isSoldOut = room.availableRooms === 0;

  const handleBookNow = () => {
    if (isSoldOut) return;
    const params = new URLSearchParams({
      roomTypeId: room.id, checkIn, checkOut, numRooms, guests,
    });
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <div className="room-details">
      <title>{`${room.name} — Aranya Palace Resort & Spa`}</title>
      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HotelRoom',
        name: room.name,
        description: room.description,
        image: room.images,
        bed: room.bed_type,
        floorSize: { '@type': 'QuantitativeValue', value: room.size_sqft, unitCode: 'FTK' },
        occupancy: { '@type': 'QuantitativeValue', maxValue: room.max_guests },
        containedInPlace: { '@type': 'Hotel', name: 'Aranya Palace Resort & Spa' },
        offers: { '@type': 'Offer', price: room.base_price, priceCurrency: 'INR', unitText: 'night' },
      })}</script>
      {/* ---------- Gallery ---------- */}
      <section className="rd-gallery">
        <div className="rd-gallery-main" onClick={() => setLightboxIndex(0)}>
          <img src={room.images[0]} alt={room.name} />
        </div>
        <div className="rd-gallery-side">
          {room.images.slice(1, 3).map((img, i) => (
            <div key={img} className="rd-gallery-thumb" onClick={() => setLightboxIndex(i + 1)}>
              <img src={img} alt={`${room.name} view ${i + 2}`} />
              {i === 1 && room.images.length > 3 && (
                <span className="rd-gallery-more">+{room.images.length - 3} more</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={room.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}

      <div className="container rd-body">
        <div className="rd-main">
          <p className="eyebrow">{room.tagline}</p>
          <h1 className="text-3xl">{room.name}</h1>

          <div className="rd-meta">
            <span><HiOutlineUserGroup size={17} /> Up to {room.max_guests} guests</span>
            <span><HiOutlineHome size={17} /> {room.size_sqft} sq ft</span>
            <span><HiOutlineMoon size={17} /> {room.bed_type}</span>
          </div>

          <p className="rd-desc">{room.description}</p>

          <h3 className="rd-subhead">Amenities</h3>
          <ul className="rd-amenities">
            {room.amenities.map((a) => (
              <li key={a}><HiCheck size={16} /> {a}</li>
            ))}
          </ul>

          <h3 className="rd-subhead">Check-in &amp; Check-out</h3>
          <div className="rd-policy-grid">
            <div><span>Check-in</span><strong>2:00 PM</strong></div>
            <div><span>Check-out</span><strong>11:00 AM</strong></div>
          </div>

          <h3 className="rd-subhead">Cancellation Policy</h3>
          <p className="rd-policy-text">
            Free cancellation up to 48 hours before check-in. Cancellations within
            48 hours are charged one night's stay. No-shows are charged the full booking amount.
          </p>

          {room.reviews?.length > 0 && (
            <>
              <h3 className="rd-subhead">Guest Reviews for this Room</h3>
              <div className="rd-reviews">
                {room.reviews.map((r) => (
                  <div key={r.id} className="rd-review">
                    <div className="review-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HiStar key={i} className={i < r.rating ? 'star-icon filled' : 'star-icon'} />
                      ))}
                    </div>
                    <p>&ldquo;{r.comment}&rdquo;</p>
                    <span className="review-author">{r.guest_name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ---------- Booking panel ---------- */}
        <aside className="rd-booking-panel">
          <div className="rd-booking-card">
            <div className="rd-booking-price">
              <strong>{formatCurrency(room.base_price)}</strong>
              <span>/ night</span>
            </div>

            <label className="rd-field">
              <span><HiOutlineCalendar size={14} /> Check-in</span>
              <input type="date" value={checkIn} min={minCheckIn} onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut <= e.target.value) setCheckOut(addDaysISO(e.target.value, 2));
              }} />
            </label>
            <label className="rd-field">
              <span><HiOutlineCalendar size={14} /> Check-out</span>
              <input type="date" value={checkOut} min={addDaysISO(checkIn, 1)} onChange={(e) => setCheckOut(e.target.value)} />
            </label>

            <div className="rd-field-row">
              <label className="rd-field">
                <span>Rooms</span>
                <select value={numRooms} onChange={(e) => setNumRooms(Number(e.target.value))}>
                  {Array.from({ length: maxRoomsSelectable }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
              <label className="rd-field">
                <span>Guests</span>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {Array.from({ length: room.max_guests * numRooms }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className={`rd-availability ${isSoldOut ? 'sold-out' : room.availableRooms <= 3 ? 'low' : ''}`}>
              {isSoldOut ? 'Fully booked for these dates' : `${room.availableRooms} room(s) available`}
            </p>

            <div className="rd-price-breakdown">
              <div><span>{formatCurrency(room.base_price)} &times; {nights} night{nights === 1 ? '' : 's'} &times; {numRooms} room{numRooms > 1 ? 's' : ''}</span><span>{formatCurrency(subtotal)}</span></div>
              <div><span>Taxes (12%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="rd-total"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>

            <button className="btn btn-brass btn-block" disabled={isSoldOut || nights < 1} onClick={handleBookNow}>
              {isSoldOut ? 'Fully Booked' : 'Book Now'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Lightbox({ images, index, onClose, onChange }) {
  const prev = () => onChange((index - 1 + images.length) % images.length);
  const next = () => onChange((index + 1) % images.length);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close gallery"><HiX size={26} /></button>
      <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous image"><HiChevronLeft size={28} /></button>
      <img src={images[index]} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next image"><HiChevronRight size={28} /></button>
      <span className="lightbox-count">{index + 1} / {images.length}</span>
    </div>
  );
}
