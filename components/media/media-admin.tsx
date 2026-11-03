"use client"
import { AppLinksAdmin } from "./app-catalog"
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { mediaKinds, sortAdminMedia, collections, deleteMedia, isMediaAdmin, listMedia, saveMedia, uploadOfficial, removeMediaFile, driveLinks, validateMediaFile, type MediaInput, type MediaResource } from '@/lib/media-library'
const empty:MediaInput={collection:'lettres-filles',title:'',description:'',kind:'pdf',position:1,published:true,storage_path:null,drive_url:null,file_name:null,size_bytes:null}
const inputClass='mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm'
export function MediaAdmin() {
 const editorHeading=useRef<HTMLHeadingElement>(null)
 const [editRequest,setEditRequest]=useState(0)
 useEffect(()=>{
  if(!editRequest)return
  editorHeading.current?.focus({preventScroll:true})
  editorHeading.current?.scrollIntoView({behavior:'auto',block:'start'})
 },[editRequest])
 const [admin,setAdmin]=useState(false),[open,setOpen]=useState(false),[rows,setRows]=useState<MediaResource[]>([])
 const [form,setForm]=useState<MediaInput>(empty),[id,setId]=useState<string>(),[file,setFile]=useState<File|null>(null)
 const [source,setSource]=useState<'file'|'drive'>('file'),[drive,setDrive]=useState(''),[fileKey,setFileKey]=useState(0)
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[message,setMessage]=useState(''),[error,setError]=useState('')
 useEffect(()=>{let active=true;void isMediaAdmin().then(value=>{if(active)setAdmin(value === true)}).catch(()=>{});return()=>{active=false}},[])
 async function refresh(){setRows(sortAdminMedia(await listMedia(undefined,true)))}
 function reset(){setForm({...empty});setId(undefined);setFile(null);setDrive('');setSource('file');setFileKey(x=>x+1)}
 function edit(row:MediaResource){setEditRequest(value=>value+1);setForm({...row});setId(row.id);setFile(null);setFileKey(x=>x+1);setSource(row.drive_url?'drive':'file');setDrive(row.drive_url||'');setError('');setMessage('')}
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');setMessage('');setProgress(0)
  try{
   const next:MediaInput={...form,title:form.title.trim(),description:form.description.trim()}
   if(!next.title)throw new Error('Renseigne le titre.')
   if(next.collection==='podcasts'&&(next.kind!=='audio'||next.position<1||next.position>12))throw new Error('Les podcasts doivent être audio, numérotés de 1 à 12.')
   if(rows.some(r=>r.id!==id&&r.collection===next.collection&&(next.collection==='podcasts'?r.position===next.position:['lettres-filles','lettres-gendres'].includes(next.collection))))throw new Error('Cet emplacement est déjà occupé. Modifie la ressource existante.')
   if(source==='file' && !file && form.storage_path && rows.find(r=>r.id===id)?.kind !== next.kind)throw new Error('Choisis un nouveau fichier correspondant au type de cette rubrique.')
   if(source==='drive') {next.drive_url=driveLinks(drive).view;next.storage_path=null;next.file_name=null;next.size_bytes=null}
   else{
    next.drive_url=null
    if(file){validateMediaFile(file,next.kind);next.storage_path=await uploadOfficial(file,next.kind,setProgress);next.file_name=file.name;next.size_bytes=file.size}
    if(!next.storage_path)throw new Error('Choisis un fichier.')
   }
   // Une erreur réseau peut survenir après l'écriture SQL : conserver le fichier
   // plutôt que risquer de supprimer une ressource effectivement enregistrée.
   await saveMedia(next,id)
   let notice='Ressource enregistrée.'
   if(form.storage_path&&form.storage_path!==next.storage_path){try{await removeMediaFile(form.storage_path)}catch{notice+=' L’ancien fichier reste à nettoyer dans Supabase Storage.'}}
   reset();setMessage(notice)
   try{await refresh()}catch{setError('Enregistrement effectué, mais la liste n’a pas pu être actualisée. Ferme puis rouvre ce menu.')}
  }catch(e){setError((e instanceof Error?e.message:'Enregistrement impossible.')+' Si un envoi venait de se terminer, actualise la liste avant de réessayer.')}
  finally{setBusy(false)}
 }
 async function remove(row:MediaResource){
  if(!window.confirm(`Supprimer « ${row.title} » de la médiathèque ?`))return
  setBusy(true);setError('');setMessage('')
  try{const notice=await deleteMedia(row.id);if(id===row.id)reset();setMessage(notice);await refresh()}catch(e){setError(e instanceof Error?e.message:'Suppression impossible.')}finally{setBusy(false)}
 }
 if(!admin)return null
 return <div className="mt-4 rounded-2xl border border-border p-3 sm:p-4">
  <button type="button" disabled={busy} aria-expanded={open} onClick={async()=>{setOpen(!open);if(!open){setError('');try{await refresh()}catch{setError('Impossible de charger la médiathèque. Vérifie que la migration SQL a été appliquée.')}}}} className="text-sm font-semibold underline">{open?'Fermer la gestion des médias':'Gérer les médias'}</button>
  {open&&<div className="mt-4">
   <h3 ref={editorHeading} tabIndex={-1} className="scroll-mt-6 font-serif text-xl focus:outline-none">{id?`Modifier : ${form.title}`:'Ajouter une ressource'}</h3>
   <form onSubmit={submit} className="mt-3 space-y-3">
    <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
     <label className="block text-sm">Emplacement<select className={inputClass} value={form.collection} onChange={e=>{const collection=e.target.value;setForm({...form,collection,kind:collection==='podcasts'?'audio':['lettres-filles','lettres-gendres'].includes(collection)?'pdf':form.kind});setFile(null);setFileKey(x=>x+1)}}>{collections.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
     <label className="block text-sm">Titre<input required maxLength={140} className={inputClass} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
     <label className="block text-sm">Description (facultative)<textarea maxLength={2000} className={inputClass} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">Type<select disabled={['lettres-filles','lettres-gendres','podcasts'].includes(form.collection)||!!form.storage_path} className={inputClass} value={form.kind} onChange={e=>{setForm({...form,kind:e.target.value as MediaResource['kind']});setFile(null);setFileKey(x=>x+1)}}><option value="audio">Audio MP3</option><option value="pdf">Livre PDF</option><option value="video">Film MP4</option><option value="image">Image</option></select></label>
      <label className="block text-sm">{form.collection==='podcasts'?'Numéro de l’épisode (1 à 12)':'Ordre dans ce type de média'}<input type="number" required min={1} max={form.collection==='podcasts'?12:999} className={inputClass} value={form.position} onChange={e=>setForm({...form,position:Number(e.target.value)})}/></label>
     </div>
     <p className="text-xs text-muted-foreground">Dans chaque emplacement : audios, films, PDF, puis images. Chaque type suit ses propres numéros. Pour changer seulement l’ordre, conserve le fichier actuel.</p>
     <label className="block text-sm">Source<select className={inputClass} value={source} onChange={e=>setSource(e.target.value as 'file'|'drive')}><option value="file">Charger un fichier dans l’application</option><option value="drive">Relier un fichier Google Drive</option></select></label>
     {source==='file'?<label className="block text-sm">Fichier — 50 Mo maximum<input key={fileKey} type="file" accept={{audio:'.mp3',video:'.mp4',pdf:'.pdf',image:'.jpg,.jpeg,.png,.webp'}[form.kind]} className={inputClass} onChange={e=>setFile(e.target.files?.[0]||null)}/>{form.file_name&&<span className="text-xs">Fichier actuel : {form.file_name}. Laisse ce champ vide pour le conserver.</span>}</label>:<label className="block text-sm">Lien de partage du fichier Drive<input type="url" required className={inputClass} value={drive} onChange={e=>setDrive(e.target.value)} placeholder="https://drive.google.com/file/d/…/view"/><span className="text-xs text-muted-foreground">Choisis le fichier, pas le dossier. Vérifie les droits de lecture et de téléchargement pour ta famille.</span></label>}
     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/>Visible pour la famille</label>
     <div className="flex flex-wrap gap-2"><button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">{id?'Enregistrer':'Publier'}</button><button type="button" onClick={reset} className="rounded-full border px-4 py-2 text-sm">{id?'Annuler':'Vider le formulaire'}</button></div>
    </fieldset>
    {busy&&<div role="status"><p className="text-sm">{progress===100?'Envoi terminé, enregistrement…':'Traitement en cours…'}</p>{file&&<progress value={progress} max={100} className="w-full"/>}</div>}
   </form>
   {error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
   {message&&<p role="status" className="mt-3 text-sm">{message}</p>}
   <AppLinksAdmin/>
   <h4 className="mt-6 font-semibold">Ressources enregistrées ({rows.length})</h4>
   <ul className="mt-2 space-y-2">{rows.map(row=><li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/50 p-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{row.title}{!row.published?' · Masqué':''}</p><p className="text-xs text-muted-foreground">{collections.find(([key])=>key===row.collection)?.[1]} · {mediaKinds.find(([kind])=>kind===row.kind)?.[1]} · n° {row.position}</p></div><div className="flex gap-3"><button disabled={busy} type="button" onClick={()=>edit(row)} className="min-h-11 rounded-full border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">Modifier</button><button disabled={busy} type="button" onClick={()=>void remove(row)} className="min-h-11 rounded-full px-3 py-2 text-sm underline disabled:opacity-50">Supprimer</button></div></li>)}</ul>
  </div>}
 </div>
}
