// UI-only composition adapter for complete buildings and explicitly catalogued examples.
// Providers receive these functions; they never import town placement or detail orchestration.
import {createDetails} from '../details.js?v=replacements3';
export const previewAssembly={
 createDetails,
 async createShopAssembly(a){
  let result;
  if(a.pack==='convenience-local')result=await(await import('./categories/commerce/local-detail/modular-assembly.js')).assembleConvenience();
  else if(a.pack==='pharmacy-local')result=await(await import('./categories/commerce/pharmacy-local/assembly.js')).assemblePharmacy();
  else if(a.pack==='bakery-local')result=await(await import('./categories/commerce/bakery-local/assembly.js')).assembleBakery();
  else if(a.pack==='bakery-blue')result=await(await import('./categories/commerce/bakery-blue/assembly.js')).assembleBakery();
  else if(a.pack==='salon-local')result=await(await import('./categories/commerce/salon-local/assembly.js')).assembleSalon();
  else throw Error('지원하지 않는 상가 조립본: '+a.id);
  result.volume?.update(true);return result.root;
 },
 async createStreetPreview(a){return(await import('../street.js?v=ribbon2')).createStreet([],()=>0,()=>null,a.key);},
 async createPartPreview(a){
  if(a.pack==='grade1-housing-report'){const {createCaseModel}=await import('../grade1-housing-report/models.js');return createCaseModel(a.key).root;}
  const {parts}=await import('../building-parts/parts.js?v=assembly1'),p=parts.find(p=>p.id===a.key);
  if(!p)throw Error('부품 미리보기 정보가 없습니다: '+a.id);
  if(p.category==='gardens')await(await import('../perimeter-garden.js?v=garden21')).preparePerimeterGardens();
  if(p.category==='courtyards')await(await import('../road-facing-courtyard.js?v=yard22')).prepareCourtyards();
  return p.make();
 }
};
