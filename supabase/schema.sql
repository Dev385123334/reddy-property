-- ============================================================
-- REDDY PROPERTIES — Supabase schema
-- Run this once in the Supabase SQL Editor (or via psql).
-- Guesty remains the source of truth for availability, rates and
-- reservations. These tables only hold app-side state.
-- ============================================================

-- Access-token cache + any other short-lived server-side key/value state.
create table if not exists guesty_kv (
  key          text primary key,
  value        jsonb not null,
  expires_at   timestamptz not null default (now() + interval '1 hour'),
  updated_at   timestamptz not null default now()
);

-- Listing <-> slug mapping (deterministic, collision-safe).
create table if not exists listing_slugs (
  listing_id   text primary key,
  slug         text not null unique,
  title        text,
  updated_at   timestamptz not null default now()
);

create index if not exists listing_slugs_slug_idx on listing_slugs (slug);

-- Booking sessions / quote snapshots so the checkout survives refresh and
-- so price changes can be detected (displayed total vs fresh quote).
create table if not exists booking_sessions (
  id            text primary key,                 -- server-generated session id (cookie)
  listing_id    text not null,
  quote_id      text not null,
  check_in      date not null,
  check_out     date not null,
  guests        integer not null,
  total         numeric(12, 2) not null,
  currency      text not null,
  fingerprint   text not null,                    -- hash of displayed quote
  status        text not null default 'quoted',   -- quoted | confirmed | cancelled | payment_required
  guest_info    jsonb,
  reservation_id text,
  raw_quote     jsonb,
  breakdown     jsonb,                              -- displayed price lines
  created_at    timestamptz not null default now()
);

create index if not exists booking_sessions_quote_id_idx on booking_sessions (quote_id);
create index if not exists booking_sessions_status_idx on booking_sessions (status);

-- Confirmation snapshots so /booking/confirmation/:id renders reliably
-- even if a Guesty GET by reservation id is not exposed to this account.
create table if not exists guest_confirmation_cards (
  reservation_id text primary key,
  snapshot   jsonb not null,
  created_at timestamptz not null default now()
);

-- Webhook idempotency + audit.
create table if not exists webhook_events (
  event_id      text primary key,                 -- Guesty event id (dedupe key)
  event_type    text not null,
  reservation_id text,
  listing_id    text,
  payload_hash  text not null,
  status        text not null default 'processed',
  received_at   timestamptz not null default now()
);

create index if not exists webhook_events_type_idx on webhook_events (event_type);
create index if not exists webhook_events_reservation_idx on webhook_events (reservation_id);