const fs=require('node:fs'),path=require('node:path')
;(async()=>{
const root=path.join(__dirname,'..')
const canvas=require('@napi-rs/canvas')
globalThis.DOMMatrix=canvas.DOMMatrix;globalThis.Path2D=canvas.Path2D;globalThis.ImageData=canvas.ImageData
const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs')
const task=pdf.getDocument({data:new Uint8Array(fs.readFileSync(path.join(root,'public/Livret_de_la_Beer_Road.pdf'))),standardFontDataUrl:path.join(root,'public/pdfjs/standard_fonts/'),cMapUrl:path.join(root,'public/pdfjs/cmaps/'),cMapPacked:true,wasmUrl:path.join(root,'public/pdfjs/wasm/')})
try{
const doc=await task.promise
for(const index of [1,doc.numPages]){
 const page=await doc.getPage(index),viewport=page.getViewport({scale:1}),surface=canvas.createCanvas(viewport.width,viewport.height)
 await page.render({canvasContext:surface.getContext('2d'),viewport}).promise
 console.log(`PDF réel : page ${index}/${doc.numPages} rendue (${surface.width} × ${surface.height})`)
}
}finally{await task.destroy()}
})().catch(e=>{console.error(e);process.exitCode=1})
