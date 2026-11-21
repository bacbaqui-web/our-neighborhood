import assert from 'node:assert/strict';
import * as T from 'three';
import {spatialBatch} from '../outputs/domestic-test/visibility.js';
import {createOutlinedWires,saggingCable} from '../outputs/domestic-test/grade1-street/wires.js';
const points=saggingCable([0,7,0],[30,8,0],.5);
assert.deepEqual(points[0],[0,7,0]);assert.deepEqual(points.at(-1),[30,8,0]);assert.equal(points[12][1],7);
const m=createOutlinedWires([{points,radius:.012}]);assert.equal(m.userData.segments,24);assert.equal(m.geometry.attributes.position.count,144);assert.equal(m.material.depthTest,true);assert.equal(m.material.depthWrite,false);
m.userData.setWireStyle({lines:false,outerWidth:2});assert.equal(m.material.uniforms.border.value,0);
m.userData.setWireStyle({lines:true,outerWidth:2});assert.equal(m.material.uniforms.border.value,.7);
assert.throws(()=>createOutlinedWires([{points:[[0,0,0],[NaN,1,0]]}]));
console.log('grade1 wires: endpoints, sag, single ribbon budget, depth and line toggle passed');

const root=new T.Group();root.add(m);const batch=spatialBatch(root);assert.equal(batch.originals.length,0);assert.equal(m.parent,root);
