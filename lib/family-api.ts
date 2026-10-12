import type { Universe } from "@/src/data/beerRoadData"

const SESSION_KEY = "beerroad-family-session-v1"
const BUCKET = "family-media"
let refreshInFlight: Promise<FamilySession> | null = null

export type AuthUser = { id: string; email: string }
export type FamilySession = {
  access_token: string
  refresh_token: string
  expires_at: number
  user: AuthUser
}
export type FamilyMember = { email: string; display_name: string }
export type CommunityPost = {
  id: string
  created_at: string
  author_email: string
  author_name: string
  universe_slug: Universe
  title: string
  body: string | null
  media_path: string | null
  media_type: string | null
  external_url: string | null
  media_url?: string | null
}
export type FamilyEvent = {
  id: string
  created_at: string
  author_email: string
  author_name: string
  title: string
  details: string | null
  start_at: string
  end_at: string | null
  location: string | null
  event_type: "sejour" | "anniversaire" | "travaux" | "projet" | "autre"
}

type SupabaseConfig = { url: string; anonKey: string }

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "")
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null
}

function getSavedSession(): FamilySession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as FamilySession) : null
  } catch {
    return null
  }
}

function saveSession(session: FamilySession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearFamilySession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY)
}

export function readFamilySession() {
  return getSavedSession()
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string; msg?: string; error_description?: string; error?: string; hint?: string }
    return payload.message || payload.msg || payload.error_description || payload.error || payload.hint || `Erreur ${response.status}`
  } catch {
    return `Erreur ${response.status}`
  }
}

async function requestPublicAuth<T>(path: string, body: unknown): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("L'espace partagé n'est pas encore configuré. Il faut ajouter les deux variables Supabase dans Vercel.")
  const response = await fetch(`${config.url}${path}`, {
    method: "POST",
    headers: { apikey: config.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as T
}

export async function sendEmailCode(email: string) {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré : consulte le fichier README-V2.md.")
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined
  const suffix = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ""
  return requestPublicAuth<{ message?: string }>(`/auth/v1/otp${suffix}`, {
    email: email.trim().toLowerCase(),
    create_user: true,
  })
}

function normalizeSession(payload: {
  access_token: string
  refresh_token: string
  expires_in?: number
  expires_at?: number
  user: { id: string; email?: string }
}): FamilySession {
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_at ?? Math.floor(Date.now() / 1000) + (payload.expires_in ?? 3600),
    user: { id: payload.user.id, email: (payload.user.email || "").toLowerCase() },
  }
}

export async function verifyEmailCode(email: string, token: string) {
  const result = await requestPublicAuth<{
    access_token: string
    refresh_token: string
    expires_in?: number
    expires_at?: number
    user: { id: string; email?: string }
  }>("/auth/v1/verify", { email: email.trim().toLowerCase(), token: token.trim(), type: "email" })
  const session = normalizeSession(result)
  saveSession(session)
  return session
}

export async function acceptEmailLinkFromUrl(): Promise<FamilySession | null> {
  if (typeof window === "undefined") return null
  const config = getSupabaseConfig()
  if (!config) return null
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const accessToken = hash.get("access_token") || new URLSearchParams(window.location.search).get("access_token")
  const refreshToken = hash.get("refresh_token") || new URLSearchParams(window.location.search).get("refresh_token")
  if (!accessToken || !refreshToken) return null
  const expiresIn = Number(hash.get("expires_in") || new URLSearchParams(window.location.search).get("expires_in") || 3600)
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error(await readError(response))
  const user = (await response.json()) as { id: string; email?: string }
  const session: FamilySession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: { id: user.id, email: (user.email || "").toLowerCase() },
  }
  saveSession(session)
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
  return session
}

async function getValidSession(): Promise<FamilySession> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré.")
  const session = getSavedSession()
  if (!session) throw new Error("Connecte-toi avec ton adresse e-mail pour continuer.")
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
    if (!response.ok) {
      clearFamilySession()
      throw new Error("Ta connexion a expiré. Reconnecte-toi par e-mail.")
    }
    const payload = (await response.json()) as {
      access_token: string
      refresh_token: string
      expires_in?: number
      expires_at?: number
      user: { id: string; email?: string }
    }
    const refreshed = normalizeSession(payload)
    saveSession(refreshed)
    return refreshed
  })()
  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

async function familyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré. Consulte README-V2.md.")
  const session = await getValidSession()
  const headers = new Headers(options.headers)
  headers.set("apikey", config.anonKey)
  headers.set("Authorization", `Bearer ${session.access_token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  const response = await fetch(`${config.url}${path}`, { ...options, headers })
  if (!response.ok) {
    const message = await readError(response)
    if (response.status === 401) clearFamilySession()
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export async function getFamilyMember(email: string): Promise<FamilyMember | null> {
  const query = new URLSearchParams({ select: "email,display_name", email: `eq.${email.toLowerCase()}`, limit: "1" })
  const members = await familyRequest<FamilyMember[]>(`/rest/v1/family_members?${query.toString()}`)
  return members[0] || null
}

export async function listCommunityPosts(): Promise<CommunityPost[]> {
  const query = new URLSearchParams({ select: "id,created_at,author_email,author_name,universe_slug,title,body,media_path,media_type,external_url", order: "created_at.desc", limit: "60" })
  const posts = await familyRequest<CommunityPost[]>(`/rest/v1/community_posts?${query.toString()}`)
  return Promise.all(posts.map(async (post) => ({ ...post, media_url: post.media_path ? await createSignedMediaUrl(post.media_path).catch(() => null) : null })))
}

export async function listFamilyEvents(): Promise<FamilyEvent[]> {
  const query = new URLSearchParams({ select: "id,created_at,author_email,author_name,title,details,start_at,end_at,location,event_type", order: "start_at.asc", limit: "100" })
  return familyRequest<FamilyEvent[]>(`/rest/v1/family_events?${query.toString()}`)
}

function encodeStoragePath(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/")
}

export async function uploadFamilyMedia(file: File, userId: string): Promise<{ path: string; mediaType: string }> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré.")
  const session = await getValidSession()
  const safeName = file.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-90) || "fichier"
  const path = `${userId}/${Date.now()}-${safeName}`
  const response = await fetch(`${config.url}/storage/v1/object/${BUCKET}/${encodeStoragePath(path)}`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
  })
  if (!response.ok) throw new Error(await readError(response))
  const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document"
  return { path, mediaType }
}

async function createSignedMediaUrl(path: string): Promise<string> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré.")
  const result = await familyRequest<{ signedURL?: string; signedUrl?: string }>(`/storage/v1/object/sign/${BUCKET}/${encodeStoragePath(path)}`, {
    method: "POST",
    body: JSON.stringify({ expiresIn: 3600 }),
  })
  const signedUrl = result.signedURL || result.signedUrl
  if (!signedUrl) throw new Error("Le média n'a pas pu être ouvert.")
  return signedUrl.startsWith("http") ? signedUrl : `${config.url}/storage/v1${signedUrl}`
}

export async function createCommunityPost(input: {
  authorEmail: string
  authorName: string
  universe: Universe
  title: string
  body: string
  file?: File | null
  userId: string
  externalUrl?: string
}): Promise<CommunityPost> {
  let mediaPath: string | null = null
  let mediaType: string | null = null
  if (input.file) {
    const uploaded = await uploadFamilyMedia(input.file, input.userId)
    mediaPath = uploaded.path
    mediaType = uploaded.mediaType
  }
  const rows = await familyRequest<CommunityPost[]>("/rest/v1/community_posts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      author_email: input.authorEmail.toLowerCase(),
      author_name: input.authorName,
      universe_slug: input.universe,
      title: input.title.trim(),
      body: input.body.trim() || null,
      media_path: mediaPath,
      media_type: mediaType,
      external_url: input.externalUrl?.trim() || null,
    }]),
  })
  const post = rows[0]
  return { ...post, media_url: mediaPath ? await createSignedMediaUrl(mediaPath).catch(() => null) : null }
}

export async function createFamilyEvent(input: {
  authorEmail: string
  authorName: string
  title: string
  details: string
  startAt: string
  endAt?: string
  location: string
  eventType: FamilyEvent["event_type"]
}): Promise<FamilyEvent> {
  const rows = await familyRequest<FamilyEvent[]>("/rest/v1/family_events", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      author_email: input.authorEmail.toLowerCase(),
      author_name: input.authorName,
      title: input.title.trim(),
      details: input.details.trim() || null,
      start_at: input.startAt,
      end_at: input.endAt || null,
      location: input.location.trim() || null,
      event_type: input.eventType,
    }]),
  })
  return rows[0]
}

export async function updateFamilyEvent(id: string, input: {
  title: string
  details: string
  startAt: string
  endAt?: string
  location: string
  eventType: FamilyEvent["event_type"]
}): Promise<FamilyEvent> {
  const rows = await familyRequest<FamilyEvent[]>(`/rest/v1/family_events?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      title: input.title.trim(),
      details: input.details.trim() || null,
      start_at: input.startAt,
      end_at: input.endAt || null,
      location: input.location.trim() || null,
      event_type: input.eventType,
    }),
  })
  if (!rows[0]) throw new Error("Rendez-vous introuvable ou modification non autorisée.")
  return rows[0]
}

export async function deleteFamilyEvent(id: string): Promise<void> {
  await familyRequest<void>(`/rest/v1/family_events?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" })
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}
