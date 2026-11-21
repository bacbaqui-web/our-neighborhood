export const categories=[{id:'residential',name:'일반주거시설'},{id:'neighborhood',name:'근린생활시설'},{id:'apartment',name:'공동주택'},{id:'public',name:'공공·교육시설'}];
export const assets=[
 ...['적벽돌 다세대','짙은 벽돌 주택','밝은 벽돌 빌라','회색 석재 빌라','크림 타일 주택','미장 단독주택'].map((name,styleIndex)=>({id:'home-'+styleIndex,name,category:'residential',styleIndex})),
 {id:'shop-glass',name:'유리 전면 상가',category:'neighborhood',facilityId:'daiso'},
 {id:'shop-tile',name:'타일 외벽 상가',category:'neighborhood',facilityId:'post'},
 {id:'shop-panel',name:'패널 외벽 상가',category:'neighborhood',facilityId:'emart'},
 ...['old','middle','new'].map((era,i)=>({id:'apartment-'+era,name:['구축 아파트','중간 시대 아파트','신식 아파트'][i],category:'apartment',facilityId:'apartment',era})),
 {id:'school',name:'학교',category:'public',facilityId:'school'},
 {id:'civic',name:'공공청사',category:'public',facilityId:'police'},
 {id:'fire',name:'소방서',category:'public',facilityId:'fire'}
];
export const assetById=Object.fromEntries(assets.map(a=>[a.id,a]));
export function inferCategory(p){const code=String(p.bdtyp_cd||''),name=String(p.building_name||p.buld_nm_dc||'');if(code.startsWith('02')||/아파트/.test(name))return 'apartment';if(/학교|경찰|소방|청사|우체국/.test(name))return 'public';if(/^(03|04|05|07)/.test(code)||/상가|상업/.test(name))return 'neighborhood';return 'residential';}
const PREFS='neighborhood-building-palette-v1',EDITS='neighborhood-building-edits-v1';
function read(key,storage=localStorage){const raw=storage.getItem(key);if(!raw)return null;let v;try{v=JSON.parse(raw);}catch{throw Error('저장된 건물 설정을 읽지 못했습니다. 에셋 설정에서 초기화해 주세요.');}if(!v||v.version!==1||typeof v!=='object')throw Error('건물 설정 형식이 맞지 않습니다. 에셋 설정에서 초기화해 주세요.');return v;}
export function defaultPalette(){return Object.fromEntries(categories.map(c=>[c.id,assets.filter(a=>a.category===c.id).map(a=>a.id)]));}
export function readPalette(storage=localStorage){const v=read(PREFS,storage);if(!v)return {enabled:false,groups:defaultPalette()};validatePalette(v.groups);return {enabled:true,groups:v.groups};}
export function validatePalette(groups){for(const c of categories){const list=groups?.[c.id];if(!Array.isArray(list)||!list.length||list.some(id=>assetById[id]?.category!==c.id))throw Error(c.name+'에서 사용할 모델을 하나 이상 선택해 주세요.');}return groups;}
export function savePalette(groups,storage=localStorage){validatePalette(groups);storage.setItem(PREFS,JSON.stringify({version:1,groups}));}
export function resetPalette(storage=localStorage){storage.removeItem(PREFS);}
export function readEdits(storage=localStorage){const v=read(EDITS,storage);if(!v)return {};if(!v.items||typeof v.items!=='object'||Array.isArray(v.items)||Object.values(v.items).some(id=>!assetById[id]))throw Error('저장된 건물 모델이 목록과 맞지 않습니다. 건물 설정을 확인해 주세요.');return v.items;}
export function setBuildingAsset(owner,assetId,storage=localStorage){if(!/^\d+$/.test(String(owner))||assetId!==null&&!assetById[assetId])throw Error('건물이나 모델 선택이 올바르지 않습니다.');const items=readEdits(storage);if(assetId===null)delete items[String(owner)];else items[String(owner)]=assetId;storage.setItem(EDITS,JSON.stringify({version:1,items}));}
export function chooseBuildingAsset(properties,palette,edits){const owner=String(properties.objectid);if(assetById[properties.streetProfile?.assetId])return assetById[properties.streetProfile.assetId];if(edits[owner]&&!properties.streetProfile?.resetLegacyAsset)return assetById[edits[owner]];if(properties.streetProfile){const preferred='home-'+properties.streetProfile.styleIndex;const ids=palette.enabled?palette.groups[inferCategory(properties)]:null;return assetById[!ids||ids.includes(preferred)?preferred:ids[Math.abs(Number(owner)||0)%ids.length]];}if(!palette.enabled)return null;const ids=palette.groups[inferCategory(properties)];return assetById[ids[Math.abs(Number(owner)||0)%ids.length]];}
