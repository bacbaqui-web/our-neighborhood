export const GROUPS={building:'건물',tree:'나무',car:'자동차',prop:'소품',person:'사람'};
export function assetGroup(a){
 if(a.category==='사람'||a.id.startsWith('person:'))return 'person';
 if(a.kind==='tree'||a.id.startsWith('plant:')||a.category==='나무·식물')return 'tree';
 if(a.category==='차량'||a.kind==='korean'||a.id.startsWith('vehicle:'))return 'car';
 if(['part','building','facility','shop'].includes(a.kind))return 'building';
 if(a.category==='아파트·단지')return /^(old|middle|new)-\d+$/.test(a.name)?'building':'prop';
 if(/창문|담장|외벽|문·현관|주택·출입구|주택·옥상|주택·설비|주택·조명|배관·전기/.test(a.category))return 'building';
 if(/차양|셔터|문틀|유리문|방범|보일러|실외기|도어록|도어클로저|빗물|배수관|통풍구|환기구|안테나|태양광|간판|콘센트/.test(a.name))return 'building';
 return 'prop';
}
