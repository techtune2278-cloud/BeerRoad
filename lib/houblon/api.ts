import { familyRequest, getValidSession } from '../family-auth'
import { DEFAULT_SETTINGS, normalizeSettings, storedTeamName, type Snapshot, type Settings, validateSnapshot } from './model'
export async function loadRace() {
 const session=await getValidSession()
 const [response,finals,settings]=await Promise.all([
  fetch('/api/houblon/google-sheet',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store',signal:AbortSignal.timeout(45000)}),
  familyRequest<Snapshot[]>('/rest/v1/race_snapshots?select=*&kind=eq.final'),
  familyRequest<Settings[]>('/rest/v1/race_settings?select=*&id=eq.1')])
 const data=await response.json()
 if(!response.ok)throw Error(data.error||'Lecture du tableur impossible.')
 const s=settings[0];return {snapshots:[...data.snapshots.filter((row:Snapshot)=>!finals.some(final=>final.covered_date===row.covered_date&&final.kind===row.kind)),...finals].map(validateSnapshot),settings:normalizeSettings(s?.revision?s:{...DEFAULT_SETTINGS,revision:s?.revision||0})}

}
export function publishSnapshot(s:Snapshot,revision:number){
 s=validateSnapshot(s)
 // Explicit whitelist: neither workbook bytes nor hidden columns can cross this boundary.
 const p_payload={covered_date:s.covered_date,kind:s.kind,label:s.label,note:s.note,divisor:s.divisor,mission_points:s.mission_points,scores:s.scores.map(({team,listens,audience,subscribers,bonuses,total})=>({team:storedTeamName(team),listens,audience,subscribers,bonuses,total}))}
 return familyRequest('/rest/v1/rpc/publish_race_snapshot',{method:'POST',body:JSON.stringify({p_payload,p_expected_revision:revision})})
}
export function withdrawSnapshot(s:Snapshot){return familyRequest('/rest/v1/rpc/withdraw_race_snapshot',{method:'POST',body:JSON.stringify({p_date:s.covered_date,p_kind:s.kind,p_expected_revision:s.revision})})}
export function saveSettings(s:Settings){return familyRequest('/rest/v1/rpc/save_race_settings',{method:'POST',body:JSON.stringify({p_payload:{notice:s.notice,challenge:s.challenge,rules:s.rules,links:s.links.map(row=>({...row,team:storedTeamName(row.team)}))},p_expected_revision:s.revision})})}

export async function loadTestRace(){
 const session=await getValidSession()
 const response=await fetch('/api/houblon/google-sheet?mode=test',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store',signal:AbortSignal.timeout(45000)})
 const data=await response.json()
 if(!response.ok)throw Error(data.error||'Lecture du tableur TEST impossible.')
 if(data.mode!=='test')throw Error('Source de test non confirmée.')
 return {snapshots:(data.snapshots as Snapshot[]).map(validateSnapshot),checked_at:String(data.checked_at)}
}
