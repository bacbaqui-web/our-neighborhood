import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planBakery} from '../outputs/domestic-test/assembly-rules/bakery-local.js';
import {PREFIX,dimensions} from '../outputs/domestic-test/asset-encyclopedia/categories/commerce/bakery-local/config.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url))),map=new Map(catalog.entries.map(a=>[a.id,a]));
assert.equal(map.size,catalog.entries.length);
let cases=0;
for(const width of [3.2,4.8,6.4,9])for(const height of [2.7,3,3.3])for(const depth of [4.5,5,6])for(const frontDepth of [0,.5,1.5]){
 const p=planBakery(id=>map.get(id),{width,height,depth,frontDepth});cases++;
 const interior=p.placed.filter(a=>a.layer==='interior'&&!a.support);
 for(const a of interior){
  const [w,h,d]=a.size;
  assert(a.x-w/2>=-width/2+.05 && a.x+w/2<=width/2-.05,'wall bounds '+a.key);
  assert(a.z-d/2>=-depth+.04 && a.z+d/2<=-.03,'depth bounds '+a.key);
  assert(a.x-w/2>=p.doorRight+.04 || a.z+d/2<p.partitionZ,'entrance corridor '+a.key);
  for(const b of interior){if(a===b)continue;const overlapX=Math.min(a.x+w/2,b.x+b.size[0]/2)-Math.max(a.x-w/2,b.x-b.size[0]/2),overlapZ=Math.min(a.z+d/2,b.z+b.size[2]/2)-Math.max(a.z-d/2,b.z-b.size[2]/2);assert(overlapX<.001||overlapZ<.001,'furniture collision '+a.key+' '+b.key);}
 }
 for(const a of p.placed.filter(a=>a.support)){const b=p.placed.find(b=>b.instanceId===a.support);assert(b);assert(Math.abs(a.y-(b.y+b.size[1]))<.001);assert(Math.abs(a.x-b.x)+a.size[0]/2<=b.size[0]/2);assert(Math.abs(a.z-b.z)+a.size[2]/2<=b.size[2]/2);}
 const counter=p.placed.find(a=>a.key==='counter');assert(counter.z-counter.size[2]/2-p.partitionZ>=.75);
 assert(p.placed.filter(a=>a.layer==='exterior').every(a=>a.z+a.size[2]/2<=frontDepth));
 assert(p.transomHeight>0 && p.signEdgeInset===.10);
}
assert.throws(()=>planBakery(()=>null),/누락/);
for(const opts of [{width:NaN},{width:3},{depth:3},{height:Infinity},{frontDepth:-1}])assert.throws(()=>dimensions(opts));
assert.equal(map.has(PREFIX+'body'),true);
console.log(`PASS ${cases} layouts: registered IDs, walls, entrance corridor, furniture collisions, countertop supports, 0.75m staff aisle, exterior bounds, transom, invalid input`);
