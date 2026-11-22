import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {createRegistry} from '../outputs/domestic-test/asset-encyclopedia/registry.js';
import {designs} from '../outputs/domestic-test/sungshin-commercial/designs.js';
import {buildCommercial} from '../outputs/domestic-test/sungshin-commercial/model.js';
import {commercialCandidates,fitCommercialFrame,planCommercialCandidates,fitCommercialModel} from '../outputs/domestic-test/sungshin-commercial/placement.js';
const registry=createRegistry(JSON.parse(fs.readFileSync('outputs/domestic-test/asset-encyclopedia/catalog.json')));
assert.equal(commercialCandidates(registry).length,50);
const spec=(d,seed=1)=>({seed,points:[[-d.width/2,-d.depth/2],[d.width/2,-d.depth/2],[d.width/2,d.depth/2],[-d.width/2,d.depth/2]],frontEdge:2,levels:d.floors,top:d.floors*3,base:0,properties:{streetProfile:{grade:2,use:'mixed',manualFields:[]}},address:'검사로 '+seed});
for(const d of designs){
 const b=spec(d),before=JSON.stringify(b),candidates=planCommercialCandidates([b],registry,{elevation:()=>0,roadInfo:()=>null,places:[]});
 assert(candidates.choices[0]?.candidates.some(c=>c.key===d.id),d.id+' 후보 누락');
 const frame=fitCommercialFrame(b);assert(frame);
 const model=buildCommercial(d);const fit=fitCommercialModel(model,d,b,frame,{elevation:()=>0,roadInfo:()=>null,buildings:[b]});
 assert(fit.ok,d.id+': '+fit.reason);assert(fit.minimumDoorHeight>=1.9-1e-8);assert(fit.inferredRoofAdjustment<=.35);assert.equal(JSON.stringify(b),before,'원본 건물 변경');
 assert(model.userData.encyclopediaId==='building:'+d.id);assert(model.children.length);
 model.traverse(o=>{if(o.geometry)assert(o.geometry.attributes.position.array.every(Number.isFinite));});
 model.disposePreview();
}
const b=spec(designs[2],7),options={elevation:()=>0,roadInfo:()=>null,places:[]};
for(const edit of [s=>s.manualAssetChoice=true,s=>s.properties.streetProfile.manualFields=['era'],s=>s.properties.streetProfile.manualFields=['styleIndex'],s=>s.properties.streetProfile.assetId='home-1',s=>s.properties.streetProfile.use='residential',s=>s.facility={id:'school'},s=>s.apartment={},s=>s.holes=true]){const q=structuredClone(b);edit(q);assert.equal(planCommercialCandidates([q],registry,options).choices.length,0);}
assert.equal(planCommercialCandidates([b],registry,{...options,places:[{road_address_name:b.address}]}).choices.length,0);
assert.equal(planCommercialCandidates([b],registry,{...options,paletteEnabled:true}).choices.length,0);
assert.equal(planCommercialCandidates([b],registry,{...options,elevation:x=>x}).choices.length,0);
const missing={entries:registry.entries,resolve:id=>id==='building:sungshin-03'?null:registry.resolve(id)};assert(!commercialCandidates(missing).some(d=>d.id==='sungshin-03'));
const m=buildCommercial(designs[2]),f=fitCommercialModel(m,designs[2],b,fitCommercialFrame(b),{...options,roadInfo:()=>({}),buildings:[b]});assert(!f.ok);m.disposePreview();
console.log('50종 등록부 후보·실제 모델 변환 / 수동·주거·POI·팔레트 보존 / 경사·도로 제외 통과');

// Three raycasting retains an invisible mapped shell for walking and ordinary selection.
const proxy=new T.Mesh(new T.BoxGeometry(4,6,4),new T.MeshBasicMaterial());proxy.visible=false;proxy.updateMatrixWorld(true);assert(new T.Raycaster(new T.Vector3(0,10,0),new T.Vector3(0,-1,0)).intersectObjects([proxy],false).length);

// Rotated mapped outlines and their front/back corners are never mirrored or moved.
const rotated=spec(designs[2],72),ang=.68;
rotated.points=rotated.points.map(([x,z])=>[x*Math.cos(ang)+z*Math.sin(ang)+20,-x*Math.sin(ang)+z*Math.cos(ang)-7]);
const rotatedBefore=JSON.stringify(rotated),rr=buildCommercial(designs[2]),rf=fitCommercialModel(rr,designs[2],rotated,fitCommercialFrame(rotated),{...options,buildings:[rotated]});
assert(rf.ok);assert.deepEqual(rf.footprint,rotated.points);assert.equal(JSON.stringify(rotated),rotatedBefore);rr.disposePreview();
const disposed=buildCommercial(designs[2]),part=disposed.getObjectByName('RoofDeck'),original=part.material,next=original.clone(),letter=new T.Texture();letter.userData.sungshinLettering=true;original.map=letter;
let releases=0;original.addEventListener('dispose',()=>releases++);next.addEventListener('dispose',()=>releases++);letter.addEventListener('dispose',()=>releases++);part._originalMaterial=original;part.material=next;disposed.disposePreview();assert.equal(releases,3,'현재·원본 재질과 원본 글자 텍스처 해제');

// A saved parcel merge must not remove a source building that now owns a full model.
const {prepareSiteLayout}=await import('../outputs/domestic-test/site-layout.js');
const source=spec(designs[2],701),target=spec(designs[2],702);source.sungshinCommercial={assetId:'building:sungshin-03'};
const polygon={type:'Polygon',coordinates:[[...source.points,source.points[0]]]},mergedSpecs=[source,target],mergedMeshes=[701,702].map(id=>{const m=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());m.userData.objectid=id;return m;});
const parcel={plots:{buildings:[{id:702,plot:polygon,building:polygon,levels:2}],qa:{mergedBuildings:[{source:701,target:702}]}},piloti:{plans:[]},groundFloors:{plans:[]},frontages:{buildings:{},parapets:[]},infill:{zones:[],walls:[],gaps:[],bays:[],plants:[],drains:[],poles:[],siteDetails:{patches:[]}}};
const merged=prepareSiteLayout(parcel,mergedSpecs,mergedMeshes,()=>0);
assert.deepEqual(mergedSpecs.map(b=>b.seed),[701,702],'성신 모델 원본이 부지 병합에서 사라짐');assert.equal(merged.owners.size,0,'병합 대상이 성신 원본 영역에 다시 생성됨');assert.equal(mergedMeshes.length,2);
