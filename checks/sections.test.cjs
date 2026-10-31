require('./register.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
require.cache[require.resolve('../components/media/media-shelf.tsx')]={exports:{MediaShelf:({collection})=>React.createElement('div',{'data-collection':collection},collection)}}
require.cache[require.resolve('../components/media/app-catalog.tsx')]={exports:{AppCatalog:()=>React.createElement('div',{},'Catalogue des applications')}}
require.cache[require.resolve('../components/community/section-preview.tsx')]={exports:{SectionPreview:({section})=>React.createElement('div',{},section)}}
const {plaques}=require('../src/data/beerRoadData.ts'),{PlaqueModal}=require('../components/plaque-modal.tsx'),{sectionsForUniverse,isRecommendation}=require('../components/community/shared.tsx')
const html=plaque=>renderToStaticMarkup(React.createElement(PlaqueModal,{plaque,connected:true,onClose(){},onContribute(){},onViewContributions(){},onOpenAgenda(){}}))
test('sept univers : contenus avant un seul espace de contributions',()=>{
 assert.equal(plaques.length,7)
 for(const plaque of plaques){const s=html(plaque);assert.equal((s.match(/data-section="contributions"/g)||[]).length,1);assert.equal((s.match(/>Ajouter une contribution</g)||[]).length,1);assert.ok(s.indexOf('data-section="contents"')<s.indexOf('data-section="contributions"'));assert.equal(plaque.content.intro.length,1);assert.ok(plaque.content.intro[0].length<110)}
})
test('origines : médiathèque ouverte avant livret et paroles, aucune répétition',()=>{
 const s=html(plaques[0]);assert.ok(s.indexOf('data-collection="origines"')<s.indexOf('Beer Road — livret'))
 assert.ok(!s.includes('<details'));for(const text of ['Les quatre soifs','Les coulisses','Ouvrir toutes les archives','Écouter les chansons (.wav)'])assert.ok(!s.includes(text))
 assert.equal(plaques[0].content.albums[0].links.length,2)
})
test('transmission : trois collections précises seulement',()=>{
 const s=html(plaques[1]);assert.equal((s.match(/data-collection=/g)||[]).length,3);assert.ok(!s.includes('Autres livres'))
})
test('grenier : trois liens utiles, pas de livret Beer Road',()=>{
 const s=html(plaques[3]);assert.ok(s.includes('https://www.legrenierdelwood.com/'));assert.ok(!s.includes('Livret_de_la_Beer_Road.pdf'));assert.equal(plaques[3].content.links.length,3)
})
test('recommandations distinguées, toutes les rubriques restent ouvertes aux contributions',()=>{
 assert.ok(isRecommendation('legendes','Films qu’on aime'));assert.ok(isRecommendation('legendes','Podcasts qu’on aime'));assert.ok(!isRecommendation('legendes','La boîte à anecdotes'))
 for(const p of plaques)assert.ok(sectionsForUniverse(p.universe).includes('Contributions générales'))
 assert.ok(sectionsForUniverse('atelier').includes('Mealio'));assert.ok(sectionsForUniverse('avenir').includes('Projets communs'))
})
test('liens applications : HTTPS uniquement, champs facultatifs',()=>{
 const {safeAppUrl}=require('../lib/application-links.ts')
 assert.equal(safeAppUrl(''),null);assert.equal(safeAppUrl('https://example.com/app.zip'),'https://example.com/app.zip')
 for(const value of ['javascript:alert(1)','http://example.com','https://user:password@example.com'])assert.throws(()=>safeAppUrl(value))
})
