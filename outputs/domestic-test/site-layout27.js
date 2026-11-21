import {treePlanting,normalizeTreeHeight} from './tree-planting.js';
import {applyNeighborBoundaries,createGapClosures} from './neighbor-boundaries28.js?v=28';
import {createWeatheredGroundMaterial,setGroundWeatherUV,setGroundWeatherEnabled,groundWeatherEnabled,groundWeatherStats} from './ground-weather29.js?v=29b';
import * as T from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createBuildingShellGeometry} from './building-shell.js?v=recess22';
import {FacadeBatch,facadeStyles} from './korean-facades.js';
import {applyWallTexture,wallTextureFor} from './facade-textures.js';
import {createGroundFloors} from './site-layout-models/ground-floor-models.js';
import {createPiloti} from './site-layout-models/piloti-models.js';
import {createInfill} from './site-layout-models/infill-models.js?v=vacant25';
import {roadVehicle} from './memo-scene.js?v=151';
import {createBoundaryDetails} from './site-layout-models/boundary-models.js';
import {createUserRuleModels} from './site-layout-models/user-rule-models.js';
import {createLargeBuildingGround} from './site-layout-models/large-building-ground.js';
import {replaceGroundDetails} from './site-layout-models/ground-floor-fit.js?v=main27';
import {createRoadSurface} from './site-layout-models/road-surface.js';
import {batchFixedWood} from './site-layout-models/wood-batches.js';
import {gardenPlant} from './apartments/garden/garden-vegetation.js';
import {createHybridTrees,loadCanopyTexture} from './hybrid-tree.js';
import {makeLivingAsset} from './apartments/garden/living-models.js';
import {polygons,contains,shapeOf,distanceTo,snapshotHeight,subtractRectangle,drapeGeometry,createSurface} from './site-layout27-geometry.js?v=grounds1';
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:1,side:T.DoubleSide});
const eligible=b=>!b.facility&&!b.apartment&&!b.arterialKiosk&&!b.arterialFacades?.length&&!b.storefronts?.length;
const pointOf=p=>p.point||p.origin||p.center||(p.a&&p.b?[(p.a[0]+p.b[0])/2,(p.a[1]+p.b[1])/2]:null);
const cellsFor=(plans)=>{const cells=new Map();for(const p of plans){const pts=polygons(p.plot).flat(2),xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/10);x<=Math.floor(Math.max(...xs)/10);x++)for(let z=Math.floor(Math.min(...zs)/10);z<=Math.floor(Math.max(...zs)/10);z++){const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(p);}}return (x,z)=>cells.get(Math.floor(x/10)+','+Math.floor(z/10))||[];};
function ownersFor(pkg,specs){const ids=new Set(pkg.scene.plans.map(p=>p.id));return new Set(specs.filter(b=>ids.has(b.seed)&&eligible(b)).map(b=>b.seed));}
export function installRulesTerrain(pkg,specs,ground,root){
 if(pkg.version!==27||pkg.terrain)return;
 const owners=ownersFor(pkg,specs),plans=pkg.scene.plans.filter(p=>owners.has(p.id)),lookup=cellsFor(plans),original=snapshotHeight(ground),bases=new Map(plans.map(p=>[p.id,original(...p.door)+.02]));
 // A level building floor, then a short graded apron returning to the measured
 // road height. Roads themselves keep the corrected elevations unchanged.
 const height=(x,z)=>{for(const p of lookup(x,z)){if(!contains(p.plot,[x,z]))continue;const d=distanceTo(p.building,[x,z]);if(d<.001)return bases.get(p.id);const y=original(x,z),t=Math.max(0,1-d/2.5),s=t*t*(3-2*t);return y+(bases.get(p.id)-y)*s;}return original(x,z);};
 const terrain=new T.Group();terrain.name='Rules27Terrain';const add=(g,c,y,name='ground',roadClass)=>{const ms=createSurface(g,c?.isMaterial?c:mat(c),height,y);for(const m of ms){m.name=name;m.userData.roadClass=roadClass;m.userData.rules27=true;terrain.add(m);ground.push(m);}return ms;};
 const basePoints=polygons(pkg.boundary.baseGround).flat(2),clip=[Math.min(...basePoints.map(p=>p[0])),Math.min(...basePoints.map(p=>p[1])),Math.max(...basePoints.map(p=>p[0])),Math.max(...basePoints.map(p=>p[1]))];
 root.updateMatrixWorld(true);const prior=ground.slice();for(const m of prior)subtractRectangle(m,clip);
 // Old wear is decorative and must not remain over the replacement pavement.
 root.traverse(m=>{if(m.isMesh&&m.name==='GroundShadowReceiver')subtractRectangle(m,clip);});
 const wear=root.getObjectByName('AlleySurfaceWear');wear?.traverse(m=>{if(m.isMesh)subtractRectangle(m,clip);});
 add(pkg.boundary.terrainBase||pkg.boundary.baseGround,0xc7c7bb,-.15);
 const asphalt=createWeatheredGroundMaterial('asphalt'),concrete=createWeatheredGroundMaterial(),roadMeshes=add(pkg.road.asphaltGeometry,asphalt,0,'road','asphalt');for(const m of roadMeshes)setGroundWeatherUV(m.geometry);const roadHeight=snapshotHeight(roadMeshes,height);
 const tile=document.createElement('canvas');tile.width=tile.height=128;const ctx=tile.getContext('2d');ctx.fillStyle='#858b82';ctx.fillRect(0,0,128,128);for(let y=0;y<128;y+=16)for(let x=-16;x<128;x+=32){ctx.fillStyle=(x+y)%5?'#b7b8ad':'#a5aea2';ctx.fillRect(x+(y%32?16:0)+1,y+1,30,14);}const tex=new T.CanvasTexture(tile);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(.8,.8);tex.colorSpace=T.SRGBColorSpace;
 const paving=new T.MeshStandardMaterial({map:tex,roughness:1,side:T.DoubleSide});
 for(const [kind,g]of Object.entries(pkg.scene.roadSurfaces))if(!['shared','carriageway'].includes(kind)){const ms=add(g,['pedestrian','sidewalk','review'].includes(kind)?paving:concrete,.008,'path',kind==='cement'?'concrete':'pavers');for(const m of ms)if(m.material===concrete)setGroundWeatherUV(m.geometry);}
 for(const m of add(pkg.scene.common,concrete,.02))setGroundWeatherUV(m.geometry);
 root.add(terrain);pkg.terrain={owners,bases,height,roadHeight,original,group:terrain};
}
function shell(parent,g,bottom,top,color,owner,roof=color){for(const r of polygons(g)){const geometry=createBuildingShellGeometry(shapeOf(r),bottom,top,color,roof);if(top-bottom<1){const a=geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,bottom+(a.getY(i)-bottom)*(top-bottom));geometry.computeBoundingSphere();}const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));mesh.userData.windowOwner=owner;mesh.userData.owner=owner;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);}}
export function prepareRulesLayout(pkg,specs,meshes,elevation,radius){
 const owners=ownersFor(pkg,specs),plans=new Map(pkg.scene.plans.filter(p=>owners.has(p.id)).map(p=>[p.id,p])),front=pkg.frontages.buildings,gm=new Map(pkg.boundary.ground.plans.filter(p=>owners.has(p.id)).map(p=>[p.id,p])),large=pkg.boundary.largeBuildings.filter(p=>owners.has(p.owner)),largeMap=new Map(large.map(p=>[p.owner,p])),bases=pkg.terrain?.bases||new Map(),height=pkg.terrain?.height||elevation;
 const group=new T.Group();group.name='RoadviewGroundFloors';const boundary=structuredClone(pkg.boundary);for(const k of ['gates','garages','beds','pots','poles','drains','gaps','ramps','services'])boundary[k]=(boundary[k]||[]).filter(p=>p.owner==null||owners.has(p.owner));boundary.scene={walls:pkg.boundary.ground.walls.filter(p=>owners.has(p.owner))};boundary.poles=[];boundary.poleLinks=[];
 const neighbors=applyNeighborBoundaries(pkg,boundary,owners,new URLSearchParams(location.search).get('neighborWalls')!=='old');
 const sourceSpecs=new Map(specs.map(b=>[b.seed,b]));
 for(const [id,p]of plans){const b=sourceSpecs.get(id),mesh=meshes.find(m=>Number(m.userData.objectid)===id),f=front[id],gf=gm.get(id),base=bases.get(id)??height(...p.door),r=polygons(p.building)[0];if(!r||!mesh)continue;
 const pts=r[0].slice(0,-1),door=p.upperFacadeDoor||p.door;let frontEdge=0,entry=0,best=Infinity;pts.forEach((a,i)=>{const c=pts[(i+1)%pts.length],dx=c[0]-a[0],dz=c[1]-a[1],L=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((door[0]-a[0])*dx+(door[1]-a[1])*dz)/(L*L))),distance=Math.hypot(door[0]-a[0]-dx*t,door[1]-a[1]-dz*t);if(distance<best){best=distance;frontEdge=i;entry=t*L;}});
 const style=facadeStyles[b.styleIndex??f.styleIndex],top=base+p.levels*3;mesh.geometry.dispose();mesh.geometry=createBuildingShellGeometry(shapeOf(r),base+(gf?3:.07),top,style.wall,style.roof);for(const c of [...mesh.children]){c.geometry?.dispose();c.removeFromParent();}mesh.userData.base=base;mesh.userData.rules27=true;
 Object.assign(b,{points:pts,inkObjectId:id,base:base+.07,top,floor:3,levels:p.levels,styleIndex:b.styleIndex??f.styleIndex,wallTexture:f.wallTexture,frontEdge,frontage:{entry},hasEntry:false,groundOpening:p.access!=='unresolved'?[entry-.6,1.2]:undefined,groundOpeningBase:base,groundWallTexture:largeMap.get(id)?.groundTexture,modernGround:largeMap.has(id),continuousParapet:true,openGround:!!gf,sideServices:true,holes:r.length>1,holePoints:r.slice(1).map(h=>h.slice(0,-1)),basementLevels:0});bases.set(id,base);
 if(gf){shell(group,gf.lower,base+.07,base+2.8,style.wall,id);shell(group,p.building,base+2.8,base+3,style.wall,id);const floor=createSurface(p.floorSlab||p.building,mat(0xb2b2a8),()=>base,.07);if(floor.length)group.add(...floor);if(p.levels===1)mesh.visible=false;
 const model=gf.kind.startsWith('piloti')?createPiloti([{...gf,kind:gf.modelKind}]):gf.kind==='large-lobby'?null:createGroundFloors([{...gf,styleIndex:b.styleIndex??f.styleIndex,wallTexture:f.wallTexture}]);if(model){model.position.y=base;group.add(model);}}
 else if(p.access!=='unresolved'){const a=pts[frontEdge],c=pts[(frontEdge+1)%pts.length],L=Math.hypot(c[0]-a[0],c[1]-a[1]),u=[(c[0]-a[0])/L,(c[1]-a[1])/L],area=pts.reduce((s,a,i)=>{const c=pts[(i+1)%pts.length];return s+a[0]*c[1]-c[0]*a[1];},0),n=area>0?[u[1],-u[0]]:[-u[1],u[0]],batch=new FacadeBatch(),o=batch.writer([p.door[0],base+.07,p.door[1]],...u,...n);batch.inkObjectId=id;o.box(0,1.1,.035,1.06,2.2,.07,style.frame);o.box(0,1.1,.075,.92,2.08,.06,0x405c59);group.add(batch.finish());}
 const parapet=pkg.frontages.parapets.find(p=>p.id===id);if(parapet){shell(group,parapet.wall,top,top+.58,style.wall,id);shell(group,parapet.cap,top+.58,top+.645,0xc0beb0,id);}
 }
 // Earlier merged source shells must not reappear over the new plots.
 const merged=pkg.scene.parcelQA?.mergedBuildings||[],removed=new Set(merged.map(m=>typeof m==='number'?m:m.source).filter(id=>!plans.has(id)&&(!sourceSpecs.has(id)||eligible(sourceSpecs.get(id)))));
 for(let i=specs.length-1;i>=0;i--)if(removed.has(specs[i].seed))specs.splice(i,1);for(let i=meshes.length-1;i>=0;i--)if(removed.has(Number(meshes[i].userData.objectid))){meshes[i].removeFromParent();meshes.splice(i,1);}
 const active=p=>[...plans.values()].some(q=>contains(q.plot,p)),within=p=>p&&Math.hypot(...p)<radius+14;
 const vacant=structuredClone(pkg.vacant);const sites=new Map(vacant.sites.map(s=>[s.id,s]));vacant.zones=vacant.zones.filter(z=>within(sites.get(z.site)?.focus||sites.get(z.site)?.center)).map(z=>({...z,focus:sites.get(z.site)?.focus||sites.get(z.site)?.center}));const siteIds=new Set(vacant.zones.map(z=>z.site)),inVacant=p=>vacant.zones.some(z=>contains(z.geometry,p));
 for(const k of ['bays','plants','poles','drains','benches','walls','entries','accessPaths','vehicleApproaches'])vacant[k]=(vacant[k]||[]).filter(p=>siteIds.has(p.site));
 vacant.vehicleApproaches=pkg.vacant.vehicleApproaches.filter(g=>polygons(g).flat(2).some(p=>vacant.zones.some(z=>distanceTo(z.geometry,p)<3)));
 for(const k of ['fences','gates','props','booths','patches'])vacant.siteDetails[k]=(vacant.siteDetails[k]||[]).filter(p=>siteIds.has(p.site));
 const replacesGround=p=>active(p)||inVacant(p);
 const filterPlan=original=>{const copy=structuredClone(original);for(const [key,rows]of Object.entries(copy))if(Array.isArray(rows))copy[key]=rows.filter(p=>{if(!p||typeof p!=='object')return true;if(owners.has(Number(p.owner))||removed.has(Number(p.owner))||p.owners?.some(id=>owners.has(Number(id))))return false;const q=pointOf(p)||(Number.isFinite(p.x)&&Number.isFinite(p.z)?[p.x,p.z]:null);return !q||!replacesGround(q);});return copy;};
 const poles=pkg.boundary.poles.filter(p=>owners.has(p.owner)),poleMap=new Map(poles.map((p,i)=>[pkg.boundary.poles.indexOf(p),i])),poleLinks=pkg.boundary.poleLinks.filter(([a,b])=>poleMap.has(a)&&poleMap.has(b)).map(([a,b])=>[poleMap.get(a),poleMap.get(b)]);
 const data={zones:vacant.zones,walls:boundary.scene.walls.map(w=>({...w,connectedBoundary:true})),gaps:boundary.gaps,bays:[],plants:[],poles,poleLinks,roadBays:[],siteDetails:vacant.siteDetails};
 const qa={version:27,source:'space-first junction26',buildings:owners.size,retainedSpecialBuildings:specs.filter(b=>!owners.has(b.seed)).length,piloti:[...gm.values()].filter(p=>p.kind.startsWith('piloti')).length,groundFloors:gm.size,largeBuildings:large.length,walls:data.walls.length,gates:boundary.gates.length,shutters:boundary.garages.length,basementRamps:boundary.ramps.length,independentLots:vacant.zones.filter(p=>p.kind!=='bay').length,parking:0,plants:0,poles:poles.length,roadSurface:pkg.road.qa,terrain:'corrected terrain; graded parcel aprons; level floors',sources:pkg.sources};
 qa.neighborBoundaries=neighbors?.qa;
 return {version:27,pkg,group,neighbors,inkIds:new Map(meshes.map(m=>[Number(m.userData.objectid),m.id])),owners,plots:plans,bases,height,groundPlans:gm,pilotiPlans:new Map([...gm].filter(([,p])=>p.kind.startsWith('piloti'))),boundary,large,vacant,data,active,replacesGround,filterPlan,qa};
}
// The same tested ground-floor cutter now accepts each owner's absolute floor.
export function finishRulesDetails(layout,details){if(layout?.version!==27)return;const plans=[...layout.groundPlans.values()].map(p=>({...p,base:layout.bases.get(p.id)}));layout.qa.groundCut=replaceGroundDetails(details,plans);replaceGroundDetails(details,layout.boundary.ramps.map(p=>({id:p.owner,base:layout.bases.get(p.owner),kind:'ramp-cut',origin:p.faceOrigin,u:p.u,n:p.n,opening:[p.detailCut[0],p.width,15],detailCut:p.detailCut})));for(const root of [details,layout.group])root.traverse(o=>{const ids=o.geometry?.attributes.inkObjectId;if(ids){for(let i=0;i<ids.count;i++)ids.setX(i,layout.inkIds.get(Math.round(ids.getX(i)))??ids.getX(i));ids.needsUpdate=true;}});}
function batchStatic(root){const bins=new Map();root.updateMatrixWorld(true);const candidates=[];root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.isInstancedMesh||o.userData.windowOwner!=null||o.geometry.userData.windowShell)return;const m=o.material;if(m.transparent)return;const key=[m.type,m.color?.getHex(),m.map?.uuid,m.vertexColors,m.roughness,m.side,o.userData.surfaceOverlay||false].join(':');if(!bins.has(key))bins.set(key,[]);bins.get(key).push(o);});for(const os of bins.values()){if(os.length<2)continue;const geometries=os.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const n of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(n))g.deleteAttribute(n);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;});const combined=mergeGeometries(geometries,false);if(combined){const mesh=new T.Mesh(combined,os[0].material);mesh.userData={...os[0].userData};mesh.castShadow=!mesh.userData.surfaceOverlay;mesh.receiveShadow=true;root.add(mesh);for(const o of os){o.removeFromParent();o.geometry.dispose();}}geometries.forEach(g=>g.dispose());}}
export async function renderRulesLayout(layout){
 const {pkg,group,plots,bases,height,groundPlans,boundary,large,vacant,owners}=layout,front=pkg.frontages.buildings,ground=new T.Group(),objects=new T.Group();group.add(ground,objects);
 const concrete=createWeatheredGroundMaterial(),concreteColors=new Set([0xc7c7bb,0xc9c7ba,0xc8c7bd,0xbabbb1,0xb6b7ae,0xc0c0b5,0xacb0a7,0xa9aaa2]);
 const surface=(g,c,y,parent=ground)=>{const material=concreteColors.has(c)?concrete:mat(c),meshes=createSurface(g,material,height,y);for(const m of meshes)if(material===concrete)setGroundWeatherUV(m.geometry);if(meshes.length)parent.add(...meshes);};
 for(const p of plots.values()){surface(p.paving||p.plot,0xc7c7bb,.035);surface(p.bed,0x697553,.065);if(p.walk)surface(p.walk,0xc9c7ba,.052);}
 const stepPoints=(pkg.scene.stepMarks||[]).flatMap(g=>g.coordinates.slice(1).flatMap((b,i)=>[g.coordinates[i],b].map(p=>[p[0],height(...p)+.025,p[1]]))).flat();if(stepPoints.length){const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(stepPoints,3));objects.add(new T.LineSegments(sg,new T.LineBasicMaterial({color:0x646f69})));}
 const atHeight=(model,h)=>{model.position.y=h;objects.add(model);};
 // Gates are rigid objects; walls are level spans stepped to the terrain.
 const bare=()=>({scene:{walls:[]},gates:[],garages:[],pots:[],drains:[],poles:[],poleLinks:[]});
 for(const key of ['gates','garages','pots','drains'])for(const p of boundary[key]){const d=bare();d[key]=[p];const point=pointOf(p),y=height(...point);atHeight(createBoundaryDetails(d,pkg.frontages),y);}
 for(const s of boundary.services)atHeight(createUserRuleModels({ramps:[],services:[s]}),bases.get(s.owner)||0);
 for(const ramp of boundary.ramps)atHeight(createUserRuleModels({ramps:[ramp],services:[]}),height(...ramp.origin));
 for(const item of large){const y=bases.get(item.owner);atHeight(createLargeBuildingGround([{...item,beds:[],ramp:null}]),y);for(const bed of item.beds){for(const r of polygons(bed.rim)){const g=new T.ExtrudeGeometry(shapeOf(r),{depth:bed.height,bevelEnabled:false});g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+height(p.getX(i),p.getZ(i))+.035);g.computeVertexNormals();objects.add(applyWallTexture(new T.Mesh(g,mat(0xa9aea5)),'white-granite'));}surface(bed.soil,0x817961,bed.height+.04);}}
 for(const bed of boundary.beds)if(bed.height>.1&&!large.some(l=>l.owner===bed.owner)){for(const r of polygons(bed.geometry)){const g=new T.ExtrudeGeometry(shapeOf(r),{depth:bed.height-.035,bevelEnabled:false});g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+height(p.getX(i),p.getZ(i))+.035);objects.add(applyWallTexture(new T.Mesh(g,mat(facadeStyles[front[bed.owner].styleIndex].wall)),wallTextureFor(front[bed.owner])));}surface(bed.geometry,0x79765e,bed.height+.005);}
 if(layout.neighbors?.enabled)objects.add(createGapClosures(layout.neighbors.closures,pkg.frontages,height));
 const bays=[];
 for(const p of plots.values())if(p.parkingPose){const b=p.parkingPose;bays.push({point:b.center,direction:[...b.u,...b.n],occupied:true,owner:p.id});}
 for(const g of groundPlans.values())for(const b of g.bays)bays.push({point:b.point,direction:[...b.u,...b.n],occupied:true,owner:g.id,piloti:g.kind.startsWith('piloti'),floorElevation:bases.get(g.id)});
 for(const b of pkg.road.parking)if(Math.hypot(...b.center)<165)bays.push({point:b.center,direction:[-b.u[1],b.u[0],...b.u],occupied:b.occupied,road:true,length:b.length});
 const walls=boundary.scene.walls.map(w=>({...w,styleIndex:front[w.owner].styleIndex,wallTexture:front[w.owner].wallTexture,maxHeight:w.height,rail:w.kind==='rail',railHeight:.85}));
 const d={...vacant,walls:[...walls,...vacant.walls],zones:vacant.zones,bays:[...bays,...vacant.bays],plants:[],poles:[],poleLinks:[],gaps:[],yellowLines:[],roadBays:[],drains:[]};
 const infill=await createInfill(d,surface,{elevation:height,skipFoliage:true,carFactory:(i,b)=>{for(let j=0;j<31;j++){const car=roadVehicle(false,i+j),dims=car?.userData.dimensions;if(car&&dims[0]<2.1&&dims[2]<(b.length||5.1))return car;}return null;}});objects.add(infill.objects);ground.add(infill.ground);layout.qa.omittedUnevenParkingCars=0;for(const o of [...infill.objects.children])if(o.userData.groundFit?.maxGap>.04){o.removeFromParent();layout.qa.omittedUnevenParkingCars++;}
 for(const b of vacant.benches){const bench=makeLivingAsset('bench');bench.position.set(b.point[0],height(...b.point)+.12,b.point[1]);bench.rotation.y=b.angle;objects.add(bench);}
 const road=createRoadSurface(pkg.road);road.traverse(o=>{if(!o.isMesh)return;const old=o.geometry;o.geometry=drapeGeometry(old,pkg.terrain?.roadHeight||height,.5);old.dispose();o.userData.surfaceOverlay=true;o.userData.surfaceOccluder=true;o.userData.noInk=true;});objects.add(road);
 layout.qa.vehicleContacts=infill.objects.children.filter(o=>o.userData.groundFit).map(o=>o.userData.groundFit);layout.qa.parking=d.bays.length;layout.data.bays=d.bays;layout.data.roadBays=d.bays.filter(b=>b.road);layout.data.walls=d.walls;
 // Batch only fixed architecture before adding vehicles/foliage. Vehicles are
 // left intact so tyre contact and export metadata stay available.
 const cars=infill.objects.children.filter(o=>o.userData.groundFit);cars.forEach(o=>o.removeFromParent());batchStatic(objects);batchStatic(ground);if(cars.length)objects.add(...cars);
 layout.qa.groundWeather=groundWeatherStats();
 const plants=[...pkg.boundary.ground.plants.filter(p=>owners.has(p.owner)),...vacant.plants];
 const plans=plants.map((p,i)=>gardenPlant({id:'main27-'+i,root:[p.point[0],height(...p.point)+(p.base??.07),p.point[1]],height:p.height,radius:p.radius,count:p.count??28,variant:i%6,...(p.kind==='tree'?treePlanting({id:'main27-'+i,use:'yard',species:p.species,radius:p.radius}):{})}));
 for(let i=0;i<plans.length;i++)if(plants[i].kind==='tree')plans[i]=normalizeTreeHeight(plans[i],plans[i].height,true);
 const treeTextures=new Map(await Promise.all([...new Set(plans.map(p=>p.species))].map(async id=>[id,await loadCanopyTexture(id)])));
 const foliage=createHybridTrees(plans,treeTextures);layout.qa.treeProfiles=plans.filter((p,i)=>plants[i].kind==='tree').map(p=>({id:p.id,species:p.species,height:p.height,radius:p.radius}));objects.add(foliage.group);layout.qa.woodBatch=batchFixedWood(foliage);layout.qa.plants=plants.length;layout.data.plants=plants;foliage.sunShadows.set({azimuth:38.66,renderElevation:54.57,castsSunShadow:true},true);group.userData.layout=layout.qa;
 return {group,ground,objects,foliage,update:camera=>foliage.update(camera)};
}
export function installRulesTour(layout,{camera,controls,requestRender}){
 document.getElementById('siteLayoutTour')?.remove();const section=document.createElement('section');section.id='siteLayoutTour';section.style.cssText='padding:12px;border:1px solid #b3c7c8;border-radius:10px;margin:12px 0;font-size:13px';
 const title=document.createElement('b');title.textContent='테스트 규칙 적용';const note=document.createElement('p');note.textContent=`건물 ${layout.qa.buildings}동 · 담장 ${layout.qa.walls}구간 · 주차 ${layout.qa.parking}칸`;
 const sel=document.createElement('select');sel.setAttribute('aria-label','적용 결과 위치');sel.append(new Option('확인할 장소 선택',''));const targets=[];
 function add(label,p,eye,dy=8){targets.push({p,eye,dy});sel.append(new Option(label,String(targets.length-1)));}
 for(const item of layout.large){const a=item.entrance.origin,n=item.entrance.n,u=item.entrance.u;add('큰 건물 '+item.owner,a,[a[0]-n[0]*12+u[0]*2,a[1]-n[1]*12+u[1]*2],10);if(item.ramp){const r=item.ramp,p=[r.origin[0]+r.u[0]*r.width/2,r.origin[1]+r.u[1]*r.width/2];add('지하주차장 '+item.owner,p,[p[0]-r.n[0]*8,p[1]-r.n[1]*8],3.4);}}
 for(const kind of ['yard','privacy','piloti','close']){const p=[...layout.plots.values()].filter(p=>p.bundle===kind&&(kind!=='yard'||layout.boundary.gates.some(g=>g.owner===p.id))).sort((a,b)=>Math.hypot(...a.door)-Math.hypot(...b.door))[0];if(p){const d=[p.roadPoint[0]-p.door[0],p.roadPoint[1]-p.door[1]],l=Math.hypot(...d)||1;add(({yard:'담장·마당',privacy:'보행길 담장',piloti:'필로티',close:'상가 1층'})[kind],p.door,[p.door[0]+d[0]/l*10,p.door[1]+d[1]/l*10],8);}}
 for(const g of [...layout.groundPlans.values()].filter(p=>p.kind.startsWith('piloti')).slice(0,2))add('필로티 '+g.id,g.focus,[g.focus[0]-g.n[0]*8,g.focus[1]-g.n[1]*8],3);
 for(const e of layout.pkg.road.edgeExamples.slice(0,4)){const p=e.point||e.focus||e.center;if(p)add('도로 모서리 '+(targets.length+1),p,[p[0]+12,p[1]+12],18);}
 for(const z of layout.data.zones.filter(z=>z.focus)){add(({parking:'주차장',active:'공사장',abandoned:'방치 공사장',wild:'녹지',garden:'정원'})[z.kind]||z.kind,z.focus,[z.focus[0]+15,z.focus[1]+15],42);}
 sel.onchange=()=>{const t=targets[Number(sel.value)];if(!t||!sel.value)return;const y=layout.height(...t.p);camera.position.set(t.eye[0],layout.height(...t.eye)+t.dy,t.eye[1]);controls.target.set(t.p[0],y+1.5,t.p[1]);controls.update();requestRender();};section.append(title,note,sel);document.getElementById('environmentControls').prepend(section);
 const requested=new URLSearchParams(location.search).get('ruleView');if(requested!=null&&targets[Number(requested)]){sel.value=requested;sel.onchange();}
 const wearLabel=document.createElement('label'),wearInput=document.createElement('input');wearInput.type='checkbox';wearInput.checked=groundWeatherEnabled();wearLabel.style.cssText='display:block;margin-top:10px';wearLabel.append(wearInput,' 바닥 균열·얼룩');wearInput.onchange=()=>{setGroundWeatherEnabled(wearInput.checked);section.dataset.groundWear=String(wearInput.checked);requestRender();};section.append(wearLabel);
 if(layout.neighbors){
  const ns=document.createElement('select');ns.setAttribute('aria-label','집 사이 담장 보기');ns.style.cssText='display:block;margin-top:8px;width:100%';ns.append(new Option('집 사이 담장 보기',''));
  const labels={'metal-door':'철문','iron-fence':'철창','low-wall':'낮은 담','open-parking':'주차장 사이 담','kept-passage':'통로 유지','open-access':'가운데 담'};
  const pairs=layout.neighbors.pairs.filter(p=>p.separator||p.closure).sort((a,b)=>Math.hypot(...a.front)-Math.hypot(...b.front));
  for(const p of pairs)ns.append(new Option(`${labels[p.treatment]} · ${p.owners.join(' / ')}`,p.id));
  const look=document.createElement('button');look.type='button';look.textContent='위에서 보기';look.style.marginTop='6px';let overhead=false;
  ns.onchange=()=>{const p=pairs.find(p=>p.id===ns.value);if(!p)return;const dx=p.back[0]-p.front[0],dz=p.back[1]-p.front[1],L=Math.hypot(dx,dz)||1,u=[dx/L,dz/L],q=p.front,eye=[q[0]-u[0]*5,q[1]-u[1]*5];camera.position.set(eye[0],layout.height(...q)+(overhead?10:2.8),eye[1]);controls.target.set(q[0]+u[0]*1.2,layout.height(...q)+.9,q[1]+u[1]*1.2);controls.update();requestRender();section.dataset.neighborPair=p.id;};
  look.onclick=()=>{overhead=!overhead;look.textContent=overhead?'길에서 보기':'위에서 보기';ns.onchange();};
  const old=document.createElement('a'),url=new URL(location.href);url.searchParams.set('neighborWalls',layout.neighbors.enabled?'old':'new');old.href=url;old.textContent=layout.neighbors.enabled?'수정 전 비교':'수정 후 보기';old.style.marginLeft='10px';old.onclick=()=>{const u=new URL(old.href);if(ns.value)u.searchParams.set('neighborPair',ns.value);old.href=u;};
  const floorLook=document.createElement('button');floorLook.textContent='바닥 가까이';floorLook.type='button';floorLook.style.marginLeft='6px';floorLook.onclick=()=>{const p=pairs.find(p=>p.id===ns.value)||pairs[0];if(!p)return;const L=Math.hypot(p.back[0]-p.front[0],p.back[1]-p.front[1]),u=[(p.back[0]-p.front[0])/L,(p.back[1]-p.front[1])/L],q=p.front,eye=[q[0]-u[0]*4,q[1]-u[1]*4];camera.position.set(eye[0],layout.height(...q)+3.8,eye[1]);controls.target.set(q[0]+u[0]*.4,layout.height(...q)+.05,q[1]+u[1]*.4);controls.update();requestRender();};
  section.append(ns,look,floorLook,old);const query=new URLSearchParams(location.search),pair=query.get('neighborPair');if(pairs.some(p=>p.id===pair)){overhead=query.get('neighborHeight')==='10';look.textContent=overhead?'길에서 보기':'위에서 보기';ns.value=pair;ns.onchange();if(query.get('groundView')==='close')floorLook.onclick();}
 }
}
