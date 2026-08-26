const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* =========================================================
   COMMON REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("adminToken");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new Error(
      `Failed to fetch. Make sure the backend server is running on ${API_BASE_URL}.`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}


/* =========================================================
   AUTH
========================================================= */

export async function adminLogin(email, password) {
  return apiRequest("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}


export async function getAdminProfile() {
  return apiRequest("/admin/auth/me");
}


export function adminLogout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}


/* =========================================================
   DASHBOARD
========================================================= */

export async function getDashboard() {
  return apiRequest("/admin/dashboard");
}


/* =========================================================
   BOOKINGS
========================================================= */

export async function getAdminBookings(params = {}) {
  const query = new URLSearchParams();

  if (params.page) {
    query.append("page", params.page);
  }

  if (params.limit) {
    query.append("limit", params.limit);
  }

  if (params.search) {
    query.append("search", params.search);
  }

  if (params.status && params.status !== "all") {
    query.append("status", params.status);
  }

  if (
    params.paymentStatus &&
    params.paymentStatus !== "all"
  ) {
    query.append(
      "paymentStatus",
      params.paymentStatus
    );
  }

  const queryString = query.toString();

  return apiRequest(
    `/admin/bookings${
      queryString ? `?${queryString}` : ""
    }`
  );
}


export async function getAdminBookingById(id) {
  return apiRequest(`/admin/bookings/${id}`);
}


export async function updateBookingStatus(
  id,
  status
) {
  return apiRequest(
    `/admin/bookings/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }
  );
}


export async function updatePaymentStatus(
  id,
  paymentStatus
) {
  return apiRequest(
    `/admin/bookings/${id}/payment-status`,
    {
      method: "PUT",
      body: JSON.stringify({
        payment_status: paymentStatus,
      }),
    }
  );
}


export async function cancelAdminBooking(id) {
  return apiRequest(
    `/admin/bookings/${id}/cancel`,
    {
      method: "PUT",
    }
  );
}


/* =========================================================
   CUSTOMERS
========================================================= */

export async function getAdminCustomers() {
  return apiRequest("/admin/customers");
}


export async function getAdminCustomerById(id) {
  return apiRequest(
    `/admin/customers/${id}`
  );
}


export async function updateCustomerStatus(
  id,
  status
) {
  return apiRequest(
    `/admin/customers/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }
  );
}


/* =========================================================
   ROOMS
========================================================= */

export async function getAdminRooms() {
  return apiRequest("/admin/rooms");
}


export async function getAdminRoomById(id) {
  return apiRequest(
    `/admin/rooms/${id}`
  );
}


export async function createRoom(room) {
  return apiRequest("/admin/rooms", {
    method: "POST",
    body: JSON.stringify(room),
  });
}


export async function updateRoom(
  id,
  room
) {
  return apiRequest(
    `/admin/rooms/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(room),
    }
  );
}


export async function updateRoomStatus(
  id,
  status
) {
  return apiRequest(
    `/admin/rooms/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }
  );
}


export async function deleteRoom(id) {
  return apiRequest(
    `/admin/rooms/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   ROOM TYPES
========================================================= */

export async function getRoomTypes() {
  return apiRequest(
    "/admin/rooms/room-types"
  );
}


export async function createRoomType(
  roomType
) {
  return apiRequest(
    "/admin/rooms/room-types",
    {
      method: "POST",
      body: JSON.stringify(roomType),
    }
  );
}


export async function updateRoomType(
  id,
  roomType
) {
  return apiRequest(
    `/admin/rooms/room-types/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(roomType),
    }
  );
}


export async function deleteRoomType(id) {
  return apiRequest(
    `/admin/rooms/room-types/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   OFFERS
========================================================= */

export async function getAdminOffers() {
  return apiRequest("/admin/offers");
}


export async function getAdminOfferById(id) {
  return apiRequest(
    `/admin/offers/${id}`
  );
}


export async function createOffer(
  offer
) {
  return apiRequest("/admin/offers", {
    method: "POST",
    body: JSON.stringify(offer),
  });
}


export async function updateOffer(
  id,
  offer
) {
  return apiRequest(
    `/admin/offers/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(offer),
    }
  );
}


export async function updateOfferStatus(
  id,
  status
) {
  return apiRequest(
    `/admin/offers/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }
  );
}


export async function deleteOffer(id) {
  return apiRequest(
    `/admin/offers/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   REVIEWS
========================================================= */

export async function getAdminReviews() {
  return apiRequest("/admin/reviews");
}


export async function updateReviewStatus(
  id,
  status
) {
  return apiRequest(
    `/admin/reviews/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify({
        status,
      }),
    }
  );
}


export async function deleteReview(id) {
  return apiRequest(
    `/admin/reviews/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   GALLERY
========================================================= */

export async function getAdminGallery() {
  return apiRequest("/admin/gallery");
}


export async function createGalleryImage(
  formData
) {
  return apiRequest("/admin/gallery", {
    method: "POST",
    body: formData,
  });
}


export async function updateGalleryImage(
  id,
  formData
) {
  return apiRequest(
    `/admin/gallery/${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );
}


export async function deleteGalleryImage(
  id
) {
  return apiRequest(
    `/admin/gallery/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   SETTINGS
========================================================= */

export async function getAdminSettings() {
  return apiRequest("/admin/settings");
}


export async function updateSettings(
  settings
) {
  return apiRequest(
    "/admin/settings",
    {
      method: "PUT",
      body: JSON.stringify(settings),
    }
  );
}


/* =========================================================
   ADMIN API OBJECT
========================================================= */

export const adminApi = {

  /* Authentication */
  adminLogin,
  getAdminProfile,
  adminLogout,

  /* Dashboard */
  dashboard: getDashboard,

  /* Bookings */
  bookings: getAdminBookings,
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  cancelAdminBooking,

  /* Customers */
  customers: getAdminCustomers,
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,

  /* Rooms */
  rooms: getAdminRooms,
  getAdminRooms,
  getAdminRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,

  /* Room Types */
  roomTypes: {
    list: getRoomTypes,
    create: createRoomType,
    update: updateRoomType,
    delete: deleteRoomType,
  },

  /* Offers */
  offers: getAdminOffers,
  getAdminOffers,
  getAdminOfferById,
  createOffer,
  updateOffer,
  updateOfferStatus,
  deleteOffer,

  /* Reviews */
  reviews: getAdminReviews,
  getAdminReviews,
  updateReviewStatus,
  deleteReview,

  /* Gallery */
  gallery: getAdminGallery,
  getAdminGallery,
  createGallery: createGalleryImage,
  updateGallery: updateGalleryImage,
  deleteGallery: deleteGalleryImage,

  /* Settings */
  settings: getAdminSettings,
  getAdminSettings,
  updateSettings,
};


export default adminApi;