"use client"
import { useEffect,useRef,useState } from 'react'
import { searchResources,type ResourceResult } from '@/lib/resource-search'
import type { Plaque,Universe } from '@/src/data/beerRoadData'
import type { MediaResource } from '@/lib/media-library'
import type { CommunityPost,FamilyEvent } from '@/lib/family-api'
import { MediaItem } from './media/media-shelf'
import { PostMedia } from './community/post-media'
export function ResourceSearch({query,connected,matches,onUniverse,onResult}:{query:string;connected:boolean;matches:Plaque[];onUniverse:(plaque:Plaque)=>void;onResult:(result:ResourceResult)=>void}) {
 const [rows,setRows]=useState<ResourceResult[]>([]),[more,setMore]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{
  const current=++generation.current;setRows([]);setMore(false);setError('');setBusy(connected&&query.trim().length>=2)
  if(!connected||query.trim().length<2)return
  const timer=setTimeout(()=>{void searchResources(query).then(data=>{if(current===generation.current){setRows(data.items);setMore(data.more)}}).catch(()=>{if(current===generation.current)setError('Recherche des contenus indisponible. Réessaie dans un instant.')} ).finally(()=>{if(current===generation.current)setBusy(false)})},250)
  return()=>{clearTimeout(timer);generation.current++}
 },[query,connected,attempt])
 async function next(){const current=generation.current;setBusy(true);setError('');try{const data=await searchResources(query,rows.length);if(current===generation.current){setRows(old=>[...old,...data.items]);setMore(data.more)}}catch{if(current===generation.current)setError('La suite des résultats n’a pas pu être chargée.')}finally{if(current===generation.current)setBusy(false)}}
 return <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[65vh] overflow-y-auto rounded-2xl border bg-popover p-2 text-left shadow-xl" aria-label="Résultats de recherche">
  {matches.map(p=><button type="button" key={p.id} onClick={()=>onUniverse(p)} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-secondary"><span className="font-semibold">{p.emoji} {p.name}</span><span className="block text-xs text-muted-foreground">Univers</span></button>)}
  {connected&&rows.map(row=><button type="button" key={`${row.kind}-${row.payload.id}`} onClick={()=>onResult(row)} className="block w-full rounded-xl px-3 py-3 text-left hover:bg-secondary"><span className="block text-sm font-semibold">{row.title}</span><span className="block text-xs text-muted-foreground">{{media:'Ressource',post:'Contribution',event:'Agenda'}[row.kind]} · {row.section}</span><span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{row.description}</span></button>)}
  {busy&&<p role="status" className="p-3 text-sm">Recherche dans les contenus…</p>}
  {error&&<p role="alert" className="p-3 text-sm">{error} <button onClick={()=>setAttempt(n=>n+1)} className="underline">Réessayer</button></p>}
  {!connected&&<p className="p-3 text-sm text-muted-foreground">Connecte-toi dans le carnet pour rechercher aussi les tutos, podcasts et contributions privés.</p>}
  {connected&&query.trim().length<2&&<p className="p-3 text-sm">Saisis au moins deux caractères pour rechercher dans les contenus.</p>}
  {connected&&query.trim().length>=2&&!busy&&!error&&!rows.length&&!matches.length&&<p className="p-3 text-sm">Aucun résultat. Essaie un autre mot.</p>}
  {more&&<button disabled={busy} onClick={()=>void next()} className="p-3 text-sm underline">Voir plus de résultats</button>}
 </div>
}
export function SearchResultDialog({result,onClose,onUniverse}:{result:ResourceResult;onClose:()=>void;onUniverse:(universe:Universe)=>void}){
 const close=useRef<HTMLButtonElement>(null),root=useRef<HTMLDivElement>(null),callback=useRef(onClose);callback.current=onClose
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';close.current?.focus()
 const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')callback.current();if(e.key==='Tab'){const nodes=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],select,input,[tabindex="0"]')||[]).filter(n=>n.getClientRects().length);if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus()}}}
 document.addEventListener('keydown',handler);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',handler);if(previous?.isConnected)previous.focus()}
 },[])
 const event=result.kind==='event'?result.payload as FamilyEvent:null
 return <div role="presentation" onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"><section ref={root} role="dialog" aria-modal="true" aria-label={result.title} onClick={e=>e.stopPropagation()} className="max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-2xl bg-card p-4"><div className="mb-3 flex justify-end"><button ref={close} onClick={onClose} className="rounded-full border px-3 py-2">Fermer</button></div>{result.kind==='media'?<MediaItem media={result.payload as MediaResource}/>:<><h2 className="font-serif text-xl font-semibold">{result.title}</h2><p className="mt-3 whitespace-pre-wrap break-words">{result.description}</p>{result.kind==='post'&&<><p className="mt-2 text-xs">{(result.payload as CommunityPost).author_name}</p><PostMedia post={result.payload as CommunityPost}/>{/^https?:\/\//i.test((result.payload as CommunityPost).external_url||'')&&<a href={(result.payload as CommunityPost).external_url!} target="_blank" rel="noopener noreferrer" className="mt-3 block underline">Ouvrir le lien</a>}</>}{event&&<p className="mt-3">{new Date(event.start_at).toLocaleString('fr-FR')}</p>}</>}<button onClick={()=>onUniverse(result.universe)} className="mt-4 text-sm underline">Ouvrir l’univers associé</button></section></div>
}
