-- Slate: 001_schema.sql
-- Tables, enums and indexes (D2 ERD + gap fixes from docs/PLAN.md §3).
-- Run in Supabase SQL editor (or `supabase db push`) BEFORE 002_rls.sql.

create extension if not exists "pgcrypto";

-- ───────────── Enums ─────────────
create type member_role         as enum ('owner', 'manager', 'staff');
create type member_status       as enum ('pending', 'active');
create type conversation_channel as enum ('chat', 'voice');
create type conversation_status as enum ('open', 'resolved');
create type message_sender      as enum ('visitor', 'assistant', 'staff');
create type lead_status         as enum ('new', 'contacted', 'won', 'lost');
create type appointment_status  as enum ('scheduled', 'cancelled', 'completed');
create type plan_name           as enum ('free', 'starter', 'growth', 'pro');

-- ───────────── profiles (1:1 with auth.users) ─────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ───────────── businesses ─────────────
create table businesses (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles(id),
  name         text not null,
  category     text,
  website_url  text,
  address      text,
  lat          double precision,
  lng          double precision,
  phone        text,
  logo_url     text,
  hours        jsonb not null default '{}'::jsonb,   -- {"mon":[["09:00","18:00"]], ...}
  timezone     text not null default 'Asia/Karachi',
  widget_key   text not null unique default ('wk_' || encode(gen_random_bytes(12), 'hex')),
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);
create index on businesses (owner_id);

-- ───────────── business_members ─────────────
create table business_members (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  user_id        uuid references profiles(id) on delete cascade,  -- null while pending
  invited_email  text,
  role           member_role not null default 'staff',
  status         member_status not null default 'pending',
  created_at     timestamptz not null default now(),
  unique (business_id, invited_email),
  unique (business_id, user_id)
);
create index on business_members (user_id);

-- ───────────── assistants ─────────────
create table assistants (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  tone              text not null default 'friendly',
  greeting_message  text,
  avatar_url        text,
  is_active         boolean not null default true,
  vapi_assistant_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on assistants (business_id);

-- ───────────── faqs / services ─────────────
create table faqs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  question     text not null,
  answer       text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on faqs (business_id);

create table services (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  description       text,
  price             numeric(10,2) check (price >= 0),
  duration_minutes  int not null default 30 check (duration_minutes > 0),
  created_at        timestamptz not null default now()
);
create index on services (business_id);

-- Which FAQs / services each assistant knows about (Pro allows 3 assistants)
create table assistant_faqs (
  assistant_id uuid not null references assistants(id) on delete cascade,
  faq_id       uuid not null references faqs(id) on delete cascade,
  primary key (assistant_id, faq_id)
);
create table assistant_services (
  assistant_id uuid not null references assistants(id) on delete cascade,
  service_id   uuid not null references services(id) on delete cascade,
  primary key (assistant_id, service_id)
);

-- ───────────── conversations / messages ─────────────
create table conversations (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  assistant_id     uuid references assistants(id) on delete set null,
  visitor_name     text,
  visitor_contact  text,
  visitor_token    text unique default encode(gen_random_bytes(24), 'hex'),
  channel          conversation_channel not null default 'chat',
  status           conversation_status not null default 'open',
  notes            text,
  vapi_call_id     text unique,
  started_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now()
);
create index on conversations (business_id, last_message_at desc);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  business_id      uuid not null references businesses(id) on delete cascade,  -- for RLS
  sender           message_sender not null,
  staff_user_id    uuid references profiles(id) on delete set null,
  content          text not null,
  response_ms      int,
  created_at       timestamptz not null default now()
);
create index on messages (conversation_id, created_at);

-- ───────────── leads / appointments ─────────────
create table leads (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  conversation_id    uuid unique references conversations(id) on delete set null,
  name               text,
  contact            text,
  service_id         uuid references services(id) on delete set null,
  status             lead_status not null default 'new',
  notes              text,
  created_at         timestamptz not null default now(),
  status_changed_at  timestamptz not null default now()
);
create index on leads (business_id, status);

create table appointments (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  lead_id       uuid references leads(id) on delete set null,
  service_id    uuid references services(id) on delete set null,
  scheduled_at  timestamptz not null,
  status        appointment_status not null default 'scheduled',
  created_at    timestamptz not null default now()
);
create index on appointments (business_id, scheduled_at);
-- NFR-6: no double booking of the same slot
create unique index appointments_no_double_booking
  on appointments (business_id, scheduled_at) where status = 'scheduled';

-- ───────────── subscriptions ─────────────
create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null unique references businesses(id) on delete cascade,
  plan_name               plan_name not null default 'free',
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  status                  text not null default 'active',
  renewed_at              timestamptz
);

-- ───────────── activity_log ─────────────
create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  actor_id     uuid references profiles(id) on delete set null,
  type         text not null,       -- e.g. 'lead.created', 'appointment.booked'
  summary      text not null,
  created_at   timestamptz not null default now()
);
create index on activity_log (business_id, created_at desc);

-- ───────────── RLS on, deny-by-default ─────────────
-- Policies are added in 002_rls.sql. Until then only the service role (Express
-- admin client) can touch these tables — the publishable key sees nothing.
alter table profiles            enable row level security;
alter table businesses          enable row level security;
alter table business_members    enable row level security;
alter table assistants          enable row level security;
alter table faqs                enable row level security;
alter table services            enable row level security;
alter table assistant_faqs      enable row level security;
alter table assistant_services  enable row level security;
alter table conversations       enable row level security;
alter table messages            enable row level security;
alter table leads               enable row level security;
alter table appointments        enable row level security;
alter table subscriptions       enable row level security;
alter table activity_log        enable row level security;
