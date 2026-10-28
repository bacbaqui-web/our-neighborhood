import {livingRejection,rankPocketAssets,nearestFacade} from './living-context.js?v=138';
import {repairCourtyardBoundaries} from './courtyard-rules.js?v=138';
import {retiredLegacy,recordMemoScene} from './memo-scene.js?v=134';
import {applyRepresentative} from './representative-assets.js?v=133';
import {getLegacyPlacementRule} from './legacy-placement-policy.js?v=113';
import {evaluatePlacement} from './placement-policy.js?v=110';
import {getRoadview50Template,roadview50Summary,getPlacementRule,getPlacementRuleInfo} from './roadview50-loader.js?v=133';
import {inArterial} from './arterial.js?v=79';
import {seatGroundAsset} from './ground-contact.js?v=141';
import {createContactSurfaceSampler} from './contact-shadows.js?v=82';
import {inShopApproach} from './shops/neighborhood-plan.js?v=72';
import {extractVegetation} from './vegetation-legacy.js?v=115';
import {partMaxLOD} from './lod-policy.js?v=29';
import {populateStreetLife,contextOnly} from './street-life.js?v=59';
import {renderAttachedStructures} from './attached-structures.js?v=141';
import {classifyYards,programs,inYard,yardCandidates,edgeCandidates} from './neighborhood-rules.js?v=17.2';
import {renderParcels} from './parcel-renderer.js?v=136';
import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createAsset,addLines} from '../alley-library/models.js?v=134';
export function decorateAlleys(specs,elevation,roadInfo,obstacles,parcelData,attachedPlan,streetscapePlan,arterialPlan=null,options={}){
 const eligible=owner=>!options.propOwners||options.propOwners.has(Number(owner));
 const shopPlans=specs.flatMap(s=>s.storefronts||[]);
 const root=new T.Group();root.name='street-yard-alley-library';const cache=new Map(),placed=[],footprints=[],lots=[],report={boundaryDiagnostics:{},compounds:[],placements:[],rejected:0,rule:'Atomic connected boundaries and gate openings first; owner-reserved yards and entrance corridors; role-based household anchors second'};
 const polys=specs.map(s=>({...s,minX:Math.min(...s.points.map(p=>p[0])),maxX:Math.max(...s.points.map(p=>p[0])),minZ:Math.min(...s.points.map(p=>p[1])),maxZ:Math.max(...s.points.map(p=>p[1]))}));
 function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
 function edgeBox(a,b,r){let lo=0,hi=1;for(const [a0,d,mn,mx] of [[a[0],b[0]-a[0],r.min.x,r.max.x],[a[1],b[1]-a[1],r.min.z,r.max.z]]){if(Math.abs(d)<1e-8){if(a0<mn||a0>mx)return false;continue}let t0=(mn-a0)/d,t1=(mx-a0)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false}return true}
 function intersectsBuilding(b){return polys.some(s=>{if(b.max.x<s.minX||b.min.x>s.maxX||b.max.z<s.minZ||b.min.z>s.maxZ)return false;if(inside(b.min.x,b.min.z,s.points))return true;return s.points.some((a,i)=>edgeBox(a,s.points[(i+1)%s.points.length],b))})}
 function segments(a,b,c,d){const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);return cross(a,b,c)*cross(a,b,d)<-1e-10&&cross(c,d,a)*cross(c,d,b)<-1e-10}
 function footprintHits(p){const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loZ=Math.min(...zs),hiZ=Math.max(...zs);return polys.some(s=>!(s.maxX<loX||s.minX>hiX||s.maxZ<loZ||s.minZ>hiZ)&&(p.some(q=>inside(q[0],q[1],s.points))||s.points.some(q=>inside(q[0],q[1],p))||p.some((a,i)=>s.points.some((c,j)=>segments(a,p[(i+1)%p.length],c,s.points[(j+1)%s.points.length])))))}
 const cells=new Map(options.staticCache?[...options.staticCache.obstacleCells].map(([k,v])=>[k,v.slice()]):[]);function keys(b){const a=[];for(let x=Math.floor(b.min.x/3);x<=Math.floor(b.max.x/3);x++)for(let z=Math.floor(b.min.z/3);z<=Math.floor(b.max.z/3);z++)a.push(x+','+z);return a}
 function indexTriangle(vs){const b=new T.Box3();b.triangle=new Float32Array(9);for(let j=0;j<3;j++){const v=vs[j];b.expandByPoint(v);v.toArray(b.triangle,j*3)}for(const k of keys(b)){if(!cells.has(k))cells.set(k,[]);cells.get(k).push(b)}}
 for(const group of obstacles){
  if(options.staticCache&&!group.userData.placementProxies)continue;
  // Use one conservative box per window/equipment assembly, not each tiny sash component.
  if(group.userData.placementProxies){const faces=[[0,1,3],[0,3,2],[4,6,7],[4,7,5],[0,4,5],[0,5,1],[2,3,7],[2,7,6],[0,2,6],[0,6,4],[1,5,7],[1,7,3]];for(const corners of group.userData.placementProxies)for(const face of faces)indexTriangle(face.map(i=>new T.Vector3(...corners[i])));continue;}
  group.updateMatrixWorld(true);group.traverse(m=>{if(!m.isMesh||!m.visible||m.userData.noPlacementCollision)return;const p=m.geometry.attributes.position,ix=m.geometry.index,n=ix?ix.count:p.count;for(let i=0;i<n;i+=3)indexTriangle([0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(m.matrixWorld)))})
 }

 const entries=polys.filter(s=>s.frontage).map(s=>{const f=s.frontage;return {x:f.a[0]+f.ux*f.entry,z:f.a[1]+f.uz*f.entry,nx:f.nx,nz:f.nz,depth:f.mean+.7,owner:s.seed}});
 function overlapPolys(a,b){return a.some(p=>inside(...p,b))||b.some(p=>inside(...p,a))||a.some((p,i)=>b.some((q,j)=>segments(p,a[(i+1)%a.length],q,b[(j+1)%b.length])))}

 const accessShapes=parcelData.yards.flatMap(y=>(y.entrance||[]).slice(1).map((b,i)=>{const a=y.entrance[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/(L||1),uz=(b[1]-a[1])/(L||1),r=.9;const fp=[[-r,-r],[L+r,-r],[L+r,r],[-r,r]].map(([x,z])=>[a[0]+ux*x-uz*z,a[1]+uz*x+ux*z]);return{fp,minX:Math.min(...fp.map(p=>p[0])),maxX:Math.max(...fp.map(p=>p[0])),minZ:Math.min(...fp.map(p=>p[1])),maxZ:Math.max(...fp.map(p=>p[1]))}}));
 function structuralShape(seg){const {a,b,width}=seg,L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=L?(b[0]-a[0])/L:Math.cos(seg.angle||0),uz=L?(b[1]-a[1])/L:-Math.sin(seg.angle||0),r=width/2+.035,cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2,half=L?L/2+.035:r;
 const fp=[[-half,-r],[half,-r],[half,r],[-half,r]].map(([x,z])=>[cx+ux*x-uz*z,cz+uz*x+ux*z]);const box=new T.Box3();for(const q of fp){box.expandByPoint(new T.Vector3(q[0],seg.base,q[1]));box.expandByPoint(new T.Vector3(q[0],seg.top,q[1]))}return {fp,box,cx,cz,ux,uz,localBox:new T.Box3(new T.Vector3(-half,seg.base,-r),new T.Vector3(half,seg.top,r))};}
 function obstacleHit(shape,b){if(!b.intersectsBox(shape.box))return false;if(!b.triangle)return true;const vs=[];for(let i=0;i<3;i++){const x=b.triangle[i*3]-shape.cx,z=b.triangle[i*3+2]-shape.cz;vs.push(new T.Vector3(x*shape.ux+z*shape.uz,b.triangle[i*3+1],-x*shape.uz+z*shape.ux))}return shape.localBox.intersectsTriangle(new T.Triangle(...vs))}
 streetscapePlan=options.staticCache?.streetscapePlan||repairCourtyardBoundaries(streetscapePlan,parcelData,attachedPlan,polys,roadInfo);report.courtyardRepair=streetscapePlan.qa.courtyardRepair;
 const yards=classifyYards(parcelData,polys,elevation);const architecture=options.staticCache?.architecture||renderAttachedStructures(attachedPlan,elevation);if(!options.staticCache)root.add(architecture.group);report.attachedStructures=architecture.records;report.attachedGroundContacts=architecture.groundContacts;report.attachedAssetPlacements=architecture.assetPlacements;report.attachedSupportFit=architecture.group.userData.supportFit;report.attachedValidation=attachedPlan.qa;report.households=attachedPlan.households.map(h=>({...h,frontage:polys.find(p=>p.seed===h.owner)?.frontage}));const parcel=options.staticCache?.parcel||renderParcels({...parcelData,segments:attachedPlan.wallSegments},elevation,yards,streetscapePlan,roadInfo);if(!options.staticCache)root.add(parcel.group);report.openBoundaries=parcel.segments.filter(s=>s.kind!=='low-curb');report.streetscape={...streetscapePlan.qa,gateViews:parcel.views,boundaryFit:parcel.group.userData.boundaryFit};
 for(const seg of parcel.segments){const shape=structuralShape(seg);shape.box.fp=shape.fp;shape.box.parcelWall=true;shape.box.role="wall";shape.box.owner=seg.owner;placed.push(shape.box);footprints.push(shape.fp)}
 for(const c of [...architecture.colliders,...parcel.colliders]){const box=new T.Box3();for(const q of c.fp){box.expandByPoint(new T.Vector3(q[0],c.base,q[1]));box.expandByPoint(new T.Vector3(q[0],c.top,q[1]))}box.fp=c.fp;box.attachedPart=true;box.role=c.role;box.owner=c.owner;placed.push(box);footprints.push(c.fp)}
 const policyCounts=new Map(),policyApproaches=[],policyRejected={},policyAccepted=[];
 function policyReject(reason){policyRejected[reason]=(policyRejected[reason]||0)+1;report.rejected++;return false;}
 const policyWallSegments=[...polys.flatMap(s=>s.points.map((a,i)=>({a,b:s.points[(i+1)%s.points.length],owner:s.seed}))),...parcel.segments];
 function nearestPolicyWall(x,z,owner){let best={distance:Infinity,angle:0};for(const w of policyWallSegments){if(w.owner!==owner)continue;const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],ll=dx*dx+dz*dz;if(ll<.01)continue;const t=Math.max(0,Math.min(1,((x-w.a[0])*dx+(z-w.a[1])*dz)/ll)),qx=w.a[0]+t*dx,qz=w.a[1]+t*dz,d=Math.hypot(x-qx,z-qz);if(d<best.distance)best={distance:d,angle:Math.atan2(x-qx,z-qz),point:[qx,qz]};}return best;}
 const placementSurface=options.staticCache?.placementSurface||createContactSurfaceSampler([architecture.group,parcel.group],elevation);root._structureCache=options.staticCache||{architecture:{...architecture,group:{userData:architecture.group.userData}},parcel:{...parcel,group:{userData:parcel.group.userData}},placementSurface,streetscapePlan,obstacleCells:cells};
 const structuralReservations=architecture.records.map(a=>a.footprint);
 const driveReservations=[...attachedPlan.drives.map(a=>a.polygon),...attachedPlan.structures.filter(a=>a.entryApron).map(a=>a.entryApron)];
 const reservationCells=new Map();
 for(const fp of [...structuralReservations,...driveReservations]){const xs=fp.map(p=>p[0]),zs=fp.map(p=>p[1]),b={fp,minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};for(let x=Math.floor(b.minX/8);x<=Math.floor(b.maxX/8);x++)for(let z=Math.floor(b.minZ/8);z<=Math.floor(b.maxZ/8);z++){const key=x+','+z;if(!reservationCells.has(key))reservationCells.set(key,[]);reservationCells.get(key).push(b)}}
 function reservedHit(fp,box){const seen=new Set();for(let x=Math.floor(box.min.x/8);x<=Math.floor(box.max.x/8);x++)for(let z=Math.floor(box.min.z/8);z<=Math.floor(box.max.z/8);z++)for(const b of reservationCells.get(x+','+z)||[]){if(seen.has(b))continue;seen.add(b);if(b.minX<box.max.x&&b.maxX>box.min.x&&b.minZ<box.max.z&&b.maxZ>box.min.z&&overlapPolys(fp,b.fp))return true}return false;}
 const coverByOwner=new Map(attachedPlan.houses.map(a=>[a.owner,a]));
 report.rule=attachedPlan.rule+'; wall-supported equipment and bikes, road-accessible spaced pickup pockets, driveway-validated parking before yard decoration';report.parcels=yards.map(({triangles,anchors,...p})=>p);report.parcelValidation=parcelData.qa;
 function template(id){if(!cache.has(id)){const legacy=createAsset(id);legacy.updateMatrixWorld(true);const m=getRoadview50Template(id,legacy);m.updateMatrixWorld(true);const b=new T.Box3().setFromObject(m);let triangles=0;m.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});cache.set(id,{m,b,triangles});}return cache.get(id)}
 function commercialFaceAt(owner,x,z){const b=polys.find(b=>b.seed===owner);if(b?.arterialKiosk)return true;return (b?.arterialFacades||[]).some(f=>{const a=b.points[f.edge],c=b.points[(f.edge+1)%b.points.length],dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz),u=((x-a[0])*dx+(z-a[1])*dz)/L,d=Math.abs((x-a[0])*dz-(z-a[1])*dx)/L;return u>-.4&&u<L+.4&&d<2.0;});}
 function tryPlace(id,x,z,angle,lift=0,owner=null,role="household"){if(!eligible(owner))return false;if(retiredLegacy(id))return false;if(commercialFaceAt(owner,x,z)){report.rejected++;return false;}if(inArterial(arterialPlan,x,z,.7)||inShopApproach(shopPlans,x,z,.6)){report.rejected++;return false;}if((id>=201&&id<=205)||[15,76,77,78,79,80,162].includes(id))return false;if(role.startsWith('courtyard-')&&template(id).triangles>1000)return policyReject('courtyard-triangle-budget');const {m,b:local}=template(id),info=m.userData.roadview50,rule=info?getPlacementRule(info):getLegacyPlacementRule(id),policyKey=info?.assetId||'legacy-'+id;
 const yard=yards.find(y=>y.owner===owner&&inYard(y,x,z))||yards.find(y=>y.owner===owner);
 const wall=nearestPolicyWall(x,z,owner);const entry=entries.find(e=>e.owner===owner);
 const context={zone:yard?.type||'unknown',role,area:yard?.area||0,lift,scale:info?.fitScale||1,count:policyCounts.get(owner+':'+policyKey)||0,wallGap:wall?Math.max(0,wall.distance-(local.max.z-local.min.z)/2):Infinity,entryDistance:entry?Math.hypot(x-entry.x,z-entry.z):Infinity};
 if(rule){const reason=evaluatePlacement(rule,context);if(reason)return policyReject(reason);if(rule.orientation==='front-away-from-wall')angle=wall.angle;
 if(info?.assetId==='a182'&&policyAccepted.some(v=>v.assetId==='a182'&&Math.hypot(v.x-x,v.z-z)<18))return policyReject('rest-area-spacing');}
 const livingReason=livingRejection({id,role,lift,area:yard?.area,zone:yard?.type,footprintArea:(local.max.x-local.min.x+.24)*(local.max.z-local.min.z+.24),depth:local.max.z-local.min.z,wallGap:context.wallGap,facadeDistance:nearestFacade(x,z,owner,polys),entryDistance:context.entryDistance,existing:report.placements,x,z,owner});if(livingReason)return policyReject(livingReason);
 const y=elevation(x,z)-local.min.y+.03+lift;const mat=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(1,1,1));const pad=Math.max(['wall-meter','wall-riser'].includes(role)?.02:.08,rule?.clearance||0),box=local.clone().applyMatrix4(mat),padded=box.clone().expandByScalar(.08),fp=[[local.min.x-pad,local.min.z-pad],[local.max.x+pad,local.min.z-pad],[local.max.x+pad,local.max.z+pad],[local.min.x-pad,local.max.z+pad]].map(([xx,zz])=>[x+xx*Math.cos(angle)+zz*Math.sin(angle),z-xx*Math.sin(angle)+zz*Math.cos(angle)]);if(elevation.detailRadius&&fp.some(p=>Math.hypot(...p)>elevation.detailRadius))return policyReject('outside-detail-circle');if(policyApproaches.some(a=>overlapPolys(fp,a))||report.placements.some(p=>p.driveway&&overlapPolys(fp,p.driveway))||reservedHit(fp,padded)||footprintHits(fp)||lots.some(l=>l.owner!==owner&&overlapPolys(fp,l.yard))||placed.some(b=>b.intersectsBox(padded)&&overlapPolys(fp,b.fp))){report.rejected++;return}
 if(lift<.8&&accessShapes.some(a=>a.minX<padded.max.x&&a.maxX>padded.min.x&&a.minZ<padded.max.z&&a.maxZ>padded.min.z&&overlapPolys(fp,a.fp))){report.rejected++;return}
 if(lift<.8&&parcelData.yards.some(y=>(y.entrance||[]).slice(1).some((b,i)=>{const a=y.entrance[i],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),t=((x-a[0])*dx+(z-a[1])*dz)/(L*L);return t>=0&&t<=1&&Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.95+Math.max(box.max.x-box.min.x,box.max.z-box.min.z)/2}))){report.rejected++;return}
 if(lift<.8&&entries.some(e=>{const dx=x-e.x,dz=z-e.z,t=dx*e.nx+dz*e.nz,w=dx*(-e.nz)+dz*e.nx;return t>-.5&&t<e.depth&&Math.abs(w)<.85+Math.max(box.max.x-box.min.x,box.max.z-box.min.z)/2})){report.rejected++;return}
 let min=Infinity,max=-Infinity;for(let xx=padded.min.x;xx<=padded.max.x+.12;xx+=.12)for(let zz=padded.min.z;zz<=padded.max.z+.12;zz+=.12){const cx=Math.min(xx,padded.max.x),cz=Math.min(zz,padded.max.z);if(roadInfo(cx,cz)){report.rejected++;return}const h=elevation(cx,cz);min=Math.min(min,h);max=Math.max(max,h)}if(max-min>(rule?.slopeMax??([154,155,196,197,200].includes(id)?1.5:[181,182].includes(id)?.6:[173,174,211,212].includes(id)?.4:.24))){report.rejected++;return}
 padded.translate(new T.Vector3(0,max-local.min.y+.02+lift-y,0));
 if(placed.some(b=>b.intersectsBox(padded)&&overlapPolys(fp,b.fp))){report.rejected++;return}
 const localCheck=local.clone().expandByScalar(.08);localCheck.min.y+=max-local.min.y+.02+lift;localCheck.max.y+=max-local.min.y+.02+lift;const propShape={box:padded,cx:x,cz:z,ux:Math.cos(angle),uz:-Math.sin(angle),localBox:localCheck};
 for(const k of keys(padded))if((cells.get(k)||[]).some(b=>obstacleHit(propShape,b))){report.rejected++;return}
 const obj=m.clone(true);obj.position.set(x,max-local.min.y+.02+lift,z);obj.rotation.y=angle;obj.userData={...m.userData,vegetationAssetId:id,placementOwner:owner,placement:'roadview-inspired, not surveyed'};
 // Wall equipment keeps its intentional mounting height. All free-standing props
 // rest on the visible courtyard paving, including its height above raw terrain.
 const groundFit=lift===0&&!['wall-meter','wall-riser'].includes(role)&&![154,155,196,197,200].includes(id)?seatGroundAsset(obj,placementSurface,{suspension:!!elevation.routeCorrected}):null;
 obj.updateMatrixWorld(true);const fittedBox=new T.Box3().setFromObject(obj),pb=fittedBox.clone().expandByScalar(.08);
 // Recheck the fitted pose: pitching must not push a roof/handlebar into a facade.
 if(groundFit?.method==='rendered-contact-vertices'&&intersectsBuilding(pb)){report.rejected++;return false;}
 if(placed.some(b=>b.intersectsBox(pb)&&overlapPolys(fp,b.fp))){report.rejected++;return false;}
 const inverse=obj.matrixWorld.clone().invert(),fittedLocal=local.clone();fittedLocal.min.divide(obj.scale);fittedLocal.max.divide(obj.scale);fittedLocal.expandByScalar(.08);
 for(const k of keys(pb))if((cells.get(k)||[]).some(b=>{if(!b.intersectsBox(pb))return false;if(!b.triangle)return true;const vs=[0,1,2].map(i=>new T.Vector3(...b.triangle.slice(i*3,i*3+3)).applyMatrix4(inverse));return fittedLocal.intersectsTriangle(new T.Triangle(...vs));})){report.rejected++;return false;}
 let approach=null;
 if(rule?.frontClearance){const depth=rule.frontClearance,cs=Math.cos(angle),sn=Math.sin(angle);approach=[[local.min.x,.04+local.max.z],[local.max.x,.04+local.max.z],[local.max.x,local.max.z+depth],[local.min.x,local.max.z+depth]].map(([xx,zz])=>[x+xx*cs+zz*sn,z-xx*sn+zz*cs]);const ab=new T.Box3();for(const q of approach)ab.expandByPoint(new T.Vector3(q[0],max,q[1]));if(footprintHits(approach)||reservedHit(approach,ab)||placed.some(b=>overlapPolys(approach,b.fp)))return policyReject('working-side-blocked');}
 const ruleAudit=rule?{profile:rule.profile||'workstation',label:rule.label,zone:context.zone,wallGap:context.wallGap,entryDistance:context.entryDistance,support:rule.support,frontClearance:rule.frontClearance||0,orientation:angle,scale:context.scale,componentsSupported:info?.componentIds?.length>1?'worktop at 0.78m':null}:null;
 if(rule){policyCounts.set(owner+':'+policyKey,context.count+1);policyAccepted.push({assetId:policyKey,owner,x,z});if(approach)policyApproaches.push(approach);}
 addLines(obj);root.add(obj);pb.fp=fp;pb.role="prop";pb.owner=owner;placed.push(pb);footprints.push(fp);report.placements.push({id,name:obj.name,x,y:obj.position.y,z,angle,owner,role,lift,footprint:fp,bottom:fittedBox.min.y,height:fittedBox.max.y-fittedBox.min.y,groundFit,ruleAudit,roadview50:obj.userData.roadview50||null});return true;}
 // Attach belongings to a meaningful location, not to every evenly spaced empty slot.
 function anchor(s,u,v,ids,lift,role){const f=s.frontage;if(!f)return;for(const id of ids){const local=template(id).b,offset=v===null?-local.min.z+.13:v;const old=report.placements.length;tryPlace(id,f.a[0]+f.ux*u+f.nx*offset,f.a[1]+f.uz*u+f.nz*offset,f.angle,lift,s.seed,role);if(report.placements.length>old)return true}return false}
 // Context anchors get first choice before decorative yard infill.
 function canAccess(fp,walking=false){const b=new T.Box3();for(const p of fp)b.expandByPoint(new T.Vector3(p[0],elevation(...p),p[1]));return !footprintHits(fp)&&!reservedHit(fp,b)&&!placed.some(q=>!(walking&&q.parcelWall&&q.max.y-q.min.y<.45)&&overlapPolys(fp,q.fp));}
 report.streetLife=populateStreetLife({specs:polys.filter(p=>eligible(p.seed)),walls:parcel.segments,roadInfo,elevation,template,place:tryPlace,placements:report.placements,canAccess});
 for(const s of architecture.records.filter(s=>s.car)){const x=s.origin[0]+s.ux*s.car.x+s.nx*s.car.z,z=s.origin[1]+s.uz*s.car.x+s.nz*s.car.z;report.streetLife.groups.push({kind:'parking',owner:s.owner,x,z,nx:s.nx,nz:s.nz,ids:[Math.abs(s.owner)%7===0?173:Math.abs(s.owner)%2?211:212],count:1,reason:s.reason+' · 차량 진입부와 현관 동선 확보',covered:s.roofKind!=='none'});}
 report.streetLife.counts.parking=report.streetLife.groups.filter(g=>g.kind==='parking').length;
 for(const s of polys){if(!eligible(s.seed)||!s.frontage)continue;for(const id of[160,186])for(const du of[-1.8,1.8,-2.5,2.5,-3.2,3.2]){if(anchor(s,s.frontage.entry+du,null,[id],0,'entry-storage'))break;}}



 // Fit related activity clusters into each house's own polygon. Large anchors first.
 const ownerCounts=new Map();
 function assetLimit(id){if([154,181,182,157,158,159,161,166,167,169,175,178,179,187,188,189,190,191,192,193,194,206].includes(id))return 1;if([173,174,171,172,156,160,162,163,164,165,186].includes(id))return 2;if([155,196,197,200,116,117,124,125].includes(id))return 12;return 4;}
 const before=report.placements.length;report.neighborhood={programs:{},clusters:[],newAssetTypes:[],emptyYards:[],occupiedYards:0};
 function fit(y,id,a,dx=0,dz=0,lift=0,role='cluster'){if(contextOnly.has(id))return false;const key=y.owner+':'+id;if((ownerCounts.get(key)||0)>=assetLimit(id))return false;const cs=Math.cos(a.angle),sn=Math.sin(a.angle),x=a.x+dx*cs+dz*sn,z=a.z-dx*sn+dz*cs,b=template(id).b;
 const fp=[[b.min.x-.12,b.min.z-.12],[b.max.x+.12,b.min.z-.12],[b.max.x+.12,b.max.z+.12],[b.min.x-.12,b.max.z+.12]].map(([xx,zz])=>[x+xx*cs+zz*sn,z-xx*sn+zz*cs]);
 if(!fp.every(p=>inYard(y,...p)))return false;for(let i=0;i<4;i++){const p=fp[i],q=fp[(i+1)%4];for(let t=.25;t<1;t+=.25)if(!inYard(y,p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t))return false}
 const ok=tryPlace(id,x,z,a.angle,lift,y.owner,role);if(ok)ownerCounts.set(key,(ownerCounts.get(key)||0)+1);return ok;
 }
 // Reserve a few compact household activity pockets before generic decoration.
 report.livingContext={version:138,targetUniqueAssets:1000,source:'Solmae-ro roadview, observed 2026-10-28; heuristic placement',rules:['open-space-budget','entry-storage','building-side-wet-work','one-functional-fixture','neighbor-variety','narrow-passage'],rejected:policyRejected};report.courtyardPockets=[];
 const repairedOwners=new Set(report.courtyardRepair.bridges.map(r=>r.owner));
 const pocketYards=yards.filter(y=>y.area>=24&&y.area<350&&y.type!=='parking').sort((a,b)=>(Number(repairedOwners.has(b.owner))-Number(repairedOwners.has(a.owner)))||Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
 for(const y of pocketYards.filter(y=>eligible(y.owner))){if(report.courtyardPockets.length>=40)break;if(report.courtyardPockets.some(p=>p.owner===y.owner))continue;
  const occupied=report.placements.filter(p=>p.owner===y.owner&&p.lift<.8);if(occupied.length>=6)continue;
  const entry=entries.find(e=>e.owner===y.owner),spots=edgeCandidates(y).filter(a=>nearestPolicyWall(a.x,a.z,y.owner).distance<1.25);
  spots.sort((a,b)=>entry?Math.hypot(a.x-entry.x,a.z-entry.z)-Math.hypot(b.x-entry.x,b.z-entry.z):0);
  for(const a of spots){if(occupied.some(p=>Math.hypot(p.x-a.x,p.z-a.z)<2.3))continue;
   const nearEntry=entry&&Math.hypot(a.x-entry.x,a.z-entry.z)<4.5,ids=nearEntry?[160,186]:y.type==='garden'?[129,156]:['laundry','rear'].includes(y.type)?[157,188,156,129]:[129,188,156,157];
   let first=null,chosen=a;for(const id of rankPocketAssets(ids,y.owner,a.x,a.z,report.placements)){const wall=nearestPolicyWall(a.x,a.z,y.owner),local=template(id).b,d=(local.max.z-local.min.z)/2+.28,at=wall.point?{x:wall.point[0]+Math.sin(wall.angle)*d,z:wall.point[1]+Math.cos(wall.angle)*d,angle:wall.angle}:a;if(fit(y,id,at,0,0,0,nearEntry?'courtyard-entry-storage':'courtyard-service-corner')){first=report.placements.at(-1);chosen=at;break;}}
   if(!first)continue;const members=[first];
   if(!nearEntry)for(const dx of [1,-1,1.3,-1.3])if(fit(y,first.id===129?129:30,chosen,dx,0,0,'courtyard-companion')){members.push(report.placements.at(-1));break;}
   report.courtyardPockets.push({owner:y.owner,label:nearEntry?'현관 옆 수납 공간':first.id===129?'마당 가장자리 장독':first.id===156?'벽 옆 빨래 건조 공간':'벽 옆 세탁·급수 공간',members:members.map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,z:p.z,angle:p.angle,height:p.height,footprint:p.footprint,groundFit:p.groundFit,triangles:template(p.id).triangles}))});break;
  }
 }
 for(const y of yards.filter(y=>eligible(y.owner)).sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z))){const p=programs[y.type],start=report.placements.length,seed=Math.abs(y.owner),interior=yardCandidates(y),edges=edgeCandidates(y),covered=coverByOwner.get(y.owner)?.structureArea||0,budget=Math.min(16,Math.max(4,Math.round((y.area-covered)/18)));
 report.neighborhood.programs[y.label]=(report.neighborhood.programs[y.label]||0)+1;
 const spots=[];const recipes=p.clusters;
 // Rest furniture is proposed only in spacious garden/rear parcels, away from entry lanes.
 if(['garden','rear'].includes(y.type)&&y.area>=32){for(const a of interior){if(a.clearance<1.8)continue;if(fit(y,178,a,0,0,0,'garden-rest')){spots.push(a);report.neighborhood.clusters.push({owner:y.owner,type:y.type,label:'정원 휴식 공간',x:a.x,z:a.z,anchor:178});break;}}}

 // A main feature creates a silhouette and gives the surrounding smaller items a reason to be here.
 for(let main=0;main<(covered?Number(y.area-covered>100):1);main++){
 const ids=main===0?p.primary:[...p.primary.slice((seed+main)%p.primary.length),...p.primary.slice(0,(seed+main)%p.primary.length)];let placedMain=false;
 for(const id of ids.filter(id=>![181,182].includes(id))){let chosen=null;for(const a of interior){if(spots.some(b=>Math.hypot(a.x-b.x,a.z-b.z)<3))continue;for(const turn of [0,Math.PI/2]){const at={...a,angle:a.angle+turn};if(fit(y,id,at,0,0,0,'district-'+y.type)){chosen=at;break}}if(chosen)break}if(chosen){spots.push(chosen);report.neighborhood.clusters.push({owner:y.owner,type:y.type,label:y.label,x:chosen.x,z:chosen.z,anchor:id});placedMain=true;break}}if(!placedMain)break;
 }
 for(let j=0;j<Math.min(covered?2:4,Math.max(1,Math.ceil((y.area-covered)/60)));j++){const recipe=recipes[(seed+j)%recipes.length];for(const a of [...edges.slice(j*2),...edges.slice(0,j*2),...interior]){
 if(spots.some(b=>Math.hypot(a.x-b.x,a.z-b.z)<1.65))continue;
 const [id,dx,dz]=recipe[0];if(!fit(y,id,a,dx,dz,0,'cluster-'+y.type))continue;spots.push(a);for(const [id,dx,dz] of recipe.slice(1)){for(const k of [1,1.3,1.6])if(fit(y,id,a,dx*k,dz*k,0,'cluster-'+y.type))break;}
 report.neighborhood.clusters.push({owner:y.owner,type:y.type,label:y.label,x:a.x,z:a.z,anchor:id});break;
 }}
 // Boundary belongings form short runs, with different sizes and a common purpose per run.
 for(let i=0;i<edges.length&&report.placements.length-start<Math.min(budget,8);i++){if(['parking','service','narrow'].includes(y.type))break;const a=edges[i],ids=[p.edge[(seed+Math.floor(i/4))%p.edge.length],p.edge[(seed+Math.floor(i/4)+3)%p.edge.length],...[151,198,152,116,117,197].slice(seed%3)];for(const id of ids)if(fit(y,id,a,0,0,0,'edge-'+y.type)){if(i%2===0){fit(y,[116,117,163,29][seed%4],a,1.0,.4,0,'edge-companion');fit(y,197,a,-.5,.5,0,'ground-detail')}break}}
 // Residents are placed on clear lanes by the directional-image pedestrian planner.
 if(report.placements.length>start)report.neighborhood.occupiedYards++;else report.neighborhood.emptyYards.push(y.owner);
 }
 report.neighborhood.newAssetTypes=[...new Set(report.placements.filter(p=>p.id>150).map(p=>p.id))];
 report.architecture={...attachedPlan.qa};
 report.openSpace={coveredArea:parcelData.qa.yardArea,parcelCount:parcelData.yards.length,rectangularFlowerbedModules:0,props:report.placements.length-before};
 report.walkObstacles=placed.filter(b=>!b.parcelWall&&b.max.y-elevation((b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2)>.35&&b.min.y<elevation((b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2)+.65).flatMap(b=>b.fp.map((a,i)=>({a,b:b.fp[(i+1)%b.fp.length],width:.03})));
 report.cameraBlockers=placed.filter(b=>b.max.y-b.min.y>.4).map(b=>[b.min.toArray(),b.max.toArray(),b.role,b.owner]);report.count=report.placements.length;report.boundaryCount=report.compounds.length;report.standaloneWallAssets=report.placements.filter(p=>[1,2,3,4,5,6,51,52,53,54,55,56,57,58,59,60].includes(p.id)).length;report.types=[...new Set(report.placements.map(p=>p.id))];report.footprintOverlap=0;for(const fp of footprints)if(footprintHits(fp))report.footprintOverlap++;
 // Batch drawing by material; editable individual models remain in the library.
 const representativeObjects=[];root.traverse(obj=>{if(obj.userData.vegetationAssetId)representativeObjects.push(obj);});for(const obj of representativeObjects){if(applyRepresentative(obj,obj.userData.vegetationAssetId))addLines(obj);}
 recordMemoScene(root);
 const retained=[];root.traverse(o=>{if(o.userData.memoVehicle)retained.push(o)});for(const o of retained){root.attach(o);root.remove(o);}
 report.vegetationReplacements=extractVegetation(root);report.foliageExtraction=root.userData.foliageExtraction;
 root.updateMatrixWorld(true);const batches=new Map(),discard=new Set(),oldMaterials=new Set();
 root.traverse(o=>{if(!o.isMesh&&!o.isLineSegments)return;const mat=o.material,k=[o.isMesh?(['house-shaped-yard','yard-access-surface'].includes(o.name)?'ground':'surface'):'edge',mat.color.getHex(),mat.side,!!mat.vertexColors,mat.opacity,!!mat.transparent,mat.polygonOffset,mat.polygonOffsetFactor,mat.polygonOffsetUnits,!!o.userData.surfaceOverlay,o.userData.detailKind||''].join(':');if(!batches.has(k))batches.set(k,{material:mat.clone(),line:o.isLineSegments,detailKind:o.userData.detailKind,surfaceOverlay:o.userData.surfaceOverlay,geometries:[]});let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');g.userData.lodMaxLevel=partMaxLOD(o);g.setAttribute('lodMax',new T.Uint8BufferAttribute(new Uint8Array(g.attributes.position.count).fill(g.userData.lodMaxLevel),1));g.clearGroups();batches.get(k).geometries.push(g);discard.add(o.geometry);oldMaterials.add(mat)});
 root.clear();for(const [key,b] of batches){b.geometries.sort((a,c)=>c.userData.lodMaxLevel-a.userData.lodMaxLevel);const lodCounts=[0,1,2].map(level=>b.geometries.reduce((n,g)=>n+(g.userData.lodMaxLevel>=level?g.attributes.position.count:0),0));const geometry=mergeGeometries(b.geometries,false);if(!geometry)throw new Error('Asset batch geometry mismatch: '+key);const obj=b.line?new T.LineSegments(geometry,b.material):new T.Mesh(geometry,b.material);obj.name='alley-batch-'+key;obj.userData.detailKind=b.detailKind;obj.userData.surfaceOverlay=b.surfaceOverlay;obj.userData.lodCounts=lodCounts;obj.userData.faceLineColor=b.line?b.material.color.getHex():undefined;root.add(obj);b.geometries.forEach(g=>g.dispose())}discard.forEach(g=>g.dispose());oldMaterials.forEach(m=>m.dispose());for(const o of retained)root.add(o);report.renderBatches=root.children.length;
 report.roadview50=roadview50Summary(report.placements,{...getPlacementRuleInfo(),accepted:policyAccepted.length,rejected:policyRejected,frontApproaches:policyApproaches.length});root.userData=report;return root;
}
