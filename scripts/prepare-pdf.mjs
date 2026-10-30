import { cpSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const require=createRequire(import.meta.url)
const source=dirname(require.resolve('pdfjs-dist/package.json'))
const target=join(dirname(fileURLToPath(import.meta.url)),'../public/pdfjs')
mkdirSync(target,{recursive:true})
writeFileSync(join(target,".gitignore"),"*\n")
for(const folder of ['cmaps','standard_fonts','wasm'])cpSync(join(source,folder),join(target,folder),{recursive:true})
cpSync(join(source,'LICENSE'),join(target,'LICENSE'))
