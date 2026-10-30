require('./register.cjs')
const {JSDOM}=require('jsdom'),{test,afterEach}=require('node:test'),assert=require('node:assert/strict')
const dom=new JSDOM('<div id="root"></div>',{url:'https://beer.test'})
global.window=dom.window;global.document=dom.window.document;global.HTMLElement=dom.window.HTMLElement;global.IS_REACT_ACT_ENVIRONMENT=true
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client')
const api=require('../lib/media-library.ts')
require.cache[require.resolve('../components/media/pdf-reader.tsx')]={exports:{PdfReader:({url})=>React.createElement('a',{href:url},'Ouvrir le PDF en grand')}}
const {MediaShelf}=require('../components/media/media-shelf.tsx'),{MediaAdmin}=require('../components/media/media-admin.tsx')
let root,calls=[],records=[],admin=false
const row={id:'1',collection:'podcasts',title:'Premier épisode',description:'',kind:'audio',position:1,published:true,storage_path:'a/ep.mp3',drive_url:null,file_name:'ep.mp3',size_bytes:1024}
api.listMedia=async collection=>{calls.push(['list',collection]);return records}
api.mediaUrl=async(row,download)=>{calls.push(['url',download]);return 'https://files.test/'+(download?'download':'play')}
api.isMediaAdmin=async()=>admin
api.saveMedia=async(data,id)=>{calls.push(['save',data,id]);return {...data,id:'saved'}}
const settle=()=>act(async()=>{await new Promise(r=>setTimeout(r,5))})
async function mount(component,props){calls=[];root=createRoot(document.getElementById('root'));await act(async()=>root.render(React.createElement(component,props)));await settle()}
async function click(text){const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b,text);await act(async()=>b.click());await settle()}
afterEach(async()=>{if(root)await act(async()=>root.unmount());root=null;records=[];admin=false})
test('sans connexion: aucun catalogue ni lien privé demandé',async()=>{
 await mount(MediaShelf,{collection:'podcasts',connected:false,onConnect:()=>{}})
 assert.equal(calls.length,0);assert.match(document.body.textContent,/Se connecter/)
})
test('podcast: compteur, lecteur au clic, lien de téléchargement séparé',async()=>{
 records=[row];await mount(MediaShelf,{collection:'podcasts',connected:true,onConnect:()=>{}})
 assert.match(document.body.textContent,/1 épisode disponible sur 12/);assert.equal(document.querySelector('audio'),null)
 await click('Écouter');assert.equal(document.querySelector('audio').getAttribute('src'),'https://files.test/play')
 assert.deepEqual(calls.at(-1),['url',false])
 // Évite seulement la navigation jsdom ; le comportement applicatif reste exécuté.
 const old=window.HTMLAnchorElement.prototype.click;window.HTMLAnchorElement.prototype.click=function(){}
 await click('Télécharger (0.0 Mo)');assert.deepEqual(calls.at(-1),['url',true]);assert.ok(document.querySelector('a[href="https://files.test/download"]'))
 window.HTMLAnchorElement.prototype.click=old
})
test('livre: lecteur intégré et lien de repli',async()=>{
 records=[{...row,kind:'pdf',collection:'lettres-filles'}];await mount(MediaShelf,{collection:'lettres-filles',connected:true,onConnect:()=>{}})
 await click('Lire');assert.ok(document.querySelector('a[href="https://files.test/play"]'));assert.match(document.body.textContent,/Ouvrir le PDF en grand/)
})
test('menu invisible pour un membre ordinaire',async()=>{await mount(MediaAdmin,{});assert.equal(document.querySelector('button'),null)})
test('admin: modification et masquage préservent le fichier',async()=>{
 admin=true;records=[row];await mount(MediaAdmin,{});await click('Gérer les médias');await click('Modifier')
 await act(async()=>document.querySelector('input[type="checkbox"]').click())
 await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await settle()
 const save=calls.find(c=>c[0]==='save');assert.ok(save);assert.equal(save[1].published,false);assert.equal(save[1].storage_path,'a/ep.mp3');assert.equal(save[2],'1')
})
