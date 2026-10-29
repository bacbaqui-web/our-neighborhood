import assert from 'node:assert/strict';import fs from 'node:fs';
import {planLawnInfill} from '../outputs/domestic-test/apartments/garden/garden-vegetation.js';
import {createPilotGarden} from '../outputs/domestic-test/apartments/garden/pilot-garden.js';
import {inPolygon} from '../outputs/domestic-test/facilities/placement.js';
const d=JSON.parse(fs.readFileSync('outputs/domestic-test/apartments/garden/pilot-plan.json')),p=planLawnInfill(d);assert(p.cover.length>1000);assert(p.low.length>10);
for(const x of [...p.cover,...p.low]){assert(!d.surfaces.paths.some(r=>inPolygon(x.point,r.outer)&&!r.holes.some(h=>inPolygon(x.point,h))));assert(!(x.point[0]>-10&&x.point[0]<4&&x.point[1]>-7&&x.point[1]<5));}
const g=await createPilotGarden(d);g.traverse(o=>assert(!(o.isInstancedMesh&&o.geometry?.type==='BoxGeometry'),'individual paving bricks removed'));const paths=g.children.filter(o=>o.name==='garden-paths');assert(paths.length>0);for(const m of paths){const pos=m.geometry.attributes.position,uv=m.geometry.attributes.uv;for(let i=0;i<pos.count;i++){assert(Math.abs(uv.getX(i)-pos.getX(i)/2.4)<.001);assert(Math.abs(uv.getY(i)-pos.getZ(i)/1.2)<.001);}}
console.log('Lawn roots clear paths and playground; paths use continuous surfaces and metre-scaled texture UVs',p.cover.length,p.low.length);
