import { useEffect, useState } from 'react';
import { galleryApi } from '../services/api';
import './Gallery.css';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'room', label: 'Rooms' },
  { key: 'pool', label: 'Pool' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'facility', label: 'Facilities' },
  { key: 'event', label: 'Events' },
];

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setLoading(true);
    galleryApi.list(category ? { category } : {})
      .then(setImages)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="gallery-page">
      <title>Gallery — Aranya Palace Resort &amp; Spa</title>
      <section className="rooms-hero">
        <div className="container">
          <p className="eyebrow">A closer look</p>
          <h1 className="text-4xl">Gallery</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gallery-filters">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                className={`gallery-filter ${category === c.key ? 'active' : ''}`}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="gallery-masonry">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton gallery-skeleton" />)}
            </div>
          ) : images.length === 0 ? (
            <div className="empty-state"><h3>No images in this category yet</h3></div>
          ) : (
            <div className="gallery-masonry">
              {images.map((img) => (
                <button key={img.id} className="gallery-item" onClick={() => setLightbox(img)}>
                  <img src={img.image_url} alt={img.caption || ''} loading="lazy" />
                  {img.caption && <span className="gallery-caption">{img.caption}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <img src={lightbox.image_url} alt={lightbox.caption || ''} />
        </div>
      )}
    </div>
  );
}
