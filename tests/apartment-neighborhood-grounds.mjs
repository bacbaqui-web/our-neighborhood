import assert from 'node:assert/strict';
import * as T from 'three';
import {apartmentCatalog,makeApartmentSpec,planApartmentGrounds} from '../outputs/domestic-test/apartments/models.js';
import {planApartmentPlanting,createNeighborhoodApartmentGrounds} from '../outputs/domestic-test/apartments/neighborhood-grounds.js';
import {inPolygon} from '../outputs/domestic-test/facilities/placement.js';
for(const era of ['old','middle','new']){
 const building=makeApartmentSpec(apartmentCatalog.find(a=>a.era===era)),before=JSON.stringify(building);
 const plan=planApartmentGrounds([building],{roadInfo:(x,z)=>z>12&&z<20});
 const plants=planApartmentPlanting(plan);assert.ok(plants.length>30);
 for(const p of plants){assert.ok(!inPolygon([p.root[0],p.root[2]],building.points));assert.ok(plan.slots.some(s=>['garden','tree'].includes(s.kind)&&inPolygon([p.root[0],p.root[2]],s.footprint)));assert.ok(p.clumps.every(c=>Number.isFinite(c.tone)&&c.radius>0));}
 const system=createNeighborhoodApartmentGrounds(plan,new Map([['zelkova',new T.Texture()]]));
 system.foliage.setFoliage({season:'summer'});system.foliage.update(new T.PerspectiveCamera());
 assert.equal(system.group.userData.parkingPreserved,true);
 system.group.traverse(o=>{if(o.geometry)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
 assert.equal(JSON.stringify(building),before);
 console.log(era,plan.slots.length,'pockets',plants.length,'rooted plants');
 system.foliage.dispose();
}
assert.equal(planApartmentPlanting({slots:[]}).length,0);
const {planApartmentAmenities}=await import('../outputs/domestic-test/apartments/neighborhood-grounds.js');
const b=makeApartmentSpec(apartmentCatalog.find(a=>a.era==='new'));
const pockets=planApartmentGrounds([b]);
const amenities=planApartmentAmenities(pockets,[b],{elevation:()=>0,roadInfo:()=>null});
assert.deepEqual(new Set(amenities.facilities.map(f=>f.kind)),new Set(['play','pergola','recycling']));
assert.equal(planApartmentAmenities(pockets,[b],{elevation:()=>0,roadInfo:()=>true}).facilities.length,0);
assert.equal(planApartmentAmenities(pockets,[b],{elevation:(x,z)=>x+z,roadInfo:()=>null}).facilities.length,0);
console.log('Amenities fit tests passed');
