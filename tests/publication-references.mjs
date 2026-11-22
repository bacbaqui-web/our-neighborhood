// Validate runtime references, not prose/source citations or arbitrary strings.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(process.argv[2]||'.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'config/publication-files.json')));
const files=new Set(manifest.files),generated=new Set(manifest.generatedFiles),missing=[],exceptions=new Set();
let checked=0;
function check(source,spec,kind){
 if(/^(?:https?:|data:|blob:|mailto:|#|\/\/)/i.test(spec)||!spec||spec.includes('${'))return;
 if(kind==='import'&&!spec.startsWith('.')&&!spec.startsWith('/'))return; // import-map bare specifier
 const clean=decodeURI(spec.split(/[?#]/)[0]);if(!clean)return;
 const target=path.posix.normalize(path.posix.join(path.posix.dirname(source),clean));
 checked++;
 const exception=manifest.referenceExceptions.find(e=>e.source===source&&e.target===target);
 if(exception){assert(exception.reason&&fs.readFileSync(path.join(root,source),'utf8').includes(exception.guard),'exception guard missing');exceptions.add(exception);return;}
 if(generated.has(target))return;
 if(!files.has(target)&&![...files].some(p=>p.startsWith(target.replace(/\/$/,'')+'/')))missing.push({source,spec,kind,target});
}
for(const file of files){
 if(!/\.(?:js|mjs|html|css)$/.test(file))continue;
 const source=fs.readFileSync(path.join(root,file),'utf8');
 if(/\.(?:js|mjs)$/.test(file)){
  for(const m of source.matchAll(/\b(?:from\s*|import\s*\(|import\s+)['"]([^'"]+)['"]/g))check(file,m[1],'import');
  for(const m of source.matchAll(/new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g))check(file,m[1],'module URL');
 }
 if(file.endsWith('.html')){
  for(const m of source.matchAll(/<(?:script|img|source)\b[^>]*\bsrc\s*=\s*['"]([^'"]+)['"]/gi))check(file,m[1],'HTML resource');
  for(const m of source.matchAll(/<link\b[^>]*\bhref\s*=\s*['"]([^'"]+)['"]/gi))check(file,m[1],'HTML link');
  for(const m of source.matchAll(/\b(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g))check(file,m[1],'import');
 }
 if(file.endsWith('.css'))for(const m of source.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))check(file,m[1],'CSS resource');
}
// Registry ownership marks source citations/local archives separately from required public files.
const encyclopedia='outputs/domestic-test/asset-encyclopedia/';
const {createRegistry}=await import(pathToFileURL(path.join(root,encyclopedia,'registry.js')));
const registry=createRegistry(JSON.parse(fs.readFileSync(path.join(root,encyclopedia,'catalog.json'))));
for(const asset of registry.entries){
 if(!registry.resolve(asset.id))continue; // curated deletions are not offered to users
 if(asset.file)check(encyclopedia+'catalog.json',asset.file,'registered model');
 for(const source of asset.ownership.sources){if(asset.ownership.sourceAvailability?.[source]==='local-archive')continue;check(encyclopedia+'catalog.json',source,'registered source');}
}
const {TREE_SPECIES}=await import(pathToFileURL(path.join(root,'outputs/domestic-test/tree-species.js')));
for(const species of TREE_SPECIES)if(species.atlas)check('outputs/domestic-test/hybrid-tree.js',species.atlas,'species texture');
assert.equal(exceptions.size,manifest.referenceExceptions.length,'stale reference exception');
assert.equal(missing.length,0,JSON.stringify(missing,null,2));
for(const exception of exceptions)console.log(`EXPLICIT NON-STATIC REFERENCE: ${exception.source} -> ${exception.target}: ${exception.reason}`);
console.log(`PASS: ${files.size} publication inputs, ${checked} static/dynamic module, HTML, CSS and module-relative runtime references.`);
