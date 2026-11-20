import assert from 'node:assert/strict';
import * as T from 'three';
import {remainingFactories} from '../outputs/domestic-test/prop-remakes/remaining.js';
for(const [key,create] of Object.entries(remainingFactories)){
 const m=create(),b=new T.Box3().setFromObject(m);let n=0;
 m.traverse(o=>{if(!o.isMesh)return;assert(!o.material.map);assert.equal(o.material.emissive.getHex(),0);assert([...o.geometry.attributes.position.array].every(Number.isFinite));n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 assert(n<=2000);assert(m.children.length<=4);
 if(m.userData.support==='ground'||m.userData.support==='roof'||m.userData.support==='opening')assert(Math.abs(b.min.y)<1e-5,key);
 if(key==='manhole'){assert(b.min.y<-.049);assert(b.max.y<.015);}
 if(key==='door-lock')assert(Math.abs(b.min.z)<1e-6);
 for(const slope of[0,.05]){m.rotation.z=Math.atan(slope);m.updateMatrixWorld(true);for(const p of m.userData.contactPoints||[]){const v=new T.Vector3(...p).applyMatrix4(m.matrixWorld);assert(Math.abs(v.y-slope*v.x)<1e-5,key);}}
 console.log(key,n);
}
