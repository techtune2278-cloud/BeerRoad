require('./register.cjs')
const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom')
const dom=new JSDOM('<div id="root"></div>',{url:'https://beer.test/qg'})
global.window=dom.window;global.document=dom.window.document;global.HTMLElement=dom.window.HTMLElement;global.IS_REACT_ACT_ENVIRONMENT=true
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client')
const model=require('../lib/houblon/model.ts'),auth=require('../components/community/use-family-auth.ts'),api=require('../lib/houblon/api.ts'),media=require('../lib/media-library.ts')
auth.useFamilyAuth=()=>({checking:false,member:{email:'test@example.com',display_name:'Test'},session:{access_token:'test'},checkSession:()=>{}})
media.isMediaAdmin=async()=>false
api.loadRace=async()=>({snapshots:[model.DEMO_SNAPSHOTS[0]],settings:{...model.DEFAULT_SETTINGS,revision:99,rules:'Barème définitif à confirmer par le QG'}})
const {RacePage}=require('../components/houblon/race-page.tsx')
test('QG keeps map and contributions, removes obsolete panels and ignores stale stored rules',async()=>{
 const root=createRoot(document.getElementById('root'))
 try{
 await act(async()=>{root.render(React.createElement(RacePage));await new Promise(r=>setTimeout(r,20))})
 const text=document.body.textContent
 assert.match(text,/La Route du Houblon - QG Web/)
 assert.match(text,/Amazon Music/)
 assert.match(text,/brume/)
 assert.match(text,/Le carnet des équipages/)
 assert.doesNotMatch(text,/Écouter les équipages|Les quatre équipages|Avis aux navigateurs|Le défi en cours|Barème définitif à confirmer|brouillard/i)
 assert.equal([...document.querySelectorAll('a')].filter(a=>a.href===model.FORM_URL).length,1)
 assert.ok(document.querySelector('svg'))
 }finally{await act(async()=>root.unmount())}
})
test('race spans exactly 56 inclusive days, all dates inside race and weekly readings are Fridays',()=>{
 const days=(Date.parse(model.END)-Date.parse(model.START))/86400000+1
 assert.equal(days,56)
 const buoys=new Set(['2027-01-17','2027-01-31','2027-02-14',model.END])
 for(const date of model.DATES){assert.ok(date>=model.START&&date<=model.END);if(!buoys.has(date))assert.equal(new Date(date+'T12:00:00Z').getUTCDay(),5)}
})
