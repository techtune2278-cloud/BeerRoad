-- Beer Road V1.6.0 — QG privé de la famille. Exécuter après les migrations précédentes.
begin;
create table if not exists public.race_snapshots (
 covered_date date not null, kind text not null check(kind in ('public','final')),
 label text not null, scores jsonb not null, divisor numeric not null, mission_points numeric not null,
 note text not null default '', revision integer not null default 1, published_at timestamptz not null default now(),
 primary key(covered_date,kind)
);
create table if not exists public.race_history (
 id bigint generated always as identity primary key, changed_at timestamptz not null default now(),
 changed_by text not null, operation text not null, previous_value jsonb not null
);
create table if not exists public.race_settings (
 id integer primary key check(id=1), notice text not null default '', challenge text not null default '',
 rules text not null default '', links jsonb not null default '[]', revision integer not null default 0
);
insert into public.race_settings(id) values(1) on conflict do nothing;
alter table public.race_snapshots enable row level security;
alter table public.race_history enable row level security;
alter table public.race_settings enable row level security;
drop policy if exists race_read on public.race_snapshots;
create policy race_read on public.race_snapshots for select to authenticated using(public.is_family_member());
drop policy if exists race_settings_read on public.race_settings;
create policy race_settings_read on public.race_settings for select to authenticated using(public.is_family_member());
drop policy if exists race_history_read on public.race_history;
create policy race_history_read on public.race_history for select to authenticated using(public.is_media_admin());
revoke all on public.race_snapshots,public.race_history,public.race_settings from anon,authenticated;
grant select on public.race_snapshots,public.race_history,public.race_settings to authenticated;

create or replace function public.publish_race_snapshot(p_payload jsonb,p_expected_revision integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare d date; k text; s jsonb; field text; old public.race_snapshots; rev integer; next_rev integer; names text[];
begin
 if not public.is_media_admin() then raise exception 'Administration réservée au QG'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>16000 then raise exception 'Relevé invalide'; end if;
 if exists(select 1 from jsonb_object_keys(p_payload) a where a not in ('covered_date','kind','label','scores','note','divisor','mission_points')) then raise exception 'Champs non autorisés'; end if;
 d:=(p_payload->>'covered_date')::date; k:=p_payload->>'kind';
 if d is null or d not in (date '2027-01-08',date '2027-01-15',date '2027-01-17',date '2027-01-22',date '2027-01-29',date '2027-01-31',date '2027-02-05',date '2027-02-12',date '2027-02-14',date '2027-02-19',date '2027-02-26',date '2027-02-28') then raise exception 'Date incorrecte'; end if;
 -- Friday reports may be published on Friday; final revelation waits until the race has ended.
 if d > (now() at time zone 'Europe/Paris')::date then raise exception 'Impossible de publier un relevé futur'; end if;
 if k='final' and (now() at time zone 'Europe/Paris')::date<=date '2027-02-28' then raise exception 'Révélation finale à partir du 1er mars'; end if;
 if k is null or k not in ('public','final') or (k='final' and d<>date '2027-02-28') then raise exception 'Nature incorrecte'; end if;
 if coalesce(length(p_payload->>'label'),0) not between 1 and 100 or coalesce(length(p_payload->>'note'),0)>2000 then raise exception 'Texte incorrect'; end if;
 if jsonb_typeof(p_payload->'scores') is distinct from 'array' then raise exception 'Scores absents'; end if;
 if jsonb_array_length(p_payload->'scores')<>4 then raise exception 'Quatre équipages requis'; end if;
 select array_agg(distinct x->>'team' order by x->>'team') into names from jsonb_array_elements(p_payload->'scores') x;
 if names is distinct from array['Alexis & Marie','Anne & Vincent','Emmanuelle & Robin','Laure & Mehdy'] then raise exception 'Équipages incorrects'; end if;
 foreach field in array array['divisor','mission_points'] loop
  if jsonb_typeof(p_payload->field) is distinct from 'number' or (p_payload->>field)::numeric<0 or (p_payload->>field)::numeric>1000 then raise exception 'Barème incorrect'; end if;
 end loop;
 if (p_payload->>'divisor')::numeric<=0 then raise exception 'Diviseur incorrect'; end if;
 for s in select * from jsonb_array_elements(p_payload->'scores') loop
  if exists(select 1 from jsonb_object_keys(s) a where a not in ('team','listens','audience','subscribers','bonuses','total')) then raise exception 'Champs score non autorisés'; end if;
  foreach field in array array['listens','audience','subscribers','bonuses','total'] loop
   if jsonb_typeof(s->field) is distinct from 'number' or (s->>field)::numeric<0 or (s->>field)::numeric>10000000 then raise exception 'Points incorrects'; end if;
  end loop;
  if abs((s->>'listens')::numeric+(s->>'audience')::numeric+(s->>'subscribers')::numeric+(s->>'bonuses')::numeric-(s->>'total')::numeric)>0.001 then raise exception 'Total incohérent'; end if;
 end loop;
 perform pg_advisory_xact_lock(hashtext('houblon-'||d||k));
 select * into old from public.race_snapshots where covered_date=d and kind=k for update;
 rev:=coalesce(old.revision,0);
 if p_expected_revision is distinct from rev then raise exception 'Le relevé a changé. Actualise avant de publier.'; end if;
 select greatest(rev,coalesce(max((previous_value->>'revision')::integer),0))+1 into next_rev from public.race_history where previous_value->>'covered_date'=d::text and previous_value->>'kind'=k;
 if rev>0 and coalesce(length(trim(p_payload->>'note')),0)<5 then raise exception 'Indique le motif de correction'; end if;
 if rev>0 then insert into public.race_history(changed_by,operation,previous_value) values(auth.jwt()->>'email','correction',to_jsonb(old)); end if;
 insert into public.race_snapshots(covered_date,kind,label,scores,divisor,mission_points,note,revision)
 values(d,k,p_payload->>'label',p_payload->'scores',(p_payload->>'divisor')::numeric,(p_payload->>'mission_points')::numeric,coalesce(p_payload->>'note',''),next_rev)
 on conflict(covered_date,kind) do update set label=excluded.label,scores=excluded.scores,divisor=excluded.divisor,mission_points=excluded.mission_points,note=excluded.note,revision=excluded.revision,published_at=now();
end $$;
create or replace function public.withdraw_race_snapshot(p_date date,p_kind text,p_expected_revision integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare old public.race_snapshots;
begin
 if not public.is_media_admin() then raise exception 'Administration réservée au QG'; end if;
 perform pg_advisory_xact_lock(hashtext('houblon-'||p_date||p_kind));
 select * into old from public.race_snapshots where covered_date=p_date and kind=p_kind for update;
 if old.revision is null or old.revision is distinct from p_expected_revision then raise exception 'Relevé modifié ou absent'; end if;
 insert into public.race_history(changed_by,operation,previous_value) values(auth.jwt()->>'email','retrait',to_jsonb(old));
 delete from public.race_snapshots where covered_date=p_date and kind=p_kind;
end $$;
create or replace function public.save_race_settings(p_payload jsonb,p_expected_revision integer)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare rev integer; item jsonb; f text; old public.race_settings;
begin
 if not public.is_media_admin() then raise exception 'Administration réservée au QG'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>40000 then raise exception 'Contenu invalide'; end if;
 if exists(select 1 from jsonb_object_keys(p_payload) a where a not in ('notice','challenge','rules','links')) then raise exception 'Champs non autorisés'; end if;
 foreach f in array array['notice','challenge','rules'] loop
  if jsonb_typeof(p_payload->f) is distinct from 'string' or length(p_payload->>f)>10000 then raise exception 'Texte absent ou trop long'; end if;
 end loop;
 if jsonb_typeof(p_payload->'links') is distinct from 'array' then raise exception 'Liens incorrects'; end if;
 if jsonb_array_length(p_payload->'links')<>4 then raise exception 'Quatre équipages requis'; end if;
 if (select count(distinct v->>'team') from jsonb_array_elements(p_payload->'links') v where v->>'team' in ('Alexis & Marie','Anne & Vincent','Laure & Mehdy','Emmanuelle & Robin'))<>4 then raise exception 'Équipages incorrects'; end if;
 for item in select * from jsonb_array_elements(p_payload->'links') loop
  if exists(select 1 from jsonb_object_keys(item) a where a not in ('team','song','song2','youtube','spotify','youtube2','spotify2')) then raise exception 'Champs non autorisés'; end if;
  foreach f in array array['song','song2'] loop
   if jsonb_typeof(item->f) is distinct from 'string' or length(item->>f)>150 then raise exception 'Titre incorrect'; end if;
  end loop;
  foreach f in array array['youtube','spotify','youtube2','spotify2'] loop
   if jsonb_typeof(item->f) is distinct from 'string' or length(item->>f)>1500 or ((item->>f)<>'' and (item->>f)!~'^https://[^[:space:]]+$') then raise exception 'Lien HTTPS incorrect'; end if;
  end loop;
 end loop;
 select * into old from public.race_settings where id=1 for update;rev:=old.revision;
 if p_expected_revision is distinct from rev then raise exception 'Le contenu a changé. Actualise avant de publier.'; end if;
 insert into public.race_history(changed_by,operation,previous_value) values(auth.jwt()->>'email','contenu',to_jsonb(old));
 update public.race_settings set notice=p_payload->>'notice',challenge=p_payload->>'challenge',rules=p_payload->>'rules',links=p_payload->'links',revision=rev+1 where id=1;
end $$;
revoke all on function public.publish_race_snapshot(jsonb,integer),public.withdraw_race_snapshot(date,text,integer),public.save_race_settings(jsonb,integer) from public;
grant execute on function public.publish_race_snapshot(jsonb,integer),public.withdraw_race_snapshot(date,text,integer),public.save_race_settings(jsonb,integer) to authenticated;
commit;
