import type { FamilyEvent } from "@/lib/family-api"
import { plaques, type Universe } from "@/src/data/beerRoadData"
import { ExternalLink, FileText, Image as ImageIcon, Music2, Video } from "lucide-react"
export type HubTab = "carnet" | "agenda"

export const allowedFileTypes =
  "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/x-wav,application/pdf"
export const imageVideoTypes =
  "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,video/quicktime"
export const audioTypes = "audio/mpeg,audio/mp4,audio/wav,audio/x-wav"
export type ContributionIntent = "any" | "text" | "image-video" | "audio"
export type EventType = FamilyEvent["event_type"]
export const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "sejour", label: "Séjour / retrouvailles" },
  { value: "anniversaire", label: "Anniversaire / fête" },
  { value: "travaux", label: "Ker Huon / travaux" },
  { value: "projet", label: "Projet commun" },
  { value: "autre", label: "Autre" },
]
export function eventTypeName(value: EventType) {
  return eventTypeOptions.find((option) => option.value === value)?.label || "Autre"
}
export const universeOptions = plaques.map((plaque) => ({
  value: plaque.universe,
  label: plaque.name,
}))

export function universeName(universe: Universe) {
  return plaques.find((plaque) => plaque.universe === universe)?.name || "La Beer Road"
}

export function sectionsForUniverse(universe: Universe) {
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

export function fileKind(file: File) {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "document"
}

export function ExternalLinkIcon() {
  return <ExternalLink className="size-4" />
}

export function mediaIcon(kind: string) {
  if (kind === "image") return <ImageIcon className="size-4" />
  if (kind === "video") return <Video className="size-4" />
  if (kind === "audio") return <Music2 className="size-4" />
  return <FileText className="size-4" />
}

export type AuthStatus = {
  status: "checking" | "connected" | "disconnected"
  label: string
  email?: string
}
export type ContributionRequest = {
  universe: Universe
  section: string
  target: "carnet" | "agenda" | "feed"
  nonce: number
}
