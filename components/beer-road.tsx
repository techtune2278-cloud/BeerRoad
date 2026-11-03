"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { ResourceSearch, SearchResultDialog } from "./resource-search"
import { matchesSearch, plaqueSearchText, type ResourceResult } from "@/lib/resource-search"
import { SITE_VERSION } from "@/lib/version"
import {
  ArrowDown,
  CalendarDays,
  Compass,
  Footprints,
  CircleUserRound,
  LoaderCircle,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react"
import { plaques, siteMeta, type Plaque, type Universe } from "@/src/data/beerRoadData"
import { PlaqueModal } from "@/components/plaque-modal"
import { PwaInstallButton } from "@/components/pwa-install-button"
import { CommunityHub } from "@/components/community-hub"

type AuthStatus = { status: "checking" | "connected" | "disconnected"; label: string; email?: string }



export function BeerRoad() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ status: "checking", label: "Vérification de la connexion…" })
  const handleAuthStatusChange = useCallback((nextStatus: AuthStatus) => {
    setAuthStatus(nextStatus)
  }, [])
  const [active, setActive] = useState<Plaque | null>(null)
  const [searchResult,setSearchResult]=useState<(ResourceResult & {viewer?:string})|null>(null)
  useEffect(()=>{setSearchResult(null)},[authStatus.email,authStatus.status])
  const [query, setQuery] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [communityRequest, setCommunityRequest] = useState<{ universe: Universe; section: string; target: "carnet" | "agenda" | "feed"; nonce: number }>({ universe: "legendes", section: "Contributions générales", target: "carnet", nonce: 0 })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const trimmedQuery = query.trim().toLocaleLowerCase("fr-FR")
  const matches = useMemo(() => trimmedQuery ? plaques.filter((plaque) => matchesSearch(plaqueSearchText(plaque),trimmedQuery)) : [], [trimmedQuery])
  const matchIds = useMemo(() => new Set(matches.map((plaque) => plaque.id)), [matches])
  const handleOpenPlaque = (plaque: Plaque) => {
    setActive(plaque)
  }

  const handleContribute = (universe: Universe, section = "Contributions générales") => {
    setCommunityRequest((previous) => ({ universe, section, target: "carnet", nonce: previous.nonce + 1 }))
    setActive(null)
  }

  const handleOpenAgenda = () => {
    setCommunityRequest((previous) => ({ universe: "avenir", section: "Agenda familial", target: "agenda", nonce: previous.nonce + 1 }))
    setActive(null)
  }

  const handleViewContributions = (universe: Universe, section: string) => {
    setCommunityRequest((previous) => ({ universe, section, target: "feed", nonce: previous.nonce + 1 }))
    setActive(null)
  }

  const toggleAudio = async () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <audio ref={audioRef} src="/ambiance.mp3" loop />

      <header className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-semibold text-muted-foreground">{SITE_VERSION}</span>
            <span role="status" aria-live="polite" className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${authStatus.status === "connected" ? "border-emerald-600/25 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300" : "border-border bg-card/90 text-muted-foreground"}`}>
              {authStatus.status === "checking" ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <CircleUserRound className="size-3.5" aria-hidden="true" />}
              <span>{authStatus.label}</span>
              {authStatus.status === "connected" && authStatus.email && <span className="hidden md:inline font-normal">· {authStatus.email}</span>}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={toggleAudio} title={isPlaying ? "Couper l'ambiance" : "Écouter l'ambiance de la Beer Road"} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {isPlaying ? <Volume2 className="size-4 animate-pulse text-primary" /> : <VolumeX className="size-4 text-muted-foreground" />}
            <span className="hidden sm:inline">{isPlaying ? "Ambiance ON" : "Ambiance"}</span>
          </button>
          <PwaInstallButton />
          <button type="button" onClick={handleOpenAgenda} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-secondary"><CalendarDays className="size-4" /> Agenda familial</button>
          <button type="button" onClick={() => handleContribute("legendes")} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"><Footprints className="size-4" /> Participer</button>
          </div>
        </div>

        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><Compass className="size-3.5" /> Le patrimoine commun de la tribu</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{siteMeta.title} <span aria-hidden="true">{siteMeta.emojiTitle}</span></h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Une route bien réelle à Ker Huon, mais une aventure qui va beaucoup plus loin. Sept empreintes, sept univers pour partager nos créations, nos idées et les projets qui nous rassemblent.</p>

        <div className="relative mt-1 w-full max-w-xl">
          <label htmlFor="beer-road-search" className="sr-only">Rechercher dans tous les contenus</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="beer-road-search" type="search" maxLength={160} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={siteMeta.searchPlaceholder} className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15" />
          {trimmedQuery && <ResourceSearch key={authStatus.email || authStatus.status} query={query} connected={authStatus.status === "connected"} matches={matches} onUniverse={p=>{handleOpenPlaque(p);setQuery("")}} onResult={result=>{setSearchResult({...result,viewer:authStatus.email});setQuery("")}}/>}
        </div>
      </header>

      <section className="mx-auto mt-8 grid max-w-6xl items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:gap-8" aria-label="Les sept univers de la Beer Road">
        <div className="mx-auto w-full max-w-[650px]">
          <div className="mb-3 flex items-center justify-between gap-3 px-1"><div><p className="font-serif text-xl font-semibold">Le chemin des sept pas</p><p className="mt-0.5 text-xs text-muted-foreground">Clique sur une empreinte pour ouvrir son univers.</p></div></div>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-border bg-muted shadow-xl">
            <Image src={siteMeta.heroImage} alt="Les empreintes du chemin de la Beer Road dans le jardin de Ker Huon" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="select-none object-cover" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/5 via-transparent to-foreground/10" />
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">{plaques.map((p,i)=><line key={p.id} x1={p.position.x+p.position.width/2} y1={p.position.y} x2="53" y2={84-i*12.5} stroke="white" strokeWidth="0.45"/>)}</svg>
            {plaques.map((plaque, index) => {
              const dimmed = false
              const highlighted = trimmedQuery.length > 0 && matchIds.has(plaque.id)
              return <button key={plaque.id} onClick={() => handleOpenPlaque(plaque)} aria-label={`${plaque.name} — ${plaque.tagline}`} className="group absolute rounded-xl outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary" style={{ left: `${plaque.position.x}%`, top: `${plaque.position.y}%`, width: `${plaque.position.width}%`, height: `${plaque.position.height}%`, transform: `translate(-50%, -50%) rotate(${plaque.position.rotate ?? 0}deg)`, opacity: dimmed ? 0.38 : 1 }}>
                <span aria-hidden="true" className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 ${highlighted ? "border-accent shadow-[0_0_0_4px_var(--color-accent)] opacity-100" : "border-accent opacity-0 shadow-[0_0_18px_2px_var(--color-accent)] group-hover:opacity-100 group-focus-visible:opacity-100"}`} />
                <span className={`pointer-events-none absolute -right-1 -top-2 flex size-6 items-center justify-center rounded-full border border-background bg-card/90 text-foreground text-[10px] font-bold shadow-sm transition-opacity ${highlighted ? "bg-accent text-accent-foreground opacity-100" : "opacity-100"}`}>{index + 1}</span>

              </button>
            })}
            {plaques.map((p,i)=><button key={`label-${p.id}`} type="button" onClick={()=>handleOpenPlaque(p)} aria-label={`Ouvrir ${p.name}`} style={{left:'53%',top:`${84-i*12.5}%`,width:'44%',transform:'translateY(-50%)'}} className="absolute z-10 rounded-xl border border-white/60 bg-card/95 px-2 py-2 text-left text-[11px] font-semibold leading-tight text-foreground shadow-md sm:text-sm"><span className="mr-1 text-primary">{i+1}.</span>{p.name}</button>)}
          </div>
          <p className="mt-3 flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground"><ArrowDown className="mt-0.5 size-4 shrink-0 text-primary" /> Le chemin se trouve à Ker Huon ; les univers, eux, voyagent partout où la famille se retrouve.</p>
        </div>

        <div className="lg:sticky lg:top-6">
          <div className="mb-3"><p className="font-serif text-xl font-semibold">Choisir son passage</p><p className="mt-0.5 text-xs text-muted-foreground">Des noms un peu mystérieux, des contenus bien concrets.</p></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {plaques.map((plaque, index) => {
              const highlighted = trimmedQuery.length > 0 && matchIds.has(plaque.id)
              return <button key={plaque.id} onClick={() => handleOpenPlaque(plaque)} className={`group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${highlighted ? "border-accent bg-accent/10" : "border-border bg-card/80 hover:border-primary/35 hover:bg-card"}`}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl transition-colors group-hover:bg-primary/10">{plaque.emoji}</span>
                <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-serif text-base font-semibold leading-tight">{plaque.name}</span></span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{plaque.tagline}</span></span>
                <span className="pt-1 text-xs font-semibold text-muted-foreground">0{index + 1}</span>
              </button>
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="font-serif text-lg font-semibold">Un patrimoine vivant, pas un musée fermé</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Chaque membre pourra enrichir les univers avec des textes, anecdotes, photos, vidéos, MP3 et rendez-vous familiaux.</p><a href="#carnet" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">Ouvrir le carnet vivant <ArrowDown className="size-4" /></a></div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl" aria-label="Participation familiale">
        <CommunityHub contributionRequest={communityRequest} onAuthStatusChange={handleAuthStatusChange} />
      </section>

      <footer className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border px-1 pt-5 text-center sm:flex-row sm:text-left">
        <p className="text-xs leading-relaxed text-muted-foreground">La Beer Road · Ker Huon, Runan · Un chemin qui se prolonge de génération en génération.</p>
      </footer>

      {searchResult && searchResult.viewer === authStatus.email && authStatus.status === "connected" && <SearchResultDialog result={searchResult} onClose={()=>setSearchResult(null)} onUniverse={universe=>{setSearchResult(null);setActive(plaques.find(p=>p.universe===universe)||null)}}/>}
      {active && <PlaqueModal key={`${active.id}-${authStatus.email || authStatus.status}`} connected={authStatus.status === "connected"} plaque={active} onClose={() => setActive(null)} onContribute={handleContribute} onViewContributions={handleViewContributions} onOpenAgenda={handleOpenAgenda} />}
    </main>
  )
}
