import assert from 'node:assert/strict';
import {rebaseArterialHeights,rebaseMountedLights,supportSampler} from '../outputs/domestic-test/terrain-fit.js';
const plan={decals:{blue:[0,-9.95,0,5,-8.95,0,0,-9.95,5]},landings:[{triangles:[0,-9.85,0,5,-8.85,0,0,-9.85,5]}],exits:[{position:[0,-9.86,0],entryHeight:-9.85}],vehicles:[{position:[5,-8.98,0]}],supportTerrain:{origin:[0,0],step:5,size:2,heights:[-10,-9,-10,-9]}};
rebaseArterialHeights(plan,()=>10);
assert(Math.abs(plan.decals.blue[1]-.05)<1e-8);
assert(Math.abs(plan.exits[0].position[1]-.14)<1e-8);
assert(Math.abs(plan.exits[0].entryHeight-.15)<1e-8);
assert(Math.abs(plan.vehicles[0].position[1]-1.02)<1e-8);
assert.equal(supportSampler(plan,()=>NaN)(5,0),1);
console.log('Transit markings, exits, vehicles, landing and support grid follow terrain height change.');

const lights={lights:['wall','transit','pole','arterial'].map(type=>({type,root:[0,-10,0]}))};
rebaseMountedLights(lights,()=>12);
assert.deepEqual(lights.lights.map(l=>l.root[1]),[2,2,-10,-10]);
console.log('Mounted light offsets follow terrain; freestanding lights remain for surface resampling.');
