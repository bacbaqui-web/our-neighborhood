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
const baseIds=['convenience','salon','laundry','estate','food','cafe'].flatMap(trade=>[1,2,3].map(n=>`shop:${trade}-0${n}`));
const expansionIds=Array.from({length:50},(_,i)=>`shop:alley-${String(i+1).padStart(2,'0')}`);
const expectedShopIds=[...baseIds,...expansionIds];
assert.deepEqual([...shopIds].sort(),[...expectedShopIds].sort(),'Active shop IDs must preserve the six original trades and alley-01..50');
assert.deepEqual(Object.keys(shops.items).sort(),[...expectedShopIds].sort(),'Every active shop needs its own reference');
assert.equal(new Set(expectedShopIds).size,expectedShopIds.length);
for(const [label,ids] of [['original',baseIds],['expansion',expansionIds]]){
 assert.equal(new Set(ids.map(id=>shops.items[id].imageUrl)).size,ids.length,`${label}: each shop needs a distinct image`);
 assert.equal(new Set(ids.map(id=>shops.items[id].id)).size,ids.length,`${label}: reference IDs must be distinct`);
 for(const id of ids){
  const seed=shops.items[id];
  assert.equal(assetGroup(registry.resolve(id)),'part');
  for(const key of ['id','imageUrl','sourceName','koreaEvidence','usageNote'])assert(typeof seed[key]==='string'&&seed[key].trim(),`${id}: missing ${key}`);
  if(seed.userProvided){
   assert(baseIds.includes(id),`${id}: unexpected pasted reference in researched expansion`);
   assert.match(seed.imageUrl,/^data:image\/(png|jpeg|webp);base64,/);
   assert.equal(seed.sourceName,'직접 제공한 이미지');
   assert.equal(seed.sourceUrl,''); // A pasted image has provenance, not an invented web source.
  }else{
   assert.equal(new URL(seed.sourceUrl).protocol,'https:',`${id}: source URL`);
   assert.equal(new URL(seed.imageUrl).protocol,'https:',`${id}: image URL`);
  }
  if(label==='expansion'){
   assert.equal(seed.id,id.slice('shop:'.length));
   // Expansion research batches encode observations either separately or in koreaEvidence.
   // Local archive paths and inspection flags are optional provenance, not browser approval.
   if(seed.observedFeatures!==undefined)assert(seed.observedFeatures.trim(),`${id}: empty observed features`);
   if(seed.localPhoto!==undefined)assert(seed.photoInspected===true,`${id}: local photo inspection missing`);
   if(seed.localImage!==undefined)assert(seed.inspection?.trim()&&seed.checkedOn,`${id}: local image inspection missing`);
  }
  const pending=referenceRecord(id,seed);assert.equal(pending.status,'pending');assert(!canModel(pending));
  const approved=changeReference(pending,'approve');assert(canModel(approved));assert.equal(approved.approvedReferenceId,seed.id);
  assert.deepEqual(referenceRecord(id,seed,approved),approved,`${id}: matching approval must survive reload`);
  const replacement={...seed,id:seed.id+'-replacement',imageUrl:'https://example.com/replacement.jpg',userProvided:false};
  const explicitlyReplaced=changeReference(approved,'image',replacement);
  assert.equal(explicitlyReplaced.status,'pending');assert.equal(explicitlyReplaced.approvedReferenceId,null);assert(!canModel(explicitlyReplaced));
  const updatedSeed=referenceRecord(id,replacement,approved);
  assert.equal(updatedSeed.status,seed.userProvided?'approved':'pending',`${id}: only saved pasted references override a changed default candidate`);
  if(!seed.userProvided){
   assert(!canModel(updatedSeed));
   assert.equal(referenceRecord(id,{...seed,imageUrl:'https://example.com/changed-image.jpg'},approved).status,'pending',`${id}: changed bytes URL cannot inherit approval even with the same reference ID`);
  }
  const requested=changeReference(approved,'replace');assert.equal(requested.status,'replace-requested');assert(!canModel(requested));
  const pasted=changeReference(approved,'image',{...seed,id:'paste-shop-fixture',imageUrl:'data:image/png;base64,YQ==',sourceUrl:'',userProvided:true});
  assert.equal(pasted.status,'pending');assert(!canModel(pasted));
  assert.equal(referenceRecord(id,replacement,pasted).reference.id,'paste-shop-fixture');
  const differentId=expectedShopIds.find(other=>other!==id);
  assert.throws(()=>referenceRecord(differentId,shops.items[differentId],approved),/다른 에셋/);
  assert.throws(()=>validateRecord({...approved,approvedReferenceId:'wrong-image'}),/승인한 이미지/);
 }
 console.log(`${label}: ${ids.length} exact shop IDs, source provenance, per-image approval preservation and replacement reset passed.`);
}
