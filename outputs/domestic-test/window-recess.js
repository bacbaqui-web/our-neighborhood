import * as T from 'three';

export const WINDOW_RECESS = .14;

// The opening belongs to the wall, not the glass. Keep this description shared
// by the facade finish and the opaque building shell so neither covers a sash.
export function windowOpening(out, records, building, edge, a, u, n, x, y, w, h, color) {
 const pad=.009, depth=WINDOW_RECESS, rect=[x-w/2-pad,x+w/2+pad,y-h/2-pad,y+h/2+pad];
 const record={owner:building.seed,inkObjectId:building.inkObjectId,edge,a,u,n,rect,depth,x:a[0]+u[0]*x,z:a[1]+u[1]*x,y,w,h};
 records.push(record);
 // Four reveal faces are enough. No repeated masonry blocks or extra outlines.
 const p=(xx,yy,zz)=>[a[0]+u[0]*xx+n[0]*zz,yy,a[1]+u[1]*xx+n[1]*zz];
 const corners=[p(rect[0],rect[2],.012),p(rect[1],rect[2],.012),p(rect[1],rect[3],.012),p(rect[0],rect[3],.012)];
 const back=[p(rect[0],rect[2],-depth-.035),p(rect[1],rect[2],-depth-.035),p(rect[1],rect[3],-depth-.035),p(rect[0],rect[3],-depth-.035)];
 for(let i=0;i<4;i++)out.reveal(corners[i],corners[(i+1)%4],back[(i+1)%4],back[i],color);
 return rect;
}

// Subtract a rectangular aperture from a convex wall triangle. Interpolate all
// attributes (including paint UVs and ink ownership); roof and floor caps stay
// byte-for-byte unchanged. This is a local planar cut, not a whole-scene CSG.
function subtract(poly, planes) {
 const outside=[];
 let rest=poly;
 for(const distance of planes){
  if(rest.length<3)break;
  const inside=[],out=[];
  for(let i=0;i<rest.length;i++){
   const a=rest[i],b=rest[(i+1)%rest.length],da=distance(a),db=distance(b),ia=da>=-1e-7,ib=db>=-1e-7;
   (ia?inside:out).push(a);
   if(ia!==ib){const t=da/(da-db),v=a.map((q,j)=>q+(b[j]-q)*t);inside.push(v);out.push(v);}
  }
  if(out.length>=3)outside.push(out);
  rest=inside;
 }
 return outside;
}

export function cutBuildingWindows(roots, openings) {
 const started=performance.now(),byOwner=new Map(),qa={depth:WINDOW_RECESS,windows:openings.length,buildings:new Set(openings.map(r=>r.owner)).size,cutMeshes:0,cutWallTriangles:0,addedTriangles:0,matchedWindows:0,milliseconds:0};
 for(const row of openings){const key=String(row.owner);if(!byOwner.has(key))byOwner.set(key,[]);byOwner.get(key).push(row);}
 const matched=new Set(),seen=new Set();
 for(const root of (Array.isArray(roots)?roots:[roots]).filter(Boolean)){
  root.updateWorldMatrix(true,true);
  root.traverse(mesh=>{
   if(!mesh.isMesh||seen.has(mesh)||!(mesh.geometry.userData.windowShell||mesh.userData.windowShell))return;
   seen.add(mesh);
   const owner=mesh.userData.windowOwner??mesh.userData.owner??mesh.userData.objectid;
   const rows=byOwner.get(String(owner));if(!rows?.length)return;
   const original=mesh.geometry,geo=original.index?original.toNonIndexed():original,attrs=Object.entries(geo.attributes),offsets=[];
   let size=0;for(const [name,attr] of attrs){offsets.push([name,attr,size]);size+=attr.itemSize;}
   const p=geo.attributes.position,normal=geo.attributes.normal,worldNormal=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),v=new T.Vector3(),nv=new T.Vector3(),out=attrs.map(()=>[]),groups=[];
   let count=0,changed=0;
   for(let i=0;i<p.count;i+=3){
    let polys=[Array.from({length:3},(_,j)=>offsets.flatMap(([,attr])=>Array.from({length:attr.itemSize},(_,k)=>attr.array[(i+j)*attr.itemSize+k])))];
    const world=polys[0].map(q=>v.set(q[0],q[1],q[2]).applyMatrix4(mesh.matrixWorld).toArray());
    nv.set(normal.getX(i),normal.getY(i),normal.getZ(i)).applyMatrix3(worldNormal).normalize();
    if(Math.abs(nv.y)<.1)for(const row of rows){
     if(Math.abs(nv.x*row.n[0]+nv.z*row.n[1])<.95)continue;
     const coord=q=>{v.set(q[0],q[1],q[2]).applyMatrix4(mesh.matrixWorld);return[(v.x-row.a[0])*row.u[0]+(v.z-row.a[1])*row.u[1],v.y,(v.x-row.a[0])*row.n[0]+(v.z-row.a[1])*row.n[1]];};
     const ds=world.map(q=>(q[0]-row.a[0])*row.n[0]+(q[2]-row.a[1])*row.n[1]);
     if(Math.max(...ds)<-row.depth-.04||Math.min(...ds)>.025)continue;
     const uv=world.map(q=>[(q[0]-row.a[0])*row.u[0]+(q[2]-row.a[1])*row.u[1],q[1]]),[l,r,b,t]=row.rect;
     if(Math.max(...uv.map(q=>q[0]))<=l||Math.min(...uv.map(q=>q[0]))>=r||Math.max(...uv.map(q=>q[1]))<=b||Math.min(...uv.map(q=>q[1]))>=t)continue;
     const planes=[q=>coord(q)[0]-l,q=>r-coord(q)[0],q=>coord(q)[1]-b,q=>t-coord(q)[1],q=>coord(q)[2]+row.depth+.04,q=>.025-coord(q)[2]];
     const next=[];for(const poly of polys)next.push(...subtract(poly,planes));polys=next;matched.add(row);changed++;
    }
    const material=geo.groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex??0,start=count;
    for(const poly of polys)for(let k=1;k<poly.length-1;k++){
     const tri=[poly[0],poly[k],poly[k+1]];
     const aa=new T.Vector3(...tri[0].slice(0,3)),bb=new T.Vector3(...tri[1].slice(0,3)),cc=new T.Vector3(...tri[2].slice(0,3));
     if(bb.sub(aa).cross(cc.sub(aa)).lengthSq()<1e-16)continue;
     for(const q of tri){offsets.forEach(([,attr,offset],j)=>{for(let k=0;k<attr.itemSize;k++)out[j].push(q[offset+k]);});count++;}
    }
    if(count>start){const last=groups.at(-1);if(last?.materialIndex===material)last.count+=count-start;else groups.push({start,count:count-start,materialIndex:material});}
   }
   if(changed){
    const result=new T.BufferGeometry();offsets.forEach(([name,attr],j)=>result.setAttribute(name,new T.BufferAttribute(new attr.array.constructor(out[j]),attr.itemSize,attr.normalized)));
    result.groups=groups;result.userData={...original.userData,recessedWindows:true};result.computeBoundingBox();result.computeBoundingSphere();mesh.geometry=result;
    qa.cutMeshes++;qa.cutWallTriangles+=changed;qa.addedTriangles+=(count-p.count)/3;original.dispose();
   }
   if(geo!==original)geo.dispose();
  });
 }
 qa.matchedWindows=matched.size;qa.milliseconds=Math.round(performance.now()-started);
 return qa;
}

export function auditWindowOpenings(roots, openings){
 const byOwner=new Map(),seen=new Set();
 for(const root of (Array.isArray(roots)?roots:[roots]).filter(Boolean)){root.updateWorldMatrix(true,true);root.traverse(m=>{
  if(!m.isMesh||seen.has(m)||!(m.geometry.userData.windowShell||m.userData.windowShell))return;seen.add(m);
  const id=String(m.userData.windowOwner??m.userData.owner??m.userData.objectid);if(!byOwner.has(id))byOwner.set(id,[]);byOwner.get(id).push(m);
 });}
 const ray=new T.Raycaster(),blocked=[];ray.near=0;ray.far=.185;
 for(const w of openings){ray.set(new T.Vector3(w.x+w.n[0]*.025,w.y,w.z+w.n[1]*.025),new T.Vector3(-w.n[0],0,-w.n[1]));
  if(ray.intersectObjects(byOwner.get(String(w.owner))||[],false).length)blocked.push({owner:w.owner,edge:w.edge,y:w.y});
 }
 return {checkedPanes:openings.length,blockedPanes:blocked.length,blockedExamples:blocked.slice(0,10)};
}
