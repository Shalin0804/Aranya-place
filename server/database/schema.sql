-- ============================================================
-- Aranya Palace Resort & Spa — Database Schema
-- MySQL 8.0
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Room types (the "product" customers browse & book)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS room_type_images;
DROP TABLE IF EXISTS room_type_amenities;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;

CREATE TABLE room_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  tagline VARCHAR(255),
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  max_guests INT NOT NULL DEFAULT 2,
  bed_type VARCHAR(80) NOT NULL,
  size_sqft INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE room_type_amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_type_id INT NOT NULL,
  amenity VARCHAR(120) NOT NULL,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE room_type_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_type_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Physical rooms (used to compute real availability & for
-- future front-desk / room management features)
-- ------------------------------------------------------------
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  room_type_id INT NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  status ENUM('Available','Occupied','Reserved','Maintenance','Cleaning','Out of Service')
    NOT NULL DEFAULT 'Available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT,
  INDEX idx_rooms_type (room_type_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Customers (auth)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  profile_image VARCHAR(500),
  status ENUM('Active','Disabled') NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Admin users / roles (schema ready now, UI/API arrive in the
-- admin-dashboard phase)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Super Admin','Manager','Receptionist') NOT NULL DEFAULT 'Receptionist',
  status ENUM('Active','Disabled') NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Offers / discounts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS offers;
CREATE TABLE offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500),
  discount_type ENUM('percentage','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  applicable_room_type_id INT NULL,
  min_nights INT NOT NULL DEFAULT 1,
  max_usage INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicable_room_type_id) REFERENCES room_types(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Bookings (one room type per booking, quantity = num_rooms)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT NULL,
  guest_name VARCHAR(150) NOT NULL,
  guest_email VARCHAR(190) NOT NULL,
  guest_phone VARCHAR(30) NOT NULL,
  room_type_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT NOT NULL,
  num_rooms INT NOT NULL,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  special_requests VARCHAR(1000),
  room_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  offer_id INT NULL,
  status ENUM('Pending','Confirmed','Checked In','Checked Out','Cancelled','Completed')
    NOT NULL DEFAULT 'Confirmed',
  payment_status ENUM('Pending','Paid','Failed','Refunded','Partially Paid')
    NOT NULL DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
  INDEX idx_bookings_dates (room_type_id, check_in, check_out),
  INDEX idx_bookings_customer (customer_id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(60),
  transaction_id VARCHAR(120),
  payment_date DATETIME,
  status ENUM('Pending','Paid','Failed','Refunded','Partially Paid') NOT NULL DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Reviews
-- ------------------------------------------------------------
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NULL,
  guest_name VARCHAR(150) NOT NULL,
  rating TINYINT NOT NULL,
  title VARCHAR(150),
  comment TEXT NOT NULL,
  room_type_id INT NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
  CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Gallery
-- ------------------------------------------------------------
DROP TABLE IF EXISTS gallery;
CREATE TABLE gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('hotel','room','restaurant','pool','facility','event') NOT NULL,
  image_url LONGTEXT NOT NULL,
  caption VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Hotel settings (single row, editable from admin in phase 2)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS hotel_settings;
CREATE TABLE hotel_settings (
  id INT PRIMARY KEY DEFAULT 1,
  hotel_name VARCHAR(150) NOT NULL,
  logo_url VARCHAR(500),
  address VARCHAR(255),
  phone VARCHAR(30),
  email VARCHAR(190),
  website VARCHAR(190),
  check_in_time VARCHAR(20) NOT NULL DEFAULT '2:00 PM',
  check_out_time VARCHAR(20) NOT NULL DEFAULT '11:00 AM',
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 12.00,
  cancellation_policy TEXT,
  description TEXT,
  instagram_url VARCHAR(255),
  facebook_url VARCHAR(255),
  twitter_url VARCHAR(255)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Notifications (table ready now, surfaced in admin phase)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  audience ENUM('admin','customer') NOT NULL,
  customer_id INT NULL,
  type VARCHAR(60) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Activity log (audit trail, used from admin phase)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_type ENUM('admin','customer','system') NOT NULL,
  actor_id INT NULL,
  action VARCHAR(150) NOT NULL,
  details JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
