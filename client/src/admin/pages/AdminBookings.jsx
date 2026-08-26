import { useEffect, useState } from 'react';

import {
  getAdminBookings,
  updateBookingStatus,
  updatePaymentStatus,
  cancelAdminBooking,
} from '../services/adminApi';

import '../styles/admin.css';


export default function AdminBookings() {

  /* =====================================================
     STATE
  ===================================================== */

  const [bookings, setBookings] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');

  const [status, setStatus] =
    useState('all');

  const [paymentStatus, setPaymentStatus] =
    useState('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [updating, setUpdating] =
    useState(null);


  /* =====================================================
     LOAD BOOKINGS
  ===================================================== */

  async function loadBookings(
    page = 1
  ) {

    try {

      setLoading(true);
      setError('');

      const response =
        await getAdminBookings({

          page,

          limit: 20,

          search,

          status,

          paymentStatus,

        });


      setBookings(
        response.data?.bookings || []
      );


      setPagination(
        response.data?.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );

    } catch (err) {

      console.error(
        'Admin bookings error:',
        err
      );

      setError(
        err.message ||
        'Unable to load bookings.'
      );

    } finally {

      setLoading(false);

    }
  }


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadBookings(1);

  }, []);


  /* =====================================================
     SEARCH
  ===================================================== */

  function handleSearch(e) {

    e.preventDefault();

    loadBookings(1);
  }


  /* =====================================================
     STATUS CHANGE
  ===================================================== */

  async function handleStatusChange(
    id,
    newStatus
  ) {

    try {

      setUpdating(id);

      await updateBookingStatus(
        id,
        newStatus
      );

      await loadBookings(
        pagination.page
      );

    } catch (err) {

      alert(
        err.message ||
        'Failed to update booking.'
      );

    } finally {

      setUpdating(null);

    }
  }


  /* =====================================================
     PAYMENT CHANGE
  ===================================================== */

  async function handlePaymentChange(
    id,
    newStatus
  ) {

    try {

      setUpdating(id);

      await updatePaymentStatus(
        id,
        newStatus
      );

      await loadBookings(
        pagination.page
      );

    } catch (err) {

      alert(
        err.message ||
        'Failed to update payment.'
      );

    } finally {

      setUpdating(null);

    }
  }


  /* =====================================================
     CANCEL BOOKING
  ===================================================== */

  async function handleCancel(
    id
  ) {

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this booking?'
      );

    if (!confirmed) {
      return;
    }


    try {

      setUpdating(id);

      await cancelAdminBooking(id);

      await loadBookings(
        pagination.page
      );

    } catch (err) {

      alert(
        err.message ||
        'Failed to cancel booking.'
      );

    } finally {

      setUpdating(null);

    }
  }


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  function formatDate(date) {

    if (!date) {
      return '-';
    }

    return new Date(
      date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  }


  /* =====================================================
     FORMAT CURRENCY
  ===================================================== */

  function formatMoney(amount) {

    return Number(
      amount || 0
    ).toLocaleString(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    );
  }


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <div className="admin-page">

        <div className="admin-page-header">

          <div>
            <h1>Bookings</h1>

            <p>
              Manage hotel reservations.
            </p>
          </div>

        </div>


        <div className="admin-loading">

          <div className="admin-spinner" />

          <p>
            Loading bookings...
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="admin-page">


      {/* HEADER */}

      <div className="admin-page-header">

        <div>

          <h1>
            Bookings
          </h1>

          <p>
            Manage all Aranya Palace
            reservations.
          </p>

        </div>


        <button
          className="admin-primary-button"
          onClick={() =>
            loadBookings(
              pagination.page
            )
          }
        >
          ↻ Refresh
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="admin-error">

          {error}

        </div>

      )}


      {/* FILTER BAR */}

      <div className="admin-filter-bar">

        <form
          className="admin-search"
          onSubmit={handleSearch}
        >

          <input
            type="text"
            placeholder="Search booking, guest, email, room..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <button
            type="submit"
            className="admin-primary-button"
          >
            Search
          </button>

        </form>


        <select
          value={status}
          onChange={(e) => {

            setStatus(
              e.target.value
            );

            setTimeout(
              () => loadBookings(1),
              0
            );

          }}
        >

          <option value="all">
            All Booking Status
          </option>

          <option value="Confirmed">
            Confirmed
          </option>

          <option value="Checked In">
            Checked In
          </option>

          <option value="Checked Out">
            Checked Out
          </option>

          <option value="Completed">
            Completed
          </option>

          <option value="Cancelled">
            Cancelled
          </option>

        </select>


        <select
          value={paymentStatus}
          onChange={(e) => {

            setPaymentStatus(
              e.target.value
            );

            setTimeout(
              () => loadBookings(1),
              0
            );

          }}
        >

          <option value="all">
            All Payments
          </option>

          <option value="Pending">
            Pending
          </option>

          <option value="Paid">
            Paid
          </option>

          <option value="Failed">
            Failed
          </option>

          <option value="Refunded">
            Refunded
          </option>

        </select>

      </div>


      {/* SUMMARY */}

      <div className="admin-summary">

        <div>

          <strong>
            {pagination.total}
          </strong>

          <span>
            Total Bookings
          </span>

        </div>

        <div>

          <strong>
            {bookings.filter(
              b =>
                b.status ===
                'Confirmed'
            ).length}
          </strong>

          <span>
            Confirmed
          </span>

        </div>

        <div>

          <strong>
            {bookings.filter(
              b =>
                b.payment_status ===
                'Paid'
            ).length}
          </strong>

          <span>
            Paid
          </span>

        </div>

      </div>


      {/* EMPTY */}

      {!bookings.length && !error && (

        <div className="admin-empty">

          <div className="admin-empty-icon">
            📋
          </div>

          <h3>
            No bookings found
          </h3>

          <p>
            No reservations match
            your current filters.
          </p>

        </div>

      )}


      {/* TABLE */}

      {bookings.length > 0 && (

        <div className="admin-table-container">

          <table className="admin-table">

            <thead>

              <tr>

                <th>
                  Booking
                </th>

                <th>
                  Guest
                </th>

                <th>
                  Room
                </th>

                <th>
                  Stay
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Payment
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {bookings.map(
                booking => (

                  <tr
                    key={
                      booking.id
                    }
                  >


                    {/* BOOKING */}

                    <td>

                      <strong>
                        {
                          booking.booking_ref
                        }
                      </strong>

                      <small>
                        #
                        {
                          booking.id
                        }
                      </small>

                    </td>


                    {/* GUEST */}

                    <td>

                      <strong>
                        {
                          booking.guest_name
                        }
                      </strong>

                      <small>
                        {
                          booking.guest_email
                        }
                      </small>

                      <small>
                        {
                          booking.guest_phone
                        }
                      </small>

                    </td>


                    {/* ROOM */}

                    <td>

                      <strong>
                        {
                          booking.room_type_name
                        }
                      </strong>

                      <small>
                        {
                          booking.num_rooms
                        }
                        {' '}
                        room(s)
                      </small>

                    </td>


                    {/* DATES */}

                    <td>

                      <small>
                        Check-in
                      </small>

                      <strong>
                        {
                          formatDate(
                            booking.check_in
                          )
                        }
                      </strong>

                      <small>
                        Check-out
                      </small>

                      <strong>
                        {
                          formatDate(
                            booking.check_out
                          )
                        }
                      </strong>

                      <small>
                        {
                          booking.nights
                        }
                        {' '}
                        night(s)
                      </small>

                    </td>


                    {/* AMOUNT */}

                    <td>

                      <strong>
                        {
                          formatMoney(
                            booking.total_amount
                          )
                        }
                      </strong>

                      <small>
                        Subtotal:{' '}
                        {
                          formatMoney(
                            booking.subtotal
                          )
                        }
                      </small>

                    </td>


                    {/* PAYMENT */}

                    <td>

                      <select
                        value={
                          booking.payment_status ||
                          'Pending'
                        }
                        disabled={
                          updating ===
                          booking.id
                        }
                        onChange={(e) =>
                          handlePaymentChange(
                            booking.id,
                            e.target.value
                          )
                        }
                      >

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Paid">
                          Paid
                        </option>

                        <option value="Failed">
                          Failed
                        </option>

                        <option value="Refunded">
                          Refunded
                        </option>

                      </select>

                    </td>


                    {/* STATUS */}

                    <td>

                      <select
                        value={
                          booking.status
                        }
                        disabled={
                          updating ===
                          booking.id
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            booking.id,
                            e.target.value
                          )
                        }
                      >

                        <option value="Confirmed">
                          Confirmed
                        </option>

                        <option value="Checked In">
                          Checked In
                        </option>

                        <option value="Checked Out">
                          Checked Out
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>

                      </select>

                    </td>


                    {/* ACTIONS */}

                    <td>

                      <div className="admin-actions">

                        {booking.status !==
                          'Cancelled' &&
                          booking.status !==
                            'Completed' &&
                          booking.status !==
                            'Checked Out' && (

                          <button
                            className="admin-danger-button"
                            disabled={
                              updating ===
                              booking.id
                            }
                            onClick={() =>
                              handleCancel(
                                booking.id
                              )
                            }
                          >
                            Cancel
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}


      {/* PAGINATION */}

      {pagination.totalPages >
        1 && (

        <div className="admin-pagination">

          <button
            disabled={
              pagination.page <= 1
            }
            onClick={() =>
              loadBookings(
                pagination.page - 1
              )
            }
          >
            ← Previous
          </button>


          <span>

            Page{' '}
            <strong>
              {pagination.page}
            </strong>

            {' '}of{' '}

            <strong>
              {
                pagination.totalPages
              }
            </strong>

          </span>


          <button
            disabled={
              pagination.page >=
              pagination.totalPages
            }
            onClick={() =>
              loadBookings(
                pagination.page + 1
              )
            }
          >
            Next →
          </button>

        </div>

      )}

    </div>
  );
}