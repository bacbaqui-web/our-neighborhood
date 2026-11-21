import assert from 'node:assert/strict';
import {previewBuilding} from '../outputs/domestic-test/facilities/preview.js';
import {previewModel} from '../outputs/domestic-test/building-assets/model.js';
import {assetById} from '../outputs/domestic-test/building-assets/catalog.js';
import {buildStorefront} from '../outputs/domestic-test/shops/storefront-models.js';
import {facilityShops} from '../outputs/domestic-test/facilities/storefronts.js';
for(const id of ['emart','homeplus','costco','traders','police','apartment','gs25','seven','emart24','starbucks']){
 const m=previewBuilding(id,{neighbors:false}),signs=[];m.traverse(o=>{if(o.userData.brandSign)signs.push(o);});
 assert(signs.length>0,id+' source lettering absent');
 for(const s of signs){assert(s.material.map,id+' no texture');assert.equal(s.material.map.colorSpace,'srgb');assert(s.userData.noInk);assert([...s.geometry.attributes.position.array,...s.position.toArray()].every(Number.isFinite));}
}
const tile=previewModel(assetById['shop-tile']);assert(tile.children.some(o=>o.getObjectsByProperty('name','BrandSign-dongnae').length),'tile shop identity missing');
for(const id of ['gs25','seven','emart24','starbucks']){
 const spec=facilityShops.find(s=>s.facilityId===id),m=buildStorefront(spec,{shell:false,attachment:true});let n=0;m.traverse(o=>{if(o.userData.brandSign){n++;assert.equal(o.userData.storefrontLightRole,'sign');}});assert(n>0,id+' actual placement missing brand');
}
console.log('Source lettering, sRGB texture surfaces, finite attachments and actual storefront identity passed.');
