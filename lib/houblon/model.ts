export const TEAM_NAMES = ['Alexis & Marie','Anne & Vincent','Laure & Mehdy','Emmanuelle & Robin'] as const
export const COLORS = ['#38845c','#277caa','#b47534','#8468a3']
export const START = '2027-01-04', END = '2027-02-28'
export const DATES = ['2027-01-08','2027-01-15','2027-01-17','2027-01-22','2027-01-29','2027-01-31','2027-02-05','2027-02-12','2027-02-14','2027-02-19','2027-02-26','2027-02-28']
export const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfBrhDB_MsezGqWGgW3ysgDtGfuK1ci_8OquPHIW_Cmd09QHg/viewform'
export type Score = { team: string; listens: number; audience: number; subscribers: number; bonuses: number; total: number }
export type Snapshot = { covered_date: string; label: string; kind: 'public'|'final'; scores: Score[]; revision: number; published_at?: string; note: string; divisor: number; mission_points: number }
export type CrewLinks = { team: string; song: string; youtube: string; spotify: string; song2: string; youtube2: string; spotify2: string }
export type Settings = { id: number; notice: string; challenge: string; rules: string; links: CrewLinks[]; revision: number }
export const DEFAULT_SETTINGS: Settings = {id:1,revision:0,notice:'Bienvenue à bord. Départ le 4 janvier 2027 !',challenge:'Les défis et le barème définitif seront annoncés ici avant le départ.',rules:'Course du 4 janvier au 28 février 2027 inclus. Quatre équipages, deux chansons chacun. Classement provisoire : Spotify + YouTube, audiences, abonnés et bonus validés. Les autres plateformes restent dans le brouillard jusqu’à la révélation finale. Les écoutes doivent être réelles : pas de lecture artificielle en boucle. Barème définitif à confirmer par le QG.',links:TEAM_NAMES.map((team,i)=>({team,song:['Alexis Roi du Rock’n’Frites','Sgt Cocoual Gagnant','Mehdy m’a dit','Robinou Rock'][i],youtube:'',spotify:'',song2:'Seconde chanson à attribuer',youtube2:'',spotify2:''}))}
export function rank(scores: Score[], total: number) { return 1 + scores.filter(s=>s.total > total).length }
export function number(value: number) { return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(value) }
export function dateLabel(value: string) { return new Date(value+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'long',timeZone:'Europe/Paris'}) }
export function parisToday() { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) }
export function validateSnapshot(value: Snapshot) {
 if (!DATES.includes(value.covered_date) || !['public','final'].includes(value.kind) || (value.kind==='final'&&value.covered_date!==END)) throw Error('Date ou nature de relevé incorrecte.')
 if (!value.label || value.label.length>100 || value.note.length>2000) throw Error('Libellé ou commentaire trop long.')
 if (!(value.divisor>0&&value.divisor<=1000&&value.mission_points>=0&&value.mission_points<=1000)) throw Error('Barème invalide.')
 if (value.scores.length!==4 || new Set(value.scores.map(s=>s.team)).size!==4) throw Error('Il faut exactement les quatre équipages.')
 for(const s of value.scores) {
  if (!(TEAM_NAMES as readonly string[]).includes(s.team)) throw Error('Équipage inconnu : '+s.team)
  for(const key of ['listens','audience','subscribers','bonuses','total'] as const) if(!Number.isFinite(s[key])||s[key]<0||s[key]>10000000) throw Error('Points invalides pour '+s.team)
  if(Math.abs(s.listens+s.audience+s.subscribers+s.bonuses-s.total)>0.001) throw Error('Total incohérent pour '+s.team+'. Recalcule et enregistre le fichier dans Excel.')
 }
 return value
}
export function safeLink(value: string) { try { const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password ? u.href : '' } catch { return '' } }
export const DEMO_SNAPSHOTS: Snapshot[] = ['2027-01-08','2027-01-15','2027-01-17','2027-01-22'].map((covered_date,i)=>({covered_date,label:dateLabel(covered_date),kind:'public',revision:1,note:'Données fictives pour valider la présentation.',divisor:5,mission_points:20,scores:TEAM_NAMES.map((team,t)=>{const listens=[42,36,28,32][t]*(i+1),audience=[70,64,60,52][t]*(i+1),subscribers=[9,12,6,9][t]*(i+1),bonuses=(i>1?[20,10,0,20][t]:0);return {team,listens,audience,subscribers,bonuses,total:listens+audience+subscribers+bonuses}})}))
