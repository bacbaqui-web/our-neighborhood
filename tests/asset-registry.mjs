import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {props} from '../outputs/domestic-test/prop-remakes/catalog.js';
const registry=createRegistry(JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url))));
for(const p of props){const a=registry.resolvePlacement(p.old);assert(a?.remade,p.key);assert(a.url.endsWith('/'+p.key+'-v1.glb'));assert(fs.existsSync(new URL(a.url)));}
assert.equal(registry.resolve('legacy:1'),null);assert.equal(registry.resolve('unknown'),null);
assert.throws(()=>createRegistry({entries:[{id:'x',kind:'glb'},{id:'x',kind:'glb'}]}));
console.log('18 placement sources match encyclopedia; deleted and missing IDs excluded; duplicate IDs rejected');
