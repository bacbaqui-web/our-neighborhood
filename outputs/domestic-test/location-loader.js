import {savedSceneOptions} from './saved-scene-options.js';
import {currentScene} from './browser-generation/policy.js';
import {chooseMapPoint} from './map-picker.js?v=compact1';
import {browserContext,listScenes} from './browser-generation/storage.js';
import {createNeighborhood} from './browser-generation/progress.js?v=unified11';
import {AUTO_VIEW_RADIUS} from './map-picker.js?v=compact1';
const original={id:'original',address:'서울 강북구 솔매로17가길 7',origin:[37.626469,127.015677],sizeMetres:300,roadAddress:{road_name:'솔매로17가길',main_building_no:'7',sub_building_no:''}};
const key='neighborhood-last-location-v74';
const deployment=fetch(new URL('./deployment.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('배포 설정을 불러오지 못했습니다.');return r.json();});
const api=new URL('../api/neighborhoods',import.meta.url);
const savedLocations=deployment.then(async config=>{
 const url=config.mode==='local'?api:new URL('./locations.json',import.meta.url);
 const response=await fetch(url,{cache:'no-cache'});
 if(!response.ok)throw Error('저장된 동네 목록을 불러오지 못했습니다.');
 return [original,...await response.json(),...await listScenes().catch(()=>[])];
});
// The UI reports failures when needed; do not emit an unhandled rejection at startup.
savedLocations.catch(()=>{});
function requireVisibleScene(scene){
 if(currentScene(scene))return scene;
 const target=new URL('./start.html',import.meta.url);
 target.searchParams.set('query',scene.address||'');
 target.searchParams.set('selectPoint','1');
 location.replace(target.href);
 return new Promise(()=>{});
}
export async function readLocation(){
 const requested=new URLSearchParams(location.search).get('location');
 // Every entry, including old bookmarks, must satisfy the visible360 contract.
 let id=requested;try{if(!id)id=localStorage.getItem(key);}catch{}
 if(!id||id==='original')return requireVisibleScene(original);
 if(!/^[a-f0-9]{16}$/.test(id))throw Error('지역 주소가 올바르지 않습니다. 주소를 다시 입력해 주세요.');
 const local=await browserContext(id);if(local)return requireVisibleScene(local);
 const base=new URL(`../generated-neighborhoods/${id}/data/`,import.meta.url).href,r=await fetch(base+'manifest.json',{cache:'no-cache'});
 if(!r.ok)throw Error('저장된 지역을 찾지 못했습니다. 주소를 다시 입력해 주세요.');
 const m=await r.json();if(m.id!==id||!Array.isArray(m.origin)||m.origin.length!==2||!m.origin.every(Number.isFinite))throw Error('지역 정보가 올바르지 않습니다.');
 return requireVisibleScene({...m,base});
}
export function dataUrl(context,name){const file=name.split('?')[0].replace(/^\.\//,'');if(context.browserFiles){const path=(context.arterial?.overrides?.includes(file)?'arterial/':'')+file;if(!context.browserFiles[path])throw Error('저장된 동네 파일이 없습니다: '+file);return context.browserFiles[path];}return context.base?context.base+(context.arterial?.overrides.includes(file)?'arterial/':'')+file:name;}
export function rememberLocation(context){try{localStorage.setItem(key,context.id);}catch{}}
export function setupLocationSearch(context,getHour){
 const input=document.getElementById('address'),button=document.getElementById('findAddress'),status=document.getElementById('status'),form=document.getElementById('addressForm');
 input.disabled=button.disabled=false;if(context.address)input.value=context.address;
 let busy=false,rows=[];
 function visit(id){const url=new URL(location.href);url.search='';url.searchParams.set('location',id);url.searchParams.set('hour',getHour());location.assign(url.href);}
 savedLocations.then(saved=>{
  rows=savedSceneOptions(saved.filter(currentScene));
  for(const row of rows){const option=document.createElement('option');option.value=row.value;option.label='저장된 동네';document.getElementById('addresses').append(option);}
 }).catch(error=>{status.textContent=error.message;});
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;
  const address=input.value.trim();
  const saved=rows.find(row=>row.value===address);
  if(saved){visit(saved.id);return;}
  busy=true;button.disabled=true;input.readOnly=true;form.setAttribute('aria-busy','true');
  try{
   const point=await chooseMapPoint({query:address,origin:context.origin,radius:AUTO_VIEW_RADIUS});
   if(!point)return;
   const result=await createNeighborhood(point);visit(result.id);
  }catch(error){status.textContent=error.name==='AbortError'?'동네 만들기를 취소했습니다.':'동네를 만들지 못했습니다. '+error.message;}
  finally{busy=false;input.readOnly=false;button.disabled=false;form.removeAttribute('aria-busy');}
 };
}
