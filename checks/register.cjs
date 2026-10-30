const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const root = path.resolve(__dirname, '..')
const resolve = Module._resolveFilename
Module._resolveFilename = function(id, parent, ...rest) {
 if(id.startsWith('@/')) id = path.join(root, id.slice(2))
 return resolve.call(this, id, parent, ...rest)
}
const load = Module._load
Module._load = function(id, ...rest) {
 if(id === '@/src/data/beerRoadData') return { plaques: ['origines','transmission','atelier','grenier','kerhuon','legendes','avenir'].map(universe=>({universe,name:universe,content:{}})) }
 return load.call(this,id,...rest)
}
for(const extension of ['.ts','.tsx']) require.extensions[extension] = (mod, filename) => {
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true} }).outputText
 mod._compile(code,filename)
}
