-- Phase 3: Run in Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Designs
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  product_type text not null check (product_type in ('oversize-tshirt', 'hoodie')),
  thumbnail_url text,
  canvas_data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  design_id uuid references public.designs(id) on delete cascade,
  file_path text not null,
  file_type text,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.designs enable row level security;
alter table public.assets enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

create policy "Users manage own designs"
  on public.designs for all
  using (auth.uid() = user_id);

create policy "Users manage own assets"
  on public.assets for all
  using (auth.uid() = user_id);
