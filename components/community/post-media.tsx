"use client"
import { createSignedMediaUrl, type CommunityPost } from "@/lib/family-api"
import { useCallback, useEffect, useRef, useState } from "react"

export function PostMedia({ post }: { post: CommunityPost }) {
  const element = useRef<HTMLDivElement>(null)
  const player = useRef<HTMLMediaElement | null>(null)
  const signedAt = useRef(0)
  const refreshing = useRef(false)
  const resumeAt = useRef(0)
  const [visible, setVisible] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const renewIfIdle = useCallback(() => {
    if (!url || refreshing.current || Date.now() - signedAt.current < 50 * 60 * 1000) return
    if (player.current && !player.current.paused && !player.current.ended) return
    resumeAt.current = player.current?.currentTime || 0
    refreshing.current = true
    setAttempt((value) => value + 1)
  }, [url])
  useEffect(() => {
    if (!url) return
    const timer = window.setInterval(renewIfIdle, 60000)
    window.addEventListener("focus", renewIfIdle)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", renewIfIdle)
    }
  }, [url, renewIfIdle])
  useEffect(() => {
    if (!element.current) return
    if (!("IntersectionObserver" in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" },
    )
    observer.observe(element.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!visible || !post.media_path) return
    let active = true
    setError(false)
    refreshing.current = true
    void createSignedMediaUrl(post.media_path)
      .then((value) => {
        if (active) {
          signedAt.current = Date.now()
          setUrl(value)
        }
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) refreshing.current = false
      })
    return () => {
      active = false
    }
  }, [visible, post.media_path, attempt])
  if (!post.media_path) return null
  return (
    <div ref={element} className="mt-4 min-h-12">
      {error ? (
        <button onClick={() => setAttempt((value) => value + 1)} className="text-sm underline">
          Média indisponible — réessayer
        </button>
      ) : !url ? (
        <p className="text-sm text-muted-foreground">Chargement du média…</p>
      ) : post.media_type === "image" ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={post.title}
            loading="lazy"
            onError={() => setError(true)}
            className="max-h-[420px] w-full rounded-xl object-contain"
          />
        </a>
      ) : post.media_type === "video" ? (
        <video
          ref={(node) => {
            player.current = node
          }}
          onPause={renewIfIdle}
          onEnded={renewIfIdle}
          onLoadedMetadata={() => {
            if (player.current && resumeAt.current > 0)
              player.current.currentTime = resumeAt.current
          }}
          controls
          preload="none"
          src={url}
          onError={() => setError(true)}
          className="max-h-[420px] w-full rounded-xl"
        />
      ) : post.media_type === "audio" ? (
        <audio
          ref={(node) => {
            player.current = node
          }}
          onPause={renewIfIdle}
          onEnded={renewIfIdle}
          onLoadedMetadata={() => {
            if (player.current && resumeAt.current > 0)
              player.current.currentTime = resumeAt.current
          }}
          controls
          preload="none"
          src={url}
          onError={() => setError(true)}
          className="w-full"
        />
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="text-sm underline">
          Ouvrir le document
        </a>
      )}
    </div>
  )
}
