import {loadAssetRegistry} from './asset-encyclopedia/registry.js';
import {isDeleted,modelDeleted} from './asset-encyclopedia/curation.js';
import * as T from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {flatten} from './roadview50-loader.js?v=151';
import {refineGroup} from './refine-assets.js?v=151';
let manifest={mapping:{},assets:{}},enabled=true;
const templates=new Map(),nativeCache=new Map(),applications=[],failures=[];
export async function loadRepresentatives(){
 enabled=true;
 if(!enabled)return;
 const response=await fetch('./representatives/manifest.json?v=133');
 if(!response.ok)throw new Error('대표 에셋 목록을 불러오지 못했습니다');
 manifest=await response.json();const registry=await loadAssetRegistry(),loader=new GLTFLoader();
 await Promise.all(Object.values(manifest.assets).filter(a=>a.file).map(async a=>{
  const selected=registry.resolvePlacement(a.id);
  if(!selected)return;
  if(!selected.url)throw Error('에셋 파일이 없습니다: '+selected.id);
  const loaded=await loader.loadAsync(selected.url);a.catalogId=selected.id;a.catalogFile=selected.file;
  if(selected.remade){a.memoBaked=true;a.preserveGeometry=true;}
  const model=flatten(loaded.scene);if(!a.memoBaked)refineGroup(model,a,{preserveGeometry:a.preserveGeometry});
  model.updateMatrixWorld(true);templates.set(a.id,model);
 }));
}
function stripLines(group){const lines=[];group.traverse(o=>{if(o.isLineSegments)lines.push(o)});for(const o of lines)o.removeFromParent();}
function localCopy(object){const copy=object.clone(true);copy.position.set(0,0,0);copy.quaternion.identity();copy.scale.set(1,1,1);copy.updateMatrix();copy.matrixAutoUpdate=true;stripLines(copy);copy.updateMatrixWorld(true);return copy;}
const count=g=>{let n=0;g.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});return n;};
// Called only after all placement, contact, clearance and collision decisions.
// The placement object's matrix and its collision/inspection records never change.
export function representativeDeleted(object,legacyId){
 const d=object.userData;
 if(!enabled||d.memoAsset||d.memoVehicle||d.representative)return modelDeleted(object,legacyId);
 const source=typeof legacyId==='number'?'legacy-'+legacyId:legacyId,semantic=manifest.mapping[source],info=d.roadview50;
 const target=semantic&&semantic!==source?semantic:(info?.componentIds?.length>1?source:(manifest.mapping[info?.assetId]||info?.assetId||source));
 return templates.has(target)?isDeleted('representative:'+target):modelDeleted(object,legacyId);
}
export function applyRepresentative(object,legacyId){
 if(representativeDeleted(object,legacyId)){object.clear();object.userData.reviewDeleted=true;return true;}
 if(!enabled||object.userData.representative||object.userData.memoAsset||object.userData.memoVehicle)return;
 const source=typeof legacyId==='number'?'legacy-'+legacyId:legacyId,semantic=manifest.mapping[source],info=object.userData.roadview50;
 let target=semantic&&semantic!==source?semantic:(info?.componentIds?.length>1?source:(manifest.mapping[info?.assetId]||info?.assetId||source));
 // Tree/vehicle image variants keep their existing dedicated rendering pipeline.
 if(manifest.retired?.includes(source)||manifest.retired?.includes(info?.assetId)||manifest.retired?.includes(target)){object.clear();return true;}
 if(templates.has(target)&&isDeleted('representative:'+target)){object.clear();object.userData.reviewDeleted=true;return true;}
 const asset=manifest.assets[target]||{id:target,name:object.name};
 const old=localCopy(object),box=new T.Box3().setFromObject(old),oldSize=box.getSize(new T.Vector3());
 const before=count(old);let replacement;
 if(templates.has(target))replacement=templates.get(target).clone(true);
 else {
  const key=source+':'+(info?.assetId||'native');
  if(!nativeCache.has(key)){old.traverse(o=>{if(o.isMesh)o.userData.representativeOriginalGeometryType=o.geometry.type;});refineGroup(old,{id:source,name:object.name});nativeCache.set(key,old)}
  replacement=nativeCache.get(key).clone(true);target=source;
 }
 replacement.updateMatrixWorld(true);const rb=new T.Box3().setFromObject(replacement),sz=rb.getSize(new T.Vector3());
 const scale=Math.min(...['x','y','z'].map(k=>sz[k]>1e-8?oldSize[k]/sz[k]:Infinity));
 if(!Number.isFinite(scale)||scale<=0){failures.push({source,target,reason:'invalid bounds'});return;}
 const center=box.getCenter(new T.Vector3()),rc=rb.getCenter(new T.Vector3());
 replacement.scale.multiplyScalar(scale);replacement.position.add(new T.Vector3(center.x-rc.x*scale,box.min.y-rb.min.y*scale,center.z-rc.z*scale));
 const matrix=object.matrix.toArray();const audit={source,target,name:asset.name,before,after:count(replacement),scale,position:object.position.toArray(),rotation:object.quaternion.toArray(),matrix,refinement:replacement.userData.refinement};
 object.clear();object.add(replacement);object.userData.representative={id:target,name:asset.name};
 // Keep the legacy foliage extraction semantics, including part tags on GLB leaves.
 if(templates.has(target))object.userData.roadview50={...info,assetId:target};
 object.updateMatrixWorld(true);applications.push(audit);return true;
}
export function representativeAudit(){return {enabled,review:manifest.review,loaded:templates.size,count:applications.length,replaced:applications.filter(a=>a.source!==a.target).length,types:[...new Set(applications.map(a=>a.target))],before:applications.reduce((n,a)=>n+a.before,0),after:applications.reduce((n,a)=>n+a.after,0),failures,applications};}
export function installRepresentativeControls(camera,controls,requestRender){
 const section=document.createElement('section');section.style.cssText='padding:12px;border:1px solid #b3c7c8;border-radius:10px;margin:12px 0;font-size:13px';
 const title=document.createElement('b');title.textContent='에셋 백과 · 배치 확인';section.append(title);
 const info=document.createElement('p');info.textContent=enabled?`${applications.length}개 적용 · 기존 배치 유지`:'이전 모델 비교 중';section.append(info);if(manifest.review){const note=document.createElement('p');note.textContent='메모 반영: 재제작 52종 · 삭제 12종';section.append(note);}
 const select=document.createElement('select');select.setAttribute('aria-label','대표 에셋 위치');select.add(new Option('다듬은 에셋 가까이 보기',''));
 const seen=new Set();applications.forEach((a,i)=>{if(seen.has(a.target))return;seen.add(a.target);select.add(new Option(a.name,String(i)))});
 select.onchange=()=>{if(select.value==='')return;const a=applications[+select.value],p=new T.Vector3(...a.position);controls.target.copy(p).add(new T.Vector3(0,.5,0));camera.position.copy(p).add(new T.Vector3(3,2.2,3));controls.update();requestRender();};section.append(select);
 document.getElementById('environmentControls').append(section);
}
