-- Run this in Supabase Dashboard > SQL Editor
-- Tables are created in dependency order: users -> restaurants -> menu_items -> orders -> order_items

create extension if not exists pgcrypto; -- enables gen_random_uuid()

-- enums (fixed sets of allowed values, as we discussed)
create type user_role as enum ('customer', 'restaurant_owner', 'driver');
create type order_status as enum ('pending', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled');

-- 1. users
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- 2. restaurants
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  name text not null,
  address text,
  phone_number text,
  email text,
  created_at timestamptz not null default now()
);

-- 3. menu_items
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price decimal(10,2) not null,
  created_at timestamptz not null default now()
);

-- 4. orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id),
  restaurant_id uuid not null references restaurants(id),
  driver_id uuid references users(id), -- nullable: assigned later
  delivery_address text,
  status order_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 5. order_items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  quantity integer not null,
  price_at_order_time decimal(10,2) not null
);