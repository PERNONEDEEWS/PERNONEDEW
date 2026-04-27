/*
  MR. CHANGE - Complete Database Schema for ERD Generation

  This SQL script shows all tables with their relationships for creating an Entity Relationship Diagram (ERD).

  TABLES:
  1. auth.users (Supabase Auth - built-in)
  2. profiles
  3. menu_items
  4. orders
  5. order_items
  6. storage.buckets (Supabase Storage - built-in)
  7. storage.objects (Supabase Storage - built-in)

  RELATIONSHIPS:
  - profiles.id → auth.users.id (1:1)
  - orders.customer_id → profiles.id (1:N)
  - order_items.order_id → orders.id (1:N)
  - order_items.menu_item_id → menu_items.id (1:N)
  - storage.objects → storage.buckets (N:1)
*/

-- =====================================================
-- TABLE 1: auth.users (Supabase Built-in)
-- =====================================================
-- Note: This is a built-in Supabase table for authentication
-- We reference it but don't create it
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz,
  email_change_token_current text,
  email_change_confirm_status smallint,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean,
  deleted_at timestamptz
);

-- =====================================================
-- TABLE 2: profiles
-- =====================================================
CREATE TABLE profiles (
  -- Primary Key
  id uuid PRIMARY KEY,

  -- Columns
  email text UNIQUE NOT NULL,
  username text UNIQUE,
  role text NOT NULL DEFAULT 'customer',  -- 'admin' or 'customer'
  full_name text,
  created_at timestamptz DEFAULT now(),

  -- Foreign Key
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- =====================================================
-- TABLE 3: menu_items
-- =====================================================
CREATE TABLE menu_items (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Columns
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  image_url text DEFAULT '',
  category text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLE 4: orders
-- =====================================================
CREATE TABLE orders (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  customer_id uuid NOT NULL,

  -- Columns
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_method text NOT NULL,  -- 'counter', 'gcash', or 'maya'
  payment_status text NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'cancelled'
  order_status text NOT NULL DEFAULT 'pending',  -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  order_number text UNIQUE NOT NULL,
  payment_url text,
  payment_reference text,
  payment_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Foreign Key Constraint
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE
);

-- =====================================================
-- TABLE 5: order_items
-- =====================================================
CREATE TABLE order_items (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,

  -- Columns
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time numeric NOT NULL CHECK (price_at_time >= 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now(),

  -- Foreign Key Constraints
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_order_items_menu_item
    FOREIGN KEY (menu_item_id)
    REFERENCES menu_items(id)
    ON DELETE CASCADE
);

-- =====================================================
-- TABLE 6: storage.buckets (Supabase Built-in)
-- =====================================================
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- =====================================================
-- TABLE 7: storage.objects (Supabase Built-in)
-- =====================================================
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[],
  version text,

  -- Foreign Key Constraint
  CONSTRAINT fk_storage_objects_bucket
    FOREIGN KEY (bucket_id)
    REFERENCES storage.buckets(id)
    ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- =====================================================
-- RELATIONSHIP SUMMARY FOR ERD
-- =====================================================
/*
  ENTITIES AND RELATIONSHIPS:

  1. auth.users (1) ←→ (1) profiles
     - One user has one profile
     - profiles.id references auth.users.id
     - CASCADE DELETE: Deleting a user deletes their profile

  2. profiles (1) ←→ (N) orders
     - One profile (customer) can have many orders
     - orders.customer_id references profiles.id
     - CASCADE DELETE: Deleting a profile deletes all their orders

  3. orders (1) ←→ (N) order_items
     - One order contains many order items
     - order_items.order_id references orders.id
     - CASCADE DELETE: Deleting an order deletes all its items

  4. menu_items (1) ←→ (N) order_items
     - One menu item can appear in many order items
     - order_items.menu_item_id references menu_items.id
     - CASCADE DELETE: Deleting a menu item deletes related order items

  5. storage.buckets (1) ←→ (N) storage.objects
     - One bucket contains many objects (files)
     - storage.objects.bucket_id references storage.buckets.id
     - CASCADE DELETE: Deleting a bucket deletes all its objects

  KEY ATTRIBUTES:

  profiles:
    - PK: id (uuid)
    - FK: id → auth.users.id
    - Unique: email, username
    - Role: 'admin' or 'customer'

  menu_items:
    - PK: id (uuid)
    - No FK
    - Attributes: name, price, category, stock, is_available

  orders:
    - PK: id (uuid)
    - FK: customer_id → profiles.id
    - Unique: order_number
    - Status fields: payment_status, order_status

  order_items:
    - PK: id (uuid)
    - FK: order_id → orders.id
    - FK: menu_item_id → menu_items.id
    - Attributes: quantity, price_at_time, subtotal

  storage.objects:
    - PK: id (uuid)
    - FK: bucket_id → storage.buckets.id
    - Used for storing menu item images
*/
