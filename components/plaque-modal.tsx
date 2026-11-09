"use client"
import { useEffect, useRef, useState } from 'react'
import { BookOpen, CalendarDays, Beer, Clapperboard, CookingPot, Music2, House, Route, X } from 'lucide-react'
import { MediaShelf } from './media/media-shelf'
import { AppCatalog } from './media/app-catalog'
import { SectionPreview } from './community/section-preview'
import { sectionsForUniverse } from './community/shared'
import type { Plaque, Universe } from '@/src/data/beerRoadData'
import { COURSE_RESOURCE } from '@/lib/resource-search'
const icons={origines:Clapperboard,transmission:BookOpen,atelier:CookingPot,grenier:Music2,kerhuon:House,legendes:Beer,avenir:Route}
const button='inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary'
export function PlaqueModal({plaque,connected=false,onClose,onContribute,onViewContributions,onOpenAgenda}:{plaque:Plaque;connected?:boolean;onClose:()=>void;onContribute:(universe:Universe,section?:string)=>void;onViewContributions:(universe:Universe,section:string)=>void;onOpenAgenda:()=>void}) {
 const dialog=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null),closeAction=useRef(onClose)
 closeAction.current=onClose
 const [section,setSection]=useState('Contributions générales'),[recommendation,setRecommendation]=useState('Films qu’on aime')
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow
  close.current?.focus();document.body.style.overflow='hidden'
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();closeAction.current()}
   if(event.key==='Tab'){
    const nodes=Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),select,input,textarea,[tabindex="0"]')||[]).filter(n=>n.getClientRects().length>0)
    const first=nodes[0],last=nodes[nodes.length-1]
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  }
  document.addEventListener('keydown',key)
  return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus()}
 },[])
 const universe=plaque.universe,Icon=icons[universe]
 const connect=()=>onContribute(universe)
 const shelf=(collection:string)=><MediaShelf collection={collection} connected={connected} onConnect={connect}/>
 const preview=(label:string)=><SectionPreview universe={universe} section={label} connected={connected} onMore={()=>onViewContributions(universe,label)}/>
 return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/55 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="presentation">
  <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="plaque-title" onClick={e=>e.stopPropagation()} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
   <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-card/95 px-5 py-4 backdrop-blur">
    <div className="flex items-center gap-3"><Icon aria-hidden="true" className="size-6 shrink-0 text-primary"/><h2 id="plaque-title" className="font-serif text-2xl font-semibold">{plaque.name}</h2></div>
    <button ref={close} type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-2 hover:bg-secondary"><X className="size-5"/></button>
   </header>
   <div className="space-y-5 p-5 sm:p-6">
    {plaque.content.intro?.[0]&&<p className="text-sm text-muted-foreground">{plaque.content.intro[0]}</p>}
    <div data-section="contents" className="space-y-4">
     {universe==='origines'&&<><section aria-label="La médiathèque"><h3 className="font-serif text-xl font-semibold">La médiathèque</h3>{shelf('origines')}</section><section className="rounded-2xl border p-4"><h3 className="font-semibold">Beer Road — livret et paroles</h3><div className="mt-3 flex flex-wrap gap-2">{plaque.content.albums?.flatMap(a=>a.links).filter(l=>l.url).map(l=><a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className={button}>{l.label}</a>)}</div></section></>}
     {universe==='transmission'&&([['lettres-filles','Lettres à mes filles'],['lettres-gendres','Lettres à mes gendres'],['podcasts','Les podcasts']] as const).map(([key,title])=><section key={key} className="rounded-2xl border p-4"><h3 className="font-serif text-xl font-semibold">{title}</h3>{shelf(key)}</section>)}
     {universe==='atelier'&&<><AppCatalog connected={connected}/><MediaShelf collection="atelier" connected={connected} onConnect={connect} hideWhenEmpty/></>}
     {universe==='grenier'&&<><div className="flex flex-wrap gap-2">{plaque.content.links?.map(l=><a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className={button}>{l.label}</a>)}</div><MediaShelf collection="grenier" connected={connected} onConnect={connect} hideWhenEmpty/></>}
     {universe==='kerhuon'&&<section><h3 className="font-serif text-xl font-semibold">Guides de la maison</h3>{shelf('kerhuon')}</section>}
     {universe==='legendes'&&<><section className="rounded-2xl border p-4"><h3 className="font-serif text-xl font-semibold">Films et podcasts qu’on aime</h3><div className="mt-3 flex gap-2" role="group" aria-label="Type de recommandation">{['Films qu’on aime','Podcasts qu’on aime'].map((value,i)=><button key={value} type="button" aria-pressed={recommendation===value} onClick={()=>setRecommendation(value)} className={`${button} ${recommendation===value?'bg-secondary':''}`}>{i===0?'Films':'Podcasts'}</button>)}</div>{preview(recommendation)}</section><section className="rounded-2xl border p-4"><h3 className="font-serif text-xl font-semibold">La boîte à anecdotes</h3><MediaShelf collection="legendes" connected={connected} onConnect={connect} hideWhenEmpty/>{preview('La boîte à anecdotes')}</section></>}
     {universe==='avenir'&&<><a href={COURSE_RESOURCE.href} className={`${button} gap-2 bg-primary text-primary-foreground`}>⛵ {COURSE_RESOURCE.title}</a><button type="button" onClick={onOpenAgenda} className={`${button} gap-2`}><CalendarDays className="size-4"/>Ouvrir l’agenda familial</button><section className="rounded-2xl border p-4"><h3 className="font-serif text-xl font-semibold">Projets communs</h3><MediaShelf collection="avenir" connected={connected} onConnect={connect} hideWhenEmpty/>{preview('Projets communs')}</section></>}
    </div>
    <section data-section="contributions" className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
     <h3 className="font-serif text-xl font-semibold">À plusieurs, c’est mieux</h3>
     <p className="mt-1 text-sm text-muted-foreground">Partage une idée, un commentaire ou un souvenir.</p>
     <label className="mt-3 block text-sm" htmlFor="contribution-section">À propos de</label>
     <select id="contribution-section" value={section} onChange={e=>setSection(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-2 text-sm">{sectionsForUniverse(universe).map(s=><option key={s}>{s}</option>)}</select>
     <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>onContribute(universe,section)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Ajouter une contribution</button><button type="button" onClick={()=>onViewContributions(universe,section==='Contributions générales'?'all':section)} className={button}>Voir les contributions</button></div>
    </section>
   </div>
  </div>
 </div>
}
