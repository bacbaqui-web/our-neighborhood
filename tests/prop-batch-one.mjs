import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from '../outputs/domestic-test/vendor/GLTFLoader.js';
import {batchOneFactories} from '../outputs/domestic-test/prop-remakes/batch-one.js';
const budgets={cone:800,ladder:700,stall:500,basins:1800,'open-box':200,sink:1200,dolly:900,'drying-rack':1200,pallet:350,'tray-rack':1600};
const curation=JSON.parse(fs.readFileSync('outputs/domestic-test/asset-encyclopedia/curation.json')).items;
for(const [key,make] of Object.entries(batchOneFactories)){
 const model=make(),bounds=new T.Box3().setFromObject(model);let count=0;
 assert(Math.abs(bounds.min.y)<1e-5,`${key} floats`);
 assert.equal(curation[model.userData.replacementFor].state,'active','Do not remake discarded sources');
 model.traverse(o=>{if(!o.isMesh)return;assert(!o.material.map&&!o.material.normalMap);assert.equal(o.material.emissive.getHex(),0);for(const attr of Object.values(o.geometry.attributes))assert([...attr.array].every(Number.isFinite));count+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});assert(count<=budgets[key]);assert(model.children.length<=3);
 for(const slope of[0,.05]){model.rotation.z=Math.atan(slope);model.updateMatrixWorld(true);for(const p of model.userData.contactPoints){const v=new T.Vector3(...p).applyMatrix4(model.matrixWorld);assert(Math.abs(v.y-slope*v.x)<1e-5,key);}}
 model.rotation.z=0;model.updateMatrixWorld(true);
 if(['basins','sink','open-box'].includes(key)){const ray=new T.Raycaster(new T.Vector3(0,2,0),new T.Vector3(0,-1,0)),hits=ray.intersectObject(model,true);assert(hits.length>0);assert(hits[0].point.y<({basins:.14,sink:.65,'open-box':.03}[key]),`${key}: cavity must be open`);}
 const bytes=fs.readFileSync(`outputs/domestic-test/prop-remakes/${key}-v1.glb`);const roundtrip=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;
 assert(new T.Box3().setFromObject(roundtrip).getSize(new T.Vector3()).distanceTo(bounds.getSize(new T.Vector3()))<1e-5);
 console.log(key,count,'triangles; geometry, contacts, GLB passed');
}
