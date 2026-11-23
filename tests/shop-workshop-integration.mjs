import assert from 'node:assert/strict';import fs from 'node:fs';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {getAssemblyRuleDescriptions} from '../outputs/domestic-test/assembly-rules/asset-policies.js';
import {createModel} from '../outputs/domestic-test/asset-encyclopedia/categories/commerce/models.js';
const raw=JSON.parse(fs.readFileSync('outputs/domestic-test/asset-encyclopedia/catalog.json')),r=createRegistry(raw);
const sizes={'convenience-local':14,'pharmacy-local':20,'bakery-local':14,'bakery-blue':17,'salon-local':20};
for(const [pack,count] of Object.entries(sizes)){
 const parts=r.entries.filter(a=>a.pack===pack&&a.key!=='assembly');assert.equal(parts.length,count);
 const assembly=r.resolve(`commerce:${pack}-assembly`);assert(assembly);assert.equal(assembly.assembly.kind,'reference');
 await assert.rejects(()=>createModel(assembly),/미리보기 연결/);
 assert.equal(await createModel(assembly,{createShopAssembly:a=>a.id}),assembly.id);
 for(const a of [...parts,assembly]){assert(r.resolve(a.id));assert(a.link);assert.equal(a.taxonomy.domain,'commerce');assert(a.ownership.sources.every(s=>a.ownership.sourceAvailability[s]==='public-required'));assert.equal(getAssemblyRuleDescriptions(a)[0].automatic,false);assert.equal(getAssemblyRuleDescriptions(a)[0].status,'reference-only');}
 for(const a of parts)assert(a.assembly.parentAssetIds.includes(assembly.id));
}
console.log('PASS 85 parts, 5 assembly examples, canonical taxonomy and public source ownership, parent links, composition adapter and explicit non-automatic status');
