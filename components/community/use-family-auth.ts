"use client"
import {
  restoreFamilySession,
  subscribeFamilySession,
  FAMILY_SESSION_KEY,
  FAMILY_SIGNED_OUT_EVENT,
  clearFamilySession,
  getFamilyMember,
  isSupabaseConfigured,
  readFamilySession,
  type FamilyMember,
  type FamilySession,
} from "@/lib/family-api"
import { useCallback, useEffect, useRef, useState } from "react"

export function useFamilyAuth() {
  const configured = isSupabaseConfigured()
  const [session, setSession] = useState<FamilySession | null>(null)
  const [member, setMember] = useState<FamilyMember | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const signOut = useCallback(async () => {
    setChecking(true)
    setSession(null)
    setMember(null)
    setError("")
    try {
      await clearFamilySession()
    } catch {
      setError("Déconnexion locale effectuée. Le serveur est momentanément indisponible.")
    } finally {
      setChecking(false)
    }
  }, [])
  const checkSession = useCallback(() => {
    if (!readFamilySession()) {
      setSession(null)
      setMember(null)
      setError("Ta connexion a expiré. Reconnecte-toi par e-mail.")
    }
  }, [])
  useEffect(() => {
    if (!configured) return
    const clearView = () => {
      setSession(null)
      setMember(null)
    }
    let unsubscribe = () => {}
    try {
      unsubscribe = subscribeFamilySession((event, next) => {
        // Pas d'appel asynchrone au SDK depuis son callback.
        if (event === "SIGNED_OUT") {
          clearView()
          return
        }
        if (event === "INITIAL_SESSION") return
        if (
          next &&
          sessionRef.current?.user.id === next.user.id &&
          sessionRef.current.user.email === next.user.email
        ) {
          setSession(next)
        } else if (next) {
          clearView()
          setAttempt((value) => value + 1)
        }
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connexion impossible.")
      setChecking(false)
    }
    window.addEventListener(FAMILY_SIGNED_OUT_EVENT, clearView)
    return () => {
      unsubscribe()
      window.removeEventListener(FAMILY_SIGNED_OUT_EVENT, clearView)
    }
  }, [configured])
  useEffect(() => {
    let active = true
    setChecking(true)
    setError("")
    async function restore() {
      try {
        if (!configured) return
        const saved = await restoreFamilySession()
        if (!saved || !active) return
        const profile = await getFamilyMember(saved.user.email)
        if (!active) return
        if (!profile) {
          await clearFamilySession()
          throw new Error(
            "Cette adresse n'est pas autorisée. Demande son ajout à la liste familiale.",
          )
        }
        setSession(readFamilySession() || saved)
        setMember(profile)
      } catch (cause) {
        if (active) {
          setSession(null)
          setMember(null)
          setError(cause instanceof Error ? cause.message : "Connexion impossible.")
        }
      } finally {
        if (active) setChecking(false)
      }
    }
    void restore()
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAMILY_SESSION_KEY || event.key === null) {
        setSession(null)
        setMember(null)
        setAttempt((value) => value + 1)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => {
      active = false
      window.removeEventListener("storage", onStorage)
    }
  }, [configured, attempt])
  return {
    configured,
    session,
    member,
    checking,
    error,
    signOut,
    checkSession,
    retry: () => setAttempt((value) => value + 1),
  }
}
