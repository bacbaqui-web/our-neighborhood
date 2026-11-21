import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {umbrellaPeopleCatalog,createPedestrianVariantLoader} from '../outputs/domestic-test/pedestrian-actions.js';
import {createPedestrians} from '../outputs/domestic-test/pedestrians.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/people/catalog.json',import.meta.url)));
const manifest=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/people/seasons.json',import.meta.url)));
const umbrella=JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/people/umbrella.json',import.meta.url)));
const makeAssets=c=>{const map=new Map(c.people.map(p=>[p.id,{...p,tiers:p.elevations.map(t=>({...t,texture:new T.Texture()}))}]));map.season=c.season;map.action=c.action;return map;};
let loads=0,fail=true;
const get=createPedestrianVariantLoader(catalog,manifest,umbrella,async c=>{loads++;if(c.season==='winter'&&fail)throw Error('offline');return makeAssets(c);});
const spring=await get('spring','umbrella');assert.equal((await get('spring','umbrella')),spring);assert.equal(loads,1);
assert.equal(spring.values().next().value.tiers.length,3);
await assert.rejects(get('winter','umbrella'),/offline/);fail=false;const winter=await get('winter','umbrella');assert.equal(loads,3);
assert.throws(()=>umbrellaPeopleCatalog(catalog,umbrella,'invalid'));
assert.throws(()=>umbrellaPeopleCatalog(catalog,{people:{}},'summer'));
const plan={people:catalog.people.map((p,i)=>({id:String(i),character:p.id,x:i*2,z:0,height:p.height,heading:0})),qa:{}};
const system=createPedestrians(plan,spring,()=>0,()=>0);
const feet=system.figures.map(f=>f.feet.toArray());
for(const action of ['umbrella','walk','umbrella'])for(const season of ['winter','summer','autumn','spring']){
 const assets=await get(season,action);system.setAssets(assets);assert.equal(system.group.userData.action,action);
 for(const y of [1.65,8,30]){
  const camera=new T.PerspectiveCamera();camera.position.set(0,y,10);system.update(camera);
  for(const [i,f] of system.figures.entries()){
   assert.deepEqual(f.feet.toArray(),feet[i]);assert.equal(f.placement.height,catalog.people[i].height);
   assert.equal(f.mesh.material.map,f.asset.tiers[f.tier].texture);
   assert([...f.mesh.geometry.attributes.position.array].every(Number.isFinite));
   assert([...f.mesh.geometry.attributes.uv.array].every(v=>v>=0&&v<=1));
   assert.equal(f.asset.tiers.length,3);assert.equal(f.mesh.userData.action,action);if(action==='umbrella')assert(f.asset.tiers[f.tier].image.startsWith('umbrella/'));
   if(season!=='spring')assert(f.asset.tiers[f.tier].image.includes('-'+season));
  }
 }
 assert.equal(system.group.userData.season,season);
 for(const pitch of [0,30,60,30,0])for(const f of system.figures){
  const camera=new T.PerspectiveCamera();camera.position.set(f.feet.x,f.feet.y+f.placement.height*.93+10*Math.tan(pitch*Math.PI/180),f.feet.z+10);
  system.update(camera);assert.equal(f.mesh.userData.elevation,pitch,season+' camera '+pitch);
  assert.equal(f.mesh.material.map,f.asset.tiers[pitch/30].texture);
 }
 assert.equal(system.exportGroup().children.length,11);
}
console.log('Umbrella/walk swaps: 4 seasons x 10 figures x camera tiers up/down, preserved feet/height, correct textures, UVs and export passed');
