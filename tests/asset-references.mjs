import assert from 'node:assert/strict';
import {referenceRecord,changeReference,validateRecord,canModel} from '../outputs/domestic-test/asset-encyclopedia/reference-store.js';
const seed={id:'one',imageUrl:'https://example.com/image.jpg',sourceUrl:'https://example.com',sourceName:'국내 자료',koreaEvidence:'한국 설치 사진'};
let r=referenceRecord('road:a46',seed);
assert(!canModel(r));r=changeReference(r,'approve');assert(canModel(r));
r=changeReference(r,'replace');assert(!canModel(r));assert.equal(r.status,'replace-requested');
r=changeReference(r,'image',{...seed,id:'two'});assert.equal(r.status,'pending');assert(!canModel(r));
assert.throws(()=>validateRecord({...r,reference:{...seed,imageUrl:'javascript:alert(1)'}}));
assert.throws(()=>validateRecord({...r,reference:{...seed,imageUrl:'data:image/svg+xml;base64,YQ=='}}));
assert.throws(()=>validateRecord({...r,status:'approved',approvedReferenceId:'old'}));
assert.throws(()=>changeReference(r,'approve',null,false));
assert.equal(referenceRecord('road:a46',{...seed,id:'new'},changeReference(r,'approve')).status,'pending');
const custom=changeReference(r,'image',{...seed,id:'paste-one',imageUrl:'data:image/png;base64,YQ==',userProvided:true});
assert.equal(referenceRecord('road:a46',{...seed,id:'new'},custom).reference.id,'paste-one');
console.log('Reference approval is bound to the exact image; replacements, invalid input and failed-image approval checked.');
import fs from 'node:fs';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {assetGroup} from '../outputs/domestic-test/asset-encyclopedia/groups.js';
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url);
const registry=createRegistry(JSON.parse(fs.readFileSync(new URL('catalog.json',base))));
const manifest=JSON.parse(fs.readFileSync(new URL('road-references.json',base)));
assert.equal(Object.keys(manifest.items).length,10);
for(const [id,seed] of Object.entries(manifest.items)){assert.equal(assetGroup(registry.resolve(id)),'road');assert.equal(referenceRecord(id,seed).status,'pending');}
assert.throws(()=>validateRecord({...r,revision:-1}));
console.log('All 10 candidates belong to active road assets and start unapproved.');
const buildings=JSON.parse(fs.readFileSync(new URL('building-references.json',base)));
const expected=['building:shop-glass','building:shop-tile','building:shop-panel','building:school','building:civic','building:fire',...['apartment','school','emart','lotte','homeplus','costco','traders','police','fire','post','daiso','cu','gs25','seven','emart24','mega','starbucks'].map(id=>'facility:'+id)];
assert.deepEqual(Object.keys(buildings.items).sort(),expected.sort());
for(const [id,seed] of Object.entries(buildings.items)){
 assert.equal(assetGroup(registry.resolve(id)),'building');
 const pending=referenceRecord(id,seed);assert.equal(pending.status,'pending');
 const approved=changeReference(pending,'approve');assert(canModel(approved));
 assert.equal(referenceRecord(id,{...seed,id:seed.id+'-replacement'},approved).status,'pending');
 assert.equal(referenceRecord(id,seed,approved).status,'approved');
 assert(seed.koreaEvidence.length>20);assert(seed.sourceName);assert(seed.usageNote);
}
console.log('All 23 requested buildings have sources, start unapproved, preserve matching approvals and reset replaced candidates.');
const shops=JSON.parse(fs.readFileSync(new URL('shop-references.json',base)));
const shopIds=registry.entries.filter(a=>a.kind==='shop'&&registry.resolve(a.id)).map(a=>a.id);
assert.deepEqual(Object.keys(shops.items).sort(),shopIds.sort());
assert.equal(shopIds.length,18);
assert.equal(new Set(Object.values(shops.items).map(s=>s.imageUrl)).size,18);
for(const [id,seed] of Object.entries(shops.items)){
 assert.equal(assetGroup(registry.resolve(id)),'part');
 const pending=referenceRecord(id,seed);assert(!canModel(pending));
 assert(seed.koreaEvidence.length>20&&seed.sourceName&&seed.sourceUrl&&seed.usageNote);
 const approved=changeReference(pending,'approve');
 assert.equal(referenceRecord(id,seed,approved).status,'approved');
 const pasted=changeReference(approved,'image',{...seed,id:'paste-shop-fixture',imageUrl:'data:image/png;base64,YQ==',userProvided:true});
 assert.equal(pasted.status,'pending');assert(!canModel(pasted));
 assert.equal(referenceRecord(id,{...seed,id:'updated-candidate'},pasted).reference.id,'paste-shop-fixture');
 assert.throws(()=>referenceRecord('shop:other',seed,pasted));
}
console.log('All 18 shop assets have distinct candidates; per-asset paste records survive seed updates without inheriting approval.');
