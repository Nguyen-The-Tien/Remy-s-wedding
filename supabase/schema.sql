-- albums: pre_wedding and wedding categories (video is a separate table, see below)
create table albums (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('pre_wedding', 'wedding')),
  title text not null,
  slug text not null unique,
  event_date date,
  location text,
  cover_image_key text,
  highlight_video_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- album_photos: photos belonging to an album
create table album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  image_key text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- videos: standalone "video cưới" entries (YouTube embeds), unrelated to albums —
-- no slug, no photos; the admin form always submits all 4 fields together.
create table videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  event_date date not null,
  youtube_url text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- site_settings: single row, id fixed at 1
create table site_settings (
  id int primary key default 1 check (id = 1),
  email text,
  address text,
  phone text,
  zalo_link text,
  facebook_link text,
  instagram_link text,
  hero_background_mode text not null default 'video'
    check (hero_background_mode in ('video', 'images')),
  hero_video_url text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

-- hero_images: ordered set of images used when hero_background_mode = 'images'
create table hero_images (
  id uuid primary key default gen_random_uuid(),
  image_key text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Row Level Security: public (anon) role can only SELECT published/public content.
-- No insert/update/delete policies exist for any role — all writes go through
-- the service-role client, which bypasses RLS entirely.

alter table albums enable row level security;
create policy "public read published albums"
  on albums for select
  using (is_published = true);

alter table album_photos enable row level security;
create policy "public read photos of published albums"
  on album_photos for select
  using (
    exists (
      select 1 from albums
      where albums.id = album_photos.album_id
      and albums.is_published = true
    )
  );

alter table videos enable row level security;
create policy "public read published videos"
  on videos for select
  using (is_published = true);

alter table site_settings enable row level security;
create policy "public read site settings"
  on site_settings for select
  using (true);

alter table hero_images enable row level security;
create policy "public read hero images"
  on hero_images for select
  using (true);
