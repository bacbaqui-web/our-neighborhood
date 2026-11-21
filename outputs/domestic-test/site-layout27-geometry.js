import {finishDepth} from './surface-policy.js';
import * as T from 'three';
export const polygons=g=>!g?[]:g.type==='Polygon'?(g.coordinates[0]?.length?[g.coordinates]:[]):g.type==='MultiPolygon'?g.coordinates:(g.geometries||[]).flatMap(polygons);
export const inRing=(p,r)=>{let yes=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
export const contains=(g,p)=>polygons(g).some(r=>inRing(p,r[0])&&!r.slice(1).some(h=>inRing(p,h)));
export const shapeOf=r=>{const s=new T.Shape(r[0].map(([x,z])=>new T.Vector2(x,-z)));for(const h of r.slice(1))s.holes.push(new T.Path(h.map(([x,z])=>new T.Vector2(x,-z))));return s;};
export function distanceTo(g,p){if(contains(g,p))return 0;let best=Infinity;for(const r of polygons(g))for(const ring of r)for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t));}return best;}
// A frozen copy of the corrected terrain. Later parcel surfaces cannot feed back
// into their own elevation calculations or deform a neighbouring road.
export function snapshotHeight(meshes,fallback=()=>0){
 const cells=new Map(),missingCache=new Map();for(const m of meshes){m.updateWorldMatrix(true,false);const p=m.geometry.attributes.position,ix=m.geometry.index;
 for(let i=0;i<(ix?.count||p.count);i+=3){const [a,b,c]=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(i+k):i+k).applyMatrix4(m.matrixWorld)),den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-8)continue;
 const tri={a,b,c,den};for(let x=Math.floor(Math.min(a.x,b.x,c.x)/5);x<=Math.floor(Math.max(a.x,b.x,c.x)/5);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/5);z<=Math.floor(Math.max(a.z,b.z,c.z)/5);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(tri);}}}
 return (x,z)=>{let y=-Infinity;for(const {a,b,c,den} of cells.get(Math.floor(x/5)+','+Math.floor(z/5))||[]){const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den,w=1-u-v;if(Math.min(u,v,w)>=-1e-6)y=Math.max(y,u*a.y+v*b.y+w*c.y);}if(Number.isFinite(y))return y;
 // The original ground has holes beneath its old building footprints. The
 // reviewed road can cross those old holes; interpolate the surrounding ground
 // rather than returning sea level and making a spike in the new pavement.
 function missing(x,z){const key=x+","+z;if(missingCache.has(key))return missingCache.get(key);const near=new Set();for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++)for(const t of cells.get((Math.floor(x/5)+i)+','+(Math.floor(z/5)+j))||[])near.add(t);
 const candidates=[];for(const {a,b,c} of near){let best=Infinity,cy=0;for(const [p,q] of [[a,b],[b,c],[c,a]]){const dx=q.x-p.x,dz=q.z-p.z,t=Math.max(0,Math.min(1,((x-p.x)*dx+(z-p.z)*dz)/(dx*dx+dz*dz||1))),d=(x-p.x-dx*t)**2+(z-p.z-dz*t)**2;if(d<best){best=d;cy=p.y+(q.y-p.y)*t;}}candidates.push([best,cy]);}
 candidates.sort((a,b)=>a[0]-b[0]);let total=0,weight=0;for(const [d,v] of candidates.slice(0,6)){const w=1/Math.max(.01,d);total+=v*w;weight+=w;}const result=weight?total/weight:fallback(x,z);missingCache.set(key,result);return result;}
 const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;return missing(a,b)*(1-u)*(1-v)+missing(a+1,b)*u*(1-v)+missing(a,b+1)*(1-u)*v+missing(a+1,b+1)*u*v;};
}
// Clip all vertex attributes together. No translucent overlay or depth hack.
export function subtractRectangle(mesh,[x0,z0,x1,z1]){
 const src=mesh.geometry,g=src.index?src.toNonIndexed():src,attrs=Object.entries(g.attributes),stride=attrs.reduce((n,[,a])=>n+a.itemSize,0),off=[];let count=0;for(const [,a]of attrs){off.push(count);count+=a.itemSize;}const pi=attrs.findIndex(([n])=>n==='position'),po=off[pi],out=attrs.map(()=>[]),world=mesh.matrixWorld,inv=world.clone().invert(),tmp=new T.Vector3();
 const vertex=i=>{const v=[];for(const [,a]of attrs)for(let k=0;k<a.itemSize;k++)v.push(a.array[i*a.itemSize+k]);tmp.set(...v.slice(po,po+3)).applyMatrix4(world);v.splice(po,3,tmp.x,tmp.y,tmp.z);return v;};
 const emit=v=>{v=v.slice();tmp.set(...v.slice(po,po+3)).applyMatrix4(inv);v.splice(po,3,tmp.x,tmp.y,tmp.z);for(let j=0;j<attrs.length;j++)out[j].push(...v.slice(off[j],off[j]+attrs[j][1].itemSize));};
 for(let i=0;i<g.attributes.position.count;i+=3){let inside=[vertex(i),vertex(i+1),vertex(i+2)],outside=[];
 for(const f of [v=>v[po]-x0,v=>x1-v[po],v=>v[po+2]-z0,v=>z1-v[po+2]]){if(!inside.length)break;const yes=[],no=[];for(let j=0;j<inside.length;j++){const a=inside[j],b=inside[(j+1)%inside.length],fa=f(a),fb=f(b);(fa>=0?yes:no).push(a);if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb),q=a.map((n,k)=>n+(b[k]-n)*t);yes.push(q);no.push(q);}}if(no.length>=3)outside.push(no);inside=yes;}
 for(const poly of outside)for(let j=1;j<poly.length-1;j++){emit(poly[0]);emit(poly[j]);emit(poly[j+1]);}}
 const next=new T.BufferGeometry();for(let i=0;i<attrs.length;i++){const [n,a]=attrs[i];next.setAttribute(n,new T.BufferAttribute(new a.array.constructor(out[i]),a.itemSize,a.normalized));}next.userData={...src.userData};next.computeBoundingSphere();mesh.geometry=next;src.dispose();if(g!==src)g.dispose();
}
// Retain UVs and owner ids while adding enough vertices for the actual slope.
export function drapeGeometry(source,height,maxEdge=2){
 const g=source.index?source.toNonIndexed():source,attrs=Object.entries(g.attributes),offsets=[],out=attrs.map(()=>[]);let n=0;for(const [,a]of attrs){offsets.push(n);n+=a.itemSize;}const po=offsets[attrs.findIndex(([k])=>k==='position')];
 const vertex=i=>attrs.flatMap(([,a])=>Array.from(a.array.slice(i*a.itemSize,(i+1)*a.itemSize)));
 const emit=v=>{v=v.slice();v[po+1]+=height(v[po],v[po+2]);for(let i=0;i<attrs.length;i++)out[i].push(...v.slice(offsets[i],offsets[i]+attrs[i][1].itemSize));};
 function split(a,b,c,depth=0){const dist=(p,q)=>Math.hypot(p[po]-q[po],p[po+2]-q[po+2]),ds=[dist(a,b),dist(b,c),dist(c,a)],idx=ds.indexOf(Math.max(...ds));if(depth<12&&ds[idx]>maxEdge){const vs=[a,b,c],A=vs[idx],B=vs[(idx+1)%3],C=vs[(idx+2)%3],M=A.map((x,i)=>(x+B[i])/2);split(A,M,C,depth+1);split(M,B,C,depth+1);}else{emit(a);emit(b);emit(c);}}
 for(let i=0;i<g.attributes.position.count;i+=3)split(vertex(i),vertex(i+1),vertex(i+2));
 const next=new T.BufferGeometry();for(let i=0;i<attrs.length;i++){const [key,a]=attrs[i];next.setAttribute(key,new T.BufferAttribute(new a.array.constructor(out[i]),a.itemSize,a.normalized));}next.computeVertexNormals();next.computeBoundingSphere();if(g!==source)g.dispose();return next;
}
export function createSurface(geometry,material,height,offset=0){if(!material.polygonOffset)Object.assign(material,finishDepth(.25));const out=[];for(const rings of polygons(geometry)){const flat=new T.ShapeGeometry(shapeOf(rings));flat.rotateX(-Math.PI/2);flat.translate(0,offset,0);const g=drapeGeometry(flat,height);flat.dispose();const p=g.attributes.position;g.setAttribute('uv',new T.Float32BufferAttribute(Array.from({length:p.count},(_,i)=>[p.getX(i),p.getZ(i)]).flat(),2));const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;mesh.userData.surfaceOverlay=true;mesh.userData.surfaceOccluder=true;mesh.userData.noInk=true;out.push(mesh);}return out;}
