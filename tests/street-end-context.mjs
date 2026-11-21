import assert from 'node:assert/strict';
import {createStreetEndContext} from '../outputs/domestic-test/street-end-context.js';
const data={buildings:[{owner:1,height:9,rings:[[[60,0],[80,0],[80,20],[60,20]],[[65,5],[65,15],[75,15],[75,5]]]},{owner:2,height:6,rings:[[[90,0],[100,0],[100,10],[90,10]]]}],roads:[{rings:[[[42,-5],[200,-5],[200,0],[42,0]]]}]};
const height=(x,z)=>x*.02+z*.01;
const result=createStreetEndContext(data,new Set([2]),height);
assert.equal(result.stats.buildings,1);assert.equal(result.stats.drawCalls,2);
assert.equal(result.stats.windowGeometry,0);
assert(result.stats.triangles<5000);
const buildings=result.group.getObjectByName('StreetEndBuildings'),positions=buildings.geometry.attributes.position;
let roofArea=0;
for(let i=0;i<positions.count;i+=3){
 const pts=[0,1,2].map(k=>[positions.getX(i+k),positions.getY(i+k),positions.getZ(i+k)]);
 assert(pts.flat().every(Number.isFinite));
 if(Math.max(...pts.map(p=>p[1]))-Math.min(...pts.map(p=>p[1]))<.001){
  const [a,b,c]=pts;roofArea+=Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2;
 }
 for(const p of pts)if(p[1]<5)assert(Math.abs(p[1]-(height(p[0],p[2])-.08))<1e-5);
}
assert(Math.abs(roofArea-300)<.01,'roof preserves courtyard hole');
const road=result.group.getObjectByName('StreetEndRoads').geometry.attributes.position;
for(let i=0;i<road.count;i++)assert(Math.abs(road.getY(i)-height(road.getX(i),road.getZ(i))-.025)<1e-5);
assert(buildings.material.isMeshStandardMaterial,'shared scene lighting affects distant buildings');
result.dispose();
const empty=createStreetEndContext({buildings:[],roads:[]},new Set(),()=>0);assert.equal(empty.stats.drawCalls,0);empty.dispose();
console.log('Street-end context: real footprints, courtyard holes, duplicate owners, terrain contacts, lighting material and budget passed.');
// The background ground is deliberately lowered 8 cm. Roads must use the actual
// foreground surface in the overlap, otherwise a strip disappears under it.
const {createAtmosphere}=await import('../outputs/domestic-test/atmosphere.js');
const T=await import('three');
const groundData={origin:[37.62,127.02],angles:4,radii:[0,100,200],positions:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,-100,100,0,0,0,0,100,-100,0,0,0,0,-200,200,0,0,0,0,200,-200,0,0],city:[],cityFootprints:[],roads:[],streetEndContext:data};
const atmosphere=createAtmosphere(groundData,undefined,50,new Set([2]),{gentle:true,contextBuildings:false});
atmosphere.fitGround((x,z,fallback)=>Math.hypot(x,z)<90?1:fallback);
const near=new T.Group();atmosphere.bridgeGround(near);
const overlap=near.getObjectByName('StreetEndRoads').geometry.attributes.position;
for(let i=0;i<overlap.count;i++)if(Math.hypot(overlap.getX(i),overlap.getZ(i))<90)assert(Math.abs(overlap.getY(i)-1.025)<1e-5);
assert.equal(atmosphere.stats.streetEnd.buildings,1);atmosphere.dispose();assert(!near.getObjectByName('StreetEndContext'));
console.log('Foreground overlap stays above the real surface; context is disposed with the scene.');
const inkContext=createStreetEndContext({buildings:[...data.buildings],roads:[]},new Set(),()=>0);
const inkMesh=inkContext.group.getObjectByName('StreetEndBuildings');
assert.equal(inkMesh.userData.noInk,false,'distant buildings participate in both line passes');
assert.equal(new Set(inkMesh.geometry.getAttribute('inkObjectId').array).size,2,'joined buildings retain separate silhouettes');
assert(inkMesh.geometry.getAttribute('normal'),'face normals drive internal roof/wall creases');
inkContext.dispose();
