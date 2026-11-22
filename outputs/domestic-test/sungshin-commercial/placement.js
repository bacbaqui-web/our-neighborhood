import * as T from 'three';
import {designs} from './designs.js';
import {loadCommercialBuilding} from '../asset-encyclopedia/categories/commerce/generators.js';
import {sameRoadAddress} from '../shops/alley-selection.js?v=shop-address3';
import {stableHash} from '../shops/storefront-hours.js';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const area=p=>p.reduce((s,a,i)=>s+a[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*a[1],0)/2;
function inside(p,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
export function commercialCandidates(registry){return designs.filter(d=>{const a=registry.resolve('building:'+d.id);return a?.kind==='building'&&a.pack==='sungshin-commercial'&&a.key===d.id;});}
// A gently skewed four-sided mapped footprint is preserved vertex-for-vertex.
// Concave, curved and annex footprints keep the existing polygon renderer.
export function fitCommercialFrame(b){
 if(b.holes||b.points?.length!==4||!Number.isInteger(b.frontEdge))return null;
 const p=b.points;if(!p.flat().every(Number.isFinite))return null;
 const i=b.frontEdge,a=p[i],c=p[(i+1)%4],sign=Math.sign(area(p));
 if(!sign||p.some((q,k)=>Math.sign(cross(q,p[(k+1)%4],p[(k+2)%4]))!==sign))return null;
 const left=sign>0?c:a,right=sign>0?a:c,backLeft=sign>0?p[(i+2)%4]:p[(i+3)%4],backRight=sign>0?p[(i+3)%4]:p[(i+2)%4];
 const width=distance(left,right),rear=distance(backLeft,backRight),dl=distance(left,backLeft),dr=distance(right,backRight),depth=(dl+dr)/2;
 if(Math.min(width,rear,dl,dr)<3||Math.max(width,rear)/Math.min(width,rear)>1.22||Math.max(dl,dr)/Math.min(dl,dr)>1.22)return null;
 for(let k=0;k<4;k++){const q=p[k],u=p[(k+1)%4],v=p[(k+3)%4],dot=((u[0]-q[0])*(v[0]-q[0])+(u[1]-q[1])*(v[1]-q[1]))/(distance(q,u)*distance(q,v));if(Math.abs(dot)>.23)return null;}
 const n=[(left[1]-right[1])/width,(right[0]-left[0])/width];
 return {left,right,backLeft,backRight,width,depth,n,front:[(a[0]+c[0])/2,(a[1]+c[1])/2]};
}
export function planCommercialCandidates(buildings,registry,{elevation,places=[],paletteEnabled=false}={}){
 const pool=commercialCandidates(registry),choices=[],skipped=[];
 for(const b of buildings){
  const p=b.properties?.streetProfile,skip=reason=>skipped.push({owner:b.seed,reason});
  if(paletteEnabled||b.manualAssetChoice||p?.assetId||p?.manualFields?.some(k=>['era','styleIndex'].includes(k))){skip('manual-design');continue;}
  if(b.facility||b.apartment||b.arterialKiosk||b.arterialFacades?.length){skip('retained-special-building');continue;}
  const code=String(b.properties?.bdtyp_cd||'');
  if((p?.use!=='mixed'&&p?.use!=='commercial')||/^(01|02)/.test(code)){skip('not-commercial');continue;}
  if(places.some(v=>sameRoadAddress(v.road_address_name,b.address))){skip('confirmed-poi-retained');continue;}
  const frame=fitCommercialFrame(b);if(!frame){skip('unsupported-footprint');continue;}
  const heights=b.points.map(q=>elevation(...q)),frontHeights=[frame.left,frame.front,frame.right].map(q=>elevation(...q));
  if(!heights.every(Number.isFinite)||Math.max(...heights)-Math.min(...heights)>.45||Math.max(...frontHeights)-Math.min(...frontHeights)>.18){skip('sloping-ground');continue;}
  const candidates=pool.filter(d=>d.floors===b.levels&&frame.width/d.width>=.75&&frame.width/d.width<=1.35&&frame.depth/d.depth>=.75&&frame.depth/d.depth<=1.35).map(d=>({key:d.id,encyclopediaId:'building:'+d.id,score:Math.abs(Math.log(frame.width/d.width))+Math.abs(Math.log(frame.depth/d.depth))}));
  candidates.sort((a,c)=>a.score-c.score||a.key.localeCompare(c.key));
  if(!candidates.length){skip('no-fitting-registered-model');continue;}
  // Similar-fitting designs vary by owner; the same saved building stays stable.
  const close=candidates.filter(c=>c.score<=candidates[0].score+.25),offset=stableHash('sungshin|'+b.seed)%close.length;
  const ordered=[...close.slice(offset),...close.slice(0,offset),...candidates.filter(c=>!close.includes(c))];
  choices.push({owner:b.seed,frame,candidates:ordered});
 }
 return {choices,skipped,registeredCandidates:pool.map(d=>'building:'+d.id)};
}
function mappedPoint(frame,d,x,z){
 const u=x/d.width+.5,v=z/d.depth+.5;
 const back=[frame.backLeft[0]*(1-u)+frame.backRight[0]*u,frame.backLeft[1]*(1-u)+frame.backRight[1]*u],front=[frame.left[0]*(1-u)+frame.right[0]*u,frame.left[1]*(1-u)+frame.right[1]*u];
 return [back[0]*(1-v)+front[0]*v,back[1]*(1-v)+front[1]*v];
}
export function fitCommercialModel(model,d,b,frame,{elevation,roadInfo,buildings,requireRoad=false}){
 model.updateMatrixWorld(true);const roof=model.getObjectByName('RoofDeck');if(!roof)return {ok:false,reason:'missing-roof'};
 const roofBox=new T.Box3().setFromObject(roof),ground=Math.max(...b.points.map(q=>elevation(...q)),... [frame.left,frame.front,frame.right].map(q=>elevation(...q)))+.01;
 const minimumDoor=Math.min(...(model.userData.entranceHeights||[2.3])),sy=Math.max((b.top-ground)/roofBox.max.y,1.9/minimumDoor);
 // The source height is floor-count × 3m, not a surveyed eave. A small allowance
 // preserves human-sized doors without changing the confirmed number of floors.
 if(sy<.78||sy>1.18||ground+roofBox.max.y*sy-b.top>.35)return {ok:false,reason:'height-mismatch'};
 const others=buildings.filter(q=>q.seed!==b.seed),vector=new T.Vector3(),parts=[],envelope=[];
 let unsafe=false;
 model.traverse(o=>{
  if((!o.isMesh&&!o.isLineSegments)||!o.geometry)return;
  const geo=o.geometry.clone().applyMatrix4(o.matrixWorld),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){vector.fromBufferAttribute(pos,i);const [x,z]=mappedPoint(frame,d,vector.x,vector.z),y=ground+vector.y*sy;pos.setXYZ(i,x,y,z);}
  if(o.isMesh)geo.computeVertexNormals();geo.computeBoundingBox();const box=geo.boundingBox;
  // Actual per-part bounds, not only building centre, reject road/neighbor intrusion.
  const checked=new Set(),sample=(x,z)=>{const key=x.toFixed(3)+','+z.toFixed(3);if(checked.has(key))return;checked.add(key);if(others.some(q=>inside([x,z],q.points))||(!inside([x,z],b.points)&&roadInfo?.(x,z)))unsafe=true;};
  for(let i=0;i<pos.count;i++)sample(pos.getX(i),pos.getZ(i));
  const ix=geo.index,count=ix?.count??pos.count;
  const stride=o.isLineSegments?2:3;for(let i=0;i<count;i+=stride){const indices=Array.from({length:stride},(_,k)=>ix?ix.getX(i+k):i+k);for(let k=0;k<stride;k++){const a=indices[k],c=indices[(k+1)%stride],x=pos.getX(a),z=pos.getZ(a),dx=pos.getX(c)-x,dz=pos.getZ(c)-z,steps=Math.ceil(Math.hypot(dx,dz)/.35);for(let j=1;j<steps;j++)sample(x+dx*j/steps,z+dz*j/steps);}}
  envelope.push([box.min.x,box.min.z,box.max.x,box.max.z]);parts.push({object:o,geometry:geo});
 });
 if(unsafe){parts.forEach(p=>p.geometry.dispose());return {ok:false,reason:'road-or-neighbor-clearance'};}
 // Require a clear approach from the entire frontage to an existing public road.
 if(requireRoad){
  let connected=0;
  for(const t of [.15,.5,.85]){const start=[frame.left[0]*(1-t)+frame.right[0]*t,frame.left[1]*(1-t)+frame.right[1]*t];let found=false;
   for(let dist=.3;dist<=10;dist+=.3){const q=[start[0]+frame.n[0]*dist,start[1]+frame.n[1]*dist];if(others.some(o=>inside(q,o.points)))break;if(roadInfo?.(...q)){found=true;break;}}
   if(found)connected++;
  }
  if(connected<3){parts.forEach(p=>p.geometry.dispose());return {ok:false,reason:'no-connected-frontage'};}
 }
 for(const {object,geometry} of parts){object.geometry.dispose();object.geometry=geometry;if(object.material?.transparent)object.userData.sungshinGlass=true;if(object.material?.map&&!object.userData.shopInterior)object.userData.brandSign=true;object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);model.add(object);}
 // Flatten the hierarchy after baking transforms; retain all named parts and materials.
 for(const child of [...model.children])if(!child.isMesh&&!child.isLineSegments)model.remove(child);
 model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.set(1,1,1);
 const low=Math.min(...b.points.map(q=>elevation(...q)))-.03;
 if(ground-low>.025){const points=[];for(let i=0;i<b.points.length;i++){const a=b.points[i],c=b.points[(i+1)%b.points.length];points.push(a[0],low,a[1],c[0],low,c[1],c[0],ground,c[1],a[0],low,a[1],c[0],ground,c[1],a[0],ground,a[1]);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:0xa7a59e,roughness:1,side:T.DoubleSide}));m.name='MappedFoundation';model.add(m);}
 const assetId='building:'+d.id;model.name='Placed-'+d.id+'-'+b.seed;model.userData={...model.userData,encyclopediaId:assetId,owner:b.seed,placement:'inferred-commercial-reference',mappedFootprint:b.points.map(p=>p.slice()),mappedLevels:b.levels};
 model.updateMatrixWorld(true);
 return {ok:true,assetId,key:d.id,owner:b.seed,name:d.name+' (성신 참고)',address:b.address,placeId:'commercial-'+b.seed,position:[...frame.front.slice(0,1),ground,frame.front[1]],n:frame.n,width:frame.width,height:roofBox.max.y*sy,ground,verticalScale:sy,minimumDoorHeight:minimumDoor*sy,inferredRoofAdjustment:ground+roofBox.max.y*sy-b.top,footprint:b.points.map(p=>p.slice()),reference:'inferred-commercial-reference',envelope};
}
export async function createCommercialNeighborhood(buildings,registry,options){
 const group=new T.Group();group.name='SungshinCommercialBuildings';
 const plan=planCommercialCandidates(buildings,registry,options),placements=[],skipped=plan.skipped.slice();
 for(const choice of plan.choices){
  const b=buildings.find(b=>b.seed===choice.owner);let placed=false,lastReason='no-fitting-registered-model';
  for(const c of choice.candidates){
   const d=designs.find(d=>d.id===c.key),model=await loadCommercialBuilding(c.key),fit=fitCommercialModel(model,d,b,choice.frame,{...options,buildings,requireRoad:true});
   if(!fit.ok){model.disposePreview();lastReason=fit.reason;continue;}
   b.sungshinCommercial={assetId:fit.assetId,key:fit.key,envelope:fit.envelope};group.add(model);placements.push(fit);placed=true;break;
  }
  if(!placed)skipped.push({owner:b.seed,reason:lastReason});
 }
 const qa={registeredCandidates:plan.registeredCandidates,placements,skipped};group.userData=qa;
 return {group,qa,owners:new Set(placements.map(p=>p.owner)),dispose(){for(const model of group.children)model.disposePreview();group.clear();}};
}
