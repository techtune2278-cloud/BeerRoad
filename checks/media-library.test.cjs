require('./register.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict')
const auth=require('../lib/family-auth.ts')
let calls=[]
auth.familyRequest=async(path,options)=>{calls.push({path,options});if(path.includes('/sign/'))return {signedURL:'/object/sign/official-media/x/book.pdf?token=abc'};return [{id:'ok'}]}
auth.getSupabaseConfig=()=>({url:'https://project.supabase.co',anonKey:'key'})
const api=require('../lib/media-library.ts')
test('Drive accepte un fichier, refuse dossier, faux domaine et protocole dangereux',()=>{
 assert.equal(api.driveLinks('https://drive.google.com/file/d/abc_123/view?usp=sharing').preview,'https://drive.google.com/file/d/abc_123/preview')
 assert.equal(api.driveLinks('https://drive.google.com/open?id=abc_123').view,'https://drive.google.com/file/d/abc_123/view')
 for(const value of ['https://drive.google.com/drive/folders/abc','https://evil.test/file/d/abc/view','javascript:alert(1)','https://drive.google.com.evil.test/file/d/abc/view'])assert.throws(()=>api.driveLinks(value))
})
test('contrôle du type et de la taille avant envoi',()=>{
 assert.equal(api.validateMediaFile({name:'Episode.MP3',size:1024},'audio'),'audio/mpeg')
 assert.throws(()=>api.validateMediaFile({name:'film.mp4',size:51*1024*1024},'video'))
 assert.throws(()=>api.validateMediaFile({name:'script.html',size:100},'pdf'))
 assert.throws(()=>api.validateMediaFile({name:'vide.pdf',size:0},'pdf'))
})
test('liste publique filtrée, ordre numérique et liste administrateur',async()=>{
 calls=[];await api.listMedia('podcasts');let q=new URL('https://test'+calls[0].path).searchParams
 assert.equal(q.get('published'),'eq.true');assert.equal(q.get('collection'),'eq.podcasts');assert.equal(q.get('order'),'position.asc,created_at.asc')
 calls=[];await api.listMedia(undefined,true);assert.ok(!calls[0].path.includes('published'))
})
test('liens signés distincts pour lecture et téléchargement',async()=>{
 const row={storage_path:'x/book.pdf',file_name:'Mon livre.pdf',title:'Livre'}
 const view=new URL(await api.mediaUrl(row)),download=new URL(await api.mediaUrl(row,true))
 assert.equal(view.searchParams.get('download'),null);assert.equal(download.searchParams.get('download'),'Mon livre.pdf');assert.equal(download.searchParams.get('token'),'abc')
})
test('Drive ne demande pas de signature Supabase',async()=>{
 calls=[];const url=await api.mediaUrl({drive_url:'https://drive.google.com/file/d/movie/view'},true)
 assert.equal(new URL(url).searchParams.get('export'),'download');assert.equal(calls.length,0)
})
