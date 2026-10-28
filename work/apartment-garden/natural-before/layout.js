import {inPolygon} from '../../facilities/placement.js';
export function segmentDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t);}
export function buildGardenLayout(plan,buildings){
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
 let serial=0;for(let x=minX+3;x<maxX;x+=8)for(let z=minZ+3;z<maxZ;z+=8){const n=serial++,p=[x+Math.sin(n*7.13)*1.8,z+Math.cos(n*3.71)*1.8];if(treeClear(p))trees.push({id:'garden-tree-'+n,root:[p[0],.1,p[1]],height:4.5,radius:2,kind:'tree',asset:n%7===0?'cherry':n%5===0?'metasequoia':'zelkova',source:'existing-plant'});}
 for(const r of roads){const L=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]),ux=(r.b[0]-r.a[0])/L,uz=(r.b[1]-r.a[1])/L;for(let d=5;d<L;d+=13){const p=[r.a[0]+ux*d-uz*(r.width/2+2),r.a[1]+uz*d+ux*(r.width/2+2)];if(inside(p)&&!occupied(p)&&wallDistance(p)>2){if(green(p))benches.push({point:p,angle:Math.atan2(-uz,ux)});else if(wallDistance(p)>5&&roadDistance(p)>1.2)parking.push({point:p,angle:Math.atan2(ux,uz)});lamps.push(p);}}}
 // Connect each mapped building to the closest visible road from an exposed wall.
 for(const b of buildings){const candidates=[];for(let i=0;i<b.points.length;i++){const a=b.points[i],q=b.points[(i+1)%b.points.length],p=[(a[0]+q[0])/2,(a[1]+q[1])/2];for(const r of roads){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((p[0]-r.a[0])*dx+(p[1]-r.a[1])*dz)/(dx*dx+dz*dz))),end=[r.a[0]+dx*t,r.a[1]+dz*t],L=Math.hypot(end[0]-p[0],end[1]-p[1]);if(L<2||L>35)continue;let safe=true;for(let k=1;k<=Math.ceil(L);k++){const u=k/Math.ceil(L),pt=[p[0]+(end[0]-p[0])*u,p[1]+(end[1]-p[1])*u];if(occupied(pt)||!inside(pt)){safe=false;break;}}if(safe)candidates.push({a:p,b:end,width:1.8,length:L,owner:b.seed,edge:i});}}candidates.sort((a,b)=>a.length-b.length);if(candidates[0]){connections.push(candidates[0]);b.frontEdge=candidates[0].edge;}}
 const pathDistance=p=>connections.length?Math.min(...connections.map(r=>segmentDistance(p,r.a,r.b)-r.width/2)):Infinity;
 const pp=[(743-640)*plan.pixelTransform.x,(448-360)*plan.pixelTransform.z],playground=[[-6.5,-5.5],[6.5,-5.5],[6.5,5.5],[-6.5,5.5]].every(([x,z])=>{const p=[pp[0]+x,pp[1]+z];return inside(p)&&!occupied(p)&&roadDistance(p)>1;})?{point:pp,width:13,depth:11}:null;
 const playClear=p=>!playground||Math.abs(p[0]-pp[0])>9||Math.abs(p[1]-pp[1])>8;
 const filteredTrees=trees.filter(t=>pathDistance([t.root[0],t.root[2]])>2&&playClear([t.root[0],t.root[2]]));
 return {playground,fences,trees:filteredTrees,benches:benches.filter(b=>pathDistance(b.point)>1.5&&playClear(b.point)),lamps:lamps.filter(p=>pathDistance(p)>1&&playClear(p)),parking:parking.filter(b=>pathDistance(b.point)>2&&playClear(b.point)),connections,roads,bounds:{minX,maxX,minZ,maxZ},inside,occupied,wallDistance,roadDistance,pathDistance,green,qa:{buildings:buildings.length,connectedBuildings:connections.length,trees:filteredTrees.length,fenceSegments:fences.length,gardenZones:plan.gardens.length}};
}
