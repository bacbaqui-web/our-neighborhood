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
