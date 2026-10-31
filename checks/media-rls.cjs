const {PGlite}=require('@electric-sql/pglite')
const fs=require('node:fs'),assert=require('node:assert/strict')
;(async()=>{
const db=new PGlite()
await db.exec(`create role anon; create role authenticated;
create schema auth; create schema storage;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('test.email',true)) $$;
grant usage on schema auth,storage to authenticated;
create table public.family_members(email text primary key);
insert into public.family_members values ('admin@test.fr'),('member@test.fr');
create function public.is_family_member() returns boolean language sql stable security definer as $$ select exists(select 1 from public.family_members where email=auth.jwt()->>'email') $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to authenticated;`)
const sql=fs.readFileSync(require('node:path').join(__dirname,'../supabase/mediatheque-v1.4.0.sql'),'utf8')
await db.exec(sql);await db.exec(sql) // migration idempotente
await db.exec(`insert into public.media_admins values ('admin@test.fr');set role authenticated;set test.email='admin@test.fr';`)
assert.equal((await db.query('select public.is_media_admin() ok')).rows[0].ok,true)
await db.exec(`insert into storage.objects(bucket_id,name) values ('official-media','00000000-0000-0000-0000-000000000001/episode.mp3');
insert into public.media_resources(collection,title,kind,position,storage_path) values ('podcasts','Episode 1','audio',1,'00000000-0000-0000-0000-000000000001/episode.mp3');`)
await assert.rejects(()=>db.exec(`insert into public.media_resources(collection,title,kind,position,drive_url) values ('podcasts','doublon','audio',1,'https://drive.google.com/file/d/a/view');`))
await assert.rejects(()=>db.exec(`insert into public.media_resources(collection,title,kind,position,drive_url) values ('podcasts','13','audio',13,'https://drive.google.com/file/d/a/view');`))
await db.exec(`set test.email='member@test.fr';`)
assert.equal((await db.query('select public.is_media_admin() ok')).rows[0].ok,false)
assert.equal((await db.query('select * from public.media_resources')).rows.length,1)
assert.equal((await db.query('select * from storage.objects')).rows.length,1)
await assert.rejects(()=>db.exec(`insert into public.media_admins values ('member@test.fr')`))
await assert.rejects(()=>db.exec(`insert into public.media_resources(collection,title,kind,drive_url) values ('grenier','fraude','audio','https://drive.google.com/file/d/a/view')`))
await assert.rejects(()=>db.exec(`insert into storage.objects(bucket_id,name) values ('official-media','fraude.mp3')`))
assert.equal((await db.query(`update public.media_resources set title='fraude' returning id`)).rows.length,0)
assert.equal((await db.query(`delete from public.media_resources returning id`)).rows.length,0)
await db.exec(`set test.email='admin@test.fr'; update public.media_resources set published=false;set test.email='member@test.fr';`)
assert.equal((await db.query('select * from public.media_resources')).rows.length,0)
assert.equal((await db.query('select * from storage.objects')).rows.length,0)
await db.exec(`set test.email='outsider@test.fr';`)
assert.equal((await db.query('select * from public.media_resources')).rows.length,0)
assert.equal((await db.query('select * from storage.objects')).rows.length,0)
await db.exec('reset role;')
const appsSql=fs.readFileSync(require('node:path').join(__dirname,'../supabase/simplification-v1.5.0.sql'),'utf8')
await db.exec(appsSql);await db.exec(appsSql)
await db.exec("set role authenticated;set test.email='admin@test.fr';")
assert.equal((await db.query("update public.application_links set open_url='https://example.com', download_url='https://example.com/app.zip' where slug='mealio' returning slug")).rows.length,1)
await db.exec("set test.email='member@test.fr';")
assert.equal((await db.query('select * from public.application_links')).rows.length,4)
assert.equal((await db.query("update public.application_links set open_url='https://evil.test' returning slug")).rows.length,0)
await db.exec("set test.email='outsider@test.fr';")
assert.equal((await db.query('select * from public.application_links')).rows.length,0)
console.log('PASS: liens applications, lecture membre, modification administrateur uniquement, migration répétable.')
console.log('PASS: migration répétable, administrateur, membre, non-membre, masquage, fichiers privés, refus élévation des droits, doublons et épisode 13.')
await db.close()
})().catch(e=>{console.error(e);process.exitCode=1})
