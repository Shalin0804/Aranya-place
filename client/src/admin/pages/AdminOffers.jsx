import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

const initialForm = {
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  start_date: '',
  end_date: '',
  min_nights: 1,
  max_usage: '',
};

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      const response = await adminApi.offers();
      setOffers(response.data?.offers || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    try {
      await adminApi.createOffer(form);

      setForm(initialForm);

      await loadOffers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this offer?')) return;

    try {
      await adminApi.deleteOffer(id);
      await loadOffers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>

      <div className="page-intro">
        <div>
          <h2>Offers</h2>
          <p>Create and manage promotional offers.</p>
        </div>
      </div>

      <div className="admin-two-column">

        <div className="admin-panel-card">

          <h3>Create Offer</h3>

          <form
            className="admin-form"
            onSubmit={submit}
          >

            <label>Offer Name</label>

            <input
              name="name"
              value={form.name}
              onChange={change}
              placeholder="Early Bird — 15% Off"
              required
            />

            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={change}
            />

            <label>Discount Type</label>

            <select
              name="discount_type"
              value={form.discount_type}
              onChange={change}
            >
              <option value="percentage">
                Percentage
              </option>

              <option value="fixed">
                Fixed Amount
              </option>
            </select>

            <label>Discount Value</label>

            <input
              type="number"
              name="discount_value"
              value={form.discount_value}
              onChange={change}
              required
            />

            <div className="form-grid">

              <div>
                <label>Start Date</label>

                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={change}
                  required
                />
              </div>

              <div>
                <label>End Date</label>

                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={change}
                  required
                />
              </div>

            </div>

            <div className="form-grid">

              <div>
                <label>Minimum Nights</label>

                <input
                  type="number"
                  name="min_nights"
                  value={form.min_nights}
                  onChange={change}
                  min="1"
                />
              </div>

              <div>
                <label>Maximum Usage</label>

                <input
                  type="number"
                  name="max_usage"
                  value={form.max_usage}
                  onChange={change}
                  placeholder="Unlimited"
                />
              </div>

            </div>

            <button
              className="admin-primary-button"
              type="submit"
            >
              Create Offer
            </button>

          </form>

        </div>

        <div className="admin-panel-card">

          <h3>Existing Offers</h3>

          {loading ? (
            <div className="admin-loading">
              Loading offers...
            </div>
          ) : (
            <div className="offer-list">

              {offers.map((offer) => (
                <div
                  className="offer-admin-card"
                  key={offer.id}
                >
                  <div>
                    <strong>{offer.name}</strong>

                    {offer.description && (
                      <p>{offer.description}</p>
                    )}

                    <small>
                      {offer.discount_type === 'percentage'
                        ? `${offer.discount_value}% OFF`
                        : `₹${offer.discount_value} OFF`}
                      {' • '}
                      {offer.status}
                    </small>
                  </div>

                  <button
                    className="danger-button"
                    onClick={() => remove(offer.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}