require('./register.cjs')
const { JSDOM } = require('jsdom')
const {test,afterEach,after} = require('node:test')
const assert = require('node:assert/strict')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://beer.test/'})
global.window=dom.window; global.document=dom.window.document
Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true})
global.HTMLElement=dom.window.HTMLElement
global.IS_REACT_ACT_ENVIRONMENT=true
global.requestAnimationFrame=window.requestAnimationFrame=fn=>setTimeout(fn,0)
global.cancelAnimationFrame=window.cancelAnimationFrame=clearTimeout
window.HTMLElement.prototype.scrollIntoView=function(){}
window.confirm=()=>true
let observers=[]
global.IntersectionObserver=window.IntersectionObserver=class {
 constructor(callback){this.callback=callback;observers.push(this)} observe(){} disconnect(){}
}
process.env.NEXT_PUBLIC_SUPABASE_URL='https://unit-test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-public-key'
const React=require('react')
const {act}=React
const {createRoot}=require('react-dom/client')
const {CommunityHub}=require('../components/community-hub.tsx')
let root,statuses=[]
const base={universe:'legendes',section:'Contributions générales',target:'carnet',nonce:0}
const session={access_token:'token',refresh_token:'refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'u1',email:'member@test.fr'}}
const json=(x,status=200)=>new Response(JSON.stringify(x),{status})
const post=(i,extra={})=>({id:String(i),created_at:`2026-01-01T10:00:00Z`,author_email:'member@test.fr',author_name:'Membre',universe_slug:'legendes',section_label:'Contributions générales',title:`Souvenir ${i}`,body:'Un souvenir',media_path:null,media_type:null,external_url:null,...extra})
const settle=()=>act(async()=>{await new Promise(r=>setTimeout(r,10))})
async function mount(fetcher, connected=true){
 statuses=[];observers=[];window.localStorage.clear()
 if(connected)window.localStorage.setItem('beerroad-family-session-v1',JSON.stringify(session))
 global.fetch=fetcher
 root=createRoot(document.getElementById('root'))
 await act(async()=>{root.render(React.createElement(CommunityHub,{contributionRequest:base,onAuthStatusChange:s=>statuses.push(s)}))})
 await settle()
}
function button(text){return [...document.querySelectorAll('button')].find(b=>b.textContent===text)}
async function click(text){const b=button(text);assert.ok(b,`bouton ${text}`);await act(async()=>b.click());await settle()}
function route(url){return new URL(url).pathname}
afterEach(async()=>{if(root)await act(async()=>root.unmount());root=null})
test('sans session, formulaire de connexion et aucune requête privée',async()=>{
 let calls=0; await mount(async()=>{calls++;return json([])},false)
 assert.ok(document.getElementById('family-email'));assert.equal(calls,0)
 assert.equal(statuses.at(-1).status,'disconnected')
})
test('compte reconnu sans attendre le carnet ; agenda indépendant ; brouillon conservé',async()=>{
 let release;let postCalls=0,eventCalls=0
 await mount(async url=>{
  if(route(url).endsWith('family_members'))return json([{email:'member@test.fr',display_name:'Membre'}])
  if(route(url).endsWith('community_posts')){postCalls++;return new Promise(r=>release=()=>r(json({message:'Carnet indisponible'},503)))}
  eventCalls++;return json([{id:'e1',title:'Retrouvailles',start_at:'2027-01-01T12:00:00Z',author_email:'member@test.fr',author_name:'Membre',event_type:'sejour'}])
 })
 assert.equal(statuses.at(-1).status,'connected');assert.equal(eventCalls,0)
 assert.equal(document.getElementById('post-title'),null)
 await click('Ajouter une contribution');assert.ok(document.getElementById('post-title'))
 await click('Agenda');assert.ok(document.body.textContent.includes('Retrouvailles'));assert.equal(eventCalls,1)
 await act(async()=>release());await settle()
 assert.ok(document.body.textContent.includes('Retrouvailles'))
 await click('Carnet');assert.ok(document.getElementById('post-title'));assert.equal(postCalls,1)
 assert.ok(document.body.textContent.includes('Carnet indisponible'))
})
test('pagination et signature des médias uniquement à visibilité',async()=>{
 const calls=[]
 await mount(async url=>{
  const u=new URL(url);calls.push(u)
  if(u.pathname.endsWith('family_members'))return json([{email:'member@test.fr',display_name:'Membre'}])
  if(u.pathname.includes('/sign/'))return json({signedURL:'/object/sign/test'})
  return json(u.searchParams.has('or')?[post(13)]:Array.from({length:12},(_,i)=>post(i,{media_path:`u1/${i}.jpg`,media_type:'image'})))
 })
 assert.equal(document.querySelectorAll('article').length,12)
 assert.equal(calls.filter(u=>u.pathname.includes('/sign/')).length,0)
 await act(async()=>observers[0].callback([{isIntersecting:true}]))
 await settle();assert.equal(calls.filter(u=>u.pathname.includes('/sign/')).length,1)
 await click('Voir les contributions précédentes');assert.equal(document.querySelectorAll('article').length,13)
 assert.ok(calls.some(u=>u.searchParams.has('or')))
})
test('une ancienne réponse ne remplace pas les résultats du nouveau filtre',async()=>{
 let release
 await mount(async url=>{
  const u=new URL(url)
  if(u.pathname.endsWith('family_members'))return json([{email:'member@test.fr',display_name:'Membre'}])
  if(u.searchParams.get('universe_slug')==='eq.avenir')return json([post('new',{universe_slug:'avenir'})])
  return new Promise(r=>release=()=>r(json([post('old')])))
 })
 await act(async()=>{const select=document.getElementById('feed-universe');select.value='avenir';select.dispatchEvent(new window.Event('change',{bubbles:true}))})
 await settle();assert.ok(document.body.textContent.includes('Souvenir new'))
 await act(async()=>release());await settle()
 assert.ok(!document.body.textContent.includes('Souvenir old'))
})
test('déconnexion efface les vues privées sans rechargement',async()=>{
 await mount(async url=>route(url).endsWith('family_members')?json([{email:'member@test.fr',display_name:'Membre'}]):json([post(1)]))
 await click('Déconnexion')
 assert.equal(document.querySelectorAll('article').length,0)
 assert.ok(document.getElementById('family-email'))
 assert.equal(statuses.at(-1).status,'disconnected')
})
async function fill(id,value){
 await act(async()=>{
  const input=document.getElementById(id)
  const proto=input.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value)
  input.dispatchEvent(new window.Event('input',{bubbles:true}))
 })
}
test('ajout puis modification conserve le contenu et utilise le bon endpoint',async()=>{
 let write
 await mount(async(url,options)=>{
  if(route(url).endsWith('family_members'))return json([{email:'member@test.fr',display_name:'Membre'}])
  if(options.method==='POST'){write=JSON.parse(options.body)[0];return json([post('created',{title:write.title,body:write.body})])}
  if(options.method==='PATCH'){write={...JSON.parse(options.body),method:'PATCH'};return json([post('created',{title:write.title,body:write.body})])}
  return json([])
 })
 await click('Ajouter une contribution')
 await fill('post-title','Mon souvenir'); await fill('post-body','Une belle journée')
 await act(async()=>document.getElementById('community-post-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))
 await settle();assert.equal(write.title,'Mon souvenir');assert.equal(write.body,'Une belle journée')
 // Changing to the publication's universe reloads from the server: mock that saved result.
 global.fetch=async(url,options)=>options.method==='PATCH'?(write={...JSON.parse(options.body),method:'PATCH'},json([post('created',write)])):json([post('created',{title:'Mon souvenir',body:'Une belle journée'})])
 await click('Actualiser'); await click('Modifier')
 await fill('post-title','Souvenir corrigé')
 await act(async()=>document.getElementById('community-post-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))
 await settle();assert.equal(write.method,'PATCH');assert.equal(write.title,'Souvenir corrigé')
 assert.equal(document.getElementById('post-title'),null)
})
test('le texte du brouillon survit au changement d’onglet',async()=>{
 await mount(async url=>route(url).endsWith('family_members')?json([{email:'member@test.fr',display_name:'Membre'}]):json([]))
 await click('Ajouter une contribution');await fill('post-title','Mon brouillon')
 await click('Agenda');await click('Carnet')
 assert.equal(document.getElementById('post-title').value,'Mon brouillon')
})
test('un membre non autorisé ne charge aucun contenu privé',async()=>{
 let calls=0; await mount(async()=>{calls++;return json([])})
 assert.equal(calls,2);assert.ok(document.body.textContent.includes("n'est pas autorisée"))
 assert.ok(document.getElementById('family-email'))
})
test('ajout puis suppression d’un rendez-vous sans charger le carnet à nouveau',async()=>{
 let input;let removed=false;let postReads=0
 global.window.confirm=()=>true
 await mount(async(url,options)=>{
  if(route(url).endsWith('family_members'))return json([{email:'member@test.fr',display_name:'Membre'}])
  if(route(url).endsWith('community_posts')){postReads++;return json([])}
  if(options.method==='POST'){input=JSON.parse(options.body)[0];return json([{...input,id:'event-new'}])}
  if(options.method==='DELETE'){removed=true;return new Response(null,{status:204})}
  return json([])
 })
 await click('Agenda');await click('Ajouter un rendez-vous')
 await fill('event-title','Réunion familiale');await fill('event-date','2027-07-15')
 await act(async()=>document.getElementById('event-title').closest('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))
 await settle();assert.equal(input.title,'Réunion familiale');assert.ok(document.body.textContent.includes('Réunion familiale'))
 await click('Supprimer');assert.equal(removed,true);assert.equal(postReads,1)
})

after(async()=>{if(window.__beerRoadAuth)await window.__beerRoadAuth.client.auth.dispose()})
test('un média ancien est renouvelé au retour sur la page',async()=>{
 let signed=0
 await mount(async url=>route(url).endsWith('family_members')?json([{email:'member@test.fr',display_name:'Membre'}]):url.includes('/sign/')?json({signedURL:'/object/sign/test?version='+ ++signed}):json([post(1,{media_path:'u1/image.jpg',media_type:'image'})]))
 await act(async()=>observers[0].callback([{isIntersecting:true}]))
 await settle();assert.equal(signed,1)
 const now=Date.now;Date.now=()=>now()+51*60*1000
 try { await act(async()=>window.dispatchEvent(new window.Event('focus'))); await settle();assert.equal(signed,2) }
 finally {Date.now=now}
})
test('le retour par e-mail connecte le membre sans boucle de restauration',async()=>{
 const token=[{alg:'HS256',typ:'JWT'},{sub:'u1',exp:Math.floor(Date.now()/1000)+3600},'c2lnbmF0dXJl'].map((v,i)=>i<2?Buffer.from(JSON.stringify(v)).toString('base64url'):v).join('.')
 window.history.replaceState({},'', '/#access_token='+token+'&refresh_token=refresh')
 let profileReads=0
 await mount(async url=>{
  if(route(url)==='/auth/v1/user')return json({id:'u1',email:'member@test.fr'})
  if(route(url).endsWith('family_members')){profileReads++;return json([{email:'member@test.fr',display_name:'Membre'}])}
  return json([])
 },false)
 await settle()
 assert.equal(statuses.at(-1).status,'connected');assert.equal(window.location.hash,'')
 assert.ok(profileReads>=1 && profileReads<=2)
})
test('le lien expiré est expliqué dans le formulaire de connexion',async()=>{
 window.history.replaceState({},'', '/#error=access_denied&error_code=otp_expired')
 await mount(async()=>json([]),false)
 assert.ok(document.body.textContent.includes('a expiré'));assert.ok(document.getElementById('family-email'))
 assert.equal(window.location.hash,'');assert.equal(statuses.at(-1).status,'disconnected')
})
