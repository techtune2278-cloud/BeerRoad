const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../scripts/houblon/TestHoublon.gs'),'utf8');
test('test seed refuses master and ordinary sheets before mutating anything',()=>{for(const [id,name] of [['1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw','TEST'],['other','Real']]){const ctx=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>({getId:()=>id,getName:()=>name})},console});vm.runInContext(source,ctx);assert.throws(()=>ctx.preparerRepetitionHoublon(),/COPIE/);}});
function setup(dirty=false,badScore=false){
 const writes=[],teams=['A','B','C','D'],platforms=['Spotify','YouTube','Deezer','Apple Music','Amazon Music'];
 const rows=Array.from({length:80},(_,i)=>[i<40?'Vendredi 08/01':'Vendredi 15/01',new Date(i<40?'2027-01-08T12:00:00Z':'2027-01-15T12:00:00Z'),teams[Math.floor(i%40/10)],'Song '+Math.floor(i%40/5),platforms[i%5]]);
 const getRange=(sheet,a1)=>({getValue:()=>a1==='B19'?5:2,getValues:()=>a1==='B40:B43'?teams.map(t=>[t]):a1==='A6:E85'?rows:a1==='H6:H13'?[badScore?999:90,72,54,36,180,234,162,126].map(n=>[n]):a1==='L6:L13'?Array(8).fill(['Complet']):[[dirty?1:'']],setValues:v=>writes.push({sheet,a1,v}),clearContent:()=>writes.push({sheet,a1,clear:true}),setValue:v=>writes.push({sheet,a1,v}),setWrap:()=>{}});
 const sheet=name=>({getRange:a=>getRange(name,a),setFrozenRows:()=>{},setColumnWidth:()=>{},setColumnWidths:()=>{}});
 const ss={getId:()=> 'test-id',getName:()=> 'Houblon TEST',getSheetByName:n=>n==='TEST_CONTROLES'?null:sheet(n),insertSheet:n=>sheet(n)};
 const ctx=vm.createContext({Date,SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush:()=>{}},Utilities:{formatDate:d=>d.toISOString().slice(0,10)},console:{log:()=>{}}});vm.runInContext(source,ctx);return {ctx,writes};
}
test('new test writes source inputs, includes Amazon, keeps hidden platforms and approves only verified scores',()=>{
 const {ctx,writes}=setup();ctx.preparerRepetitionHoublon();
 assert.equal(writes.some(w=>w.sheet==='RELEVES'),false);
 const f=writes.find(w=>w.a1==='F6:F85').v,i=writes.find(w=>w.a1==='I6:J85').v;
 assert.equal(f[4][0],25);assert.equal(i[4][0],5);assert.equal(f[2][0],50000);
 assert.equal(writes.filter(w=>w.sheet==='PUBLICATION').length,1);
});
test('existing input refuses mutation; incorrect totals never enable publication',()=>{
 let s=setup(true);assert.throws(()=>s.ctx.preparerRepetitionHoublon(),/déjà des mesures/);assert.equal(s.writes.length,0);
 s=setup(false,true);assert.throws(()=>s.ctx.preparerRepetitionHoublon(),/non publié/);assert.equal(s.writes.some(w=>w.sheet==='PUBLICATION'),false);
});
