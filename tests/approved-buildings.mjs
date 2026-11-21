import assert from 'node:assert/strict';
import fs from 'node:fs';
import {approvedBuildingProfiles,approvedBuildingId,roofCoreFits} from '../outputs/domestic-test/building-remakes/models.js';
import {previewBuilding} from '../outputs/domestic-test/facilities/preview.js';
import {previewModel} from '../outputs/domestic-test/building-assets/model.js';
import {assetById} from '../outputs/domestic-test/building-assets/catalog.js';
const approvals=JSON.parse(fs.readFileSync('work/building-remakes/approval-20261121.json')).items;
const approved=approvals.filter(r=>r.status==='approved');
assert.deepEqual(Object.keys(approvedBuildingProfiles).sort(),approved.map(r=>r.assetId).sort());
assert.equal(approvedBuildingId({assetChoice:'civic',facility:{id:'police'}}),null);
const stats=[];
for(const row of approved){
 assert.equal(approvedBuildingProfiles[row.assetId].referenceId,row.approvedReferenceId);
 const [kind,id]=row.assetId.split(':');
 const model=kind==='building'?previewModel(assetById[id]):previewBuilding(id,{neighbors:false});
 let triangles=0;model.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;assert([...p.array].every(Number.isFinite),row.assetId);triangles+=(o.geometry.index?.count??p.count)/3;}});
 const detail=model.getObjectByName('KoreanFacadeDetails');assert(detail,row.assetId);
 assert(detail.userData.windowOpenings.length>0,row.assetId+' no real openings');
 assert.equal(detail.userData.recessQA.matchedWindows,detail.userData.windowOpenings.length,row.assetId+' uncut shell');
 assert.equal(detail.userData.recessQA.blockedPanes,0,row.assetId+' blocked glass');
 assert(triangles>500&&triangles<140000,row.assetId+' triangle budget');
 stats.push({id:row.assetId,triangles,windows:detail.userData.windowOpenings.length});
}
console.log(JSON.stringify(stats,null,2));

const square=[[-10,-10],[10,-10],[10,10],[-10,10]];
assert.equal(roofCoreFits(square,[],0,0,3,2.6),true);
assert.equal(roofCoreFits(square,[[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]],0,0,3,2.6),false);
assert.equal(roofCoreFits([[-10,-10],[10,-10],[10,10],[.2,10],[.2,0],[-.2,0],[-.2,10],[-10,10]],[],0,0,3,2.6),false);

// Real neighborhood placements use the new facade and its actual doorway.
const {buildStorefront}=await import('../outputs/domestic-test/shops/storefront-models.js');
const {facilityShops}=await import('../outputs/domestic-test/facilities/storefronts.js');
const {createNeighborhoodShops}=await import('../outputs/domestic-test/shops/neighborhood-shops.js');
for(const id of ['gs25','seven','emart24','starbucks']){
 const spec=structuredClone(facilityShops.find(s=>s.facilityId===id));
 const root=buildStorefront(spec,{shell:false,attachment:true});
 assert.equal(root.userData.approvedReferenceId,approvedBuildingProfiles['facility:'+id].referenceId);
 assert.equal(root.userData.approvedOpenings.length,1);
 assert(root.userData.approvedOpenings[0].w>1);
 let glass=0;root.traverse(o=>{if(o.userData.storefrontLightRole==='interior')glass++;if(o.geometry)assert([...o.geometry.attributes.position.array].every(Number.isFinite));});assert(glass>0);
 const p={spec,assetId:spec.id,placeId:id,name:id,address:'test',reference:'reference-derived-brand',position:[0,0,0],scale:[1,1,1],angle:0,n:[0,1],category:spec.category,hours:{},arterial:true};
 const shops=createNeighborhoodShops({placements:[p]},null,{elevation:()=>-.5});
 const placed=shops.group.getObjectByName('Shop-'+id);
 assert(placed?.userData.approvedReferenceId);
 const door=root.userData.approvedOpenings[0],apron=placed.getObjectByName('shop-threshold-apron').geometry.attributes.position.array;
 const xs=Array.from(apron).filter((_,i)=>i%3===0);assert(Math.abs((Math.max(...xs)+Math.min(...xs))/2-door.x)<.001,id+' doorway/apron misalignment');
}
// Existing narrow and rotated footprints, floor count and front edge remain intact.
for(const id of ['shop-tile','shop-panel']){
 const points=[[-2,-3],[3,-1],[1,4],[-4,2]],spec={points,seed:777,base:0,top:6,levels:2,floor:3,frontEdge:1,properties:{},holes:false};
 const before=JSON.stringify(spec),model=previewModel(assetById[id],[spec]);
 assert.equal(JSON.stringify(spec),before);assert.equal(model.userData.preview.frontEdge,1);assert.equal(model.userData.preview.floors,2);
 model.traverse(o=>{if(o.geometry)assert([...o.geometry.attributes.position.array].every(Number.isFinite));});
}
