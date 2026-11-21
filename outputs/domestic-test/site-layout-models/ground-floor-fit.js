import * as T from 'three';

// Subtract only the replacement ground-floor volume. Upper-floor vertices and
// attributes are copied unchanged; pipes crossing y=3 are clipped, not deleted.
export function replaceGroundDetails(group,plans){
 const byId=new Map(plans.map(p=>[p.id,p]));
 const stats={upperPrimitivesPreserved:0,clippedPrimitives:0,removedPrimitives:0,finite:true};
 group.traverse(o=>{
  if(!(o.isMesh||o.isLineSegments)||!o.geometry.attributes.inkObjectId)return;
  const original=o.geometry,g=original.index?original.toNonIndexed():original;
  const attrs=Object.entries(g.attributes),p=g.attributes.position,ids=g.attributes.inkObjectId;
  const stride=attrs.reduce((n,[,a])=>n+a.itemSize,0),offsets=[];let offset=0;
  for(const [,a] of attrs){offsets.push(offset);offset+=a.itemSize;}
  const posOffset=offsets[attrs.findIndex(([name])=>name==='position')],size=o.isMesh?3:2;
  const out=attrs.map(()=>[]);let changed=false;
  function vertex(i){const v=[];for(const [,a] of attrs)for(let k=0;k<a.itemSize;k++)v.push(a.array[i*a.itemSize+k]);return v;}
  function emit(v){for(let j=0;j<attrs.length;j++)for(let k=0;k<attrs[j][1].itemSize;k++)out[j].push(v[offsets[j]+k]);}
  function copy(i){for(let j=0;j<attrs.length;j++){const a=attrs[j][1];for(let k=0;k<a.itemSize;k++)out[j].push(a.array[i*a.itemSize+k]);}}
  for(let i=0;i<p.count;i+=size){
   const plan=byId.get(Math.round(ids.getX(i)));
   const floorTop=3+(plan?.base??0);
   let upper=true;for(let k=0;k<size;k++)upper&&=p.getY(i+k)>=floorTop;
   if(upper)stats.upperPrimitivesPreserved++;
   if(!plan||upper){for(let k=0;k<size;k++)copy(i+k);continue;}
   const cut=o.userData.groundUtility&&!plan.kind.startsWith('piloti')?[plan.opening[0]-.15,plan.opening[0]+plan.opening[1]+.15,-1,plan.opening[2]+.1]:plan.detailCut;
   const [x0,x1,z0,z1]=cut,[ox,oz]=plan.origin,[ux,uz]=plan.u,[nx,nz]=plan.n;
   const planes=[v=>floorTop-v[posOffset+1],v=>(v[posOffset]-ox)*ux+(v[posOffset+2]-oz)*uz-x0,
    v=>x1-(v[posOffset]-ox)*ux-(v[posOffset+2]-oz)*uz,
    v=>(v[posOffset]-ox)*nx+(v[posOffset+2]-oz)*nz-z0,
    v=>z1-(v[posOffset]-ox)*nx-(v[posOffset+2]-oz)*nz];
   const primitive=Array.from({length:size},(_,k)=>vertex(i+k));
   if(planes.some(f=>primitive.every(v=>f(v)<=0))){for(let k=0;k<size;k++)copy(i+k);continue;}
   const mix=(a,b,t)=>a.map((x,j)=>x+(b[j]-x)*t);
   const outside=[];let inside=primitive;
   for(const f of planes){
    if(!inside.length)break;
    if(size===2){const [a,b]=inside,fa=f(a),fb=f(b);
     if(fa<0&&fb<0){outside.push(inside);inside=[];}
     else if((fa<0)!==(fb<0)){const q=mix(a,b,fa/(fa-fb));outside.push(fa<0?[a,q]:[q,b]);inside=fa<0?[q,b]:[a,q];}
    }else{
     const yes=[],no=[];
     for(let j=0;j<inside.length;j++){const a=inside[j],b=inside[(j+1)%inside.length],fa=f(a),fb=f(b);(fa>=0?yes:no).push(a);if((fa>=0)!==(fb>=0)){const q=mix(a,b,fa/(fa-fb));yes.push(q);no.push(q);}}
     if(no.length>=3)outside.push(no);inside=yes;
    }
   }
   changed=true;stats.clippedPrimitives++;
   if(!outside.length)stats.removedPrimitives++;
   for(const poly of outside){if(size===2)poly.forEach(emit);else for(let j=1;j<poly.length-1;j++){emit(poly[0]);emit(poly[j]);emit(poly[j+1]);}}
  }
  if(changed){const next=new T.BufferGeometry();for(let j=0;j<attrs.length;j++){const [name,a]=attrs[j];next.setAttribute(name,new T.BufferAttribute(new a.array.constructor(out[j]),a.itemSize,a.normalized));}next.computeBoundingSphere();o.geometry=next;original.dispose();for(const v of next.attributes.position.array)stats.finite&&=Number.isFinite(v);}
  if(g!==original)g.dispose();
 });
 return stats;
}
