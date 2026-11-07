import { DATES, END, validateSnapshot, type Snapshot } from './model'
type Cell = string | number | boolean
export type Grid = Cell[][]
const date = (v: Cell | undefined) => typeof v==='number' ? new Date(Date.UTC(1899,11,30)+Math.floor(v)*86400000).toISOString().slice(0,10) : String(v||'').slice(0,10)
// Only the public export is accepted. No hidden platform totals cross this boundary.
export function parseGoogleRace(pub:Grid, params:Grid, approvals:Grid, today:string):Snapshot[] {
 if(date(params[7]?.[0])!=='2027-01-04'||date(params[15]?.[0])!==END)throw Error('Calendrier du tableur incorrect.')
 const expected=['Relevé','Date','Équipage','Pts écoutes','Pts auditeurs','Pts abonnés','Pts défis/bonus','Total public','Rang','Gain points','Gain places','Complétude']
 if(expected.some((v,i)=>pub[4]?.[i]!==v))throw Error('Format EXPORT_PUBLIC non reconnu.')
 const allowed=new Set(approvals.slice(1).filter(r=>r[1]==='Oui').map(r=>date(r[0])))
 return DATES.flatMap((covered_date,i)=>{
  if(covered_date>today||!allowed.has(covered_date))return []
  const rows=pub.slice(5+i*4,9+i*4)
  if(rows.length!==4||rows.some(r=>r[11]!=='Complet'))throw Error('Relevé autorisé mais incomplet : '+covered_date)
  if(rows.some(r=>date(r[1])!==covered_date||r[0]!==rows[0][0]))throw Error('Bloc de relevé incohérent.')
  const num=(v:Cell)=>typeof v==='number'?v:NaN
  return [validateSnapshot({covered_date,label:String(rows[0][0]),kind:'public',revision:0,note:'Source : Google Sheets · relevé validé par le QG.',divisor:num(params[0]?.[0]),mission_points:num(params[3]?.[0]),scores:rows.map(r=>({team:String(r[2]),listens:num(r[3]),audience:num(r[4]),subscribers:num(r[5]),bonuses:num(r[6]),total:num(r[7])}))})]
 })
}
