"use client"

import {
  createCommunityPost,
  deleteCommunityPost,
  listCommunityPosts,
  updateCommunityPost,
  type CommunityPost,
  type FamilyMember,
  type FamilySession,
} from "@/lib/family-api"
import { type Universe } from "@/src/data/beerRoadData"
import { HeartHandshake, Pencil, Trash2 } from "lucide-react"
import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { POSTS_PAGE_SIZE } from "@/lib/family-api"
import { PostForm } from "./post-form"
import { PostMedia } from "./post-media"
import {
  ExternalLinkIcon,
  fileKind,
  isRecommendation,
  sectionsForUniverse,
  universeName,
  universeOptions,
  type ContributionIntent,
  type ContributionRequest,
} from "./shared"
type Props = {
  session: FamilySession
  member: FamilyMember
  contributionRequest: ContributionRequest
  enabled: boolean
  onSessionError: () => void
}
export function PostsPanel({
  session,
  member,
  contributionRequest,
  enabled,
  onSessionError,
}: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
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
  const [postUniverse, setPostUniverse] = useState<Universe>(contributionRequest.universe)
  const [postSection, setPostSection] = useState<string>(
    contributionRequest.section || "Contributions générales",
  )
  const [feedUniverse, setFeedUniverse] = useState<Universe | "all">("all")
  const [feedSection, setFeedSection] = useState<string | "all">("all")
  const [feedOnlyMine, setFeedOnlyMine] = useState(false)
  const [postIntent, setPostIntent] = useState<ContributionIntent>("any")
  const [postTitle, setPostTitle] = useState("")
  const [postBody, setPostBody] = useState("")
  const [postFile, setPostFile] = useState<File | null>(null)
  const [postExternalUrl, setPostExternalUrl] = useState("")
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false)

  const [hasMore, setHasMore] = useState(false)
  const [loadError, setLoadError] = useState("")
  const cursor = useRef<CommunityPost | undefined>(undefined)
  const load = useCallback(
    async (more = false) => {
      const ticket = ++generation.current
      setFetching(true)
      setLoadError("")
      if (!more) {
        setPosts([])
        cursor.current = undefined
        setHasMore(false)
      }
      try {
        const rows = await listCommunityPosts({
          universe: feedUniverse,
          section: feedSection,
          author: feedOnlyMine ? session.user.email : undefined,
          before: more ? cursor.current : undefined,
        })
        if (ticket !== generation.current) return
        setPosts((previous) =>
          more
            ? [...previous, ...rows.filter((row) => !previous.some((old) => old.id === row.id))]
            : rows,
        )
        cursor.current = rows[rows.length - 1]
        setHasMore(rows.length === POSTS_PAGE_SIZE)
      } catch (cause) {
        if (ticket !== generation.current) return
        onSessionError()
        setLoadError(cause instanceof Error ? cause.message : "Chargement impossible.")
      } finally {
        if (ticket === generation.current) setFetching(false)
      }
    },
    [feedUniverse, feedSection, feedOnlyMine, session.user.email, onSessionError],
  )
  useEffect(() => {
    if (!activated) return
    void load()
    return () => {
      generation.current++
    }
  }, [activated, load])
  const intentHandled = useRef(0)
  useEffect(() => {
    if (
      !enabled ||
      contributionRequest.nonce === 0 ||
      contributionRequest.target === "agenda" ||
      intentHandled.current === contributionRequest.nonce
    )
      return
    intentHandled.current = contributionRequest.nonce
    setPostUniverse(contributionRequest.universe)
    setPostSection(contributionRequest.section || "Contributions générales")
    setFeedUniverse(contributionRequest.universe)
    setFeedSection(contributionRequest.section || "all")
    setEditingPostId(null)
    setEditingPost(null)
    setPostBody("")
    setPostFile(null)
    setPostExternalUrl("")
    setRemoveExistingMedia(false)
    setPostIntent("any")
    setPostTitle(
      contributionRequest.target === "feed"
        ? ""
        : (contributionRequest.section === "Contributions générales" || isRecommendation(contributionRequest.universe,contributionRequest.section))
          ? ""
          : contributionRequest.section,
    )
    setFormOpen(contributionRequest.target === "carnet")
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(
          contributionRequest.target === "feed" ? "community-feed" : "community-post-form",
        )
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    )
    return () => cancelAnimationFrame(frame)
  }, [enabled, contributionRequest])
  function resetPostForm() {
    setEditingPostId(null)
    setEditingPost(null)
    setPostTitle("")
    setPostBody("")
    setPostFile(null)
    setPostExternalUrl("")
    setRemoveExistingMedia(false)
    const fileInput = document.getElementById("community-file") as HTMLInputElement | null
    if (fileInput) fileInput.value = ""
  }

  function beginEditPost(post: CommunityPost) {
    setFormOpen(true)
    setEditingPostId(post.id)
    setEditingPost(post)
    setPostUniverse(post.universe_slug)
    setPostSection(post.section_label || "Contributions générales")
    setPostTitle(post.title)
    setPostBody(post.body || "")
    setPostExternalUrl(post.external_url || "")
    setPostFile(null)
    setRemoveExistingMedia(false)
    setPostIntent("any")
    setError("")
    setNotice(`Modification de « ${post.title} ».`)
    window.requestAnimationFrame(() =>
      document
        .getElementById("community-post-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    )
  }

  async function handleDeletePost(post: CommunityPost) {
    if (!session || post.author_email.toLowerCase() !== session.user.email.toLowerCase()) return
    if (
      !window.confirm(`Supprimer définitivement « ${post.title} » ? Cette action est irréversible.`)
    )
      return
    setError("")
    setNotice("")
    setLoading(true)
    try {
      await deleteCommunityPost(post)
      setPosts((current) => current.filter((item) => item.id !== post.id))
      if (editingPostId === post.id) resetPostForm()
      setNotice("Ta contribution a été supprimée.")
    } catch (err) {
      onSessionError()
      setError(err instanceof Error ? err.message : "La contribution n'a pas pu être supprimée.")
    } finally {
      setLoading(false)
    }
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
        if (postFile.size > limit * 1024 * 1024)
          throw new Error(
            `Le fichier dépasse la limite conseillée de ${limit} Mo. Pour un média plus lourd, utilise le champ « Lien vers un média ».`,
          )
      }
      if (postExternalUrl.trim()) {
        let parsed: URL
        try {
          parsed = new URL(postExternalUrl.trim())
        } catch {
          throw new Error("Le lien du média n'est pas une URL valide.")
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
          throw new Error("Le lien doit commencer par https:// ou http://.")
        if (postFile)
          throw new Error(
            "Choisis soit un fichier à téléverser, soit un lien externe, pas les deux.",
          )
        const currentlyEdited = editingPostId ? editingPost : null
        if (currentlyEdited?.media_path && !removeExistingMedia)
          throw new Error(
            "Cette contribution possède déjà un fichier. Pour le remplacer par un lien externe, coche d'abord « Retirer le fichier actuel ».",
          )
      }
      if (isRecommendation(postUniverse,postSection) && !postBody.trim()) throw new Error("Ajoute un petit commentaire pour expliquer ta recommandation.")
      if (!postTitle.trim()) throw new Error("Donne un titre à ta contribution.")
      const existingPost = editingPostId ? editingPost : null
      const hasExistingMedia = Boolean(existingPost?.media_path && !removeExistingMedia)
      if (!postBody.trim() && !postFile && !postExternalUrl.trim() && !hasExistingMedia)
        throw new Error("Ajoute un texte, joins un petit fichier ou colle un lien vers le média.")

      if (editingPostId && existingPost) {
        const updated = await updateCommunityPost(editingPostId, existingPost, {
          universe: postUniverse,
          sectionLabel: postSection,
          title: postTitle,
          body: postBody,
          file: postFile,
          externalUrl: postExternalUrl.trim() || undefined,
          userId: session.user.id,
          removeExistingMedia,
        })
        setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)))
        setNotice("Ta contribution a été modifiée.")
      } else {
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
        setNotice("Contribution publiée dans le carnet de la tribu. Merci !")
      }
      setFeedUniverse(postUniverse)
      setFeedSection(postSection)
      resetPostForm()
      setFormOpen(false)
    } catch (err) {
      onSessionError()
      setError(err instanceof Error ? err.message : "La contribution n'a pas pu être enregistrée.")
    } finally {
      setLoading(false)
    }
  }

  const visiblePosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          (feedUniverse === "all" || post.universe_slug === feedUniverse) &&
          (feedSection === "all" ||
            (post.section_label || "Contributions générales") === feedSection) &&
          (!feedOnlyMine ||
            post.author_email.toLowerCase() === (session?.user.email || "").toLowerCase()),
      ),
    [posts, feedUniverse, feedSection, feedOnlyMine, session?.user.email],
  )
  const postSectionOptions = useMemo(
    () => Array.from(new Set([...sectionsForUniverse(postUniverse), postSection])),
    [postUniverse, postSection],
  )
  const feedSectionOptions = useMemo(
    () => (feedUniverse === "all" ? [] : sectionsForUniverse(feedUniverse)),
    [feedUniverse],
  )

  const formProps = {
    editingPostId,
    postUniverse,
    setPostUniverse,
    postSection,
    setPostSection,
    postSectionOptions,
    postTitle,
    setPostTitle,
    postBody,
    setPostBody,
    editingPost,
    removeExistingMedia,
    setRemoveExistingMedia,
    postIntent,
    postFile,
    setPostFile,
    postExternalUrl,
    setPostExternalUrl,
    loading,
    handleCreatePost,
    resetPostForm,
    setError,
    setNotice,
  }
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
          {formOpen ? "Fermer le formulaire" : "Ajouter une contribution"}
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
      {loadError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {loadError}{" "}
          <button type="button" onClick={() => void load()} className="underline">
            Réessayer
          </button>
        </p>
      )}
      <div className="mt-5 space-y-5">
        {formOpen && <PostForm {...formProps} />}

        <div>
          <div
            id="community-feed"
            className="mb-3 scroll-mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <h3 className="font-serif text-2xl font-semibold">Les dernières traces</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Les contributions rangées par univers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {session && (
                <button
                  type="button"
                  onClick={() => setFeedOnlyMine((value) => !value)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold ${feedOnlyMine ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                >
                  {feedOnlyMine ? "Toutes les contributions" : "Mes contributions"}
                </button>
              )}
              <label htmlFor="feed-universe" className="sr-only">
                Filtrer par univers
              </label>
              <select
                id="feed-universe"
                value={feedUniverse}
                onChange={(event) => {
                  setFeedUniverse(event.target.value as Universe | "all")
                  setFeedSection("all")
                }}
                className="max-w-[230px] rounded-full border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="all">Tous les univers</option>
                {universeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {feedUniverse !== "all" && (
                <select
                  aria-label="Filtrer par rubrique"
                  value={feedSection}
                  onChange={(event) => setFeedSection(event.target.value)}
                  className="max-w-[210px] rounded-full border border-border bg-background px-3 py-2 text-xs"
                >
                  <option value="all">Toutes les rubriques</option>
                  {feedSectionOptions.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              )}
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                {visiblePosts.length}
              </span>
            </div>
          </div>
          {fetching && posts.length === 0 ? (
            <p className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
              Chargement du carnet…
            </p>
          ) : loadError && posts.length === 0 ? null : visiblePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <HeartHandshake className="mx-auto size-8 text-primary" />
              <h4 className="mt-3 font-semibold">
                Aucune contribution ne correspond à ce filtre pour le moment
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Dépose la première trace, désactive « Mes contributions » ou choisis « Tous les
                univers » pour élargir la recherche.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-border bg-background p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
                      {universeName(post.universe_slug)}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1">
                      {post.section_label || "Contributions générales"}
                    </span>
                    <span>
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                        new Date(post.created_at),
                      )}
                    </span>
                  </div>
                  <h4 className="mt-3 font-serif text-xl font-semibold">{post.title}</h4>
                  {post.body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {post.body}
                    </p>
                  )}
                  <PostMedia key={post.media_path || post.id} post={post} />
                  {post.external_url && (
                    <a
                      href={post.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                    >
                      <ExternalLinkIcon /> Ouvrir le média lié
                    </a>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Déposé par {post.author_name}</p>
                    {session &&
                      post.author_email.toLowerCase() === session.user.email.toLowerCase() && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => beginEditPost(post)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
                          >
                            <Pencil className="size-3.5" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => void handleDeletePost(post)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                            Supprimer
                          </button>
                        </div>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={fetching || loading}
          onClick={() => void load(true)}
          className="mt-4 w-full rounded-xl border border-border p-3 text-sm font-semibold"
        >
          {fetching ? "Chargement…" : "Voir les contributions précédentes"}
        </button>
      )}
    </>
  )
}
