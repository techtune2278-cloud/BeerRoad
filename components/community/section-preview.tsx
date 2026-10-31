"use client"
import { useEffect, useState } from 'react'
import { listCommunityPosts, POSTS_PAGE_SIZE, type CommunityPost } from '@/lib/family-api'
import type { Universe } from '@/src/data/beerRoadData'
import { PostMedia } from './post-media'
export function SectionPreview({universe,section,connected,onMore}:{universe:Universe;section:string;connected:boolean;onMore:()=>void}) {
 const [posts,setPosts]=useState<CommunityPost[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{if(!connected)return;let active=true;setLoading(true);setError(false)
 void listCommunityPosts({universe,section}).then(rows=>{if(active)setPosts(rows)}).catch(()=>{if(active)setError(true)}).finally(()=>{if(active)setLoading(false)})
 return()=>{active=false}
 },[universe,section,connected,attempt])
 if(!connected)return <p className="mt-2 text-sm text-muted-foreground">Connecte-toi via le carnet pour découvrir les publications de la famille.</p>
 if(loading)return <p role="status" className="mt-2 text-sm">Chargement…</p>
 if(error)return <p role="alert" className="mt-2 text-sm">Chargement impossible. <button className="underline" onClick={()=>setAttempt(n=>n+1)}>Réessayer</button></p>
 if(!posts.length)return <p className="mt-2 text-sm text-muted-foreground">Pas encore de publication. À toi de commencer dans l’espace de contributions ci-dessous.</p>
 return <div className="mt-3 space-y-3">{posts.map(post=><article key={post.id} className="rounded-xl border border-border bg-background p-3"><h4 className="font-semibold">{post.title}</h4><p className="text-xs text-muted-foreground">{post.author_name}</p>{post.body&&<p className="mt-2 whitespace-pre-wrap break-words text-sm">{post.body}</p>}{post.external_url&&/^https?:\/\//i.test(post.external_url)&&<a className="mt-2 inline-block text-sm underline" href={post.external_url} target="_blank" rel="noopener noreferrer">Ouvrir le lien</a>}<PostMedia post={post}/></article>)}{posts.length===POSTS_PAGE_SIZE&&<button type="button" onClick={onMore} className="text-sm underline">Voir la suite dans le carnet</button>}</div>
}
