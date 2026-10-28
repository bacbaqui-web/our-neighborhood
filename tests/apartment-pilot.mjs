import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {createPilotGarden,addPilotLeafDetail,pilotWorld,pilotContains} from '../outputs/domestic-test/apartments/garden/pilot-garden.js';
import {inPolygon} from '../outputs/domestic-test/facilities/placement.js';
const d=JSON.parse(fs.readFileSync('outputs/domestic-test/apartments/garden/pilot-plan.json'));
const path=p=>d.surfaces.paths.some(r=>inPolygon(p,r.outer)&&!r.holes.some(h=>inPolygon(p,h)));
for(const b of d.benches)assert(path(b.point),'bench must stand on a paved rest pocket');
for(const t of d.trees){assert(!path(t.point),'tree trunk must not block the walk');assert(pilotContains(d,pilotWorld(d,t.point)));}
for(const f of d.flowers)assert(!path(f.point),'flowers stay in beds');
const g=await createPilotGarden(d);addPilotLeafDetail(d,g,new T.Texture());let meshes=0;g.traverse(o=>{if(o.geometry){meshes++;for(const v of o.geometry.attributes.position.array)assert(Number.isFinite(v));}if(o.isInstancedMesh)for(const v of o.instanceMatrix.array)assert(Number.isFinite(v));});assert(meshes>15);console.log('Pilot garden geometry and walk clearance passed',d.qa);
