// Roadview-informed visual routing, not an installation/engineering design.
// Every pipe ends at a junction, meter port, buried supply or wall sleeve.
const intersects=(a,b,r,pad=.045)=>{
 const loX=Math.min(a[0],b[0]),hiX=Math.max(a[0],b[0]),loY=Math.min(a[1],b[1]),hiY=Math.max(a[1],b[1]);
 return hiX>r[0]-pad&&loX<r[1]+pad&&hiY>r[2]-pad&&loY<r[3]+pad;
};
export function routePipe(start,end,obstacles,L,bottom,top){
 const xs=[.19,L-.19,start[0],end[0]],ys=[bottom,top,start[1],end[1]];
 for(const r of obstacles){xs.push(r[0]-.10,r[1]+.10);ys.push(r[2]-.10,r[3]+.10);}
 const unique=(a,lo,hi)=>[...new Set(a.filter(v=>v>=lo-1e-7&&v<=hi+1e-7).map(v=>+v.toFixed(5)))].sort((a,b)=>a-b);
 const X=unique(xs,.18,L-.18),Y=unique(ys,bottom,top),nx=X.length,points=Y.flatMap(y=>X.map(x=>[x,y]));
 const nearest=p=>points.findIndex(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<.0001),s=nearest(start),t=nearest(end);
 if(s<0||t<0)return null;
 const distance=new Float64Array(points.length).fill(Infinity),previous=new Int32Array(points.length).fill(-1),closed=new Set(),open=new Set([s]);distance[s]=0;
 while(open.size){let cur=-1,best=Infinity;for(const k of open){const d=distance[k]+Math.abs(points[k][0]-end[0])+Math.abs(points[k][1]-end[1]);if(d<best){best=d;cur=k;}}if(cur===t)break;open.delete(cur);closed.add(cur);
  for(const j of [cur%nx?cur-1:-1,cur%nx<nx-1?cur+1:-1,cur-nx,cur+nx]){if(j<0||j>=points.length||closed.has(j)||obstacles.some(r=>intersects(points[cur],points[j],r)))continue;const cost=distance[cur]+Math.hypot(points[j][0]-points[cur][0],points[j][1]-points[cur][1]);if(cost<distance[j]){distance[j]=cost;previous[j]=cur;open.add(j);}}
 }
 if(!Number.isFinite(distance[t]))return null;let path=[];for(let i=t;i>=0;i=previous[i]){path.push(points[i]);if(i===s)break;}path.reverse();
 return path.filter((p,i)=>!i||i===path.length-1||Math.abs((p[0]-path[i-1][0])*(path[i+1][1]-p[1])-(p[1]-path[i-1][1])*(path[i+1][0]-p[0]))>1e-8);
}
export function planGasNetwork(faces,building){
 const seed=Math.abs(building.seed),candidates=faces.filter(f=>f.L>1.8&&f.clear).sort((a,b)=>(a.isFront?0:1)-(b.isFront?0:1)||b.L-a.L);
 for(const f of candidates){const maxCount=Math.min(4,Math.max(1,building.levels-1));
  for(let count=maxCount;count>=1;count--)for(const fraction of [.22,.78,.5,.36,.64]){
   const width=count*.46,start=Math.max(.55,Math.min(f.L-width-.55,f.L*fraction-width/2));if(start<.4||start+width+.45>f.L-.18)continue;
   const centers=Array.from({length:count},(_,i)=>start+.23+i*.46),g=Math.max(...centers.map(f.groundAt)),my=g+1.35,header=g+.91;
   const bodies=centers.map(u=>[u-.18,u+.18,my-.22,my+.23]);
   if(bodies.some(r=>f.openings.some(o=>r[1]>o[0]-.08&&r[0]<o[1]+.08&&r[3]>o[2]-.08&&r[2]<o[3]+.08)))continue;
   const feedX=start+width+.24,feed=[[feedX,g-.08],[feedX,header],[centers[0]-.24,header]];
   if(feed.slice(1).some((p,i)=>f.openings.some(r=>intersects(feed[i],p,r))))continue;
   const meters=[];let failed=false;
   for(let i=0;i<count;i++){const u=centers[i],portY=my+.20,top=building.top-.25,depth=.11+i*.045;
    const inlet=[[u-.23,header],[u-.23,portY+.18],[u-.085,portY+.18],[u-.085,portY]];
    if(inlet.slice(1).some((p,k)=>f.openings.some(r=>intersects(inlet[k],p,r)))){failed=true;break;}
    const targetY=Math.min(top,Math.max(portY+.65,building.top-(building.levels-Math.min(i,building.levels-1))*building.floor+.48));
    let outlet=null;for(const endX of [u+.23,.23,f.L-.23]){outlet=routePipe([u+.085,portY],[endX,targetY],f.openings,f.L,g+.35,top);if(outlet)break;}
    if(!outlet){failed=true;break;}
    meters.push({u,y:my,inlet,outlet,depth});
   }
   if(failed)continue;
   // Validate the full route against neighboring footprints, including concave corners.
   const routes=[feed,...meters.flatMap(m=>[m.inlet,m.outlet])];
   if(f.facadeClear&&routes.some(path=>path.slice(1).some((q,i)=>{
    const p=path[i],steps=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/.18));
    for(let k=0;k<=steps;k++){const u=p[0]+(q[0]-p[0])*k/steps;for(const du of [-.04,0,.04])for(const depth of [.06,.16,.30])if(!f.facadeClear(u+du,depth))return true;}return false;
   })))continue;
   return {owner:building.seed,face:f.edge,origin:f.a,ux:f.ux,uz:f.uz,nx:f.nx,nz:f.nz,feed,meters,openings:f.openings,ground:g,color:[0x956855,0x9b7660,0x999c8e][seed%3],meterColor:seed%2?0xbebfb0:0xc6c3b5};
  }
 }
 return null;
}
export function emitGasNetwork(batch,plan,proxy){
 const out=batch.writer([plan.origin[0],0,plan.origin[1]],plan.ux,plan.uz,plan.nx,plan.nz),B=out.box,R=out.rod,color=plan.color;
 const paths=[];
 function pipe(points,r=.022){paths.push(points);for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1];R(a,b,r,color,8);
   const length=Math.hypot(...a.map((v,k)=>v-b[k]));if(length>.75)batch.atLOD(1,()=>{for(let t=.32;t<length;t+=1.5){const q=a.map((v,k)=>v+(b[k]-v)*t/length);B(q[0],q[1],q[2]/2,.075,.055,q[2]+.04,0x777d72);}});
   proxy((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,Math.abs(a[0]-b[0])+r*2,Math.abs(a[1]-b[1])+r*2,Math.abs(a[2]-b[2])+r*2);
  }
  // Compact elbow collars close the joints; no loose pipe ends.
  batch.atLOD(1,()=>{for(const q of points.slice(1,-1))B(q[0],q[1],q[2],r*2.5,r*2.5,r*2.5,color);});
 }
 pipe(plan.feed.map(p=>[...p,.11]),.029);
 const supply=plan.feed[0];B(supply[0],plan.ground+.48,.14,.085,.14,.08,0x777d72);B(supply[0]+.045,plan.ground+.48,.19,.14,.025,.035,0x8b4f39);
 for(const m of plan.meters){
  B(m.u,m.y,.18,.31,.36,.20,plan.meterColor,true);B(m.u,m.y+.065,.287,.23,.09,.017,0x46514b);B(m.u,m.y+.067,.298,.18,.047,.009,0xb5bfaf);
  B(m.u,m.y-.10,.287,.12,.045,.01,0x858c80);proxy(m.u,m.y,.19,.36,.43,.24);
  const inlet=m.inlet.map(p=>[...p,.11]);inlet.push([m.u-.085,m.y+.20,.18]);pipe(inlet);
  const outlet=[[m.u+.085,m.y+.20,.18],...m.outlet.map(p=>[...p,m.depth])];const end=outlet[outlet.length-1];outlet.push([end[0],end[1],.005]);pipe(outlet,.019);
  for(const x of [m.u-.085,m.u+.085])R([x,m.y+.17,.18],[x,m.y+.26,.18],.034,0x8b8c7d,8);
  B(m.u-.23,m.y+.02,.15,.09,.025,.04,0x8a4d38);
  B(end[0],end[1],.025,.10,.10,.05,0x8d9488);
 }
 return {owner:plan.owner,face:plan.face,meters:plan.meters.length,paths,origin:plan.origin,ux:plan.ux,uz:plan.uz,nx:plan.nx,nz:plan.nz,openings:plan.openings,ground:plan.ground};
}
