import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildGardenLayout,segmentDistance} from '../outputs/domestic-test/apartments/garden/layout.js';
import {gardenSurfaces} from '../outputs/domestic-test/apartments/garden/scene.js';
import {inPolygon} from '../outputs/domestic-test/facilities/placement.js';
const path='outputs/domestic-test/apartments/garden/',plan=JSON.parse(fs.readFileSync(path+'plan.json')),geo=JSON.parse(fs.readFileSync(path+'buildings.geojson')),xz=p=>[(p[0]-plan.origin[0])*111320*Math.cos(37.618*Math.PI/180),-(p[1]-plan.origin[1])*111133],buildings=geo.features.map(f=>({points:f.geometry.coordinates[0].slice(0,-1).map(xz),seed:f.properties.objectid})),layout=buildGardenLayout(plan,buildings);assert.equal(buildings.length,28);assert.equal(new Set(geo.features.map(f=>f.properties.buld_nm_dc)).size,28);
for(const b of buildings)for(const p of b.points)assert.ok(layout.inside(p),'building outside traced boundary '+b.seed);
for(const t of layout.trees){const p=[t.root[0],t.root[2]];assert.ok(layout.inside(p)&&!layout.occupied(p)&&layout.green(p));assert.ok(layout.roadDistance(p)>3&&layout.pathDistance(p)>2);}
for(const f of layout.fences){const p=[(f.a[0]+f.b[0])/2,(f.a[1]+f.b[1])/2];assert.ok(!layout.occupied(p)&&layout.roadDistance(p)>=2);for(const g of plan.gates)assert.ok(Math.hypot(p[0]-g.point[0],p[1]-g.point[1])>=g.width/2+1);}
for(const r of layout.roads){const length=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]);for(let d=0;d<=length;d+=.5){const t=d/length;assert.ok(!layout.occupied([r.a[0]+(r.b[0]-r.a[0])*t,r.a[1]+(r.b[1]-r.a[1])*t]),'road crosses building: '+r.id);}}
assert.equal(layout.connections.length,28,'all buildings need connected entries');
const scene=gardenSurfaces(plan,layout);let triangles=0;for(const root of Object.values(scene))root.traverse(o=>{if(o.geometry){for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});const qa={...layout.qa,triangles,checks:['28동 누락·중복 없음','건물 윤곽이 단지 범위 안에 있음','나무가 도로·현관 통로를 비움','울타리가 길·출입구를 비움','28동 현관 연결','생성 좌표 유효'],scope:'로컬 비교 페이지; 법적 경계·실측 수종·지형 고도는 미검증'};fs.writeFileSync(path+'validation.json',JSON.stringify(qa,null,2));console.log(qa);
