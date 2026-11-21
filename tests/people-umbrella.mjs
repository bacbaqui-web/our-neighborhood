import assert from 'node:assert/strict';
import fs from 'node:fs';
import {umbrellaPeopleCatalog,createPedestrianVariantLoader,peopleActionForWeather} from '../outputs/domestic-test/pedestrian-actions.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../outputs/domestic-test/people/'+p,import.meta.url)));
const catalog=read('catalog.json'),seasons=read('seasons.json'),umbrella=read('umbrella.json');
for(const weather of ['rain','snow'])assert.equal(peopleActionForWeather(weather),'umbrella');
for(const weather of ['clear','cloudy'])assert.equal(peopleActionForWeather(weather),'walk');
for(const season of ['spring','summer','autumn','winter']){
 const c=umbrellaPeopleCatalog(catalog,umbrella,season);
 assert.equal(c.action,'umbrella');assert.equal(c.people.length,10);
 for(const p of c.people){assert.equal(p.height,catalog.people.find(q=>q.id===p.id).height);assert.deepEqual(p.elevations.map(t=>t.pitch),[0,30,60]);
 for(const tier of p.elevations){assert(tier.image.startsWith('umbrella/'));assert.equal(tier.frames.length,8);for(const f of tier.frames){assert(f.bodyHeightPixels>200);assert(f.bodyHeightPixels<f.artHeightPixels);assert(f.anchorPixels[1]>f.rect[1]);}}
 }
}
assert.throws(()=>umbrellaPeopleCatalog(catalog,umbrella,'bad'));
assert.throws(()=>umbrellaPeopleCatalog(catalog,{people:{}},'spring'));
const invalid=structuredClone(umbrella);invalid.people[catalog.people[0].id].seasons.spring.elevations[0].image='../private.png';
assert.throws(()=>umbrellaPeopleCatalog(catalog,invalid,'spring'));
let loads=0,fail=true;
const get=createPedestrianVariantLoader(catalog,seasons,umbrella,async c=>{loads++;if(c.action==='umbrella'&&fail)throw Error('offline');return c;});
const walk=await get('summer');assert.strictEqual(await get('summer','walk'),walk);
await assert.rejects(get('summer','umbrella'),/offline/);fail=false;
const wet=await get('summer','umbrella');assert.strictEqual(await get('summer','umbrella'),wet);assert.notStrictEqual(walk,wet);assert.equal(loads,3);
await assert.rejects(async()=>get('spring','invalid'));
console.log('Umbrella variants: four seasons, calibrated body heights, weather, invalid input, separate cache and retry passed');
