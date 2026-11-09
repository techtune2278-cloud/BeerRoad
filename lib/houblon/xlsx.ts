// Narrow read-only XLSX reader. No formula execution, no upload of the workbook.
// ZIP/XML limits protect the browser; encrypted, macro-enabled and ZIP64 files are refused.
import { DATES, END, TEAM_NAMES, normalizeTeamName, validateSnapshot, type Snapshot, type Score } from './model'
const MAX_XML=12*1024*1024
async function unzip(buffer: ArrayBuffer) {
 const b=new Uint8Array(buffer),d=new DataView(buffer),decoder=new TextDecoder();let end=-1
 if(b.length<22||b.length>8*1024*1024)throw Error('Choisis un classeur XLSX de moins de 8 Mo.')
 for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(d.getUint32(i,true)===0x06054b50){end=i;break}
 if(end<0||d.getUint16(end+4,true)||d.getUint16(end+6,true))throw Error('Archive XLSX non prise en charge.')
 const count=d.getUint16(end+10,true);let pos=d.getUint32(end+16,true)
 if(count>2000||count===65535)throw Error('Classeur trop volumineux.')
 const entries=new Map<string,{method:number;start:number;size:number;expanded:number}>()
 for(let i=0;i<count;i++){
  if(pos+46>b.length||d.getUint32(pos,true)!==0x02014b50)throw Error('Archive endommagée.')
  const flags=d.getUint16(pos+8,true),method=d.getUint16(pos+10,true),size=d.getUint32(pos+20,true),expanded=d.getUint32(pos+24,true),nl=d.getUint16(pos+28,true),el=d.getUint16(pos+30,true),cl=d.getUint16(pos+32,true),off=d.getUint32(pos+42,true)
  const name=decoder.decode(b.subarray(pos+46,pos+46+nl));pos+=46+nl+el+cl
  if(flags&1||off+30>b.length||d.getUint32(off,true)!==0x04034b50||entries.has(name))throw Error('Archive chiffrée ou incorrecte.')
  const start=off+30+d.getUint16(off+26,true)+d.getUint16(off+28,true)
  if(start+size>b.length)throw Error('Archive tronquée.')
  entries.set(name,{method,start,size,expanded})
 }
 if([...entries.keys()].some(n=>/vbaProject|externalLinks/i.test(n)))throw Error('Utilise un XLSX sans macros ni liaisons externes.')
 return async(name:string,optional=false)=>{
  const e=entries.get(name);if(!e){if(optional)return '';throw Error('Feuille ou composant absent : '+name)}
  if(e.expanded>MAX_XML||![0,8].includes(e.method))throw Error('Composant XLSX non pris en charge.')
  const bytes=b.slice(e.start,e.start+e.size)
  let stream:ReadableStream<Uint8Array>=new Blob([bytes]).stream()
  if(e.method===8)stream=stream.pipeThrough(new DecompressionStream('deflate-raw'))
  const reader=stream.getReader(),chunks:Uint8Array[]=[];let total=0
  try{while(true){const x=await reader.read();if(x.done)break;total+=x.value.length;if(total>MAX_XML)throw Error('Feuille trop volumineuse.');chunks.push(x.value)}}finally{await reader.cancel()}
  if(total!==e.expanded)throw Error('Composant XLSX tronqué.')
  const result=new Uint8Array(total);let at=0;for(const c of chunks){result.set(c,at);at+=c.length}return decoder.decode(result)
 }
}
function xml(text:string){if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML non pris en charge.');const d=new DOMParser().parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw Error('XML illisible.');return d}
function children(e:Document|Element,name:string){return Array.from(e.getElementsByTagNameNS('*',name))}
export async function readRaceWorkbook(buffer:ArrayBuffer):Promise<{snapshots:Snapshot[];final:Snapshot|null;warnings:string[]}> {
 const read=await unzip(buffer),wb=xml(await read('xl/workbook.xml')),rels=xml(await read('xl/_rels/workbook.xml.rels'))
 if(children(wb,'workbookPr')[0]?.getAttribute('date1904')==='1')throw Error('Le calendrier Excel 1904 n’est pas pris en charge.')
 const sharedText=await read('xl/sharedStrings.xml',true),shared=sharedText?children(xml(sharedText),'si').map(e=>children(e,'t').map(t=>t.textContent||'').join('')):[]
 async function sheet(name:string){
  const s=children(wb,'sheet').find(x=>x.getAttribute('name')===name);if(!s)throw Error('Onglet '+name+' absent. Utilise le classeur V5 ou ultérieur.')
  const id=s.getAttribute('r:id')||s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),rel=children(rels,'Relationship').find(r=>r.getAttribute('Id')===id),target=rel?.getAttribute('Target')||''
  if(rel?.getAttribute('TargetMode')==='External'||target.includes('..'))throw Error('Référence de feuille incorrecte.')
  const path=target.startsWith('/')?target.slice(1):'xl/'+target
  const doc=xml(await read(path)),cells=new Map<string,string|number>()
  for(const c of children(doc,'c')){
   const a=c.getAttribute('r')||'',t=c.getAttribute('t'),raw=children(c,'v')[0]?.textContent
   if(t==='e')cells.set(a,'#ERROR')
   else if(t==='s')cells.set(a,shared[Number(raw)]??'')
   else if(t==='inlineStr')cells.set(a,children(c,'t').map(x=>x.textContent||'').join(''))
   else if(t==='str')cells.set(a,raw||'')
   else if(raw!==undefined&&raw!==null&&raw!=='')cells.set(a,Number(raw))
  }
  return (a:string)=>cells.get(a)??''
 }
 const pub=await sheet('EXPORT_PUBLIC'),params=await sheet('PARAMETRES')
 const serial=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10):''
 if(serial(params('B26'))!=='2027-01-04'||serial(params('B34'))!==END)throw Error('Calendrier incorrect : la course doit couvrir le 4 janvier au 28 février 2027.')
 const divisor=Number(params('B19')),mission_points=Number(params('B22'))
 const expected=['Relevé','Date','Équipage','Pts écoutes','Pts auditeurs','Pts abonnés','Pts défis/bonus','Total public','Rang','Gain points','Gain places','Complétude']
 expected.forEach((v,i)=>{if(pub(String.fromCharCode(65+i)+'5')!==v)throw Error('Format EXPORT_PUBLIC non reconnu.')})
 const snapshots:Snapshot[]=[],warnings:string[]=[]
 for(let i=0;i<12;i++){
  const r=6+i*4,covered_date=serial(pub('B'+r)),label=String(pub('A'+r))
  if(covered_date!==DATES[i])throw Error('Dates EXPORT_PUBLIC incohérentes.')
  const scores:Score[]=[];let complete=true
  for(let k=0;k<4;k++){const n=r+k;if(serial(pub('B'+n))!==covered_date||pub('A'+n)!==label)throw Error('Bloc de relevé incohérent.');if(pub('L'+n)!=='Complet')complete=false
   const numeric=(col:string)=>{const v=pub(col+n);return typeof v==='number'?v:NaN}
   scores.push({team:String(pub('C'+n)),listens:numeric('D'),audience:numeric('E'),subscribers:numeric('F'),bonuses:numeric('G'),total:numeric('H')})
  }
  if(complete)snapshots.push(validateSnapshot({covered_date,label,kind:'public',scores,divisor,mission_points,revision:0,note:''}))
  else warnings.push(label+' : incomplet, non importable.')
 }
 // Final revelation is separate and never sent until explicitly selected by the administrator.
 let final:Snapshot|null=null
 const rel=await sheet('RELEVES');let validFinal=0
 for(let r=6;r<=605;r++)if(rel('A'+r)==='Arrivée'&&rel('M'+r)==='OK')validFinal++
 if(validFinal===40){const c=await sheet('CALCULS');const scores=TEAM_NAMES.map((team,i)=>{const r=109+i;const n=(col:string)=>{const v=c(col+r);return typeof v==='number'?v:NaN};if(normalizeTeamName(String(c('B'+r)))!==team)throw Error('Ordre des équipages incohérent.');return {team,listens:n('G'),audience:n('H'),subscribers:n('I'),bonuses:n('K'),total:n('L')}});final=validateSnapshot({covered_date:END,label:'Classement final — brouillard levé',kind:'final',scores,divisor,mission_points,revision:0,note:''})}
 return {snapshots,final,warnings}
}
