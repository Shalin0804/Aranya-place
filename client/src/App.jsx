import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Customer pages
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import Booking from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountLayout from './pages/AccountLayout';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import Gallery from './pages/Gallery';
import NotFound from './pages/NotFound';

// Admin
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminBookings from './admin/pages/AdminBookings';
import AdminCustomers from './admin/pages/AdminCustomers';
import AdminGallery from './admin/pages/AdminGallery';
import AdminOffers from './admin/pages/AdminOffers';
import AdminReviews from './admin/pages/AdminReviews';
import AdminRooms from './admin/pages/AdminRooms';
import AdminSettings from './admin/pages/AdminSettings';

import AdminLayout from './admin/components/AdminLayout';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>

          <Routes>

            {/* =========================
                CUSTOMER WEBSITE
            ========================== */}

            <Route element={<Layout />}>

              <Route path="/" element={<Home />} />

              <Route
                path="/rooms"
                element={<Rooms />}
              />

              <Route
                path="/rooms/:slug"
                element={<RoomDetails />}
              />

              <Route
                path="/booking"
                element={<Booking />}
              />

              <Route
                path="/booking-confirmation/:bookingRef"
                element={<BookingConfirmation />}
              />

              <Route
                path="/gallery"
                element={<Gallery />}
              />

              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />

              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={<Profile />}
                />

                <Route
                  path="bookings"
                  element={<MyBookings />}
                />
              </Route>

              <Route
                path="*"
                element={<NotFound />}
              />

            </Route>


            {/* =========================
                ADMIN LOGIN
            ========================== */}

            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />


            {/* =========================
                ADMIN PANEL
            ========================== */}

            <Route element={<AdminProtectedRoute />}>

              <Route
                path="/admin"
                element={<AdminLayout />}
              >

                <Route
                  index
                  element={<AdminDashboard />}
                />

                <Route
                  path="bookings"
                  element={<AdminBookings />}
                />

                <Route
                  path="customers"
                  element={<AdminCustomers />}
                />

                <Route
                  path="rooms"
                  element={<AdminRooms />}
                />

                <Route
                  path="offers"
                  element={<AdminOffers />}
                />

                <Route
                  path="reviews"
                  element={<AdminReviews />}
                />

                <Route
                  path="gallery"
                  element={<AdminGallery />}
                />

                <Route
                  path="settings"
                  element={<AdminSettings />}
                />

              </Route>

            </Route>

          </Routes>

        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}