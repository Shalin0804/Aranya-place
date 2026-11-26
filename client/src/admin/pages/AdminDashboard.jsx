import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import StatCard from '../components/StatCard';
import { adminApi } from '../services/adminApi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminApi.dashboard();

      console.log('ADMIN DASHBOARD RESPONSE:', response);

      setData(response?.data || {});
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(
        err?.message ||
        'Unable to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <strong>Dashboard Error</strong>
        <p>{error}</p>

        <button
          className="admin-primary-button"
          onClick={loadDashboard}
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = data || {};

  return (
    <div className="admin-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-intro">

        <div>
          <h2>
            Welcome back 👋
          </h2>

          <p>
            Here's what's happening at Aranya Palace today.
          </p>
        </div>

        <button
          className="admin-primary-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="stats-grid">

        <StatCard
          title="Total Bookings"
          value={Number(stats.totalBookings || 0)}
          icon="📅"
          description="All bookings"
        />

        <StatCard
          title="Today's Bookings"
          value={Number(stats.todayBookings || 0)}
          icon="🗓️"
          description="Created today"
        />

        <StatCard
          title="Total Revenue"
          value={`₹${Number(
            stats.totalRevenue || 0
          ).toLocaleString('en-IN')}`}
          icon="₹"
          description="Paid bookings"
        />

        <StatCard
          title="Today's Revenue"
          value={`₹${Number(
            stats.todayRevenue || 0
          ).toLocaleString('en-IN')}`}
          icon="💰"
          description="Today's paid revenue"
        />

        <StatCard
          title="Revenue This Week / Month"
          value={`₹${Number(stats.weekRevenue || 0).toLocaleString('en-IN')}`}
          icon="📈"
          description={`₹${Number(stats.monthRevenue || 0).toLocaleString('en-IN')} this month`}
        />

        <StatCard
          title="Today's Check-ins"
          value={Number(stats.todayCheckIns || 0)}
          icon="🛎️"
          description={`${Number(stats.pendingArrivals || 0)} still to arrive`}
        />

        <StatCard
          title="Today's Check-outs"
          value={Number(stats.todayCheckOuts || 0)}
          icon="🧳"
          description={`${Number(stats.pendingDepartures || 0)} still to depart`}
        />

        <StatCard
          title="Occupied Tonight"
          value={`${Number(stats.occupiedRooms || 0)} (${Number(stats.occupancyRate || 0)}%)`}
          icon="🔑"
          description="Rooms booked for tonight"
        />

        <StatCard
          title="Available Tonight"
          value={Number(
            stats.availableRooms || 0
          )}
          icon="🛏️"
          description={`Out of ${
            Number(stats.totalRooms || 0)
          } rooms${stats.outOfOrderRooms ? `, ${stats.outOfOrderRooms} out of order` : ''}`}
        />

        <StatCard
          title="Total Customers"
          value={Number(
            stats.totalCustomers || 0
          )}
          icon="👥"
          description="Registered customers"
        />

        <StatCard
          title="Pending Bookings"
          value={Number(
            stats.pendingBookings || 0
          )}
          icon="⏳"
          description="Awaiting confirmation"
        />

        <StatCard
          title="Confirmed Bookings"
          value={Number(
            stats.confirmedBookings || 0
          )}
          icon="✅"
          description="Confirmed reservations"
        />

        <StatCard
          title="Pending Payments"
          value={Number(
            stats.pendingPayments || 0
          )}
          icon="💳"
          description="Payments pending"
        />

        <StatCard
          title="Pending Reviews"
          value={Number(
            stats.pendingReviews || 0
          )}
          icon="⭐"
          description="Waiting for approval"
        />

        <StatCard
          title="Active Offers"
          value={Number(
            stats.activeOffers || 0
          )}
          icon="🏷️"
          description="Currently active"
        />

      </div>


      {/* =====================================================
          LOWER GRID
      ===================================================== */}

      <div className="dashboard-grid">


        {/* =================================================
            RECENT BOOKINGS
        ================================================= */}

        <section className="admin-panel-card">

          <div className="panel-heading">

            <div>
              <h3>
                Recent Bookings
              </h3>

              <p>
                Latest reservations
              </p>
            </div>

            <Link
              to="/admin/bookings"
              className="admin-secondary-button"
            >
              View All
            </Link>

          </div>


          {Array.isArray(
            data?.recentBookings
          ) &&
          data.recentBookings.length > 0 ? (

            <div className="table-wrapper">

              <table className="admin-table">

                <thead>

                  <tr>
                    <th>Reference</th>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {data.recentBookings.map(
                    (booking) => (

                      <tr
                        key={booking.id}
                      >

                        <td>
                          <strong>
                            {booking.booking_ref || '-'}
                          </strong>
                        </td>

                        <td>
                          {booking.guest_name || '-'}
                        </td>

                        <td>
                          {booking.room_type_name || '-'}
                        </td>

                        <td>
                          ₹
                          {Number(
                            booking.total_amount || 0
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td>

                          <span
                            className={`status status-${String(
                              booking.status || ''
                            )
                              .toLowerCase()
                              .replaceAll(
                                ' ',
                                '-'
                              )}`}
                          >
                            {booking.status || '-'}
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="empty-state">
              No recent bookings.
            </div>

          )}

        </section>


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="admin-panel-card">

          <div className="panel-heading">

            <div>

              <h3>
                Quick Actions
              </h3>

              <p>
                Common management tasks
              </p>

            </div>

          </div>


          <div className="quick-actions">

            <Link to="/admin/bookings">
              📅 Manage Bookings
            </Link>

            <Link to="/admin/rooms">
              🛏️ Manage Rooms
            </Link>

            <Link to="/admin/customers">
              👥 Manage Customers
            </Link>

            <Link to="/admin/reviews">
              ⭐ Review Moderation
            </Link>

            <Link to="/admin/offers">
              🏷️ Manage Offers
            </Link>

            <Link to="/admin/gallery">
              🖼️ Manage Gallery
            </Link>

            <Link to="/admin/settings">
              ⚙️ Hotel Settings
            </Link>

          </div>

        </section>

      </div>

    </div>
  );
}