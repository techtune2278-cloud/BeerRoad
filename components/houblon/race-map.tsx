"use client"
import { COLORS, TEAM_NAMES, START, dateLabel, number, rank, type Snapshot } from '@/lib/houblon/model'
const periods=[['04–17 janvier','2027-01-04','2027-01-17'],['18–31 janvier','2027-01-18','2027-01-31'],['01–14 février','2027-02-01','2027-02-14'],['15–28 février','2027-02-15','2027-02-28']]
// Two separate hulls, a connecting deck and one L-shaped foil per hull.
function Boat({x,y,color,ghost=false}:{x:number;y:number;color:string;ghost?:boolean}){
 return <g transform={`translate(${x} ${y})`} opacity={ghost?.23:1}>
  <path d="M-20 9L16 7L22 12L-16 16Z" fill={color} opacity=".32"/>
  <path d="M-16 8L-13 19M12 7L17 18" fill="none" stroke={color} strokeWidth="2.5"/>
  <path d="M-25 7Q-6 3 24 6L19 12Q-4 11-21 14Z" fill={color} opacity=".75"/>
  <path d="M-24 17Q-4 13 27 16L21 23Q0 21-19 25Z" fill={color}/>
  <path d="M-13 11L-16 23L-27 26M14 20L17 28L28 25" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M0 -35Q-4-13-22 3L0 1Z" fill={color}/>
  <path d="M4 -28Q16-12 23 2L4 1Z" fill={color} opacity=".7"/>
  <path d="M1 -38V15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
 </g>
}
export function RaceMap({snapshot,previous,ceiling}:{snapshot:Snapshot;previous?:Snapshot;ceiling:number}){
 const max=Math.max(100,ceiling),x=(v:number)=>130+Math.min(1,v/max)*610
 const day=Math.min(56,Math.max(0,Math.floor((Date.parse(snapshot.covered_date)-Date.parse(START))/86400000)+1))
 return <section className="race-chart" aria-label="Positions des quatre équipages">
  <div className="race-chart-top"><div><span className="race-eyebrow">{snapshot.kind==='final'?'Brouillard levé':'La flotte · classement visible'}</span><h2>{dateLabel(snapshot.covered_date)}</h2></div><span className="race-day">Jour {day} / 56</span></div>
  <svg className="race-ocean" viewBox="0 0 960 430" role="img" aria-labelledby="race-map-title race-map-description">
   <title id="race-map-title">{`Positions en points ${snapshot.kind==='final'?'finaux':'publics'}`}</title><desc id="race-map-description">Les points déterminent la position horizontale. Les quatre lignes identifient les équipages. Les catamarans portent deux coques et deux foils. Les silhouettes claires indiquent le relevé précédent. Les chiffres détaillés figurent sous la carte.</desc>
   <defs><linearGradient id={`sea-${snapshot.covered_date}`} x2="0" y2="1"><stop stopColor="#e6f1ef"/><stop offset="1" stopColor="#cce3e9"/></linearGradient><pattern id={`grid-${snapshot.covered_date}`} width="65" height="55" patternUnits="userSpaceOnUse"><path d="M65 0H0V55" fill="none" stroke="#1c5264" strokeOpacity=".08"/></pattern></defs>
   <rect width="960" height="430" rx="18" fill={`url(#sea-${snapshot.covered_date})`}/><rect width="960" height="430" rx="18" fill={`url(#grid-${snapshot.covered_date})`}/>
   <path d="M0 0H95L75 32L103 52L67 90L84 127L48 148L63 193L29 220L40 260L0 280Z" fill="#dddcc8"/><path d="M0 0H95L75 32L103 52L67 90L84 127L48 148L63 193L29 220L40 260" fill="none" stroke="#b8bfa7"/>
   <text x="25" y="312" fill="#537065" fontSize="12" transform="rotate(-90 25 312)">KER HUON · PORT D’ATTACHE</text>
   {[0,1,2,3,4].map(i=><g key={i}><line x1={x(max*i/4)} x2={x(max*i/4)} y1="35" y2="374" stroke="#316977" strokeOpacity=".15" strokeDasharray="3 6"/><text x={x(max*i/4)} y="406" textAnchor="middle" fill="#48616b" fontSize="13">{number(max*i/4)} pts</text></g>)}
   {TEAM_NAMES.map((team,i)=>{const score=snapshot.scores.find(s=>s.team===team)!,prev=previous?.scores.find(s=>s.team===team),y=76+i*94;return <g key={team}>
    <line x1="130" x2="830" y1={y+26} y2={y+26} stroke="#fff" strokeOpacity=".4"/>
    {prev&&<><line x1={x(prev.total)} x2={x(score.total)} y1={y+8} y2={y+8} stroke={COLORS[i]} strokeWidth="2" strokeDasharray="4 5"/><Boat x={x(prev.total)} y={y} color={COLORS[i]} ghost/></>}
    <Boat x={x(score.total)} y={y} color={COLORS[i]}/><text x={x(score.total)+32} y={y-10} fontSize="14" fill="#163a4b" fontWeight="700">{number(score.total)} pts</text><text x={x(score.total)+32} y={y+11} fontSize="12" fill="#365866">{team}</text>
   </g>})}
   <path d="M893 47V90M872 68H914M893 47L889 57M893 47L897 57" stroke="#60818c" fill="none"/><text x="893" y="38" textAnchor="middle" fill="#60818c" fontSize="12">N</text>
  </svg>
  <div className="race-mobilefleet" aria-label="Positions sur smartphone">{TEAM_NAMES.map((team,i)=>{const score=snapshot.scores.find(s=>s.team===team)!,prev=previous?.scores.find(s=>s.team===team);const at=(n:number)=>`calc(${n/max*100}% - ${n/max*32}px)`;return <div className="race-mobilelane" key={team}><div><strong>{team}</strong><span>{number(score.total)} pts</span></div><div className="race-mobilewater">{prev&&<svg style={{left:at(prev.total)}} viewBox="-30 -40 60 70" aria-hidden="true"><Boat x={0} y={0} color={COLORS[i]} ghost/></svg>}<svg style={{left:at(score.total)}} viewBox="-30 -40 60 70" aria-hidden="true"><Boat x={0} y={0} color={COLORS[i]}/></svg></div></div>})}<p>0 → {number(max)} points · même échelle pour tous</p></div>
  <p className="race-caption">{previous?`Silhouettes claires : relevé du ${dateLabel(previous.covered_date)}.`:'Premier relevé publié.'} Position en points, pas en milles nautiques. Échelle commune à l’historique affiché.</p>
  <div className="race-standings">{[...snapshot.scores].sort((a,b)=>b.total-a.total).map(score=>{const i=TEAM_NAMES.indexOf(score.team as typeof TEAM_NAMES[number]),prev=previous?.scores.find(s=>s.team===score.team),place=rank(snapshot.scores,score.total),delta=prev?rank(previous!.scores,prev.total)-place:null;return <article key={score.team} style={{borderTopColor:COLORS[i]}}><div className="race-card-heading"><span className="race-rank">{place}<small>{place===1?'er':'e'}</small></span><strong>{score.team}</strong></div><div className="race-total">{number(score.total)} <small>points</small></div><p>{prev?`${score.total-prev.total>=0?'+':''}${number(score.total-prev.total)} pts · ${delta===0?'rang stable':`${delta!>0?'+':''}${delta} place${Math.abs(delta!)>1?'s':''}`}`:'Premier pointage'}</p><details><summary>Détail du score</summary><dl><dt>Écoutes / vues</dt><dd>{number(score.listens)}</dd><dt>Audiences</dt><dd>{number(score.audience)}</dd><dt>Abonnements</dt><dd>{number(score.subscribers)}</dd><dt>Défis et bonus</dt><dd>{number(score.bonuses)}</dd></dl></details></article>})}</div>
  <ol className="race-periods">{periods.map(([label,start,end],i)=>{const status=snapshot.covered_date>end?'Terminée':snapshot.covered_date>=start?'En cours':'À venir';return <li key={label} className={status==='En cours'?'active':status==='Terminée'?'done':''}><span>Quinzaine {i+1} · {status}</span><strong>{label}</strong></li>})}</ol>
 </section>
}
