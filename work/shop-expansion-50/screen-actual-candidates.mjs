import fs from 'node:fs';
import {reviewAlleyCandidates} from './candidate-diagnostic.mjs';
import {inside,planNeighborhoodShops} from '../../outputs/domestic-test/shops/neighborhood-plan.js';
const filename=process.argv[2],data=JSON.parse(fs.readFileSync(filename)),f=data.files,cat=JSON.parse(fs.readFileSync('outputs/domestic-test/shops/library/catalog.json'));
const [lat,lon]=data.manifest.origin,p=lat*Math.PI/180,mLat=111132.92-559.82*Math.cos(2*p)+1.175*Math.cos(4*p)-.0023*Math.cos(6*p),mLon=111412.84*Math.cos(p)-93.5*Math.cos(3*p)+.118*Math.cos(5*p),xz=c=>[(c[0]-lon)*mLon,-(c[1]-lat)*mLat];
const terrain=f['environment/terrain.json'],N=terrain.angles;
const elevation=(x,z)=>{const d=Math.hypot(x,z),a=(Math.atan2(x,-z)+Math.PI*2)%(Math.PI*2)*N/(Math.PI*2),j=Math.floor(a),v=a-j;let r=0;while(r<terrain.radii.length-2&&terrain.radii[r+1]<d)r++;const u=Math.max(0,Math.min(1,(d-terrain.radii[r])/(terrain.radii[r+1]-terrain.radii[r]||1))),h=i=>terrain.positions[(i*N+j)*3+1]*(1-v)+terrain.positions[(i*N+(j+1)%N)*3+1]*v;return h(r)*(1-u)+h(r+1)*u;};
const triangles=Object.values(f['road-context.json'].positions).flatMap(a=>{const ts=[];for(let i=0;i<a.length;i+=9)ts.push([[a[i],a[i+2]],[a[i+3],a[i+5]],[a[i+6],a[i+8]]]);return ts;}),roadInfo=(x,z)=>triangles.some(t=>inside([x,z],t))?{road:true}:null;

const buildings=f['buildings.geojson'].features.flatMap(f=>{const pr=f.properties;return(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map(r=>{const points=r[0].slice(0,-1).map(xz),cx=points.reduce((s,a)=>s+a[0],0)/points.length,cz=points.reduce((s,a)=>s+a[1],0)/points.length,sp=pr.streetProfile;const frontEdge=sp?.frontStart?points.findIndex((a,i)=>{const b=points[(i+1)%points.length],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);return Math.min(dist(a,sp.frontStart)+dist(b,sp.frontEnd),dist(a,sp.frontEnd)+dist(b,sp.frontStart))<.1;}):sp?.frontEdge;return{seed:Number(pr.objectid),address:pr.street_name+' '+pr.house_number,properties:pr,points,holePoints:r.slice(1).map(r=>r.slice(0,-1).map(xz)),base:Math.min(...points.map(a=>elevation(...a)),elevation(cx,cz))-.1,top:elevation(cx,cz)+Math.max(1,pr.gro_flo_co)*3,levels:Math.max(1,pr.gro_flo_co),frontEdge};});});
const places=f['shops/places.json'].places,env={xz,elevation,roadInfo};const rows=reviewAlleyCandidates(buildings,places,cat,env);
// Independently verify diagnostic's accepted results against the unmodified production function.
const copy=structuredClone(buildings);for(const b of copy)if(b.properties.streetProfile?.grade===1)b.properties.streetProfile.use='mixed';
const production=planNeighborhoodShops(copy,places,cat,env);
for(const r of rows)if(r.placement&&!production.placements.some(p=>p.owner===r.owner&&p.assetId===r.placement.assetId))throw Error('diagnostic diverged');
const result={scene:data.manifest.id,limitations:'Candidate screening only: saved road mesh triangles (including sidewalks, as production roadInfo does) and original DEM; live terrain fitting and saved browser manual-asset selections require public UI verification. No scene is modified.',rows};
fs.writeFileSync(filename.replace('.json','-candidates.json'),JSON.stringify(result,null,2));console.table(rows.map(({owner,address,reason,rejected,placement})=>({owner,address,reason,asset:placement?.assetId,room:placement?.interiorDepth,rejected:JSON.stringify(rejected)})));
const alternate=[];
for(const row of rows.filter(r=>r.reason==='no-clear-fitting-frontage')){
 const base=buildings.find(b=>b.seed===row.owner);
 for(let edge=0;edge<base.points.length;edge++){
  const a=base.points[edge],c=base.points[(edge+1)%base.points.length];if(Math.hypot(a[0]-c[0],a[1]-c[1])<3.6)continue;
  const trial=structuredClone(buildings),b=trial.find(b=>b.seed===row.owner);b.properties.streetProfile.use='mixed';b.frontEdge=edge;
  const p=planNeighborhoodShops(trial,places,cat,env).placements.find(p=>p.placeId==='inferred-alley-'+row.owner);
  if(p)alternate.push({owner:row.owner,address:row.address,originalEdge:base.frontEdge,edge,asset:p.assetId,width:p.width,room:p.spec.interiorDepth});
 }
}
console.table(alternate);fs.writeFileSync(filename.replace('.json','-alternate-fronts.json'),JSON.stringify({note:'Diagnosis only; no saved scene changed. Alternative entrance faces need UI/visual verification.',alternate},null,2));
