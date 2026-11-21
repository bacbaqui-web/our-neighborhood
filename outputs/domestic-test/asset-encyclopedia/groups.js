export const GROUPS={building:'완성 건물',part:'건물 부품',road:'도로·시설',tree:'나무',car:'자동차',prop:'소품',person:'사람'};
export function assetGroup(a){
 if(a.category==='사람'||a.id.startsWith('person:'))return 'person';
 if(a.kind==='tree'||a.id.startsWith('plant:')||a.category==='나무·식물')return 'tree';
 if(a.category==='차량'||a.kind==='korean'||a.id.startsWith('vehicle:'))return 'car';
 if(['building','facility'].includes(a.kind))return 'building';
 if(['part','shop'].includes(a.kind))return 'part';
 if(a.kind==='street'||a.category==='도로·안전'||/안전 고깔|주차 금지 표지|케이블 보호턱|소화전/.test(a.name))return 'road';
 if(a.category==='아파트·단지')return /^(old|middle|new)-\d+$/.test(a.name)?'building':'prop';
 // Movable household objects remain props, even when used on a roof.
 if(/빨래건조대|빨랫줄/.test(a.name))return 'prop';
 if(/창문|담장|외벽|문·현관|주택·출입구|주택·옥상|주택·설비|주택·조명|배관·전기/.test(a.category))return 'part';
 if(/차양|셔터|문틀|방범|보일러|실외기|도어록|도어클로저|빗물|배수관|통풍구|환기구|안테나|태양광|간판|콘센트/.test(a.name))return 'part';
 return 'prop';
}
