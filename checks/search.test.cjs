require('./register.cjs')
const {test,afterEach}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom')
const dom=new JSDOM('<div id="root"></div>',{url:'https://beer.test'})
global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),api=require('../lib/resource-search.ts')
require.cache[require.resolve('../components/media/media-shelf.tsx')]={exports:{MediaItem:()=>null}}
const {ResourceSearch}=require('../components/resource-search.tsx')
let root;const props={query:'eau',connected:true,matches:[],onUniverse(){},onResult(){}}
async function render(extra={}){if(!root)root=createRoot(document.getElementById('root'));await act(async()=>{root.render(React.createElement(ResourceSearch,{...props,...extra}))})}
const settle=()=>act(async()=>{await new Promise(r=>setTimeout(r,300))})
afterEach(async()=>{if(root)await act(async()=>root.unmount());root=null})
const row=title=>({kind:'media',universe:'kerhuon',section:'kerhuon',title,description:'Fermer la vanne',payload:{id:title}})
test('recherche locale : accents, mots combinés, applications',()=>{assert.ok(api.matchesSearch('Électricité de la maison','maison electricite'));assert.ok(api.plaqueSearchText({name:'Atelier',tagline:'',universe:'atelier',content:{}}).includes('CookiWiki'))})
test('les réponses anciennes ne remplacent pas la recherche courante',async()=>{
 let resolveOld;api.searchResources=async q=>q==='eau'?new Promise(r=>resolveOld=r):{items:[row('Électricité')],more:false}
 await render();await settle();await render({query:'electricite'});await settle();await act(async()=>resolveOld({items:[row('Couper l’eau')],more:false}));assert.ok(document.body.textContent.includes('Électricité'));assert.ok(!document.body.textContent.includes('Couper l’eau'))
})
test('aucune recherche privée hors connexion',async()=>{let calls=0;api.searchResources=async()=>{calls++;return {items:[],more:false}};await render({connected:false});await settle();assert.equal(calls,0)})
test('pagination et accès direct au résultat',async()=>{
 let selected;const offsets=[];api.searchResources=async(q,offset=0)=>{offsets.push(offset);return offset?{items:[row('Suite')],more:false}:{items:Array.from({length:30},(_,i)=>row('Tuto '+i)),more:true}}
 await render({onResult:r=>selected=r});await settle();await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Voir plus')).click());await settle();assert.deepEqual(offsets,[0,30]);await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Suite')).click());assert.equal(selected.title,'Suite')
})
test('déconnexion : les résultats privés disparaissent',async()=>{api.searchResources=async()=>({items:[row('Privé')],more:false});await render();await settle();await render({connected:false});assert.ok(!document.body.textContent.includes('Privé'))})
