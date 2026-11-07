import { familyRequest } from '../family-auth'
import { DEFAULT_SETTINGS, type Snapshot, type Settings, validateSnapshot } from './model'
export async function loadRace() {
 const [snapshots,settings]=await Promise.all([
  familyRequest<Snapshot[]>('/rest/v1/race_snapshots?select=*&order=covered_date.asc,kind.desc'),
  familyRequest<Settings[]>('/rest/v1/race_settings?select=*&id=eq.1')])
 const s=settings[0];return {snapshots:snapshots.map(validateSnapshot),settings:s?.revision?s:{...DEFAULT_SETTINGS,revision:s?.revision||0}}
}
export function publishSnapshot(s:Snapshot,revision:number){
 validateSnapshot(s)
 // Explicit whitelist: neither workbook bytes nor hidden columns can cross this boundary.
 const p_payload={covered_date:s.covered_date,kind:s.kind,label:s.label,note:s.note,divisor:s.divisor,mission_points:s.mission_points,scores:s.scores.map(({team,listens,audience,subscribers,bonuses,total})=>({team,listens,audience,subscribers,bonuses,total}))}
 return familyRequest('/rest/v1/rpc/publish_race_snapshot',{method:'POST',body:JSON.stringify({p_payload,p_expected_revision:revision})})
}
export function withdrawSnapshot(s:Snapshot){return familyRequest('/rest/v1/rpc/withdraw_race_snapshot',{method:'POST',body:JSON.stringify({p_date:s.covered_date,p_kind:s.kind,p_expected_revision:s.revision})})}
export function saveSettings(s:Settings){return familyRequest('/rest/v1/rpc/save_race_settings',{method:'POST',body:JSON.stringify({p_payload:{notice:s.notice,challenge:s.challenge,rules:s.rules,links:s.links},p_expected_revision:s.revision})})}
