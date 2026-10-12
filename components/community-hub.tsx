"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleUserRound,
  FileAudio,
  FileText,
  ExternalLink,
  HeartHandshake,
  Image as ImageIcon,
  LogIn,
  LogOut,
  MapPin,
  Music2,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react"
import { plaques, type Universe } from "@/src/data/beerRoadData"
import {
  acceptEmailLinkFromUrl,
  clearFamilySession,
  createCommunityPost,
  createFamilyEvent,
  deleteFamilyEvent,
  formatDateTime,
  getFamilyMember,
  isSupabaseConfigured,
  listCommunityPosts,
  listFamilyEvents,
  readFamilySession,
  sendEmailCode,
  updateFamilyEvent,
  verifyEmailCode,
  type CommunityPost,
  type FamilyEvent,
  type FamilyMember,
  type FamilySession,
} from "@/lib/family-api"

type HubTab = "carnet" | "agenda"

const allowedFileTypes = "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/x-wav,application/pdf"
const imageVideoTypes = "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime"
const audioTypes = "audio/mpeg,audio/mp4,audio/wav,audio/x-wav"
type ContributionIntent = "any" | "text" | "image-video" | "audio"
type EventType = FamilyEvent["event_type"]
const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "sejour", label: "Séjour / retrouvailles" },
  { value: "anniversaire", label: "Anniversaire / fête" },
  { value: "travaux", label: "Ker Huon / travaux" },
  { value: "projet", label: "Projet commun" },
  { value: "autre", label: "Autre" },
]
function eventTypeName(value: EventType) {
  return eventTypeOptions.find((option) => option.value === value)?.label || "Autre"
}
const universeOptions = plaques.map((plaque) => ({ value: plaque.universe, label: plaque.name }))

function universeName(universe: Universe) {
  return plaques.find((plaque) => plaque.universe === universe)?.name || "La Beer Road"
}

function sectionsForUniverse(universe: Universe) {
  const plaque = plaques.find((item) => item.universe === universe)
  if (!plaque) return ["Contributions générales"]
  const labels = [
    "Contributions générales",
    ...(plaque.content.highlights || []).map((item) => item.label),
    ...(plaque.content.albums || []).map((item) => item.title),
    ...(plaque.content.books || []).map((item) => item.title),
    ...(plaque.content.links || []).map((item) => item.label),
  ]
  return Array.from(new Set(labels))
}

function fileKind(file: File) {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "document"
}

function ExternalLinkIcon() { return <ExternalLink className="size-4" /> }

function mediaIcon(kind: string) {
  if (kind === "image") return <ImageIcon className="size-4" />
  if (kind === "video") return <Video className="size-4" />
  if (kind === "audio") return <Music2 className="size-4" />
  return <FileText className="size-4" />
}

export function CommunityHub({ contributionRequest }: { contributionRequest: { universe: Universe; section: string; target: "carnet" | "agenda"; nonce: number } }) {
  const configured = isSupabaseConfigured()
  const [tab, setTab] = useState<HubTab>("carnet")
  const [session, setSession] = useState<FamilySession | null>(null)
  const [member, setMember] = useState<FamilyMember | null>(null)
  const [authStage, setAuthStage] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [authBusy, setAuthBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [events, setEvents] = useState<FamilyEvent[]>([])
  const [postUniverse, setPostUniverse] = useState<Universe>(contributionRequest.universe)
  const [postSection, setPostSection] = useState<string>(contributionRequest.section || "Contributions générales")
  const [feedUniverse, setFeedUniverse] = useState<Universe | "all">("all")
  const [feedSection, setFeedSection] = useState<string | "all">("all")
  const [postIntent, setPostIntent] = useState<ContributionIntent>("any")
  const [postTitle, setPostTitle] = useState("")
  const [postBody, setPostBody] = useState("")
  const [postFile, setPostFile] = useState<File | null>(null)
  const [postExternalUrl, setPostExternalUrl] = useState("")
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("12:00")
  const [eventLocation, setEventLocation] = useState("Ker Huon")
  const [eventDetails, setEventDetails] = useState("")
  const [eventType, setEventType] = useState<EventType>("sejour")
  const formFocusRequest = useRef(0)

  useEffect(() => {
    if (contributionRequest.nonce === 0 || formFocusRequest.current === contributionRequest.nonce) return
    formFocusRequest.current = contributionRequest.nonce
    setPostUniverse(contributionRequest.universe)
    setPostSection(contributionRequest.section || "Contributions générales")
    setPostTitle(contributionRequest.section && contributionRequest.section !== "Contributions générales" ? contributionRequest.section : "")
    setFeedUniverse(contributionRequest.universe)
    setFeedSection(contributionRequest.section && contributionRequest.section !== "Agenda familial" ? contributionRequest.section : "all")
    setTab(contributionRequest.target)
    window.requestAnimationFrame(() => {
      const targetId = contributionRequest.target === "agenda" ? "agenda-panel" : "community-post-form"
      const target = document.getElementById(targetId) || document.getElementById("family-email") || document.getElementById("carnet")
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [contributionRequest])

  useEffect(() => {
    let active = true
    async function initialise() {
      if (!configured) return
      try {
        const fromLink = await acceptEmailLinkFromUrl()
        const saved = fromLink || readFamilySession()
        if (!saved || !active) return
        setSession(saved)
        setEmail(saved.user.email)
        const verifiedMember = await getFamilyMember(saved.user.email)
        if (!active) return
        if (!verifiedMember) {
          clearFamilySession()
          setSession(null)
          setError("Cette adresse n'est pas encore autorisée à participer. Demande à l'administrateur de l'ajouter à la liste familiale.")
          return
        }
        setMember(verifiedMember)
        await refreshSharedContent(activeCheck)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Connexion impossible pour le moment.")
      }
    }
    // Utilisé pour éviter de mettre à jour un composant démonté pendant un chargement.
    const activeCheck = () => active
    void initialise()
    return () => { active = false }
  }, [configured])

  async function refreshSharedContent(isActive: () => boolean = () => true) {
    setLoading(true)
    try {
      const [nextPosts, nextEvents] = await Promise.all([listCommunityPosts(), listFamilyEvents()])
      if (!isActive()) return
      setPosts(nextPosts)
      setEvents(nextEvents)
    } catch (err) {
      if (isActive()) setError(err instanceof Error ? err.message : "Impossible de charger le carnet familial.")
    } finally {
      if (isActive()) setLoading(false)
    }
  }

  function chooseContribution(intent: ContributionIntent, universe: Universe, section = "Contributions générales") {
    setPostIntent(intent)
    setPostUniverse(universe)
    setPostSection(section)
    setPostTitle(section !== "Contributions générales" ? section : "")
    setFeedUniverse(universe)
    setFeedSection(section !== "Contributions générales" ? section : "all")
    setTab("carnet")
    setNotice(session && member
      ? `Le formulaire est prêt pour « ${universeName(universe)} ».`
      : `Tu as choisi ${intent === "text" ? "un texte ou une anecdote" : intent === "audio" ? "un son ou un MP3" : intent === "image-video" ? "une photo ou une vidéo" : "une contribution"}. Connecte-toi ci-dessus ; le formulaire sera ensuite prêt dans « ${universeName(universe)} ».`)
    setError("")
    window.requestAnimationFrame(() => {
      const targetId = session && member ? "community-post-form" : "family-email"
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" })
      if (targetId === "family-email") (document.getElementById(targetId) as HTMLInputElement | null)?.focus()
    })
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")
    setAuthBusy(true)
    try {
      await sendEmailCode(email)
      setAuthStage("code")
      setNotice("E-mail envoyé. Ouvre ta boîte de réception : clique sur le lien de connexion, ou saisis le code à 6 chiffres si le message en contient un. L’adresse sert à vérifier que c’est bien toi.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer l'e-mail de connexion.")
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")
    setAuthBusy(true)
    try {
      const nextSession = await verifyEmailCode(email, code)
      setSession(nextSession)
      const verifiedMember = await getFamilyMember(nextSession.user.email)
      if (!verifiedMember) {
        clearFamilySession()
        setSession(null)
        throw new Error("Cette adresse n'est pas encore autorisée à participer. Demande à l'administrateur de l'ajouter à la liste familiale.")
      }
      setMember(verifiedMember)
      setNotice(`Bienvenue ${verifiedMember.display_name} ! L'espace familial est ouvert.`)
      await refreshSharedContent()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le code n'a pas pu être vérifié.")
    } finally {
      setAuthBusy(false)
    }
  }

  function handleSignOut() {
    clearFamilySession()
    setSession(null)
    setMember(null)
    setPosts([])
    setEvents([])
    setNotice("Tu es déconnecté·e de l'espace familial.")
    setError("")
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !member) return
    setError("")
    setNotice("")
    setLoading(true)
    try {
      if (postFile) {
        const kind = fileKind(postFile)
        const limit = kind === "video" ? 25 : kind === "audio" ? 20 : 10
        if (postFile.size > limit * 1024 * 1024) throw new Error(`Le fichier dépasse la limite conseillée de ${limit} Mo. Pour un média plus lourd, utilise le champ « Lien vers un média ». `)
      }
      if (postExternalUrl.trim()) {
        let parsed: URL
        try { parsed = new URL(postExternalUrl.trim()) } catch { throw new Error("Le lien du média n'est pas une URL valide.") }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Le lien doit commencer par https:// ou http://.")
        if (postFile) throw new Error("Choisis soit un fichier à téléverser, soit un lien externe, pas les deux.")
      }
      if (!postTitle.trim()) throw new Error("Donne un titre à ta contribution.")
      if (!postBody.trim() && !postFile && !postExternalUrl.trim()) throw new Error("Ajoute un texte, joins un petit fichier ou colle un lien vers le média.")
      const created = await createCommunityPost({
        authorEmail: session.user.email,
        authorName: member.display_name,
        universe: postUniverse,
        sectionLabel: postSection,
        title: postTitle,
        body: postBody,
        file: postFile,
        externalUrl: postExternalUrl.trim() || undefined,
        userId: session.user.id,
      })
      setPosts((current) => [created, ...current])
      setPostTitle("")
      setPostBody("")
      setPostFile(null)
      setPostExternalUrl("")
      setFeedUniverse(postUniverse)
      setFeedSection(postSection)
      const fileInput = document.getElementById("community-file") as HTMLInputElement | null
      if (fileInput) fileInput.value = ""
      setNotice("Contribution publiée dans le carnet de la tribu. Merci !")
    } catch (err) {
      setError(err instanceof Error ? err.message : "La contribution n'a pas pu être publiée.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !member) return
    setError("")
    setNotice("")
    setLoading(true)
    try {
      if (!eventTitle.trim() || !eventDate || !eventTime) throw new Error("Indique au moins un titre, une date et une heure.")
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
        setEvents((current) => current.map((item) => item.id === updated.id ? updated : item).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()))
        setNotice("Rendez-vous mis à jour dans l'agenda familial.")
      } else {
        const created = await createFamilyEvent({
          authorEmail: session.user.email,
          authorName: member.display_name,
          ...eventInput,
        })
        setEvents((current) => [...current, created].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()))
        setNotice("Rendez-vous ajouté à l'agenda familial.")
      }
      resetEventForm()
    } catch (err) {
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
    setEditingEventId(item.id)
    setEventTitle(item.title)
    setEventDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`)
    setEventTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`)
    setEventLocation(item.location || "")
    setEventDetails(item.details || "")
    setEventType(item.event_type || "autre")
    setError("")
    setNotice(`Modification du rendez-vous « ${item.title} ».`)
    document.getElementById("event-title")?.scrollIntoView({ behavior: "smooth", block: "center" })
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
      setError(err instanceof Error ? err.message : "Le rendez-vous n'a pas pu être supprimé.")
    } finally {
      setLoading(false)
    }
  }

  const visibleEvents = useMemo(() => events.filter((event) => new Date(event.start_at).getTime() >= Date.now()), [events])
  const visiblePosts = useMemo(() => posts.filter((post) => (feedUniverse === "all" || post.universe_slug === feedUniverse) && (feedSection === "all" || (post.section_label || "Contributions générales") === feedSection)), [posts, feedUniverse, feedSection])
  const postSectionOptions = useMemo(() => sectionsForUniverse(postUniverse), [postUniverse])
  const feedSectionOptions = useMemo(() => feedUniverse === "all" ? [] : sectionsForUniverse(feedUniverse), [feedUniverse])

  function selectTab(nextTab: HubTab) {
    setTab(nextTab)
    window.requestAnimationFrame(() => document.getElementById("carnet")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  return (
    <section id="carnet" className="scroll-mt-6 rounded-[2rem] border border-border bg-card/90 p-5 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">La Beer Road continue</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Le carnet vivant de la tribu</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Ici, chacun peut déposer une anecdote, une vidéo, une photo, un texte ou un MP3, et ajouter les prochains rendez-vous. Ce qui est publié ici appartient au patrimoine commun — pas aux albums privés de chaque foyer.
          </p>
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs" aria-live="polite">
            <CircleUserRound className="size-4 shrink-0 text-primary" />
            {session && member ? <span>Session active : <strong>{member.display_name}</strong> · {session.user.email}</span> : <span>Pas de membre connecté dans ce navigateur.</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => selectTab("carnet")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${tab === "carnet" ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"}`}>
            <HeartHandshake className="size-4" /> Le carnet
          </button>
          <button type="button" onClick={() => selectTab("agenda")} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${tab === "agenda" ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-secondary"}`}>
            <CalendarDays className="size-4" /> L'agenda
          </button>
        </div>
      </div>

      {notice && <div role="status" className="mt-5 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /><p>{notice}</p></div>}
      {error && <div role="alert" className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

      {contributionRequest.nonce > 0 && contributionRequest.target === "carnet" && !session && <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4"><p className="font-semibold">Contribution préparée : {universeName(contributionRequest.universe)}</p><p className="mt-1 text-sm text-muted-foreground">Rubrique : {contributionRequest.section || "Contributions générales"}. Connecte-toi ci-dessous ; le formulaire gardera cette destination.</p></div>}
      {tab === "agenda" && (!session || !member) && <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4"><p className="font-semibold">L’agenda familial est sélectionné</p><p className="mt-1 text-sm text-muted-foreground">Connecte-toi avec l’une des neuf adresses autorisées pour consulter les rendez-vous et en ajouter. Après connexion, l’onglet Agenda affichera son formulaire et la liste des événements.</p></div>}

      {!configured ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-dashed border-border bg-background p-5 sm:grid-cols-[auto_1fr] sm:p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary"><ShieldCheck className="size-6 text-primary" /></div>
          <div>
            <h3 className="font-semibold">Le carnet est prêt, il reste à le brancher</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Aucune connexion Supabase valide n’est configurée. Les valeurs du fichier <code>.env.example</code> sont volontairement des exemples : elles doivent être remplacées par l’URL et la clé publique de TON projet Supabase, dans Vercel → Settings → Environment Variables. Sans ces vraies valeurs, le site ne tente pas d’appeler un domaine fictif.</p>
          </div>
        </div>
      ) : !session || !member ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <div className="rounded-2xl bg-secondary/55 p-5 sm:p-6">
            <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-background"><CircleUserRound className="size-5 text-primary" /></span><div><h3 className="font-semibold">Entrer dans l'espace familial</h3><p className="text-sm text-muted-foreground">Connexion par e-mail, sans mot de passe à retenir.</p></div></div>
            {authStage === "email" ? (
              <form onSubmit={handleSendCode} className="mt-5 space-y-3">
                <label htmlFor="family-email" className="block text-sm font-medium">Ton adresse e-mail</label>
                <input id="family-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom@exemple.fr" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                <button type="submit" disabled={authBusy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><LogIn className="size-4" />{authBusy ? "Envoi…" : "Envoyer mon lien / code de connexion"}</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="mt-5 space-y-3">
                <p className="text-sm text-muted-foreground">E-mail envoyé à <strong className="text-foreground">{email}</strong>.</p>
                <label htmlFor="family-code" className="block text-sm font-medium">Code à 6 chiffres (si présent dans l'e-mail)</label>
                <input id="family-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-xl tracking-[0.35em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                <button type="submit" disabled={authBusy || code.length !== 6} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="size-4" />{authBusy ? "Vérification…" : "Valider le code"}</button>
                <button type="button" onClick={() => { setAuthStage("email"); setCode(""); setNotice(""); setError("") }} className="w-full py-1 text-sm text-muted-foreground underline underline-offset-4">Utiliser une autre adresse</button>
              </form>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">L'accès aux contributions et aux médias est réservé aux adresses ajoutées à la liste familiale dans Supabase. Un lien reçu ne suffit pas à obtenir cet accès.</p>
          </div>
          <div className="rounded-2xl border border-border p-5 sm:p-6">
            <h3 className="font-serif text-xl font-semibold">Des idées à déposer ?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Une histoire de moins de trois minutes, une photo qui résume un séjour, un MP3, une expression à ajouter au dictionnaire ou une idée pour la prochaine Beer Road : les petites contributions feront grandir ce patrimoine commun.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => chooseContribution("image-video", "legendes", "Le musée du presque-raté")} className="rounded-xl bg-secondary/60 p-3 text-left transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><Camera className="size-5 text-primary" /><p className="mt-2 text-sm font-medium">Déposer une photo ou vidéo</p><p className="mt-1 text-xs text-muted-foreground">Clique pour préparer le dépôt</p></button>
              <button type="button" onClick={() => chooseContribution("audio", "legendes", "La boîte à sons")} className="rounded-xl bg-secondary/60 p-3 text-left transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><FileAudio className="size-5 text-primary" /><p className="mt-2 text-sm font-medium">Déposer un MP3 ou un son</p><p className="mt-1 text-xs text-muted-foreground">Clique pour préparer le dépôt</p></button>
              <button type="button" onClick={() => chooseContribution("text", "legendes", "La boîte à anecdotes")} className="col-span-2 rounded-xl bg-secondary/60 p-3 text-left transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><FileText className="size-5 text-primary" /><p className="mt-2 text-sm font-medium">Raconter une anecdote ou écrire un texte</p><p className="mt-1 text-xs text-muted-foreground">Clique pour préparer le dépôt</p></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><CircleUserRound className="size-5" /></span><div><p className="font-semibold">Bonjour {member.display_name} !</p><p className="text-xs text-muted-foreground">Connecté·e avec {session.user.email}</p></div></div>
            <div className="flex gap-2"><button type="button" onClick={() => void refreshSharedContent()} disabled={loading} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50">{loading ? "Actualisation…" : "Actualiser"}</button><button type="button" onClick={handleSignOut} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary"><LogOut className="size-3.5" /> Déconnexion</button></div>
          </div>

          {tab === "carnet" ? (
            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
              <form id="community-post-form" onSubmit={handleCreatePost} className="scroll-mt-6 self-start rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-secondary"><Upload className="size-4 text-primary" /></span><h3 className="font-semibold">Déposer une contribution</h3></div>
                <p className="mt-2 text-sm text-muted-foreground">Chaque dépôt est classé dans un univers précis et devient visible aux membres autorisés.</p>
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"><span className="block"><strong>Univers :</strong> {universeName(postUniverse)}</span><span className="mt-1 block"><strong>Rubrique :</strong> {postSection}</span>{postIntent !== "any" && <span className="block mt-1 text-muted-foreground">Type préparé : {postIntent === "text" ? "texte / anecdote" : postIntent === "audio" ? "audio / MP3" : "photo / vidéo"}. Tu peux encore le modifier.</span>}</div>
                <label htmlFor="post-universe" className="mt-4 block text-sm font-medium">Univers concerné</label>
                <select id="post-universe" value={postUniverse} onChange={(event) => { const nextUniverse = event.target.value as Universe; setPostUniverse(nextUniverse); setPostSection("Contributions générales"); setPostTitle("") }} className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary">
                  {universeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <label htmlFor="post-section" className="mt-4 block text-sm font-medium">Rubrique précise dans cet univers</label>
                <select id="post-section" value={postSection} onChange={(event) => { setPostSection(event.target.value); setPostTitle(event.target.value === "Contributions générales" ? "" : event.target.value) }} className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary">
                  {postSectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">Une publication est classée à la fois dans un univers et dans cette rubrique.</p>
                <label htmlFor="post-title" className="mt-4 block text-sm font-medium">Titre</label>
                <input id="post-title" required maxLength={140} value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="Le fameux incident du barbecue…" className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <label htmlFor="post-body" className="mt-4 block text-sm font-medium">Raconte ou ajoute un commentaire</label>
                <textarea id="post-body" rows={4} value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder="Le contexte, la date, les personnes présentes, pourquoi c'est culte…" className="mt-1.5 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <label htmlFor="community-file" className="mt-4 block text-sm font-medium">Joindre un petit fichier (facultatif)</label>
                <input id="community-file" type="file" accept={postIntent === "image-video" ? imageVideoTypes : postIntent === "audio" ? audioTypes : allowedFileTypes} onChange={(event) => setPostFile(event.target.files?.[0] || null)} className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground hover:file:bg-secondary/80" />
                {postFile && <p className="mt-2 break-all text-xs text-muted-foreground">{mediaIcon(fileKind(postFile))} <span className="ml-1">{postFile.name} · {(postFile.size / (1024 * 1024)).toFixed(1)} Mo</span><button type="button" onClick={() => { setPostFile(null); const input = document.getElementById("community-file") as HTMLInputElement | null; if (input) input.value = "" }} className="ml-2 underline">Retirer</button></p>}
                <label htmlFor="post-external-url" className="mt-4 block text-sm font-medium">Lien vers un média hébergé ailleurs</label>
                <input id="post-external-url" type="url" inputMode="url" value={postExternalUrl} onChange={(event) => setPostExternalUrl(event.target.value)} placeholder="https://… (YouTube, Drive partagé, etc.)" className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Pour un film, une longue vidéo ou un gros MP3, privilégie un lien externe plutôt que de remplir le stockage Supabase. Vérifie les droits de partage du fichier.</p>
                <button type="submit" disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" />{loading ? "Publication…" : `Publier dans « ${universeName(postUniverse)} »`}</button>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Taille conseillée pour les petits fichiers téléversés : photo/PDF 10 Mo, MP3 20 Mo, vidéo courte 25 Mo. Au-delà, utilise un lien externe.</p>
              </form>

              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-serif text-2xl font-semibold">Les dernières traces</h3><p className="mt-1 text-sm text-muted-foreground">Les contributions rangées par univers.</p></div><div className="flex items-center gap-2"><label htmlFor="feed-universe" className="sr-only">Filtrer par univers</label><select id="feed-universe" value={feedUniverse} onChange={(event) => { setFeedUniverse(event.target.value as Universe | "all"); setFeedSection("all") }} className="max-w-[230px] rounded-full border border-border bg-background px-3 py-2 text-xs"><option value="all">Tous les univers</option>{universeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{feedUniverse !== "all" && <select aria-label="Filtrer par rubrique" value={feedSection} onChange={(event) => setFeedSection(event.target.value)} className="max-w-[210px] rounded-full border border-border bg-background px-3 py-2 text-xs"><option value="all">Toutes les rubriques</option>{feedSectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}</select>}<span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{visiblePosts.length}</span></div></div>
                {loading && posts.length === 0 ? <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">Chargement du carnet…</p> : visiblePosts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center"><HeartHandshake className="mx-auto size-8 text-primary" /><h4 className="mt-3 font-semibold">Aucune contribution dans cet univers pour le moment</h4><p className="mt-1 text-sm text-muted-foreground">Dépose la première trace ou choisis « Tous les univers » pour élargir la recherche.</p></div>
                ) : (
                  <div className="space-y-3">
                    {visiblePosts.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border border-border bg-background p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">{universeName(post.universe_slug)}</span><span className="rounded-full border border-border px-2.5 py-1">{post.section_label || "Contributions générales"}</span><span>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(post.created_at))}</span></div>
                      <h4 className="mt-3 font-serif text-xl font-semibold">{post.title}</h4>
                      {post.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{post.body}</p>}
                      {post.media_url && post.media_type === "image" && <a href={post.media_url} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-xl"><img src={post.media_url} alt={post.title} loading="lazy" className="max-h-[420px] w-full rounded-xl object-contain" /></a>}
                      {post.media_url && post.media_type === "video" && <video controls preload="metadata" src={post.media_url} className="mt-4 max-h-[420px] w-full rounded-xl bg-black" />}
                      {post.media_url && post.media_type === "audio" && <div className="mt-4 rounded-xl bg-secondary/60 p-3"><p className="mb-2 flex items-center gap-2 text-sm font-medium"><Music2 className="size-4" /> Écouter le fichier audio</p><audio controls preload="none" src={post.media_url} className="w-full" /></div>}
                      {post.media_url && post.media_type === "document" && <a href={post.media_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"><FileText className="size-4" /> Ouvrir le document</a>}
                      {post.external_url && <a href={post.external_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"><ExternalLinkIcon /> Ouvrir le média lié</a>}
                      <p className="mt-4 text-xs text-muted-foreground">Déposé par {post.author_name}</p>
                    </article>)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div id="agenda-panel" className="scroll-mt-6 mt-5 grid gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
              <form onSubmit={handleCreateEvent} className="self-start rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-secondary"><CalendarDays className="size-4 text-primary" /></span><h3 className="font-semibold">{editingEventId ? "Modifier un rendez-vous" : "Ajouter un rendez-vous"}</h3></div>
                <p className="mt-2 text-sm text-muted-foreground">Un séjour, un anniversaire, un chantier ou une idée de retrouvailles.</p>
                <label htmlFor="event-title" className="mt-4 block text-sm font-medium">Nom du rendez-vous</label>
                <input id="event-title" required maxLength={140} value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Week-end Beer Road" className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <div className="mt-4 grid grid-cols-2 gap-3"><div><label htmlFor="event-date" className="block text-sm font-medium">Date</label><input id="event-date" type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" /></div><div><label htmlFor="event-time" className="block text-sm font-medium">Heure</label><input id="event-time" type="time" required value={eventTime} onChange={(event) => setEventTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" /></div></div>
                <label htmlFor="event-type" className="mt-4 block text-sm font-medium">Type de rendez-vous</label>
                <select id="event-type" value={eventType} onChange={(event) => setEventType(event.target.value as EventType)} className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary">{eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <label htmlFor="event-location" className="mt-4 block text-sm font-medium">Lieu</label>
                <input id="event-location" value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} placeholder="Ker Huon, chez l'un de nous…" className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <label htmlFor="event-details" className="mt-4 block text-sm font-medium">Précisions</label>
                <textarea id="event-details" rows={3} value={eventDetails} onChange={(event) => setEventDetails(event.target.value)} placeholder="Qui vient, quoi prévoir, idées d'activités…" className="mt-1.5 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <button type="submit" disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><CalendarDays className="size-4" />{loading ? "Enregistrement…" : editingEventId ? "Enregistrer les modifications" : "Ajouter à l'agenda"}</button>
                {editingEventId && <button type="button" onClick={() => { resetEventForm(); setNotice("") }} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"><X className="size-4" />Annuler la modification</button>}
              </form>
              <div>
                <div className="mb-3 flex items-end justify-between gap-3"><div><h3 className="font-serif text-2xl font-semibold">Les prochains rendez-vous</h3><p className="mt-1 text-sm text-muted-foreground">L'agenda commun, mis à jour par la famille.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{visibleEvents.length} événement{visibleEvents.length > 1 ? "s" : ""}</span></div>
                {loading && events.length === 0 ? <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">Chargement de l'agenda…</p> : visibleEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center"><CalendarDays className="mx-auto size-8 text-primary" /><h4 className="mt-3 font-semibold">Le calendrier est encore vierge</h4><p className="mt-1 text-sm text-muted-foreground">Propose le prochain rendez-vous familial pour lancer le mouvement.</p></div>
                ) : (
                  <ol className="space-y-3">{visibleEvents.map((item) => <li key={item.id} className="rounded-2xl border border-border bg-background p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><div className="min-w-28 rounded-xl bg-secondary p-3 text-center"><span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date(item.start_at))}</span><span className="mt-1 block font-serif text-3xl font-semibold">{new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(new Date(item.start_at))}</span><span className="mt-1 block text-xs text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date(item.start_at))}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-serif text-xl font-semibold">{item.title}</h4><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{eventTypeName(item.event_type || "autre")}</span></div><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="size-4" />{formatDateTime(item.start_at)}</p>{item.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{item.location}</p>}{item.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.details}</p>}<p className="mt-3 text-xs text-muted-foreground">Proposé par {item.author_name}</p>{item.author_email.toLowerCase() === session.user.email.toLowerCase() && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => beginEditEvent(item)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"><Pencil className="size-3.5" />Modifier</button><button type="button" disabled={loading} onClick={() => void handleDeleteEvent(item)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"><Trash2 className="size-3.5" />Supprimer</button></div>}</div></div></li>)}</ol>
                )}
                <p className="mt-4 text-xs text-muted-foreground">Astuce : un rendez-vous peut aussi devenir le point de départ d'un projet collectif ou d'un défi dans le Cabinet des légendes.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => chooseContribution("image-video", "legendes", "Le musée du presque-raté")} className="rounded-2xl bg-secondary/45 p-4 text-left transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><Camera className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Le musée du presque-raté</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Clique pour déposer les bêtisiers, ratés de tournage et photos improbables dans le Cabinet des légendes.</p></button>
        <button type="button" onClick={() => chooseContribution("audio", "legendes", "La boîte à sons")} className="rounded-2xl bg-secondary/45 p-4 text-left transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><FileAudio className="size-5 text-primary" /><h3 className="mt-2 font-semibold">La boîte à sons</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Clique pour déposer expressions cultes, messages vocaux, mini-podcasts et ambiances.</p></button>
        <button type="button" onClick={() => chooseContribution("text", "avenir", "Les chantiers ouverts")} className="rounded-2xl bg-secondary/45 p-4 text-left transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"><CalendarDays className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Le prochain chapitre</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Clique pour proposer une idée de projet dans La Route des lendemains.</p></button>
      </div>
    </section>
  )
}
