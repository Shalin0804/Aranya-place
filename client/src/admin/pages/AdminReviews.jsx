import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const response = await adminApi.reviews();
      setReviews(response.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateReview(id, status) {
    try {
      await adminApi.updateReviewStatus(id, status);
      await loadReviews();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>

      <div className="page-intro">
        <div>
          <h2>Reviews</h2>
          <p>Moderate guest reviews.</p>
        </div>
      </div>

      <div className="admin-panel-card">

        {loading ? (
          <div className="admin-loading">
            Loading reviews...
          </div>
        ) : (
          <div className="review-list">

            {reviews.map((review) => (
              <div className="review-admin-card" key={review.id}>

                <div className="review-top">
                  <div>
                    <strong>{review.guest_name}</strong>

                    <div className="stars">
                      {'★'.repeat(Number(review.rating))}
                      {'☆'.repeat(5 - Number(review.rating))}
                    </div>
                  </div>

                  <span className="status">
                    {review.status}
                  </span>
                </div>

                <h3>{review.title || 'Guest Review'}</h3>

                <p>{review.comment}</p>

                <small>
                  Room: {review.room_type_name || 'General'}
                </small>

                {review.status === 'Pending' && (
                  <div className="review-actions">
                    <button
                      className="approve-button"
                      onClick={() =>
                        updateReview(review.id, 'Approved')
                      }
                    >
                      ✓ Approve
                    </button>

                    <button
                      className="reject-button"
                      onClick={() =>
                        updateReview(review.id, 'Rejected')
                      }
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

              </div>
            ))}

            {!reviews.length && (
              <div className="empty-state">
                No reviews found.
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}