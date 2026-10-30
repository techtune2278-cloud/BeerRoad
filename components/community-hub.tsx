"use client"
import { useEffect, useState } from "react"
import { AuthPanel } from "./community/auth-panel"
import { EventsPanel } from "./community/events-panel"
import { PostsPanel } from "./community/posts-panel"
import type { AuthStatus, ContributionRequest, HubTab } from "./community/shared"
import { useFamilyAuth } from "./community/use-family-auth"

export function CommunityHub({
  contributionRequest,
  onAuthStatusChange,
}: {
  contributionRequest: ContributionRequest
  onAuthStatusChange?: (status: AuthStatus) => void
}) {
  const auth = useFamilyAuth()
  const [tab, setTab] = useState<HubTab>("carnet")
  useEffect(() => {
    const status: AuthStatus = auth.checking
      ? { status: "checking", label: "Vérification de la connexion…" }
      : auth.session && auth.member
        ? {
            status: "connected",
            label: `${auth.member.display_name} connecté`,
            email: auth.session.user.email,
          }
        : {
            status: "disconnected",
            label: !auth.configured
              ? "Espace familial non configuré"
              : auth.error
                ? "Connexion à vérifier — voir le carnet"
                : "Pas de membre connecté dans ce navigateur.",
          }
    onAuthStatusChange?.(status)
  }, [auth.checking, auth.session, auth.member, auth.configured, auth.error, onAuthStatusChange])
  useEffect(() => {
    if (!contributionRequest.nonce) return
    setTab(contributionRequest.target === "agenda" ? "agenda" : "carnet")
    const frame = requestAnimationFrame(() =>
      document.getElementById("carnet")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    )
    return () => cancelAnimationFrame(frame)
  }, [contributionRequest])
  return (
    <section
      id="carnet"
      className="scroll-mt-6 rounded-[2rem] border border-border bg-card/90 p-4 shadow-sm sm:p-8"
    >
      <h2 className="font-serif text-3xl font-semibold">Le carnet vivant de la tribu</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Nos souvenirs, nos créations et les prochains rendez-vous.
      </p>
      <div className="mt-4 flex gap-2" role="group" aria-label="Choisir une vue">
        {(["carnet", "agenda"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === value ? "bg-primary text-primary-foreground" : "border border-border"}`}
          >
            {value === "carnet" ? "Carnet" : "Agenda"}
          </button>
        ))}
      </div>
      {!auth.configured ? (
        <p className="mt-5 rounded-xl bg-secondary p-4 text-sm">
          L’espace familial n’est pas encore configuré. Contacte l’administrateur du site.
        </p>
      ) : auth.checking ? (
        <p role="status" className="mt-5 text-sm">
          Vérification de la connexion…
        </p>
      ) : auth.session && auth.member ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary/5 p-3">
            <p className="text-sm">
              Bonjour <strong>{auth.member.display_name}</strong> !
            </p>
            <button type="button" onClick={auth.signOut} className="text-xs underline">
              Déconnexion
            </button>
          </div>
          <div hidden={tab !== "carnet"}>
            <PostsPanel
              key={`posts-${auth.session.user.id}`}
              enabled={tab === "carnet"}
              session={auth.session}
              member={auth.member}
              contributionRequest={contributionRequest}
              onSessionError={auth.checkSession}
            />
          </div>
          <div hidden={tab !== "agenda"}>
            <EventsPanel
              key={`events-${auth.session.user.id}`}
              enabled={tab === "agenda"}
              session={auth.session}
              member={auth.member}
              onSessionError={auth.checkSession}
            />
          </div>
        </>
      ) : (
        <>
          {auth.error && (
            <div role="alert" className="mt-4 text-sm text-destructive">
              {auth.error}{" "}
              <button type="button" onClick={auth.retry} className="underline">
                Réessayer la connexion enregistrée
              </button>
            </div>
          )}
          <AuthPanel />
        </>
      )}
    </section>
  )
}
