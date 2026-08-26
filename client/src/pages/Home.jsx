import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineWifi, HiOutlineSparkles, HiOutlineSun, HiStar,
  HiOutlineLocationMarker, HiArrowRight, HiOutlineDesktopComputer,
} from 'react-icons/hi';
import { GiMeal, GiFlowerPot, GiSwimfins } from 'react-icons/gi';
import SearchWidget from '../components/SearchWidget';
import RoomCard from '../components/RoomCard';
import LeafDivider from '../components/LeafDivider';
import { roomTypesApi, offersApi, reviewsApi, galleryApi } from '../services/api';
import { formatCurrency } from '../utils/format';
import './Home.css';

const AMENITIES = [
  { icon: <GiSwimfins size={26} />, label: 'Orchard-facing pool', desc: 'A 20-metre pool framed by mango trees, open sunrise to sunset.' },
  { icon: <HiOutlineSparkles size={26} />, label: 'Full-service spa', desc: 'Ayurvedic and Balinese therapies in six private treatment rooms.' },
  { icon: <GiMeal size={26} />, label: 'Courtyard dining', desc: 'Regional Gujarati and pan-Indian menus, served under the mango canopy.' },
  { icon: <HiOutlineWifi size={26} />, label: 'Complimentary Wi-Fi', desc: 'Fibre-backed connectivity across every room and public space.' },
  { icon: <GiFlowerPot size={26} />, label: 'Fifteen-acre gardens', desc: 'Walking trails through working orchard and ornamental gardens.' },
  { icon: <HiOutlineDesktopComputer size={26} />, label: 'Work-friendly rooms', desc: 'A proper desk and reliable connectivity in every category.' },
];

const ATTRACTIONS = [
  { name: 'Sabarmati Riverfront', distance: '38 km', image: 'https://images.unsplash.com/photo-1609948543331-e2fb87e8c8c1?w=800' },
  { name: 'Adalaj Stepwell', distance: '25 km', image: 'https://images.unsplash.com/photo-1600100397608-f0d2a3427633?w=800' },
  { name: 'Sanand Handicraft Village', distance: '12 km', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800' },
];

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [offers, setOffers] = useState([]);
  const [reviewData, setReviewData] = useState({ reviews: [], avgRating: 0, totalReviews: 0 });
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      roomTypesApi.list().catch(() => []),
      offersApi.list().catch(() => []),
      reviewsApi.list({ limit: 6 }).catch(() => ({ reviews: [], avgRating: 0, totalReviews: 0 })),
      galleryApi.list().catch(() => []),
    ]).then(([roomsData, offersData, reviewsRes, galleryData]) => {
      setRooms(roomsData);
      setOffers(offersData);
      setReviewData(reviewsRes);
      setGallery(galleryData.slice(0, 5));
      setLoading(false);
    });
  }, []);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1800"
            alt="Aranya Palace courtyard at golden hour"
          />
          <div className="hero-wash" />
        </div>

        <div className="container hero-content">
          <p className="eyebrow hero-eyebrow">Ahmedabad, Gujarat &middot; Est. 1926, Restored 2019</p>
          <h1 className="hero-title">
            Experience Comfort.<br /> Stay in Luxury.
          </h1>
          <p className="hero-sub">
            A restored haveli set among fifteen acres of mango orchard — forty rooms,
            one spa, and a courtyard that hasn't stopped hosting since 1926.
          </p>
        </div>

        <div className="container hero-search-wrap">
          <SearchWidget variant="hero" />
        </div>
      </section>

      {/* ---------- Featured Rooms ---------- */}
      <section className="section" id="rooms">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow" style={{ justifyContent: 'center' }}>Where to stay</p>
            <h2 className="text-3xl">Featured Rooms &amp; Suites</h2>
          </div>

          <div className="room-grid">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton room-skeleton" />)
              : rooms.slice(0, 3).map((room) => <RoomCard key={room.id} room={room} />)}
          </div>

          <div className="section-cta">
            <Link to="/rooms" className="btn btn-outline">
              View All Rooms &amp; Suites <HiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <LeafDivider />

      {/* ---------- About ---------- */}
      <section className="section about">
        <div className="container about-grid">
          <div className="about-media">
            <img src="https://images.unsplash.com/photo-1596436889106-be35e843f974?w=900" alt="The restored haveli facade" />
            <img src="https://images.unsplash.com/photo-1601565415267-724dbe9c4747?w=600" alt="A quiet reading corner" className="about-media-small" />
          </div>
          <div className="about-copy">
            <p className="eyebrow">About the hotel</p>
            <h2 className="text-3xl">A haveli that never stopped being lived in</h2>
            <p>
              Aranya Palace began in 1926 as the summer residence of a textile family, built
              around a working mango orchard that still bears fruit every March. In 2019 we
              restored the original structure room by room — keeping the hand-painted ceilings,
              the jaali screens, the teak — and added the plunge pools, the spa wing, and forty
              guest rooms across six categories.
            </p>
            <p>
              What hasn't changed is the pace. There's no rush here: breakfast runs until
              guests stop asking for it, the pool stays quiet past sunset, and the courtyard
              is still where most evenings end.
            </p>
            <div className="about-stats">
              <div><strong>1926</strong><span>Original haveli built</span></div>
              <div><strong>15</strong><span>Acres of orchard</span></div>
              <div><strong>40</strong><span>Rooms across 6 categories</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Amenities ---------- */}
      <section className="section amenities">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow" style={{ justifyContent: 'center' }}>On the property</p>
            <h2 className="text-3xl">Hotel Amenities</h2>
          </div>
          <div className="amenities-grid">
            {AMENITIES.map((a) => (
              <div className="amenity-card" key={a.label}>
                <div className="amenity-icon">{a.icon}</div>
                <h3>{a.label}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Special Offers ---------- */}
      {offers.length > 0 && (
        <section className="section offers" id="offers">
          <div className="container">
            <div className="section-head center">
              <p className="eyebrow" style={{ justifyContent: 'center' }}>Limited time</p>
              <h2 className="text-3xl">Special Offers</h2>
            </div>
            <div className="offers-grid">
              {offers.map((offer) => (
                <div className="offer-card" key={offer.id}>
                  <HiOutlineSun size={22} />
                  <h3>{offer.name}</h3>
                  <p>{offer.description}</p>
                  <span className="offer-valid">
                    Valid through {new Date(offer.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <LeafDivider />

      {/* ---------- Gallery preview ---------- */}
      {gallery.length > 0 && (
        <section className="section gallery-preview">
          <div className="container">
            <div className="section-head center">
              <p className="eyebrow" style={{ justifyContent: 'center' }}>A closer look</p>
              <h2 className="text-3xl">Gallery</h2>
            </div>
            <div className="gallery-preview-grid">
              {gallery.map((img, i) => (
                <img key={img.id} src={img.image_url} alt={img.caption || 'Aranya Palace'} className={i === 0 ? 'gallery-featured' : ''} loading="lazy" />
              ))}
            </div>
            <div className="section-cta">
              <Link to="/gallery" className="btn btn-outline">View Full Gallery <HiArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Reviews ---------- */}
      <section className="section reviews" id="reviews">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow" style={{ justifyContent: 'center' }}>Guest reviews</p>
            <h2 className="text-3xl">What Guests Are Saying</h2>
            {reviewData.totalReviews > 0 && (
              <p className="reviews-summary">
                <HiStar className="star-icon" /> {reviewData.avgRating} average
                &middot; {reviewData.totalReviews} verified reviews
              </p>
            )}
          </div>
          <div className="reviews-grid">
            {reviewData.reviews.map((r) => (
              <div className="review-card" key={r.id}>
                <div className="review-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <HiStar key={i} className={i < r.rating ? 'star-icon filled' : 'star-icon'} />
                  ))}
                </div>
                <h4>{r.title}</h4>
                <p>&ldquo;{r.comment}&rdquo;</p>
                <span className="review-author">{r.guest_name}{r.room_type_name ? ` — ${r.room_type_name}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Nearby Attractions ---------- */}
      <section className="section attractions">
        <div className="container">
          <div className="section-head center">
            <p className="eyebrow" style={{ justifyContent: 'center' }}>Beyond the gates</p>
            <h2 className="text-3xl">Nearby Attractions</h2>
          </div>
          <div className="attractions-grid">
            {ATTRACTIONS.map((a) => (
              <div className="attraction-card" key={a.name}>
                <img src={a.image} alt={a.name} loading="lazy" />
                <div className="attraction-info">
                  <h3>{a.name}</h3>
                  <span><HiOutlineLocationMarker size={14} /> {a.distance} away</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="hero-cta">
        <div className="container hero-cta-inner">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2 className="text-3xl">Your stay starts at {formatCurrency(6500)} a night</h2>
          </div>
          <Link to="/rooms" className="btn btn-brass">Check Availability</Link>
        </div>
      </section>
    </>
  );
}
