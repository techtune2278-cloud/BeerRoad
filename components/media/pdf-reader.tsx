"use client"
import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export function PdfReader({url,title}:{url:string;title:string}) {
 const container=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null)
 const [doc,setDoc]=useState<PDFDocumentProxy|null>(null),[page,setPage]=useState(1),[width,setWidth]=useState(320),[zoom,setZoom]=useState(1),[error,setError]=useState(''),[loading,setLoading]=useState(true)
 useEffect(()=>{
  const node=container.current;if(!node)return
  const update=()=>setWidth(Math.max(200,node.clientWidth))
  update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect()
 },[])
 useEffect(()=>{
  let active=true;let task:ReturnType<typeof import('pdfjs-dist').getDocument>|undefined
  setDoc(null);setPage(1);setError('');setLoading(true)
  void import('pdfjs-dist').then(async pdf=>{
   if(!active)return
   pdf.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString()
   task=pdf.getDocument({url,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'})
   const loaded=await task.promise
   if(active)setDoc(loaded)
  }).catch(()=>{if(active){setError('Le livre ne peut pas être affiché ici. Utilise « Ouvrir le PDF en grand » ou télécharge-le.');setLoading(false)}})
  return()=>{active=false;void task?.destroy()}
 },[url])
 useEffect(()=>{
  if(!doc||!canvas.current)return
  let active=true;let render:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined
  setLoading(true);setError('')
  void doc.getPage(page).then(async pdfPage=>{
   if(!active||!canvas.current)return
   const base=pdfPage.getViewport({scale:1})
   const scale=width/base.width*zoom,ratio=Math.min(window.devicePixelRatio||1,2)
   const viewport=pdfPage.getViewport({scale:scale*ratio})
   const node=canvas.current
   node.width=Math.floor(viewport.width);node.height=Math.floor(viewport.height)
   node.style.width=`${viewport.width/ratio}px`;node.style.height=`${viewport.height/ratio}px`
   render=pdfPage.render({canvas:node,viewport})
   await render.promise
   if(active)setLoading(false)
  }).catch(e=>{if(active&&e?.name!=='RenderingCancelledException'){setError('Cette page n’a pas pu être affichée.');setLoading(false)}})
  return()=>{active=false;render?.cancel()}
 },[doc,page,width,zoom])
 return <div ref={container} className="min-w-0">
  {doc&&<div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
   <button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-full border px-3 py-2 disabled:opacity-40">Précédente</button>
   <span aria-live="polite">Page {page} / {doc.numPages}</span>
   <button type="button" disabled={page>=doc.numPages} onClick={()=>setPage(p=>p+1)} className="rounded-full border px-3 py-2 disabled:opacity-40">Suivante</button>
   <label>Zoom <select aria-label="Zoom du livre" value={zoom} onChange={e=>setZoom(Number(e.target.value))} className="rounded border bg-background p-1"><option value={1}>Largeur</option><option value={1.5}>150 %</option><option value={2}>200 %</option></select></label>
  </div>}
  {loading&&<p role="status" className="text-sm">Chargement du livre…</p>}
  {error&&<p role="alert" className="text-sm">{error}</p>}
  <div className="max-h-[65vh] overflow-auto rounded border bg-white"><canvas ref={canvas} role="img" aria-label={`${title}, page ${page}`} className={loading?'invisible':'block'}/></div>
  <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm underline">Ouvrir le PDF en grand</a>
 </div>
}
