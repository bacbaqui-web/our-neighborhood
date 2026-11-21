import assert from 'node:assert/strict';
import * as T from 'three';
import {gentleMeshHeight,gentleTerrainCorrection} from '../outputs/domestic-test/gentle-terrain30.js';
import {deformTerrain} from '../outputs/domestic-test/route-elevation.js';
const origin=[37.62605436617286,127.02633767526606],h=gentleMeshHeight(...origin);
const root=new T.Group();
for(const [name,lift,points] of [['ground',0,[[0,0],[5,0],[0,5]]],['road',.018,[[1,1],[3,1],[1,3]]],['path',.17,[[3,0],[5,0],[3,2]]]]){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flatMap(([x,z])=>[x,h(x,z)+lift,z]),3));const m=new T.Mesh(g);m.name=name;root.add(m);
}
const before=root.children.map(m=>Array.from(m.geometry.attributes.position.array));
let samples=0;
const correction=gentleTerrainCorrection(origin,'gentle-terrain30',(x,z)=>{samples++;return h(x,z)+(x>=3?.17:.018);});
assert.equal(correction.baked,true);
assert.deepEqual(deformTerrain(root,correction.delta),{vertices:9,maxShift:0});
assert.equal(samples,0,'Finished sidewalk elevations must not be sampled for baked scenes');
root.children.forEach((m,i)=>assert.deepEqual(Array.from(m.geometry.attributes.position.array),before[i]));
const legacy=gentleTerrainCorrection(origin,undefined,()=>12);
assert.equal(legacy.baked,false);assert.equal(legacy.delta(2,3),h(2,3)-12);
console.log('PASS: baked ground, road and sidewalk clearances preserved; legacy conversion retained');
const {buildingParts}=await import('../outputs/domestic-test/visible-horizon-policy.js');
const geometry={type:'Polygon',coordinates:[[[127,37],[127.001,37],[127.001,37.001],[127,37]]]};
const station={geometry,properties:{objectid:1,building_name:'미아역',buld_nm_dc:'4호선',gro_flo_co:1,floorsEstimated:true}};
const house={geometry,properties:{objectid:2,building_name:'주택',gro_flo_co:1,floorsEstimated:true}};
const elevated={geometry,properties:{...station.properties,objectid:3,gro_flo_co:2,floorsEstimated:false}};
assert.deepEqual(buildingParts([station,house,elevated],[37,127],()=>0).map(b=>b.owner),[2,3]);
console.log('PASS: underground station excluded; estimated houses and above-ground stations retained');
