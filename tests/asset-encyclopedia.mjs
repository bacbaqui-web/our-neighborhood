import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('catalog.json',base)));const {entries}=data;
assert.equal(new Set(entries.map(a=>a.id)).size,entries.length);
const paths=new Set();for(const a of entries){assert(a.name&&a.category&&a.collection);if(a.file){const file=new URL(a.file,base);assert(fs.existsSync(file),a.file);assert(!paths.has(file.pathname),'duplicate file '+a.file);paths.add(file.pathname);}if(a.link)assert(fs.existsSync(new URL(a.link.split(/[?#]/)[0],base)),a.link);}
function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,d.name);if(d.isDirectory())walk(file);else if(d.name.endsWith('.glb')&&d.name!=='corrected-base.glb')assert(paths.has(file),'missing individual model '+file);}}
walk(new URL('../outputs/domestic-test/',import.meta.url).pathname);
assert.equal(entries.filter(a=>a.kind==='legacy').length,212);
assert.equal(entries.filter(a=>a.kind==='part').length,0,'Unpublished construction experiments stay local');
assert.equal(entries.filter(a=>a.kind==='tree').length,10);
console.log(entries.length+' entries: unique IDs, files, links, legacy coverage, and every individual GLB passed');
