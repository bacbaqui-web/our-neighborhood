import assert from 'node:assert/strict';
import {emitApartment,makeApartmentSpec,apartmentCatalog} from '../outputs/domestic-test/apartments/models.js';
for(const asset of apartmentCatalog){const b=makeApartmentSpec(asset),quads=[],boxes=[],batch={writer(origin){return {quad:(x,y,z,w,h,color)=>quads.push({origin,x,y,z,w,h,color}),box:(...a)=>boxes.push(a)};}};b.properties.buld_nm_dc='101동';emitApartment(batch,b);
 const windows=quads.filter(q=>q.y<3&&[asset.glass,0x6e8280].includes(q.color));assert(windows.length);for(const w of windows){assert(w.y-w.h/2>=1,'ground window must have solid wall below');assert(w.w<=2.2);if(w.origin[0]===b.points[0][0]&&w.origin[2]===b.points[0][1])assert(Math.abs(w.x-Math.hypot(b.points[1][0]-b.points[0][0],b.points[1][1]-b.points[0][1])/2)>=w.w/2+1.85,'lobby bay must not contain residential glazing');}
 assert(quads.some(q=>q.color===0x526d70),'separate entrance glazing');assert(boxes.some(a=>a[6]===0x535e5b),'intercom detail');}
console.log('All nine ground floors: raised windows, reserved lobby bay and entrance details passed');
