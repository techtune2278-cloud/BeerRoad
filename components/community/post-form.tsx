"use client"

import { type CommunityPost } from "@/lib/family-api"
import { type Universe } from "@/src/data/beerRoadData"
import { Send, Upload, X } from "lucide-react"
import type { FormEvent } from "react"

import {
  allowedFileTypes,
  audioTypes,
  fileKind,
  imageVideoTypes,
  mediaIcon,
  universeName,
  universeOptions,
  type ContributionIntent,
} from "./shared"

type Props = {
  editingPostId: string | null
  postUniverse: Universe
  setPostUniverse: (value: Universe) => void
  postSection: string
  setPostSection: (value: string) => void
  postSectionOptions: string[]
  postTitle: string
  setPostTitle: (value: string) => void
  postBody: string
  setPostBody: (value: string) => void
  editingPost: CommunityPost | null
  removeExistingMedia: boolean
  setRemoveExistingMedia: (value: boolean) => void
  postIntent: ContributionIntent
  postFile: File | null
  setPostFile: (value: File | null) => void
  postExternalUrl: string
  setPostExternalUrl: (value: string) => void
  loading: boolean
  handleCreatePost: (event: FormEvent<HTMLFormElement>) => Promise<void>
  resetPostForm: () => void
  setError: (value: string) => void
  setNotice: (value: string) => void
}
export function PostForm({
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
}: Props) {
  return (
    <form
      id="community-post-form"
      onSubmit={handleCreatePost}
      className="scroll-mt-6 self-start rounded-2xl border border-border bg-background p-5"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
          <Upload className="size-4 text-primary" />
        </span>
        <h3 className="font-semibold">
          {editingPostId ? "Modifier ma contribution" : "Déposer une contribution"}
        </h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Chaque dépôt est classé dans un univers précis et devient visible aux membres autorisés.
      </p>
      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
        <span className="block">
          <strong>Univers :</strong> {universeName(postUniverse)}
        </span>
        <span className="mt-1 block">
          <strong>Rubrique :</strong> {postSection}
        </span>
        {postIntent !== "any" && (
          <span className="block mt-1 text-muted-foreground">
            Type préparé :{" "}
            {postIntent === "text"
              ? "texte / anecdote"
              : postIntent === "audio"
                ? "audio / MP3"
                : "photo / vidéo"}
            . Tu peux encore le modifier.
          </span>
        )}
      </div>
      <label htmlFor="post-universe" className="mt-4 block text-sm font-medium">
        Univers concerné
      </label>
      <select
        id="post-universe"
        value={postUniverse}
        onChange={(event) => {
          const nextUniverse = event.target.value as Universe
          setPostUniverse(nextUniverse)
          setPostSection("Contributions générales")
          setPostTitle("")
        }}
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        {universeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label htmlFor="post-section" className="mt-4 block text-sm font-medium">
        Rubrique précise dans cet univers
      </label>
      <select
        id="post-section"
        value={postSection}
        onChange={(event) => {
          setPostSection(event.target.value)
          setPostTitle(event.target.value === "Contributions générales" ? "" : event.target.value)
        }}
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        {postSectionOptions.map((section) => (
          <option key={section} value={section}>
            {section}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Une publication est classée à la fois dans un univers et dans cette rubrique.
      </p>
      <label htmlFor="post-title" className="mt-4 block text-sm font-medium">
        Titre
      </label>
      <input
        id="post-title"
        required
        maxLength={140}
        value={postTitle}
        onChange={(event) => setPostTitle(event.target.value)}
        placeholder="Le fameux incident du barbecue…"
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <label htmlFor="post-body" className="mt-4 block text-sm font-medium">
        Raconte ou ajoute un commentaire
      </label>
      <textarea
        id="post-body"
        rows={4}
        value={postBody}
        onChange={(event) => setPostBody(event.target.value)}
        placeholder="Le contexte, la date, les personnes présentes, pourquoi c'est culte…"
        className="mt-1.5 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      {editingPostId && editingPost?.media_path && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
          <p className="font-medium">Un fichier est déjà associé à cette contribution.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sans nouveau fichier, il sera conservé, sauf si tu coches l'option ci-dessous.
          </p>
          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={removeExistingMedia}
              onChange={(event) => setRemoveExistingMedia(event.target.checked)}
            />
            Retirer le fichier actuel
          </label>
        </div>
      )}
      <label htmlFor="community-file" className="mt-4 block text-sm font-medium">
        {editingPostId
          ? "Remplacer par un nouveau fichier (facultatif)"
          : "Joindre un petit fichier (facultatif)"}
      </label>
      <input
        id="community-file"
        type="file"
        accept={
          postIntent === "image-video"
            ? imageVideoTypes
            : postIntent === "audio"
              ? audioTypes
              : allowedFileTypes
        }
        onChange={(event) => setPostFile(event.target.files?.[0] || null)}
        className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground hover:file:bg-secondary/80"
      />
      {postFile && (
        <p className="mt-2 break-all text-xs text-muted-foreground">
          {mediaIcon(fileKind(postFile))}{" "}
          <span className="ml-1">
            {postFile.name} · {(postFile.size / (1024 * 1024)).toFixed(1)} Mo
          </span>
          <button
            type="button"
            onClick={() => {
              setPostFile(null)
              const input = document.getElementById("community-file") as HTMLInputElement | null
              if (input) input.value = ""
            }}
            className="ml-2 underline"
          >
            Retirer
          </button>
        </p>
      )}
      <label htmlFor="post-external-url" className="mt-4 block text-sm font-medium">
        Lien vers un média hébergé ailleurs
      </label>
      <input
        id="post-external-url"
        type="url"
        inputMode="url"
        value={postExternalUrl}
        onChange={(event) => setPostExternalUrl(event.target.value)}
        placeholder="https://… (YouTube, Drive partagé, etc.)"
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Pour un film, une longue vidéo ou un gros MP3, privilégie un lien externe. Vérifie les
        droits de partage du fichier.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="size-4" />
        {loading
          ? "Enregistrement…"
          : editingPostId
            ? "Enregistrer les modifications"
            : `Publier dans « ${universeName(postUniverse)} »`}
      </button>
      {editingPostId && (
        <button
          type="button"
          onClick={() => {
            resetPostForm()
            setError("")
            setNotice("")
          }}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
        >
          <X className="size-4" />
          Annuler la modification
        </button>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Taille conseillée pour les petits fichiers téléversés : photo/PDF 10 Mo, MP3 20 Mo, vidéo
        courte 25 Mo. Au-delà, utilise un lien externe.
      </p>
    </form>
  )
}
