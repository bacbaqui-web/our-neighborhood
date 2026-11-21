import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {curation,isDeleted,canonicalId,modelDeleted} from '../outputs/domestic-test/asset-encyclopedia/curation.js';
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url), {entries}=JSON.parse(fs.readFileSync(new URL('catalog.json',base)));
const ids=new Map(entries.map(a=>[a.id,a]));
const hash=a=>crypto.createHash('sha256').update(fs.readFileSync(new URL(a.file,base))).digest('hex');
for(const a of entries){const id=canonicalId(a.id);assert(ids.has(id));assert(curation.items[a.id]);if(id!==a.id){assert.equal(hash(a),hash(ids.get(id)));}}
const active=entries.filter(a=>canonicalId(a.id)===a.id&&!isDeleted(a.id));
assert.equal(active.length,curation.summary.active+curation.summary['replacement-pending']);
assert.equal(active.filter(a=>curation.items[a.id].state==='replacement-pending').length,8);
assert.equal(canonicalId('representative:a75'),'road:a75');assert(!isDeleted('road:a75'));
assert(modelDeleted({userData:{}},1));
assert(!modelDeleted({userData:{memoVehicle:'spark-m400'}},213),'old vehicle retirement must not retire replacement');
const memo=entries.find(a=>a.id.startsWith('representative:legacy-')&&isDeleted(a.id));assert(memo);assert(modelDeleted({userData:{memoAsset:memo.id.split(':')[1]}},1));
const snapshot=JSON.parse(fs.readFileSync(new URL('../work/asset-review/applied-revision-'+curation.reviewRevision+'.json',import.meta.url)));
assert.deepEqual(snapshot.reviews,JSON.parse(fs.readFileSync(new URL('../work/asset-review/decisions.json',import.meta.url))),'review records must remain unchanged');
console.log(curation.summary, 'originals, records and replacement vehicles preserved');
