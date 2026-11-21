import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from '../outputs/domestic-test/vendor/GLTFLoader.js';
import {factories} from '../outputs/domestic-test/approved-road/models.js';
import {approvedRoad} from '../outputs/domestic-test/approved-road/catalog.js';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
const registry=createRegistry(JSON.parse(fs.readFileSync('outputs/domestic-test/asset-encyclopedia/catalog.json')));
for(const a of approvedRoad){const m=factories[a.key]();m.updateMatrixWorld(true);const box=new T.Box3().setFromObject(m);assert(Math.abs(box.min.y)<1e-6);const record=registry.resolve(a.id);assert(record.file.endsWith(a.file));assert.equal(record.approvedReferenceId,a.approvedReferenceId);const bytes=fs.readFileSync('outputs/domestic-test/approved-road/'+a.file);const roundtrip=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;assert.equal(roundtrip.children[0].userData.approvedReferenceId,a.approvedReferenceId);assert(new T.Box3().setFromObject(roundtrip).getSize(new T.Vector3()).distanceTo(box.getSize(new T.Vector3()))<1e-6);
 for(const p of m.userData.contactPoints){const hits=new T.Raycaster(new T.Vector3(p[0],-.01,p[2]),new T.Vector3(0,1,0)).intersectObject(m,true); // Test both sides to locate the physical supporting geometry.
 let min=Infinity;m.traverse(o=>{if(o.isMesh){const mat=o.material.side;o.material.side=T.DoubleSide;const hs=new T.Raycaster(new T.Vector3(p[0],-.01,p[2]),new T.Vector3(0,1,0)).intersectObject(o);if(hs.length)min=Math.min(min,hs[0].point.y);o.material.side=mat;}});assert(Math.abs(min)<.003,`${a.key} supporting geometry ${min}`);}
 console.log(a.key,'registry, approval, GLB roundtrip and supports passed');}
function hits(key,origin,dir){const m=factories[key]();m.updateMatrixWorld(true);return new T.Raycaster(new T.Vector3(...origin),new T.Vector3(...dir),0,2).intersectObject(m,true);}
assert.equal(hits('cable',[-.6,.02,.0195],[1,0,0]).length,0,'First cable tunnel must stay open');assert.equal(hits('cable',[-.6,.02,-.0195],[1,0,0]).length,0,'Second cable tunnel must stay open');assert.equal(hits('parking',[0,.884,1],[0,0,-1]).length,0,'Handle hole must stay open');assert.equal(hits('grating',[0,1,.04],[0,-1,0]).length,0,'Grating openings must stay open');assert.equal(hits('pole',[0,.5,0],[0,1,0]).length,0,'Pole insert must stay open');
console.log('Cable tunnels, handle, grate opening and pole clearance passed');
