import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineAdjustments } from 'react-icons/hi';
import SearchWidget from '../components/SearchWidget';
import RoomCard from '../components/RoomCard';
import { roomTypesApi } from '../services/api';
import './Rooms.css';

export default function Rooms() {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recommended');

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (checkIn && checkOut) { params.checkIn = checkIn; params.checkOut = checkOut; }
    if (guests) params.guests = guests;

    roomTypesApi.list(params)
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [checkIn, checkOut, guests]);

  const sortedRooms = useMemo(() => {
    const list = [...rooms];
    if (sort === 'price-asc') list.sort((a, b) => a.base_price - b.base_price);
    if (sort === 'price-desc') list.sort((a, b) => b.base_price - a.base_price);
    if (sort === 'guests') list.sort((a, b) => b.max_guests - a.max_guests);
    return list;
  }, [rooms, sort]);

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <div className="rooms-page">
      <section className="rooms-hero">
        <div className="container">
          <p className="eyebrow">Rooms &amp; Suites</p>
          <h1 className="text-4xl">Six ways to stay at Aranya</h1>
          <p className="rooms-hero-sub">
            From garden-facing doubles to a freestanding pool villa — every category
            keeps the haveli's original bones with a fully modern bath.
          </p>
        </div>
      </section>

      <div className="container rooms-search-bar">
        <SearchWidget variant="inline" initial={{ checkIn, checkOut, guests: guests ? Number(guests) : undefined }} />
      </div>

      <section className="section rooms-list-section">
        <div className="container">
          <div className="rooms-toolbar">
            <p>
              {loading ? 'Searching…' : `${sortedRooms.length} room type${sortedRooms.length === 1 ? '' : 's'}`}
              {checkIn && checkOut ? ` for your selected dates` : ''}
            </p>
            <label className="rooms-sort">
              <HiOutlineAdjustments size={16} />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="guests">Guest Capacity</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="room-grid">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton room-skeleton" />)}
            </div>
          ) : sortedRooms.length === 0 ? (
            <div className="empty-state">
              <h3>No rooms match those dates</h3>
              <p>Try widening your date range or reducing the number of guests.</p>
            </div>
          ) : (
            <div className="room-grid">
              {sortedRooms.map((room) => (
                <RoomCard key={room.id} room={room} searchParams={queryString} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
