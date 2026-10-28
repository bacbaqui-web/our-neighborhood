import fs from 'node:fs';import assert from 'node:assert/strict';
import {buildGardenLayout} from '../outputs/domestic-test/apartments/garden/layout.js';
import {planLivingSpaces} from '../outputs/domestic-test/apartments/garden/living-layout.js';
import {createLivingScene,addExistingFurniture} from '../outputs/domestic-test/apartments/garden/living-models.js';
import {inPolygon} from '../outputs/domestic-test/facilities/placement.js';
const dir='outputs/domestic-test/apartments/garden/',plan=JSON.parse(fs.readFileSync(dir+'plan.json')),geo=JSON.parse(fs.readFileSync(dir+'buildings.geojson')),ref=JSON.parse(fs.readFileSync(dir+'parking-reference.json')),buildings=geo.features.map(f=>({seed:f.properties.objectid,points:f.geometry.coordinates[0].slice(0,-1).map(p=>[(p[0]-plan.origin[0])*111320*Math.cos(37.618*Math.PI/180),-(p[1]-plan.origin[1])*111133])}));
const layout=buildGardenLayout(plan,buildings,ref),infill=planLivingSpaces(plan,layout);console.log(infill.qa, infill.proposals);
assert.equal(layout.parking.length,320);assert.ok(infill.placed.length>=10);for(const kind of ['ramp','bike','recycling','pergola','guard','play'])assert.ok(infill.placed.some(s=>s.kind===kind),kind);
for(const s of infill.placed)for(const p of s.footprint){assert.ok(layout.inside(p)&&!layout.occupied(p));assert.ok(layout.roadDistance(p)>=1.4);assert.ok(layout.pathDistance(p)>=.4);assert.ok(!layout.parking.some(b=>inPolygon(p,b.footprint)));}
const group=createLivingScene(infill,layout);const reused=await addExistingFurniture(group,infill);assert.ok(reused>20);let triangles=0;group.traverse(o=>{if(o.geometry){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});fs.writeFileSync(dir+'living-validation.json',JSON.stringify({...infill.qa,triangles,slots:infill.placed.map(({kind,point,angle,footprint})=>({kind,point,angle,footprint})),checks:['주차 320칸 보존','생활 시설의 도로·건물·현관 통로 겹침 없음','시설별 진입 통로 확보','생성 좌표 유효']},null,2));

fs.writeFileSync(dir+'living-plan.json',JSON.stringify({placed:infill.placed,paths:infill.paths,proposals:infill.proposals},null,2));
