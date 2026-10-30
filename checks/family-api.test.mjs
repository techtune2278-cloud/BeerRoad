import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import { test, after } from 'node:test'
const originalFetch = global.fetch
const originalTimer = global.setTimeout

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://unit-test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key'
const require = createRequire(import.meta.url)
require('./register.cjs')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html></html>', {url:'https://beer.test/'})
global.window=dom.window
global.document=dom.window.document
Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true})
const storage={set:(k,v)=>window.localStorage.setItem(k,v)}
const api = require('../lib/family-api.ts')
const key = 'beerroad-family-session-v1'
const session = (expired=false) => ({access_token:'token',refresh_token:'refresh',expires_in:3600,token_type:'bearer',expires_at:Math.floor(Date.now()/1000)+(expired ? -1 : 3600),user:{id:'member-id',email:'member@test.fr'}})
let saveNumber = 0
const save = expired => storage.set(key, JSON.stringify({...session(expired),refresh_token:'refresh-'+ ++saveNumber}))
const json = (value,status=200) => new Response(JSON.stringify(value),{status})
after(async () => {if(window.__beerRoadAuth)await window.__beerRoadAuth.client.auth.dispose();global.fetch=originalFetch; global.setTimeout=originalTimer})
test('une session incomplète est ignorée sans crash', () => {
 storage.set(key, '{}'); assert.equal(api.readFamilySession(),null)
})
test('un compte valide est reconnu', async () => {
 save(false); global.fetch=async()=>json([{email:'member@test.fr',display_name:'Membre'}]);
 assert.equal((await api.getFamilyMember('member@test.fr')).display_name,'Membre')
})
test('deux requêtes avec session expirée ne renouvellent le jeton qu’une fois', async () => {
 save(true); let refresh=0;
 global.fetch=async url => {
   if(url.includes('grant_type=refresh_token')) {refresh++; await new Promise(r=>originalTimer(r,5)); return json(session())}
   return json([])
 }
 await Promise.all([api.getFamilyMember('member@test.fr'),api.listFamilyEvents()]); assert.equal(refresh,1)
})
test('une panne serveur ne supprime pas la session sauvegardée', async () => {
 save(true); global.fetch=async()=>json({},503)
 await assert.rejects(api.getFamilyMember('member@test.fr'), /temporairement/)
 assert.ok(api.readFamilySession())
})
test('un renouvellement refusé efface la session expirée', async () => {
 save(true); global.fetch=async()=>json({error_code:'refresh_token_not_found',message:'Refresh token invalid'},400)
 await assert.rejects(api.getFamilyMember('member@test.fr'), /expiré/)
 assert.equal(api.readFamilySession(),null)
})
test('une réponse de données 401 efface la session', async () => {
 save(false); global.fetch=async()=>json({message:'JWT expired'},401)
 await assert.rejects(api.listFamilyEvents(), /JWT expired/)
 assert.equal(api.readFamilySession(),null)
})
test('une requête réseau bloquée est annulée avec un message lisible', async () => {
 save(false); global.setTimeout=(fn,ms,...args)=>originalTimer(fn,ms===15000?10:ms,...args)
 global.fetch=async (url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))
 await assert.rejects(api.getFamilyMember('member@test.fr'), /trop de temps/)
 assert.ok(api.readFamilySession())
 global.setTimeout=originalTimer
})
test('le délai couvre aussi le corps de la réponse', async () => {
 save(false); global.setTimeout=(fn,ms,...args)=>originalTimer(fn,ms===15000?10:ms,...args)
 global.fetch=async(url,{signal})=>({status:200,text:()=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))})
 await assert.rejects(api.listFamilyEvents(), /trop de temps/)
 global.setTimeout=originalTimer
})

test('les filtres et le curseur sont envoyés à la base sans signer les médias', async () => {
 save(false); const calls=[];
 global.fetch=async(url)=>{calls.push(new URL(url)); return json([{id:'a',media_path:'private/image.jpg'}])}
 const result=await api.listCommunityPosts({universe:'legendes',section:'Rubrique & famille',author:'MEMBER@test.fr',before:{created_at:'2026-01-01T10:00:00Z',id:'a'}})
 assert.equal(calls.length,1); assert.equal(result.length,1)
 const params=calls[0].searchParams
 assert.equal(params.get('limit'),'12'); assert.equal(params.get('section_label'),'eq.Rubrique & famille')
 assert.equal(params.get('author_email'),'eq.member@test.fr'); assert.match(params.get('or'),/id.lt.a/)
})
test('un renouvellement tardif ne rétablit pas une session déconnectée', async () => {
 save(true); let complete;
 global.fetch=async(url)=>url.includes('grant_type=refresh_token')?new Promise(resolve=>{complete=()=>resolve(json(session()))}):url.includes('/logout')?new Response(null,{status:204}):json([])
 const pending=api.getFamilyMember('member@test.fr')
 await new Promise(resolve=>originalTimer(resolve,0))
 const signedOut=api.clearFamilySession(); complete()
 await Promise.all([pending,signedOut]); assert.equal(api.readFamilySession(),null)
})

test('un lien expiré affiche une erreur lisible et nettoie l’URL', async () => {
 window.history.replaceState({},'', '/?keep=1#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')
 await assert.rejects(api.acceptEmailLinkFromUrl(),/expiré/)
 assert.equal(window.location.hash,''); assert.equal(window.location.search,'?keep=1')
})
test('un lien incomplet ne reste pas dans la barre d’adresse', async () => {
 window.history.replaceState({},'', '/#access_token=secret')
 await assert.rejects(api.acceptEmailLinkFromUrl(),/incomplet/)
 assert.equal(window.location.hash,'')
})
test('le SDK accepte le lien reçu et retire les jetons de l’URL', async () => {
 const token=[{alg:'HS256',typ:'JWT'},{sub:'member-id',exp:Math.floor(Date.now()/1000)+3600},'c2lnbmF0dXJl'].map((v,i)=>i<2?Buffer.from(JSON.stringify(v)).toString('base64url'):v).join('.')
 window.history.replaceState({},'', '/#access_token='+token+'&refresh_token=refresh')
 global.fetch=async()=>json({id:'member-id',email:'member@test.fr'})
 const result=await api.acceptEmailLinkFromUrl()
 assert.equal(result.user.email,'member@test.fr');assert.equal(window.location.hash,'')
 assert.equal(api.readFamilySession().access_token,token)
})
test('le SDK envoie le lien vers la bonne origine', async () => {
 let body,url
 global.fetch=async(u,o)=>{body=JSON.parse(o.body);url=new URL(u);return json({})}
 await api.sendMagicLink(' MEMBER@Test.fr ')
 assert.equal(body.email,'member@test.fr');assert.equal(url.searchParams.get('redirect_to'),'https://beer.test')
})
