import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
const raw=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url)));
const registry=createRegistry(raw);
assert(Object.isFrozen(registry.entries),'registry entries must be read-only');
for(const a of registry.entries){assert(a.taxonomy?.domain,a.id);assert(a.assembly?.evidence,a.id);assert(Object.isFrozen(a.taxonomy.colors));assert(!('placement' in a));assert(!('integration' in a));}
const a=registry.entries.find(a=>a.id==='part:wall-0');assert.equal(a.taxonomy.role,'wall');assert.throws(()=>a.taxonomy.colors.push('changed'));assert.equal(createRegistry(raw).resolve(a.id).taxonomy.colors.includes('changed'),false);
console.log('Category inventory metadata and deep read-only isolation passed:',registry.entries.length);
const {DOMAINS,validateEntry}=await import('../outputs/domestic-test/asset-encyclopedia/taxonomy.js');
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url);
const canonical=DOMAINS.flatMap(domain=>{const data=JSON.parse(fs.readFileSync(new URL(`categories/${domain}/catalog.json`,base)));for(const row of data.entries){validateEntry(row);assert.equal(row.taxonomy.domain,domain);for(const source of row.ownership.sources)if(row.ownership.sourceAvailability?.[source]!=='local-archive')assert(fs.existsSync(new URL(source,base)),row.id+' '+source);}return data.entries;});
assert.equal(new Set(canonical.map(a=>a.id)).size,canonical.length);
assert.deepEqual(new Set(canonical.map(a=>a.id)),new Set(raw.entries.map(a=>a.id)));
const first=registry.entries[0],inputRow=raw.entries.find(a=>a.id===first.id);inputRow.taxonomy.tags.push('input mutation');assert(!first.taxonomy.tags.includes('input mutation'));
assert.throws(()=>createRegistry({entries:[{id:'bad',kind:'glb'},{id:'bad',kind:'glb'}]}),/중복/);
assert.throws(()=>validateEntry({...canonical[0],taxonomy:{...canonical[0].taxonomy,domain:'missing'}}));
assert.throws(()=>validateEntry({...canonical[0],placement:{automatic:true}}));
console.log('All canonical IDs, source paths, category owners, invalid input and mutation boundaries passed');
const {applyRemakes}=await import('../outputs/domestic-test/asset-encyclopedia/remakes.js');
const compatibility=raw.entries.map(({taxonomy,assembly,ownership,registryHidden,revision,...entry})=>entry);
const original=applyRemakes(compatibility);
assert.deepEqual(new Set(registry.entries.map(a=>a.id)),new Set(original.map(a=>a.id)),'effective inventory changed');
for(const old of original){const current=registry.entries.find(a=>a.id===old.id);for(const [key,value]of Object.entries(old))if(!['placement','integration'].includes(key))assert.deepEqual(current[key],value,old.id+' '+key+' must survive migration');}
console.log('All pre-migration effective entry fields preserved except intentionally extracted policies');
for(const id of ['part:garden-building-sparse','part:garden-building-green']){const example=raw.entries.find(a=>a.id===id);assert.equal(example.assembly.kind,'reference');assert.equal(example.taxonomy.role,'reference');}
for(const dimensions of [undefined,{width:-1,height:1,unit:'m',basis:'source-default'},{width:1,height:Infinity,unit:'m',basis:'source-default'}])assert.throws(()=>validateEntry({...canonical[0],assembly:{...canonical[0].assembly,dimensions}}));
const {houseAssemblyRules}=await import('../outputs/domestic-test/assembly-rules/house.js');
for(const rule of houseAssemblyRules){const a=registry.resolve(rule.id);assert.equal(a.assembly.kind,'component',rule.id+' must be an attachable building component');}
assert.equal(registry.resolve('building:home-0').assembly.kind,'complete');
