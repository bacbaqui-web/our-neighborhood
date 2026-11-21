import {curation} from './curation-data.js';
export {curation};
export const isDeleted = id => curation.items[id]?.state === 'deleted';
export const canonicalId = id => curation.items[id]?.canonical || id;
export function appliedLabel(id){return ({deleted:'삭제 완료','replacement-pending':'교체 대기'})[curation.items[id]?.state] || '';}
// Resolve the model actually being placed, not its obsolete placement slot.
export function modelDeleted(object, legacyId){
 const d=object.userData;
 if(d.memoVehicle)return isDeleted('vehicle:'+d.memoVehicle);
 if(d.memoAsset)return isDeleted('representative:'+d.memoAsset);
 if(d.representative)return isDeleted('representative:'+d.representative.id);
 if(d.roadview50){const ids=d.roadview50.componentIds||[d.roadview50.assetId];return ids.every(id=>isDeleted('road:'+id));}
 return isDeleted('legacy:'+legacyId)||isDeleted('korean:'+legacyId);
}
