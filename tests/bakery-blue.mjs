import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';
import{planBakery}from'../outputs/domestic-test/assembly-rules/bakery-blue.js';
const entries=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/asset-encyclopedia/catalog.json',import.meta.url))).entries,map=new Map(entries.map(a=>[a.id,a]));assert.equal(map.size,entries.length);let count=0;
for(const width of[6.4,7.6,9])for(const height of[2.7,3,3.3])for(const depth of[4.5,5,6])for(const frontDepth of[0,.5,1.5]){
 const p=planBakery(id=>map.get(id),{width,height,depth,frontDepth});count++;
 const boxes=p.placed.filter(a=>a.layer==='interior'&&!a.support).map(a=>({...a,w:a.yaw?a.size[2]:a.size[0],d:a.yaw?a.size[0]:a.size[2]}));
 for(const a of boxes){assert(Math.abs(a.x)+a.w/2<=width/2-.04);assert(a.z-a.d/2>=-depth+.04&&a.z+a.d/2<0);if(a.z+a.d/2>-depth+1)assert(a.x+a.w/2<p.doorLeft||a.x-a.w/2>p.doorRight,'entrance corridor '+a.key);for(const b of boxes){if(a===b)continue;assert(Math.abs(a.x-b.x)>=(a.w+b.w)/2-.001||Math.abs(a.z-b.z)>=(a.d+b.d)/2-.001,'collision '+a.key+' '+b.key);}}
 for(const a of p.placed.filter(a=>a.support)){const b=p.placed.find(b=>b.instanceId===a.support);assert.equal(a.y,b.y+b.size[1]);assert(Math.abs(a.x-b.x)+a.size[0]/2<=b.size[0]/2);}
 for(const a of p.placed.filter(a=>a.layer==='exterior')){assert(a.z+a.size[2]/2<=frontDepth);assert(a.x+a.size[0]/2<p.doorLeft||a.x-a.size[0]/2>p.doorRight);}
 const posters=p.placed.filter(a=>a.key==='poster');assert.equal(posters.length,4);
}
assert.throws(()=>planBakery(()=>null));assert.throws(()=>planBakery(id=>map.get(id),{width:4}));
console.log('PASS '+count+' layouts: furniture bounds/collisions, entrance corridor, countertop support, external space, posters');
