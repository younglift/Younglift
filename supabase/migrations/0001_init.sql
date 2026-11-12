-- Young Lift: initial schema with Row Level Security on every table.
-- Run once in Supabase (SQL editor or `supabase db push`). Money is integer cents.

create extension if not exists pgcrypto;

-- ============ helpers ============

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default 'buyer' check (role in ('buyer', 'maker', 'admin')),
  taste jsonb not null default '{"categories":[],"styles":[],"materials":[]}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New sign-ups get a profile row automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users can edit their name and taste, never their role (only admins can).
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger guard_profile_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ============ makers ============

create table public.makers (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  studio text not null default '',
  city text not null default '',
  country text not null default 'LT' check (country in ('LT', 'LV', 'EE', 'PL')),
  categories text[] not null default '{}',
  quote text not null default '',
  bio text not null default '',
  portrait_url text not null default '',
  cover_url text not null default '',
  intro_video_url text,
  style text not null default 'light' check (style in ('light', 'bold')),
  sections text[] not null default '{featured,pieces,journal,about}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  extras jsonb not null default '{}'::jsonb, -- prototype extras: craft, Q&A, process, about...
  stripe_account_id text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create index makers_owner_idx on public.makers (owner_id);

create or replace function public.owns_maker(m text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.makers where id = m and owner_id = auth.uid());
$$;

create or replace function public.maker_is_public(m text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.makers where id = m and status = 'approved');
$$;

-- Makers can edit their profile, but not approval status, ownership or payout account.
create or replace function public.guard_maker_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.owner_id := old.owner_id;
    new.stripe_account_id := old.stripe_account_id;
    new.slug := old.slug;
  end if;
  return new;
end;
$$;

create trigger guard_maker_fields before update on public.makers
  for each row execute function public.guard_maker_fields();

create table public.maker_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  name text not null,
  studio text not null default '',
  city text not null default '',
  country text not null default 'LT',
  categories text[] not null default '{}',
  links text not null default '',
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ============ catalogue ============

create table public.products (
  id text primary key default gen_random_uuid()::text,
  maker_id text not null references public.makers (id) on delete cascade,
  title text not null,
  description text not null default '',
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  images text[] not null default '{}',
  category text not null default 'other'
    check (category in ('jewelry', 'ceramics', 'textiles', 'clothing', 'prints', 'wood', 'accessories', 'other')),
  materials text[] not null default '{}',
  variants jsonb,
  stock int not null default 1 check (stock >= 0),
  one_of_a_kind boolean not null default false,
  shipping_cents int not null default 490 check (shipping_cents >= 0),
  is_active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create index products_maker_idx on public.products (maker_id);

-- Feed media for a maker (collage photos, portrait, process, video).
create table public.media (
  id uuid primary key default gen_random_uuid(),
  maker_id text not null references public.makers (id) on delete cascade,
  type text not null default 'image' check (type in ('image', 'video')),
  url text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create index media_maker_idx on public.media (maker_id, sort);

-- Maker journal posts.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  maker_id text not null references public.makers (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  image_url text,
  is_video boolean not null default false,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index posts_maker_idx on public.posts (maker_id, published_at desc);

-- ============ buyer activity ============

create table public.follows (
  user_id uuid not null references public.profiles (id) on delete cascade,
  maker_id text not null references public.makers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, maker_id)
);

create index follows_maker_idx on public.follows (maker_id);

create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.board_items (
  board_id uuid not null references public.boards (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (board_id, product_id)
);

create table public.bag_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  qty int not null check (qty > 0),
  variant jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant)
);

-- ============ orders (written by the server only, e.g. Stripe webhook) ============

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles (id) on delete set null,
  maker_id text references public.makers (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'refunded')),
  items_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null default 0,
  commission_cents int not null default 0,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  tracking text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz
);

create index orders_buyer_idx on public.orders (buyer_id);
create index orders_maker_idx on public.orders (maker_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  title text not null,
  unit_price_cents int not null,
  qty int not null check (qty > 0),
  variant jsonb not null default '{}'::jsonb
);

create index order_items_order_idx on public.order_items (order_id);

-- ============ messages (one thread per buyer + maker) ============

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  maker_id text not null references public.makers (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  product_id text references public.products (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_thread_idx on public.messages (maker_id, buyer_id, created_at);

-- Public follower count (follows themselves are private).
create or replace function public.maker_followers(m text)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.follows where maker_id = m;
$$;

-- ============ Row Level Security ============

alter table public.profiles enable row level security;
alter table public.makers enable row level security;
alter table public.maker_applications enable row level security;
alter table public.products enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.saves enable row level security;
alter table public.boards enable row level security;
alter table public.board_items enable row level security;
alter table public.bag_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.messages enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- makers: public sees approved; owners and admins see their own / all
create policy "makers: read" on public.makers for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "makers: owner updates" on public.makers for update
  using (owner_id = auth.uid() or public.is_admin());
create policy "makers: admin inserts" on public.makers for insert with check (public.is_admin());
create policy "makers: admin deletes" on public.makers for delete using (public.is_admin());

-- maker applications
create policy "applications: apply" on public.maker_applications for insert
  with check (user_id is null or user_id = auth.uid());
create policy "applications: read own" on public.maker_applications for select
  using (user_id = auth.uid() or public.is_admin());
create policy "applications: admin reviews" on public.maker_applications for update using (public.is_admin());

-- products, media, posts: public read for approved makers; owner/admin write
create policy "products: read" on public.products for select
  using ((is_active and public.maker_is_public(maker_id)) or public.owns_maker(maker_id) or public.is_admin());
create policy "products: owner writes" on public.products for insert
  with check (public.owns_maker(maker_id) or public.is_admin());
create policy "products: owner updates" on public.products for update
  using (public.owns_maker(maker_id) or public.is_admin());
create policy "products: owner deletes" on public.products for delete
  using (public.owns_maker(maker_id) or public.is_admin());

create policy "media: read" on public.media for select
  using (public.maker_is_public(maker_id) or public.owns_maker(maker_id) or public.is_admin());
create policy "media: owner writes" on public.media for all
  using (public.owns_maker(maker_id) or public.is_admin())
  with check (public.owns_maker(maker_id) or public.is_admin());

create policy "posts: read" on public.posts for select
  using (public.maker_is_public(maker_id) or public.owns_maker(maker_id) or public.is_admin());
create policy "posts: owner writes" on public.posts for all
  using (public.owns_maker(maker_id) or public.is_admin())
  with check (public.owns_maker(maker_id) or public.is_admin());

-- buyer's own rows
create policy "follows: own" on public.follows for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saves: own" on public.saves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "boards: own" on public.boards for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "board_items: own" on public.board_items for all
  using (exists (select 1 from public.boards b where b.id = board_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.boards b where b.id = board_id and b.user_id = auth.uid()));
create policy "bag: own" on public.bag_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: buyer, the maker who sells, or admin can read. Writes go through the server (service role).
create policy "orders: read" on public.orders for select
  using (buyer_id = auth.uid() or public.owns_maker(maker_id) or public.is_admin());
create policy "order_items: read" on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.buyer_id = auth.uid() or public.owns_maker(o.maker_id) or public.is_admin())
  ));

-- messages: the buyer and the maker in the thread
create policy "messages: read" on public.messages for select
  using (buyer_id = auth.uid() or public.owns_maker(maker_id) or public.is_admin());
create policy "messages: send" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (buyer_id = auth.uid() or public.owns_maker(maker_id))
  );
create policy "messages: mark read" on public.messages for update
  using (buyer_id = auth.uid() or public.owns_maker(maker_id));

-- ============ storage: public "media" bucket, each user writes in their own folder ============

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media bucket: public read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media bucket: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media bucket: update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media bucket: delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
