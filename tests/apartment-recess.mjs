import assert from 'node:assert/strict';
import {emitApartment,makeApartmentSpec,apartmentCatalog} from '../outputs/domestic-test/apartments/models.js';
import {makeLivingAsset} from '../outputs/domestic-test/apartments/garden/living-models.js';
for(const style of apartmentCatalog){
 const boxes=[],quads=[];let edge=0;
 emitApartment({writer(){const id=edge++;return {box:(...v)=>boxes.push({id,v}),quad:(...v)=>quads.push({id,v})};}},makeApartmentSpec(style));
 const windows=quads.filter(({v})=>[style.glass,0x9eaaa4,0x6e8280].includes(v[5]));
 assert(windows.length>0);
 for(const {id,v:[x,y,z,w,h]} of windows){
  assert(z<.2,'glass must be behind outer wall');
  assert(boxes.some(({id:e,v:b})=>e===id&&b[5]===.5&&Math.abs(b[2]+b[5]/2-.52)<1e-6),'outer wall missing');
  for(const {id:e,v:b} of boxes.filter(a=>a.v[5]===.5&&a.v[2]===.27))if(e===id)
   assert(!(Math.abs(x-b[0])<(w+b[3])/2-.001&&Math.abs(y-b[1])<(h+b[4])/2-.001),'wall covers window opening');
 }
}
for(const kind of ['bench','play','recycling']){let vertices=0;makeLivingAsset(kind).traverse(o=>{if(!o.geometry)return;const p=o.geometry.attributes.position;vertices+=p.count;for(const n of p.array)assert(Number.isFinite(n));});assert(vertices>1000,kind+' lacks geometry');}
console.log('Nine recessed facades: glazing unobstructed and behind wall; detailed furniture geometry finite');
