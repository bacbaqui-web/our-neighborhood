import {applyRemakes,remakeAliases} from './remakes.js?v=replacements3';
import {canonicalId,isDeleted} from './curation.js?v=review527';
const base=new URL('./',import.meta.url);
let pending;
export function createRegistry(raw){
 if(!Array.isArray(raw?.entries))throw Error('에셋 백과 목록 형식을 확인해 주세요.');
 const entries=applyRemakes(raw.entries),byId=new Map();
 for(const a of entries){if(!a.id||!a.kind||byId.has(a.id))throw Error('에셋 백과에 잘못되거나 중복된 ID가 있습니다.');byId.set(a.id,a);}
 return {entries,resolvePlacement(id){const road=this.resolve('road:'+id);return road?.remade?road:this.resolve('representative:'+id);},resolve(id){const a=byId.get(remakeAliases.get(canonicalId(id))||canonicalId(id));if(!a||isDeleted(a.id))return null;return {...a,url:a.file?new URL(a.file,base).href:null};}};
}
export function loadAssetRegistry(){
 return pending??=fetch(new URL('catalog.json?v=comicbatch1',base)).then(r=>{if(!r.ok)throw Error('에셋 백과 목록을 불러오지 못했습니다.');return r.json();}).then(createRegistry).catch(error=>{pending=null;throw new Error('에셋 기준 목록을 확인해 주세요.',{cause:error});});
}
