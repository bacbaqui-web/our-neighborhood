import {inPolygon} from '../../facilities/placement.js';
import {segmentDistance} from './layout.js';
export const livingCatalog=[
 {id:'ramp',name:'청록 지붕 지하주차장 입구',w:5.8,d:10.4,reference:'infill-study/photos/ramp.jpg'},
 {id:'bike',name:'곡면 지붕 자전거 보관소',w:6,d:3.6,reference:'infill-study/photos/bike.jpg'},
 {id:'recycling',name:'가림막 분리수거장',w:5.2,d:3.6,reference:'infill-study/photos/waste.jpg'},
 {id:'pergola',name:'목재 퍼걸러 쉼터',w:5.8,d:5.4,reference:'infill-study/photos/rest.jpg'},
 {id:'guard',name:'유리 경비실과 안내판',w:3.8,d:3.6,reference:'infill-study/living-spaces-concept-v1.png'},
 {id:'play',name:'어린이 놀이 공간',w:13,d:11,reference:'infill-study/photos/play.jpg'}
];
export function planLivingSpaces(plan,layout,saved=null){
 const placed=saved?.placed||[],paths=saved?.paths||[],proposals=saved?.proposals||[],local=p=>[(p[0]-640)*plan.pixelTransform.x,(p[1]-360)*plan.pixelTransform.z];
 const grid=new Map();for(const b of layout.parking){const xs=b.footprint.map(p=>p[0]),zs=b.footprint.map(p=>p[1]);for(let x=Math.floor((Math.min(...xs)-1)/10);x<=Math.floor((Math.max(...xs)+1)/10);x++)for(let z=Math.floor((Math.min(...zs)-1)/10);z<=Math.floor((Math.max(...zs)+1)/10);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(b);}}
 const parkingBlocked=p=>(grid.get(Math.floor(p[0]/10)+','+Math.floor(p[1]/10))||[]).some(b=>inPolygon(p,b.footprint)||b.footprint.some((a,i)=>segmentDistance(p,a,b.footprint[(i+1)%4])<.65));
 const solid=p=>!layout.inside(p)||layout.occupied(p)||layout.wallDistance(p)<.9||parkingBlocked(p);
 const nearPlaced=p=>placed.some(s=>inPolygon(p,s.footprint)||s.footprint.some((a,i)=>segmentDistance(p,a,s.footprint[(i+1)%4])<1));
 const requests=[['ramp',[553,211]],['ramp',[628,336]],['play',[743,448]],['guard',[491,245]],['pergola',[651,613]],['pergola',[525,330]],['pergola',[651,335]],['bike',[536,195]],['bike',[560,311]],['bike',[647,445]],['bike',[775,546]],['bike',[647,584]],['recycling',[508,280]],['recycling',[677,461]],['recycling',[779,477]],['recycling',[694,594]]];
 for(const [kind,pixel]of (saved?[]:requests)){const spec=livingCatalog.find(s=>s.id===kind),target=local(pixel),candidates=[];
 for(let dz=-16;dz<=16;dz+=2)for(let dx=-16;dx<=16;dx+=2){const point=[target[0]+dx,target[1]+dz];if(solid(point)||nearPlaced(point))continue;const nearest=layout.roads.map(r=>{const vx=r.b[0]-r.a[0],vz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((point[0]-r.a[0])*vx+(point[1]-r.a[1])*vz)/(vx*vx+vz*vz)));return {r,end:[r.a[0]+vx*t,r.a[1]+vz*t],distance:segmentDistance(point,r.a,r.b)};}).sort((a,b)=>a.distance-b.distance).slice(0,4);
 for(const {r,end,distance}of nearest){if(distance>26)continue;const angle=Math.atan2(end[0]-point[0],end[1]-point[1]),c=Math.cos(angle),s=Math.sin(angle),at=(x,z)=>[point[0]+c*x+s*z,point[1]-s*x+c*z],footprint=[at(-spec.w/2,-spec.d/2),at(spec.w/2,-spec.d/2),at(spec.w/2,spec.d/2),at(-spec.w/2,spec.d/2)];let safe=true;
 for(let x=-spec.w/2-.3;x<=spec.w/2+.31;x+=.65)for(let z=-spec.d/2-.3;z<=spec.d/2+.31;z+=.65){const p=at(x,z);if(solid(p)||nearPlaced(p)||layout.roadDistance(p)<1.5||layout.pathDistance(p)<.5){safe=false;break;}}if(!safe)continue;
 if(kind==='recycling'&&placed.some(s=>['play','pergola'].includes(s.kind)&&Math.hypot(point[0]-s.point[0],point[1]-s.point[1])<18))continue;
 const start=at(0,spec.d/2),length=Math.hypot(end[0]-start[0],end[1]-start[1]),path={a:start,b:end,width:1.6};
 for(let k=0;k<=Math.ceil(length*2);k++){const t=k/(Math.ceil(length*2)||1);for(const offset of [-.85,0,.85]){const p=[start[0]+(end[0]-start[0])*t+c*offset,start[1]+(end[1]-start[1])*t-s*offset];if(!layout.inside(p)||layout.occupied(p)||parkingBlocked(p)||nearPlaced(p)){safe=false;break;}}if(!safe)break;}if(!safe)continue;
 candidates.push({...spec,kind,point,angle,footprint,path,score:Math.hypot(dx,dz)+distance*.22});}}
 candidates.sort((a,b)=>a.score-b.score);if(candidates[0]){const selected=candidates[0];selected.id=kind+'-'+placed.filter(s=>s.kind===kind).length;placed.push(selected);paths.push(selected.path);}else proposals.push({kind,pixel,reason:'통로를 확보할 수 있는 자리가 없음'});
 }
 const reserved=p=>nearPlaced(p)||paths.some(r=>segmentDistance(p,r.a,r.b)<r.width/2+.7);
 const paving=p=>!placed.some(s=>s.kind==='ramp'&&inPolygon(p,s.footprint))&&layout.inside(p)&&!layout.occupied(p)&&!parkingBlocked(p)&&layout.roadDistance(p)>.1&&(layout.roadDistance(p)<3.1||paths.some(r=>segmentDistance(p,r.a,r.b)<r.width/2)||placed.some(s=>inPolygon(p,s.footprint)));
 const beds=[];for(let x=layout.bounds.minX;x<layout.bounds.maxX;x+=2.1)for(let z=layout.bounds.minZ;z<layout.bounds.maxZ;z+=2.1){const p=[x,z],road=layout.roadDistance(p);if(road<3.3||road>5.1||solid(p)||reserved(p)||layout.pathDistance(p)<1.5)continue;beds.push({point:p,radius:.65,tone:beds.length%4});}
 return {placed,paths,beds,reserved,paving,proposals,qa:{facilities:placed.length,types:Object.fromEntries(livingCatalog.map(s=>[s.id,placed.filter(p=>p.kind===s.id).length])),plantingBeds:beds.length,reused:['alley-library/models.js:31','alley-library/models.js:44','alley-library/models.js:126']}};
}
