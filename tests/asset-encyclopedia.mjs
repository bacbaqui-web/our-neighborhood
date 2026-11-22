import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {DOMAINS} from '../outputs/domestic-test/asset-encyclopedia/taxonomy.js';
import {approvedRoad} from '../outputs/domestic-test/approved-road/catalog.js';
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url),root=new URL('../',import.meta.url);
const raw=JSON.parse(fs.readFileSync(new URL('catalog.json',base))),inventory=JSON.parse(fs.readFileSync(new URL('categories/inventory.json',base)));
const categories=DOMAINS.flatMap(d=>JSON.parse(fs.readFileSync(new URL(`categories/${d}/catalog.json`,base))).entries);
assert.deepEqual(raw.entries,categories.sort((a,b)=>inventory.ids.indexOf(a.id)-inventory.ids.indexOf(b.id)),'aggregate matches canonical category records');
const published=new Set(JSON.parse(fs.readFileSync(new URL('config/publication-files.json',root))).files);
const relative=url=>path.relative(root.pathname,url.pathname).split(path.sep).join('/');
// Explicit local preservation files may be absent from a clean checkout.
// If present they must be named here; never generalize to *-vN. Current successors remain required.
const history={bus:['bus-approved-v1.glb','bus-approved-v2.glb','bus-approved-v3.glb'],parking:['parking-approved-v1.glb','parking-approved-v2.glb'],speed:['speed-approved-v1.glb','speed-approved-v2.glb']};
const historical=new Set();for(const [key,files]of Object.entries(history)){const current=approvedRoad.find(a=>a.key===key);assert(current);assert(fs.existsSync(new URL('../approved-road/'+current.file,base)),'current approved successor missing');for(const file of files){assert.notEqual(file,current.file);const u=new URL('../approved-road/'+file,base);historical.add(u.pathname);}}
const glbs=[];function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())walk(p);else if(d.name.endsWith('.glb')&&!inventory.excluded.some(x=>p.endsWith('/'+x)))glbs.push(p);}}walk(new URL('../',base).pathname);
function validate(entries,{exists=u=>fs.existsSync(u),publicFiles=published,models=glbs}={}){
 assert.equal(new Set(entries.map(a=>a.id)).size,entries.length,'duplicate ID');assert.deepEqual(new Set(entries.map(a=>a.id)),new Set(inventory.ids),'stable inventory IDs');
 const owned=new Set();
 for(const a of entries){assert(a.name&&a.category&&a.collection,a.id);if(a.revision?.file)assert(a.ownership.sources.includes(a.revision.file),'revision ownership missing '+a.id);for(const file of [a.file,a.revision?.file,a.revision?.originalFile,...a.ownership.sources].filter(Boolean)){const u=new URL(file,base);owned.add(u.pathname);if(a.ownership.sourceAvailability?.[file]!=='local-archive')assert(exists(u),'missing required source '+file);}}
 const registry=createRegistry({entries});for(const a of registry.entries){if(!registry.resolve(a.id))continue;for(const file of [a.file,...a.ownership.sources].filter(Boolean)){if(a.ownership.sourceAvailability?.[file]==='local-archive')continue;assert(publicFiles.has(relative(new URL(file,base))),'missing public model/source '+file);}}
 for(const model of models)assert(owned.has(model)||historical.has(model),'unregistered GLB '+model);
}
validate(raw.entries);
assert.throws(()=>validate([...raw.entries,raw.entries[0]]),/duplicate/);
assert.throws(()=>validate(raw.entries.slice(1)),/stable inventory/);
assert.throws(()=>validate(raw.entries,{models:[...glbs,new URL('../approved-road/bus-approved-v999.glb',base).pathname]}),/unregistered/);
const lostOwner=structuredClone(raw.entries);const revised=lostOwner.find(a=>a.id==='road:a72');revised.ownership.sources=revised.ownership.sources.filter(s=>s!==revised.revision.file);assert.throws(()=>validate(lostOwner),/revision ownership/);
const target=new URL('../approved-road/barrier-approved-v1.glb',base);assert.throws(()=>validate(raw.entries,{exists:u=>u.href!==target.href&&fs.existsSync(u)}),/missing required/);
const missing=new Set(published);missing.delete(relative(target));assert.throws(()=>validate(raw.entries,{publicFiles:missing}),/missing public/);
const archive=raw.entries.flatMap(a=>Object.entries(a.ownership.sourceAvailability||{})).find(([,state])=>state==='local-archive');assert(archive);validate(raw.entries,{exists:u=>u.href===new URL(archive[0],base).href?false:fs.existsSync(u)});
console.log(`${raw.entries.length} stable entries: canonical aggregate, current/preserved/public models, explicit history and six failure injections passed`);
