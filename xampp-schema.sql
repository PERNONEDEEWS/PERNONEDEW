-- =====================================================
-- MR. CHANGE - Complete Database Schema for XAMPP
-- =====================================================
-- MySQL/MariaDB compatible schema for XAMPP
-- Import this into phpMyAdmin to set up the database

-- Create Database
CREATE DATABASE IF NOT EXISTS mr_change;
USE mr_change;

-- =====================================================
-- TABLE 1: users (Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_confirmed_at TIMESTAMP NULL,
  last_sign_in_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 2: profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_profiles_user
    FOREIGN KEY (id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 3: menu_items
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR(500) DEFAULT '',
  category VARCHAR(100) NOT NULL,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category (category),
  INDEX idx_is_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 4: orders
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  order_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  order_number VARCHAR(50) UNIQUE NOT NULL,
  payment_url VARCHAR(500),
  payment_reference VARCHAR(255),
  payment_completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  INDEX idx_customer_id (customer_id),
  INDEX idx_order_number (order_number),
  INDEX idx_payment_status (payment_status),
  INDEX idx_order_status (order_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 5: order_items
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  menu_item_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL CHECK (price_at_time >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_order_items_menu_item
    FOREIGN KEY (menu_item_id)
    REFERENCES menu_items(id)
    ON DELETE CASCADE,

  INDEX idx_order_id (order_id),
  INDEX idx_menu_item_id (menu_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA (Optional - remove if not needed)
-- =====================================================

-- Sample Users
INSERT INTO users (id, email, password_hash) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@mrchange.com', 'hashed_password_here'),
('22222222-2222-2222-2222-222222222222', 'customer1@mrchange.com', 'hashed_password_here');

-- Sample Profiles
INSERT INTO profiles (id, email, username, role, full_name) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@mrchange.com', 'admin_user', 'admin', 'Admin User'),
('22222222-2222-2222-2222-222222222222', 'customer1@mrchange.com', 'john_doe', 'customer', 'John Doe');

-- Sample Menu Items
INSERT INTO menu_items (id, name, description, price, category, stock, is_available) VALUES
('33333333-3333-3333-3333-333333333333', 'Classic Burger', 'Delicious homemade burger', 150.00, 'Main Course', 25, true),
('44444444-4444-4444-4444-444444444444', 'Fried Chicken', 'Crispy fried chicken', 120.00, 'Main Course', 30, true),
('55555555-5555-5555-5555-555555555555', 'Caesar Salad', 'Fresh garden salad', 95.00, 'Salads', 15, true),
('66666666-6666-6666-6666-666666666666', 'Iced Tea', 'Refreshing iced tea', 45.00, 'Beverages', 50, true);

-- Sample Orders
INSERT INTO orders (id, customer_id, total_amount, payment_method, payment_status, order_status, order_number, payment_completed_at) VALUES
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 315.00, 'gcash', 'paid', 'completed', 'ORD-20260307-001', NOW());

-- Sample Order Items
INSERT INTO order_items (id, order_id, menu_item_id, quantity, price_at_time, subtotal) VALUES
('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 2, 150.00, 300.00),
('99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 1, 45.00, 45.00);

-- =====================================================
-- RELATIONSHIP SUMMARY
-- =====================================================
/*
  ENTITIES AND RELATIONSHIPS:

  1. users (1:1) profiles
     - profiles.id references users.id
     - CASCADE DELETE

  2. profiles (1:N) orders
     - orders.customer_id references profiles.id
     - CASCADE DELETE

  3. orders (1:N) order_items
     - order_items.order_id references orders.id
     - CASCADE DELETE

  4. menu_items (1:N) order_items
     - order_items.menu_item_id references menu_items.id
     - CASCADE DELETE

  STATUSES:
  - payment_status: 'pending', 'paid', 'cancelled'
  - order_status: 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  - role: 'admin', 'customer'
  - payment_method: 'counter', 'gcash', 'maya'
*/
