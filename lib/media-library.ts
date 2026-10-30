import { familyRequest, getSupabaseConfig, getValidSession } from './family-auth'
export const collections = [
 ['lettres-filles','Lettres à mes filles'], ['lettres-gendres','Lettres à mes gendres'],
 ['podcasts','Les podcasts — 12 épisodes'], ['origines','Origines — albums et film'],
 ['transmission','Transmission — autres livres'], ['atelier','Atelier'], ['grenier','Le Grenier — musiques'],
 ['kerhuon','Ker Huon'], ['legendes','Légendes'], ['avenir','Avenir'],
] as const
export type MediaResource = {
 id: string; collection: string; title: string; description: string; kind: 'audio'|'video'|'pdf'|'image';
 position: number; published: boolean; storage_path: string|null; drive_url: string|null; file_name: string|null; size_bytes: number|null
}
export type MediaInput = Omit<MediaResource,'id'>
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024
export function validateMediaFile(file: File, kind: MediaResource['kind']) {
 const types = { audio: ['mp3'], video: ['mp4'], pdf: ['pdf'], image: ['jpg','jpeg','png','webp'] }
 const ext = file.name.split('.').pop()?.toLowerCase() || ''
 if (!file.size || file.size > MAX_MEDIA_BYTES) throw new Error('Choisis un fichier entre 1 octet et 50 Mo. Pour un gros film, utilise Drive.')
 if (!types[kind].includes(ext)) throw new Error(`Format attendu : ${types[kind].join(', ')}.`)
 return ({mp3:'audio/mpeg',mp4:'video/mp4',pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'} as Record<string,string>)[ext]
}
export function driveLinks(value: string) {
 const url = new URL(value)
 if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com') throw new Error('Colle le lien de partage du fichier Google Drive.')
 const id = url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1] || (url.pathname === '/open' ? url.searchParams.get('id') : null)
 if (!id || !/^[\w-]+$/.test(id)) throw new Error('Il faut le lien du fichier Drive, pas celui du dossier.')
 return {view:`https://drive.google.com/file/d/${id}/view`,preview:`https://drive.google.com/file/d/${id}/preview`,download:`https://drive.google.com/uc?export=download&id=${id}`}
}
export const isMediaAdmin = () => familyRequest<boolean>('/rest/v1/rpc/is_media_admin',{method:'POST',body:'{}'})
export function listMedia(collection?: string, admin = false) {
 const q = new URLSearchParams({select:'*',order:'position.asc,created_at.asc',limit:'1000'})
 if (collection) q.set('collection',`eq.${collection}`)
 if (!admin) q.set('published','eq.true')
 return familyRequest<MediaResource[]>(`/rest/v1/media_resources?${q}`)
}
const storagePath = (path:string) => path.split('/').map(encodeURIComponent).join('/')
export async function removeMediaFile(path:string) {
 await familyRequest(`/storage/v1/object/official-media/${storagePath(path)}`,{method:'DELETE'})
}
export async function saveMedia(input:MediaInput, id?: string) {
 const rows=await familyRequest<MediaResource[]>(`/rest/v1/media_resources${id?`?id=eq.${encodeURIComponent(id)}`:''}`,{
 method:id?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(input)})
 if (!rows[0]) throw new Error('Enregistrement refusé. Vérifie tes droits administrateur.')
 return rows[0]
}
export async function deleteMedia(id:string) {
 const rows=await familyRequest<MediaResource[]>(`/rest/v1/media_resources?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:{Prefer:'return=representation'}})
 if (!rows[0]) throw new Error('Suppression refusée ou média déjà supprimé.')
 // La ligne disparaît d'abord : un fichier orphelin reste inaccessible aux membres.
 if (rows[0].storage_path) {
  try { await removeMediaFile(rows[0].storage_path) } catch { return 'Ressource supprimée. Le fichier inutilisé reste à nettoyer dans Supabase Storage.' }
 }
 return 'Ressource supprimée.'
}
export async function mediaUrl(media:MediaResource, download=false) {
 if (media.drive_url) return driveLinks(media.drive_url)[download?'download':'preview']
 if (!media.storage_path) throw new Error('Aucun fichier associé.')
 const config=getSupabaseConfig(); if(!config)throw new Error('Supabase non configuré.')
 const result=await familyRequest<{signedURL:string}>(`/storage/v1/object/sign/official-media/${storagePath(media.storage_path)}`,{method:'POST',body:JSON.stringify({expiresIn:3600})})
 const url=new URL(result.signedURL.startsWith('http')?result.signedURL:`${config.url}/storage/v1${result.signedURL}`)
 if(download)url.searchParams.set('download',media.file_name || media.title)
 return url.href
}
export async function uploadOfficial(file:File, kind:MediaResource['kind'], progress:(value:number)=>void) {
 const contentType=validateMediaFile(file,kind)
 const config=getSupabaseConfig(); if(!config)throw new Error('Supabase non configuré.')
 const session=await getValidSession()
 const safe=file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w.-]/g,'-').slice(-90)
 const path=`${crypto.randomUUID()}/${safe}`
 await new Promise<void>((resolve,reject)=>{
  const xhr=new XMLHttpRequest()
  xhr.open('POST',`${config.url}/storage/v1/object/official-media/${storagePath(path)}`)
  xhr.timeout=120000
  xhr.setRequestHeader('apikey',config.anonKey);xhr.setRequestHeader('Authorization',`Bearer ${session.access_token}`)
  xhr.setRequestHeader('Content-Type',contentType);xhr.setRequestHeader('x-upsert','false')
  xhr.upload.onprogress=e=>{if(e.lengthComputable)progress(Math.round(e.loaded/e.total*100))}
  xhr.onerror=()=>reject(new Error('Envoi interrompu. Vérifie ta connexion.'))
  xhr.ontimeout=()=>reject(new Error('Envoi trop long. Réessaie avec une connexion stable.'))
  xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error(`Envoi refusé (${xhr.status}). Vérifie les droits et la taille autorisée dans Supabase.`))
  xhr.send(file)
 })
 return path
}
