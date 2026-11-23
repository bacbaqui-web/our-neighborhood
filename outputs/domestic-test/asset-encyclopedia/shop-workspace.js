import {shopProfiles,validateDimensions} from '../assembly-rules/shop-profiles.js';
const KEY='neighborhood-shop-workspace-v1';
export function defaultDraft(pack){const p=shopProfiles[pack];if(!p)throw Error('지원하지 않는 상가입니다.');return {dimensions:{...p.defaults},floors:[...p.floors],roads:[...p.roads],multiFloor:false,notes:'',request:'',requestState:'draft',revision:0};}
export function validateDraft(pack,d){
 if(!d||typeof d!=='object')throw Error('상가 편집 자료를 확인해 주세요.');validateDimensions(pack,d.dimensions);
 for(const [k,allowed] of [['floors',['ground','upper']],['roads',['primary','secondary','local']]])if(!Array.isArray(d[k])||!d[k].length||d[k].some(v=>!allowed.includes(v))||new Set(d[k]).size!==d[k].length)throw Error('허용 층과 도로를 하나 이상 선택해 주세요.');
 if(typeof d.multiFloor!=='boolean'||!['draft','requested','done'].includes(d.requestState))throw Error('배치·요청 상태를 확인해 주세요.');
 for(const k of ['notes','request'])if(typeof d[k]!=='string'||d[k].length>5000)throw Error('메모와 요청은 각각 5,000자 이내로 입력해 주세요.');
 return {dimensions:{...d.dimensions},floors:[...d.floors],roads:[...d.roads],multiFloor:d.multiFloor,notes:d.notes,request:d.request,requestState:d.requestState};
}
export function createShopWorkspace(storage){
 function load(){try{const raw=storage.getItem(KEY);if(!raw)return {version:1,items:{}};const s=JSON.parse(raw);if(s.version!==1||!s.items||typeof s.items!=='object'||Array.isArray(s.items))throw Error();return s;}catch{throw Error('저장한 상가 자료를 읽지 못했습니다. 브라우저 저장 권한과 백업 파일을 확인해 주세요.');}}
 return {read(id,pack){const d=load().items[id];if(!d)return defaultDraft(pack);validateDraft(pack,d);if(!Number.isSafeInteger(d.revision)||d.revision<1)throw Error('저장 기록 버전을 확인해 주세요.');return structuredClone(d);},save(id,pack,d,revision){const clean=validateDraft(pack,d),s=load(),old=s.items[id];if((old?.revision||0)!==revision)throw Error('다른 창에서 기록이 바뀌었습니다. 현재 입력을 내보낸 뒤 창을 다시 열어 주세요.');const next={...clean,revision:revision+1,updatedAt:new Date().toISOString()};s.items[id]=next;try{storage.setItem(KEY,JSON.stringify(s));}catch{throw Error('브라우저에 저장하지 못했습니다. 저장 공간·권한을 확인하거나 JSON으로 내보내 주세요.');}return next;}};
}

export function galleryFilters(filters,gallery){return filters.domain==='commerce'&&gallery?{...filters,role:'',era:'',color:'',material:''}:filters;}
