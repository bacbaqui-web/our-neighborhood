import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {createPlantingTrial} from '../outputs/domestic-test/apartments/garden/planting-trial.js';
const d=JSON.parse(fs.readFileSync('outputs/domestic-test/apartments/garden/pilot-plan.json')),trial=createPlantingTrial(d,new T.Texture());
const c=new T.PerspectiveCamera();c.position.set(-95,1.8,-85);c.lookAt(-105,.7,-85);c.updateMatrixWorld();trial.update(c);
for(const p of trial.plans){for(const path of p.paths){assert(path.nodes.length>=2);assert(p.nodes[path.nodes[0]].radius>p.nodes[path.nodes.at(-1)].radius);}for(const leaf of p.clumps)assert(p.nodes.some(n=>Math.hypot(...n.p.map((v,i)=>v-leaf.center[i]))<.001),'leaves anchored to branch nodes');}
trial.after.traverse(o=>{if(o.geometry){assert(!['IcosahedronGeometry','SphereGeometry'].includes(o.geometry.type));for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n));}if(o.isInstancedMesh)for(const n of o.instanceMatrix.array)assert(Number.isFinite(n));});
assert(!trial.before.visible&&trial.after.visible);trial.setBefore(true);assert(trial.before.visible&&!trial.after.visible);trial.setBefore(false);console.log(trial.qa);
