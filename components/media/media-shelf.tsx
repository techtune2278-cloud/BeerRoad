"use client"
import { useEffect, useState } from 'react'
import { PdfReader } from './pdf-reader'
import { listMedia, mediaUrl, driveLinks, type MediaResource } from '@/lib/media-library'
const action = {audio:'Écouter',video:'Regarder',pdf:'Lire',image:'Voir'}
function MediaItem({media}:{media:MediaResource}) {
 const [url,setUrl]=useState(''), [busy,setBusy]=useState(false), [error,setError]=useState('')
 const [download,setDownload]=useState('')
 async function open(asDownload=false) {
  setError('');setBusy(true)
  try {
   const value=await mediaUrl(media,asDownload)
   if(asDownload){
    setDownload(value)
    const a=document.createElement('a');a.href=value;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove()
   } else setUrl(value)
  }catch(e){setError(e instanceof Error?e.message:'Média indisponible.')}
  finally{setBusy(false)}
 }
 return <article className="rounded-xl border border-border bg-background/70 p-3">
  <p className="font-semibold">{media.collection==='podcasts'&&`${media.position}. `}{media.title}</p>
  {media.description&&<p className="mt-1 text-sm text-muted-foreground">{media.description}</p>}
  <div className="mt-3 flex flex-wrap gap-2">
   <button type="button" disabled={busy} onClick={()=>url?setUrl(''):void open()} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy?'Chargement…':url?'Fermer le lecteur':action[media.kind]}</button>
   <button type="button" disabled={busy} onClick={()=>void open(true)} className="rounded-full border border-border px-4 py-2 text-sm">Télécharger{media.size_bytes?` (${(media.size_bytes/1024/1024).toFixed(1)} Mo)`:''}</button>
  </div>
  {error&&<p role="alert" className="mt-2 text-sm text-destructive">{error} <button onClick={()=>void open()} className="underline">Réessayer</button></p>}
  {download&&<a href={download} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs underline">Si le téléchargement ne démarre pas, ouvrir ce lien</a>}
  {url&&<div className="mt-3">
   {media.drive_url?<><iframe title={media.title} src={url} allow="fullscreen" allowFullScreen className="h-[55vh] w-full rounded-xl border-0"/><a href={driveLinks(media.drive_url).view} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm underline">Ouvrir dans Drive</a><p className="text-xs text-muted-foreground">Les autorisations Google Drive s’appliquent aussi à la lecture et au téléchargement.</p></>:
   media.kind==='audio'?<audio controls autoPlay preload="metadata" src={url} onError={()=>setError('Lecture impossible ou lien expiré. Réessaie.')} className="w-full"/>:
   media.kind==='video'?<video controls playsInline preload="metadata" src={url} onError={()=>setError('Lecture impossible ou lien expiré. Réessaie.')} className="max-h-[65vh] w-full rounded-xl"/>:
   media.kind==='pdf'?<PdfReader url={url} title={media.title}/>:
   <img src={url} alt={media.title} className="max-h-[65vh] w-full object-contain"/>}
  </div>}
 </article>
}
export function MediaShelf({collection,connected,onConnect}:{collection:string;connected:boolean;onConnect:()=>void}) {
 const [rows,setRows]=useState<MediaResource[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0)
 useEffect(()=>{
  if(!connected)return
  let active=true;setLoading(true);setError('')
  void listMedia(collection).then(data=>{if(active)setRows(data)}).catch(()=>{if(active)setError('Les ressources ne sont pas accessibles pour le moment.')}).finally(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[collection,connected,attempt])
 if(!connected)return <button type="button" onClick={onConnect} className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Se connecter pour accéder aux contenus</button>
 if(loading)return <p role="status" className="mt-3 text-sm">Chargement des ressources…</p>
 if(error)return <p role="alert" className="mt-3 text-sm">{error} <button onClick={()=>setAttempt(x=>x+1)} className="underline">Réessayer</button></p>
 return <div className="mt-3 space-y-3">
  {collection==='podcasts'&&<p className="text-sm text-muted-foreground">{rows.length} épisode{rows.length>1?'s':''} disponible{rows.length>1?'s':''} sur 12</p>}
  {!rows.length?<p className="text-sm text-muted-foreground">{collection==='podcasts'?'Les épisodes seront disponibles dès leur ajout.':'Le contenu sera disponible dès son ajout.'}</p>:rows.map(row=><MediaItem key={row.id} media={row}/>)}
 </div>
}
