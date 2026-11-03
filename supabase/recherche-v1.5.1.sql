-- Recherche privée : les règles RLS existantes continuent de s'appliquer.
begin;
create or replace function public.beer_search_text(value text) returns text
language sql immutable parallel safe set search_path = '' as $$
 select regexp_replace(translate(lower(coalesce(value,'')), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ', 'aaaaaaceeeeiiiinooooouuuuyyoa'), '[^[:alnum:] ]', ' ', 'g');
$$;
create or replace function public.search_beer_resources(search_query text, search_offset integer default 0)
returns table(kind text, universe text, section text, title text, description text, payload jsonb)
language sql stable security invoker set search_path = '' as $$
 with candidates as (
 select 'media'::text kind,
 case when m.collection in ('lettres-filles','lettres-gendres','podcasts') then 'transmission' else m.collection end universe,
 m.collection section,m.title, m.description, to_jsonb(m) payload,m.id::text id
 from public.media_resources m where m.published
 union all
 select 'post',p.universe_slug,p.section_label,p.title,coalesce(p.body,''),to_jsonb(p),p.id::text
 from public.community_posts p
 union all
 select 'event','avenir','Agenda familial',e.title,concat_ws(' ',e.details,e.location),to_jsonb(e),e.id::text
 from public.family_events e
 ), terms as (
 select regexp_split_to_array(trim(public.beer_search_text(left(search_query,160))), '\s+') words
 )
 select c.kind,c.universe,c.section,c.title,c.description,c.payload
 from candidates c cross join terms t
 where public.is_family_member() and length(trim(public.beer_search_text(search_query))) >= 2
 and not exists(select 1 from unnest(t.words) word
 where strpos(public.beer_search_text(concat_ws(' ',c.title,c.description,c.section)),word)=0)
 order by public.beer_search_text(c.title),c.kind,c.id
 limit 31 offset greatest(0,least(coalesce(search_offset,0),1000000));
$$;
revoke all on function public.beer_search_text(text) from public;
grant execute on function public.beer_search_text(text) to authenticated;
revoke all on function public.search_beer_resources(text,integer) from public;
grant execute on function public.search_beer_resources(text,integer) to authenticated;
commit;
