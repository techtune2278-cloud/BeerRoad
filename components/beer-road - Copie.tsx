"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search } from "lucide-react"
import { plaques, siteMeta, type Plaque } from "@/src/data/beerRoadData"
import { PlaqueModal } from "@/components/plaque-modal"

function searchText(p: Plaque) {
  const parts = [p.name, p.tagline, p.universe]
  if (p.content.intro) parts.push(...p.content.intro)
  if (p.content.albums) parts.push(...p.content.albums.map((a) => a.title))
  if (p.content.books) parts.push(...p.content.books.map((b) => b.title))
  if (p.content.highlights) parts.push(...p.content.highlights.map((h) => h.label))
  return parts.join(" ").toLowerCase()
}

export function BeerRoad() {
  const [active, setActive] = useState<Plaque | null>(null)
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q) return []
    return plaques.filter((p) => searchText(p).includes(q))
  }, [q])
  const matchIds = new Set(matches.map((m) => m.id))

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-16 pt-8 sm:px-6">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {siteMeta.title}{" "}
          <span aria-hidden="true">{siteMeta.emojiTitle}</span>
        </h1>
        <p className="max-w-xl leading-relaxed text-muted-foreground text-pretty">
          {siteMeta.welcome}
        </p>

        {/* Global search */}
        <div className="relative w-full max-w-md">
          <label htmlFor="beer-road-search" className="sr-only">
            {siteMeta.searchPlaceholder}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="beer-road-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={siteMeta.searchPlaceholder}
            className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
          />

          {q && (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-popover text-left shadow-xl">
              {matches.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Aucun résultat…</p>
              ) : (
                <ul>
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button
                        onClick={() => {
                          setActive(m)
                          setQuery("")
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary"
                      >
                        <span aria-hidden="true" className="text-lg">
                          {m.emoji}
                        </span>
                        <span>
                          <span className="block font-medium">{m.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {m.tagline}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Interactive photo */}
      <section
        aria-label="Le chemin de la Beer Road — cliquez sur une empreinte"
        className="relative mx-auto mt-8 w-full overflow-hidden rounded-3xl border border-border shadow-lg"
      >
        <Image
          src={siteMeta.heroImage || "/placeholder.svg"}
          alt="Le chemin de plaques de ciment marquées d'empreintes de pieds, traversant un jardin en pente vers un hamac."
          width={1500}
          height={2000}
          priority
          className="h-auto w-full select-none"
        />

        {/* subtle overlay for legibility of hotspots */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-foreground/5" />

        {plaques.map((p) => {
          const dimmed = q.length > 0 && !matchIds.has(p.id)
          const highlighted = q.length > 0 && matchIds.has(p.id)
          return (
            <button
              key={p.id}
              onClick={() => setActive(p)}
              aria-label={`${p.name} — ${p.tagline}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                left: `${p.position.x}%`,
                top: `${p.position.y}%`,
                width: `${p.position.width}%`,
                height: `${p.position.height}%`,
                transform: `translate(-50%, -50%) rotate(${p.position.rotate ?? 0}deg)`,
                opacity: dimmed ? 0.35 : 1,
              }}
            >
              {/* glowing outline */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-2xl border-2 transition-all duration-300 ${
                  highlighted
                    ? "border-accent shadow-[0_0_0_4px_var(--color-accent)] opacity-100"
                    : "border-accent/90 opacity-0 shadow-[0_0_18px_2px_var(--color-accent)] group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              />
              {/* badge */}
              <span
                className={`pointer-events-none absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-[115%] items-center gap-1 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md transition-all duration-200 ${
                  highlighted
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                }`}
              >
                <span aria-hidden="true">{p.emoji}</span>
                {p.name}
              </span>
            </button>
          )
        })}
      </section>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Survolez ou touchez une empreinte pour découvrir son univers.
      </p>

      {active && <PlaqueModal plaque={active} onClose={() => setActive(null)} />}
    </main>
  )
}
