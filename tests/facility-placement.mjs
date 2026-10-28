import assert from 'node:assert/strict';
import {facilities,identifyPlace} from '../outputs/domestic-test/facilities/catalog.js';
import {planFacilities} from '../outputs/domestic-test/facilities/placement.js';
import {previewBuilding} from '../outputs/domestic-test/facilities/preview.js';
import {planNeighborhoodShops} from '../outputs/domestic-test/shops/neighborhood-plan.js';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../outputs/domestic-test/shops/library/catalog.json',import.meta.url)));
const b=(properties={})=>({seed:1,inkObjectId:1,points:[[-15,10],[15,10],[15,-10],[-15,-10]],top:12,base:0,levels:4,floor:3,frontEdge:0,address:'테스트로 1',properties});
const poi=(name,more={})=>({id:'test',place_name:name,x:'0',y:'0',road_address_name:'서울 테스트로 1',...more});
assert.equal(identifyPlace(poi('다이소 홈플러스점')),'daiso');assert.equal(identifyPlace(poi('삼성전자 이마트점')),null);assert.equal(identifyPlace(poi('이마트24 미아점')),'emart24');assert.equal(identifyPlace(poi('이마트에브리데이 미아점')),null);
const terrain={xz:p=>p,elevation:()=>0,roadInfo:(x,z)=>Math.abs(z)>11||Math.abs(x)>16};
let s=b();const points=JSON.stringify(s.points);assert.equal(planFacilities([s],[poi('이마트 미아점')],terrain).applied[0].id,'emart');assert.equal(JSON.stringify(s.points),points);assert.equal(s.top,12);
s=b({buld_nm_dc:'경남아너스빌아파트'});assert.equal(planFacilities([s],[poi('홈플러스')],terrain).applied[0].id,'apartment');
s=b();assert.equal(planFacilities([s],[poi('홈플러스',{road_address_name:'서울 테스트로 1 지하1층'})],terrain).applied.length,0);
s=b();assert.equal(planFacilities([s],[poi('이마트',{x:'100'})],terrain).applied.length,0);
s=b();assert.equal(planFacilities([s],[poi('다이소')],terrain).applied.length,0);assert.equal(planFacilities([s],[poi('다이소',{road_address_name:'서울 테스트로 1 1-3층'})],terrain).applied[0].id,'daiso');
for(const id of ['CU','GS25','세븐일레븐','이마트24','메가MGC커피','스타벅스','다이소','우체국']){
 s=b();const p=planNeighborhoodShops([s],[poi(id)],catalog,terrain);assert.equal(p.placements.length,1,id);assert.ok(p.placements[0].assetId.startsWith('reference-'));assert.equal(p.placements[0].reference,'reference-derived-brand');assert.ok(p.placements[0].height<=3.85);assert.ok(p.placements[0].clearance>0);
}
for(const f of facilities){const model=previewBuilding(f.id);let count=0;model.traverse(o=>{if(!o.geometry)return;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n),f.id);count+=o.geometry.attributes.position.count;});assert.ok(count>0);}
console.log('17 models finite; 8 brands fit; tenant, outside, wrong-brand and footprint guards passed');
