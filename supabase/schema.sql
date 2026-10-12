-- La Beer Road V2 — espace de contribution familial
-- À exécuter une fois dans Supabase > SQL Editor.
-- La liste de la tribu est renseignée à la fin du script.
-- Les films/albums/livres lourds ne doivent pas être téléversés dans Supabase Storage.

create extension if not exists pgcrypto;

create table if not exists public.family_members (
  email text primary key,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint family_members_email_lowercase check (email = lower(email))
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_email text not null,
  author_name text not null,
  universe_slug text not null check (universe_slug in ('origines','transmission','atelier','grenier','kerhuon','legendes','avenir')),
  section_label text not null default 'Contributions générales',
  title text not null check (length(trim(title)) between 1 and 140),
  body text,
  media_path text,
  media_type text check (media_type is null or media_type in ('image','video','audio','document')),
  external_url text
);

-- Compatible avec un projet sur lequel le schéma précédent aurait déjà été appliqué.
alter table public.community_posts add column if not exists external_url text;
alter table public.community_posts add column if not exists section_label text not null default 'Contributions générales';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'community_posts_external_url_http_check'
      and conrelid = 'public.community_posts'::regclass
  ) then
    alter table public.community_posts
      add constraint community_posts_external_url_http_check
      check (external_url is null or external_url ~* '^https?://');
  end if;
end;
$$;

create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_email text not null,
  author_name text not null,
  title text not null check (length(trim(title)) between 1 and 140),
  details text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  event_type text not null default 'autre' check (event_type in ('sejour','anniversaire','travaux','projet','autre'))
);

-- Migration douce si les tables de la première V2 existent déjà.
alter table public.family_events add column if not exists event_type text not null default 'autre';
update public.family_events set event_type = 'autre' where event_type is null;
alter table public.family_events alter column event_type set default 'autre';
alter table public.family_events alter column event_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'family_events_event_type_check'
      and conrelid = 'public.family_events'::regclass
  ) then
    alter table public.family_events
      add constraint family_events_event_type_check
      check (event_type in ('sejour','anniversaire','travaux','projet','autre'));
  end if;
end;
$$;

create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_universe_idx on public.community_posts (universe_slug, created_at desc);
create index if not exists family_events_start_at_idx on public.family_events (start_at asc);

alter table public.family_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.family_events enable row level security;

create or replace function public.is_family_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm
    where lower(fm.email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_family_member() from public;
grant execute on function public.is_family_member() to authenticated;

-- La personne connectée peut uniquement consulter sa propre ligne d'autorisation.
drop policy if exists "family members can read their own profile" on public.family_members;
create policy "family members can read their own profile"
on public.family_members for select to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Les publications et leurs médias sont réservés aux membres figurant dans family_members.
drop policy if exists "family can read community posts" on public.community_posts;
create policy "family can read community posts"
on public.community_posts for select to authenticated
using (public.is_family_member());

drop policy if exists "family can create own community posts" on public.community_posts;
create policy "family can create own community posts"
on public.community_posts for insert to authenticated
with check (
  public.is_family_member()
  and lower(author_email) = lower(auth.jwt() ->> 'email')
);

drop policy if exists "authors can update own community posts" on public.community_posts;
create policy "authors can update own community posts"
on public.community_posts for update to authenticated
using (public.is_family_member() and lower(author_email) = lower(auth.jwt() ->> 'email'))
with check (public.is_family_member() and lower(author_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "authors can delete own community posts" on public.community_posts;
create policy "authors can delete own community posts"
on public.community_posts for delete to authenticated
using (public.is_family_member() and lower(author_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "family can read events" on public.family_events;
create policy "family can read events"
on public.family_events for select to authenticated
using (public.is_family_member());

drop policy if exists "family can create events" on public.family_events;
create policy "family can create events"
on public.family_events for insert to authenticated
with check (
  public.is_family_member()
  and lower(author_email) = lower(auth.jwt() ->> 'email')
);

drop policy if exists "authors can update own events" on public.family_events;
create policy "authors can update own events"
on public.family_events for update to authenticated
using (public.is_family_member() and lower(author_email) = lower(auth.jwt() ->> 'email'))
with check (public.is_family_member() and lower(author_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "authors can delete own events" on public.family_events;
create policy "authors can delete own events"
on public.family_events for delete to authenticated
using (public.is_family_member() and lower(author_email) = lower(auth.jwt() ->> 'email'));

grant select on public.family_members to authenticated;
grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, update, delete on public.family_events to authenticated;

-- Un espace privé pour les photos, vidéos et MP3 de la famille.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-media',
  'family-media',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/wav','audio/x-wav','application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "family can read private media" on storage.objects;
create policy "family can read private media"
on storage.objects for select to authenticated
using (bucket_id = 'family-media' and public.is_family_member());

drop policy if exists "family can upload to own folder" on storage.objects;
create policy "family can upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'family-media'
  and public.is_family_member()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "family can update own media" on storage.objects;
create policy "family can update own media"
on storage.objects for update to authenticated
using (bucket_id = 'family-media' and public.is_family_member() and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'family-media' and public.is_family_member() and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "family can delete own media" on storage.objects;
create policy "family can delete own media"
on storage.objects for delete to authenticated
using (bucket_id = 'family-media' and public.is_family_member() and (storage.foldername(name))[1] = auth.uid()::text);

-- 5) Membres autorisés de la tribu.
-- Les personnes n'ont pas besoin d'un compte Supabase créé manuellement : leur première connexion
-- par e-mail créera/ouvrira leur compte, puis cette liste décide qui accède aux données familiales.
insert into public.family_members (email, display_name) values
  ('marie.lemoine.m@gmail.com', 'Marie'),
  ('gaelvali@gmail.com', 'Gaël'),
  ('gaellemoined@gmail.com', 'Gaëlle'),
  ('alexis.bourgeois0289@gmail.com', 'Alexis'),
  ('anne.lemoine22@gmail.com', 'Anne'),
  ('v.cocoual@gmail.com', 'Vincent'),
  ('laure.lemoine2278@gmail.com', 'Laure'),
  ('emmanuelle2278@hotmail.fr', 'Emmanuelle'),
  ('robinhenry78@gmail.com', 'Robin')
on conflict (email) do update set display_name = excluded.display_name;
