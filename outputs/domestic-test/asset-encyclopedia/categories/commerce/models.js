import {loadStoredModel} from '../../model-resources.js';
import {prepareBuildingIdentity} from '../../../building-remakes/identity.js?v=replacements3';
import {prepareShopInteriors,createStorefrontLighting,buildStorefront,loadCommercialBuilding} from './generators.js';
import {previewBuilding} from './facility-preview.js';
import {previewModel} from '../house/building-preview.js';
import {assetById} from '../../../building-assets/catalog.js';
let shopData;
export {buildStorefront,prepareShopInteriors,createStorefrontLighting};
export async function createModel(a,context={}){
 if(a.kind==='building'&&a.pack==='sungshin-commercial')return loadCommercialBuilding(a.key);
 if(a.kind==='building'){await prepareBuildingIdentity();return previewModel(assetById[a.key],null,context);}
 if(a.kind==='facility'){await prepareBuildingIdentity();return previewBuilding(a.key,{neighbors:false,...context});}
 if(a.kind==='shop'){
  await Promise.all([prepareBuildingIdentity(),prepareShopInteriors()]);
  shopData??=fetch(new URL('../../../shops/library/catalog.json?v=shop50v3',import.meta.url)).then(r=>{if(!r.ok)throw Error('상가 목록을 읽지 못했습니다.');return r.json();});
  const spec=(await shopData).assets.find(s=>s.id===a.key);
  if(!spec)throw Error('상가 모델 정보가 없습니다: '+a.id);
  const root=buildStorefront(spec),rig=createStorefrontLighting(root,spec);root.updateShopTime=(hour,night)=>rig.update(hour,night);root.updateShopTime(12,0);return root;
 }
 return loadStoredModel(a);
}
