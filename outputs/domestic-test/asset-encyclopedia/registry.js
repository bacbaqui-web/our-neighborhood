import {canonicalId,isDeleted} from './curation.js?v=review527';
import {categoryMetadata,registryAliases,addedEntries} from './category-metadata.js';
import {deepFreeze,validateEntry} from './taxonomy.js';
const base=new URL('./',import.meta.url);
let pending;
export function createRegistry(raw){
 if(!Array.isArray(raw?.entries))throw Error('에셋 백과 목록 형식을 확인해 주세요.');
 const input=structuredClone(raw.entries),seen=new Set();
 for(const a of input){if(!a.id||!a.kind||seen.has(a.id))throw Error('에셋 백과에 잘못되거나 중복된 ID가 있습니다.');seen.add(a.id);}
 for(const a of addedEntries)if(!seen.has(a.id))input.push(structuredClone(a));
 const entries=[],byId=new Map();
 for(const a of input){const known=structuredClone(categoryMetadata[a.id]||{});const supplied=a.taxonomy?{taxonomy:a.taxonomy,assembly:a.assembly,ownership:a.ownership}:{};Object.assign(a,known,supplied);if(a.registryHidden)continue;Object.assign(a,a.revision||{});delete a.revision;delete a.placement;delete a.integration;if(a.taxonomy)validateEntry(a);deepFreeze(a);entries.push(a);byId.set(a.id,a);}
 const registry={entries:deepFreeze(entries),resolvePlacement(id){const road=this.resolve('road:'+id);return road?.remade?road:this.resolve('representative:'+id);},resolve(id){const a=byId.get(registryAliases[canonicalId(id)]||canonicalId(id));if(!a||isDeleted(a.id))return null;return deepFreeze({...a,url:a.file?new URL(a.file,base).href:null});}};
 return Object.freeze(registry);
}
export function loadAssetRegistry(){
 return pending??=fetch(new URL('catalog.json?v=category-ownership1',base)).then(r=>{if(!r.ok)throw Error('에셋 백과 목록을 불러오지 못했습니다.');return r.json();}).then(createRegistry).catch(error=>{pending=null;throw new Error('에셋 기준 목록을 확인해 주세요.',{cause:error});});
}
