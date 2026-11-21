import assert from 'node:assert/strict';
import * as T from 'three';
import {createJunctionParts} from '../outputs/domestic-test/junction-assets/placement.js';
const p={qa:{junctions:1},parts:{ramp:'junction:curb-ramp'},geometry:{ramp:[0,0,0,1,.1,0,0,.15,1]},assets:[{assetId:'junction:tactile-warning',position:[0,.2,0],heading:.6,slope:[.03,.02]}]};
const g=createJunctionParts(p);g.updateMatrixWorld(true);assert.equal(g.children.length,2);assert.equal(g.children[0].name,'road');
g.traverse(o=>{if(o.isMesh){assert([...o.geometry.attributes.position.array].every(Number.isFinite));assert([...o.geometry.attributes.normal.array].every(Number.isFinite));}});
const up=new T.Vector3(0,1,0).applyQuaternion(g.children[1].quaternion);assert(up.dot(new T.Vector3(-.03,1,-.02).normalize())>.99999);assert.deepEqual(g.children[1].scale.toArray(),[1,1,1]);
console.log('Junction renderer uses reviewed rigid tactile part and terrain-normal orientation without stretching.');
