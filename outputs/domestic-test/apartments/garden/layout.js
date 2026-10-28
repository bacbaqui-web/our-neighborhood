import {inPolygon} from '../../facilities/placement.js';
export function segmentDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t);}
export function buildGardenLayout(plan,buildings,parkingReference={rows:[]}){
 const inside=p=>plan.boundary.some(r=>inPolygon(p,r));
 const wallDistance=p=>Math.min(...buildings.flatMap(b=>b.points.map((a,i)=>segmentDistance(p,a,b.points[(i+1)%b.points.length]))));
 const occupied=p=>buildings.some(b=>inPolygon(p,b.points));
 const roads=plan.roads.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,width:r.width,id:r.id})));
 const roadDistance=p=>Math.min(...roads.map(r=>segmentDistance(p,r.a,r.b)-r.width/2));
 const green=p=>plan.gardens.some(g=>inPolygon(p,g.polygon));
 const treeClear=p=>inside(p)&&!occupied(p)&&wallDistance(p)>3&&roadDistance(p)>3&&green(p);
 const fences=[],trees=[],benches=[],lamps=[],connections=[],parking=[];
 for(const ring of plan.boundary)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(L/2);for(let k=0;k<n;k++){const p=[a[0]+(b[0]-a[0])*(k+.5)/n,a[1]+(b[1]-a[1])*(k+.5)/n];if(roadDistance(p)<2||wallDistance(p)<1.3||occupied(p)||plan.gates.some(g=>Math.hypot(p[0]-g.point[0],p[1]-g.point[1])<g.width/2+1))continue;fences.push({a:[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n],b:[a[0]+(b[0]-a[0])*(k+1)/n,a[1]+(b[1]-a[1])*(k+1)/n]});}}
 const all=plan.boundary.flat(),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minZ=Math.min(...all.map(p=>p[1])),maxZ=Math.max(...all.map(p=>p[1]));
 // Seeded, uneven groups retain open lawn between mature trees.
 let state=73491;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let n=0;n<12000&&trees.length<190;n++){const p=[minX+random()*(maxX-minX),minZ+random()*(maxZ-minZ)],density=.5+.25*Math.sin(p[0]*.09)*Math.cos(p[1]*.06);if(random()>density||!treeClear(p)||trees.some(t=>Math.hypot(t.root[0]-p[0],t.root[2]-p[1])<5.5+random()*2))continue;trees.push({id:'garden-natural-'+n,root:[p[0],.1,p[1]],height:7+random()*3,radius:2.8,clearance:2.7,kind:'tree',asset:n%9===0?'metasequoia':n%4===0?'cherry':'zelkova',source:'garden-established'});}
 for(const r of roads){const L=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]),ux=(r.b[0]-r.a[0])/L,uz=(r.b[1]-r.a[1])/L;for(let d=5;d<L;d+=13){const p=[r.a[0]+ux*d-uz*(r.width/2+2),r.a[1]+uz*d+ux*(r.width/2+2)];if(inside(p)&&!occupied(p)&&wallDistance(p)>2){if(green(p))benches.push({point:p,angle:Math.atan2(-uz,ux)});lamps.push(p);}}}
 // Connect each mapped building to the closest visible road from an exposed wall.
 for(const b of buildings){const candidates=[];for(let i=0;i<b.points.length;i++){const a=b.points[i],q=b.points[(i+1)%b.points.length],p=[(a[0]+q[0])/2,(a[1]+q[1])/2];for(const r of roads){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((p[0]-r.a[0])*dx+(p[1]-r.a[1])*dz)/(dx*dx+dz*dz))),end=[r.a[0]+dx*t,r.a[1]+dz*t],L=Math.hypot(end[0]-p[0],end[1]-p[1]);if(L<2||L>35)continue;let safe=true;for(let k=1;k<=Math.ceil(L);k++){const u=k/Math.ceil(L),pt=[p[0]+(end[0]-p[0])*u,p[1]+(end[1]-p[1])*u];if(occupied(pt)||!inside(pt)){safe=false;break;}}if(safe)candidates.push({a:p,b:end,width:1.8,length:L,owner:b.seed,edge:i});}}candidates.sort((a,b)=>a.length-b.length);if(candidates[0]){connections.push(candidates[0]);b.frontEdge=candidates[0].edge;}}
 const pathDistance=p=>connections.length?Math.min(...connections.map(r=>segmentDistance(p,r.a,r.b)-r.width/2)):Infinity;
 const pp=[(743-640)*plan.pixelTransform.x,(448-360)*plan.pixelTransform.z],playground=[[-6.5,-5.5],[6.5,-5.5],[6.5,5.5],[-6.5,5.5]].every(([x,z])=>{const p=[pp[0]+x,pp[1]+z];return inside(p)&&!occupied(p)&&roadDistance(p)>1;})?{point:pp,width:13,depth:11}:null;
 const playClear=p=>!playground||Math.abs(p[0]-pp[0])>9||Math.abs(p[1]-pp[1])>8;
 // Trace each observed row; reject entire bays that would obstruct walls or entries.
 const rejectedParking=[];
 for(const row of parkingReference.rows){const local=p=>[(p[0]-640)*plan.pixelTransform.x,(p[1]-360)*plan.pixelTransform.z],a=local(row.a),b=local(row.b),L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,n=Math.max(1,Math.floor(L/2.5)),width=L/n;
 for(let k=0;k<n;k++){const point=[a[0]+ux*width*(k+.5),a[1]+uz*width*(k+.5)],sample=(x,z)=>[point[0]+ux*x-uz*z,point[1]+uz*x+ux*z],footprint=[sample(-width/2,-2.5),sample(width/2,-2.5),sample(width/2,2.5),sample(-width/2,2.5)],samples=[];for(let x=-width/2;x<=width/2+.01;x+=width/4)for(let z=-2.5;z<=2.5;z+=.5)samples.push(sample(x,z));
 const bay={point,angle:Math.atan2(-uz,ux),width,depth:5,footprint,row:row.id,occupied:(k+Number(row.id.slice(1)))%7!==0};
 if(samples.some(p=>!inside(p)||occupied(p)||wallDistance(p)<.35||pathDistance(p)<.25||!playClear(p))||parking.some(p=>footprint.some(q=>inPolygon(q,p.footprint)))){rejectedParking.push({row:row.id,index:k});continue;}parking.push(bay);
 }}
 // Short manoeuvring strips follow the observed rows, on their open side.
 const parkingLanes=[];
 for(const row of parkingReference.rows){const bays=parking.filter(b=>b.row===row.id);if(!bays.length)continue;const angle=bays[0].angle,nx=Math.sin(angle),nz=Math.cos(angle),mid=bays[Math.floor(bays.length/2)].point;
 const scores=[-1,1].map(side=>{const p=[mid[0]+nx*side*4.5,mid[1]+nz*side*4.5];return {side,score:occupied(p)?Infinity:roadDistance(p)};}).sort((a,b)=>a.score-b.score),side=scores[0].side;
 for(const bay of bays){const center=[bay.point[0]+nx*side*4.5,bay.point[1]+nz*side*4.5],ux=Math.cos(angle),uz=-Math.sin(angle),points=[[-bay.width/2,-2],[bay.width/2,-2],[bay.width/2,2],[-bay.width/2,2]].map(([x,z])=>[center[0]+ux*x+nx*z,center[1]+uz*x+nz*z]);if(points.some(p=>!inside(p)||occupied(p)||wallDistance(p)<.4))continue;parkingLanes.push({point:center,angle,width:bay.width,footprint:points});}
 }
 const parkingClear=p=>!parkingLanes.some(b=>inPolygon(p,b.footprint))&&!parking.some(b=>inPolygon(p,b.footprint)||segmentDistance(p,b.footprint[0],b.footprint[1])<1);
 const filteredTrees=trees.filter(t=>parkingClear([t.root[0],t.root[2]])&&pathDistance([t.root[0],t.root[2]])>2&&playClear([t.root[0],t.root[2]]));
 const shrubs=[];
 for(let n=0;n<7000&&shrubs.length<650;n++){const p=[minX+random()*(maxX-minX),minZ+random()*(maxZ-minZ)];if(!parkingClear(p)||!inside(p)||occupied(p)||!green(p)||wallDistance(p)<1.3||roadDistance(p)<1.8||pathDistance(p)<1.5||!playClear(p))continue;const nearTree=filteredTrees.some(t=>Math.hypot(t.root[0]-p[0],t.root[2]-p[1])<4.2);if(!nearTree&&random()>.15)continue;if(shrubs.some(s=>Math.hypot(s.point[0]-p[0],s.point[1]-p[1])<1.15))continue;shrubs.push({point:p,radius:.45+random()*.65,height:.35+random()*.65,tone:Math.floor(random()*4)});}
 return {shrubs,playground,fences,trees:filteredTrees,benches:benches.filter(b=>parkingClear(b.point)&&pathDistance(b.point)>1.5&&playClear(b.point)),lamps:lamps.filter(p=>parkingClear(p)&&pathDistance(p)>1&&playClear(p)),parking,parkingLanes,rejectedParking,parkingClear,connections,roads,bounds:{minX,maxX,minZ,maxZ},inside,occupied,wallDistance,roadDistance,pathDistance,green,qa:{parkingRows:new Set(parking.map(b=>b.row)).size,parkingBays:parking.length,cars:parking.filter(b=>b.occupied).length,rejectedBays:rejectedParking.length,buildings:buildings.length,connectedBuildings:connections.length,trees:filteredTrees.length,shrubs:shrubs.length,fenceSegments:fences.length,gardenZones:plan.gardens.length}};
}
