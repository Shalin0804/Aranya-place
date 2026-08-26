import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

const emptyRoom = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  base_price: '',
  max_guests: 2,
  bed_type: '',
  size_sqft: '',
  sort_order: 0,
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyRoom);
  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      setLoading(true);

      const response =
        await adminApi.roomTypes.list();

      const data =
        response?.data?.roomTypes ||
        response?.data ||
        [];

      setRooms(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        'Load room types error:',
        err
      );

      alert(
        err.message ||
        'Failed to load room types.'
      );

    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyRoom);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),

        slug:
          form.slug.trim() ||
          form.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),

        tagline:
          form.tagline.trim(),

        description:
          form.description.trim(),

        base_price:
          Number(form.base_price),

        max_guests:
          Number(form.max_guests),

        bed_type:
          form.bed_type.trim(),

        size_sqft:
          Number(form.size_sqft),

        sort_order:
          Number(form.sort_order || 0),
      };

      if (!payload.name) {
        throw new Error(
          'Room name is required.'
        );
      }

      if (!payload.base_price) {
        throw new Error(
          'Base price is required.'
        );
      }

      if (!payload.bed_type) {
        throw new Error(
          'Bed type is required.'
        );
      }

      if (!payload.size_sqft) {
        throw new Error(
          'Room size is required.'
        );
      }

      if (editing) {

        await adminApi.roomTypes.update(
          editing,
          payload
        );

      } else {

        await adminApi.roomTypes.create(
          payload
        );
      }

      alert(
        editing
          ? 'Room type updated successfully.'
          : 'Room type created successfully.'
      );

      resetForm();

      await loadRooms();

    } catch (err) {

      console.error(
        'Save room type error:',
        err
      );

      alert(
        err.message ||
        'Failed to save room type.'
      );

    } finally {
      setSaving(false);
    }
  }

  function editRoom(room) {

    setEditing(room.id);

    setForm({
      name:
        room.name || '',

      slug:
        room.slug || '',

      tagline:
        room.tagline || '',

      description:
        room.description || '',

      base_price:
        room.base_price || '',

      max_guests:
        room.max_guests || 2,

      bed_type:
        room.bed_type || '',

      size_sqft:
        room.size_sqft || '',

      sort_order:
        room.sort_order || 0,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function deleteRoom(id) {

    const confirmed =
      window.confirm(
        'Are you sure you want to delete this room type?'
      );

    if (!confirmed) {
      return;
    }

    try {

      await adminApi.roomTypes.delete(
        id
      );

      alert(
        'Room type deleted successfully.'
      );

      await loadRooms();

    } catch (err) {

      console.error(
        'Delete room type error:',
        err
      );

      alert(
        err.message ||
        'Failed to delete room type.'
      );
    }
  }

  return (
    <div>

      {/* HEADER */}

      <div className="page-intro">

        <div>

          <h2>
            Room Types
          </h2>

          <p>
            Manage room categories,
            pricing and guest capacity.
          </p>

        </div>

      </div>


      {/* MAIN */}

      <div className="admin-two-column">


        {/* FORM */}

        <div className="admin-panel-card">

          <h3>
            {editing
              ? 'Edit Room Type'
              : 'Add Room Type'}
          </h3>


          <form
            className="admin-form"
            onSubmit={handleSubmit}
          >


            {/* NAME */}

            <label>
              Room Name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Deluxe Room"
              required
            />


            {/* SLUG */}

            <label>
              Slug
            </label>

            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="deluxe-room"
              required
            />


            {/* TAGLINE */}

            <label>
              Tagline
            </label>

            <input
              name="tagline"
              value={form.tagline}
              onChange={handleChange}
              placeholder="Elegant comfort for your stay"
            />


            {/* DESCRIPTION */}

            <label>
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="5"
              placeholder="Describe the room..."
            />


            {/* PRICE / GUESTS */}

            <div className="form-grid">

              <div>

                <label>
                  Base Price / Night
                </label>

                <input
                  type="number"
                  name="base_price"
                  value={form.base_price}
                  onChange={handleChange}
                  min="0"
                  required
                />

              </div>


              <div>

                <label>
                  Maximum Guests
                </label>

                <input
                  type="number"
                  name="max_guests"
                  value={form.max_guests}
                  onChange={handleChange}
                  min="1"
                  required
                />

              </div>

            </div>


            {/* BED */}

            <label>
              Bed Type
            </label>

            <input
              name="bed_type"
              value={form.bed_type}
              onChange={handleChange}
              placeholder="King Bed"
              required
            />


            {/* SIZE */}

            <label>
              Size (sq ft)
            </label>

            <input
              type="number"
              name="size_sqft"
              value={form.size_sqft}
              onChange={handleChange}
              min="1"
              required
            />


            {/* ORDER */}

            <label>
              Display Order
            </label>

            <input
              type="number"
              name="sort_order"
              value={form.sort_order}
              onChange={handleChange}
              min="0"
            />


            {/* BUTTONS */}

            <div className="form-actions">

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >

                {saving
                  ? 'Saving...'
                  : editing
                  ? 'Update Room Type'
                  : 'Create Room Type'}

              </button>


              {editing && (

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>

              )}

            </div>

          </form>

        </div>


        {/* ROOM LIST */}

        <div className="admin-panel-card">

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >

            <div>

              <h3>
                Room Types
              </h3>

              <p>
                {rooms.length}{' '}
                room type
                {rooms.length !== 1
                  ? 's'
                  : ''}
              </p>

            </div>


            <button
              className="admin-secondary-button"
              onClick={loadRooms}
              disabled={loading}
            >
              Refresh
            </button>

          </div>


          {loading ? (

            <div className="admin-loading">
              Loading room types...
            </div>

          ) : rooms.length === 0 ? (

            <div className="empty-state">

              <h3>
                No room types found
              </h3>

              <p>
                Create your first room type
                using the form.
              </p>

            </div>

          ) : (

            <div className="room-admin-list">

              {rooms.map((room) => (

                <div
                  className="room-admin-card"
                  key={room.id}
                >

                  <div>

                    <h3>
                      {room.name}
                    </h3>

                    {room.tagline && (

                      <p>
                        {room.tagline}
                      </p>

                    )}

                    <p>
                      ₹
                      {Number(
                        room.base_price || 0
                      ).toLocaleString(
                        'en-IN'
                      )}
                      {' / night'}
                    </p>

                    <small>
                      Up to{' '}
                      {room.max_guests}
                      {' '}guests
                      {' • '}
                      {room.bed_type}
                      {' • '}
                      {room.size_sqft}
                      {' '}sq ft
                    </small>

                  </div>


                  <div className="card-actions">

                    <button
                      onClick={() =>
                        editRoom(room)
                      }
                    >
                      Edit
                    </button>


                    <button
                      className="danger-button"
                      onClick={() =>
                        deleteRoom(
                          room.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}