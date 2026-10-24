// Observed at nearby Solmae lanes (2022-08 / 2025-06 panoramas).
// Geometry can infer opportunities, not actual household ownership or current object locations.
export const contextOnly=new Set([14,15,16,17,18,19,20,24,25,28,31,32,33,34,37,41,42,43,44,45,76,77,78,79,80,81,85,86,90,91,92,93,101,102,103,106,107,108,111,112,113,161,162,163,164,166,167,168,169,170,171,172,173,174,175,187,190,191,194,206,207,209,211,212]);
export function populateStreetLife({specs,walls,roadInfo,elevation,template,place,placements,canAccess}){
 const groups=[],supports=[],byOwner=new Map(specs.map(s=>[s.seed,s]));
 function roadDistance(x,z,nx,nz,max=9){for(let d=.15;d<=max;d+=.2)if(roadInfo(x+nx*d,z+nz*d))return d;return Infinity;}
 for(const s of specs){let area=0;s.points.forEach((a,i)=>{const b=s.points[(i+1)%s.points.length];area+=a[0]*b[1]-b[0]*a[1]});for(let i=0;i<s.points.length;i++){const a=s.points[i],b=s.points[(i+1)%s.points.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1.7)continue;const nx=(b[1]-a[1])/L*(area>0?1:-1),nz=-(b[0]-a[0])/L*(area>0?1:-1),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;if(Math.abs(x)>135||Math.abs(z)>135)continue;
 const d=roadDistance(x,z,nx,nz);if(!Number.isFinite(d))continue;supports.push({x,z,nx,nz,ux:nz,uz:-nx,L,owner:s.seed,kind:'facade',gap:.115,roadDistance:d,edge:i,levels:s.levels});}}
 for(const w of walls.filter(w=>w.kind==='parcel-wall')){const L=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);if(L<.85)continue;const x=(w.a[0]+w.b[0])/2,z=(w.a[1]+w.b[1])/2;for(const sign of [1,-1]){const nx=-(w.b[1]-w.a[1])/L*sign,nz=(w.b[0]-w.a[0])/L*sign,d=roadDistance(x,z,nx,nz,3);if(Number.isFinite(d)){supports.push({x,z,nx,nz,ux:nz,uz:-nx,L,owner:w.owner,kind:'boundary',gap:w.width/2+.14,roadDistance:d,levels:byOwner.get(w.owner)?.levels||1});break}}}
 supports.sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
 function at(s,u,v=0){return{x:s.x+s.ux*u+s.nx*v,z:s.z+s.uz*u+s.nz*v};}
 function put(s,u,id,lift,role,extra=0){const b=template(id).b;if(Math.abs(u)+Math.max(Math.abs(b.min.x),Math.abs(b.max.x))+.10>s.L/2)return false;const gap=['wall-meter','wall-riser'].includes(role)?.035:s.gap+extra,v=-b.min.z+gap,p=at(s,u,v),angle=Math.atan2(s.nx,s.nz);const old=placements.length;
 if(!place(id,p.x,p.z,angle,lift,s.owner,role))return false;
 Object.assign(placements[old],{support:{kind:s.kind,x:s.x,z:s.z,nx:s.nx,nz:s.nz,length:s.L,gap,edge:s.edge},streetDistance:roadDistance(p.x,p.z,s.nx,s.nz)});return placements[old];}
 function record(kind,s,start,reason){if(placements.length===start)return;const items=placements.slice(start),x=items.reduce((a,p)=>a+p.x,0)/items.length,z=items.reduce((a,p)=>a+p.z,0)/items.length;groups.push({kind,owner:s.owner,x,z,nx:s.nx,nz:s.nz,ids:items.map(p=>p.id),count:items.length,reason});}
 // One equipment spine per facade. Alternatives are tried along blank bays; existing windows reject overlaps.
 const serviced=new Set();
 for(const s of supports.filter(s=>s.kind==='facade')){if(serviced.has(s.owner))continue;const start=placements.length;
 const seed=Math.abs(s.owner),us=[-.34,-.18,.18,.34,0].map(v=>v*s.L);
 for(const u of us){let meter=null;for(const id of [86]){meter=put(s,u,id,1.15,'wall-meter');if(meter)break}if(!meter)continue;
 for(const du of [-1.25,1.25,-2.1,2.1])if(put(s,u+du,seed%3===0?91:19,0,'wall-ac'))break;
 // Gas meters and connected routes are now generated with the facade openings.
 serviced.add(s.owner);break;}
 if(!serviced.has(s.owner))for(const u of us)if(put(s,u,19,0,'wall-ac')){serviced.add(s.owner);break;}
 record('equipment',s,start,'창문과 출입문을 피해 같은 벽면에 모인 계량기·실외기·수직 배관');
 }
 // Bicycles need an actual wall/rail behind them and stay near an accessible facade end.
 const bikeOwners=new Set();
 for(const s of supports){if(bikeOwners.has(s.owner)||s.roadDistance>5||s.L<2)continue;const start=placements.length,seed=Math.abs(s.owner),ids=seed%3===0?[32,31,101]:[31,103,101];
 for(const u of [-s.L*.28,s.L*.28,0]){let first=null;for(const id of ids){first=put(s,u,id,0,'wall-bike');if(first)break}if(!first)continue;
 if(s.L>4.4&&seed%2===0)for(const du of [1.6,-1.6])if(put(s,u+du,102,0,'family-bike'))break;
 bikeOwners.add(s.owner);break;}
 record('bicycle',s,start,'담장·외벽과 평행하게 세우고 현관 통로를 남긴 자전거 보관 자리');
 }
 // Small, spaced pickup pockets near a road. Bins/bags are not spread through every yard.
 const pickups=[];
 for(const s of supports.filter(s=>s.roadDistance<2.4).sort((a,b)=>a.roadDistance-b.roadDistance)){if(pickups.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<11))continue;const start=placements.length,seed=Math.abs(s.owner);
 const us=s.L>3?[s.L/2-.55,-s.L/2+.55,0]:[0];
 for(const u of us){const b=template(seed%3?45:41).b,q=at(s,u,-b.min.z+s.gap);if(pickups.some(p=>Math.hypot(p.x-q.x,p.z-q.z)<11))continue;const approachStart=at(s,u,-b.min.z+s.gap+b.max.z+.12),rd=roadDistance(approachStart.x,approachStart.z,s.nx,s.nz,3);if(!Number.isFinite(rd))continue;const approach=[[-.24,0],[.24,0],[.24,rd+.1],[-.24,rd+.1]].map(([uu,vv])=>[approachStart.x+s.ux*uu+s.nx*vv,approachStart.z+s.uz*uu+s.nz*vv]);if(!canAccess(approach,true))continue;const first=put(s,u,seed%3?45:41,0,'pickup-primary');if(first)first.pickupApproach=approach;if(!first)continue;
 for(const du of [.65,-.65,1.2,-1.2])if(put(s,u+du,seed%2?112:41,0,'pickup-bag'))break;
 if(s.L>2)for(const du of [1.28,-1.28,.68,-.68])if(put(s,u+du,43,0,'pickup-cardboard'))break;
 pickups.push(first);break;}
 record('collection',s,start,'도로에 닿는 벽 끝의 소규모 배출 자리, 주변 수거 자리와 11m 이상 분리');
 }
 // Off-road parallel bays require a clear driveway strip to the road. No parking on narrow lane surfaces.
 const parked=new Set();
 for(const s of supports.filter(s=>s.kind==='facade'&&s.L>6&&s.roadDistance>2.4&&s.roadDistance<7)){if(parked.has(s.owner))continue;const start=placements.length;
 for(const u of [-s.L*.27,s.L*.27,0]){const id=Math.abs(s.owner)%2?211:212,b=template(id).b,v=-b.min.z+.3,p=at(s,u,v),depth=b.max.z-b.min.z;
 const front=v+b.max.z+.15,d=roadDistance(at(s,u,front).x,at(s,u,front).z,s.nx,s.nz,6);if(!Number.isFinite(d))continue;
 const a=at(s,u,front),end=at(s,u,front+d+.15),half=1.8,fp=[[-half,0],[half,0],[half,d+.15],[-half,d+.15]].map(([uu,vv])=>[a.x+s.ux*uu+s.nx*vv,a.z+s.uz*uu+s.nz*vv]);
 if(!canAccess(fp))continue;let width=0;for(let k=.2;k<6;k+=.2){if(!roadInfo(end.x+s.nx*k,end.z+s.nz*k))break;width=k;}if(width<2.8)continue;
 const placed=put(s,u,id,0,'accessible-parked-car',.3-s.gap);if(!placed)continue;placed.driveway=fp;placed.roadWidth=width;parked.add(s.owner);
 for(const du of [2.4,-2.4])if(put(s,u+du,34,0,'parking-sign'))break;break;}
 record('parking',s,start,'건물 앞 후퇴 공간에 주차, 도로 연결 띠와 보행 출입구는 비워 둠');
 }
 return{version:22,source:'Kakao roadview neighborhood observations, 2022-08 and 2025-06; inferred placement',groups,supports: supports.length,counts:Object.fromEntries(['equipment','bicycle','collection','parking'].map(k=>[k,groups.filter(g=>g.kind===k).length]))};
}
