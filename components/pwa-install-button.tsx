"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Download, Share, Smartphone, X } from "lucide-react"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}
type Platform = "ios" | "android" | "desktop"

export function PwaInstallButton() {
  const deferredPrompt = useRef<InstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [platform, setPlatform] = useState<Platform>("desktop")
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ""
    const isAppleMobile = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setPlatform(isAppleMobile ? "ios" : /Android/i.test(ua) ? "android" : "desktop")

    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setIsInstalled(standalone)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPrompt.current = event as InstallPromptEvent
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setShowHelp(false)
      deferredPrompt.current = null
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (isInstalled) {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-600/10 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="size-3.5" aria-hidden="true" /> Application installée</span>
  }

  const handleInstall = async () => {
    const promptEvent = deferredPrompt.current
    if (!promptEvent) {
      setShowHelp(true)
      return
    }
    setInstalling(true)
    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      deferredPrompt.current = null
      if (choice.outcome === "dismissed") setShowHelp(true)
    } catch {
      setShowHelp(true)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleInstall} disabled={installing} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-card/90 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-secondary disabled:opacity-60" aria-label="Installer La Beer Road sur cet appareil">
        <Download className="size-4" aria-hidden="true" />
        <span>{installing ? "Ouverture…" : "Installer l'app"}</span>
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" className="w-full max-w-md rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Smartphone className="size-5" /></span><div><h2 id="pwa-install-title" className="font-serif text-xl font-semibold">Installer La Beer Road</h2><p className="mt-0.5 text-xs text-muted-foreground">L'ajouter à l'écran d'accueil</p></div></div>
              <button type="button" onClick={() => setShowHelp(false)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary" aria-label="Fermer"><X className="size-4" /></button>
            </div>

            {platform === "ios" ? (
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
                <li>Ouvre cette page dans <strong>Safari</strong> (pas dans le navigateur intégré d'une autre application).</li>
                <li>Appuie sur le bouton <strong>Partager</strong> <Share className="inline size-4 align-text-bottom" />.</li>
                <li>Choisis <strong>Sur l'écran d'accueil</strong>, puis appuie sur <strong>Ajouter</strong>.</li>
              </ol>
            ) : platform === "android" ? (
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
                <li>Ouvre La Beer Road dans <strong>Chrome</strong>.</li>
                <li>Ouvre le menu <strong>⋮</strong> en haut à droite.</li>
                <li>Choisis <strong>Installer l'application</strong> ou <strong>Ajouter à l'écran d'accueil</strong>.</li>
              </ol>
            ) : (
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
                <li>Ouvre La Beer Road dans <strong>Chrome ou Edge</strong>.</li>
                <li>Utilise l'icône d'installation dans la barre d'adresse, ou le menu du navigateur.</li>
                <li>Choisis <strong>Installer La Beer Road</strong>, puis confirme.</li>
              </ol>
            )}
            <p className="mt-4 rounded-2xl bg-secondary/70 p-3 text-xs leading-relaxed text-muted-foreground">L'installation ajoute une icône et ouvre l'application dans sa propre fenêtre. Une connexion Internet reste nécessaire pour la connexion familiale, les contributions et l'agenda.</p>
            <button type="button" onClick={() => setShowHelp(false)} className="mt-4 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Compris</button>
          </section>
        </div>
      )}
    </>
  )
}
