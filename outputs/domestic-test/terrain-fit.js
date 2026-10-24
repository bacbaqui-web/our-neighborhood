import * as T from 'three';

// Sample the original, uncut terrain, even beneath a subway opening. A ray into
// that opening is not a valid support height. Lifts are selected by surface type.
export function supportSampler(plan, fallback) {
 const grid=plan.supportTerrain;
 return (x,z,lift=0)=>{
  if(lift>=.14)for(const landing of plan.landings||[]){
   const ps=landing.triangles;
   for(let i=0;i<ps.length;i+=9){
    const ax=ps[i],az=ps[i+2],bx=ps[i+3],bz=ps[i+5],cx=ps[i+6],cz=ps[i+8];
    const den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
    if(Math.abs(den)<1e-10)continue;
    const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,w=1-u-v;
    if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7)return u*ps[i+1]+v*ps[i+4]+w*ps[i+7]+lift-.145;
   }
  }
  if(!grid)return fallback(x,z);
  const gx=(x-grid.origin[0])/grid.step,gz=(z-grid.origin[1])/grid.step;
  if(gx<0||gz<0||gx>grid.size-1||gz>grid.size-1)return fallback(x,z);
  const ix=Math.min(grid.size-2,Math.floor(gx)),iz=Math.min(grid.size-2,Math.floor(gz)),u=gx-ix,v=gz-iz;
  const at=(dx,dz)=>grid.heights[(iz+dz)*grid.size+ix+dx],a=at(0,0),b=at(1,0),c=at(0,1),d=at(1,1);
  return (u+v<=1?a*(1-u-v)+b*u+c*v:d*(u+v-1)+b*(1-v)+c*(1-u))+lift;
 };
}

// Only successive ends in the same ordered run may join. Access/crosswalk gaps
// remain open. Legacy short construction gaps can stretch by at most tolerance.
export function connectedRuns(segments,tolerance=.15){
 const runs=[];let run;
 for(const {a,b} of segments){
  const A=[...a],B=[...b];
  if(Math.hypot(B[0]-A[0],B[1]-A[1])<1e-6)continue;
  const end=run?.at(-1),prev=run?.at(-2);
  const forward=end&&((end[0]-prev[0])*(B[0]-A[0])+(end[1]-prev[1])*(B[1]-A[1]))>0;
  if(forward&&Math.hypot(end[0]-A[0],end[1]-A[1])<=tolerance){
   end[0]=(end[0]+A[0])/2;end[1]=(end[1]+A[1])/2;run.push(B);
  }else{run=[A,B];runs.push(run);}
 }
 return runs;
}

// A single stitched ribbon: neighbouring spans reuse identical cross sections.
// It can be a kerb, rail, or retaining wall, with independently shaped top/base.
export function fittedRibbon(points,width,bottom,top,maxStep=.5){
 const ps=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/maxStep));
  for(let j=0;j<count;j++)ps.push([a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count]);
 }
 ps.push([...points.at(-1)]);
 const closed=ps.length>3&&Math.hypot(ps[0][0]-ps.at(-1)[0],ps[0][1]-ps.at(-1)[1])<1e-6;
 const sections=ps.map((p,i)=>{
  const dir=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return [dz/l,-dx/l];};
  const before=closed&&i===0?dir(ps.at(-2),p):dir(ps[Math.max(0,i-1)],ps[Math.max(1,i)]),after=closed&&i===ps.length-1?dir(p,ps[1]):dir(ps[Math.min(i,ps.length-2)],ps[Math.min(i+1,ps.length-1)]);
  const nx=before[0]+after[0],nz=before[1]+after[1],len=Math.hypot(nx,nz)||1,ux=nx/len,uz=nz/len;
  const half=width/2/Math.max(.65,ux*after[0]+uz*after[1]);
  const left=[p[0]+ux*half,p[1]+uz*half],right=[p[0]-ux*half,p[1]-uz*half];
  return [left,right].map(q=>[[q[0],bottom(...q),q[1]],[q[0],top(...q),q[1]]]);
 });
 const positions=[],quad=(a,b,c,d)=>positions.push(...a,...b,...c,...a,...c,...d);
 for(let i=0;i<sections.length-1;i++){
  const [[al,AL],[ar,AR]]=sections[i],[[bl,BL],[br,BR]]=sections[i+1];
  quad(AL,AR,BR,BL);quad(ar,al,bl,br);quad(al,AL,BL,bl);quad(AR,ar,br,BR);
 }
 const [[al,AL],[ar,AR]]=sections[0],[[bl,BL],[br,BR]]=sections.at(-1);
 if(!closed){quad(al,ar,AR,AL);quad(br,bl,BL,BR);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();g.computeBoundingSphere();g.userData.sections=sections;g.userData.closed=closed;return g;
}

export function supportFrame(position,heading,sample,lift){
 const c=Math.cos(heading),s=Math.sin(heading);
 const world=(x,z)=>[position[0]+c*x+s*z,position[2]-s*x+c*z];
 return {world,height:(x,z)=>sample(...world(x,z),lift)-position[1]};
}

// One unwarped roof plane, following the overall grade. Vertical posts adapt to
// local differences. The clearance check raises this plane rather than bending it.
export function roofPlane(height,width,length,clearance){
 const sx=(height(width/2,0)-height(-width/2,0))/width;
 const sz=(height(0,length/2)-height(0,-length/2))/length;
 let origin=-Infinity;
 for(let z=-length/2;z<=length/2+.001;z+=length/12)for(const x of [-width/2,0,width/2])origin=Math.max(origin,height(x,z)-sx*x-sz*z+clearance);
 return (x,z)=>origin+sx*x+sz*z;
}
