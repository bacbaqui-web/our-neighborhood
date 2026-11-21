import {prepareRulesLayout,renderRulesLayout,installRulesTour} from './site-layout27.js?v=grounds1';
import {roadVehicle} from './memo-scene.js?v=151';
import * as T from 'three';
import {createInfill} from './site-layout-models/infill-models.js?v=view3c';
import {createPiloti} from './site-layout-models/piloti-models.js';
import {createGroundFloors} from './site-layout-models/ground-floor-models.js?v=masonry19';
import {createBuildingShellGeometry} from './building-shell.js?v=recess22';
import {facadeStyles} from './korean-facades.js';
const parts=g=>!g?[]:g.type==='GeometryCollection'?g.geometries.flatMap(parts):g.type==='Polygon'?(g.coordinates.length?[g.coordinates]:[]):g.type==='MultiPolygon'?g.coordinates:[];
const inside=(p,r)=>{let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const contains=(g,p)=>parts(g).some(r=>inside(p,r[0])&&!r.slice(1).some(h=>inside(p,h)));
const ringShape=r=>{const s=new T.Shape(r[0].map(([x,z])=>new T.Vector2(x,-z)));for(const h of r.slice(1))s.holes.push(new T.Path(h.map(([x,z])=>new T.Vector2(x,-z))));return s;};
const crossed=(a,b,c,d)=>{const f=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);return f(a,b,c)*f(a,b,d)<-1e-8&&f(c,d,a)*f(c,d,b)<-1e-8;};
const ringsHit=(a,b)=>a.some(p=>inside(p,b))||b.some(p=>inside(p,a))||a.some((p,i)=>b.some((q,j)=>crossed(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
export function prepareSiteLayout(packageData,specs,meshes,elevation,radius=150){
 if(packageData?.version===27)return prepareRulesLayout(packageData,specs,meshes,elevation,radius);
 if(!packageData?.plots?.buildings?.length)return null;
 const plans=new Map(packageData.plots.buildings.map(b=>[Number(b.id),b])),pm=new Map(packageData.piloti.plans.map(p=>[p.id,p])),gm=new Map(packageData.groundFloors.plans.map(p=>[p.id,p]));
 // Keep mapped facilities, apartments and existing shop designs authoritative.
 const owners=new Set(specs.filter(b=>plans.has(b.seed)&&!b.facility&&!b.apartment&&!b.arterialKiosk&&!b.arterialFacades?.length&&!b.storefronts?.length).map(b=>b.seed));
 const merged=packageData.plots.qa.mergedBuildings||[];
 for(const m of merged){const source=specs.find(b=>b.seed===m.source);if(source&&(source.facility||source.storefronts?.length))owners.delete(m.target);}
 const removed=new Set(merged.filter(m=>owners.has(m.target)).map(m=>m.source));
 for(let i=specs.length-1;i>=0;i--)if(removed.has(specs[i].seed))specs.splice(i,1);
 for(let i=meshes.length-1;i>=0;i--)if(removed.has(Number(meshes[i].userData.objectid))){meshes[i].removeFromParent();meshes.splice(i,1);}
 const excluded=packageData.plots.buildings.filter(b=>!owners.has(b.id)).map(b=>b.plot);
 const forbidden=p=>Math.hypot(...p)>radius+12||excluded.some(g=>contains(g,p));
 const group=new T.Group();group.name='RoadviewGroundFloors';const bases=new Map();
 for(const b of specs){if(!owners.has(b.seed))continue;const plan=plans.get(b.seed),front=packageData.frontages.buildings[b.seed],rings=parts(front.renderBuilding||plan.building)[0];if(!rings)continue;
  const custom=gm.get(b.seed),piloti=pm.get(b.seed),open=custom||piloti,points=rings[0].slice(0,-1),shape=ringShape(rings);
  const entryA=points[front.frontEdge??0],entryB=points[((front.frontEdge??0)+1)%points.length];
  const base=open?Math.max(...points.map(p=>elevation(...p))):Math.min(...points.map(p=>elevation(...p)))-.1;
  const styleIndex=b.styleIndex??front.styleIndex,style=facadeStyles[styleIndex],top=base+plan.levels*3;
  const mesh=meshes.find(m=>Number(m.userData.objectid)===b.seed);if(!mesh)continue;
  mesh.geometry.dispose();mesh.geometry=createBuildingShellGeometry(shape,base+(open?3:0),top,style.wall,style.roof);for(const child of [...mesh.children]){child.geometry?.dispose();child.material?.dispose();mesh.remove(child);}mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry,30),new T.LineBasicMaterial({color:0x426c79,transparent:true,opacity:.55})));mesh.userData.base=base;
  Object.assign(b,{points,base:base+(piloti?3:0),top,levels:plan.levels-(piloti?1:0),styleIndex,frontEdge:front.frontEdge,frontage:undefined,hasEntry:front.verifiedAccess,openGround:!!open,groundOpening:custom?.opening,groundOpeningBase:base,continuousParapet:true,holePoints:rings.slice(1).map(h=>h.slice(0,-1)),holes:rings.length>1});bases.set(b.seed,base);
  if(open){const lower=new T.Group();if(custom)for(const r of parts(custom.lower)){const shell=new T.Mesh(createBuildingShellGeometry(ringShape(r),0,2.8,style.wall,style.wall),new T.MeshStandardMaterial({vertexColors:true,roughness:1}));shell.userData.windowOwner=b.seed;lower.add(shell);}
   const slab=new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:false});slab.rotateX(-Math.PI/2);slab.translate(0,2.8,0);lower.add(new T.Mesh(slab,new T.MeshStandardMaterial({color:0x969b93,roughness:1})));lower.add(piloti?createPiloti([piloti]):createGroundFloors([{...custom,styleIndex,wallTexture:b.wallTexture}]));if(piloti){const low=Math.min(...points.map(p=>elevation(...p)))-base-.08;lower.add(new T.Mesh((()=>{const g=new T.ExtrudeGeometry(shape,{depth:.08-low,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,low,0);return g;})(),new T.MeshStandardMaterial({color:0xc8c7bd,roughness:1})));}lower.position.y=base;group.add(lower);
  }
  const parapet=packageData.frontages.parapets.find(p=>p.id===b.seed);if(parapet)for(const [g,y,h,color] of [[parapet.wall,top,.58,style.wall],[parapet.cap,top+.58,.065,0xc0beb0]])for(const r of parts(g)){const geo=new T.ExtrudeGeometry(ringShape(r),{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,y,0);group.add(new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:1})));}
 }
 const d=structuredClone(packageData.infill),activePlots=packageData.plots.buildings.filter(b=>owners.has(b.id)).map(b=>b.plot),active=p=>activePlots.some(g=>contains(g,p));
 // Entire geometry is rejected if it crosses a retained facility's parcel.
 const safeGeometry=g=>parts(g).every(r=>excluded.every(e=>parts(e).every(er=>!ringsHit(r[0],er[0]))));
 const safeLine=v=>![v.a,v.b,[(v.a[0]+v.b[0])/2,(v.a[1]+v.b[1])/2]].some(forbidden)&&excluded.every(g=>parts(g).every(r=>!r[0].slice(1).some((p,i)=>crossed(v.a,v.b,r[0][i],p))));
 d.zones=d.zones.filter(z=>(z.owner==null||owners.has(z.owner))&&safeGeometry(z.geometry));
 d.walls=d.walls.filter(safeLine);d.gaps=d.gaps.filter(g=>safeLine(g)&&(!g.geometry||safeGeometry(g.geometry)));
 d.bays=d.bays.filter(b=>(b.owner==null||owners.has(b.owner))&&!forbidden(b.point)&&safeGeometry(b.footprint));for(const b of d.bays)if(b.piloti){const owner=packageData.plots.buildings.find(p=>contains(p.building,b.point));b.owner=owner?.id;b.floorElevation=bases.get(b.owner);}d.bays=d.bays.filter(b=>!b.piloti||bases.has(b.owner));
 d.roadBays=(d.roadBays||[]).filter(b=>d.bays.some(q=>q.point[0]===b.point[0]&&q.point[1]===b.point[1]));
 d.plants=d.plants.filter(p=>!forbidden(p.point));d.drains=d.drains.filter(p=>!forbidden(p.point));
 d.entries=(d.entries||[]).filter(safeLine);d.entranceDrains=(d.entranceDrains||[]).filter(safeLine);d.accessPaths=(d.accessPaths||[]).filter(p=>safeGeometry(p.geometry));d.vehicleApproaches=(d.vehicleApproaches||[]).filter(safeGeometry);
 const poleIds=new Map();d.poles=d.poles.filter((p,i)=>{if(forbidden(p.point))return false;poleIds.set(i,poleIds.size);return true;});d.poleLinks=(d.poleLinks||[]).filter(([a,b])=>poleIds.has(a)&&poleIds.has(b)).map(([a,b])=>[poleIds.get(a),poleIds.get(b)]);
 for(const key of ['fences','gates'])d.siteDetails[key]=(d.siteDetails[key]||[]).filter(safeLine);
 for(const key of ['props','booths'])d.siteDetails[key]=(d.siteDetails[key]||[]).filter(p=>!forbidden(p.point));d.siteDetails.patches=d.siteDetails.patches.filter(p=>safeGeometry(p.geometry));
 const filterPlan=plan=>{const p=structuredClone(plan);for(const [key,value] of Object.entries(p))if(Array.isArray(value))p[key]=value.filter(v=>{if(v&&typeof v==='object'){if(v.owner!=null&&(owners.has(Number(v.owner))||removed.has(Number(v.owner))))return false;if(v.owners?.some(id=>owners.has(Number(id))))return false;if(Array.isArray(v)&&Array.isArray(v[0])&&v.some(active))return false;const point=v.point||v.origin||(Number.isFinite(v.x)&&Number.isFinite(v.z)?[v.x,v.z]:null)||(v.a&&v.b?[(v.a[0]+v.b[0])/2,(v.a[1]+v.b[1])/2]:null);if(point&&active(point))return false;}return true;});return p;};
 return {owners,group,data:d,openOwners:new Set([...pm.keys(),...gm.keys()].filter(id=>owners.has(id))),active,replacesGround:p=>d.zones.some(z=>contains(z.geometry,p))||active(p),filterPlan,bases,plots:plans,groundPlans:gm,pilotiPlans:pm,qa:{version:1,buildings:owners.size,mergedBuildings:removed.size,piloti:[...owners].filter(id=>pm.has(id)).length,groundFloors:[...owners].filter(id=>gm.has(id)).length,walls:d.walls.length,parking:d.bays.length,plants:d.plants.length,poles:d.poles.length,retainedSpecialBuildings:specs.filter(b=>b.facility||b.storefronts?.length).length,terrain:'original terrain sampled at placement'}};
}
export async function renderSiteLayout(layout,elevation){
 if(layout?.version===27)return renderRulesLayout(layout);
 if(!layout)return null;
 const surface=(g,color,y,parent)=>{for(const rings of parts(g)){const original=new T.ShapeGeometry(ringShape(rings)),p=original.attributes.position,ix=original.index,vertices=[];
  const split=(a,b,c,depth=0)=>{const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);if(depth<7&&Math.max(dist(a,b),dist(b,c),dist(c,a))>3){const ab=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca=[(c[0]+a[0])/2,(c[1]+a[1])/2];split(a,ab,ca,depth+1);split(ab,b,bc,depth+1);split(ca,bc,c,depth+1);split(ab,bc,ca,depth+1);}else for(const q of [a,b,c])vertices.push(q[0],elevation(...q)+y,q[1]);};
  for(let i=0;i<(ix?.count??p.count);i+=3)split(...[0,1,2].map(k=>{const j=ix?ix.getX(i+k):i+k;return[p.getX(j),-p.getY(j)];}));original.dispose();const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(vertices.flatMap((_,i)=>i%3===0?[vertices[i],vertices[i+2]]:[]),2));geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:1}));mesh.userData.surfaceOverlay=true;mesh.userData.surfaceOccluder=true;mesh.receiveShadow=true;parent.add(mesh);
 }};
 const pilotis=layout.data.bays.filter(b=>b.piloti).map(b=>({geometry:layout.plots.get(b.owner)?.building,height:b.floorElevation})).filter(b=>b.geometry&&Number.isFinite(b.height));
 const placementHeight=(x,z)=>pilotis.find(b=>contains(b.geometry,[x,z]))?.height??elevation(x,z);
 const infill=await createInfill({...layout.data,poles:[],poleLinks:[]},surface,{elevation:placementHeight,carFactory:(i,b)=>{for(let j=0;j<32;j++){const car=roadVehicle(false,i+j),dim=car?.userData.dimensions;if(car&&dim[0]<2.5&&dim[2]<(b.length||5.2))return car;}return null;}});layout.qa.treeProfiles=infill.foliage?.group.userData.treeProfiles||[];layout.qa.vehicleContacts=infill.objects.children.filter(o=>o.userData.groundFit).map(o=>o.userData.groundFit);layout.group.add(infill.ground,infill.objects);layout.group.userData.layout=layout.qa;return {...infill,group:layout.group};
}

export function installSiteLayoutTour(layout,{camera,controls,elevation,requestRender}){
 if(layout?.version===27)return installRulesTour(layout,{camera,controls,elevation,requestRender});
 if(!layout)return;document.getElementById('siteLayoutTour')?.remove();const section=document.createElement('section');section.id='siteLayoutTour';section.style.cssText='padding:12px;border:1px solid #b3c7c8;border-radius:10px;margin:12px 0;font-size:13px';const title=document.createElement('b');title.textContent='새 배치 확인';const text=document.createElement('p');text.textContent=`건물 ${layout.qa.buildings}동 · 담장 ${layout.qa.walls}구간 · 주차 ${layout.qa.parking}칸`;const select=document.createElement('select');select.setAttribute('aria-label','새 배치 위치');select.append(new Option('확인할 장소 선택',''));const targets=[];
 const add=(label,p,height=10,eye=null)=>{targets.push({label,p,height,eye});select.append(new Option(label,String(targets.length-1)));};
 for(const kind of ['parking','active','abandoned','wild','garden']){const z=layout.data.zones.filter(z=>z.kind===kind&&z.focus).sort((a,b)=>(b.area||0)-(a.area||0))[0];if(z)add(({parking:'주차장',active:'공사장',abandoned:'방치 공사장',wild:'무성한 녹지',garden:'정원'})[kind],z.focus,kind==='parking'?24:15);}
 const wallTargets=layout.data.walls.filter(w=>w.connectedBoundary&&Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1])>3).sort((a,b)=>Math.hypot(...a.a)-Math.hypot(...b.a)).slice(0,3);for(const [i,w] of wallTargets.entries()){const p=[(w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2],dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],L=Math.hypot(dx,dz),eyes=[1,-1].map(s=>[p[0]-dz/L*6*s,p[1]+dx/L*6*s]);const eye=eyes.find(e=>![...layout.plots.values()].some(b=>contains(b.building,e)))||eyes[0];add('담장 '+(i+1),p,i===1?2.8:16,eye);}
 for(const p of [...layout.pilotiPlans.values()].filter(p=>layout.owners.has(p.id)).slice(0,3))add('필로티 '+(targets.filter(t=>t.label.startsWith('필로티')).length+1),p.focus,3.5,p.camera);
 const contacts=layout.qa.vehicleContacts||[];const steep=contacts.slice().sort((a,b)=>(Math.max(...b.contacts.map(c=>c.at[1]))-Math.min(...b.contacts.map(c=>c.at[1])))-(Math.max(...a.contacts.map(c=>c.at[1]))-Math.min(...a.contacts.map(c=>c.at[1]))))[0];if(steep){const p=steep.contacts.reduce((a,c)=>[a[0]+c.at[0]/4,a[1]+c.at[2]/4],[0,0]);add('경사면 주차',p,2.5,[p[0]+7,p[1]+7]);}
 const road=layout.data.roadBays[0];if(road)add('도로 가장자리 주차',road.point,12);
 select.onchange=()=>{const t=targets[Number(select.value)];if(!t||select.value==='')return;const [x,z]=t.p,y=elevation(x,z);controls.target.set(x,y+1,z);if(t.eye)camera.position.set(t.eye[0],elevation(...t.eye)+t.height,t.eye[1]);else camera.position.set(x+10,y+t.height,z+14);controls.update();requestRender();};section.append(title,text,select);document.getElementById('environmentControls').prepend(section);
}
export function siteUtilityPlan(layout,original,elevation){
 if(!layout)return original;
 const poles=original.poles.filter(p=>!layout.active([p.x,p.z])&&!contains(layout.data.grade1PoleArea,[p.x,p.z])).map(p=>({...p})),oldIndices=new Map();
 original.poles.forEach((p,i)=>{const j=poles.findIndex(q=>q.id===p.id);if(j>=0)oldIndices.set(i,j);});
 const spans=original.spans.filter(s=>oldIndices.has(s.a)&&oldIndices.has(s.b)).map(s=>({...s,a:oldIndices.get(s.a),b:oldIndices.get(s.b)}));const indices=new Map();
 for(const [i,p] of layout.data.poles.entries()){
  const duplicate=poles.findIndex(q=>Math.hypot(q.x-p.point[0],q.z-p.point[1])<6);
  if(duplicate>=0){indices.set(i,duplicate);continue;}
  const near=original.poles.slice().sort((a,b)=>Math.hypot(a.x-p.point[0],a.z-p.point[1])-Math.hypot(b.x-p.point[0],b.z-p.point[1]))[0];
  indices.set(i,poles.length);poles.push({...(near||{nx:1,nz:0,ux:0,uz:1}),...Object.fromEntries(['nx','nz','ux','uz'].filter(k=>Number.isFinite(p[k])).map(k=>[k,p[k]])),x:p.point[0],z:p.point[1],poleHeight:p.height||7.5,radius:.14,kind:'alley',lamp:p.lamp??(i%3===0)});
 }

 for(const [a,b] of layout.data.poleLinks||[])if(indices.has(a)&&indices.has(b)&&indices.get(a)!==indices.get(b)){const A=poles[indices.get(a)],B=poles[indices.get(b)];spans.push({a:indices.get(a),b:indices.get(b),length:Math.hypot(A.x-B.x,A.z-B.z)});}
 poles.forEach((p,i)=>p.id=i);const drops=original.drops.filter(d=>oldIndices.has(d.pole)&&!layout.owners.has(d.owner)).map(d=>({...d,pole:oldIndices.get(d.pole)}));layout.qa.poles=poles.length;return {...original,poles,spans,drops,qa:{...original.qa,poles:poles.length,spans:spans.length,houseDrops:drops.length}};
}

// Never move the shared terrain vertices: a vertex may belong to triangles outside a parcel.
export function fitSiteLayoutTerrain(layout,ground){
 if(layout)layout.qa.floorTerrainVertices=0;
}
