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
    caption: '',
    category: CATEGORIES[0],
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

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

    if (!file) {
      alert('Please choose an image to upload.');
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', form.caption);
      formData.append('category', form.category);

      await adminApi.createGallery(formData);

      setForm({
        caption: '',
        category: CATEGORIES[0],
      });
      setFile(null);
      e.target.reset();

      await loadGallery();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
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
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
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

          <button className="admin-primary-button" disabled={saving}>
            {saving ? 'Uploading...' : 'Add Image'}
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