"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import {
  ArrowUpRight,
  PlusCircle,
  BookOpen,
  CalendarDays,
  Beer,
  Clapperboard,
  CookingPot,
  ExternalLink,
  FileText,
  House,
  Music2,
  Newspaper,
  PlayCircle,
  Route,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { siteMeta, type Plaque, type PlaqueLink, type Universe } from "@/src/data/beerRoadData"

const universeIcon: Record<Universe, LucideIcon> = {
  origines: Clapperboard,
  transmission: BookOpen,
  atelier: CookingPot,
  grenier: Music2,
  kerhuon: House,
  legendes: Beer,
  avenir: Route,
}

function LinkButton({ link, onMissing }: { link: PlaqueLink; onMissing: () => void }) {
  const icon = link.kind === "pdf" ? <FileText className="size-4" /> : link.kind === "video" ? <PlayCircle className="size-4" /> : link.kind === "external" ? <ExternalLink className="size-4" /> : <Music2 className="size-4" />
  if (!link.url) {
    return <button type="button" onClick={onMissing} title={`Ajouter une ressource ou un lien pour « ${link.label} »`} className="inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><PlusCircle className="size-4" /><span>Renseigner le lien</span><span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{link.label}</span></button>
  }
  const isInternal = link.url.startsWith("/")
  const openNewTab = !isInternal || link.kind === "pdf"
  return (
    <a href={link.url} target={openNewTab ? "_blank" : undefined} rel={openNewTab ? "noopener noreferrer" : undefined} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      {icon}{link.label}{!isInternal && <ArrowUpRight className="size-3.5" />}
    </a>
  )
}

export function PlaqueModal({
  plaque,
  onClose,
  onContribute,
  onOpenAgenda,
}: {
  plaque: Plaque
  onClose: () => void
  onContribute: (universe: Universe, section?: string) => void
  onOpenAgenda: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const Icon = universeIcon[plaque.universe]
  const { content } = plaque

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="plaque-title" onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card text-card-foreground shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Icon className="size-5" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">{plaque.tagline}</p><h2 id="plaque-title" className="mt-1 font-serif text-2xl font-semibold leading-tight text-pretty sm:text-3xl">{plaque.name}</h2></div>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Fermer" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><X className="size-5" /></button>
        </div>

        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7">
          {content.intro?.map((paragraph, index) => <p key={index} className="leading-relaxed text-muted-foreground">{paragraph}</p>)}

          {content.highlights && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{content.highlights.map((highlight) => <button type="button" key={highlight.label} onClick={() => onContribute(plaque.universe, highlight.label)} className="group rounded-2xl border border-border bg-secondary/50 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="flex items-start justify-between gap-3"><span className="font-semibold">{highlight.label}</span><PlusCircle className="size-4 shrink-0 text-primary opacity-70 transition group-hover:opacity-100" /></span><span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{highlight.description}</span><span className="mt-3 block text-xs font-semibold text-primary">Ajouter un contenu ici ↗</span></button>)}</div>}

          {content.albums?.map((album) => <div key={album.title} className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/40 p-4 sm:flex-row sm:p-5">
            <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-36"><Image src={album.cover || "/placeholder.svg"} alt={`Pochette de ${album.title}`} fill sizes="144px" className="object-cover" /></div>
            <div className="flex min-w-0 flex-col justify-center gap-3"><div><p className="font-serif text-xl font-semibold leading-tight">{album.title}</p>{album.subtitle && <p className="mt-1 text-sm text-muted-foreground">{album.subtitle}</p>}</div>{album.audio && <audio controls preload="none" className="w-full"><source src={album.audio} />Votre navigateur ne supporte pas la lecture audio.</audio>}<div className="flex flex-wrap gap-2">{album.links.map((link) => <LinkButton key={link.label} link={link} onMissing={() => onContribute(plaque.universe, `${album.title} — ${link.label}`)} />)}</div></div>
          </div>)}

          {content.news && <ol className="flex flex-col gap-3">{content.news.map((news, index) => <li key={`${news.title}-${index}`} className="rounded-2xl border border-border bg-secondary/40 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{news.date}</p><p className="mt-1 font-semibold">{news.title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{news.body}</p>{news.pdf && <div className="mt-3"><LinkButton link={{ label: "Lire le livret (PDF)", url: news.pdf, kind: "pdf" }} onMissing={() => onContribute(plaque.universe, news.title)} /></div>}</li>)}</ol>}

          {content.books?.map((book) => <div key={book.title} className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/40 p-4 sm:flex-row"><div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-24">{book.cover ? <Image src={book.cover} alt={`Couverture de ${book.title}`} fill sizes="96px" className="object-cover" /> : <div className="flex h-full items-center justify-center"><BookOpen className="size-9 text-muted-foreground" /></div>}</div><div className="flex flex-col justify-center gap-3"><p className="font-serif text-lg font-semibold">{book.title}</p><p className="text-sm leading-relaxed text-muted-foreground">{book.description}</p>{book.pdf ? <LinkButton link={{ label: "Lire le livre (PDF)", url: book.pdf, kind: "pdf" }} onMissing={() => onContribute(plaque.universe, book.title)} /> : <button type="button" onClick={() => onContribute(plaque.universe, book.title)} className="inline-flex items-center gap-2 self-start rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"><PlusCircle className="size-4" /> Ajouter le lien du livre</button>}</div></div>)}

          {content.video && <div className="flex flex-col gap-3"><div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-secondary/60">{content.video.embedUrl ? <iframe src={content.video.embedUrl} title={content.video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 size-full" /> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center text-muted-foreground"><PlayCircle className="size-10" /><p className="font-medium">{content.video.title}</p><p className="max-w-sm text-sm">{content.video.description || "La vidéo n'est pas intégrée au site ; ouvre son hébergement avec le bouton ci-dessous."}</p>{(() => { const driveVideo = content.links?.find((link) => /film/i.test(link.label) && link.url); return driveVideo?.url ? <a href={driveVideo.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"><ExternalLink className="size-4" /> Ouvrir le dossier du film</a> : <button type="button" onClick={() => onContribute(plaque.universe, content.video?.title || "Vidéo")} className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"><PlusCircle className="size-4" /> Proposer le lien de la vidéo</button> })()}</div>}</div></div>}

          {content.links && <section aria-label="Accès et ressources" className="rounded-2xl border border-border p-4 sm:p-5"><h3 className="font-serif text-xl font-semibold">Accès et ressources</h3><p className="mt-1 mb-4 text-sm leading-relaxed text-muted-foreground">Les ressources déjà reliées s’ouvrent directement. Pour une ressource encore sans URL, clique sur « Ajouter le lien » : le formulaire s’ouvrira sur cette rubrique et tu pourras coller le lien Drive ou la bonne adresse. Pour que le lien devienne un raccourci permanent dans cette fiche, il faudra ensuite le renseigner dans le catalogue éditorial.</p><div className="flex flex-wrap gap-2.5">{siteMeta.driveFolderUrl ? <a href={siteMeta.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"><ExternalLink className="size-4" /> Ouvrir le dossier Beer Road sur Google Drive</a> : <p className="mb-1 w-full text-xs leading-relaxed text-muted-foreground">Le dossier Google Drive commun sera accessible ici dès que son URL de partage sera renseignée dans le catalogue du site.</p>}{content.links.map((link) => <LinkButton key={link.label} link={link} onMissing={() => link.label.toLowerCase().includes("agenda familial") ? onOpenAgenda() : onContribute(plaque.universe, link.label)} />)}</div></section>}

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">À plusieurs, c'est mieux</p><h3 className="mt-1 font-serif text-xl font-semibold">Tu as quelque chose à ajouter à cet univers ?</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Une anecdote, un fichier audio, une photo, une vidéo ou une idée : chaque membre de la famille peut enrichir le patrimoine commun.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onContribute(plaque.universe)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"><Newspaper className="size-4" /> Ajouter au « {plaque.name} »</button>{plaque.universe === "avenir" && <button type="button" onClick={onOpenAgenda} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"><CalendarDays className="size-4" /> Ouvrir l’agenda familial</button>}</div></div>
        </div>
      </div>
    </div>
  )
}
