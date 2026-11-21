import {prepareShopInteriors,applyInteriorStyle} from './shops/interiors.js?v=interiors3';
import {prepareBuildingIdentity} from './building-remakes/identity.js?v=replacements3';
import {approvedBuildingId,approvedBuildingProfiles} from './building-remakes/models.js?v=replacements3';
import {rebaseArterialHeights,rebaseMountedLights} from './terrain-fit.js?v=height-audit2';
import {readPalette,readEdits,chooseBuildingAsset,assetById} from './building-assets/catalog.js?v=scene-edit1';
import {applyAssetToSpec,assetColors} from './building-assets/model.js?v=replacements3';
import {installBuildingEditor,restoreEditCamera} from './building-assets/editor.js?v=road-fit1';
import {configureViewVisibility,viewVisibilityStats} from './view-generation-visibility.js?v=view3c';
import {installRulesTerrain,finishRulesDetails} from './site-layout27.js?v=grounds1';
import {installWindowInspection} from './window-inspection.js?v=recess22';
import {prepareSiteLayout,renderSiteLayout,installSiteLayoutTour,siteUtilityPlan,fitSiteLayoutTerrain} from './site-layout.js?v=grounds1';
let siteLayoutData=null,siteLayout=null,siteLayoutView=null;
import {createNeighborhoodApartmentGrounds,planApartmentAmenities,installApartmentGroundControls} from './apartments/neighborhood-grounds.js';
let apartmentGrounds=null;
import {setupCameraNavigation} from './camera-navigation.js?v=road-fit1';
import {planApartmentGrounds,chooseApartment} from './apartments/models.js';
import {planFacilities} from './facilities/placement.js';
import {gentleTerrainCorrection} from './gentle-terrain30.js?v=ground-clearance1';
import {routeCorrection,deformTerrain} from './route-elevation.js?v=151';
import {selectedRadius,withinScope,fullyInScope,scopePlan,scopeUtilities,scopeArterial,cropTerrain} from './scene-budget.js?v=151';
import {applyGroundCharacter,setGroundCharacter} from './ground-character.js?v=151';
import {loadMemoScene,installMemoTour} from './memo-scene.js?v=151';
import {loadRepresentatives,representativeAudit,installRepresentativeControls} from './representative-assets.js?v=151';
import {installAssetInspection,collectShopPlants} from './asset-inspection.js?v=151';
import {loadRoadview50,installRoadview50Controls} from './roadview50-loader.js?v=151';
import {arterialShopInputs} from './shops/arterial-catalog.js?v=151';
import {createArterial,applyArterialTerrain,inArterial} from './arterial.js?v=151';
let arterialPlan=null,arterial=null;
import {readLocation,dataUrl,rememberLocation,setupLocationSearch} from './location-loader.js?v=replacements3';
import {planNeighborhoodShops,reserveShopApproaches} from './shops/neighborhood-plan.js?v=interiors3';
import {createNeighborhoodShops} from './shops/neighborhood-shops.js?v=interiors3';
import {loadData} from './load-data.js?v=151';
import {applyRoadContext} from './road-context.js?v=grounds1';
import {createIllustrationRenderer} from './illustration-renderer.js?v=slope3';
import {createIllustrationShading} from './illustration-shading.js?v=151';
import {DEFAULT_APPEARANCE,loadAppearance,saveAppearance} from './illustration-settings.js?v=compact1';
import {setupNumberScrub,setupSettingsDialog} from './ui-controls.js?v=151';
import {createPrecipitation} from './precipitation.js?v=151';
import {createContactSurfaceSampler} from './contact-shadows.js?v=151';
import {createBillboardLightField} from './billboard-lighting.js?v=151';
import {createAtmosphere} from './atmosphere.js?v=windows-grounds1';
import {createStreetlights} from './streetlights.js?v=scene-edit1';
import {environmentProfile,windowIsLit,bearingVector,SOLAR_CONTEXT} from './environment-policy.js?v=151';
import {loadVegetationAssets} from './vegetation.js?v=view3c';
import {createNeighborhoodVegetation} from './neighborhood-canopies.js?v=view3c';
import {loadSpeciesTextures} from './hybrid-tree.js?v=view3c';
let canopyTexture=null,finishedGround=null;
let shops=null,shopCatalog=null,shopPlaces=null,shopPlan=null;
import {createBuildingShellGeometry} from './building-shell.js?v=recess22';
import {createVisibilityOptimizer} from './visibility.js?v=151';
import {createPedestrians,loadPedestrianAssets} from './pedestrians.js?v=umbrella1';
import {PEOPLE_SEASON_NAMES} from './pedestrian-seasons.js?v=elevated2';
import {createPedestrianVariantLoader,peopleActionForWeather} from './pedestrian-actions.js?v=umbrella1';
import {createUtilityNetwork} from './utility-network.js?v=155';
import {facadeStyles} from './korean-facades.js?v=masonry19';
import {planFrontages} from './frontage.js?v=151';
import {setupWalk} from './walk.js?v=compact1';
import {decorateAlleys} from './alley-placement.js?v=grounds1';
import {createStreet} from './street.js?v=ribbon2';
import {createDetails} from './details.js?v=replacements3';
import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
let billboardLightField=null,lastBillboardSources='';
let precipitation=null;
let horizonEpoch=0;
let atmosphere=null,streetlights=null,environmentData=null,streetlightPlan=null,hour=12,weather='clear',windowPattern=0,automaticWindows=true;
const locationContext=await readLocation().catch(error=>({error,origin:[37.626469,127.015677]}));
const detailRadius=selectedRadius(locationContext);
const streamedPlants=new Set();
let courtyardTour=null;
let viewStreamer=null,streamStats={},lastStreamCheck=-Infinity;
const solarContext={...SOLAR_CONTEXT,latitude:locationContext.origin[0],longitude:locationContext.origin[1]};
const siteData=(name,kind)=>loadData(dataUrl(locationContext,name),kind);
const seasonKey='webtoon-neighborhood-season-v1',seasons=['spring','summer','autumn','winter'];
let season='summer';
try{const saved=localStorage.getItem(seasonKey);if(seasons.includes(saved))season=saved;}catch{}
let utilityGroup=null,utilityPlan=null;
let pedestrianSystem=null,peopleCatalog=null,peoplePlan=null,peopleAssets=null;
let getPeopleSeason=null,peopleSeasonRequest=null;
let vegetationSystem=null,vegetationCatalog=null,vegetationPlan=null,vegetationAssets=null;
let streetGroup=null,alleyGroup=null,parcelData=null,attachedPlan=null,streetscapePlan=null;
let detailGroup=null,renderStyle='color';
let streetLifeRoot=null,benchmarkFrame=0;
let visibility=null,renderRequested=true,lastRender=0,renderCount=0,lastStats=null,benchmarking=false;
const requestRender=()=>{renderRequested=true;};
const $=id=>document.getElementById(id),host=$('view');
$('season').value=season;
setupLocationSearch(locationContext,()=>hour);
host.dataset.location=JSON.stringify(locationContext);

const appearance=loadAppearance();
const illustrationShading=createIllustrationShading();
setupSettingsDialog($('settings'),$('optimizationDialog'),$('closeSettings'));
const setWindowValue=setupNumberScrub($('windowPercent'),()=>{automaticWindows=false;applyEnvironment();});
const scene=new T.Scene();scene.background=null;
const camera=new T.PerspectiveCamera(43,1,.1,3000);camera.position.set(detailRadius*.95,detailRadius*1.05,detailRadius*1.15);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;host.prepend(renderer.domElement);
const illustrationRenderer=createIllustrationRenderer(renderer);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,3,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;
const hemisphere=new T.HemisphereLight(0xffffff,0x617179,2.5);scene.add(hemisphere);const sun=new T.DirectionalLight(0xfff2df,2.5);sun.position.set(-140,220,100);scene.add(sun);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-260,right:260,top:260,bottom:-260,near:1,far:1400});sun.shadow.bias=-.000005;sun.shadow.normalBias=.12;sun.shadow.camera.updateProjectionMatrix();
new ResizeObserver(()=>{let w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();requestRender()}).observe(host);
let walking=null;
let navigation=null;
const lastCamera=new T.Matrix4();let lastProjection='';
controls.addEventListener('change',requestRender);
for(const event of ['click','input','change'])document.addEventListener(event,requestRender);
document.addEventListener('visibilitychange',requestRender);
function renderSettings(){return {enabled:$('optimize').checked,occlusion:$('occlusion').checked,lod:false,lodMode:'0'};}
function drawRawScene(){const previous=atmosphere?.render(renderer,camera);renderer.render(scene,camera);if(previous!==undefined)renderer.autoClear=previous;}
function drawScene(cssScale=renderer.getPixelRatio(),metadataKey=null){illustrationRenderer.render(scene,camera,drawRawScene,appearance,cssScale,metadataKey);}
function renderScene(settings=renderSettings()){
 updateEnvironmentCamera();
 settings={...settings,viewportHeight:host.clientHeight};
 // Bake shadows from the complete scene before temporarily hiding any draw objects.
 // Off-screen buildings must continue to cast their cached shadows into the view.
 if(renderer.shadowMap.needsUpdate){drawRawScene();renderer.shadowMap.needsUpdate=false;}
 const start=performance.now(),stats=visibility?.prepare(camera,settings);
 const cullMs=performance.now()-start;
 try{drawScene(renderer.getPixelRatio(),JSON.stringify([camera.matrixWorld.elements,camera.projectionMatrix.elements,settings,meshes.length,horizonEpoch,viewStreamer?.epoch,streetLifeRoot?.visible,benchmarking?++benchmarkFrame:0]));}finally{visibility?.reset();}
 renderCount++;
 lastStats={...stats,calls:illustrationRenderer.stats.calls,triangles:illustrationRenderer.stats.triangles,lines:illustrationRenderer.stats.lines,illustration:{...illustrationRenderer.stats},cullMs:+cullMs.toFixed(2),renderCount};
 const e=$('perfStats');e.dataset.stats=JSON.stringify(lastStats);
 $('lodStats').textContent=stats?.lodEnabled?`상세 ${stats.lodLevels[0]} · 중간 ${stats.lodLevels[1]} · 간략 ${stats.lodLevels[2]}구역 / 삼각형 ${Math.round(stats.lodSavedTriangles).toLocaleString()}개 생략`:'선택 범위 전체 · 원본 상세도';
 e.textContent=`그리기 ${lastStats.calls.toLocaleString()}회 · 삼각형 ${lastStats.triangles.toLocaleString()}개`;
 $('cullStats').textContent=settings.enabled?`화면 밖 ${stats?.screenCulled??0} · 건물 뒤 ${stats?.occluded??0} 구역/건물 제외`:'비교용: 기존 방식으로 그리는 중';
}
renderer.setAnimationLoop(now=>{
 if(document.hidden||benchmarking)return;
 walking?.update(now);navigation?.update(now);if(!walking?.isActive())controls.update();
 camera.updateMatrixWorld();const projection=camera.projectionMatrix.elements.join(',');
 if(!lastCamera.equals(camera.matrixWorld)||projection!==lastProjection){renderRequested=true;lastCamera.copy(camera.matrixWorld);lastProjection=projection;}
 const weatherChanged=precipitation?.update(now,$('weatherMotion').checked,host.clientHeight);
 if(weatherChanged&&now-lastRender>=1000/24)renderRequested=true;
 if(loaded&&viewStreamer&&now-lastStreamCheck>80){lastStreamCheck=now;streamStats=viewStreamer.update(now);host.dataset.streaming=JSON.stringify(streamStats);}
 if(!renderRequested){if(now-lastRender>220&&$('renderState').textContent!=='정지 화면 · 재그리기 대기')$('renderState').textContent='정지 화면 · 재그리기 대기';return;}
 pedestrianSystem?.update(camera);vegetationSystem?.update(camera);siteLayoutView?.update(camera);apartmentGrounds?.foliage.update(camera);for(const plants of streamedPlants)plants.update(camera);if(pedestrianSystem)illustrationShading.install(pedestrianSystem.group);renderScene();lastRender=now;renderRequested=false;$('renderState').textContent='화면 갱신 중';
});
const ray=new T.Raycaster(),mouse=new T.Vector2();let data,oldRoot,ground=[],oldBuildings=[],props=[],buildingGroup=new T.Group(),meshes=[],targetMesh,loaded=false;buildingGroup.name='DomesticBuildings';scene.add(buildingGroup);
const [lat0,lon0]=locationContext.origin;const p=lat0*Math.PI/180,mLat=111132.92-559.82*Math.cos(2*p)+1.175*Math.cos(4*p)-.0023*Math.cos(6*p),mLon=111412.84*Math.cos(p)-93.5*Math.cos(3*p)+.118*Math.cos(5*p);
function xz(c){return [(c[0]-lon0)*mLon,-(c[1]-lat0)*mLat]}
const terrainCells=new Map();
function indexTerrain(){terrainCells.clear();oldRoot.updateMatrixWorld(true);for(const mesh of ground){const pos=mesh.geometry.attributes.position,ix=mesh.geometry.index;const n=ix?ix.count:pos.count;for(let i=0;i<n;i+=3){const vs=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(pos,ix?ix.getX(i+k):i+k).applyMatrix4(mesh.matrixWorld));const [a,b,c]=vs;const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-8)continue;const edges=[[a,b],[b,c],[c,a]].sort((p,q)=>q[0].distanceToSquared(q[1])-p[0].distanceToSquared(p[1]));const dx=edges[0][1].x-edges[0][0].x,dz=edges[0][1].z-edges[0][0].z,L=Math.hypot(dx,dz)||1;const tri={a,b,c,den,road:mesh.name==='road'||mesh.name==='path',roadClass:mesh.userData.roadClass||'asphalt',ux:dx/L,uz:dz/L};for(let x=Math.floor(Math.min(a.x,b.x,c.x)/5);x<=Math.floor(Math.max(a.x,b.x,c.x)/5);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/5);z<=Math.floor(Math.max(a.z,b.z,c.z)/5);z++){const k=x+','+z;if(!terrainCells.has(k))terrainCells.set(k,[]);terrainCells.get(k).push(tri)}}}}
function elevation(x,z,fallback){let y=-Infinity;for(const {a,b,c,den} of terrainCells.get(Math.floor(x/5)+','+Math.floor(z/5))||[]){const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den,w=1-u-v;if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6)y=Math.max(y,u*a.y+v*b.y+w*c.y)}return Number.isFinite(y)?y:(fallback===undefined?(atmosphere?.heightAt(x,z)??0):fallback)}
function roadInfo(x,z){for(const t of terrainCells.get(Math.floor(x/5)+','+Math.floor(z/5))||[]){if(!t.road)continue;const {a,b,c,den}=t,u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;if(u>=-1e-6&&v>=-1e-6&&1-u-v>=-1e-6)return t}return null}
function showInfo(m){const p=m.userData;$('address').value=`${p.street_name} ${p.house_number}`;}
async function build(){await Promise.all([prepareBuildingIdentity(),prepareShopInteriors()]);const assetPalette=readPalette(),assetEdits=readEdits();configureViewVisibility(locationContext.view,locationContext.viewQA);apartmentGrounds=null;viewStreamer?.dispose();streamedPlants.clear();viewStreamer=null;if(shops){scene.remove(shops.group,shops.lamps);shops.dispose();shops=null;}if(streetlights){scene.remove(streetlights.group);streetlights.dispose();streetlights=null;}visibility?.dispose();visibility=null;pedestrianSystem=null;vegetationSystem=null;if(streetGroup){scene.remove(streetGroup);streetGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});streetGroup=null;}if(detailGroup){scene.remove(detailGroup);detailGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});detailGroup=null;}const specs=[];for(const m of meshes){m.geometry.dispose();m.material.dispose();for(const c of m.children){c.geometry.dispose();c.material.dispose()}}buildingGroup.clear();meshes=[];targetMesh=null;const floor=3;
for(const f of data.features){const pr=f.properties;const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const rings of polygons){const points=rings[0].slice(0,-1).map(xz);if(points.length<3||(!locationContext.view&&!withinScope(points,detailRadius)))continue;const cx=points.reduce((a,c)=>a+c[0],0)/points.length,cz=points.reduce((a,c)=>a+c[1],0)/points.length;
const shape=new T.Shape(points.map(v=>new T.Vector2(v[0],-v[1])));for(const ring of rings.slice(1)){const path=new T.Path(ring.slice(0,-1).map(c=>{const v=xz(c);return new T.Vector2(v[0],-v[1])}));shape.holes.push(path)}
const base=Math.min(...points.map(v=>elevation(v[0],v[1])),elevation(cx,cz))-.1;const top=elevation(cx,cz)+Math.max(1,pr.gro_flo_co)*floor;
const assetChoice=chooseBuildingAsset(pr,assetPalette,assetEdits),style=assetColors(assetChoice,facadeStyles[pr.streetProfile?.styleIndex??Math.abs(Number(pr.objectid))%6]);
const geo=createBuildingShellGeometry(shape,base,top,style.wall,style.roof);
const roadAddress=locationContext.roadAddress;const isHome=roadAddress&&pr.street_name===roadAddress.road_name&&String(pr.house_number)===[roadAddress.main_building_no,roadAddress.sub_building_no].filter(Boolean).join('-');
const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.9}));mesh.name=`${pr.street_name} ${pr.house_number}`;mesh.userData={...pr,estimatedHeight:pr.gro_flo_co*floor,source:pr.source||locationContext.sources?.buildings||'MOIS / Esri Korea 2026.07',cx,cz,base,buildingAsset:assetChoice?.id};
specs.push({properties:pr,address:`${pr.street_name} ${pr.house_number}`,inkObjectId:mesh.id,points,top,base,floor,levels:Math.max(1,pr.gro_flo_co),seed:Number(pr.objectid),basementLevels:pr.und_flo_co,holes:rings.length>1,holePoints:rings.slice(1).map(r=>r.slice(0,-1).map(xz))});
mesh.add(new T.LineSegments(new T.EdgesGeometry(geo,30),new T.LineBasicMaterial({color:isHome?0x994821:0x426c79,transparent:true,opacity:.55})));buildingGroup.add(mesh);meshes.push(mesh);if(isHome)targetMesh=mesh;if(arterialPlan?.mappedKiosks?.includes(Number(pr.objectid)))mesh.visible=false;
}}
for(const b of specs){b.arterialFacades=(arterialPlan?.commercialFacades||[]).filter(f=>f.owner===b.seed);b.arterialKiosk=arterialPlan?.mappedKiosks?.includes(b.seed);}
planFrontages(specs,roadInfo);
host.dataset.facilityPlan=JSON.stringify(planFacilities(specs,shopPlaces.places,{xz}));
for(const b of specs)if(b.facility?.id==='apartment')b.apartment=chooseApartment(b);
for(const b of specs){const p=b.properties.streetProfile;if(!b.facility||p?.assetId||(assetEdits[String(b.seed)]&&!p?.resetLegacyAsset)||assetPalette.enabled)applyAssetToSpec(b,chooseBuildingAsset(b.properties,assetPalette,assetEdits));const edge=p?.frontStart?b.points.findIndex((a,i)=>{const c=b.points[(i+1)%b.points.length],dist=(x,y)=>Math.hypot(x[0]-y[0],x[1]-y[1]);return Math.min(dist(a,p.frontStart)+dist(c,p.frontEnd),dist(c,p.frontStart)+dist(a,p.frontEnd))<.1;}):p?.frontEdge;if(p&&edge>=0){b.frontEdge=edge;b.frontage=undefined;b.styleIndex=assetById[b.assetChoice]?.styleIndex??p.styleIndex;if(b.facility)b.facility.frontEdge=edge;}}
// Resolve approved colors after automatic facilities and manual asset choices agree.
for(let i=0;i<specs.length;i++){const profile=approvedBuildingProfiles[approvedBuildingId(specs[i])];if(!profile)continue;const geometry=meshes[i].geometry,normal=geometry.attributes.normal,color=geometry.attributes.color,wall=new T.Color(profile.wall),roof=profile.roofColor==null?null:new T.Color(profile.roofColor);for(let j=0;j<normal.count;j++){const paint=normal.getY(j)>.99?roof:wall;if(paint)color.setXYZ(j,paint.r,paint.g,paint.b);}color.needsUpdate=true;}
const shopInputs=arterialShopInputs(shopCatalog,shopPlaces.places,arterialPlan);
shopPlan=planNeighborhoodShops(specs.filter(b=>!b.arterialKiosk),shopInputs.places,shopInputs.catalog,{xz,elevation,roadInfo,arterial:arterialPlan});
for(const p of shopPlan.placements){const r=arterialPlan?.storefrontOverrides?.find(r=>String(r.placeId)===String(p.placeId));if(r&&!p.spec.referenceOnly){p.spec={...p.spec,...structuredClone(r.spec)};p.reference=r.reference;}}
shopPlan.qa.observed=shopPlan.placements.filter(p=>p.reference==='observed-local-frontage').length;shopPlan.qa.inferred=shopPlan.placements.length-shopPlan.qa.observed;
if(siteLayoutData?.version===27){installRulesTerrain(siteLayoutData,specs,ground,oldRoot);indexTerrain();}
siteLayout=prepareSiteLayout(siteLayoutData,specs,meshes,elevation,detailRadius);fitSiteLayoutTerrain(siteLayout,ground);indexTerrain();
const legacyParcels=siteLayout?siteLayout.filterPlan(parcelData):parcelData,legacyAttached=siteLayout?siteLayout.filterPlan(attachedPlan):attachedPlan,legacyStreetscape=siteLayout?siteLayout.filterPlan(streetscapePlan):streetscapePlan;
siteLayoutView=await renderSiteLayout(siteLayout,elevation);
if(siteLayout){host.dataset.siteLayout=JSON.stringify(siteLayout.qa);}
const {architecture:shopArchitecture,context:shopContext}=reserveShopApproaches(shopPlan,legacyAttached,legacyStreetscape);
shops=createNeighborhoodShops(shopPlan,renderer,{elevation});scene.add(shops.group,shops.lamps);
host.dataset.storefrontPlan=JSON.stringify({...shopPlan,placements:shopPlan.placements.map(({spec,...p})=>p)});
$('shopView').replaceChildren(new Option('상가 위치 보기',''),...shopPlan.placements.map(p=>new Option(p.name,String(p.placeId))));
streetGroup=createStreet(specs.filter(b=>!siteLayout?.owners.has(b.seed)),elevation,roadInfo,-1);streetGroup.traverse(o=>{if(o.isMesh&&['street-poles','street-wire','street-car','street-glass','street-rubber','street-lamp','street-paving'].includes(o.name))o.visible=false;if(o.isLineSegments&&!o.name.startsWith('street-yard'))o.visible=false;});utilityPlan=siteUtilityPlan(siteLayout,utilityPlan,elevation);utilityGroup=createUtilityNetwork(utilityPlan,elevation);if(siteLayout)host.dataset.siteLayout=JSON.stringify(siteLayout.qa);utilityGroup.visible=true;streetGroup.add(utilityGroup);scene.add(streetGroup);if(siteLayoutView)streetGroup.add(siteLayoutView.group);streetGroup.visible=true;$('streetStats').textContent=`도로 가장자리 전봇대 ${utilityPlan.qa.poles}개 · 전선 연결 ${utilityPlan.qa.spans}구간 · 건물 인입선 ${utilityPlan.qa.houseDrops}개`;$('yardStats').textContent=`작은 마당 ${streetGroup.userData.yards}곳 · 나무 ${streetGroup.userData.trees}그루 · 화분 ${streetGroup.userData.planters}개 · 벤치 ${streetGroup.userData.benches}개 · 생활 소품 ${Object.values(streetGroup.userData.assets).reduce((a,b)=>a+b,0)}개 (7종)`;streetGroup.traverse(o=>{if(o.name?.startsWith('street-yard'))o.visible=true});detailGroup=createDetails(specs,elevation,shopArchitecture,{trackGroundOwners:siteLayout?.version===27,shells:[buildingGroup,siteLayout?.group],auditWindows:new URLSearchParams(location.search).has('windowAudit'),recessedWindows:new URLSearchParams(location.search).get('windows')!=='flat'});finishRulesDetails(siteLayout,detailGroup);if(siteLayout)host.dataset.siteLayout=JSON.stringify(siteLayout.qa);host.dataset.windowRecess=JSON.stringify(detailGroup.userData.recessQA);shops.cutShells([buildingGroup,siteLayout?.group]);scene.add(detailGroup);host.dataset.gasNetworks=JSON.stringify(detailGroup.userData.gasNetworks);alleyGroup=decorateAlleys(specs.filter(b=>!siteLayout?.owners.has(b.seed)),elevation,roadInfo,[detailGroup,shops.group,...props.filter(o=>o.visible),utilityGroup,...(siteLayoutView?[siteLayoutView.group]:[])],legacyParcels,shopArchitecture,shopContext,arterialPlan);streetGroup.add(alleyGroup);const apartmentObstacles=[...shopArchitecture.structures,...alleyGroup.userData.placements.filter(p=>p.footprint)];const apartmentGroundPlan=planApartmentAmenities(planApartmentGrounds(specs,{elevation,roadInfo,obstacles:apartmentObstacles}),specs,{elevation,roadInfo,obstacles:apartmentObstacles});apartmentGrounds=createNeighborhoodApartmentGrounds(apartmentGroundPlan,canopyTexture);streetGroup.add(apartmentGrounds.group);host.dataset.apartments=JSON.stringify({buildings:specs.filter(b=>b.apartment).map(b=>({owner:b.seed,id:b.apartment.id,selection:b.apartment.selection})),grounds:apartmentGroundPlan,planting:apartmentGrounds.group.userData});arterial?.dispose();arterial=arterialPlan?createArterial(arterialPlan,elevation):null;if(arterial){streetGroup.add(arterial.group);arterial.alignLights(streetlightPlan);host.dataset.terrainFit=JSON.stringify(arterial.group.userData.terrainFit);}host.dataset.groundCharacter=JSON.stringify(applyGroundCharacter({alleyGroup,oldRoot,plan:streetscapePlan,elevation}));const contactElevation=createContactSurfaceSampler([alleyGroup],elevation);finishedGround=contactElevation;utilityGroup.fitGroundSurface(contactElevation);vegetationSystem=createNeighborhoodVegetation([...vegetationPlan.trees.filter(p=>!siteLayout?.replacesGround([p.root[0],p.root[2]])),...(locationContext.id==='original'?[{id:'roadview-shop-planter-yoon',asset:'leafy-herb',kind:'plant',root:[56.22526249560905,-7.545927115313211,44.785980047154574],height:.22,radius:.15,source:'roadview-shop'}]:[]),...collectShopPlants(shops.group),...alleyGroup.userData.vegetationReplacements.filter(p=>!siteLayout?.replacesGround([p.root[0],p.root[2]])&&!inArterial(arterialPlan,p.root[0],p.root[2],.8))],vegetationAssets,elevation,contactElevation,canopyTexture,specs,shopArchitecture.structures);streetGroup.add(vegetationSystem.group);vegetationSystem.setLegacyVisible(true);vegetationSystem.group.visible=true;$('vegetationStats').textContent=`나무 ${vegetationSystem.group.userData.trees}그루 · 식물 잎 군집 ${vegetationSystem.group.userData.plants}개 · 나무 10종 · 전체 새 나무 적용`;$('vegetationStats').dataset.replacement=JSON.stringify(vegetationSystem.group.userData.replacement);$('vegetationStats').dataset.plantFoliage=JSON.stringify(vegetationSystem.group.userData.plantFoliage);$('vegetationStats').dataset.canopies=JSON.stringify(vegetationSystem.group.userData.canopyPlans);alleyGroup.userData.vegetation={...vegetationSystem.group.userData,placementQA:vegetationPlan.qa};pedestrianSystem=createPedestrians(peoplePlan,peopleAssets,elevation,contactElevation);streetGroup.add(pedestrianSystem.group);pedestrianSystem.group.visible=true;alleyGroup.userData.pedestrians={...peoplePlan,source:'image_gen',catalog:'people/catalog.json'};updatePeopleSeasonStats() ;alleyGroup.visible=true;host.dataset.boundaryFit=JSON.stringify(alleyGroup.userData.streetscape.boundaryFit);host.dataset.groundContacts=JSON.stringify(alleyGroup.userData.placements.filter(p=>p.groundFit).map(p=>({id:p.id,...p.groundFit})));$('yardStats').textContent=`주차·생활 공간 ${alleyGroup.userData.architecture.structures}곳 · 차양·창고 지붕 ${alleyGroup.userData.architecture.roofedStructures}곳 · ${alleyGroup.userData.architecture.houses}개 건물 · 지붕 아래 ${Math.round(alleyGroup.userData.architecture.roofArea).toLocaleString()}㎡ · 생활 소품 ${alleyGroup.userData.count}개 · ${alleyGroup.userData.types.length}종 · 한국형 대문 ${alleyGroup.userData.streetscape.gates}곳 · 건물 평면 겹침 검사 ${alleyGroup.userData.footprintOverlap}건` ;const life=alleyGroup.userData.streetLife.counts;$('yardStats').textContent+=` · 벽면 설비 ${life.equipment}곳 · 자전거 ${life.bicycle}곳 · 소규모 배출 ${life.collection}곳 · 주차 ${life.parking}곳`;const {facadeSpots,placementProxies,windowOpenings,...facadeReport}=detailGroup.userData;alleyGroup.userData.facade=facadeReport;alleyGroup.userData.utilities={...utilityPlan.qa,poles:utilityPlan.poles,spans:utilityPlan.spans};detailGroup.visible=true;$('detailStats').textContent=`창 ${detailGroup.userData.windows.toLocaleString()}개 · 출입구 ${detailGroup.userData.doors}개 · 지붕/옥탑 ${detailGroup.userData.roofs}개 · 옥탑 디자인 8종 · 한국 주택 외관 6종 · 샷시/방범창 10종`;$('detailStats').dataset.rooftops=JSON.stringify({count:detailGroup.userData.roofs,types:detailGroup.userData.rooftopTypes,headings:detailGroup.userData.rooftopPlans.map(p=>Math.round(Math.atan2(p.doorNormal[0],-p.doorNormal[1])*180/Math.PI+360)%360)});scene.traverse(o=>{if(o.isMesh){if(o.userData.isVegetationSunCaster){o.castShadow=true;o.receiveShadow=false;return;}if(o.userData.environmentOwned||o.userData.isPedestrianBillboard||o.userData.isBillboardShadow||o.userData.isPedestrianShadow||o.userData.isVegetationBillboard){o.castShadow=false;o.receiveShadow=false;return;}o.receiveShadow=true;o.castShadow=!o.userData.surfaceOverlay&&!o.name.startsWith('alley-batch-ground')&&!['ground','road','path','house-shaped-yard','yard-access-surface'].includes(o.name)}});renderer.shadowMap.needsUpdate=true;visibility=createVisibilityOptimizer({scene,roots:[detailGroup,alleyGroup,utilityGroup,shops.group,arterial?.group,oldRoot.getObjectByName('AlleySurfaceWear')].filter(Boolean),buildings:meshes,shapes:specs});lastBillboardSources='';streetlights=createStreetlights(streetlightPlan,elevation,roadInfo,renderer,detailGroup.userData.nightWindowSources,contactElevation);scene.add(streetlights.group);host.dataset.supportFit=JSON.stringify({version:82,structures:alleyGroup.userData.attachedSupportFit,utilities:utilityGroup.userData.supportFit,lights:streetlights.group.userData.supportFit,people:pedestrianSystem.group.userData.groundFit,trees:vegetationSystem.group.userData.supportFit});billboardLightField=createBillboardLightField({plan:streetlights.plan,windows:detailGroup.userData.nightWindowSources,shops:shops.sources,buildings:specs,streetscape:shopContext,structures:shopArchitecture,elevation});precipitation=createPrecipitation(specs,elevation,alleyGroup.userData.attachedStructures);scene.add(precipitation.group);host.dataset.buildingAssets=JSON.stringify(specs.map(b=>({owner:b.seed,asset:b.assetChoice,style:b.styleIndex})));host.dataset.detailMode="full";host.dataset.streaming="disabled";applyStyle(renderStyle);requestRender();if(targetMesh)showInfo(targetMesh)}
try{if(locationContext.error)throw locationContext.error;const [g,d,pd,ap,sp,up,pc,pp,vc,vp,ed,sl,rc,sc,spl,ar]=await Promise.all([siteData('./corrected-base.glb?v=61','glb').then(bytes=>new GLTFLoader().parseAsync(bytes,new URL('./',location.href).href)),siteData('./buildings.geojson'),siteData('./parcels.json?v=17'),siteData('./attached-structures.json?v=23.3'),siteData('./streetscape-context.json?v=62'),siteData('./utilities.json?v=23.3'),loadData('./people/catalog.json?v=publicwebp1'),siteData('./people/placements.json?v=27.1'),loadData('./vegetation/catalog.json?v=31'),siteData('./vegetation/placements.json?v=31'),(locationContext.id==='original'&&new URLSearchParams(location.search).get('terrain')!=='measured'?loadData('./environment/terrain-mountains30.json?v=30'):siteData('./environment/terrain.json?v=146')),siteData('./environment/streetlights.json?v=32'),siteData('./road-context.json?v=62'),loadData('./shops/library/catalog.json?v=70'),siteData('./shops/places.json?v=70'),locationContext.arterial?siteData(locationContext.arterial.plan):Promise.resolve(null)]);arterialPlan=ar;host.dataset.arterial=JSON.stringify(ar?.qa||null);shopCatalog=sc;shopPlaces=spl;environmentData=ed;streetlightPlan=sl;peopleCatalog=pc;peoplePlan=pp;vegetationCatalog=vc;vegetationPlan=vp;getPeopleSeason=createPedestrianVariantLoader(pc,await loadData('./people/seasons.json?v=publicwebp1'),await loadData('./people/umbrella.json?v=repair20261121'),loadPedestrianAssets);[peopleAssets,vegetationAssets,canopyTexture]=await Promise.all([getPeopleSeason(season,peopleActionForWeather(weather)),loadVegetationAssets({...vc,assets:vc.assets.filter(a=>a.kind!=='tree')}),loadSpeciesTextures()]);data=d;
 const scopeOwners=new Set(d.features.filter(f=>{if(locationContext.view)return true;const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;return polys.some(r=>withinScope(r[0].map(xz),detailRadius));}).map(f=>Number(f.properties.objectid)));
 const gentleEnabled=new URLSearchParams(location.search).get('terrain')!=='measured';
 atmosphere=createAtmosphere(ed,solarContext,detailRadius,scopeOwners,{gentle:gentleEnabled,contextBuildings:!gentleEnabled});
 data={...d,features:d.features.filter(f=>scopeOwners.has(Number(f.properties.objectid)))};
 const placementRadius=detailRadius+Math.hypot(...(locationContext.view?.position||[0,0]));
 parcelData=scopePlan(pd,scopeOwners,placementRadius);attachedPlan=scopePlan(ap,scopeOwners,placementRadius);streetscapePlan=scopePlan(sp,scopeOwners,placementRadius);utilityPlan=scopeUtilities(up,scopeOwners,placementRadius);arterialPlan=scopeArterial(ar,scopeOwners,placementRadius);
 peoplePlan=scopePlan(pp,scopeOwners,placementRadius);vegetationPlan=scopePlan(vp,scopeOwners,placementRadius);streetlightPlan=scopePlan(sl,scopeOwners,placementRadius);oldRoot=g.scene;applyRoadContext(oldRoot,rc);applyArterialTerrain(oldRoot,arterialPlan);host.dataset.roadContext=JSON.stringify(rc.qa);cropTerrain(oldRoot,detailRadius+70);scene.add(oldRoot);oldRoot.traverse(o=>{if(!o.isMesh)return;if(['ground','road','path'].includes(o.name))ground.push(o);if(o.name.startsWith('buildings')){oldBuildings.push(o);o.visible=false}if(['props','wires','cars','marks'].includes(o.name)){props.push(o);o.userData.detailKind=o.name==='wires'?'wire':o.name==='props'?'poles':o.name==='cars'?'car':'marks';o.visible=false}});indexTerrain();
 if(locationContext.elevation?.mode==='kakao-road-v1'){elevation.routeCorrected=true;host.dataset.routeElevation=JSON.stringify({...locationContext.elevation,enabled:true,baked:true});}
 if(gentleEnabled){
  const {height,delta,baked}=gentleTerrainCorrection(locationContext.origin,locationContext.terrainMode,elevation);
  // indexTerrain holds independent vectors: its samples remain fixed during deformation.
  for(const drop of utilityPlan.drops||[])if(drop.end?.length===3)drop.end[1]+=delta(drop.end[0],drop.end[2]);
  rebaseArterialHeights(arterialPlan,delta);
  rebaseMountedLights(streetlightPlan,delta);
  const warp=baked?{vertices:0,maxShift:0}:deformTerrain(oldRoot,delta);indexTerrain();elevation.routeCorrected=false;
  const samples=[];for(let x=-detailRadius;x<=detailRadius;x+=10)for(let z=-detailRadius;z<=detailRadius;z+=10)if(Math.hypot(x,z)<=detailRadius)samples.push(height(x,z));
  host.dataset.terrainMode=JSON.stringify({mode:'gentle-terrain30',minHeight:Math.min(...samples),maxHeight:Math.max(...samples),nearGroundRequests:0,warp});
 }else if(locationContext.id==='original'){
  const profile=await loadData('./route-elevation.json?v=141');
  profile.segments=profile.segments.filter(pair=>pair.every(p=>Number.isFinite(elevation(...xz(p),NaN))));
  const correction=routeCorrection(profile,xz,elevation);
  const enabled=new URLSearchParams(location.search).get('terrain')!=='before';
  const original=correction.segments.flat().map(p=>({...p,before:elevation(p.x,p.z)}));
  if(enabled){rebaseArterialHeights(arterialPlan,correction.delta);rebaseMountedLights(streetlightPlan,correction.delta);}
  const warp=enabled?deformTerrain(oldRoot,correction.delta):null;if(enabled){indexTerrain();elevation.routeCorrected=true;
   // House drop endpoints were stored in the original height frame.
   for(const drop of utilityPlan.drops||[])if(drop.end?.length===3)drop.end[1]+=correction.delta(drop.end[0],drop.end[2]);
  }
  host.dataset.routeElevation=JSON.stringify({enabled,scope:'observed road corridors; 25m full influence, fade to 120m',warp,points:original.map(p=>({...p,after:elevation(p.x,p.z)}))});
  const panel=document.createElement('div');panel.style.cssText='position:absolute;bottom:12px;left:12px;z-index:20;background:#fffef0;padding:10px;border-radius:8px;color:#172e30;font:13px sans-serif';
  const other=new URL(location.href);other.searchParams.set('terrain',enabled?'before':'after');
  panel.textContent=enabled?'카카오 경로 고도 보정 · 관측 구간 한정 ':'원본 Mapzen 지형 ';
  const link=document.createElement('a');link.href=other.href;link.textContent=enabled?'원본 비교':'보정 적용';panel.append(link);host.append(panel);
 }
 elevation.detailRadius=detailRadius;atmosphere.fitGround(elevation);atmosphere.bridgeGround(oldRoot);host.dataset.boundary=JSON.stringify({policy:"intersecting-buildings-complete",buildings:scopeOwners.size,sharedGroundMaterial:true});host.dataset.background=JSON.stringify(atmosphere.stats);
 try{siteLayoutData=locationContext.id==='original'?await loadData('./site-layout27.json?v=main27'):await siteData('./site-layout.json?v=1');if(siteLayoutData.version===27)siteLayoutData.neighbors=await loadData('./neighbor-boundaries28.json?v=28c');}catch(error){host.dataset.siteLayout=JSON.stringify({enabled:false,reason:'saved map has no site layout'});}
 $('status').textContent='공용 에셋 불러오는 중…';await Promise.all([loadMemoScene(),loadRoadview50(),loadRepresentatives()]);$('status').textContent='동네 배치·접지 계산 중…';await build();host.dataset.representatives=JSON.stringify(representativeAudit());host.dataset.roadview50=JSON.stringify(alleyGroup.userData.roadview50);host.dataset.allPlacements=JSON.stringify(alleyGroup.userData.placements);host.dataset.livingContext=JSON.stringify(alleyGroup.userData.livingContext);host.dataset.courtyardRepair=JSON.stringify({boundaries:alleyGroup.userData.courtyardRepair,pockets:alleyGroup.userData.courtyardPockets});host.dataset.attachedAssets=JSON.stringify(alleyGroup.userData.attachedAssetPlacements);host.dataset.foliageExtraction=JSON.stringify(alleyGroup.userData.foliageExtraction);loaded=true;if(locationContext.view){const v=locationContext.view,a=v.heading*Math.PI/180,[vx,vz]=v.position||[0,0],y=(finishedGround||elevation)(vx,vz)+v.eyeHeight;camera.position.set(vx,y,vz);controls.target.set(vx+Math.sin(a)*10,y,vz-Math.cos(a)*10);camera.fov=Math.min(90,2*Math.atan(Math.tan(v.fov*Math.PI/360)/camera.aspect)*180/Math.PI);camera.updateProjectionMatrix();controls.update();host.dataset.viewSelection=JSON.stringify(locationContext.viewQA);}host.dataset.viewObjects=JSON.stringify(viewVisibilityStats());host.dataset.ready='true';host.dataset.buildingRoadFit=JSON.stringify(locationContext.buildingRoadFit||null);host.dataset.generationSummary=JSON.stringify({id:locationContext.id,terrainMode:locationContext.terrainMode,generationMilliseconds:locationContext.generationMilliseconds,generationTimings:locationContext.generationTimings,mapCacheStats:locationContext.mapCacheStats,buildings:data.features.length});if(locationContext.roadWarning){const notice=document.createElement('p');notice.id='roadSourceWarning';notice.setAttribute('role','status');notice.textContent=locationContext.roadWarning;notice.style.cssText='position:absolute;top:64px;left:14px;max-width:min(520px,calc(100% - 28px));padding:10px 14px;margin:0;background:#fff3cf;color:#583d13;border:1px solid #ba914b;border-radius:8px;font:13px/1.5 system-ui;z-index:4;pointer-events:none';host.append(notice);}rememberLocation(locationContext);$('address').value=locationContext.address;$('locationDataNote').textContent=`${locationContext.address} 중심 반경 ${detailRadius}m (길 위 관찰 지점의 360도 시야) · 국내 건물 ${data.features.length}개 · 도로 폭과 외관·소품은 추정 생성`+(locationContext.roadWarning?' · '+locationContext.roadWarning:'');for(const id of ['sceneControls','address','findAddress','walk','image','environmentControls'])$(id).disabled=false;
const addresses=[...new Set(meshes.map(m=>`${m.userData.street_name} ${m.userData.house_number}`))].sort((a,b)=>a.localeCompare(b,'ko'));for(const address of addresses){const option=document.createElement('option');option.value=address;$('addresses').append(option);}
$('status').textContent='';}
catch(e){host.dataset.ready='error';$('status').replaceChildren(document.createTextNode('불러오기 실패: '+e.message+' '));const retry=document.createElement('button');retry.type='button';retry.textContent='다시 불러오기';retry.onclick=()=>location.reload();$('status').append(retry);console.error(e)}
function cam(pos,at){camera.fov=43;camera.updateProjectionMatrix();camera.position.set(...pos);controls.target.set(...at);controls.update()}
let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(meshes,false)[0];if(hit)showInfo(hit.object)});
async function prepareVisibleExport(){
 await syncPeopleSeason();
 if(pedestrianSystem?.group.userData.season!==season)throw Error('사람 옷을 불러온 뒤 다시 저장해 주세요.');
 visibility?.reset();pedestrianSystem?.update(camera);vegetationSystem?.update(camera);siteLayoutView?.update(camera);apartmentGrounds?.foliage.update(camera);for(const plants of streamedPlants)plants.update(camera);
}
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('image').onclick=async()=>{await prepareVisibleExport();const prev=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;renderer.setPixelRatio(1);const W=2400,H=Math.round(W/aspect);renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();vegetationSystem?.update(camera);siteLayoutView?.update(camera);apartmentGrounds?.foliage.update(camera);pedestrianSystem?.update(camera);updateEnvironmentCamera();precipitation?.update(performance.now(),false,H);drawScene(W/prev.x);const c=document.createElement('canvas');c.width=W;c.height=H+96;const g=c.getContext('2d');g.drawImage(renderer.domElement,0,0);g.fillStyle='#163344';g.fillRect(0,H,W,96);g.fillStyle='white';g.font='18px sans-serif';g.fillText((locationContext.sources?.buildings||'MOIS / Esri Korea')+(arterialPlan?' | Transit: Seoul Open Data / Kakao | Dimensions and details inferred':' | Heights estimated; facade / roof details procedural'),24,H+29);g.fillText((locationContext.id==='original'?'Base: Rokehan | ':'')+'© OpenStreetMap contributors / © OpenMapTiles / OpenFreeMap | Elevation: Terrain Tiles',24,H+55);g.fillText('Props: NVIDIA SimReady / CC BY 4.0 / simplified and recolored | huggingface.co/datasets/nvidia/simready-assets',24,H+81);renderer.setPixelRatio(ratio);renderer.setSize(prev.x,prev.y);precipitation?.update(performance.now(),false,prev.y);camera.aspect=aspect;camera.updateProjectionMatrix();requestRender();c.toBlob(b=>save(b,'webtoon-neighborhood.png'))};

function applyStyle(style,scope=scene,refresh=true){renderStyle=style;pedestrianSystem?.setStyle(style);vegetationSystem?.setStyle(style);apartmentGrounds?.foliage.setStyle(style);for(const plants of streamedPlants)plants.setStyle(style);scene.background=null;scope.traverse(o=>{if(o.userData.environmentOwned||o.userData.isPedestrianBillboard||o.userData.isBillboardShadow||o.userData.isPedestrianShadow||o.userData.isVegetationBillboard)return;if(o.isMesh){if(!o._originalMaterial)o._originalMaterial=o.material;const original=o._originalMaterial;if(style==='color'){if(o.material!==original)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();o.material=original;return}const originals=Array.isArray(original)?original:[original];const next=originals.map(m=>{const c=m.color?.clone()||new T.Color('white');const kind=o.userData.detailKind;const shade=style==='line'?(kind==='metal'||kind==='wire'?.12:kind==='poles'?.75:kind==='mortar'?.55:kind==='roadmark'?.48:1):kind==='mortar'?.62:kind==='roadmark'?.65:kind==='yardGreen'?.65:kind==='yardWood'?.6:kind==='yardPot'?.78:kind==='foundation'?.65:kind==='paving'?.86:kind==='rubber'||kind==='wire'?.22:kind==='people'?.45:kind==='poles'?.65:kind==='glass'?.55:kind==='metal'?.35:kind==='roof'?.72:o.name==='road'?.82:.97;const gray=new T.Color(shade,shade,shade);if(o.userData.roadFinish)gray.setHex((style==='line'?{roadmark:0x454545,mortar:0x707070,paving:0xd4d4d4,yardGreen:0x5c5c5c}:{roadmark:0x555555,mortar:0x787878,paving:0xb8b8b8,yardGreen:0x686868})[kind]??0xb8b8b8);const mat=new T.MeshStandardMaterial({roughness:.9,color:gray,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:m.polygonOffset?m.polygonOffsetFactor:1,polygonOffsetUnits:m.polygonOffset?m.polygonOffsetUnits:1});if(o.userData.brandSign){mat.map=m.map;mat.transparent=m.transparent;mat.alphaTest=m.alphaTest;mat.depthWrite=m.depthWrite;mat.emissiveMap=m.emissiveMap;}mat.userData={...m.userData};applyInteriorStyle(mat,m,style);if(m._groundCharacterHook){mat.onBeforeCompile=m._groundCharacterHook;mat.customProgramCacheKey=()=>m.customProgramCacheKey()+"-monochrome";}return mat});if(o.material!==original){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}o.material=Array.isArray(original)?next:next[0]}else if(o.isLineSegments){if(o.userData.spatialVertexColor){o.material.vertexColors=style==='color';o.material.needsUpdate=true;}o.material.color.set(style==='color'?(o.userData.spatialVertexColor?0xffffff:(o.userData.faceLineColor??0x3e4549)):0x202025);o.material.opacity=1;o.material.transparent=false}});illustrationShading.install(scope);if(refresh)applyEnvironment();}
navigation=setupCameraNavigation({camera,controls,canvas:renderer.domElement,host,isWalking:()=>walking?.isActive(),isReady:()=>loaded,getMap:()=>({radius:detailRadius,ground,buildings:data.features.flatMap(f=>(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map(r=>r[0].map(xz)))})});
walking=setupWalk({camera,controls,renderer,host,elevation:(x,z)=>(finishedGround||elevation)(x,z),roadInfo,getGround:()=>ground,getBuildings:()=>meshes,getRadius:()=>detailRadius,getBoundarySegments:()=>[...(siteLayoutView?.group.visible&&streetGroup?.visible?[...siteLayout.data.walls,...siteLayout.data.gaps.filter(g=>g.a&&g.b&&!['passage','kept-access','open-pedestrian'].includes(g.kind)),...siteLayout.data.siteDetails.fences,...siteLayout.data.siteDetails.gates].map(w=>({a:w.a,b:w.b,width:.16})):[]),...(arterial?.group.userData.walkObstacles||[]),...(alleyGroup?.visible&&streetGroup?.visible?[...alleyGroup.userData.openBoundaries,...alleyGroup.userData.walkObstacles]:[]),...detailGroup.children.flatMap(c=>c.children.flatMap(g=>g.userData.walkObstacles||[])),...(utilityGroup?.visible&&streetGroup?.visible?utilityGroup.userData.walkObstacles:[]),...(vegetationSystem?.group.visible&&streetGroup?.visible?vegetationPlan.trees.flatMap(t=>{const [x,y,z]=t.root,r=vegetationSystem.plans?.some(p=>p.id===t.id)?.42:.22;return [[x-r,z-r],[x+r,z-r],[x+r,z+r],[x-r,z+r]].map((a,i,ps)=>({a,b:ps[(i+1)%4],width:.04}));}):[])],isLoaded:()=>loaded});
if(loaded&&locationContext.view?.version===3){const v=locationContext.view;walking.start(...v.position,-v.heading*Math.PI/180);}
if(loaded){restoreEditCamera({id:locationContext.id,camera,controls,walking});installBuildingEditor({canvas:renderer.domElement,scene,camera,controls,getBuildings:()=>meshes,host,id:locationContext.id,walking,render:requestRender,context:locationContext,load:siteData,elevation});}

async function compareRendering(lodOnly=false){
 if(!loaded||benchmarking)return;
 const button=$('comparePerformance'),out=$('benchmarkStats'),gl=renderer.getContext(),wasEnabled=controls.enabled;
 const current=renderSettings(),settings=enabled=>({...current,enabled:enabled||lodOnly?current.enabled:false,lod:false,lodMode:"0"});
 benchmarking=true;controls.enabled=false;$('comparePerformance').disabled=true;out.textContent='같은 화면을 비교하는 중…';
 const result={original:[],optimized:[]};
 try{
  // finish() is deliberately limited to this opt-in measurement, never normal rendering.
  // It waits for GPU work too, unlike a misleading renderer.render() CPU-only timer.
  for(let i=0;i<4;i++)for(const enabled of [false,true]){renderScene(settings(enabled));gl.finish();}
  for(let i=0;i<12;i++)for(const enabled of [false,true]){
   await new Promise(resolve=>requestAnimationFrame(resolve));
   const start=performance.now();renderScene(settings(enabled));gl.finish();
   result[enabled?'optimized':'original'].push({ms:performance.now()-start,...lastStats});
  }
  const median=list=>{const a=list.map(r=>r.ms).sort((a,b)=>a-b);return(a[a.length/2-1]+a[a.length/2])/2;};
  const before=median(result.original),after=median(result.optimized);
  const report={...result,beforeMs:before,afterMs:after,comparison:lodOnly?'LOD only, same culling':'all optimizations',method:'Median of 12 alternating frames per mode; GPU finish included; same camera; LOD-only mode keeps culling settings equal'};
  out.dataset.result=JSON.stringify(report);out.textContent=`${lodOnly?'LOD':'전체 최적화'} 비교: ${before.toFixed(1)} → ${after.toFixed(1)}ms / 프레임 (GPU 완료 대기 포함)`;
 }catch(e){out.textContent='비교 실패: '+e.message;}
 finally{benchmarking=false;controls.enabled=wasEnabled;$('comparePerformance').disabled=false;requestRender();}
};

$('comparePerformance').onclick=()=>compareRendering(false);


function refreshBillboardLighting(profile=environmentProfile(hour,weather,solarContext),chance=Number($('windowPercent').value)/100,painted=renderStyle==='color'){
 billboardLightField?.set({sunProfile:profile,shading:appearance.shading,shadows:appearance.shadows,density:appearance.density/100,night:profile.night,tint:profile.tint,painted,local:$('billboardLighting').checked,lamps:true,chance,pattern:windowPattern,sourceIds:{...streetlights?.getBillboardSources(),shops:shops?.activeIds||[]}});
 if(billboardLightField){pedestrianSystem?.setLighting(billboardLightField);vegetationSystem?.setLighting(billboardLightField);apartmentGrounds?.foliage.setLighting(billboardLightField);siteLayoutView?.foliage.setLighting(billboardLightField);for(const plants of streamedPlants)plants.setLighting(billboardLightField);}
 for(const system of [pedestrianSystem,vegetationSystem,...streamedPlants]){system?.shadows.setEnvironment(profile.night);system?.shadows.setVisible($('contactShadows').checked&&appearance.shadows&&appearance.shading);if(system)system.shadows.mesh.material.opacity*=appearance.shading?appearance.density/100:0;}
 vegetationSystem?.sunShadows.set(profile,appearance.shading&&appearance.shadows);apartmentGrounds?.foliage.sunShadows.set(profile,appearance.shading&&appearance.shadows);siteLayoutView?.foliage.sunShadows.set(profile,appearance.shading&&appearance.shadows);for(const plants of streamedPlants)plants.sunShadows.set(profile,appearance.shading&&appearance.shadows);
 const report={sunShadows:vegetationSystem?.sunShadows.stats,local:$('billboardLighting').checked,shadows:$('contactShadows').checked,contacts:(pedestrianSystem?.shadows.ranges.length||0)+(vegetationSystem?.shadows.ranges.length||0),contactShadowDrawCalls:2,sunShadowBatches:vegetationSystem?.sunShadows.batches.length??0,field:billboardLightField?.stats,sources:streetlights?.getBillboardSources(),people:[],trees:[],plants:[]};
 const summarize=f=>({sunExposure:f.sunExposure,id:f.placement.id,root:(f.feet||f.root).toArray(),height:f.placement.height,light:f.lighting.map(c=>c.toArray()),level:f.lighting.reduce((s,c)=>s+(c.r+c.g+c.b)/9,0)});
 report.siteTrees=siteLayoutView?.foliage.figures.map(summarize)||[];report.people=pedestrianSystem?.figures.map(summarize)||[];report.trees=vegetationSystem?.figures.filter(f=>f.placement.kind==='tree').map(summarize)||[];report.plants=vegetationSystem?.figures.filter(f=>f.placement.kind==='plant').map(summarize)||[];
 $('billboardStats').dataset.lighting=JSON.stringify(report);
}

function updatePeopleSeasonStats(){
 if(!pedestrianSystem)return;
 const {season:applied,action,elevationTiers}=pedestrianSystem.group.userData;
 const element=$('peopleStats');
 element.textContent=`이미지 행인 ${pedestrianSystem.figures.length}명 · ${peopleCatalog.people.length}종 · ${PEOPLE_SEASON_NAMES[applied]} 옷 · ${action==='umbrella'?'우산 쓰고 걷기':'걷기'} · 8방향 · ${elevationTiers===3?'시점 높이 3단계':'눈높이 그림'}`;
 element.dataset.season=applied;element.dataset.action=action;element.dataset.elevationTiers=String(elevationTiers);element.dataset.state='ready';
}
function syncPeopleSeason(){
 if(!pedestrianSystem||!getPeopleSeason)return Promise.resolve();
 const system=pedestrianSystem,target=season,action=peopleActionForWeather(weather);
 if(peopleSeasonRequest?.system===system&&peopleSeasonRequest.season===target&&peopleSeasonRequest.action===action)return peopleSeasonRequest.promise;
 const request={system,season:target,action,promise:null};peopleSeasonRequest=request;
 if(system.group.userData.season===target&&system.group.userData.action===action){updatePeopleSeasonStats();request.promise=Promise.resolve();return request.promise;}
 $('peopleStats').textContent=PEOPLE_SEASON_NAMES[target]+' '+(action==='umbrella'?'우산 그림':'옷')+'을 불러오는 중…';$('peopleStats').dataset.state='loading';
 request.promise=getPeopleSeason(target,action).then(assets=>{
  if(peopleSeasonRequest!==request||pedestrianSystem!==system||season!==target||peopleActionForWeather(weather)!==action)return;
  system.setAssets(assets);peopleAssets=assets;system.update(camera);refreshBillboardLighting();updatePeopleSeasonStats();requestRender();
 }).catch(error=>{
  if(peopleSeasonRequest!==request)return;
  $('peopleStats').textContent=PEOPLE_SEASON_NAMES[target]+' 사람 그림을 불러오지 못했습니다. 계절이나 날씨를 다시 선택해 주세요.';
  $('peopleStats').dataset.state='error';peopleSeasonRequest=null;console.error('사람 계절 의상:',error);
 });
 return request.promise;
}

function applyEnvironment(options={}){
 void syncPeopleSeason();
 const shadowsWereEnabled=renderer.shadowMap.enabled,shadowsWereDirty=renderer.shadowMap.needsUpdate;
 vegetationSystem?.setSeason(season);apartmentGrounds?.foliage.setFoliage({season});siteLayoutView?.foliage.setFoliage({season});for(const plants of streamedPlants)plants.setSeason(season);
 const profile=environmentProfile(hour,weather,solarContext);
 illustrationShading.set(appearance,profile,renderStyle);renderer.shadowMap.enabled=appearance.shadows&&appearance.shading;
 if(automaticWindows)setWindowValue(Math.round(profile.windowChance*100));
 $('windowMode').textContent=automaticWindows?'자동':'수동';$('windowMode').setAttribute('aria-pressed',String(automaticWindows));$('windowMode').title=automaticWindows?'시간에 맞춰 자동 조절 중 · 비율을 직접 바꾸면 수동으로 전환':'비율 수동 고정 중 · 클릭하면 시간에 맞춰 자동 조절';
 const chance=Number($('windowPercent').value)/100,painted=renderStyle==='color';
 atmosphere?.set(hour,weather,renderStyle,chance,windowPattern);
 scene.traverse(o=>{if(!o.isLineSegments||!o.material?.color)return;const m=o.material;if(m.userData.dayLineColor===undefined)m.userData.dayLineColor=o.userData.spatialVertexColor?0xffffff:(o.userData.faceLineColor??m.color.getHex());if(painted)m.color.set(m.userData.dayLineColor).multiplyScalar(1-profile.night*.63);});
 atmosphere?.setEnabled(true);precipitation?.set(weather,profile,renderStyle);hemisphere.color.set(profile.skyLight);hemisphere.groundColor.set(profile.ground);hemisphere.intensity=profile.ambient;
 sun.color.set(profile.sun);sun.intensity=profile.sunIntensity;sun.target.position.set(0,elevation(0,0)+20,0);sun.target.updateMatrixWorld();sun.position.set(...bearingVector(profile.azimuth,profile.renderElevation)).multiplyScalar(600).add(sun.target.position);sun.castShadow=profile.castsSunShadow;
 arterial?.set(profile.night,renderStyle,scene);shops?.set(hour,profile.night,renderStyle,scene);shops?.update(camera);
 const shopStats=shops?.stats();if(shopStats){$('shopStats').textContent=`상가 ${shopStats.placed}곳 · 영업 중 ${shopStats.open} · 정리 중 ${shopStats.cleanup} · 소등 ${shopStats.closed}`;$('shopStats').dataset.state=JSON.stringify(shopStats);}
 refreshBillboardLighting(profile,chance,painted);
 let lit=0;for(const [band,count] of (detailGroup?.userData.windowBands||[]).entries())if(windowIsLit((band+windowPattern)%16,chance))lit+=count;
 const activeWindowMaterials=new Set(),litWindowMaterials=new Set();
 scene.traverse(o=>{const active=new Set(Array.isArray(o.material)?o.material:o.material?[o.material]:[]);const materials=new Set([...(Array.isArray(o.material)?o.material:o.material?[o.material]:[]),...(o._originalMaterial?(Array.isArray(o._originalMaterial)?o._originalMaterial:[o._originalMaterial]):[])]);for(const m of materials){const band=m.userData.nightWindowBand;if(band===undefined||!m.emissive)continue;const warm=(band+windowPattern)%5!==0;m.emissive.set(warm?'#ffd18b':'#cce4ed');m.emissiveIntensity=windowIsLit((band+windowPattern)%16,chance)?profile.windowIntensity:0;if(active.has(m)){activeWindowMaterials.add(m);if(m.emissiveIntensity>0)litWindowMaterials.add(m);}}});
 streetlights?.set(profile.night,true,renderStyle,chance,windowPattern);renderer.shadowMap.needsUpdate=options.rebake!==false||shadowsWereDirty||shadowsWereEnabled!==renderer.shadowMap.enabled;
 $('environmentControls').dataset.state=JSON.stringify({shops:shops?.stats(),season,foliage:vegetationSystem?.group.userData.foliage,hour,time:profile.label,date:profile.date,utcOffset:profile.utcOffset,solar:{azimuth:profile.azimuth,elevation:profile.elevation},renderedSun:{azimuth:profile.azimuth,elevation:profile.renderElevation,model:profile.lightingModel,color:profile.sun,skyLight:profile.skyLight},sunPosition:sun.position.toArray(),sunTarget:sun.target.position.toArray(),sunIntensity:sun.intensity,ambient:hemisphere.intensity,dayClarity:profile.dayClarity,night:profile.night,castsSunShadow:sun.castShadow&&renderer.shadowMap.enabled,shadowsEnabled:renderer.shadowMap.enabled,appearance:{...appearance},automaticWindows,weather,windowChance:chance,litWindows:lit,activeWindowMaterials:activeWindowMaterials.size,litWindowMaterials:litWindowMaterials.size,streetlights:streetlightPlan?.lights.length??0,lampsOn:profile.night>.01,background:{...atmosphere?.stats,windowChance:chance,night:profile.night},distant:true,windowPattern});
 requestRender();
}
function updateEnvironmentCamera(){
 // Keep centimetre-scale surface gaps distinguishable in the overhead view.
 // Walking retains the 10 cm near plane so nearby walls do not disappear.
 const eyeAboveGround=camera.position.y-elevation(camera.position.x,camera.position.z);
 const near=Math.max(.1,Math.min(2,eyeAboveGround/100));
 if(Math.abs(camera.near-near)>.001){camera.near=near;camera.updateProjectionMatrix();}
 const count=streetlights?.update(camera)??0;shops?.update(camera);const signature=streetlights?.getBillboardSignature()+'|'+(shops?.activeIds||[]).join(',');if(signature!==lastBillboardSources){lastBillboardSources=signature;refreshBillboardLighting();}const dir=new T.Vector3();camera.getWorldDirection(dir);const bearing=(Math.atan2(dir.x,-dir.z)*180/Math.PI+360)%360,names=['북','북동','동','남동','남','남서','서','북서'];
 $('environmentHeading').textContent=`${names[Math.round(bearing/45)%8]} ${Math.round(bearing)}° · ${environmentProfile(hour,weather,solarContext).label}`;
 $('environmentControls').dataset.activeShadowLights=count;
}
$('shopView').onchange=()=>{
 const p=shopPlan?.placements.find(p=>String(p.placeId)===$('shopView').value);if(!p)return;
 if(walking?.isActive())walking.exit();
 const [x,y,z]=p.position,[nx,nz]=p.n,d=Math.max(8,p.width*1.35);
 cam([x+nx*d,y+3.1,z+nz*d],[x,y+1.9,z]);
 $('status').textContent=`${p.name} · ${p.address} · ${p.reference==='observed-local-frontage'?'로드뷰 확인 전면':p.reference==='reference-derived-brand'?'사진·로드뷰를 반영한 매장 외관':'업종 참고 디자인'} · 영업시간은 연출용`;
};
$('timeOfDay').onchange=()=>{hour=Number($('timeOfDay').value);applyEnvironment();};
$('season').onchange=()=>{season=$('season').value;try{localStorage.setItem(seasonKey,season);}catch{}applyEnvironment();};
$('windowMode').onclick=()=>{automaticWindows=!automaticWindows;applyEnvironment();};
$('timeModelNote').textContent=`태양 위치는 ${SOLAR_CONTEXT.date} 날짜와 현재 동네 좌표, 한국 표준시(UTC+9)를 기준으로 근사 계산합니다. 낮에는 만화 연출을 위해 태양을 더 높게 보정해 그림자를 짧게 하고, 흰 햇빛과 푸른 하늘빛을 사용합니다. 아침·노을·밤은 실제 해의 출몰 시각에 맞춥니다. 창문은 20시 무렵 가장 많이 켜지고 새벽에 줄어듭니다. 비율을 직접 입력하면 수동으로 고정되며, 자동 버튼을 누르면 시간 연동으로 돌아옵니다.`;
$('weather').onchange=()=>{weather=$('weather').value;applyEnvironment();};
for(const id of ['billboardLighting','contactShadows'])$(id).oninput=applyEnvironment;
$('newWindowPattern').onclick=()=>{windowPattern=(windowPattern+5)%16;applyEnvironment();};

$('pixelQuality').onchange=()=>{renderer.setPixelRatio(Math.min(devicePixelRatio,Number($('pixelQuality').value)));renderer.setSize(host.clientWidth,host.clientHeight);requestRender();};
$('weatherMotion').onchange=requestRender;
// All controls share the same validated state and survive reloads.
const appearanceSetters={};
function syncAppearance(){
 for(const [key,value] of Object.entries(appearance)){
  const input=$('art-'+key);if(!input)continue;
  if(input.type==='checkbox')input.checked=value;
  else if(appearanceSetters[key])appearanceSetters[key](value);else input.value=value;
  const range=$('range-'+key);if(range)range.value=value;
 }
 for(const prefix of ['outer','inner'])for(const suffix of ['Brightness','Saturation']){
  $('art-'+prefix+suffix).disabled=$('range-'+prefix+suffix).disabled=!appearance[prefix+'Face'];
 }
 $('linePanel').dataset.state=JSON.stringify(appearance);
}
function appearanceChanged(){saveAppearance(appearance);syncAppearance();applyEnvironment({rebake:false});}
for(const [key,value] of Object.entries(appearance)){
 const input=$('art-'+key);if(!input)continue;
 if(typeof value==='number'){
  appearanceSetters[key]=setupNumberScrub(input,next=>{appearance[key]=next;appearanceChanged();});
  $('range-'+key).oninput=event=>{appearance[key]=Number(event.target.value);appearanceChanged();};
 }else input.onchange=()=>{appearance[key]=input.type==='checkbox'?input.checked:input.value;appearanceChanged();};
}
$('resetLines').onclick=()=>{for(const key of ['lines','outerWidth','outerFace','outerBrightness','outerSaturation','minDistance','acrossObjects','innerWidth','innerAngle','innerFace','innerBrightness','innerSaturation'])appearance[key]=DEFAULT_APPEARANCE[key];appearanceChanged();};
$('resetShading').onclick=()=>{for(const key of ['shading','brightness','density','shadows','shadingMode'])appearance[key]=DEFAULT_APPEARANCE[key];appearanceChanged();};
syncAppearance();
// Review links can open a particular local shop and hour without changing defaults.
if(loaded){
 const params=new URLSearchParams(location.search),requestedHour=Number(params.get('hour'));
 if(params.has('hour')&&Number.isInteger(requestedHour)&&requestedHour>=0&&requestedHour<24){hour=requestedHour;$('timeOfDay').value=String(hour);applyEnvironment();}
 if(params.get('location')==='ff486fdeb343ab9c'&&['new','original'].includes(params.get('leafCompare'))){
  const f=siteLayoutView?.foliage.figures.find(f=>f.placement.id==='infill-0');
  if(f){const [x,y,z]=f.root.toArray();walking?.exit();cam([x-8,y+5,z+10],[x,y+2.7,z]);host.dataset.leafTrial=JSON.stringify(siteLayoutView.foliage.group.userData.leafTrial);}
 }
 if(shopPlan.placements.some(p=>String(p.placeId)===params.get('shop'))){$('shopView').value=params.get('shop');$('shopView').onchange();}
}

// Saved views expose the large-road assets without hunting for a tiny map point.
function showArterialView(value){
 if(!arterialPlan||!value)return;walking?.exit();
 const u=arterialPlan.alignment.u,n=arterialPlan.alignment.n;let point,look;
 if(value==='overview'){cam([145,155,180],[-9,5,15]);return;}
 if(value==='crosswalk'){const c=arterialPlan.crosswalks?.[0];if(c){const p=c.position;cam([p[0]-n[0]*26+u[0]*27,p[1]+19,p[2]-n[1]*26+u[1]*27],[p[0]+n[0]*3,p[1]+2,p[2]+n[1]*3]);}return;}
 if(value==='shops'){const p=shopPlan.placements.find(p=>String(p.placeId)==='2028304713')||shopPlan.placements.find(p=>p.arterial);if(p){const row=shopPlan.placements.filter(a=>a.owner===p.owner&&a.edge===p.edge),q=[0,1,2].map(i=>row.reduce((s,a)=>s+a.position[i],0)/row.length);cam([q[0]+p.n[0]*24+p.n[1]*3,q[1]+7.5,q[2]+p.n[1]*24-p.n[0]*3],[q[0],q[1]+1.7,q[2]]);}return;}
 if(value==='bicycles'){const dock=arterialPlan.furniture.find(p=>p.kind==='cycle-dock');if(dock){const p=dock.position;cam([p[0]-n[0]*6-u[0]*5,p[1]+4.1,p[2]-n[1]*6-u[1]*5],[p[0],p[1]+.45,p[2]]);}return;}
 if(value==='walk'){const p=arterialPlan.furniture.find(p=>{if(p.kind!=='tree-pit'||p.position[2]<-75||p.position[2]>0)return false;const t=p.position[0]*u[0]+p.position[2]*u[1];const k=arterialPlan.alignment.knots.reduce((a,b)=>Math.abs(b[0]-t)<Math.abs(a[0]-t)?b:a);return p.position[0]*n[0]+p.position[2]*n[1]>k[1];});if(p){const x=p.position[0]+n[0]*2,z=p.position[2]+n[1]*2;walking.start(x,z,Math.atan2(u[0],u[1]));}return;}
 if(value==='frontage'){const e=arterialPlan.exits[0];if(e){const p=e.position;cam([p[0]-n[0]*21+u[0]*24,p[1]+9,p[2]-n[1]*21+u[1]*24],[p[0]+u[0]*16,p[1]+3.3,p[2]+u[1]*16]);}return;}
 const p=value==='subway'?arterialPlan.exits[0]:arterialPlan.platforms[0];if(!p)return;
 point=p.position;const distance=value==='subway'?5:10;look=[point[0],point[1]+1.3,point[2]];
 const side=value==='subway'?-p.side:1;cam([point[0]+n[0]*distance*side+u[0]*(value==='subway'?-9:13),point[1]+(value==='subway'?5.5:6.5),point[2]+n[1]*distance*side+u[1]*(value==='subway'?-9:13)],look);requestRender();
}
if(arterialPlan){const requested=new URLSearchParams(location.search).get('arterial');if(requested)showArterialView(requested);}

// Reopen a review at the same pedestrian position; normal road/collision checks apply.
const walkAt=new URLSearchParams(location.search).get("walkAt")?.split(",").map(Number);
if(walkAt?.length===4&&walkAt.every(Number.isFinite))walking.start(...walkAt);

// Shared style/camera pipeline keeps before/after measurements comparable.
async function benchmarkStreetLife({root,views,focus,summary,out}){
 if(benchmarking)throw new Error('다른 측정이 진행 중입니다.');
 const gl=renderer.getContext(),saved={pos:camera.position.clone(),target:controls.target.clone(),visible:root.visible,enabled:controls.enabled,size:renderer.getSize(new T.Vector2()),ratio:renderer.getPixelRatio(),aspect:camera.aspect};
 benchmarking=true;controls.enabled=false;
 const result={method:'Fixed 960x640 framebuffer, pixel ratio 1; 4 warmup pairs + 16 alternating measured pairs per view; gl.finish GPU completion; surface buffers refreshed every sample to represent camera movement; cached shadows; cold shadow refresh recorded separately (not a comparable benchmark)',settings:{...appearance,...renderSettings(),style:renderStyle,hour,weather,viewport:[960,640],devicePixelRatio:1},assets:summary,views:[]};
 const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 const aggregate=a=>{const sorted=a.map(x=>x.ms).sort((a,b)=>a-b);return{medianMs:(sorted[7]+sorted[8])/2,p95Ms:sorted[15],calls:a[0].calls,triangles:a[0].triangles,samples:a};};
 try{
  renderer.setPixelRatio(1);renderer.setSize(960,640,false);camera.aspect=1.5;camera.updateProjectionMatrix();
  const shots=[{name:'동네 전체',set:()=>cam([210,200,230],[0,3,0])},...views.filter(p=>['약수슈퍼','민지미용실'].includes(p.name)).map(p=>({name:p.name,set:()=>focus(p)}))];
  for(const p of views){if(shots.length>=3)break;if(!shots.some(s=>s.name===p.name))shots.push({name:p.name,set:()=>focus(p)});}
  for(const shot of shots){
   shot.set();camera.aspect=1.5;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   const samples={before:[],after:[]},shadow={};
   for(const enabled of[false,true]){root.visible=enabled;renderer.shadowMap.needsUpdate=true;await frame();const t=performance.now();renderScene();gl.finish();shadow[enabled?'after':'before']=performance.now()-t;}
   for(let i=0;i<20;i++)for(const enabled of (i%2?[true,false]:[false,true])){
    out.textContent=`${shot.name} 측정 ${Math.max(0,i-3)}/16`;root.visible=enabled;await frame();const t=performance.now();renderScene();gl.finish();if(i>=4)samples[enabled?'after':'before'].push({ms:performance.now()-t,calls:lastStats.calls,triangles:lastStats.triangles});
   }
   result.views.push({name:shot.name,camera:camera.position.toArray(),target:controls.target.toArray(),before:aggregate(samples.before),after:aggregate(samples.after),shadowRefreshMs:shadow});
  }
  return result;
 }finally{root.visible=saved.visible;renderer.setPixelRatio(saved.ratio);renderer.setSize(saved.size.x,saved.size.y,false);camera.aspect=saved.aspect;camera.updateProjectionMatrix();camera.position.copy(saved.pos);controls.target.copy(saved.target);controls.enabled=saved.enabled;controls.update();renderer.shadowMap.needsUpdate=true;benchmarking=false;requestRender();}
}
if(loaded){
 try{const {installSimReadyPreview}=await import('./simready-preview.js?v=compact1');streetLifeRoot=(await installSimReadyPreview({scene,assetParent:streetGroup,camera,controls,shopPlan,elevation:finishedGround||elevation,requestRender,renderer,applyStyle,obstacles:[detailGroup,shops.group,utilityGroup],benchmark:benchmarkStreetLife,showControls:false})).root;}catch(e){$('status').textContent='생활 소품 배치 실패: '+e.message;console.error(e);}
}

// The near scene is usable before outward visibility queries start.
if(loaded&&locationContext.view){
 const progress=document.createElement('div');progress.id='backgroundProgress';progress.setAttribute('role','status');progress.style.cssText='position:absolute;left:12px;top:12px;z-index:3;padding:6px 9px;border-radius:6px;background:#fffffff0;color:#254650;font-size:12px';host.append(progress);
 const controller=new AbortController();window.addEventListener('pagehide',()=>controller.abort(),{once:true});
 const start=async()=>{
  progress.textContent='멀리 보이는 건물 확인 중…';
  try{
   const {expandVisibleBuildings}=await import('./visible-horizon.js?v=horizon1');
   const initial=locationContext.browserFiles?.['visibility-source.json']?await fetch(locationContext.browserFiles['visibility-source.json'],{signal:controller.signal}).then(r=>r.json()):data;
   const ownerIds=new Set(data.features.map(f=>Number(f.properties.objectid)));
   const groundHeight=(x,z)=>(finishedGround||elevation)(x,z,atmosphere.heightAt(x,z));
   const maxTerrain=Math.max(0,...environmentData.positions.filter((_,i)=>i%3===1))+20;
   await expandVisibleBuildings({origin:locationContext.origin,view:locationContext.view,heightAt:groundHeight,maxTerrain,terrainRadii:environmentData.radii,initial,terrain:atmosphere.heightSnapshot(),detailOwners:ownerIds,signal:controller.signal,
    onUpdate(context,stats){horizonEpoch++;const group=atmosphere.updateVisibleBuildings(context);if(group)illustrationShading.install(group);camera.far=Math.max(3000,stats.farthest*1.5+1000);camera.updateProjectionMatrix();host.dataset.background=JSON.stringify(atmosphere.stats);requestRender();},
    onPause:()=>new Promise((resolve,reject)=>{const button=document.createElement("button");button.type="button";button.textContent="먼 건물 계속 확인";const abort=()=>reject(controller.signal.reason);controller.signal.addEventListener("abort",abort,{once:true});button.onclick=()=>{controller.signal.removeEventListener("abort",abort);button.remove();resolve();};progress.append(button);}),
    onProgress(state){host.dataset.visibleHorizon=JSON.stringify(state);progress.hidden=state.state==='complete'||state.state==='cancelled';progress.textContent=state.state==='incomplete'?'먼 건물 일부를 불러오지 못했습니다.':state.state==='paused'?'추가 조회를 잠시 멈췄습니다. ':state.state==='source-boundary'?'지도 자료가 제공되는 구역까지 확인했습니다.':`먼 건물 ${state.visibleBuildings}동 · 주변 확인 중…`;}
   });
  }catch(error){if(controller.signal.aborted)return;progress.hidden=false;progress.textContent='먼 건물 일부를 불러오지 못했습니다. '+error.message;const retry=document.createElement('button');retry.type='button';retry.textContent='다시 확인';retry.onclick=()=>{retry.remove();start();};progress.append(retry);console.error('Distant building lookup incomplete',error);}
 };
 start();
}
