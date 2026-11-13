import { createSign } from 'node:crypto'
import { parseGoogleRace } from '@/lib/houblon/google-sheet'
import { parisToday } from '@/lib/houblon/model'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}})
const request=(url:string,init:RequestInit={})=>fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(12000)})
export async function GET(req:Request){
 const testMode=new URL(req.url).searchParams.get('mode')==='test'
 const authorization=req.headers.get('authorization')||''
 if(!/^Bearer \S+$/.test(authorization))return reply({error:'Connexion familiale requise.'},401)
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,''),apikey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 if(!base||!apikey)return reply({error:'Configuration familiale manquante.'},503)
 try {
  const headers={authorization,apikey,'Content-Type':'application/json'}
  const user=await request(base+'/auth/v1/user',{headers})
  if(!user.ok)return reply({error:'Session expirée. Reconnecte-toi.'},401)
  const member=await request(base+'/rest/v1/rpc/is_family_member',{method:'POST',headers,body:'{}'})
  if(!member.ok||await member.json()!==true)return reply({error:'Accès réservé à la famille.'},403)
  if(testMode){
   const admin=await request(base+'/rest/v1/rpc/is_media_admin',{method:'POST',headers,body:'{}'})
   if(!admin.ok||await admin.json()!==true)return reply({error:'Mode test réservé à l’administrateur.'},403)
  }
  const productionId=process.env.HOUBLON_SPREADSHEET_ID||'1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw'
  const id=testMode?process.env.HOUBLON_TEST_SPREADSHEET_ID?.trim():productionId
  if(!id)return reply({error:'Ajouter HOUBLON_TEST_SPREADSHEET_ID dans Vercel avec l’identifiant de la copie TEST, puis redéployer.'},503)
  if(testMode&&id===productionId)return reply({error:'Le tableur TEST doit être différent du tableur réel.'},409)
  const email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,key=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g,'\n')
  if(!email||!key)return reply({error:'La connexion Google Sheets reste à configurer dans Vercel. Aucun chiffre de démonstration n’est affiché.'},503)
  const now=Math.floor(Date.now()/1000),encode=(v:unknown)=>Buffer.from(JSON.stringify(v)).toString('base64url')
  const unsigned=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})
  const jwt=unsigned+'.'+createSign('RSA-SHA256').update(unsigned).sign(key,'base64url')
  const tokenResponse=await request('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})})
  if(!tokenResponse.ok)throw Error('auth')
  const {access_token}=await tokenResponse.json()
  if(typeof access_token!=='string')throw Error('token')
  const url=new URL('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+'/values:batchGet')
  for(const range of ['EXPORT_PUBLIC!A1:L53','PARAMETRES!B19:B34','PUBLICATION!A1:B13'])url.searchParams.append('ranges',range)
  url.searchParams.set('valueRenderOption','UNFORMATTED_VALUE');url.searchParams.set('dateTimeRenderOption','SERIAL_NUMBER')
  const sheet=await request(url.href,{headers:{Authorization:'Bearer '+access_token}})
  if(!sheet.ok)throw Error('sheet')
  const {valueRanges}=await sheet.json()
  const snapshots=parseGoogleRace(valueRanges[0].values||[],valueRanges[1].values||[],valueRanges[2].values||[],testMode?'2027-03-01':parisToday())
  if(testMode)for(const snapshot of snapshots)snapshot.note='TEST — chiffres fictifs, visibles uniquement par l’administrateur.'
  return reply({mode:testMode?'test':'production',snapshots,checked_at:new Date().toISOString()})
 }catch{return reply({error:'Lecture Google Sheets impossible : vérifier le partage au compte de service, les trois onglets requis et les relevés autorisés. Les anciennes données éventuellement affichées ne sont pas à jour.'},502)}
}
