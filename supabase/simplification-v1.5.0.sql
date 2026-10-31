begin;
create table if not exists public.application_links (
 slug text primary key check (slug in ('cookiwiki','frosti','cellio','mealio')),
 open_url text,
 download_url text,
 check (open_url is null or open_url ~ '^https://[^[:space:]]+$'),
 check (download_url is null or download_url ~ '^https://[^[:space:]]+$')
);
alter table public.application_links enable row level security;
revoke all on public.application_links from anon,authenticated;
grant select,update on public.application_links to authenticated;
drop policy if exists apps_read on public.application_links;
create policy apps_read on public.application_links for select to authenticated using (public.is_family_member());
drop policy if exists apps_update on public.application_links;
create policy apps_update on public.application_links for update to authenticated using (public.is_media_admin()) with check (public.is_media_admin());
insert into public.application_links(slug) values ('cookiwiki'),('frosti'),('cellio'),('mealio') on conflict do nothing;
commit;
-- Les contributions et médias existants ne sont ni modifiés ni supprimés.
