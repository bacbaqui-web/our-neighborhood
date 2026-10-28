import {facilityById,identifyBuilding,identifyPlace} from './catalog.js';
export function inPolygon(p,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
export const normalizeAddress=s=>(s||'').replace(/(?:지하)?\d+(?:[-~]\d+)?층.*$/,'').replace(/\s+/g,'');
const area=b=>Math.abs(b.points.reduce((v,a,i)=>{const c=b.points[(i+1)%b.points.length];return v+a[0]*c[1]-c[0]*a[1]},0))/2;
export function planFacilities(buildings,places,{xz}){
 const applied=[],skipped=[];
 for(const b of buildings){delete b.facility;const id=identifyBuilding(b.properties);if(id&&facilityById[id].pattern!=='shop')b.facility={id,sourceId:id,match:'building-record',frontEdge:b.frontEdge};}
 for(const p of places){
  const id=identifyPlace(p);if(!id||facilityById[id].pattern==='shop')continue;
  const x=Number(p.x),y=Number(p.y);if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  const pt=xz([x,y]),address=normalizeAddress(p.road_address_name);
  const matches=buildings.filter(b=>!b.holes&&inPolygon(pt,b.points)&&(!address||address.endsWith(normalizeAddress(b.address))));
  if(matches.length!==1){skipped.push({placeId:p.id,id,reason:'ambiguous-or-outside-building'});continue;}
  const b=matches[0];
  // A supermarket in the basement must not turn a residential tower into a warehouse.
  if(id==='daiso'&&!/1\s*[-~]\s*3층/.test(p.road_address_name||'')&&identifyBuilding(b.properties)!=='daiso')continue;
  const record=identifyBuilding(b.properties),publicUse=['school','police','fire'].includes(id);
  if(record&&record!==id||!publicUse&&(b.levels>8||area(b)<220||/지하|B\d|(?:^|\s)[2-9]층/i.test(p.road_address_name||''))){skipped.push({placeId:p.id,id,reason:'tenant-or-incompatible-building'});continue;}
  if(b.facility&&b.facility.id!==id){skipped.push({placeId:p.id,id,reason:'conflicting-facility'});continue;}
  b.facility={id,sourceId:id,match:'contained-poi-and-address',placeId:String(p.id),name:p.place_name,frontEdge:b.frontEdge};
 }
 for(const b of buildings)if(b.facility){b.facility.reconstruction='reference-based type fitted to mapped building; not surveyed replica';applied.push({owner:b.seed,...b.facility});}
 return {applied,skipped};
}
