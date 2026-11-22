import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assetPolicies} from '../outputs/domestic-test/assembly-rules/asset-policies.js';
import {cases} from '../outputs/domestic-test/grade1-housing-report/cases.js';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {createModel,release} from '../outputs/domestic-test/asset-encyclopedia/models.js';
const registry=createRegistry(JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url))));
for(const c of cases){
 const a=registry.resolve('example:housing-'+c.id);assert(a,'백과에 없는 예시: '+c.id);
 assert.equal(a.assembly.kind,'reference');assert.equal(assetPolicies[a.id].placement.status,'reference-only');assert.equal(assetPolicies[a.id].placement.automatic,false);assert(!('placement' in a));
 const model=await createModel(a);assert.equal(model.name,'HousingReport-'+c.id);
 let meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;assert([...o.geometry.attributes.position.array].every(Number.isFinite));}});
 assert(meshes>50);release(model);
}
console.log('주택·담장 예시 6종: 백과 ID, 설명용 상태, 실제 미리보기 생성 검사 통과');
