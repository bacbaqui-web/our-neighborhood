import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dist=path.resolve(process.argv[2]||'dist'),base=path.join(dist,'domestic-test/asset-encyclopedia');
const {createRegistry}=await import(pathToFileURL(path.join(base,'registry.js')));
const raw=JSON.parse(fs.readFileSync(path.join(base,'catalog.json'))),registry=createRegistry(raw);
assert(registry.entries.length>1000);
for(const a of registry.entries){for(const source of a.ownership.sources){if(a.ownership.sourceAvailability?.[source]==='local-archive')continue;assert(fs.existsSync(path.resolve(base,source)),a.id+' public source missing: '+source);}}
const person=registry.resolve('person:woman-cardigan');assert(person.ownership.sources.some(p=>p.endsWith('.webp')));assert(person.ownership.sources.every(p=>person.ownership.sourceAvailability[p]));
console.log('Optimized public registry loads, all required model paths and image ownership keys resolve.');
