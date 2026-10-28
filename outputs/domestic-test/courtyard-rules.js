// Infer only small missing boundary continuations. Entrances and driveways win.
export function repairCourtyardBoundaries(plan,parcels,attached,specs=[],roadInfo=()=>false){
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const inside=(p,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 const near=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return dist(p,[a[0]+t*dx,a[1]+t*dz]);};
 const walls=plan.wallRuns.filter(r=>r.points.length>1),segments=walls.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,owner:r.owner}))).concat((plan.connections||[]).map(r=>({...r})));
 const access=parcels.yards.flatMap(y=>(y.entrance||[]).slice(1).map((b,i)=>({a:y.entrance[i],b})));
 const reservations=[...(attached.drives||[]).map(d=>d.polygon),...(attached.structures||[]).flatMap(s=>[s.footprint,s.entryApron].filter(Boolean))];
 const endpoints=[];for(const r of walls)for(const end of [0,r.points.length-1]){const p=r.points[end],q=r.points[end===0?1:end-1],L=dist(p,q);if(L<.02||dist(r.points[0],r.points.at(-1))<.05)continue;
 if(segments.some(s=>s.owner===r.owner&&near(p,s.a,s.b)<.06&&dist(p,s.a)>.1&&dist(p,s.b)>.1))continue;
 endpoints.push({p,r,out:[(p[0]-q[0])/L,(p[1]-q[1])/L]});}
 const bridges=[],used=new Set(),rejected={access:0,ground:0,building:0};
 function clear(a,b,owner){const L=dist(a,b),n=Math.ceil(L/.12);for(let j=0;j<=n;j++){const p=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n];
  if(access.some(s=>near(p,s.a,s.b)<1.02)||plan.gates.some(g=>Math.hypot(p[0]-g.x,p[1]-g.z)<g.width/2+.45)||reservations.some(r=>inside(p,r))){rejected.access++;return false;}
  if(roadInfo(...p)){rejected.ground++;return false;}
  if(specs.some(s=>inside(p,s.points))){rejected.building++;return false;}
 }return true;}
 const pairs=[];for(let i=0;i<endpoints.length;i++)for(let j=i+1;j<endpoints.length;j++){const a=endpoints[i],b=endpoints[j];if(a.r===b.r||a.r.owner!==b.r.owner)continue;const L=dist(a.p,b.p);if(L<.16||L>2.6)continue;const ux=(b.p[0]-a.p[0])/L,uz=(b.p[1]-a.p[1])/L;if(a.out[0]*ux+a.out[1]*uz<.87||b.out[0]*-ux+b.out[1]*-uz<.87)continue;if(Math.abs(a.r.height-b.r.height)>.4)continue;if(a.r.style!==b.r.style||Math.abs((a.r.railRatio||0)-(b.r.railRatio||0))>.2)continue;pairs.push({i,j,L});}
 pairs.sort((a,b)=>a.L-b.L);
 for(const {i,j,L}of pairs){if(used.has(i)||used.has(j))continue;const a=endpoints[i],b=endpoints[j];if(segments.some(s=>near([(a.p[0]+b.p[0])/2,(a.p[1]+b.p[1])/2],s.a,s.b)<.10))continue;if(!clear(a.p,b.p,a.r.owner))continue;
 const endHeight=r=>r.height+(r.capProfile==='scalloped'&&r.length>2.2?.2:0);const r={...a.r,points:[a.p,b.p],length:L,height:(a.r.height+b.r.height)/2,startHeight:endHeight(a.r),endHeight:endHeight(b.r),capProfile:'straight',repair:true};bridges.push(r);segments.push({a:a.p,b:b.p,owner:r.owner});used.add(i);used.add(j);}
 // A detached decorative pier without a connected wall or gate reads as debris.
 const removedPiers=[],piers=plan.piers.filter(p=>{const q=[p.x,p.z],connected=segments.some(s=>near(q,s.a,s.b)<(p.width||.34)/2+.16)||plan.gates.some(g=>dist(q,[g.x,g.z])<g.width/2+.6);if(!connected)removedPiers.push(p);return connected;});
 return {...plan,wallRuns:[...walls,...bridges],piers,qa:{...plan.qa,courtyardRepair:{version:136,bridges:bridges.map(r=>({owner:r.owner,a:r.points[0],b:r.points[1],length:r.length,height:r.height})),removedPiers:removedPiers.map(p=>({owner:p.owner,x:p.x,z:p.z})),rejected,rule:'Only aligned gaps <=2.6m; preserve 2.04m walking corridors, gates, driveways and building footprints; remove unsupported ornamental piers'}}};
}
