import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as T from 'three';
import {factories} from '../work/junction-assets/models.mjs';
for(const [key,fn] of Object.entries(factories)){
 const m=fn();let tri=0;
 m.traverse(n=>{if(!n.isMesh)return;const p=n.geometry.attributes.position;assert([...p.array].every(Number.isFinite),key);assert([...n.geometry.attributes.normal.array].every(Number.isFinite));tri+=(n.geometry.index?.count??p.count)/3;});
 assert(tri>0&&tri<(key.startsWith('junction-')?60000:10000),key+' triangle budget');
 const b=new T.Box3().setFromObject(m);assert(b.min.y>=-.001,key+' ground');assert(m.userData.evidence.length);assert(m.userData.units==='m');
 assert(m.userData.ports.every(p=>p.position.every(Number.isFinite)));
}
const ramp=factories['curb-ramp']();assert.equal(ramp.userData.ports.find(p=>p.role==='road').position[1],0);assert.equal(ramp.userData.ports.find(p=>p.role==='walk').position[1],.15);
const small=factories['junction-alley-main']();assert.equal(small.userData.median,'continuous');
const major=factories['junction-crossroads']();assert.equal(major.userData.median,'ends-before-crossing');
console.log('junction assets: geometry, metadata, ground and connection assertions passed');
for(const key of ['junction-alley-main','junction-small-t','junction-crossroads']){
 const m=factories[key]();m.updateMatrixWorld(true);
 const half=key.includes('small')?3:key.includes('crossroads')?6:5,side=key.includes('small')?2:key.includes('crossroads')?6:2.5;
 const ray=new T.Raycaster(new T.Vector3(half+3.5,3,side+.10),new T.Vector3(0,-1,0));const hits=ray.intersectObject(m,true);assert(hits.length,key+' ramp surface exists');assert(hits[0].point.y<.12,key+' no full curb blocks ramp entry');
 const bb=new T.Box3().setFromObject(m);assert(bb.max.z<=18.01&&bb.min.z>=-18.01,key+' median stays within road');
}
console.log('crossing lips remain open and medians stay inside road ends');

const root=new URL('../outputs/domestic-test/junction-assets/',import.meta.url).pathname;
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
for(const e of manifest){const b=fs.readFileSync(root+e.file);const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());assert(j.nodes.some(n=>n.extras?.assetId===e.id),e.id);}
const finalModel=factories['junction-crossroads']();finalModel.updateMatrixWorld(true);assert.equal(finalModel.userData.crossingOpenings.length,8);
for(const p of finalModel.userData.crossingOpenings){assert.equal(p.width,2.4);for(const dx of [-1,0,1]){const local=new T.Vector3(dx,0,-.8).applyAxisAngle(new T.Vector3(0,1,0),p.angle);const hits=new T.Raycaster(new T.Vector3(p.x+local.x,3,p.z+local.z),new T.Vector3(0,-1,0)).intersectObject(finalModel,true);assert(hits.length);assert(hits[0].point.y<.12,JSON.stringify({p,dx,y:hits[0].point.y}));}}
console.log('12 GLB IDs match manifest; all 8 rotated openings pass at left/center/right; width 2.4m');
