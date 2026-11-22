// UI-only composition adapter for complete buildings and explicitly catalogued examples.
// Providers receive these functions; they never import town placement or detail orchestration.
import {createDetails} from '../details.js?v=replacements3';
export const previewAssembly={
 createDetails,
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
