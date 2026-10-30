import type { Universe } from "@/src/data/beerRoadData"
import {
  familyRequest,
  fetchWithTimeout,
  getSupabaseConfig,
  getValidSession,
  readError,
  type CommunityPost,
  type FamilyEvent,
  type FamilyMember,
} from "./family-auth"
const BUCKET = "family-media"
export async function getFamilyMember(email: string): Promise<FamilyMember | null> {
  const query = new URLSearchParams({
    select: "email,display_name",
    email: `eq.${email.toLowerCase()}`,
    limit: "1",
  })
  const members = await familyRequest<FamilyMember[]>(`/rest/v1/family_members?${query.toString()}`)
  return members[0] || null
}

export type PostQuery = {
  universe?: Universe | "all"
  section?: string
  author?: string
  before?: { created_at: string; id: string }
}
export const POSTS_PAGE_SIZE = 12
export async function listCommunityPosts(filters: PostQuery = {}): Promise<CommunityPost[]> {
  const query = new URLSearchParams({
    select:
      "id,created_at,author_email,author_name,universe_slug,section_label,title,body,media_path,media_type,external_url",
    order: "created_at.desc,id.desc",
    limit: String(POSTS_PAGE_SIZE),
  })
  if (filters.universe && filters.universe !== "all")
    query.set("universe_slug", `eq.${filters.universe}`)
  if (filters.section && filters.section !== "all")
    query.set("section_label", `eq.${filters.section}`)
  if (filters.author) query.set("author_email", `eq.${filters.author.toLowerCase()}`)
  if (filters.before)
    query.set(
      "or",
      `(created_at.lt.${filters.before.created_at},and(created_at.eq.${filters.before.created_at},id.lt.${filters.before.id}))`,
    )
  return familyRequest<CommunityPost[]>(`/rest/v1/community_posts?${query}`)
}

export async function listFamilyEvents(): Promise<FamilyEvent[]> {
  const query = new URLSearchParams({
    select:
      "id,created_at,author_email,author_name,title,details,start_at,end_at,location,event_type",
    order: "start_at.asc",
    start_at: `gte.${new Date(new Date().setHours(0, 0, 0, 0)).toISOString()}`,
  })
  return familyRequest<FamilyEvent[]>(`/rest/v1/family_events?${query.toString()}`)
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")
}

export async function uploadFamilyMedia(
  file: File,
  userId: string,
): Promise<{ path: string; mediaType: string }> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré.")
  const session = await getValidSession()
  const safeName =
    file.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(-90) || "fichier"
  const path = `${userId}/${Date.now()}-${safeName}`
  const response = await fetchWithTimeout(
    `${config.url}/storage/v1/object/${BUCKET}/${encodeStoragePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: file,
    },
    120000,
  )
  if (!response.ok) throw new Error(await readError(response))
  const mediaType = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : "document"
  return { path, mediaType }
}

export async function createSignedMediaUrl(path: string): Promise<string> {
  const config = getSupabaseConfig()
  if (!config) throw new Error("Supabase n'est pas configuré.")
  const result = await familyRequest<{ signedURL?: string; signedUrl?: string }>(
    `/storage/v1/object/sign/${BUCKET}/${encodeStoragePath(path)}`,
    {
      method: "POST",
      body: JSON.stringify({ expiresIn: 3600 }),
    },
  )
  const signedUrl = result.signedURL || result.signedUrl
  if (!signedUrl) throw new Error("Le média n'a pas pu être ouvert.")
  return signedUrl.startsWith("http") ? signedUrl : `${config.url}/storage/v1${signedUrl}`
}

export async function createCommunityPost(input: {
  authorEmail: string
  authorName: string
  universe: Universe
  sectionLabel: string
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
    body: JSON.stringify([
      {
        author_email: input.authorEmail.toLowerCase(),
        author_name: input.authorName,
        universe_slug: input.universe,
        section_label: input.sectionLabel.trim() || "Contributions générales",
        title: input.title.trim(),
        body: input.body.trim() || null,
        media_path: mediaPath,
        media_type: mediaType,
        external_url: input.externalUrl?.trim() || null,
      },
    ]),
  })
  const post = rows[0]
  return post
}

/** Met à jour une contribution. Les permissions Supabase limitent la modification à son auteur. */
export async function updateCommunityPost(
  id: string,
  existing: CommunityPost,
  input: {
    universe: Universe
    sectionLabel: string
    title: string
    body: string
    file?: File | null
    userId: string
    externalUrl?: string
    removeExistingMedia?: boolean
  },
): Promise<CommunityPost> {
  let mediaPath = existing.media_path
  let mediaType = existing.media_type
  if (input.file) {
    const uploaded = await uploadFamilyMedia(input.file, input.userId)
    mediaPath = uploaded.path
    mediaType = uploaded.mediaType
  } else if (input.removeExistingMedia) {
    mediaPath = null
    mediaType = null
  }

  try {
    const rows = await familyRequest<CommunityPost[]>(
      `/rest/v1/community_posts?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          universe_slug: input.universe,
          section_label: input.sectionLabel.trim() || "Contributions générales",
          title: input.title.trim(),
          body: input.body.trim() || null,
          media_path: mediaPath,
          media_type: mediaType,
          external_url: input.externalUrl?.trim() || null,
        }),
      },
    )
    if (!rows.length)
      throw new Error(
        "La contribution n'a pas été modifiée. Vérifie que tu en es bien l'auteur et réessaie.",
      )
    const updated = rows[0]

    if (existing.media_path && existing.media_path !== mediaPath) {
      // Le nettoyage du fichier précédent ne doit pas annuler une modification déjà enregistrée.
      try {
        await familyRequest<void>(
          `/storage/v1/object/${BUCKET}/${encodeStoragePath(existing.media_path)}`,
          { method: "DELETE" },
        )
      } catch {
        /* fichier orphelin éventuel : la contribution reste bien modifiée */
      }
    }
    return updated
  } catch (error) {
    // Si l'enregistrement a échoué après l'envoi d'un nouveau fichier, on tente de le retirer.
    if (input.file && mediaPath && mediaPath !== existing.media_path) {
      try {
        await familyRequest<void>(`/storage/v1/object/${BUCKET}/${encodeStoragePath(mediaPath)}`, {
          method: "DELETE",
        })
      } catch {
        /* nettoyage best effort */
      }
    }
    throw error
  }
}

/** Supprime la publication de son auteur, puis tente de supprimer son fichier associé. */
export async function deleteCommunityPost(post: CommunityPost): Promise<void> {
  await familyRequest<void>(`/rest/v1/community_posts?id=eq.${encodeURIComponent(post.id)}`, {
    method: "DELETE",
  })
  if (post.media_path) {
    try {
      await familyRequest<void>(
        `/storage/v1/object/${BUCKET}/${encodeStoragePath(post.media_path)}`,
        { method: "DELETE" },
      )
    } catch {
      /* la publication a été supprimée ; seul un fichier inutilisé peut rester */
    }
  }
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
    body: JSON.stringify([
      {
        author_email: input.authorEmail.toLowerCase(),
        author_name: input.authorName,
        title: input.title.trim(),
        details: input.details.trim() || null,
        start_at: input.startAt,
        end_at: input.endAt || null,
        location: input.location.trim() || null,
        event_type: input.eventType,
      },
    ]),
  })
  return rows[0]
}

export async function updateFamilyEvent(
  id: string,
  input: {
    title: string
    details: string
    startAt: string
    endAt?: string
    location: string
    eventType: FamilyEvent["event_type"]
  },
): Promise<FamilyEvent> {
  const rows = await familyRequest<FamilyEvent[]>(
    `/rest/v1/family_events?id=eq.${encodeURIComponent(id)}`,
    {
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
    },
  )
  if (!rows[0]) throw new Error("Rendez-vous introuvable ou modification non autorisée.")
  return rows[0]
}

export async function deleteFamilyEvent(id: string): Promise<void> {
  await familyRequest<void>(`/rest/v1/family_events?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  )
}
