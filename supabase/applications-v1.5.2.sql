-- Les quatre adresses fournies. Préserve les liens de téléchargement existants.
begin;
insert into public.application_links(slug,open_url) values
('cellio','https://cellio-ten.vercel.app/'),
('mealio','https://mealio-theta.vercel.app/'),
('cookiwiki','https://cooki-wiki.vercel.app/'),
('frosti','https://frosti-ten.vercel.app/')
on conflict(slug) do update set open_url=excluded.open_url;
commit;
