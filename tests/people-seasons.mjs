import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../outputs/domestic-test/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const people=read('people/catalog.json').people;
const variants=read('people/seasons.json').people;
const entries=read('asset-encyclopedia/catalog.json').entries;
assert.equal(people.length,10);
for(const person of people){
 const seasons=variants[person.id].seasons;
 assert.deepEqual(Object.keys(seasons).sort(),['autumn','spring','summer','winter']);
 assert.equal(seasons.spring.image,person.image);
 assert.deepEqual(seasons.spring.frames,person.frames);
 const entry=entries.find(a=>a.id==='person:'+person.id);
 const hashes=new Set();
 for(const [season,v] of Object.entries(seasons)){
  const bytes=fs.readFileSync(new URL('people/'+v.image,root));
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  hashes.add(hash);if(v.sha256)assert.equal(v.sha256,hash);
  assert.equal(entry.seasons[season].file,'../people/'+v.image);
  assert.deepEqual(v.elevations.map(t=>t.pitch),[0,30,60]);
  for(const tier of v.elevations){
   const tierBytes=fs.readFileSync(new URL('people/'+tier.image,root));
   if(tier.sha256)assert.equal(crypto.createHash('sha256').update(tierBytes).digest('hex'),tier.sha256);
   assert.equal(entry.seasons[season].elevations.find(t=>t.pitch===tier.pitch).file,'../people/'+tier.image);
   assert.equal(tier.frames.length,8);
  for(const [i,f] of tier.frames.entries()){
   assert.equal(f.angle,i*45);const [x,y,w,h]=f.rect;
   assert(w>0&&h>0&&x>=0&&y>=0&&x+w<=tier.imageWidth&&y+h<=tier.imageHeight);
   assert(f.bodyHeightPixels>0&&f.anchorPixels.every(Number.isFinite));
  }}
 }
 assert.equal(hashes.size,4,person.id+' needs distinct seasonal artwork');
}
console.log('10 people × 4 distinct seasons; 960 frame bounds across 120 sheets, spring preservation and encyclopedia paths passed');
