const encode=value=>new TextEncoder().encode(JSON.stringify(value));
export function sceneJSON(scene,name){
 const bytes=scene.files[name];
 if(!bytes)throw Error('저장된 동네에 '+name+' 자료가 없습니다.');
 return JSON.parse(new TextDecoder().decode(bytes));
}
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
export async function sceneDigest(scene){
 const rows=[];
 for(const name of Object.keys(scene.files).sort())rows.push([name,await digest(scene.files[name])]);
 return digest(encode({manifest:scene.manifest,files:rows}));
}
export async function makeReviewCopy(source,id){
 if(!/^[a-f0-9]{16}$/.test(id)||id===source?.manifest?.id)throw Error('원본과 다른 사본 번호가 필요합니다.');
 // Match the existing editor's legacy-snapshot reconstruction. Keep every
 // original file untouched; only the separate copy gains this input record.
 const input=source.files['generation-input.json']?sceneJSON(source,'generation-input.json'):{
  center:source.manifest.origin,radius:source.manifest.detailRadius||source.manifest.sizeMetres/2,
  address:source.manifest.address,view:source.manifest.view,
  buildingCollection:sceneJSON(source,source.files['visibility-source.json']?'visibility-source.json':'buildings-source.geojson'),
  sourceRoads:sceneJSON(source,'roads-source.json').roads,
  places:sceneJSON(source,'shops/places.json').places||[],stations:[],exits:[]
 };
 if(!input.buildingCollection?.features||source.manifest.view?.mode!=='visible360')throw Error('길 위 360도 생성 원본이 있는 동네를 선택해 주세요.');
 const copy=structuredClone(source),sourceDigest=await sceneDigest(source);
 copy.id=id;copy.manifest.id=id;
 copy.manifest.address='검사 사본 · '+source.manifest.address;
 copy.manifest.generatedAt=new Date().toISOString();
 copy.manifest.reviewCopy={sourceId:source.manifest.id,sourceDigest};
 input.sceneId=id;input.address=copy.manifest.address;
 copy.files['generation-input.json']=encode(input);
 if(copy.files['manifest.json'])copy.files['manifest.json']=encode(copy.manifest);
 return copy;
}
