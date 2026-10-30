"use client"
import { sendMagicLink } from "@/lib/family-api"
import { useState } from "react"
export function AuthPanel() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  async function send() {
    setBusy(true)
    setError("")
    try {
      await sendMagicLink(email)
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Envoi impossible.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mt-5 max-w-lg rounded-2xl bg-secondary/50 p-5">
      <h3 className="font-semibold">Entrer dans l’espace familial</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Reçois un lien par e-mail pour consulter le carnet et l’agenda. Ton navigateur conservera ta
        connexion.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {sent ? (
        <div className="mt-4 space-y-3">
          <p role="status">
            Le lien a été envoyé à <strong>{email}</strong>. Ouvre-le dans ce navigateur. Pense à
            vérifier les indésirables.
          </p>
          <button type="button" onClick={() => setSent(false)} className="text-sm underline">
            Revenir au formulaire
          </button>
        </div>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <label htmlFor="family-email" className="block text-sm font-medium">
            Ton adresse e-mail familiale
          </label>
          <input
            id="family-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3"
          />
          <button
            disabled={busy}
            className="w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
        </form>
      )}
    </div>
  )
}
