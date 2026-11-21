import * as T from 'three';
import {visibleObject} from '../view-generation-visibility.js?v=view3c';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {loadAssetRegistry} from '../asset-encyclopedia/registry.js';
const inside=(p,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const polygons=g=>!g?[]:g.type==='Polygon'?(g.coordinates.length?[g.coordinates]:[]):g.type==='MultiPolygon'?g.coordinates:g.type==='GeometryCollection'?g.geometries.flatMap(polygons):[];
const contains=(g,p)=>polygons(g).some(r=>inside(p,r[0])&&!r.slice(1).some(h=>inside(p,h)));
const segmentDistance=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);};
export function planGrade1Props(layout,specs,dimensions,{elevation,roadInfo,obstacles=[]}){
 const placed=[],rejected={clearance:0,slope:0},occupied=obstacles.slice();if(!layout)return {placed,rejected};
 const data=layout.data,access=[...(data.vehicleApproaches||[]),data.vehicleAccess,data.protectedAccess,...(data.accessPaths||[]).map(p=>p.geometry),...[...(data.bays||[]),...(data.entries||[])].flatMap(p=>['footprint','connector','entrance','approach'].map(k=>p[k]))].filter(g=>g?.type),openings=[...(data.gaps||[]),...(data.siteDetails?.gates||[])].filter(g=>g.a&&g.b);
 const buildings=[...layout.plots.values()];
 function attempt(key,owner,p,n,height=0,wall=false){
  const dim=dimensions[key];if(!dim)return false;
  const angle=Math.atan2(n[0],n[1]),cs=Math.cos(angle),sn=Math.sin(angle),base=elevation(...p)+height;
  const points=[[dim.min[0],dim.min[2]],[dim.max[0],dim.min[2]],[dim.max[0],dim.max[2]],[dim.min[0],dim.max[2]]].map(([x,z])=>[p[0]+x*cs+z*sn,p[1]-x*sn+z*cs]);
  if(!visibleObject(p[0],p[1],dim.max[1]-dim.min[1],Math.hypot(dim.max[0]-dim.min[0],dim.max[2]-dim.min[2])*.5,base+dim.min[1])){rejected.clearance++;return false;}
  const samples=[...points,points.reduce((a,q)=>[a[0]+q[0]/4,a[1]+q[1]/4],[0,0])];
  const bounds=new T.Box3();for(const q of points){bounds.expandByPoint(new T.Vector3(q[0],base+dim.min[1],q[1]));bounds.expandByPoint(new T.Vector3(q[0],base+dim.max[1],q[1]));}
  if(samples.some(q=>buildings.some(b=>contains(b.building,q))||access.some(g=>contains(g,q))||openings.some(g=>segmentDistance(q,g.a,g.b)<.85)||(!wall&&roadInfo?.(...q)))||occupied.some(b=>b.intersectsBox(bounds))){rejected.clearance++;return false;}
  if(!wall&&Math.max(...points.map(q=>elevation(...q)))-Math.min(...points.map(q=>elevation(...q)))>.06){rejected.slope++;return false;}
  occupied.push(bounds);placed.push({key,owner,position:[p[0],base,p[1]],angle,wall,footprint:points});return true;
 }
 for(const b of buildings){
  const spec=specs.find(s=>s.seed===b.id),profile=b.streetProfile||spec?.properties?.streetProfile;
  if(!layout.owners.has(b.id)||profile?.grade!==1||spec?.manualAssetChoice)continue;
  const a=profile.frontStart,c=profile.frontEnd;if(!a||!c)continue;
  const L=Math.hypot(c[0]-a[0],c[1]-a[1]);if(L<3)continue;const u=[(c[0]-a[0])/L,(c[1]-a[1])/L];let n=[u[1],-u[0]],mid=[(a[0]+c[0])/2,(a[1]+c[1])/2];if(contains(b.building,[mid[0]+n[0]*.1,mid[1]+n[1]*.1]))n=n.map(v=>-v);
  // Search solid facade ends, leaving its central door and parking opening free.
  const mount=(t)=>[a[0]+u[0]*t+n[0]*.035,a[1]+u[1]*t+n[1]*.035];
  for(const [key,h,t]of [['gas-meter-bank',.85,.95],['wall-ac',2.25,L-.85],['drain-elbow',.85,L-.25],['service-box',1.4,L-.4],['cable-junction',1.6,.35]])attempt(key,b.id,mount(t),n,h,true);
  const walls=(data.walls||[]).filter(w=>w.owner===b.id&&w.a&&w.b&&Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1])>2.5);
  for(const w of walls.slice(0,1)){
   const m=[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2],d=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);let normal=[(w.b[1]-w.a[1])/d,-(w.b[0]-w.a[0])/d];
   if(!contains(b.plot,[m[0]+normal[0]*.5,m[1]+normal[1]*.5]))normal=normal.map(v=>-v);
   const p=[m[0]+normal[0]*.3,m[1]+normal[1]*.3];if(contains(b.plot,p))attempt('stacked-crates',b.id,p,normal);
   const drain=[m[0]+normal[0]*.36+(w.b[0]-w.a[0])/d*.9,m[1]+normal[1]*.36+(w.b[1]-w.a[1])/d*.9];if(contains(b.plot,drain))attempt('storm-grate',b.id,drain,normal,.002);
  }
 }
 return {placed,rejected};
}
export async function createGrade1Props(layout,specs,{elevation,roadInfo,detailGroup}){
 const root=new T.Group();root.name='Grade1RoadviewProps';if(!layout)return root;
 const registry=await loadAssetRegistry(),loader=new GLTFLoader(),templates=new Map(),dimensions={};
 for(const key of ['gas-meter-bank','wall-ac','drain-elbow','service-box','stacked-crates','cable-junction','storm-grate']){
  const entry=registry.resolve('grade1:'+key);if(!entry?.url)continue;
  const model=(await loader.loadAsync(entry.url)).scene;model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model);dimensions[key]={min:box.min.toArray(),max:box.max.toArray()};templates.set(key,model);
 }
 const obstacles=(detailGroup?.userData.placementProxies||[]).map(ps=>new T.Box3().setFromPoints(ps.map(p=>new T.Vector3(...p))));
 const plan=planGrade1Props(layout,specs,dimensions,{elevation,roadInfo,obstacles});
 for(const p of plan.placed){const object=templates.get(p.key).clone(true);object.position.set(...p.position);object.rotation.y=p.angle;object.userData={...object.userData,grade1Prop:p.key,owner:p.owner};object.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(object);}
 root.userData={placements:plan.placed,rejected:plan.rejected,source:'saved Mia roadview, inferred placement'};return root;
}
