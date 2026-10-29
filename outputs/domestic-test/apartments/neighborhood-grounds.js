import * as T from 'three';
import {inPolygon} from '../facilities/placement.js';
import {FacadeBatch} from '../korean-facades.js';
import {createApartmentGrounds} from './models.js';
import {gardenPlant} from './garden/garden-vegetation.js';
import {pavingTexture} from './garden/rule-scene.js';
import {makeLivingAsset} from './garden/living-models.js';
import {createHybridTrees} from '../hybrid-tree.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';

// The map chooses building footprints. These small, clearance-checked pockets
// follow the same planting and furniture rules as the garden comparison.
export function planApartmentPlanting(plan){
 const plants=[];
 for(const [i,s] of plan.slots.entries()){
  if(!['garden','tree'].includes(s.kind))continue;
  const root=(x,z)=>[s.origin[0]+s.ux*x+s.nx*z,s.y+.09,s.origin[1]+s.uz*x+s.nz*z];
  const add=(x,z,h,r,count,type)=>{
   const p=gardenPlant({id:`apartment-${s.owner}-${i}-${plants.length}`,root:root(x,z),height:h,radius:r,count,variant:plants.length%6});
   for(const c of p.clumps){c.radius=Math.max(c.radius,type==='cover'?.15:.21);c.tone*=.84+(plants.length%5)*.025;}
   plants.push(p);
  };
  // The building side is layered groundcover and low shrubs; the outer 1.4 m
  // stays paved. Roots and their leaf spread remain inside the reserved pocket.
  for(let z=-s.d/2+.5;z<.65;z+=.48)for(let x=-s.w/2+.45;x<s.w/2-.35;x+=.49)
   add(x,z,.25+(plants.length%4)*.035,.34,8,'cover');
  for(let x=-s.w/2+.85;x<s.w/2-.7;x+=1.05)
   add(x,-.4,.65+(plants.length%3)*.12,.65,24,'shrub');
  for(const x of [-1.55,1.55])add(x,-1.2,s.era==='old'?3.8:s.era==='new'?2.8:3.3,1.05,72,'tree');
 }
 return plants;
}
export function planApartmentAmenities(plan,buildings,{elevation,roadInfo,obstacles=[]}){
 const facilities=[],used=new Set(),reserved=plan.slots.map(s=>s.footprint);
 const intersects=(a,b)=>a.some(p=>inPolygon(p,b))||b.some(p=>inPolygon(p,a))||a.some((p,i)=>b.some((q,j)=>{
  const r=a[(i+1)%a.length],t=b[(j+1)%b.length],cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
  return cross(p,r,q)*cross(p,r,t)<0&&cross(q,t,p)*cross(q,t,r)<0;
 }));
 for(const [kind,w,d] of [['play',14,12],['pergola',6.6,6.2],['recycling',6,4.4]])for(const s of plan.slots){
  if(s.kind==='path')continue;
  if(facilities.some(f=>f.kind===kind&&Math.hypot(f.origin[0]-s.origin[0],f.origin[1]-s.origin[1])<100))continue;
  const key=kind+':'+s.owner;if(used.has(key))continue;
  const origin=[s.origin[0]+s.nx*(s.d/2+d/2+.25),s.origin[1]+s.nz*(s.d/2+d/2+.25)];
  const at=(x,z)=>[origin[0]+s.ux*x+s.nx*z,origin[1]+s.uz*x+s.nz*z];
  const footprint=[at(-w/2,-d/2),at(w/2,-d/2),at(w/2,d/2),at(-w/2,d/2)],samples=[];
  for(let x=-w/2;x<=w/2+.01;x+=w/12)for(let z=-d/2;z<=d/2+.01;z+=d/12)samples.push(at(x,z));
  if([...buildings.map(b=>b.points),...obstacles.map(o=>o.footprint).filter(Boolean),...reserved].some(poly=>intersects(poly,footprint))||samples.some(p=>roadInfo(...p)))continue;
  const heights=samples.map(p=>elevation(...p,s.y));if(Math.max(...heights)-Math.min(...heights)>.25)continue;
  facilities.push({...s,kind,origin,w,d,footprint,y:Math.max(...heights)+.035});reserved.push(footprint);used.add(key);
 }
 return {...plan,facilities};
}
export function createNeighborhoodApartmentGrounds(plan,textures){
 const group=new T.Group();group.name='ApartmentGrounds';
 // Existing parking positions are retained; garden updates do not erase bays.
 group.add(createApartmentGrounds({...plan,slots:plan.slots.filter(s=>s.kind==='parking')}));
 const batch=new FacadeBatch(),texture=pavingTexture();
 const pavement=new T.MeshStandardMaterial({color:texture?0xffffff:0xbcb5a2,map:texture,bumpMap:texture,bumpScale:.012,roughness:1});
 for(const s of plan.slots){
  if(s.kind==='parking')continue;
  const o=batch.writer([s.origin[0],s.y,s.origin[1]],s.ux,s.uz,s.nx,s.nz),B=o.box;
  const path=s.kind==='path',width=s.w,depth=path?s.d:1.4,z=path?0:s.d/2-.7;
  const geo=new T.PlaneGeometry(width,depth);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,uv=geo.attributes.uv;
  for(let k=0;k<pos.count;k++){
   const x=pos.getX(k),zz=pos.getZ(k)+z;
   pos.setXYZ(k,s.origin[0]+s.ux*x+s.nx*zz,s.y+.105,s.origin[1]+s.uz*x+s.nz*zz);
   uv.setXY(k,x/2.4,zz/1.2);
  }
  geo.computeVertexNormals();const mesh=new T.Mesh(geo,pavement);mesh.name='apartment-textured-walk';mesh.receiveShadow=true;group.add(mesh);
  if(path){for(const x of [-s.w/2+.08,s.w/2-.08])B(x,.08,0,.14,.14,s.d,0xb9b7a9);continue;}
  B(0,.025,-.7,s.w,.08,s.d-1.4,0x726f52);
  for(const zz of [-s.d/2,s.d/2-1.4])B(0,.10,zz,s.w,.18,.13,0xc0bdac);
  for(const x of [-s.w/2+.065,s.w/2-.065])B(x,.10,-.7,.13,.18,s.d-1.4,0xc0bdac);
  const bench=makeLivingAsset('bench');bench.position.set(s.origin[0]+s.nx*.9,s.y+.11,s.origin[1]+s.nz*.9);
  bench.rotation.y=Math.atan2(-s.uz,s.ux);group.add(bench);
 }
 for(const s of plan.facilities||[]){
  const asset=makeLivingAsset(s.kind);asset.position.set(s.origin[0],s.y,s.origin[1]);asset.rotation.y=Math.atan2(-s.uz,s.ux);group.add(asset);
 }
 group.add(batch.finish('ApartmentGardenEdges'));
 const plans=planApartmentPlanting(plan),foliage=createHybridTrees(plans,textures);
 // Thousands of small plants share one wood draw call per species.
 for(const b of foliage.batches||[foliage]){
  const meshes=[...b.wood.children];if(!meshes.length)continue;
  const geometry=mergeGeometries(meshes.map(m=>m.geometry),false),material=meshes[0].material;
  b.wood.clear();const mesh=new T.Mesh(geometry,material);mesh.name='apartment-rooted-branches';b.wood.add(mesh);
  for(const m of meshes)m.geometry.dispose();
 }
 group.add(foliage.group);
 group.userData={plan,method:'shared-garden-growth-and-textured-paving',plants:plans.length,leafClusters:plans.reduce((n,p)=>n+p.clumps.length,0),parkingPreserved:true,facilities:(plan.facilities||[]).map(f=>f.kind)};
 return {group,foliage};
}

export function installApartmentGroundControls(buildings,plan,camera,controls,requestRender){
 let panel=document.getElementById('apartmentGroundControls');
 if(!panel){panel=document.createElement('div');panel.id='apartmentGroundControls';document.getElementById('environmentControls').prepend(panel);}
 panel.replaceChildren();
 const apartments=buildings.filter(b=>b.apartment),label=document.createElement('label');label.textContent='아파트 둘러보기';
 const select=document.createElement('select');select.setAttribute('aria-label','아파트 위치');select.add(new Option(apartments.length?'아파트 선택':'이 범위에는 아파트가 없습니다',''));
 for(const [i,b] of apartments.entries())select.add(new Option(`${{old:'구축',middle:'중간 시기',new:'신축'}[b.apartment.era]} · ${b.properties?.buld_nm_dc||b.properties?.buld_nm||b.seed}`,String(i)));
 select.onchange=()=>{if(select.value==='')return;const b=apartments[Number(select.value)],s=plan.slots.find(s=>s.owner===b.seed&&s.kind!=='parking');
  const p=s?s.origin:[b.points.reduce((n,p)=>n+p[0],0)/b.points.length,b.points.reduce((n,p)=>n+p[1],0)/b.points.length];
  const y=s?.y??b.base;controls.target.set(p[0],y+3,p[1]);camera.position.set(p[0]+(s?.nx??1)*17,y+8,p[1]+(s?.nz??1)*17);controls.update();requestRender();};
 label.append(select);panel.append(label);const link=document.createElement('a');link.href='./apartments/garden/';link.textContent='시대별 아파트·정원 비교';link.target='_blank';link.rel='noopener';panel.append(link);
}
