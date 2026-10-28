import * as T from 'three';
import {chooseDistanceLOD} from './lod-policy.js?v=151';
export function normalizeRadius(value=150,max=300){const n=Number(value);return Math.max(50,Math.min(max,Math.round((Number.isFinite(n)&&n>0?n:150)/50)*50));}
export function selectedRadius(context,search=location.search){return normalizeRadius(new URLSearchParams(search).get('radius')||150,Math.max(50,Math.min(300,(context.sizeMetres||300)/2)));}
export function withinScope(points,radius){
 if(!points.length)return false;
 if(points.some(p=>Math.hypot(...p)<=radius))return true;
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [x,z]=points[j],[xx,zz]=points[i],dx=xx-x,dz=zz-z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,-(x*dx+z*dz)/l)):0;
  if(Math.hypot(x+t*dx,z+t*dz)<=radius)return true;
  if((z>0)!==(zz>0)&&0<(xx-x)*(-z)/(zz-z)+x)inside=!inside;
 }
 return points.length>2&&inside;
}
export function fullyInScope(points,radius){return points.length>0&&points.every(p=>Math.hypot(...p)<=radius);}
export function scopePlan(plan,owners,radius){
 const point=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x,z)<=radius;
 function keep(v){
  if(v?.owner!==undefined&&v.owner!==null&&!owners.has(Number(v.owner)))return false;
  if(Array.isArray(v)&&Array.isArray(v[0]))return withinScope(v,radius);
  if(v?.footprint)return owners.has(Number(v.owner))||withinScope(v.footprint,radius);
  if(v?.root)return Math.hypot(v.root[0],v.root[2])+(v.radius||0)<=radius;
  if(v?.position)return point(v.position[0],v.position[2]);
  if(Number.isFinite(v?.x)&&Number.isFinite(v?.z))return point(v.x,v.z);
  if(Array.isArray(v?.points))return withinScope(v.points,radius);
  return true;
 }
 return Object.fromEntries(Object.entries(plan).map(([k,v])=>[k,Array.isArray(v)?v.filter(keep):v]));
}
export function cropTerrain(root,radius){
 const sides=128,planes=Array.from({length:sides},(_,i)=>[Math.cos((i+.5)*Math.PI*2/sides),Math.sin((i+.5)*Math.PI*2/sides)]),limit=radius*Math.cos(Math.PI/sides);
 root.traverse(o=>{if(!o.isMesh||!['ground','road','path'].includes(o.name))return;
  const old=o.geometry,p=old.attributes.position,ix=old.index,names=Object.keys(old.attributes),sizes=names.map(n=>old.attributes[n].itemSize),offsets=sizes.map((_,i)=>sizes.slice(0,i).reduce((a,b)=>a+b,0)),out=names.map(()=>[]);
  const vertex=id=>names.flatMap(n=>{const a=old.attributes[n];return Array.from({length:a.itemSize},(_,k)=>a.array[id*a.itemSize+k]);});
  const pi=offsets[names.indexOf('position')];
  for(let i=0;i<(ix?.count??p.count);i+=3){let poly=[0,1,2].map(j=>vertex(ix?ix.getX(i+j):i+j));const points=poly.map(v=>[v[pi],v[pi+2]]);if(!withinScope(points,radius))continue;
   if(!fullyInScope(points,limit))for(const [nx,nz]of planes){const next=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],da=a[pi]*nx+a[pi+2]*nz-limit,db=b[pi]*nx+b[pi+2]*nz-limit;if(da<=0)next.push(a);if((da<=0)!==(db<=0)){const t=da/(da-db);next.push(a.map((v,k)=>v+(b[k]-v)*t));}}poly=next;if(!poly.length)break;}
   for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])names.forEach((n,k)=>out[k].push(...v.slice(offsets[k],offsets[k]+sizes[k])));
  }
  const g=new T.BufferGeometry();names.forEach((n,k)=>g.setAttribute(n,new T.Float32BufferAttribute(out[k],sizes[k])));g.computeBoundingSphere();o.geometry=g;old.dispose();
 });
}
export function disposeGenerated(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material,o._originalMaterial].flat().filter(Boolean))materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
export function buildingCells(specs,size=24){
 const cells=new Map();for(const b of specs){const x=b.points.reduce((s,p)=>s+p[0],0)/b.points.length,z=b.points.reduce((s,p)=>s+p[1],0)/b.points.length,key=String(b.seed);let c=cells.get(key);if(!c){c={key,owners:new Set(),box:new T.Box3(),buildings:[]};cells.set(key,c);}c.owners.add(b.seed);c.buildings.push(b);for(const [xx,zz] of b.points){c.box.expandByPoint(new T.Vector3(xx,b.base,zz));c.box.expandByPoint(new T.Vector3(xx,b.top+3,zz));}}return [...cells.values()];
}
export function desiredDetail(distance,previous=null){return distance>=(previous===2?250:230)?null:chooseDistanceLOD(distance,previous);}
export function createViewStreamer({cells,camera,create,remove,onChange,getSettings=()=>({lod:true,lodMode:"auto"})}){
 const frustum=new T.Frustum(),matrix=new T.Matrix4(),expanded=new T.Box3(),state=new Map();let epoch=0,lastWork=-Infinity,pending=0;
 function update(now=performance.now(),force=false){
  camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);
  const wanted=[],settings=getSettings(),cameraPosition=camera.getWorldPosition(new T.Vector3());let changed=false;
  for(const c of cells){const old=state.get(c.key),visible=frustum.intersectsBox(expanded.copy(c.box).expandByScalar(6)),distance=c.box.distanceToPoint(cameraPosition),inRange=distance<(old?250:230),level=visible&&inRange?(!settings.lod?0:settings.lodMode!=="auto"?Number(settings.lodMode):chooseDistanceLOD(distance,old?.level)):null;
   if(level!==null){wanted.push({c,level,distance,props:distance<(old?.props?125:105)});if(old)old.lastSeen=now;}
   else if(old){old.object.visible=false;if(now-old.lastSeen>1800||force){remove(old,c);state.delete(c.key);changed=true;}}
  }
  const tasks=wanted.filter(w=>{const s=state.get(w.c.key);if(s)s.object.visible=true;return !s||s.level!==w.level||s.props!==w.props;}).sort((a,b)=>a.distance-b.distance);pending=tasks.length;
  // One cell per frame; do not reconstruct the entire neighborhood on a camera move.
  if(tasks.length&&(force||now-lastWork>45)){const w=tasks[0],old=state.get(w.c.key);const next=create(w.c,w.level,w.props);if(old)remove(old,w.c);state.set(w.c.key,{...next,level:w.level,props:w.props,lastSeen:now});lastWork=now;changed=true;pending--;}
  if(changed){epoch++;onChange?.([...state.values()],epoch);}
  return {epoch,pending,resident:state.size,visible:[...state.values()].filter(s=>s.object.visible).length,props:[...state.values()].filter(s=>s.props&&s.object.visible).length,total:cells.length};
 }
 return {update,get epoch(){return epoch;},dispose(){for(const [key,s] of state)remove(s,cells.find(c=>c.key===key));state.clear();}};
}
export function scopeUtilities(plan,owners,radius){
 const map=new Map(),poles=plan.poles.filter((p,i)=>{if(Math.hypot(p.x,p.z)>radius)return false;map.set(i,map.size);return true;});
 const spans=plan.spans.filter(s=>map.has(s.a)&&map.has(s.b)).map(s=>({...s,a:map.get(s.a),b:map.get(s.b)}));
 const drops=plan.drops.filter(d=>map.has(d.pole)&&owners.has(Number(d.owner))).map(d=>({...d,pole:map.get(d.pole)}));
 return {...plan,poles,spans,drops,qa:{...plan.qa,poles:poles.length,spans:spans.length,houseDrops:drops.length}};
}
export function scopeArterial(plan,owners,radius){
 if(!plan)return null;const result=scopePlan(plan,owners,radius);
 const flat=values=>{const out=[];for(let i=0;i<values.length;i+=9)if(withinScope([[values[i],values[i+2]],[values[i+3],values[i+5]],[values[i+6],values[i+8]]],radius+5))out.push(...values.slice(i,i+9));return out;};
 result.surfaces=Object.fromEntries(Object.entries(plan.surfaces).map(([k,v])=>[k,flat(v)]));result.decals=Object.fromEntries(Object.entries(plan.decals).map(([k,v])=>[k,flat(v)]));
 for(const k of ['curbs','fences'])result[k]=plan[k].filter(v=>withinScope([v.a,v.b],radius+5));
 for(const k of ['platforms','exits'])result[k]=plan[k].filter(v=>withinScope(v.footprint||[v.point],radius));
 return result;
}
