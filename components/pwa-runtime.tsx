"use client"

import { useEffect } from "react"

export function PwaRuntime() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    let cancelled = false
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return
        // Recherche une nouvelle version du worker à chaque chargement de l'application.
        void registration.update().catch(() => undefined)
      })
      .catch(() => {
        // Le site reste utilisable comme site web si l'enregistrement PWA échoue.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
