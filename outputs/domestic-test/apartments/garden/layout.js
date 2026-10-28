import {inPolygon} from '../../facilities/placement.js';
export function segmentDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t);}
export function buildGardenLayout(plan,buildings,parkingReference={rows:[]}){
 const inside=p=>plan.boundary.some(r=>inPolygon(p,r));
 const wallDistance=p=>Math.min(...buildings.flatMap(b=>b.points.map((a,i)=>segmentDistance(p,a,b.points[(i+1)%b.points.length]))));
 const occupied=p=>buildings.some(b=>inPolygon(p,b.points));
 const roads=plan.roads.flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b,width:r.width,id:r.id})));
 const roadDistance=p=>Math.min(...roads.map(r=>segmentDistance(p,r.a,r.b)-r.width/2));
 const green=p=>plan.gardens.some(g=>inPolygon(p,g.polygon))&&roadDistance(p)>1.4;
 const treeClear=p=>inside(p)&&!occupied(p)&&wallDistance(p)>3&&roadDistance(p)>3&&green(p);
 const fences=[],trees=[],benches=[],lamps=[],connections=[],parking=[];
 for(const ring of plan.boundary)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(L/2);for(let k=0;k<n;k++){const p=[a[0]+(b[0]-a[0])*(k+.5)/n,a[1]+(b[1]-a[1])*(k+.5)/n];if(roadDistance(p)<2||wallDistance(p)<1.3||occupied(p)||plan.gates.some(g=>Math.hypot(p[0]-g.point[0],p[1]-g.point[1])<g.width/2+1))continue;fences.push({a:[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n],b:[a[0]+(b[0]-a[0])*(k+1)/n,a[1]+(b[1]-a[1])*(k+1)/n]});}}
 const all=plan.boundary.flat(),minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minZ=Math.min(...all.map(p=>p[1])),maxZ=Math.max(...all.map(p=>p[1]));
 // Seeded, uneven groups retain open lawn between mature trees.
 let state=73491;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let n=0;n<12000&&trees.length<190;n++){const p=[minX+random()*(maxX-minX),minZ+random()*(maxZ-minZ)],density=.5+.25*Math.sin(p[0]*.09)*Math.cos(p[1]*.06);if(random()>density||!treeClear(p)||trees.some(t=>Math.hypot(t.root[0]-p[0],t.root[2]-p[1])<5.5+random()*2))continue;trees.push({id:'garden-natural-'+n,root:[p[0],.1,p[1]],height:7+random()*3,radius:2.8,clearance:2.7,kind:'tree',asset:n%9===0?'metasequoia':n%4===0?'cherry':'zelkova',source:'garden-established'});}
 for(const r of roads){const L=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]),ux=(r.b[0]-r.a[0])/L,uz=(r.b[1]-r.a[1])/L;for(let d=5;d<L;d+=13){const p=[r.a[0]+ux*d-uz*(r.width/2+2),r.a[1]+uz*d+ux*(r.width/2+2)];if(inside(p)&&!occupied(p)&&wallDistance(p)>2){if(green(p))benches.push({point:p,angle:Math.atan2(-uz,ux)});lamps.push(p);}}}
 const rejectedParking=[];
 for(const row of parkingReference.rows){const local=p=>[(p[0]-640)*plan.pixelTransform.x,(p[1]-360)*plan.pixelTransform.z],a=local(row.a),b=local(row.b),L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L,n=Math.max(1,Math.floor(L/2.5)),width=L/n;
 for(let k=0;k<n;k++){const point=[a[0]+ux*width*(k+.5),a[1]+uz*width*(k+.5)],sample=(x,z)=>[point[0]+ux*x-uz*z,point[1]+uz*x+ux*z],footprint=[sample(-width/2,-2.5),sample(width/2,-2.5),sample(width/2,2.5),sample(-width/2,2.5)],samples=[];for(let x=-width/2;x<=width/2+.01;x+=width/4)for(let z=-2.5;z<=2.5;z+=.5)samples.push(sample(x,z));
 const bay={point,angle:Math.atan2(-uz,ux),width,depth:5,footprint,row:row.id,occupied:(k+Number(row.id.slice(1)))%7!==0};
 parking.push(bay);
 }}
 const parkingGrid=new Map();
 for(const b of parking){const xs=b.footprint.map(p=>p[0]),zs=b.footprint.map(p=>p[1]);for(let x=Math.floor((Math.min(...xs)-1)/10);x<=Math.floor((Math.max(...xs)+1)/10);x++)for(let z=Math.floor((Math.min(...zs)-1)/10);z<=Math.floor((Math.max(...zs)+1)/10);z++){const key=x+','+z;if(!parkingGrid.has(key))parkingGrid.set(key,[]);parkingGrid.get(key).push(b);}}
 const parkingNear=p=>parkingGrid.get(Math.floor(p[0]/10)+','+Math.floor(p[1]/10))||[];
 const parkingLanes=[]; // All access lanes now come from traced plan.roads.
 const parkingClear=p=>!parkingNear(p).some(b=>inPolygon(p,b.footprint));

 // Connect each mapped building to the closest visible road from an exposed wall.
 for(const b of buildings){const candidates=[];
 for(let i=0;i<b.points.length;i++){const a=b.points[i],q=b.points[(i+1)%b.points.length];
 for(const fraction of [.5,.25,.75,.12,.88,.04,.96]){const p=[a[0]+(q[0]-a[0])*fraction,a[1]+(q[1]-a[1])*fraction];
 for(const r of roads)for(const target of [null,0,1]){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=target??Math.max(0,Math.min(1,((p[0]-r.a[0])*dx+(p[1]-r.a[1])*dz)/(dx*dx+dz*dz))),end=[r.a[0]+dx*t,r.a[1]+dz*t],L=Math.hypot(end[0]-p[0],end[1]-p[1]);if(L<1||L>35)continue;const nx=-(end[1]-p[1])/L,nz=(end[0]-p[0])/L;let safe=true;
 for(let k=1;k<=Math.ceil(L*2);k++){const u=k/Math.ceil(L*2);for(const offset of [-.9,0,.9]){const pt=[p[0]+(end[0]-p[0])*u+nx*offset,p[1]+(end[1]-p[1])*u+nz*offset];if(occupied(pt)||!inside(pt)||parkingNear(pt).some(b=>inPolygon(pt,b.footprint)||b.footprint.some((a,i)=>segmentDistance(pt,a,b.footprint[(i+1)%4])<.35))){safe=false;break;}}if(!safe)break;}
 if(safe)candidates.push({a:p,b:end,width:1.8,length:L,owner:b.seed,edge:i,fraction});
 }}}
 candidates.sort((a,b)=>a.length-b.length);if(candidates[0]){connections.push(candidates[0]);b.frontEdge=candidates[0].edge;b.frontFraction=candidates[0].fraction;}}
 // A blocked straight walk bends around the fixed parking rows; the rows never move.
 for(const b of buildings.filter(b=>!connections.some(c=>c.owner===b.seed))){const candidates=[];
 const clear=(a,z)=>{const L=Math.hypot(z[0]-a[0],z[1]-a[1]);if(L<.1)return true;const nx=-(z[1]-a[1])/L,nz=(z[0]-a[0])/L;for(let k=1;k<=Math.ceil(L*3);k++){const t=k/Math.ceil(L*3);for(const off of [-.7,0,.7]){const p=[a[0]+(z[0]-a[0])*t+nx*off,a[1]+(z[1]-a[1])*t+nz*off];if(!inside(p)||occupied(p)||parkingNear(p).some(b=>inPolygon(p,b.footprint)||b.footprint.some((a,i)=>segmentDistance(p,a,b.footprint[(i+1)%4])<.3)))return false;}}return true;};
 for(let edge=0;edge<b.points.length;edge++)for(const fraction of [.15,.5,.85]){const a=b.points[edge],z=b.points[(edge+1)%b.points.length],start=[a[0]+(z[0]-a[0])*fraction,a[1]+(z[1]-a[1])*fraction];
 const len=Math.hypot(z[0]-a[0],z[1]-a[1]);
 for(const sign of [-1,1]){const exit=[start[0]-(z[1]-a[1])/len*sign*1.6,start[1]+(z[0]-a[0])/len*sign*1.6];if(!clear(start,exit))continue;
 for(const r of roads){const end=r.a;if(Math.hypot(end[0]-start[0],end[1]-start[1])>45)continue;for(const bend of [[exit[0],end[1]],[end[0],exit[1]]]){if(!clear(exit,bend)||!clear(bend,end))continue;const length=1.6+Math.hypot(bend[0]-exit[0],bend[1]-exit[1])+Math.hypot(end[0]-bend[0],end[1]-bend[1]);candidates.push({start,exit,bend,end,length,edge,fraction});}}}}
 candidates.sort((a,b)=>a.length-b.length);if(candidates[0]){const c=candidates[0];for(const [a,z]of [[c.start,c.exit],[c.exit,c.bend],[c.bend,c.end]])connections.push({a,b:z,width:1.4,length:Math.hypot(z[0]-a[0],z[1]-a[1]),owner:b.seed,edge:c.edge});b.frontEdge=c.edge;b.frontFraction=c.fraction;}}
 const pathDistance=p=>connections.length?Math.min(...connections.map(r=>segmentDistance(p,r.a,r.b)-r.width/2)):Infinity;
 const pp=[(743-640)*plan.pixelTransform.x,(448-360)*plan.pixelTransform.z],playground=[[-6.5,-5.5],[6.5,-5.5],[6.5,5.5],[-6.5,5.5]].every(([x,z])=>{const p=[pp[0]+x,pp[1]+z];return inside(p)&&!occupied(p)&&roadDistance(p)>1;})?{point:pp,width:13,depth:11}:null;
 const playClear=p=>!playground||Math.abs(p[0]-pp[0])>9||Math.abs(p[1]-pp[1])>8;
 const filteredTrees=trees.filter(t=>parkingClear([t.root[0],t.root[2]])&&pathDistance([t.root[0],t.root[2]])>2&&playClear([t.root[0],t.root[2]]));
 const shrubs=[];
 for(let n=0;n<7000&&shrubs.length<650;n++){const p=[minX+random()*(maxX-minX),minZ+random()*(maxZ-minZ)];if(!parkingClear(p)||!inside(p)||occupied(p)||!green(p)||wallDistance(p)<1.3||roadDistance(p)<1.8||pathDistance(p)<1.5||!playClear(p))continue;const nearTree=filteredTrees.some(t=>Math.hypot(t.root[0]-p[0],t.root[2]-p[1])<4.2);if(!nearTree&&random()>.15)continue;if(shrubs.some(s=>Math.hypot(s.point[0]-p[0],s.point[1]-p[1])<1.15))continue;shrubs.push({point:p,radius:.45+random()*.65,height:.35+random()*.65,tone:Math.floor(random()*4)});}
 return {shrubs,playground,fences,trees:filteredTrees,benches:benches.filter(b=>parkingClear(b.point)&&pathDistance(b.point)>1.5&&playClear(b.point)),lamps:lamps.filter(p=>parkingClear(p)&&pathDistance(p)>1&&playClear(p)),parking,parkingLanes,rejectedParking,parkingClear,connections,roads,bounds:{minX,maxX,minZ,maxZ},inside,occupied,wallDistance,roadDistance,pathDistance,green,qa:{parkingRows:new Set(parking.map(b=>b.row)).size,parkingBays:parking.length,cars:parking.filter(b=>b.occupied).length,rejectedBays:rejectedParking.length,buildings:buildings.length,connectedBuildings:new Set(connections.map(c=>c.owner)).size,trees:filteredTrees.length,shrubs:shrubs.length,fenceSegments:fences.length,gardenZones:plan.gardens.length}};
}
