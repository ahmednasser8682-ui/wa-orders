-- انسخ/الصق في Supabase SQL Editor (اختياري)
create table if not exists wa_inbound (
  id bigserial primary key,
  created_at timestamptz default now(),
  wa_from text,
  msg_type text,
  text text,
  raw jsonb
);

create table if not exists orders (
  id bigserial primary key,
  created_at timestamptz default now(),
  order_no text unique,
  customer_phone text,
  customer_message text,
  status text default 'new',
  raw jsonb
);

create table if not exists wa_events (
  id bigserial primary key,
  created_at timestamptz default now(),
  event_type text,
  raw jsonb
);
