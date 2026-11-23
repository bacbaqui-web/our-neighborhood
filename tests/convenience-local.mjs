import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planConvenience,id} from '../outputs/domestic-test/assembly-rules/convenience-local.js';
const entries=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/categories/commerce/catalog.json',import.meta.url))).entries;
const resolve=x=>entries.find(a=>a.id===x);
const full=planConvenience(resolve);assert.equal(full.requiredFailures.length,0,JSON.stringify(full.requiredFailures));assert.equal(full.omitted.length,0,JSON.stringify(full.omitted));
const tight=planConvenience(resolve,{frontDepth:1.2});assert(tight.omitted.some(p=>p.group==='left-seats'));assert(!tight.placed.some(p=>p.group==='left-seats'));assert.equal(tight.requiredFailures.length,0);
const none=planConvenience(resolve,{frontDepth:0});assert(!none.placed.some(p=>p.layer==='exterior'));
const missing=planConvenience(x=>x===id('checkout')?null:resolve(x));assert(missing.requiredFailures.some(p=>p.assetId===id('checkout')));
assert.throws(()=>planConvenience(resolve,{frontDepth:NaN}));
for(const p of full.placed.filter(p=>['interior','exterior'].includes(p.layer))){const b=p.bounds,c=full.corridor;assert(!(b.minX<c.maxX&&b.maxX>c.minX&&b.minZ<c.maxZ&&b.maxZ>c.minZ),p.instanceId);}
console.log(JSON.stringify({normal:full.placed.length,narrowPlaced:tight.placed.length,narrowOmitted:tight.omitted.length,zeroDepthOmitted:none.omitted.length,missingRequiredReported:true}));
