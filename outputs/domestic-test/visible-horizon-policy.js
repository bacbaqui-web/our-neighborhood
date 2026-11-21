// Distances choose detail quality, never whether a visible building is kept.
export const TILE_SIZE=1000, HORIZON_BINS=1440, MAX_SOURCE_HEIGHT=600;
const TAU=Math.PI*2;
export function mapScale([lat]){const a=lat*Math.PI/180;return [111412.84*Math.cos(a)-93.5*Math.cos(3*a)+.118*Math.cos(5*a),111132.92-559.82*Math.cos(2*a)+1.175*Math.cos(4*a)-.0023*Math.cos(6*a)];}
export function tileBounds(origin,x,z){const [sx,sy]=mapScale(origin),[lat,lon]=origin,h=TILE_SIZE/2;return [lon+(x*TILE_SIZE-h)/sx,lat-(z*TILE_SIZE+h)/sy,lon+(x*TILE_SIZE+h)/sx,lat-(z*TILE_SIZE-h)/sy];}
const angle=(x,z)=>(Math.atan2(z,x)+TAU)%TAU;
function span(points,eye){const a=points.map(p=>angle(p[0]-eye[0],p[1]-eye[1])).sort((a,b)=>a-b);let gap=-1,index=0;for(let i=0;i<a.length;i++){const d=(i+1<a.length?a[i+1]:a[0]+TAU)-a[i];if(d>gap){gap=d;index=i;}}const start=a[(index+1)%a.length];return [start,start+TAU-gap];}
function distanceToRing(ring,p){let best=Infinity;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l)):0;best=Math.min(best,Math.hypot(a[0]+t*dx-p[0],a[1]+t*dz-p[1]));}return best;}
function rayDistance(ring,p,a){const dx=Math.cos(a),dz=Math.sin(a);let best=Infinity;for(let i=0;i<ring.length;i++){const v=ring[i],w=ring[(i+1)%ring.length],sx=w[0]-v[0],sz=w[1]-v[1],den=dx*sz-dz*sx;if(Math.abs(den)<1e-10)continue;const vx=v[0]-p[0],vz=v[1]-p[1],t=(vx*sz-vz*sx)/den,u=(vx*dz-vz*dx)/den;if(t>0&&u>=0&&u<=1)best=Math.min(best,t);}return best;}
export function buildingParts(features,origin,heightAt){
 const [sx,sy]=mapScale(origin),[lat,lon]=origin,out=[];
 for(const f of features){const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  polygons.forEach((poly,part)=>{const rings=poly.map(r=>r.slice(0,-1).map(([x,y])=>[(x-lon)*sx,(lat-y)*sy]));if(rings[0]?.length<3)return;const owner=Number(f.properties.objectid),height=Math.max(1,Number(f.properties.gro_flo_co)||1)*3;
   const base=Math.max(...rings.flat().map(p=>heightAt(...p)));
   out.push({owner,key:owner+':'+part,rings,height,base,top:base+height});});
 }return out;
}
export function createHorizon({position,eyeHeight=2,heightAt=()=>0,maxTerrain=0,terrainRadii=[],terrainUpper=()=>maxTerrain,pixelAngle=Math.PI/7200}){
 const eye=[...position],eyeY=heightAt(...eye)+eyeHeight,pixel=Math.tan(pixelAngle),step=TAU/HORIZON_BINS;
 const terrainProfiles=Array.from({length:HORIZON_BINS},(_,k)=>terrainRadii.filter(d=>d>=20).map(d=>{const a=(k+.5)*step;return {d,owner:"terrain",slope:(heightAt(eye[0]+Math.cos(a)*d,eye[1]+Math.sin(a)*d)-eyeY)/d};}));
 let profiles=terrainProfiles.map(p=>[...p]);
 function samples(points){const [a,b]=span(points,eye),out=[];for(let i=Math.floor(a/step);i<=Math.ceil(b/step);i++)out.push(i);return out;}
 const index=i=>((i%HORIZON_BINS)+HORIZON_BINS)%HORIZON_BINS;
 function cover(k,d,owner){let result=-Infinity;for(const hit of profiles[index(k)]){if(hit.d>=d)break;if(hit.owner!==owner)result=Math.max(result,hit.slope);}return result;}
 function rebuild(parts){
  profiles=terrainProfiles.map(p=>[...p]);
  const items=parts.map(b=>({...b,distance:distanceToRing(b.rings[0],eye),hits:[]}));
  for(const b of items)for(const i of samples(b.rings[0])){const d=rayDistance(b.rings[0],eye,(i+.5)*step);if(!Number.isFinite(d))continue;const k=index(i),slope=(b.top-eyeY)/Math.max(.1,d);b.hits.push({k,d,slope});profiles[k].push({d,slope,owner:b.key});}
  for(const profile of profiles)profile.sort((a,b)=>a.d-b.d);
  const visible=[];
  for(const b of items){let seen=b.hits.some(hit=>hit.slope>=cover(hit.k,hit.d,b.key)-pixel);
   // Resolve thin silhouettes between the regular rays with an exact centre ray.
   const [a,end]=span(b.rings[0],eye);if(!seen&&end-a<step*2){const bearing=(a+end)/2,d=rayDistance(b.rings[0],eye,bearing);let blocked=-Infinity;
    if(Number.isFinite(d)){for(const other of items){if(other.key===b.key||other.distance>=d)continue;const hit=rayDistance(other.rings[0],eye,bearing);if(hit<d)blocked=Math.max(blocked,(other.top-eyeY)/hit);}
     for(const r of terrainRadii)if(r>=20&&r<d)blocked=Math.max(blocked,(heightAt(eye[0]+Math.cos(bearing)*r,eye[1]+Math.sin(bearing)*r)-eyeY)/r);
     seen=(b.top-eyeY)/d>=blocked-pixel;}}
   if(seen){const {hits,...model}=b;visible.push(model);}
  }return visible;
 }
 function tileMinimumFloors(x,z){const h=TILE_SIZE/2,cx=x*TILE_SIZE,cz=z*TILE_SIZE,points=[[cx-h,cz-h],[cx+h,cz-h],[cx+h,cz+h],[cx-h,cz+h]];
  if(Math.abs(eye[0]-cx)<=h&&Math.abs(eye[1]-cz)<=h)return 1;
  const near=distanceToRing(points,eye),upper=(terrainUpper(x,z)+MAX_SOURCE_HEIGHT-eyeY)/Math.max(1,near);
  if(upper<pixel)return null;
  let minimum=Infinity;
  for(const i of samples(points)){const k=index(i),covered=Math.min(cover(k,near),cover(k+1,near),cover(k-1,near));if(upper>=covered-pixel)minimum=Math.min(minimum,Math.max(1,Math.floor(((covered-pixel)*near+eyeY-terrainUpper(x,z))/3)));}
  return Number.isFinite(minimum)?minimum:null;
 }
 return {rebuild,tileMinimumFloors,tileVisible:(x,z)=>tileMinimumFloors(x,z)!==null};
}
export function createTileFrontier(position=[0,0]){
 const pending=new Map(),visited=new Set();const key=(x,z)=>x+','+z;
 const add=(x,z)=>{const k=key(x,z);if(!visited.has(k)&&!pending.has(k))pending.set(k,{x,z,d:Math.hypot(x*TILE_SIZE-position[0],z*TILE_SIZE-position[1])});};
 add(Math.round(position[0]/TILE_SIZE),Math.round(position[1]/TILE_SIZE));
 return {next(){if(!pending.size)return null;let best;for(const v of pending.values())if(!best||v.d<best.d)best=v;pending.delete(key(best.x,best.z));visited.add(key(best.x,best.z));return best;},expand({x,z}){for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(dx||dz)add(x+dx,z+dz);},get size(){return pending.size;}};
}
