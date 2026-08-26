import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineSearch } from 'react-icons/hi';
import { todayISO, addDaysISO } from '../utils/format';
import './SearchWidget.css';

export default function SearchWidget({ variant = 'hero', initial = {} }) {
  const navigate = useNavigate();
  const minCheckIn = todayISO();
  const [checkIn, setCheckIn] = useState(initial.checkIn || addDaysISO(minCheckIn, 7));
  const [checkOut, setCheckOut] = useState(initial.checkOut || addDaysISO(minCheckIn, 9));
  const [guests, setGuests] = useState(initial.guests || 2);
  const [error, setError] = useState('');

  const handleCheckInChange = (value) => {
    setCheckIn(value);
    if (checkOut <= value) setCheckOut(addDaysISO(value, 2));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      setError('Please choose both dates.');
      return;
    }
    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }
    setError('');
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  return (
    <form className={`search-widget search-widget-${variant}`} onSubmit={handleSubmit}>
      <label className="search-field">
        <span className="search-field-label"><HiOutlineCalendar size={15} /> Check-in</span>
        <input
          type="date"
          value={checkIn}
          min={minCheckIn}
          onChange={(e) => handleCheckInChange(e.target.value)}
          required
        />
      </label>

      <span className="search-divider" aria-hidden="true" />

      <label className="search-field">
        <span className="search-field-label"><HiOutlineCalendar size={15} /> Check-out</span>
        <input
          type="date"
          value={checkOut}
          min={addDaysISO(checkIn, 1)}
          onChange={(e) => setCheckOut(e.target.value)}
          required
        />
      </label>

      <span className="search-divider" aria-hidden="true" />

      <label className="search-field">
        <span className="search-field-label"><HiOutlineUserGroup size={15} /> Guests</span>
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </label>

      <button type="submit" className="btn btn-brass search-submit">
        <HiOutlineSearch size={17} /> Search Rooms
      </button>

      {error && <p className="search-error" role="alert">{error}</p>}
    </form>
  );
}
