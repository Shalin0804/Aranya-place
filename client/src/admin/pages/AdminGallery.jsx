import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

const CATEGORIES = [
  'hotel',
  'room',
  'restaurant',
  'pool',
  'facility',
  'event',
];

export default function AdminGallery() {
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    image_url: '',
    caption: '',
    category: CATEGORIES[0],
  });

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    try {
      const response = await adminApi.gallery();
      setImages(response.data?.gallery || []);
    } catch (err) {
      alert(err.message);
    }
  }

  async function submit(e) {
    e.preventDefault();

    try {
      await adminApi.createGallery(form);

      setForm({
        image_url: '',
        caption: '',
        category: CATEGORIES[0],
      });

      await loadGallery();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this image?')) return;

    try {
      await adminApi.deleteGallery(id);
      await loadGallery();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>

      <div className="page-intro">
        <div>
          <h2>Gallery</h2>
          <p>Manage resort photographs.</p>
        </div>
      </div>

      <div className="admin-panel-card">

        <h3>Add Image</h3>

        <form
          className="admin-form gallery-form"
          onSubmit={submit}
        >

          <input
            placeholder="Image URL"
            value={form.image_url}
            onChange={(e) =>
              setForm({
                ...form,
                image_url: e.target.value,
              })
            }
            required
          />

          <input
            placeholder="Caption"
            value={form.caption}
            onChange={(e) =>
              setForm({
                ...form,
                caption: e.target.value,
              })
            }
          />

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <button className="admin-primary-button">
            Add Image
          </button>

        </form>

      </div>

      <div className="gallery-admin-grid">

        {images.map((image) => (
          <div
            className="gallery-admin-card"
            key={image.id}
          >

            <img
              src={image.image_url}
              alt={image.caption || 'Gallery'}
            />

            <div className="gallery-admin-info">

              <strong>
                {image.caption || 'Untitled'}
              </strong>

              <small>
                {image.category || 'General'}
              </small>

              <button
                className="danger-button"
                onClick={() => remove(image.id)}
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}