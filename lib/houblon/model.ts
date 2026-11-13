export const TEAM_NAMES = ['Marie & Alexis','Anne & Vincent','Laure & Mehdy','Emmanuelle & Robin'] as const
// Preserve the historical database identifier while showing the current crew name.
export function normalizeTeamName(team: string) { return team === 'Alexis & Marie' ? 'Marie & Alexis' : team }
export function storedTeamName(team: string) { return normalizeTeamName(team) === 'Marie & Alexis' ? 'Alexis & Marie' : team }
export const SECOND_SONGS: Record<string,string> = {
 'Marie & Alexis':'Everything starts',
 'Anne & Vincent':'La Beer road',
 'Laure & Mehdy':'Vendredi après-midi',
 'Emmanuelle & Robin':'Passing the Light',
}
export function normalizeSettings(settings: Settings): Settings {
 return {...settings, links:settings.links.map(row=>{
  const team=normalizeTeamName(row.team)
  const missing=!row.song2?.trim() || /^(seconde chanson à attribuer|à attribuer|à venir)$/i.test(row.song2.trim())
  return {...row,team,song2:missing ? (SECOND_SONGS[team] || row.song2) : row.song2}
 })}
}
export const COLORS = ['#38845c','#277caa','#b47534','#8468a3']
export const START = '2027-01-04', END = '2027-02-28'
export const DATES = ['2027-01-08','2027-01-15','2027-01-17','2027-01-22','2027-01-29','2027-01-31','2027-02-05','2027-02-12','2027-02-14','2027-02-19','2027-02-26','2027-02-28']
export const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfBrhDB_MsezGqWGgW3ysgDtGfuK1ci_8OquPHIW_Cmd09QHg/viewform'
export type Score = { team: string; listens: number; audience: number; subscribers: number; bonuses: number; total: number }
export type Snapshot = { covered_date: string; label: string; kind: 'public'|'final'; scores: Score[]; revision: number; published_at?: string; note: string; divisor: number; mission_points: number }
export type CrewLinks = { team: string; song: string; youtube: string; spotify: string; song2: string; youtube2: string; spotify2: string }
export type Settings = { id: number; notice: string; challenge: string; rules: string; links: CrewLinks[]; revision: number }
export const QG_RULES = [
  "Course du lundi 4 janvier au dimanche 28 février 2027 inclus : 56 jours, quatre équipages et deux chansons par équipage.",
  "Classement provisoire : écoutes et auditeurs uniques de Spotify, YouTube et Amazon Music, plus les abonnements et bonus validés rendus publics. Les écoutes Deezer et Apple Music ainsi que leurs abonnements restent dans la brume jusqu’au classement final.",
  "Barème : 5 écoutes ou vues = 1 point ; 1 auditeur unique par titre et plateforme = 2 points sur Spotify, YouTube et Amazon Music. Les audiences ne sont pas additionnées entre relevés. Un nouvel abonnement validé vaut 3 points, ou 6 sous Spinnaker. Amazon ne rapporte pas de points d’abonnement.",
  "Chaque défi rapporte 20 points à chaque équipage gagnant, avec jusqu’à quatre ex æquo. Les bonus ordinaires sont plafonnés à 100 points. Le jury peut attribuer deux distinctions de 40 points hors plafond, au maximum une par équipage.",
  "Défi playlist : Spotify ou Deezer, une playlist par équipage ; le compteur d’abonnés ou de fans est justifié par un lien et une capture datée. Les ajouts de chansons en playlist ne sont pas ce compteur.",
  "Prix collectif : atteindre au moins trois objectifs sur quatre — 2 500 écoutes ou vues du catalogue, +50 abonnés YouTube, +40 abonnés Spotify et +60 abonnés Instagram.",
  "À l’arrivée, toutes les plateformes sont prises en compte. Si la chanson la moins écoutée représente moins de 25 % des écoutes des deux titres, un malus de 10 % s’applique aux seuls points d’écoutes.",
  "Les écoutes et actions doivent être réelles : aucun achat d’écoutes ou d’abonnés, faux compte, robot ou boucle artificielle. Les consignes, défis et flashs météo sont communiqués sur WhatsApp. Le règlement remis aux équipages détaille les justificatifs et échéances.",
  "Résultats annoncés au plus tard 48 heures après l’arrivée, après compilation et validation des données des plateformes."
] as const
export const DEFAULT_SETTINGS: Settings = {id:1,revision:0,notice:'Bienvenue à bord. Départ le 4 janvier 2027 !',challenge:'Les défis sont annoncés sur WhatsApp.',rules:QG_RULES.join('\n'),links:TEAM_NAMES.map((team,i)=>({team,song:['Alexis Roi du Rock’n’Frites','Sgt Cocoual Gagnant','Mehdy m’a dit','Robinou Rock'][i],youtube:'',spotify:'',song2:SECOND_SONGS[team],youtube2:'',spotify2:''}))}
export function rank(scores: Score[], total: number) { return 1 + scores.filter(s=>s.total > total).length }
export function number(value: number) { return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(value) }
export function dateLabel(value: string) { return new Date(value+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'long',timeZone:'Europe/Paris'}) }
export function parisToday() { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()) }
export function validateSnapshot(value: Snapshot) {
 value = {...value, scores:value.scores.map(score=>({...score,team:normalizeTeamName(score.team)}))}
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
