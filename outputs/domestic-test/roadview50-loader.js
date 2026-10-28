import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// Match functions, not IDs or colors. Structural assemblies and vegetation trees
// remain owned by their existing systems. Unmatched new models stay in the catalog.
export const ROADVIEW50_MAP={
  8:'a32',9:'a31',14:'a18',16:'a17',17:'a21',19:'a11',20:'a23',24:'a26',25:'a27',
  30:'a36',31:'a50',32:'a50',34:'a47',35:'a46',37:'a48',39:'a34',
  45:'a45',46:'a01',47:'a02',50:'a38',64:'a33',70:'a24',71:'a31',73:'a40',74:'a31',
  81:'a22',82:'a21',83:'a21',86:'a18',87:'a19',88:'a19',89:'a20',91:'a13',92:'a14',
  94:'a24',96:'a43',98:'a49',99:'a42',101:'a50',116:'a05',117:'a04',118:'a07',
  119:'a08',124:'a09',126:'a38',137:'a30',138:'a26',142:'a41',151:'a09',152:'a08',
  160:'a42',162:'a45',166:'a13',168:'a21',169:'a18',170:'a23',179:'a42',
  183:'a40',194:'a34',198:'a09',199:'a08',
  // Second collection: loose household/shop props only. Building shells, fixed
  // doors, shutters, stairs, poles and street infrastructure remain unchanged.
  27:'a93',28:'a82',29:'a92',40:'a75',41:'a90',42:'a90',43:'a89',
  85:'a81',95:'a95',110:'a74',114:'a58',130:'a86',131:'a87',
  139:'a78',141:'a65',146:'a97',149:'a94',157:'a81',163:'a89',
  176:'a51',177:'a52',186:'a79',192:'a73',33:'a115',65:'a111',90:'a123',106:'a114',133:'a138',134:'a140',140:'a122',167:'a108',175:'a117',191:'a114',193:'a113',160:'a165',187:'a175',148:'a155',190:'a197',97:'a163',178:'a182',189:'a187'
};
const templates=new Map(),failures=[];
let catalog=[],enabled=true,ruleBook=null;
export function getPlacementRule(info){return info?.componentIds?.length>1?{...ruleBook?.profiles.workstation,assetId:info.assetId,orientation:"front-away-from-wall",slopeMax:.12}:ruleBook?.assets[info?.assetId];}
export function getPlacementRuleInfo(){return {version:ruleBook?.version,defined:Object.keys(ruleBook?.assets||{}).length,basis:ruleBook?.basis};}
const countTriangles=root=>{let n=0;root.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});return n;};

const isLeafMaterial=m=>!!m?.userData.treeLeaf||m?.name?.startsWith('Tree leaf atlas');
// GLTF primitive materials are flattened to regular single-material meshes so
// the existing material batching and line rendering retain all their invariants.
function leafGroups(raw,g){
 const pos=raw.attributes.position,parent=Array.from({length:g.count/3},(_,i)=>i),seen=new Map();
 const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 for(let t=0;t<parent.length;t++)for(let k=0;k<3;k++){const v=g.start+t*3+k,key=[pos.getX(v),pos.getY(v),pos.getZ(v)].join(',');if(seen.has(key))parent[find(t)]=find(seen.get(key));else seen.set(key,t);}
 const groups=new Map();for(let t=0;t<parent.length;t++){const id=find(t);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(g.start+t*3,g.start+t*3+1,g.start+t*3+2);}
 return [...groups.values()].map(vertices=>({...g,vertices}));
}
export function flatten(source){
 source.updateMatrixWorld(true);const out=new T.Group();
 source.traverse(o=>{if(!o.isMesh)return;const raw=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();raw.applyMatrix4(o.matrixWorld);
  const mats=Array.isArray(o.material)?o.material:[o.material],groups0=raw.groups.length?raw.groups:[{start:0,count:raw.attributes.position.count,materialIndex:0}],groups=groups0.flatMap(g=>(isLeafMaterial(mats[g.materialIndex||0])?leafGroups(raw,g):[g]));
  for(const group of groups){const geo=new T.BufferGeometry(),start=group.start,end=start+group.count;
   for(const key of ['position','normal','color','uv']){const a=raw.attributes[key];if(a)geo.setAttribute(key,new T.BufferAttribute(group.vertices?new a.array.constructor(group.vertices.flatMap(v=>Array.from({length:a.itemSize},(_,k)=>a.array[v*a.itemSize+k]))):a.array.slice(start*a.itemSize,end*a.itemSize),a.itemSize,a.normalized));}
   if(!geo.attributes.normal)geo.computeVertexNormals();const mat=mats[group.materialIndex||0]||mats[0],color=mat.color?.clone()||new T.Color(0x999999);
   const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,vertexColors:!!raw.attributes.color,roughness:.92,metalness:0,side:mat.side??T.FrontSide,map:isLeafMaterial(mat)?null:mat.map}));mesh.name=o.name;mesh.userData.part=isLeafMaterial(mat)?'leaf':null;mesh.castShadow=true;mesh.receiveShadow=true;out.add(mesh);
  }
  raw.dispose();
 });out.updateMatrixWorld(true);return out;
}

export async function loadRoadview50(){
 enabled=new URLSearchParams(location.search).get('roadview50')!=='0';
 if(!enabled)return {enabled,loaded:0,failures:[]};
 try{const response=await fetch(new URL('./roadview50/model-meta.json?v=133',import.meta.url));if(!response.ok)throw new Error('Catalog HTTP '+response.status);catalog=await response.json();const ruleResponse=await fetch(new URL('./asset-placement-rules.json?v=133',import.meta.url));if(!ruleResponse.ok)throw new Error('Placement rules unavailable');ruleBook=await ruleResponse.json();if(Object.keys(ruleBook.assets||{}).length!==catalog.length)throw new Error('Incomplete placement rules');if(!Array.isArray(catalog)||(!catalog.length||catalog.length>200)||new Set(catalog.map(r=>r.id)).size!==catalog.length)throw new Error('Expected 1–200 unique model records');}
 catch(error){failures.push({id:'catalog',message:error.message});return{enabled,loaded:0,failures};}
 const loader=new GLTFLoader();
 await Promise.all(catalog.map(async record=>{try{if(!/^a\d{2,3}$/.test(record.id)||Number(record.id.slice(1))<1||Number(record.id.slice(1))>200||record.file!==record.id+'.glb')throw new Error('Invalid asset ID or file');const loaded=await loader.loadAsync(new URL('./roadview50/'+record.file+'?v=133',import.meta.url).href),model=flatten(loaded.scene),triangles=countTriangles(model),box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
   if(!triangles||triangles>1000||!size.toArray().every(n=>Number.isFinite(n)&&n>0))throw new Error('Invalid bounds or triangle budget');
   templates.set(record.id,{model,box,triangles,name:record.name});
  }catch(error){failures.push({id:record.id,message:error.message});}}));
 return {enabled,loaded:templates.size,failures};
}

function makeWorkshopPreview(){
 const model=new T.Group();
 const box=(x,y,z,w,h,d,color)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.92}));o.position.set(x,y,z);model.add(o)};
 box(0,.75,0,1.3,.06,.65,0x8c7255);
 for(const x of[-.56,.56])for(const z of[-.25,.25])box(x,.36,z,.055,.72,.055,0x596e6a);
 for(const [id,x,z,scale]of[['a187',-.36,.06,.75],['a188',.32,-.08,.85],['a194',.08,.18,.55]]){const entry=templates.get(id);if(!entry)return null;const o=entry.model.clone(true);o.scale.setScalar(scale);if(id==='a194')o.rotation.x=-Math.PI/2;o.updateMatrixWorld(true);const b=new T.Box3().setFromObject(o),c=b.getCenter(new T.Vector3());o.position.set(x-c.x,.78-b.min.y,z-c.z);model.add(o)}
 model.updateMatrixWorld(true);return {model,box:new T.Box3().setFromObject(model),triangles:countTriangles(model),name:'작업대 · 바이스·전동드릴·클램프',componentIds:['a187','a188','a194']};
}
// Preserve approved replacement budgets when the source library is simplified.
const replacementBudgets={"1":9212,"2":7896,"3":2068,"4":2536,"5":708,"6":568,"7":752,"8":240,"9":348,"10":484,"11":1332,"12":2032,"13":1536,"14":1316,"15":1784,"16":1076,"17":640,"18":5168,"19":5008,"20":576,"21":1300,"22":940,"23":1488,"24":564,"25":544,"26":1316,"27":480,"28":1704,"29":316,"30":536,"31":4700,"32":5540,"33":1536,"34":772,"35":316,"36":296,"37":564,"38":400,"39":2444,"40":1380,"41":320,"42":960,"43":1880,"44":2748,"45":840,"46":1232,"47":1216,"48":6760,"49":1408,"50":2068,"51":10716,"52":4888,"53":15228,"54":11124,"55":2000,"56":6856,"57":2948,"58":3196,"59":4492,"60":3112,"61":3008,"62":992,"63":1396,"64":1324,"65":2820,"66":5628,"67":1500,"68":4904,"69":3276,"70":2068,"71":2836,"72":3384,"73":3920,"74":348,"75":1128,"76":3228,"77":5600,"78":2064,"79":1264,"80":1768,"81":1264,"82":1468,"83":1828,"84":1472,"85":1560,"86":1752,"87":1724,"88":2424,"89":3576,"90":1856,"91":10176,"92":5688,"93":4740,"94":2948,"95":7400,"96":11844,"97":1284,"98":2416,"99":1288,"100":1236,"101":5076,"102":7144,"103":9676,"104":3668,"105":2484,"106":7168,"107":700,"108":1076,"109":1880,"110":5076,"111":1352,"112":680,"113":1520,"114":1316,"115":1848,"116":1384,"117":1960,"118":2240,"119":8036,"120":4164,"121":5944,"122":1520,"123":14096,"124":3856,"125":3168,"126":1744,"127":868,"128":2008,"129":888,"130":4168,"131":2484,"132":1436,"133":2256,"134":3760,"135":1452,"136":1264,"137":920,"138":2928,"139":772,"140":1140,"141":1156,"142":1288,"143":3948,"144":1248,"145":5448,"146":1180,"147":720,"148":520,"149":1696,"150":1920,"151":1736,"152":3220,"153":3260,"154":3824,"155":22320,"156":368,"157":680,"158":2184,"159":636,"160":1364,"161":2064,"162":2032,"163":1376,"164":1024,"165":552,"166":5240,"167":4320,"168":1056,"169":1876,"170":1104,"171":4160,"172":2160,"173":5140,"174":8084,"175":3732,"176":9808,"177":6492,"178":716,"179":1124,"180":1604,"181":8552,"182":8124,"183":2608,"184":2300,"185":780,"186":2136,"187":2256,"188":1208,"189":748,"190":528,"191":3360,"192":656,"193":552,"194":2008,"195":968,"196":5688,"197":864,"198":1680,"199":7012,"200":5952,"201":1040,"202":1040,"203":1988,"204":892,"205":1224,"206":1084,"207":736,"208":644,"209":1296,"210":1544,"211":1280,"212":1304};
let workshopPreview;
export function getRoadview50Template(legacyId,legacy){
 if(legacy.userData.memoAsset||legacy.userData.memoVehicle)return legacy;
 const assetId=ROADVIEW50_MAP[legacyId],entry=legacyId===189?(workshopPreview||=(makeWorkshopPreview())):templates.get(assetId);if(!enabled||!entry)return legacy;
 const originalTriangles=countTriangles(legacy);if(entry.triangles>(replacementBudgets[legacyId]??1000))return legacy;
 const oldBox=new T.Box3().setFromObject(legacy),oldSize=oldBox.getSize(new T.Vector3()),newSize=entry.box.getSize(new T.Vector3());
 // Uniform fit avoids stretched objects and never expands a validated envelope.
 const scale=legacyId===178?1:Math.min(oldSize.x/newSize.x,oldSize.y/newSize.y,oldSize.z/newSize.z,1.3);
 if(!Number.isFinite(scale)||scale<.25)return legacy;
 const obj=entry.model.clone(true),oldCenter=oldBox.getCenter(new T.Vector3()),newCenter=entry.box.getCenter(new T.Vector3());obj.scale.setScalar(scale);
 obj.position.set(oldCenter.x-newCenter.x*scale,oldBox.min.y-entry.box.min.y*scale,oldCenter.z-newCenter.z*scale);
 const wrapper=new T.Group();wrapper.name=entry.name;wrapper.add(obj);wrapper.userData.roadview50={assetId,componentIds:entry.componentIds||[assetId],legacyId,name:entry.name,originalTriangles,triangles:entry.triangles,fitScale:scale,placement:legacyId===178?'Full-size courtyard furniture; placement collision/access checks reapplied; not surveyed':'Semantic replacement inside prior collision envelope; not surveyed position'};
 wrapper.updateMatrixWorld(true);return wrapper;
}

export function roadview50Summary(placements,policy=null){
 const applied=placements.filter(p=>p.roadview50).map(p=>({...p.roadview50,position:[p.x,p.y,p.z],x:p.x,y:p.y,z:p.z,oldId:p.roadview50.legacyId,newId:p.roadview50.assetId,oldTriangles:p.roadview50.originalTriangles,newTriangles:p.roadview50.triangles,angle:p.angle,owner:p.owner,role:p.role,rule:p.ruleAudit||null}));
 return {policy,enabled,templatesLoaded:templates.size,available:catalog.length,templateMappings:ROADVIEW50_MAP,failures:[...failures],placements:applied,placedInstances:applied.length,placedTypes:[...new Set(applied.map(p=>p.assetId))],originalTriangles:applied.reduce((n,p)=>n+p.originalTriangles,0),placedTriangles:applied.reduce((n,p)=>n+p.triangles,0),comparison:'Triangles refer to replaced mesh models before legacy vegetation extraction and line rendering; use renderer statistics for whole-scene workload.'};
}

export function installRoadview50Controls({summary,camera,controls,elevation,requestRender}){
 const section=document.createElement('section');section.id='roadview50Controls';section.style.cssText='padding:12px;border:1px solid #b3c7c8;border-radius:10px;margin:12px 0;font-size:13px';
 const title=document.createElement('b');title.textContent='로드뷰 참고 · 새 저폴리 소품';section.append(title);
 const policyNote=document.createElement('p');policyNote.id='assetPolicyStatus';policyNote.textContent=summary.policy?`에셋 ${summary.policy.defined}종 배치 규칙 · 적합한 설치면·용도·여유 공간 확인`:'';section.append(policyNote);const note=document.createElement('p');note.textContent=summary.enabled?`제작 ${summary.available}종 중 ${summary.placedTypes.length}종 · ${summary.placedInstances}개 기존 소품 교체`:'기존 소품 비교 화면';section.append(note);
 const counts=document.createElement('p');counts.textContent=summary.enabled?`교체 모델 ${summary.originalTriangles.toLocaleString()} → ${summary.placedTriangles.toLocaleString()} 삼각형`:'새 소품 적용은 아래 버튼으로 돌아갈 수 있습니다.';section.append(counts);
 const select=document.createElement('select');select.id='roadview50View';select.setAttribute('aria-label','새 소품 배치 위치');select.style.width='100%';select.add(new Option('배치한 주택·골목 보기',''));
 const byOwner=new Map();for(const p of summary.placements){if(!byOwner.has(p.owner))byOwner.set(p.owner,[]);byOwner.get(p.owner).push(p);}
 const groups=[...byOwner.entries()].sort((a,b)=>b[1].length-a[1].length);
 for(const [owner,items] of groups){select.add(new Option(`${items[0].name} 외 ${items.length}개 · 건물 ${owner}`,String(owner)));}
 section.append(select);
 const recent=document.createElement('select');recent.id='roadview200View';recent.setAttribute('aria-label','최근 소품 개별 배치 보기');recent.style.cssText='width:100%;margin-top:8px';recent.add(new Option('이번 50종 · 배치된 소품 바로 보기',''));
 const recentPlacements=summary.placements.filter(p=>(p.componentIds||[p.assetId]).some(id=>Number(id.slice(1))>=151));
 for(const [i,p]of recentPlacements.entries())recent.add(new Option(`${p.name} · 건물 ${p.owner}`,String(i)));
 const reason=document.createElement('p');reason.id='placementRuleDetail';section.append(reason);recent.onchange=()=>{if(recent.value==='')return;const p=recentPlacements[Number(recent.value)];if(!p)return;reason.textContent=p.rule?`${p.rule.label} · ${p.rule.zone} · 앞 공간 ${p.rule.frontClearance.toFixed(2)}m${p.rule.profile==='shoe'?` · 현관 ${p.rule.entryDistance.toFixed(1)}m · 벽 간격 ${p.rule.wallGap.toFixed(2)}m`:''}`:'';const nx=Math.sin(p.angle),nz=Math.cos(p.angle);controls.target.set(p.x,p.y+.55,p.z);camera.position.set(p.x+nx*2.7+Math.cos(p.angle)*1.2,p.y+1.8,p.z+nz*2.7-Math.sin(p.angle)*1.2);controls.update();requestRender();};section.append(recent);
 const requested=new URLSearchParams(location.search).get('inspectAsset');const owner=new URLSearchParams(location.search).get('inspectOwner');
 if(requested){const n=recentPlacements.findIndex(p=>(p.componentIds||[p.assetId]).includes(requested)&&(!owner||String(p.owner)===owner));if(n>=0){recent.value=String(n);recent.onchange();}}

 function focus(values){const [x,y,z,angle]=values;if(values.length!==4||!values.every(Number.isFinite))return;const nx=Math.sin(angle),nz=Math.cos(angle);controls.target.set(x,y+.6,z);camera.position.set(x+nx*4+Math.cos(angle),y+2.5,z+nz*4-Math.sin(angle));controls.update();requestRender();}
 select.onchange=()=>{const items=byOwner.get(Number(select.value));if(items?.length){const p=items[0];focus([p.position[0],p.position[1],p.position[2],p.angle]);}};
 const compare=document.createElement('button');compare.id='roadview50Compare';compare.textContent=summary.enabled?'기존 소품으로 비교':'새 소품으로 돌아가기';compare.style.marginTop='10px';compare.onclick=()=>{const url=new URL(location.href);url.searchParams.set('roadview50',summary.enabled?'0':'1');url.searchParams.delete('simready');url.searchParams.set('rvCamera',[...camera.position.toArray(),...controls.target.toArray()].map(n=>n.toFixed(5)).join(','));location.href=url.href;};section.append(compare);
 const footer=document.createElement('p');footer.textContent='실제 형태를 참고한 제작물입니다. 기존 배치 공간에 맞췄으며 위치를 실측 복원한 것은 아닙니다.';section.append(footer);
 document.getElementById('environmentControls').append(section);
 const saved=new URLSearchParams(location.search).get('rvCamera')?.split(',').map(Number);if(saved?.length===6&&saved.every(Number.isFinite)){camera.position.set(...saved.slice(0,3));controls.target.set(...saved.slice(3));controls.update();requestRender();}
}
