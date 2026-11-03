require('./register.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict')
const {groupMedia,sortAdminMedia}=require('../lib/media-library.ts')
test('types séparés et ordre numérique indépendant, sans modifier les ressources',()=>{
 const rows=[{id:'v1',kind:'video',position:1},{id:'a10',kind:'audio',position:10},{id:'p1',kind:'pdf',position:1},{id:'a2',kind:'audio',position:2},{id:'i1',kind:'image',position:1},{id:'a1',kind:'audio',position:1}]
 const before=JSON.stringify(rows)
 assert.deepEqual(groupMedia(rows).map(g=>g.items.map(r=>r.id)),[['a1','a2','a10'],['v1'],['p1'],['i1']])
 assert.equal(JSON.stringify(rows),before)
 assert.deepEqual(groupMedia([]),[])
})
test('administration regroupée par emplacement puis type avec les mêmes numéros conservés',()=>{
 const rows=[{id:'k1',collection:'kerhuon',kind:'audio',position:1},{id:'v1',collection:'origines',kind:'video',position:1},{id:'a2',collection:'origines',kind:'audio',position:2},{id:'a1',collection:'origines',kind:'audio',position:1}]
 assert.deepEqual(sortAdminMedia(rows).map(r=>r.id),['a1','a2','v1','k1'])
})
