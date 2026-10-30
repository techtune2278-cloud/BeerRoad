import {
  createClient,
  type SupabaseClient,
  type Session,
  type AuthChangeEvent,
} from "@supabase/supabase-js"
import type { Universe } from "@/src/data/beerRoadData"

// Même clé et même forme de session que V1.2 : les connexions sont reprises sans e-mail.
export const FAMILY_SESSION_KEY = "beerroad-family-session-v1"
export const FAMILY_SIGNED_OUT_EVENT = "beerroad:signed-out"
// Toutes les réponses de cette API sont de petits documents JSON (pas les médias).
// Le délai couvre aussi la lecture du corps, pas seulement les en-têtes HTTP.
export async function fetchWithTimeout(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController()
  const externalSignal = options.signal || (url instanceof Request ? url.signal : undefined)
  const abort = () => controller.abort()
  if (externalSignal?.aborted) abort()
  externalSignal?.addEventListener("abort", abort, { once: true })
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    const body = response.status === 204 ? null : await response.text()
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Le serveur met trop de temps à répondre. Réessaie dans quelques instants.")
    }
    throw error
  } finally {
    clearTimeout(timer)
    externalSignal?.removeEventListener("abort", abort)
  }
}

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
  section_label: string
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
  // Évite d'envoyer des requêtes à l'URL d'exemple du fichier .env.example.
  const placeholderPattern =
    /votre[-_ ]?projet|your[-_ ]?project|remplacer|example|cle_anon|anon_key/i
  if (placeholderPattern.test(url) || placeholderPattern.test(anonKey)) return null
  try {
    const parsed = new URL(url)
    if (!["https:", "http:"].includes(parsed.protocol)) return null
    if (parsed.hostname === "supabase.co" || parsed.hostname.endsWith(".example.com")) return null
  } catch {
    return null
  }
  return { url, anonKey }
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null
}

export async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string
      msg?: string
      error_description?: string
      error?: string
      hint?: string
    }
    return (
      payload.message ||
      payload.msg ||
      payload.error_description ||
      payload.error ||
      payload.hint ||
      `Erreur ${response.status}`
    )
  } catch {
    return `Erreur ${response.status}`
  }
}

function normalizeSession(value: Session | FamilySession | null): FamilySession | null {
  if (
    !value?.access_token ||
    !value.refresh_token ||
    !Number.isFinite(value.expires_at) ||
    !value.user?.id ||
    !value.user?.email
  )
    return null
  return {
    access_token: value.access_token,
    refresh_token: value.refresh_token,
    expires_at: value.expires_at!,
    user: { id: value.user.id, email: value.user.email.toLowerCase() },
  }
}

export function readFamilySession(): FamilySession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(FAMILY_SESSION_KEY)
    return raw ? normalizeSession(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

// Une seule instance par navigateur, y compris pendant Fast Refresh.
type ClientWindow = Window & {
  __beerRoadAuth?: { url: string; key: string; client: SupabaseClient }
}
export function getFamilyClient(): SupabaseClient {
  if (typeof window === "undefined")
    throw new Error("La connexion doit être ouverte dans le navigateur.")
  const config = getSupabaseConfig()
  if (!config) throw new Error("L’espace familial n’est pas encore configuré.")
  const scope = window as ClientWindow
  if (scope.__beerRoadAuth?.url === config.url && scope.__beerRoadAuth.key === config.anonKey)
    return scope.__beerRoadAuth.client
  if (scope.__beerRoadAuth) void scope.__beerRoadAuth.client.auth.dispose()
  // Une ancienne entrée incomplète ne doit pas bloquer l'initialisation du SDK.
  try {
    if (!readFamilySession()) window.localStorage.removeItem(FAMILY_SESSION_KEY)
  } catch {
    throw new Error(
      "Le navigateur bloque le stockage de la connexion. Autorise les données de ce site, puis réessaie.",
    )
  }
  const client = createClient(config.url, config.anonKey, {
    auth: {
      storageKey: FAMILY_SESSION_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "implicit",
      storage: window.localStorage,
    },
    global: { fetch: (input, options) => fetchWithTimeout(input, options) },
  })
  scope.__beerRoadAuth = { ...config, key: config.anonKey, client }
  return client
}

export function authErrorMessage(error: {
  message?: string
  code?: string
  status?: number
}): string {
  const code = error.code || ""
  const message = error.message || ""
  if (/otp_expired|access_denied/.test(code) || /expired|invalid.*token/i.test(message))
    return "Ce lien de connexion a expiré ou a déjà été utilisé. Demande un nouveau lien ci-dessous."
  if (/refresh_token/.test(code) || error.status === 401)
    return "Ta connexion a expiré. Reconnecte-toi par e-mail."
  if (error.status === 429 || /rate.limit|too many/i.test(message))
    return "Trop de demandes ont été envoyées. Utilise le dernier lien reçu ou attends avant de réessayer."
  if (!error.status || error.status >= 500)
    return "Connexion temporairement indisponible. Vérifie ta connexion Internet et réessaie dans quelques instants."
  return "La connexion a été refusée. Vérifie ton adresse e-mail ou demande de l’aide à l’administrateur."
}

export async function clearFamilySession(): Promise<void> {
  const client = getFamilyClient()
  try {
    // Le SDK sérialise déconnexion et renouvellement : une réponse tardive ne restaure pas le compte.
    await client.auth.signOut({ scope: "local" })
  } finally {
    window.localStorage.removeItem(FAMILY_SESSION_KEY)
    window.dispatchEvent(new window.Event(FAMILY_SIGNED_OUT_EVENT))
  }
}

export function subscribeFamilySession(
  callback: (event: AuthChangeEvent, session: FamilySession | null) => void,
) {
  const { data } = getFamilyClient().auth.onAuthStateChange((event, session) => {
    callback(event, normalizeSession(session))
  })
  return () => data.subscription.unsubscribe()
}

export async function sendMagicLink(email: string) {
  const { error } = await getFamilyClient().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
  })
  if (error) throw new Error(authErrorMessage(error))
}

function cleanAuthUrl() {
  const url = new URL(window.location.href)
  for (const key of [
    "access_token",
    "refresh_token",
    "expires_in",
    "expires_at",
    "token_type",
    "type",
    "code",
    "token_hash",
    "error",
    "error_code",
    "error_description",
  ])
    url.searchParams.delete(key)
  url.hash = ""
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`)
}
let emailLinkInFlight: Promise<FamilySession | null> | null = null
export async function acceptEmailLinkFromUrl(): Promise<FamilySession | null> {
  if (typeof window === "undefined") return null
  if (emailLinkInFlight) return emailLinkInFlight
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const get = (key: string) => hash.get(key) || query.get(key)
  if (get("error") || get("error_code")) {
    const message = authErrorMessage({
      code: get("error_code") || get("error") || "",
      message: get("error_description") || "",
      status: 400,
    })
    cleanAuthUrl()
    throw new Error(message)
  }
  const access_token = get("access_token"),
    refresh_token = get("refresh_token")
  if (!access_token && !refresh_token) return null
  if (!access_token || !refresh_token) {
    cleanAuthUrl()
    throw new Error("Ce lien de connexion est incomplet. Demande un nouveau lien ci-dessous.")
  }
  emailLinkInFlight = (async () => {
    const { data, error } = await getFamilyClient().auth.setSession({ access_token, refresh_token })
    if (error) {
      if (error.status && error.status < 500) cleanAuthUrl()
      throw new Error(authErrorMessage(error))
    }
    cleanAuthUrl()
    return normalizeSession(data.session)
  })()
  try {
    return await emailLinkInFlight
  } finally {
    emailLinkInFlight = null
  }
}

export async function restoreFamilySession(): Promise<FamilySession | null> {
  const fromLink = await acceptEmailLinkFromUrl()
  if (fromLink) return fromLink
  const { data, error } = await getFamilyClient().auth.getSession()
  if (error) throw new Error(authErrorMessage(error))
  return normalizeSession(data.session)
}

export async function getValidSession(): Promise<FamilySession> {
  const previouslySaved = readFamilySession()
  const { data, error } = await getFamilyClient().auth.getSession()
  if (error) throw new Error(authErrorMessage(error))
  const session = normalizeSession(data.session)
  if (!session)
    throw new Error(
      previouslySaved
        ? "Ta connexion a expiré. Reconnecte-toi par e-mail."
        : "Connecte-toi avec ton adresse e-mail pour continuer.",
    )
  return session
}

export async function familyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré. Consulte README.md.")
  const session = await getValidSession()
  const headers = new Headers(options.headers)
  headers.set("apikey", config.anonKey)
  headers.set("Authorization", `Bearer ${session.access_token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  const response = await fetchWithTimeout(`${config.url}${path}`, { ...options, headers })
  if (!response.ok) {
    const message = await readError(response)
    if (response.status === 401 && readFamilySession()?.access_token === session.access_token)
      await clearFamilySession()
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
