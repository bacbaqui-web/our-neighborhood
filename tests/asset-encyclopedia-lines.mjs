import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyRemakes,remakeAliases} from '../outputs/domestic-test/asset-encyclopedia/remakes.js';
import {canonicalId} from '../outputs/domestic-test/asset-encyclopedia/curation.js';
import {props} from '../outputs/domestic-test/prop-remakes/catalog.js';
import {approvedRoad} from '../outputs/domestic-test/approved-road/catalog.js';
import {approvedBuildingProfiles} from '../outputs/domestic-test/building-remakes/profiles.js';
import {grade1Assets} from '../outputs/domestic-test/grade1-street/catalog.js';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {CATALOG_LINES} from '../outputs/domestic-test/asset-encyclopedia/line-options.js';
const base=new URL('../outputs/domestic-test/asset-encyclopedia/',import.meta.url),raw=JSON.parse(fs.readFileSync(new URL('catalog.json',base))).entries;
const original=structuredClone(raw),entries=applyRemakes(raw);assert.deepEqual(raw,original,'input remains unchanged');
const expected=new Set([...Object.keys(approvedBuildingProfiles),...approvedRoad.map(a=>a.id),...props.map(a=>canonicalId('road:'+a.old)),...grade1Assets.map(a=>'grade1:'+a.key)]);
function validate(rows){
 assert.equal(new Set(rows.map(a=>a.id)).size,rows.length,'duplicate effective IDs');
 assert.deepEqual(new Set(rows.filter(a=>a.remade).map(a=>a.id)),expected,'exact approved/remade ID set');
 for(const a of rows){assert(!remakeAliases.has(a.id),'alias candidate exposed');assert(!props.some(p=>a.id==='prototype:'+p.key+'-v1'),'prototype exposed');}
 for(const id of expected){
  const a=rows.find(a=>a.id===id),source=raw.find(a=>a.id===id),building=approvedBuildingProfiles[id],road=approvedRoad.find(a=>a.id===id),prop=props.find(p=>canonicalId('road:'+p.old)===id),grade=grade1Assets.find(p=>'grade1:'+p.key===id);
  if(building)assert.equal(a.approvedReferenceId,building.referenceId,'building approval');
  else if(road){assert.equal(a.file,'../approved-road/'+road.file,'approved road overrides props');assert.equal(a.triangles,road.triangles,'approved geometry');assert.equal(a.approvedReferenceId,road.approvedReferenceId,'road approval');assert.equal(a.originalFile,source.file,'original retained');}
  else if(prop){assert.equal(a.file,'../prop-remakes/'+prop.key+'-v1.glb');assert.equal(a.triangles,prop.triangles);assert.equal(a.originalFile,source.file);}
  else{assert(grade);assert.equal(a.file,grade.file);assert.equal(a.approvedReferenceId,grade.reference.photoId);}
  for(const file of [a.file,a.originalFile].filter(Boolean))assert(fs.existsSync(new URL(file,base)),'preserved file '+file);
 }
}
validate(entries);validate(createRegistry({entries:raw}).entries);
const mutate=fn=>{const rows=structuredClone(entries);fn(rows);return rows;};
assert.throws(()=>validate(entries.filter(a=>a.id!=='road:a72')),/ID set/);
assert.throws(()=>validate(mutate(rows=>rows[0].remade=true)),/ID set/);
assert.throws(()=>validate(mutate(rows=>rows.find(a=>a.id==='road:a72').file='../prop-remakes/barrier-v1.glb')),/overrides/);
assert.throws(()=>validate(mutate(rows=>rows.find(a=>a.id==='road:a72').triangles=1392)),/geometry/);
assert.throws(()=>validate(mutate(rows=>delete rows.find(a=>a.id==='road:a72').approvedReferenceId)),/approval/);
assert.throws(()=>validate(mutate(rows=>rows.find(a=>a.id==='road:a72').originalFile='lost.glb')),/original/);
assert.throws(()=>validate([...entries,{id:'prototype:barrier-v1'}]),/prototype/);
for(const [k,v]of Object.entries({lines:true,outerWidth:2,outerFace:true,outerBrightness:77,outerSaturation:200,minDistance:200,acrossObjects:true,innerWidth:2,innerAngle:16.4,innerFace:true,innerBrightness:90,innerSaturation:152}))assert.equal(CATALOG_LINES[k],v,k);
console.log(`${expected.size} remade IDs: approval precedence, original preservation, registry compatibility, seven failure injections and unchanged line settings passed`);
