import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aranya_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Unwraps { success, data } and normalizes errors to a plain message string. */
async function request(promise) {
  try {
    const res = await promise;
    return res.data.data !== undefined ? res.data.data : res.data;
  } catch (err) {
    const message = err.response?.data?.message || 'Something went wrong. Please try again.';
    throw new Error(message);
  }
}

export const authApi = {
  register: (payload) => request(api.post('/auth/register', payload)),
  login: (payload) => request(api.post('/auth/login', payload)),
  me: () => request(api.get('/auth/me')),
  updateProfile: (payload) => request(api.put('/auth/me', payload)),
};

export const roomTypesApi = {
  list: (params) => request(api.get('/room-types', { params })),
  bySlug: (slug, params) => request(api.get(`/room-types/${slug}`, { params })),
};

export const bookingsApi = {
  searchAvailability: (params) => request(api.get('/bookings/availability', { params })),
  create: (payload) => request(api.post('/bookings', payload)),
  byRef: (ref, token) => request(api.get(`/bookings/ref/${ref}`, { params: { token } })),
  cancelByRef: (ref, token) => request(api.put(`/bookings/ref/${ref}/cancel`, { token })),
  mine: () => request(api.get('/bookings/me')),
  cancel: (id) => request(api.put(`/bookings/${id}/cancel`)),
};

export const paymentsApi = {
  config: () => request(api.get('/payments/config')),
  createOrder: (bookingRef, token) => request(api.post('/payments/order', { bookingRef, token })),
  verify: (payload) => request(api.post('/payments/verify', payload)),
};

export const reviewsApi = {
  list: (params) => request(api.get('/reviews', { params })),
  submit: (payload) => request(api.post('/reviews', payload)),
};

export const settingsApi = {
  get: () => request(api.get('/settings')),
};

export const offersApi = {
  list: () => request(api.get('/offers')),
};

export const galleryApi = {
  list: (params) => request(api.get('/gallery', { params })),
};

export default api;
