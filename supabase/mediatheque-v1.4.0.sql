-- À exécuter après schema.sql. Aucun contenu existant n'est supprimé.
begin;
create table if not exists public.media_admins (
 email text primary key references public.family_members(email) on delete cascade
);
alter table public.media_admins enable row level security;
revoke all on public.media_admins from anon, authenticated;
create or replace function public.is_media_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select public.is_family_member() and exists (
 select 1 from public.media_admins where email = lower(auth.jwt()->>'email'));
$$;
revoke all on function public.is_media_admin() from public;
grant execute on function public.is_media_admin() to authenticated;

create table if not exists public.media_resources (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 collection text not null check (collection in ('origines','transmission','atelier','grenier','kerhuon','legendes','avenir','lettres-filles','lettres-gendres','podcasts')),
 title text not null check (length(trim(title)) between 1 and 140),
 description text not null default '',
 kind text not null check (kind in ('audio','video','pdf','image')),
 position integer not null default 1 check (position between 1 and 999),
 published boolean not null default true,
 storage_path text unique,
 drive_url text,
 file_name text,
 size_bytes bigint,
 check ((storage_path is not null)::integer + (drive_url is not null)::integer = 1),
 check (storage_path is null or storage_path ~ '^[a-f0-9-]{36}/[^/]+$'),
 check (drive_url is null or drive_url ~ '^https://drive[.]google[.]com/file/d/[a-zA-Z0-9_-]+/view$'),
 check (collection <> 'podcasts' or (kind = 'audio' and position between 1 and 12)),
 check (collection not in ('lettres-filles','lettres-gendres') or kind = 'pdf')
);
create unique index if not exists media_podcast_number on public.media_resources(position) where collection = 'podcasts';
create unique index if not exists media_one_book on public.media_resources(collection) where collection in ('lettres-filles','lettres-gendres');
alter table public.media_resources enable row level security;
revoke all on public.media_resources from anon, authenticated;
grant select, insert, update, delete on public.media_resources to authenticated;
drop policy if exists media_read on public.media_resources;
create policy media_read on public.media_resources for select to authenticated using (public.is_media_admin() or (published and public.is_family_member()));
drop policy if exists media_insert on public.media_resources;
create policy media_insert on public.media_resources for insert to authenticated with check (public.is_media_admin());
drop policy if exists media_update on public.media_resources;
create policy media_update on public.media_resources for update to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
drop policy if exists media_delete on public.media_resources;
create policy media_delete on public.media_resources for delete to authenticated using (public.is_media_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('official-media','official-media',false,52428800,array['audio/mpeg','video/mp4','application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists official_read on storage.objects;
create policy official_read on storage.objects for select to authenticated using (
 bucket_id='official-media' and (public.is_media_admin() or (public.is_family_member() and exists (
 select 1 from public.media_resources r where r.storage_path=name and r.published))));
drop policy if exists official_insert on storage.objects;
create policy official_insert on storage.objects for insert to authenticated with check (
 bucket_id='official-media' and public.is_media_admin());
drop policy if exists official_delete on storage.objects;
create policy official_delete on storage.objects for delete to authenticated using (
 bucket_id='official-media' and public.is_media_admin());
commit;
-- Activation de l'administrateur : remplacer l'adresse avant exécution.
-- insert into public.media_admins(email) values ('VOTRE_ADRESSE_DE_CONNEXION') on conflict do nothing;
