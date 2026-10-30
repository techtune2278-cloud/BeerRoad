"use client"

import {
  createFamilyEvent,
  deleteFamilyEvent,
  formatDateTime,
  listFamilyEvents,
  updateFamilyEvent,
  type FamilyEvent,
  type FamilyMember,
  type FamilySession,
} from "@/lib/family-api"
import { CalendarDays, MapPin, Pencil, Trash2, X } from "lucide-react"
import type { FormEvent } from "react"
import { useCallback, useEffect, useRef, useState } from "react"

import { eventTypeName, eventTypeOptions, type EventType } from "./shared"
type Props = {
  session: FamilySession
  member: FamilyMember
  enabled: boolean
  onSessionError: () => void
}
export function EventsPanel({ session, member, enabled, onSessionError }: Props) {
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const generation = useRef(0)
  const [activated, setActivated] = useState(enabled)
  useEffect(() => {
    if (enabled) setActivated(true)
  }, [enabled])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("12:00")
  const [eventLocation, setEventLocation] = useState("Ker Huon")
  const [eventDetails, setEventDetails] = useState("")
  const [eventType, setEventType] = useState<EventType>("sejour")

  const load = useCallback(async () => {
    const ticket = ++generation.current
    setFetching(true)
    setError("")
    try {
      const rows = await listFamilyEvents()
      if (ticket === generation.current) setEvents(rows)
    } catch (cause) {
      if (ticket !== generation.current) return
      onSessionError()
      setError(cause instanceof Error ? cause.message : "Chargement impossible.")
    } finally {
      if (ticket === generation.current) setFetching(false)
    }
  }, [onSessionError])
  useEffect(() => {
    if (!activated) return
    void load()
    return () => {
      generation.current++
    }
  }, [activated, load])
  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !member) return
    setError("")
    setNotice("")
    setLoading(true)
    try {
      if (!eventTitle.trim() || !eventDate || !eventTime)
        throw new Error("Indique au moins un titre, une date et une heure.")
      const startAt = new Date(`${eventDate}T${eventTime}`).toISOString()
      const eventInput = {
        title: eventTitle,
        details: eventDetails,
        startAt,
        location: eventLocation,
        eventType,
      }
      if (editingEventId) {
        const updated = await updateFamilyEvent(editingEventId, eventInput)
        setEvents((current) =>
          current
            .map((item) => (item.id === updated.id ? updated : item))
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
        )
        setNotice("Rendez-vous mis à jour dans l'agenda familial.")
      } else {
        const created = await createFamilyEvent({
          authorEmail: session.user.email,
          authorName: member.display_name,
          ...eventInput,
        })
        setEvents((current) =>
          [...current, created].sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
          ),
        )
        setNotice("Rendez-vous ajouté à l'agenda familial.")
      }
      resetEventForm()
      setFormOpen(false)
    } catch (err) {
      onSessionError()
      setError(err instanceof Error ? err.message : "Le rendez-vous n'a pas pu être ajouté.")
    } finally {
      setLoading(false)
    }
  }

  function resetEventForm() {
    setEditingEventId(null)
    setEventTitle("")
    setEventDate("")
    setEventTime("12:00")
    setEventLocation("Ker Huon")
    setEventType("sejour")
    setEventDetails("")
  }

  function beginEditEvent(item: FamilyEvent) {
    const start = new Date(item.start_at)
    const pad = (value: number) => String(value).padStart(2, "0")
    setFormOpen(true)
    setEditingEventId(item.id)
    setEventTitle(item.title)
    setEventDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`)
    setEventTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`)
    setEventLocation(item.location || "")
    setEventDetails(item.details || "")
    setEventType(item.event_type || "autre")
    setError("")
    setNotice(`Modification du rendez-vous « ${item.title} ».`)
    window.requestAnimationFrame(() =>
      document
        .getElementById("event-title")
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    )
  }

  async function handleDeleteEvent(item: FamilyEvent) {
    if (!window.confirm(`Supprimer le rendez-vous « ${item.title} » de l'agenda familial ?`)) return
    setError("")
    setNotice("")
    setLoading(true)
    try {
      await deleteFamilyEvent(item.id)
      setEvents((current) => current.filter((event) => event.id !== item.id))
      if (editingEventId === item.id) resetEventForm()
      setNotice("Rendez-vous supprimé de l'agenda familial.")
    } catch (err) {
      onSessionError()
      setError(err instanceof Error ? err.message : "Le rendez-vous n'a pas pu être supprimé.")
    } finally {
      setLoading(false)
    }
  }

  const visibleEvents = events

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => setFormOpen((value) => !value)}
          aria-expanded={formOpen}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {formOpen ? "Fermer le formulaire" : "Ajouter un rendez-vous"}
        </button>
        <button
          type="button"
          disabled={fetching || loading}
          onClick={() => void load()}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          {fetching ? "Chargement…" : "Actualiser"}
        </button>
      </div>
      {notice && (
        <p role="status" className="mt-3 text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div id="agenda-panel" className="scroll-mt-6 mt-5 space-y-5">
        {formOpen && (
          <form
            onSubmit={handleCreateEvent}
            className="self-start rounded-2xl border border-border bg-background p-5"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
                <CalendarDays className="size-4 text-primary" />
              </span>
              <h3 className="font-semibold">
                {editingEventId ? "Modifier un rendez-vous" : "Ajouter un rendez-vous"}
              </h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Un séjour, un anniversaire, un chantier ou une idée de retrouvailles.
            </p>
            <label htmlFor="event-title" className="mt-4 block text-sm font-medium">
              Nom du rendez-vous
            </label>
            <input
              id="event-title"
              required
              maxLength={140}
              value={eventTitle}
              onChange={(event) => setEventTitle(event.target.value)}
              placeholder="Week-end Beer Road"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="event-date" className="block text-sm font-medium">
                  Date
                </label>
                <input
                  id="event-date"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="event-time" className="block text-sm font-medium">
                  Heure
                </label>
                <input
                  id="event-time"
                  type="time"
                  required
                  value={eventTime}
                  onChange={(event) => setEventTime(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <label htmlFor="event-type" className="mt-4 block text-sm font-medium">
              Type de rendez-vous
            </label>
            <select
              id="event-type"
              value={eventType}
              onChange={(event) => setEventType(event.target.value as EventType)}
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {eventTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label htmlFor="event-location" className="mt-4 block text-sm font-medium">
              Lieu
            </label>
            <input
              id="event-location"
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
              placeholder="Ker Huon, chez l'un de nous…"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <label htmlFor="event-details" className="mt-4 block text-sm font-medium">
              Précisions
            </label>
            <textarea
              id="event-details"
              rows={3}
              value={eventDetails}
              onChange={(event) => setEventDetails(event.target.value)}
              placeholder="Qui vient, quoi prévoir, idées d'activités…"
              className="mt-1.5 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarDays className="size-4" />
              {loading
                ? "Enregistrement…"
                : editingEventId
                  ? "Enregistrer les modifications"
                  : "Ajouter à l'agenda"}
            </button>
            {editingEventId && (
              <button
                type="button"
                onClick={() => {
                  resetEventForm()
                  setNotice("")
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                <X className="size-4" />
                Annuler la modification
              </button>
            )}
          </form>
        )}
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl font-semibold">Les prochains rendez-vous</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                L'agenda commun, mis à jour par la famille.
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
              {visibleEvents.length} événement{visibleEvents.length > 1 ? "s" : ""}
            </span>
          </div>
          {fetching && events.length === 0 ? (
            <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
              Chargement de l'agenda…
            </p>
          ) : error && events.length === 0 ? null : visibleEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <CalendarDays className="mx-auto size-8 text-primary" />
              <h4 className="mt-3 font-semibold">Le calendrier est encore vierge</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Propose le prochain rendez-vous familial pour lancer le mouvement.
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {visibleEvents.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border bg-background p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-28 rounded-xl bg-secondary p-3 text-center">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
                          new Date(item.start_at),
                        )}
                      </span>
                      <span className="mt-1 block font-serif text-3xl font-semibold">
                        {new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(
                          new Date(item.start_at),
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(
                          new Date(item.start_at),
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif text-xl font-semibold">{item.title}</h4>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                          {eventTypeName(item.event_type || "autre")}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="size-4" />
                        {formatDateTime(item.start_at)}
                      </p>
                      {item.location && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="size-4" />
                          {item.location}
                        </p>
                      )}
                      {item.details && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {item.details}
                        </p>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">
                        Proposé par {item.author_name}
                      </p>
                      {item.author_email.toLowerCase() === session.user.email.toLowerCase() && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => beginEditEvent(item)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                          >
                            <Pencil className="size-3.5" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => void handleDeleteEvent(item)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Astuce : un rendez-vous peut aussi devenir le point de départ d'un projet collectif ou
            d'un défi dans le Cabinet des légendes.
          </p>
        </div>
      </div>
    </>
  )
}
