import {fittedRibbon} from './terrain-fit.js?v=151';

// Rejoin only matching household boundaries. Real entrances and material/height
// changes remain separate; reverse duplicates from clipped parcel rings disappear.
export function stitchBoundaryRuns(input,tolerance=.04){
 const groups=new Map(),runs=[];let duplicates=0,joined=0;
 for(const r of input){const key=JSON.stringify([r.owner,r.style,r.height,r.tint,r.railRatio,r.capProfile]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 for(const rows of groups.values()){
  const nodes=[],edges=[],seen=new Set();
  const node=p=>{let n=nodes.find(n=>Math.hypot(n.p[0]-p[0],n.p[1]-p[1])<=tolerance);if(!n){n={p:[...p],edges:[],id:nodes.length};nodes.push(n);}return n;};
  for(const r of rows)for(let i=1;i<r.points.length;i++){
   if(Math.hypot(r.points[i][0]-r.points[i-1][0],r.points[i][1]-r.points[i-1][1])<.025)continue;
   const a=node(r.points[i-1]),b=node(r.points[i]);if(a===b)continue;
   const key=[a.id,b.id].sort((a,b)=>a-b).join(':');if(seen.has(key)){duplicates++;continue;}seen.add(key);
   const e={a,b,r,used:false};edges.push(e);a.edges.push(e);b.edges.push(e);
  }
  const walk=(first,start)=>{const points=[[...start.p]];let e=first,n=start,count=0;
   while(e&&!e.used){e.used=true;count++;n=e.a===n?e.b:e.a;points.push([...n.p]);e=n.edges.length===2?n.edges.find(e=>!e.used):null;}
   joined+=Math.max(0,count-1);runs.push({...first.r,points});
  };
  for(const n of nodes)if(n.edges.length!==2)for(const e of n.edges)if(!e.used)walk(e,n);
  for(const e of edges)if(!e.used)walk(e,e.a);
 }
 return {runs,qa:{sourceRuns:input.length,stitchedRuns:runs.length,joinedSpans:joined,duplicateSpansRemoved:duplicates}};
}

export function addBoundaryRibbon(batch,points,width,bottom,top,color,{ink=false,step=.4}={}){
 const g=fittedRibbon(points,width,bottom,top,step),b=batch.bucket(color);
 // Avoid spread argument limits for long, connected boundaries.
 for(const v of g.attributes.position.array)b.p.push(v);for(const v of g.attributes.normal.array)b.n.push(v);
 for(let i=0;i<g.attributes.position.count;i++)b.inkIds.push(batch.inkObjectId??0);
 if(ink){const line=batch.lineBucket(color),sections=g.userData.sections;
  for(let i=1;i<sections.length;i++)for(const side of [0,1])line.push(...sections[i-1][side][1],...sections[i][side][1]);
  if(!g.userData.closed)for(const section of [sections[0],sections.at(-1)])line.push(...section[0][1],...section[1][1]);
 }
 const sections=g.userData.sections;g.dispose();return sections;
}

// Recess + perimeter frame + actual metal crossbars all share the visible paving
// sampler. In particular, the downhill edge cannot remain at the centre's height.
export function addFittedDrain(batch,input,surface,isRoad=null){
 const d={...input};
 // Keep the complete grate on the road side of a raised apron, not half on it.
 if(isRoad)for(const shift of [0,.08,-.08,.16,-.16,.24,-.24]){
  const x=input.x-input.uz*shift,z=input.z+input.ux*shift;
  if([-1,1].every(u=>[-1,1].every(v=>isRoad(x+input.ux*u*.35-input.uz*v*.135,z+input.uz*u*.35+input.ux*v*.135)))){d.x=x;d.z=z;break;}
 }
 const norm=Math.hypot(d.ux,d.uz)||1,ux=d.ux/norm,uz=d.uz/norm;
 const world=(u,v)=>[d.x+ux*u-uz*v,d.z+uz*u+ux*v];
 const strip=(u0,v0,u1,v1,width,lo,hi,color,ink=false)=>addBoundaryRibbon(batch,[world(u0,v0),world(u1,v1)],width,(x,z)=>surface(x,z)+lo,(x,z)=>surface(x,z)+hi,color,{ink,step:.08});
 strip(-.35,0,.35,0,.26,-.032,.009,0x303b35);
 for(const side of [-1,1]){strip(-.35,side*.119,.35,side*.119,.022,.004,.018,0x5e665d,true);strip(side*.339,-.108,side*.339,.108,.022,.004,.018,0x5e665d);}
 for(let j=0;j<10;j++){const u=-.30+j*.0667;strip(u,-.108,u,.108,.023,.004,.016,0x737c72);}
 return {x:d.x,z:d.z,shift:Math.hypot(d.x-input.x,d.z-input.z),corners:[[-.35,-.13],[.35,-.13],[.35,.13],[-.35,.13]].map(q=>{const [x,z]=world(...q);return [x,surface(x,z)+.018,z];})};
}
